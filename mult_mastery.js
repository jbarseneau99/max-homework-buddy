// Year-long Multiplication mastery: per-fact (a×b) and per-lesson level stats in localStorage.
// Included in Quiz History Export/Import under mastery.multiplication.
// API: HB.multMastery.{record,fact,heatmap,lessonLevel,pickFact,pickProblem,exportBlob,importBlob,reset}
(function () {
  const KEY = "hb.multMastery.v1";
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || empty(); } catch (e) { return empty(); } };
  const save = d => { try { localStorage.setItem(KEY, JSON.stringify(d)); return true; } catch (e) { return false; } };
  function empty() {
    return { facts: {}, lessons: {}, speedBestMs: null, updatedAt: null };
  }
  function factKey(a, b) { return a + "x" + b; }
  function ensureFact(d, a, b) {
    const k = factKey(a, b);
    if (!d.facts[k]) d.facts[k] = { a, b, attempts: 0, right: 0, wrong: 0, streak: 0, last: null, avgMs: null };
    return d.facts[k];
  }
  function ensureLesson(d, id) {
    if (!d.lessons[id]) d.lessons[id] = { level: 1, attempts: 0, right: 0, wrong: 0, levelUps: 0, last: null };
    return d.lessons[id];
  }
  // Level up when recent accuracy high: after 8+ attempts at this level with >=85% and streak>=5
  function maybeLevelUp(L) {
    if (L.level >= 3) return false;
    const n = L.attempts - (L._levelStartAttempts || 0);
    const r = L.right - (L._levelStartRight || 0);
    if (n >= 8 && r / n >= 0.85 && (L._streak || 0) >= 5) {
      L.level++; L.levelUps++; L._levelStartAttempts = L.attempts; L._levelStartRight = L.right; L._streak = 0;
      return true;
    }
    return false;
  }

  const API = {
    KEY,
    data: () => load(),
    fact(a, b) { return ensureFact(load(), a, b); },
    lessonLevel(id) { return ensureLesson(load(), id).level; },
    speedBest() { return load().speedBestMs; },
    setSpeedBest(ms) {
      const d = load();
      if (d.speedBestMs == null || ms < d.speedBestMs) { d.speedBestMs = ms; d.updatedAt = new Date().toISOString(); save(d); return true; }
      return false;
    },
    record({ lessonId, a, b, ok, ms, answer, given }) {
      const d = load();
      const now = new Date().toISOString();
      d.updatedAt = now;
      if (a != null && b != null) {
        const f = ensureFact(d, a, b);
        f.attempts++; f.last = now;
        if (ok) { f.right++; f.streak++; } else { f.wrong++; f.streak = 0; }
        if (ms != null) f.avgMs = f.avgMs == null ? ms : Math.round(f.avgMs * 0.7 + ms * 0.3);
      }
      if (lessonId) {
        const L = ensureLesson(d, lessonId);
        if (L._levelStartAttempts == null) { L._levelStartAttempts = 0; L._levelStartRight = 0; L._streak = 0; }
        L.attempts++; L.last = now;
        if (ok) { L.right++; L._streak = (L._streak || 0) + 1; } else { L.wrong++; L._streak = 0; }
        maybeLevelUp(L);
      }
      save(d);
      return d;
    },
    // Weight toward weak facts: score = wrongs*2 + (1/(right+1)) + daysSince/30
    pickFact(level) {
      const d = load();
      const maxN = level >= 3 ? 12 : level >= 2 ? 10 : 6;
      const pool = [];
      for (let a = 1; a <= maxN; a++) for (let b = 1; b <= maxN; b++) {
        const f = d.facts[factKey(a, b)] || { attempts: 0, right: 0, wrong: 0, last: null, streak: 0 };
        const days = f.last ? (Date.now() - Date.parse(f.last)) / 86400000 : 99;
        const weak = f.wrong * 2.5 + 1 / (f.right + 1) + days / 40 + (f.streak >= 3 ? -0.5 : 0.2);
        pool.push({ a, b, product: a * b, w: Math.max(0.05, weak) });
      }
      const sum = pool.reduce((s, p) => s + p.w, 0);
      let r = Math.random() * sum;
      for (const p of pool) { r -= p.w; if (r <= 0) return p; }
      return pool[pool.length - 1];
    },
    heatmap() {
      const d = load();
      const grid = [];
      for (let a = 1; a <= 12; a++) {
        const row = [];
        for (let b = 1; b <= 12; b++) {
          const f = d.facts[factKey(a, b)];
          let state = "new";
          if (f && f.attempts) {
            const acc = f.right / f.attempts;
            state = f.attempts >= 3 && acc >= 0.85 && f.streak >= 2 ? "mastered"
              : acc >= 0.6 ? "learning" : "weak";
          }
          row.push({ a, b, state, attempts: f ? f.attempts : 0, right: f ? f.right : 0, wrong: f ? f.wrong : 0 });
        }
        grid.push(row);
      }
      return { grid, lessons: d.lessons, speedBestMs: d.speedBestMs, updatedAt: d.updatedAt };
    },
    exportBlob() { return load(); },
    importBlob(blob) {
      if (!blob || typeof blob !== "object") return false;
      const cur = load();
      const incoming = blob.facts || blob;
      if (blob.facts) {
        Object.keys(blob.facts || {}).forEach(k => { cur.facts[k] = { ...(cur.facts[k] || {}), ...blob.facts[k] }; });
        Object.keys(blob.lessons || {}).forEach(k => { cur.lessons[k] = { ...(cur.lessons[k] || {}), ...blob.lessons[k] }; });
        if (blob.speedBestMs != null && (cur.speedBestMs == null || blob.speedBestMs < cur.speedBestMs)) cur.speedBestMs = blob.speedBestMs;
      }
      cur.updatedAt = new Date().toISOString();
      return save(cur);
    },
    reset() { save(empty()); }
  };

  HB.multMastery = API;

  // Hook Export/Import of quiz history to include mastery
  const wrap = () => {
    if (!HB.quizHistory) return;
    const _exp = HB.quizHistory.exportJSON.bind(HB.quizHistory);
    const _imp = HB.quizHistory.importJSON.bind(HB.quizHistory);
    HB.quizHistory.exportJSON = () => {
      const data = JSON.parse(_exp());
      data.mastery = data.mastery || {};
      data.mastery.multiplication = API.exportBlob();
      return JSON.stringify(data, null, 2);
    };
    HB.quizHistory.importJSON = text => {
      const raw = JSON.parse(text);
      const r = _imp(text);
      if (raw && raw.mastery && raw.mastery.multiplication) API.importBlob(raw.mastery.multiplication);
      return r;
    };
  };
  // settings/quiz_history load before or after — retry
  wrap();
  setTimeout(wrap, 0);
})();
