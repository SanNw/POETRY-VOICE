/* ╔═══════════════════════════════════════════════════════════════╗
   ║  POETRY VOICE · COMPONENTS                                    ║
   ╚═══════════════════════════════════════════════════════════════╝ */

/* ─── ThemeToggle (candle icon) ──────────────────────────────────── */
function ThemeToggle({ dark, setDark }) {
  return (
    <button className="theme-toggle" onClick={() => setDark(!dark)} aria-label="Alternar tema">
      <svg width="18" height="18" viewBox="0 0 24 24" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        {dark ? (
          <g>
            <path d="M12 3v2" />
            <path d="M12 19v2" />
            <path d="M4 12H2" />
            <path d="M22 12h-2" />
            <path d="M19.07 4.93l-1.41 1.41" />
            <path d="M6.34 17.66l-1.41 1.41" />
            <path d="M19.07 19.07l-1.41-1.41" />
            <path d="M6.34 6.34L4.93 4.93" />
            <circle cx="12" cy="12" r="4" />
          </g>
        ) : (
          <g>
            <path d="M12 3c-1.2 1.4-1.2 2.6 0 4 1.2-1.4 1.2-2.6 0-4z" />
            <line x1="12" y1="7" x2="12" y2="9" />
            <rect x="9" y="9" width="6" height="11" rx="0.5" />
            <line x1="7" y1="20" x2="17" y2="20" />
          </g>
        )}
      </svg>
      <span>{dark ? UI.dark : UI.light}</span>
    </button>
  );
}

/* ─── Waveform decoration ──────────────────────────────────────── */
function Waveform({ active }) {
  return (
    <span className={"wave " + (active ? "" : "idle")}>
      {Array.from({ length: 8 }).map((_, i) => <span key={i} />)}
    </span>
  );
}

/* ─── Language Tabs ───────────────────────────────────────────── */
const LANG_LABELS = {
  en: { name: "English", glyph: "EN", flag: "🇬🇧" },
  pt: { name: "Português", glyph: "PT", flag: "🇧🇷" },
  es: { name: "Español", glyph: "ES", flag: "🇪🇸" },
};

function LanguageTabs({ value, onChange }) {
  return (
    <div className="flex items-center" role="tablist" aria-label="Idioma">
      {Object.keys(LANG_LABELS).map((k) => (
        <button
          key={k}
          className={"lang-tab " + (value === k ? "active" : "")}
          role="tab"
          aria-selected={value === k}
          aria-label={LANG_LABELS[k].name}
          onClick={() => onChange(k)}
        >
          <span className="glyph">{LANG_LABELS[k].glyph}</span>
          <span className="lang-name">{LANG_LABELS[k].name}</span>
        </button>
      ))}
    </div>
  );
}

/* ─── Ornament rule ────────────────────────────────────────────── */
function OrnamentRule({ children }) {
  return (
    <div className="ornament-rule">
      <span style={{ letterSpacing: '0.4em' }}>{children || "❧"}</span>
    </div>
  );
}

/* ─── Header ──────────────────────────────────────────────────── */
function Header({ lang, setLang, dark, setDark, totalSessions }) {
  return (
    <header className="border-b" style={{ borderColor: 'var(--ink)', borderBottomWidth: 1 }}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 py-4 sm:py-6 flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-[1.25rem] sm:text-[1.5rem] md:text-[1.85rem] font-semibold leading-tight" style={{ color: 'var(--ink)' }}>
            POETRY ·<span style={{ color: 'var(--red)' }}> VOICE</span>
          </h1>
          <div className="mt-1 font-body italic text-[0.88rem] sm:text-[0.95rem]" style={{ color: 'var(--ink-soft)' }}>
            {UI.appSubtitle}
          </div>
          <div className="mt-2 flex items-center gap-2 sm:gap-3 text-[0.7rem] sm:text-[0.74rem] flex-wrap" style={{ color: 'var(--ink-soft)' }}>
            <span className="numeral">{String(totalSessions).padStart(3, '0')}</span>
            <span className="smallcaps">leituras no códice</span>
            <span style={{ color: 'var(--gold)' }}>·  ✦  ·</span>
            <span className="smallcaps">EN · PT · ES</span>
          </div>
        </div>
        <div className="flex items-center gap-3 sm:gap-5 flex-wrap shrink-0">
          <LanguageTabs value={lang} onChange={setLang} />
          <span className="divider-v self-stretch" />
          <ThemeToggle dark={dark} setDark={setDark} />
        </div>
      </div>
    </header>
  );
}

/* ─── Author filter chips ────────────────────────────────────── */
function AuthorChips({ poems, value, onChange }) {
  const authors = Array.from(new Set(poems.map(p => p.author)));
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        className={"tag " + (value == null ? "gold" : "")}
        onClick={() => onChange(null)}
        style={{ cursor: 'pointer' }}
      >
        {UI.authorAll}
      </button>
      {authors.map(a => (
        <button
          key={a}
          className={"tag " + (value === a ? "gold" : "")}
          onClick={() => onChange(a)}
          style={{ cursor: 'pointer' }}
        >
          {a}
        </button>
      ))}
    </div>
  );
}

/* ─── PoemCard ────────────────────────────────────────────────── */
function PoemCard({ poem, idx, isFav, onOpen, onFav, onDelete, sessions }) {
  const era = ERAS[poem.era] || "";
  const firstLines = poem._lines.slice(0, 3).map(l => l.raw);
  return (
    <div className="card" data-screen-label={`Card-${idx + 1}`}
         onClick={onOpen}
         style={{ cursor: 'pointer' }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="tag">{LANG_LABELS[poem.lang].glyph}</span>
          {era && <span className="tag" style={{ color: 'var(--ink-soft)' }}>{era}</span>}
          {poem.custom && <span className="tag gold">{UI.custom}</span>}
        </div>
        <div className="flex items-center gap-1">
          {poem.custom && onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); if (window.confirm(UI.confirmDelete)) onDelete(); }}
              aria-label={UI.delete}
              className="leading-none transition-colors"
              style={{ color: 'var(--ink-soft)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '0.95rem', padding: '0 4px' }}
            >✕</button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onFav(); }}
            aria-label={isFav ? UI.unfavorite : UI.favorite}
            className="text-[1.1rem] leading-none transition-colors"
            style={{ color: isFav ? 'var(--red)' : 'var(--ink-soft)', background: 'transparent', border: 'none', cursor: 'pointer' }}
          >
            {isFav ? "❦" : "❧"}
          </button>
        </div>
      </div>

      <div className="numeral text-[0.7rem] mb-1" style={{ color: 'var(--gold)' }}>
        {poem.year || (poem.custom ? "✦" : "—")} · {poem.locale}
      </div>
      <h3 className="font-display text-[1.05rem] font-semibold leading-tight mb-1" style={{ color: 'var(--ink)' }}>
        {poem.title}
      </h3>
      <div className="font-body italic text-[1rem] mb-4" style={{ color: 'var(--ink-soft)' }}>
        {poem.author}
      </div>

      <div className="font-poem text-[0.98rem] leading-snug" style={{ color: 'var(--ink-soft)' }}>
        {firstLines.map((l, i) => (
          <div key={i} className="truncate" style={{ opacity: 1 - i * 0.18 }}>
            {l}
          </div>
        ))}
      </div>

      <div className="mt-5 pt-3 flex items-center justify-between text-[0.72rem]"
           style={{ borderTop: '1px dotted rgba(184,146,42,0.3)' }}>
        <span className="smallcaps" style={{ color: 'var(--ink-soft)' }}>
          {poem._lines.length} versos · {poem.stanzas.length} estrofes
        </span>
        <span className="smallcaps" style={{ color: 'var(--gold)' }}>
          {sessions || 0} {UI.sessions}
        </span>
      </div>
    </div>
  );
}

/* ─── PoemGrid ────────────────────────────────────────────────── */
function PoemGrid({ poems, openPoem, favs, toggleFav, deletePoem, sessions, onAddClick }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {onAddClick && <AddPoemCard onClick={onAddClick} />}
      {poems.map((p, i) => (
        <PoemCard
          key={p.id}
          poem={p}
          idx={i}
          isFav={!!favs[p.id]}
          onOpen={() => openPoem(p.id)}
          onFav={() => toggleFav(p.id)}
          onDelete={p.custom && deletePoem ? () => deletePoem(p.id) : null}
          sessions={sessions[p.id] || 0}
        />
      ))}
    </div>
  );
}

/* ─── Glossary popover ───────────────────────────────────────── */
function GlossaryPopover({ entry, word, lang, onClose, anchor }) {
  if (!entry || !anchor) return null;
  const rect = anchor.getBoundingClientRect();
  const top = window.scrollY + rect.bottom + 8;
  const left = Math.max(20, Math.min(window.innerWidth - 300, window.scrollX + rect.left));
  const otherLangs = ["en", "pt", "es"].filter(l => l !== lang);

  return (
    <div className="gloss-pop" style={{ top, left }} onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-1">
        <span className="font-poem italic text-[1.15rem]" style={{ color: 'var(--ink)' }}>{word}</span>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--ink-soft)', cursor: 'pointer', fontSize: '1.1rem' }}>×</button>
      </div>
      <div className="font-body text-[0.95rem] mb-3" style={{ color: 'var(--ink-soft)' }}>
        {entry.def}
      </div>
      <div className="text-[0.72rem] smallcaps mb-1" style={{ color: 'var(--red)' }}>Traduções</div>
      <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[0.92rem]">
        {otherLangs.map(l => (
          <div key={l} style={{ display: 'contents' }}>
            <span className="numeral" style={{ color: 'var(--gold)' }}>{LANG_LABELS[l].glyph}</span>
            <span style={{ color: 'var(--ink)' }}>{entry.t?.[l] || UI.empty}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── PoemViewer (the central canvas) ─────────────────────────── */
function PoemViewer({
  poem,
  currentLineIdx,
  currentWordIdx,
  recognizedStatus,
  memoMode,
  memoHiddenCount,
  memoRevealed,
  onWordClick,
}) {
  let globalWordIdx = 0;

  return (
    <div className="poem-grid font-poem">
      {poem._lines.map((line, i) => {
        const isActive = i === currentLineIdx;
        const isAfterStanzaBreak = i > 0 && poem._lines[i - 1].stanzaIdx !== line.stanzaIdx;
        const verseCls = "verse " + (isActive ? "active " : "") + (line.isFirstOfPoem ? "first " : "");
        const lineWordCount = line.words.length;
        const hideFromIdx = memoMode ? Math.max(0, lineWordCount - memoHiddenCount) : lineWordCount;
        const lineRevealed = !memoMode || (memoRevealed && memoRevealed.has(i));

        const wordEls = line.words.map((w, wi) => {
          const wordCls = ["word"];
          if (isActive && wi <= currentWordIdx) wordCls.push("spoken");
          if (isActive && wi === currentWordIdx) wordCls.push("current");
          const status = recognizedStatus?.[globalWordIdx];
          if (status === "correct") wordCls.push("correct");
          else if (status === "missing") wordCls.push("wrong");
          const memoHidden = memoMode && wi >= hideFromIdx;
          if (memoHidden) wordCls.push("hidden-memo");
          if (memoHidden && lineRevealed) wordCls.push("revealed");

          const inGlossary = !!poem.glossary[w.raw.replace(/[^\p{L}\p{N}'’-]/gu, "")] ||
                             !!poem.glossary[w.clean] ||
                             !!poem.glossary[w.raw];
          const gi = globalWordIdx;
          globalWordIdx++;
          return (
            <span
              key={wi}
              className={wordCls.join(" ")}
              data-word-idx={gi}
              style={{ cursor: inGlossary ? 'help' : 'default' }}
              onClick={(e) => onWordClick && onWordClick(e, w, i)}
            >{w.raw}{wi < line.words.length - 1 ? " " : ""}</span>
          );
        });

        return (
          <div key={i} style={{ display: 'contents' }}>
            {isAfterStanzaBreak && <div className="verse-num" />}
            {isAfterStanzaBreak && <div className="stanza-break" />}
            <div className="verse-num">{String(i + 1).padStart(2, "0")}</div>
            <div className={verseCls}>{wordEls}</div>
          </div>
        );
      })}
    </div>
  );
}

/* ─── AudioControls ──────────────────────────────────────────── */
function AudioControls({
  isSpeaking, isPaused,
  voiceGender, setVoiceGender,
  speed, setSpeed,
  onPlay, onPause, onResume, onStop, onRepeat,
  mode, setMode,
  shadowPauseMs, setShadowPauseMs,
  memoHide, setMemoHide,
  voiceName, noVoiceAvailable,
}) {
  return (
    <div className="panel">
      <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
        <div className="mode-dock">
          {[
            { k: "listen", label: UI.modeListening, glyph: "♪" },
            { k: "shadow", label: UI.modeShadow, glyph: "❧" },
            { k: "karaoke", label: UI.modeKaraoke, glyph: "✦" },
            { k: "memo", label: UI.modeMemo, glyph: "※" },
          ].map((m) => (
            <button key={m.k} className={mode === m.k ? "on" : ""} onClick={() => setMode(m.k)}>
              <span style={{ color: 'var(--gold)' }}>{m.glyph}</span>
              {m.label}
            </button>
          ))}
        </div>
        <Waveform active={isSpeaking && !isPaused} />
      </div>

      <div className="text-[0.95rem] italic font-body mb-5" style={{ color: 'var(--ink-soft)' }}>
        {mode === "listen" && UI.descListening}
        {mode === "shadow" && UI.descShadow}
        {mode === "karaoke" && UI.descKaraoke}
        {mode === "memo" && UI.descMemo}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
        {/* Voice */}
        <div>
          <div className="text-[0.7rem] smallcaps mb-2" style={{ color: 'var(--red)' }}>{UI.voice}</div>
          <div className="toggle">
            <button className={voiceGender === "male" ? "on" : ""} onClick={() => setVoiceGender("male")}>{UI.voiceMale}</button>
            <button className={voiceGender === "female" ? "on" : ""} onClick={() => setVoiceGender("female")}>{UI.voiceFemale}</button>
          </div>
        </div>
        {/* Speed */}
        <div>
          <div className="text-[0.7rem] smallcaps mb-2" style={{ color: 'var(--red)' }}>{UI.speed}</div>
          <div className="toggle">
            <button className={speed === 0.6 ? "on" : ""} onClick={() => setSpeed(0.6)}>{UI.speedSlow}</button>
            <button className={speed === 1.0 ? "on" : ""} onClick={() => setSpeed(1.0)}>{UI.speedNormal}</button>
            <button className={speed === 1.3 ? "on" : ""} onClick={() => setSpeed(1.3)}>{UI.speedFast}</button>
          </div>
        </div>
        {/* Mode-specific */}
        <div>
          {mode === "shadow" && (
            <div style={{ display: 'contents' }}>
              <div className="text-[0.7rem] smallcaps mb-2" style={{ color: 'var(--red)' }}>{UI.pauseBetween}</div>
              <div className="toggle">
                {[3000, 5000, 8000].map(ms => (
                  <button key={ms} className={shadowPauseMs === ms ? "on" : ""} onClick={() => setShadowPauseMs(ms)}>{ms / 1000}s</button>
                ))}
              </div>
            </div>
          )}
          {mode === "memo" && (
            <div style={{ display: 'contents' }}>
              <div className="text-[0.7rem] smallcaps mb-2" style={{ color: 'var(--red)' }}>{UI.hideWords}</div>
              <div className="toggle">
                {[1, 2, 3].map(n => (
                  <button key={n} className={memoHide === n ? "on" : ""} onClick={() => setMemoHide(n)}>{n}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {!isSpeaking || isPaused ? (
          <button className="btn btn-primary" onClick={isPaused ? onResume : onPlay} disabled={noVoiceAvailable}>
            ▶ {UI.play}
          </button>
        ) : (
          <button className="btn" onClick={onPause}>❚❚ {UI.pause}</button>
        )}
        <button className="btn" onClick={onStop} disabled={!isSpeaking}>■ {UI.stop}</button>
        <button className="btn btn-ghost" onClick={onRepeat} disabled={!isSpeaking}>↺ {UI.repeat}</button>
        <span className="ml-auto text-[0.72rem] smallcaps flex items-center gap-2" style={{ color: 'var(--ink-soft)' }}>
          {voiceName && (
            <span style={{ display: 'contents' }}>
              <span style={{ color: 'var(--gold)' }}>❧</span>
              <span>{UI.voiceUsed}:&nbsp;</span><span style={{ color: 'var(--ink)' }}>{voiceName}</span>
            </span>
          )}
        </span>
      </div>

      {noVoiceAvailable && (
        <div className="mt-4 text-[0.9rem] font-body italic"
             style={{ color: 'var(--red)', borderLeft: '2px solid var(--red)', paddingLeft: 12 }}>
          ※ {UI.noVoiceWarning}
        </div>
      )}
    </div>
  );
}

/* ─── PronunciationPanel ─────────────────────────────────────── */
function PronunciationPanel({ poem }) {
  return (
    <div className="panel">
      <h4>{UI.pronunciation}</h4>
      <div>
        {poem.pronunciation.map((p, i) => (
          <div key={i} className="pron-row">
            <div>
              <span className="font-poem text-[1.05rem]" style={{ color: 'var(--ink)' }}>{p.word}</span>
              <div className="text-[0.78rem]" style={{ color: 'var(--ink-soft)' }}>{p.hint}</div>
            </div>
            <div className="ipa self-center text-right">/{p.ipa}/</div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── AboutPanel ─────────────────────────────────────────────── */
function AboutPanel({ poem, sessions, isFav, onFav }) {
  return (
    <div className="panel">
      <h4>{UI.about}</h4>
      <div className="font-body text-[1.02rem]" style={{ color: 'var(--ink)' }}>
        <div className="flex items-baseline justify-between gap-3 mb-1">
          <span className="font-display text-[1rem]" style={{ color: 'var(--ink)' }}>{poem.author}</span>
          <span className="numeral text-[0.72rem]">{poem.year}</span>
        </div>
        <div className="text-[0.78rem] smallcaps mb-3" style={{ color: 'var(--ink-soft)' }}>
          {ERAS[poem.era] || ""} · {poem.locale}
        </div>
        <div className="italic mb-3" style={{ color: 'var(--ink-soft)' }}>{poem.blurb}</div>
        <div className="flex items-center justify-between mt-4 pt-3 text-[0.74rem] smallcaps"
             style={{ borderTop: '1px dotted rgba(184,146,42,0.3)' }}>
          <span style={{ color: 'var(--ink-soft)' }}>{sessions || 0} {UI.sessions}</span>
          <button onClick={onFav}
                  className="theme-toggle"
                  style={{ color: isFav ? 'var(--red)' : 'var(--ink-soft)' }}>
            {isFav ? "❦" : "❧"} {isFav ? UI.unfavorite : UI.favorite}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── RecordingPanel ─────────────────────────────────────────── */
function RecordingPanel({ supported, isListening, finalText, interim, accuracy, onStart, onStop, onReset }) {
  if (!supported) {
    return (
      <div className="panel">
        <h4>{UI.modeRecord}</h4>
        <div className="font-body italic" style={{ color: 'var(--red)' }}>※ {UI.noSpeechApi}</div>
      </div>
    );
  }
  return (
    <div className="panel">
      <h4>{UI.modeRecord}</h4>
      <div className="text-[0.92rem] font-body italic mb-4" style={{ color: 'var(--ink-soft)' }}>
        {UI.descRecord}
      </div>
      <div className="flex items-center gap-2 flex-wrap mb-4">
        {!isListening ? (
          <button className="btn btn-primary" onClick={onStart}>● {UI.startRecord}</button>
        ) : (
          <button className="btn" onClick={onStop}>■ {UI.stopRecord}</button>
        )}
        {(finalText || interim) && !isListening && (
          <button className="btn btn-ghost" onClick={onReset}>↺ Limpar</button>
        )}
        {isListening && (
          <span className="flex items-center gap-2 text-[0.74rem] smallcaps" style={{ color: 'var(--red)' }}>
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: 'var(--red)', animation: 'wave-bounce 1s ease-in-out infinite' }} />
            {UI.listening}
          </span>
        )}
        {accuracy != null && !isListening && (
          <span className="score-chip ml-auto">
            {UI.accuracy} <b>{accuracy}%</b>
          </span>
        )}
      </div>

      {(finalText || interim) && (
        <div className="mt-2">
          <div className="text-[0.7rem] smallcaps mb-1" style={{ color: 'var(--red)' }}>{UI.recognized}</div>
          <div className="font-poem text-[1.05rem] p-3" style={{
            background: 'var(--bg)',
            border: '1px dashed rgba(184,146,42,0.5)',
            color: 'var(--ink)',
            lineHeight: 1.5,
          }}>
            {finalText}
            <span style={{ color: 'var(--ink-soft)', fontStyle: 'italic' }}> {interim}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Library Screen ─────────────────────────────────────────── */
function LibraryScreen({ lang, poems, openPoem, favs, toggleFav, deletePoem, sessions, onAddClick }) {
  const [authorFilter, setAuthorFilter] = useState(null);
  const filtered = authorFilter ? poems.filter(p => p.author === authorFilter) : poems;

  return (
    <div data-screen-label={`01 Library · ${lang.toUpperCase()}`}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-10 py-7 md:py-10">
        <div className="mb-6 flex items-end justify-between gap-4 flex-wrap">
          <div>
            <div className="rubric text-[0.75rem] sm:text-[0.8rem] mb-2">❧ {UI.libraryTitle.toUpperCase()}</div>
            <h2 className="font-display text-[1.7rem] sm:text-[2.2rem] md:text-[2.6rem] font-semibold leading-none">
              <span style={{ fontStyle: 'italic', fontFamily: "'IM Fell English', serif", letterSpacing: 0 }}>
                {LANG_LABELS[lang].name}
              </span>
            </h2>
            <div className="font-body italic text-[0.96rem] sm:text-[1.05rem] mt-2" style={{ color: 'var(--ink-soft)' }}>
              {UI.librarySubtitle}
            </div>
          </div>
          <div className="text-right">
            <div className="numeral text-[1.9rem] sm:text-[2.4rem] leading-none" style={{ color: 'var(--gold)' }}>
              {String(filtered.length).padStart(2, '0')}
            </div>
            <div className="text-[0.65rem] sm:text-[0.7rem] smallcaps" style={{ color: 'var(--ink-soft)' }}>{UI.poemsCount}</div>
          </div>
        </div>

        <div className="sep" />

        <div className="mb-5 sm:mb-6 flex items-center justify-between gap-3 flex-wrap">
          <AuthorChips poems={poems} value={authorFilter} onChange={setAuthorFilter} />
          {onAddClick && (
            <button className="btn" onClick={onAddClick}>
              <span style={{ color: 'var(--gold)' }}>❧</span>&nbsp;+ {UI.addPoem}
            </button>
          )}
        </div>

        <PoemGrid
          poems={filtered}
          openPoem={openPoem}
          favs={favs}
          toggleFav={toggleFav}
          deletePoem={deletePoem}
          sessions={sessions}
          onAddClick={onAddClick}
        />
      </div>
    </div>
  );
}

/* ─── AddPoemModal ──────────────────────────────────────────── */
function AddPoemModal({ initial, onClose, onSave }) {
  const [title, setTitle] = useState(initial?.title || "");
  const [author, setAuthor] = useState(initial?.author || "Anônimo");
  const [year, setYear] = useState(initial?.year || "");
  const [lang, setLang] = useState(initial?.lang || "pt");
  const [subtitle, setSubtitle] = useState(initial?.subtitle || "");
  const [text, setText] = useState(initial?._raw || "");
  const [err, setErr] = useState("");

  const submit = (e) => {
    e.preventDefault();
    const t = title.trim();
    const body = text.replace(/\r\n/g, "\n").trim();
    if (!t) { setErr(UI.validationTitle); return; }
    if (!body) { setErr(UI.validationText); return; }
    const stanzas = body.split(/\n\s*\n/).map(st => st.split(/\n/).map(l => l.trim()).filter(Boolean)).filter(s => s.length);
    const locale = { en: "en-US", pt: "pt-BR", es: "es-ES" }[lang];
    const id = initial?.id || `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const poem = {
      id, lang, locale,
      author: author.trim() || "Anônimo",
      year: year.trim(),
      era: null,
      title: t,
      subtitle: subtitle.trim(),
      blurb: "",
      stanzas,
      pronunciation: [],
      glossary: {},
      custom: true,
      _raw: body,
    };
    onSave(poem);
  };

  // close on Esc
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4" style={{ background: "rgba(15,12,8,0.55)" }} onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl panel pv-modal-form"
        style={{ maxHeight: "92vh", overflow: "auto" }}
      >
        <div className="flex items-center justify-between mb-5">
          <h4 style={{ margin: 0 }}>{initial ? UI.editPoem : UI.newPoem}</h4>
          <button type="button" onClick={onClose} className="theme-toggle" aria-label={UI.cancel} style={{ fontSize: "0.7rem" }}>×&nbsp;{UI.cancel}</button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <CustomField label={UI.fieldTitle}>
            <input value={title} onChange={(e) => setTitle(e.target.value)}
                   className="cust-input" autoFocus />
          </CustomField>
          <CustomField label={UI.fieldAuthor}>
            <input value={author} onChange={(e) => setAuthor(e.target.value)} className="cust-input" />
          </CustomField>
          <CustomField label={UI.fieldYear}>
            <input value={year} onChange={(e) => setYear(e.target.value)} className="cust-input" placeholder="—" />
          </CustomField>
          <CustomField label={UI.fieldLang}>
            <div className="toggle">
              {["en", "pt", "es"].map(l => (
                <button type="button" key={l} className={lang === l ? "on" : ""} onClick={() => setLang(l)}>
                  {LANG_LABELS[l].glyph}
                </button>
              ))}
            </div>
          </CustomField>
        </div>

        <CustomField label={UI.fieldSubtitle}>
          <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="cust-input" />
        </CustomField>

        <div className="mt-4">
          <CustomField label={UI.fieldText} help={UI.fieldTextHelp}>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={12}
              className="cust-input font-poem"
              style={{ resize: "vertical", lineHeight: 1.65 }}
              placeholder="Verso primeiro&#10;Verso segundo&#10;&#10;Nova estrofe…"
            />
          </CustomField>
        </div>

        {err && <div className="mt-3 text-[0.9rem] italic font-body" style={{ color: 'var(--red)' }}>※ {err}</div>}

        <div className="mt-6 flex items-center justify-end gap-2">
          <button type="button" className="btn btn-ghost" onClick={onClose}>{UI.cancel}</button>
          <button type="submit" className="btn btn-primary">{UI.save}</button>
        </div>
      </form>
    </div>
  );
}

function CustomField({ label, help, children }) {
  return (
    <label className="block">
      <div className="text-[0.7rem] smallcaps mb-1.5" style={{ color: 'var(--red)' }}>{label}</div>
      {children}
      {help && <div className="text-[0.78rem] italic font-body mt-1" style={{ color: 'var(--ink-soft)' }}>{help}</div>}
    </label>
  );
}

/* ─── AddPoemCard (tile in library grid) ─────────────────────── */
function AddPoemCard({ onClick }) {
  return (
    <button onClick={onClick}
            className="card"
            style={{
              cursor: 'pointer',
              border: '1px dashed var(--ink)',
              background: 'transparent',
              minHeight: 280,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 14,
              textAlign: 'center',
            }}>
      <span style={{ fontSize: '2.2rem', color: 'var(--gold)', lineHeight: 1 }}>❧</span>
      <span className="font-display text-[0.9rem]" style={{ letterSpacing: '0.2em', color: 'var(--ink)' }}>
        {UI.addPoem.toUpperCase()}
      </span>
      <span className="font-body italic text-[0.92rem] px-6" style={{ color: 'var(--ink-soft)' }}>
        Cole vossos próprios versos, salmos ou textos no códice
      </span>
    </button>
  );
}

Object.assign(window, {
  ThemeToggle, Waveform, LanguageTabs, OrnamentRule, Header,
  AuthorChips, PoemCard, PoemGrid, GlossaryPopover, PoemViewer,
  AudioControls, PronunciationPanel, AboutPanel, RecordingPanel, LibraryScreen,
  LANG_LABELS, AddPoemModal, AddPoemCard, CustomField,
});
