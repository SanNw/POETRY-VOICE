/* ╔═══════════════════════════════════════════════════════════════╗
   ║  POETRY VOICE · HOOKS                                         ║
   ║  TTS ENGINE · SPEECH RECOGNITION · UTILITIES                  ║
   ╚═══════════════════════════════════════════════════════════════╝ */

const { useState, useEffect, useRef, useCallback, useMemo } = React;

/* ─── lang code → BCP-47 prefixes we accept ──────────────────────── */
const LANG_MATCHES = {
  en: ["en-US", "en-GB", "en"],
  pt: ["pt-BR", "pt-PT", "pt"],
  es: ["es-ES", "es-MX", "es-419", "es"],
};

/* Voice name heuristics → gender */
const MALE_HINTS = [
  // Generic flags
  "male", "masculino", "hombre", "homem",
  // EN male voice names
  "james", "daniel", "alex", "fred", "ralph", "tom", "george", "guy", "mark", "david", "aaron",
  "matthew", "noah", "ryan", "william", "oliver", "arthur", "brian", "rishi", "thomas", "diego",
  // PT/ES male names
  "ricardo", "carlos", "jorge", "joaquin", "joaquim", "miguel", "felipe", "pablo", "andres",
  "luciano", "rodrigo", "antonio", "antônio", "joão", "joao", "paulo", "andré", "andre",
  "alvaro", "álvaro", "manuel", "enrique",
];
const FEMALE_HINTS = [
  "female", "feminino", "mujer", "mulher",
  "samantha", "victoria", "karen", "moira", "tessa", "fiona", "kate", "susan", "allison",
  "ava", "serena", "zoe", "joanna", "kendra", "salli", "ivy",
  "maria", "luciana", "camila", "isabela", "fernanda", "joana", "joaquina",
  "lúcia", "lucia", "marisol", "monica", "mônica", "paulina", "soledad", "esperanza",
  "alice", "helena", "ines", "inês", "francisca", "vera", "raquel",
];

function inferGender(voice) {
  // Normalize: lowercase, strip accents, remove non-letters → robust matching
  // across accented voice names (e.g. "Mónica", "Antônio", "Inês").
  const name = (voice.name || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  for (const h of FEMALE_HINTS) if (name.includes(h)) return "female";
  for (const h of MALE_HINTS) if (name.includes(h)) return "male";
  return "unknown";
}

function voiceScore(voice) {
  const n = (voice.name || "").toLowerCase();
  let s = 0;
  if (n.includes("neural")) s += 50;
  if (n.includes("natural")) s += 40;
  if (n.includes("enhanced")) s += 30;
  if (n.includes("google")) s += 25;
  if (n.includes("premium")) s += 20;
  if (n.includes("siri")) s += 15;
  if (voice.localService === false) s += 5;
  if (voice.default) s += 5;
  return s;
}

/* ─── useVoices: load & poll synth voices, group by lang+gender ──── */
function useVoices() {
  const [voices, setVoices] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!("speechSynthesis" in window)) {
      setReady(true);
      return;
    }
    const load = () => {
      const list = window.speechSynthesis.getVoices();
      if (list && list.length) {
        setVoices(list);
        setReady(true);
      }
    };
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    // Some browsers need a tick or two
    const i1 = setTimeout(load, 250);
    const i2 = setTimeout(load, 1200);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", load);
      clearTimeout(i1); clearTimeout(i2);
    };
  }, []);

  const byLang = useMemo(() => {
    const result = { en: { male: [], female: [], all: [] }, pt: { male: [], female: [], all: [] }, es: { male: [], female: [], all: [] } };
    for (const lang of Object.keys(LANG_MATCHES)) {
      const matched = voices.filter(v => LANG_MATCHES[lang].some(code => (v.lang || "").toLowerCase().startsWith(code.toLowerCase())));
      const ranked = matched.sort((a, b) => voiceScore(b) - voiceScore(a));
      result[lang].all = ranked;
      for (const v of ranked) {
        const g = inferGender(v);
        if (g === "male") result[lang].male.push(v);
        else if (g === "female") result[lang].female.push(v);
      }
      // Fallback split: if no gender inferred for one side, use first/second voices
      if (ranked.length > 0) {
        if (result[lang].male.length === 0) result[lang].male.push(ranked[0]);
        if (result[lang].female.length === 0) result[lang].female.push(ranked[Math.min(1, ranked.length - 1)] || ranked[0]);
      }
    }
    return result;
  }, [voices]);

  return { voices, byLang, ready };
}

/* ─── useTTS: orchestrates speaking lines, words, with callbacks ─── */
function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentLineIdx, setCurrentLineIdx] = useState(-1);
  const [currentWordIdx, setCurrentWordIdx] = useState(-1); // local to current line

  const utterRef = useRef(null);
  const stoppedRef = useRef(false);
  const queueRef = useRef([]); // {text, lineIdx, wordsCount, onLineEnd?}
  const configRef = useRef({ voice: null, rate: 1, pitch: 1, lineGapMs: 0 });

  const stop = useCallback(() => {
    stoppedRef.current = true;
    queueRef.current = [];
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentLineIdx(-1);
    setCurrentWordIdx(-1);
  }, []);

  const _speakOne = useCallback(() => {
    if (stoppedRef.current) return;
    const next = queueRef.current.shift();
    if (!next) {
      setIsSpeaking(false);
      setCurrentLineIdx(-1);
      setCurrentWordIdx(-1);
      return;
    }
    const { text, lineIdx, words, onLineEnd, lineGapMs } = next;
    const u = new SpeechSynthesisUtterance(text);
    const cfg = configRef.current;
    // Prefer an explicit voice; otherwise fall back to a BCP-47 locale so
    // the browser can pick its default voice for that language. This is what
    // unblocks speech on systems where our heuristic fails to match a voice
    // (e.g. accented Spanish names not normalized into the hint table).
    if (cfg.voice) { u.voice = cfg.voice; u.lang = cfg.voice.lang; }
    else if (cfg.lang) { u.lang = cfg.lang; }
    u.rate = cfg.rate;
    u.pitch = cfg.pitch;
    utterRef.current = u;
    setCurrentLineIdx(lineIdx);
    setCurrentWordIdx(-1);
    setIsSpeaking(true);

    // Word boundary tracking
    u.onboundary = (ev) => {
      if (ev.name !== "word" || stoppedRef.current) return;
      const charIdx = ev.charIndex || 0;
      let idx = 0;
      let consumed = 0;
      for (let i = 0; i < (words || []).length; i++) {
        const len = words[i].raw.length;
        const peek = consumed + len;
        if (charIdx <= peek) { idx = i; break; }
        consumed = peek + 1;
        idx = i + 1;
      }
      setCurrentWordIdx(Math.min(idx, (words || []).length - 1));
    };

    u.onend = () => {
      if (stoppedRef.current) return;
      utterRef.current = null;
      if (onLineEnd) onLineEnd(lineIdx);
      if (lineGapMs && lineGapMs > 0) {
        setTimeout(_speakOne, lineGapMs);
      } else {
        _speakOne();
      }
    };
    u.onerror = () => {
      utterRef.current = null;
      _speakOne();
    };
    try { window.speechSynthesis.speak(u); }
    catch (e) { console.warn("speak failed", e); }
  }, []);

  const speakLines = useCallback((lines, config, opts = {}) => {
    if (!("speechSynthesis" in window)) return;
    stop();
    stoppedRef.current = false;
    configRef.current = { ...configRef.current, ...config };
    queueRef.current = lines.map((line) => ({
      text: line.raw,
      lineIdx: line.lineIdx,
      words: line.words,
      onLineEnd: opts.onLineEnd,
      lineGapMs: opts.lineGapMs || 0,
    }));
    // Chrome bug: speak() called synchronously after cancel() is silently
    // dropped. A short tick lets the synth flush its queue first.
    setTimeout(_speakOne, 80);
  }, [_speakOne, stop]);

  const pause = useCallback(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.pause();
      setIsPaused(true);
    }
  }, []);

  const resume = useCallback(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.resume();
      setIsPaused(false);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => () => { stoppedRef.current = true; if ("speechSynthesis" in window) window.speechSynthesis.cancel(); }, []);

  return { speakLines, stop, pause, resume, isSpeaking, isPaused, currentLineIdx, currentWordIdx };
}

/* ─── useSpeechRecognition: compares recognized vs target poem ──── */
function useSpeechRecognition() {
  const SR = typeof window !== "undefined"
    ? (window.SpeechRecognition || window.webkitSpeechRecognition)
    : null;
  const supported = !!SR;

  const recRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [finalText, setFinalText] = useState("");

  const start = useCallback((lang) => {
    if (!supported) return;
    try {
      const rec = new SR();
      rec.lang = lang;
      rec.continuous = true;
      rec.interimResults = true;
      let acc = "";
      rec.onresult = (ev) => {
        let interimAcc = "";
        for (let i = ev.resultIndex; i < ev.results.length; i++) {
          const r = ev.results[i];
          if (r.isFinal) acc += r[0].transcript + " ";
          else interimAcc += r[0].transcript + " ";
        }
        setFinalText(acc.trim());
        setInterim(interimAcc.trim());
      };
      rec.onerror = () => { setIsListening(false); };
      rec.onend = () => { setIsListening(false); };
      recRef.current = rec;
      setFinalText("");
      setInterim("");
      rec.start();
      setIsListening(true);
    } catch (e) {
      console.warn("Could not start recognition", e);
    }
  }, [SR, supported]);

  const stop = useCallback(() => {
    if (recRef.current) {
      try { recRef.current.stop(); } catch (_) {}
    }
    setIsListening(false);
  }, []);

  return { supported, isListening, interim, finalText, start, stop };
}

/* ─── compareWords: score recognized against target ─────────────── */
function normalizeWord(s) {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

function compareTranscript(targetWords, transcript) {
  // targetWords: array of {clean}
  // returns: array per target word: 'correct'|'wrong'|'missing', plus accuracy %
  const recTokens = (transcript || "").split(/\s+/).map(normalizeWord).filter(Boolean);
  const targetClean = targetWords.map(w => normalizeWord(w.clean || w.raw || ""));
  // Build a set with index of each occurrence for greedy match
  const recCount = new Map();
  recTokens.forEach((t, i) => {
    if (!recCount.has(t)) recCount.set(t, []);
    recCount.get(t).push(i);
  });

  const status = [];
  let lastUsedIdx = -1;
  let correct = 0;
  for (const tw of targetClean) {
    const positions = recCount.get(tw) || [];
    // Find a position after lastUsedIdx
    const pos = positions.find(p => p > lastUsedIdx);
    if (pos !== undefined) {
      status.push("correct");
      lastUsedIdx = pos;
      correct++;
    } else if (positions.length > 0) {
      // Word was said but out of order — still credit but mark approximate
      status.push("correct");
      correct++;
    } else {
      status.push("missing");
    }
  }
  const accuracy = targetClean.length === 0 ? 0 : Math.round((correct / targetClean.length) * 100);
  return { status, accuracy };
}

/* ─── usePersisted: localStorage state ──────────────────────────── */
function usePersisted(key, initial) {
  const [v, setV] = useState(() => {
    try {
      const s = localStorage.getItem(key);
      if (s == null) return initial;
      return JSON.parse(s);
    } catch (e) { return initial; }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(v)); } catch (_) {}
  }, [key, v]);
  return [v, setV];
}

Object.assign(window, {
  useVoices, useTTS, useSpeechRecognition, usePersisted,
  compareTranscript, normalizeWord, inferGender, voiceScore, LANG_MATCHES,
});
