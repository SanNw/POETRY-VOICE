/* ╔═══════════════════════════════════════════════════════════════╗
   ║  POETRY VOICE · APP                                           ║
   ║  Wiring: routing · TTS orchestration · session state          ║
   ╚═══════════════════════════════════════════════════════════════╝ */

function App() {
  /* ── persisted state ──────────────────────────────────────── */
  const [lang, setLangRaw] = usePersisted("pv.lang", "pt");
  const [dark, setDark] = usePersisted("pv.dark", false);
  const [favs, setFavs] = usePersisted("pv.favs", {});
  const [sessions, setSessions] = usePersisted("pv.sessions", {});
  const [voiceGender, setVoiceGender] = usePersisted("pv.voiceGender", "female");
  const [speed, setSpeed] = usePersisted("pv.speed", 1.0);
  const [shadowPauseMs, setShadowPauseMs] = usePersisted("pv.shadowPauseMs", 5000);
  const [memoHide, setMemoHide] = usePersisted("pv.memoHide", 2);
  const [activePoemId, setActivePoemId] = usePersisted("pv.activePoem", null);
  const [mode, setMode] = usePersisted("pv.mode", "listen");
  const [customRaw, setCustomRaw] = usePersisted("pv.customPoems", []);

  /* When user picks a language tab, also drop the active poem
     so the library for that language shows immediately.       */
  const setLang = useCallback((newLang) => {
    setLangRaw(newLang);
    setActivePoemId(null);
  }, [setLangRaw, setActivePoemId]);

  /* ── runtime state ────────────────────────────────────────── */
  const [memoRevealed, setMemoRevealed] = useState(new Set());
  const [glossPop, setGlossPop] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const { byLang, ready: voicesReady } = useVoices();
  const tts = useTTS();
  const sr = useSpeechRecognition();
  const [recAccuracy, setRecAccuracy] = useState(null);
  const [recStatus, setRecStatus] = useState(null);

  /* ── theme ────────────────────────────────────────────────── */
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.style.transition = "background 600ms ease, color 600ms ease";
  }, [dark]);

  /* ── merge custom + built-in poems ────────────────────────── */
  const customProcessed = useMemo(
    () => (customRaw || []).map(p => processPoem(p)),
    [customRaw]
  );
  const allPoems = useMemo(
    () => [...customProcessed, ...PROCESSED_POEMS],
    [customProcessed]
  );

  /* ── filter poems by lang ─────────────────────────────────── */
  const langPoems = useMemo(() => allPoems.filter(p => p.lang === lang), [lang, allPoems]);
  const activePoem = useMemo(
    () => activePoemId ? allPoems.find(p => p.id === activePoemId) : null,
    [activePoemId, allPoems]
  );

  /* If active poem doesn't match current lang, switch to its lang.
     (Only relevant on first load when both are restored from storage.) */
  useEffect(() => {
    if (activePoem && activePoem.lang !== lang) {
      setLangRaw(activePoem.lang);
    }
  }, [activePoem, lang, setLangRaw]);

  /* ── save / delete custom poems ───────────────────────────── */
  const handleSavePoem = useCallback((poem) => {
    setCustomRaw(list => {
      const idx = (list || []).findIndex(p => p.id === poem.id);
      const raw = {
        id: poem.id, lang: poem.lang, locale: poem.locale,
        author: poem.author, year: poem.year, era: poem.era,
        title: poem.title, subtitle: poem.subtitle, blurb: poem.blurb,
        stanzas: poem.stanzas,
        pronunciation: poem.pronunciation || [],
        glossary: poem.glossary || {},
        custom: true,
        _raw: poem._raw,
      };
      if (idx >= 0) {
        const next = [...list];
        next[idx] = raw;
        return next;
      }
      return [raw, ...(list || [])];
    });
    setShowAddModal(false);
    setLangRaw(poem.lang);
    setActivePoemId(poem.id);
  }, [setCustomRaw, setLangRaw, setActivePoemId]);

  const handleDeletePoem = useCallback((id) => {
    setCustomRaw(list => (list || []).filter(p => p.id !== id));
    if (activePoemId === id) setActivePoemId(null);
  }, [setCustomRaw, activePoemId, setActivePoemId]);

  /* ── current voice ────────────────────────────────────────── */
  const langVoices = byLang[lang] || { male: [], female: [], all: [] };
  const currentVoice = useMemo(() => {
    const list = voiceGender === "male" ? langVoices.male : langVoices.female;
    return (list && list[0]) || langVoices.all[0] || null;
  }, [voiceGender, langVoices]);
  const noVoiceAvailable = voicesReady && !currentVoice;

  /* ── speak orchestrators ──────────────────────────────────── */
  const doSpeak = useCallback((opts = {}) => {
    if (!activePoem) return;
    const pitch = voiceGender === "male" ? 0.9 : 1.1;
    const rate = mode === "karaoke" ? 0.6 : speed;
    const lineGapMs = mode === "shadow" ? shadowPauseMs : 0;
    const lines = opts.lines || activePoem._lines;
    // Pass both the resolved voice (if any) AND the poem's locale as a
    // fallback. When currentVoice is null, the browser still attempts to
    // speak using its default voice for that locale — this unblocks
    // languages where our gender/name heuristic fails to resolve a voice
    // but a system voice for the locale does exist.
    tts.speakLines(
      lines,
      { voice: currentVoice, lang: activePoem.locale, rate, pitch },
      { lineGapMs }
    );
  }, [activePoem, currentVoice, voiceGender, speed, mode, shadowPauseMs, tts]);

  const handlePlay = useCallback(() => {
    if (!activePoem) return;
    doSpeak();
    // bump session count
    setSessions(s => ({ ...s, [activePoem.id]: (s[activePoem.id] || 0) + 1 }));
  }, [activePoem, doSpeak, setSessions]);

  const handleRepeatStanza = useCallback(() => {
    if (!activePoem || tts.currentLineIdx < 0) return;
    const curStanza = activePoem._lines[tts.currentLineIdx]?.stanzaIdx;
    if (curStanza == null) return;
    const stanzaLines = activePoem._lines.filter(l => l.stanzaIdx === curStanza);
    doSpeak({ lines: stanzaLines });
  }, [activePoem, tts.currentLineIdx, doSpeak]);

  /* Stop TTS on poem change or mode change */
  useEffect(() => { tts.stop(); setMemoRevealed(new Set()); setRecAccuracy(null); setRecStatus(null); /* eslint-disable-next-line */ }, [activePoemId]);
  useEffect(() => { tts.stop(); /* eslint-disable-next-line */ }, [mode]);

  /* ── word click handler (glossary + memo reveal) ──────────── */
  const handleWordClick = useCallback((ev, word, lineIdx) => {
    ev.stopPropagation();
    if (!activePoem) return;
    if (mode === "memo") {
      setMemoRevealed(prev => {
        const next = new Set(prev);
        next.add(lineIdx);
        return next;
      });
      return;
    }
    // glossary lookup by various keys
    const g = activePoem.glossary;
    const candidates = [
      word.raw,
      word.raw.replace(/[^\p{L}\p{N}'’-]/gu, ""),
      word.clean,
    ];
    let entry = null;
    let key = null;
    for (const c of candidates) {
      if (g[c]) { entry = g[c]; key = c; break; }
    }
    if (!entry) return;
    setGlossPop({ word: key, entry, anchor: ev.currentTarget });
  }, [activePoem, mode]);

  // Close glossary on outside click / scroll / esc
  useEffect(() => {
    if (!glossPop) return;
    const close = () => setGlossPop(null);
    const onKey = (e) => { if (e.key === "Escape") setGlossPop(null); };
    document.addEventListener("click", close);
    document.addEventListener("scroll", close, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("click", close);
      document.removeEventListener("scroll", close, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [glossPop]);

  /* ── speech recognition ───────────────────────────────────── */
  const handleStartRec = useCallback(() => {
    setRecAccuracy(null);
    setRecStatus(null);
    sr.start(activePoem?.locale || (LANG_MATCHES[lang]?.[0] || "en-US"));
  }, [activePoem, lang, sr]);

  const handleStopRec = useCallback(() => {
    sr.stop();
    // Compute comparison
    if (activePoem) {
      const allWords = activePoem._flatWords;
      const result = compareTranscript(allWords, sr.finalText + " " + sr.interim);
      setRecStatus(result.status);
      setRecAccuracy(result.accuracy);
    }
  }, [activePoem, sr]);

  const handleResetRec = useCallback(() => {
    setRecAccuracy(null);
    setRecStatus(null);
  }, []);

  /* ── progress ─────────────────────────────────────────────── */
  const totalLines = activePoem?._lines.length || 1;
  const progress = Math.max(0, tts.currentLineIdx + 1) / totalLines;

  /* ── total sessions ───────────────────────────────────────── */
  const totalSessions = useMemo(() => Object.values(sessions).reduce((a, b) => a + b, 0), [sessions]);

  /* ─────────────────────────────────────────────────────────── */
  /*   RENDER                                                    */
  /* ─────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen">
      <Header lang={lang} setLang={setLang} dark={dark} setDark={setDark} totalSessions={totalSessions} />

      {!activePoem ? (
        <LibraryScreen
          lang={lang}
          poems={langPoems}
          openPoem={(id) => setActivePoemId(id)}
          favs={favs}
          toggleFav={(id) => setFavs(f => ({ ...f, [id]: !f[id] }))}
          deletePoem={handleDeletePoem}
          sessions={sessions}
          onAddClick={() => setShowAddModal(true)}
        />
      ) : (
        <PoemScreen
          poem={activePoem}
          onBack={() => { tts.stop(); setActivePoemId(null); }}
          tts={tts}
          progress={progress}
          mode={mode} setMode={setMode}
          voiceGender={voiceGender} setVoiceGender={setVoiceGender}
          speed={speed} setSpeed={setSpeed}
          shadowPauseMs={shadowPauseMs} setShadowPauseMs={setShadowPauseMs}
          memoHide={memoHide} setMemoHide={setMemoHide}
          memoRevealed={memoRevealed}
          onPlay={handlePlay}
          onPause={tts.pause}
          onResume={tts.resume}
          onStop={tts.stop}
          onRepeat={handleRepeatStanza}
          onWordClick={handleWordClick}
          recStatus={recStatus}
          recAccuracy={recAccuracy}
          srSupported={sr.supported}
          srListening={sr.isListening}
          srFinal={sr.finalText}
          srInterim={sr.interim}
          onStartRec={handleStartRec}
          onStopRec={handleStopRec}
          onResetRec={handleResetRec}
          voiceName={currentVoice?.name}
          noVoiceAvailable={noVoiceAvailable}
          favs={favs}
          toggleFav={(id) => setFavs(f => ({ ...f, [id]: !f[id] }))}
          sessions={sessions}
        />
      )}

      {glossPop && (
        <GlossaryPopover
          entry={glossPop.entry}
          word={glossPop.word}
          lang={lang}
          anchor={glossPop.anchor}
          onClose={() => setGlossPop(null)}
        />
      )}

      {showAddModal && (
        <AddPoemModal
          onClose={() => setShowAddModal(false)}
          onSave={handleSavePoem}
        />
      )}

      <footer className="max-w-6xl mx-auto px-6 md:px-10 py-8 mt-12 border-t" style={{ borderColor: 'rgba(184,146,42,0.3)' }}>
        <div className="ornament-rule">
          <span>❧  · ✦ ·  ❧</span>
        </div>
        <div className="text-center mt-4 text-[0.72rem] smallcaps" style={{ color: 'var(--ink-soft)' }}>
          Poemas em domínio público · scriptorium digital · {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
}

/* ─── PoemScreen ──────────────────────────────────────────────── */
function PoemScreen(props) {
  const {
    poem, onBack, tts, progress,
    mode, setMode,
    voiceGender, setVoiceGender,
    speed, setSpeed,
    shadowPauseMs, setShadowPauseMs,
    memoHide, setMemoHide,
    memoRevealed,
    onPlay, onPause, onResume, onStop, onRepeat,
    onWordClick,
    recStatus, recAccuracy,
    srSupported, srListening, srFinal, srInterim,
    onStartRec, onStopRec, onResetRec,
    voiceName, noVoiceAvailable,
    favs, toggleFav, sessions,
  } = props;

  return (
    <div data-screen-label={`02 Poem · ${poem.title}`}>
      {/* Progress bar at top */}
      <div className="progress sticky top-0 z-20">
        <i style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>

      <div className="max-w-6xl mx-auto px-6 md:px-10 py-8">
        {/* Top bar */}
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <button onClick={onBack} className="theme-toggle" style={{ color: 'var(--ink-soft)' }}>
            ← &nbsp;<span className="smallcaps">{UI.back}</span>
          </button>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="tag gold">{LANG_LABELS[poem.lang].glyph} · {poem.locale}</span>
            <span className="tag">{ERAS[poem.era] || ""}</span>
            <span className="tag">{poem.year}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-10">
          {/* Main column */}
          <div>
            <div className="mb-2 rubric text-[0.78rem]">❧ {poem.author.toUpperCase()}</div>
            <h2 className="font-display text-[1.8rem] md:text-[2.2rem] font-semibold leading-tight mb-1" style={{ color: 'var(--ink)' }}>
              {poem.title}
            </h2>
            <div className="font-poem italic text-[1.1rem] mb-6" style={{ color: 'var(--ink-soft)' }}>
              {poem.subtitle}
            </div>

            <div className="sep" />

            <div className="my-8">
              <PoemViewer
                poem={poem}
                currentLineIdx={tts.currentLineIdx}
                currentWordIdx={tts.currentWordIdx}
                recognizedStatus={recStatus}
                memoMode={mode === "memo"}
                memoHiddenCount={memoHide}
                memoRevealed={memoRevealed}
                onWordClick={onWordClick}
              />
            </div>

            <div className="sep" />

            <div className="text-[0.78rem] smallcaps" style={{ color: 'var(--ink-soft)' }}>
              ❧ {UI.glossaryHint}
            </div>

            <div className="mt-8">
              <AudioControls
                isSpeaking={tts.isSpeaking}
                isPaused={tts.isPaused}
                voiceGender={voiceGender} setVoiceGender={setVoiceGender}
                speed={speed} setSpeed={setSpeed}
                onPlay={onPlay}
                onPause={onPause}
                onResume={onResume}
                onStop={onStop}
                onRepeat={onRepeat}
                mode={mode} setMode={setMode}
                shadowPauseMs={shadowPauseMs} setShadowPauseMs={setShadowPauseMs}
                memoHide={memoHide} setMemoHide={setMemoHide}
                voiceName={voiceName}
                noVoiceAvailable={noVoiceAvailable}
              />
            </div>

            <div className="mt-6">
              <RecordingPanel
                supported={srSupported}
                isListening={srListening}
                finalText={srFinal}
                interim={srInterim}
                accuracy={recAccuracy}
                onStart={onStartRec}
                onStop={onStopRec}
                onReset={onResetRec}
              />
            </div>
          </div>

          {/* Sidebar */}
          <aside className="space-y-6">
            <AboutPanel
              poem={poem}
              sessions={sessions[poem.id]}
              isFav={!!favs[poem.id]}
              onFav={() => toggleFav(poem.id)}
            />
            <PronunciationPanel poem={poem} />

            <div className="panel">
              <h4>{UI.progress}</h4>
              <div className="text-[2.2rem] numeral leading-none" style={{ color: 'var(--gold)' }}>
                {String(Math.max(0, tts.currentLineIdx + 1)).padStart(2, '0')}
                <span className="text-[1rem]" style={{ color: 'var(--ink-soft)' }}> / {String(poem._lines.length).padStart(2, '0')}</span>
              </div>
              <div className="text-[0.72rem] smallcaps mt-1" style={{ color: 'var(--ink-soft)' }}>
                versos lidos pelo scriptorium
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

/* ─── Mount ─────────────────────────────────────────────────── */
const root = ReactDOM.createRoot(document.getElementById("app"));
root.render(<App />);
