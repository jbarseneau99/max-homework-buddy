// Permanent quiz attempt history (localStorage hb.quizHistory.v1). No size cap beyond what the browser allows.
// Keeps hb.lastResult.v1 for the Outbox "latest results" template. Migrates any prior lastResult on first load.
// API: HB.quizHistory.list/filter/get/add/clear/exportJSON/importJSON
//      HB.recordResult({ title, subject, topic, mode, score, total, questions:[{q,given,answer,ok,written?}], details })
(function () {
  const KEY = "hb.quizHistory.v1", LAST = "hb.lastResult.v1";
  const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { console.warn("[quizHistory] save failed", e); return false; } };

  function list() {
    const arr = load(KEY, []);
    return Array.isArray(arr) ? arr : [];
  }
  function write(arr) { return save(KEY, arr); }

  function pathBits() {
    const s = (window.HB && HB.state) || {};
    const subject = s.subject ? s.subject.title : "";
    const topic = [s.subtopic, s.session].filter(Boolean).map(x => x.title).join(" › ");
    return { subject, topic };
  }

  function normalize(r) {
    const bits = pathBits();
    const questions = Array.isArray(r.questions) ? r.questions.map(q => ({
      q: String(q.q == null ? "" : q.q),
      given: String(q.given == null ? "" : q.given),
      answer: String(q.answer == null ? "" : q.answer),
      ok: !!q.ok,
      written: q.written == null ? "" : String(q.written)
    })) : [];
    // Fall back: build question rows from details like "✓ foo" / "✗ foo"
    if (!questions.length && Array.isArray(r.details)) {
      r.details.forEach(line => {
        const m = String(line).match(/^([✓✗])\s*(.*)$/);
        if (m) questions.push({ q: m[2], given: "", answer: "", ok: m[1] === "✓", written: "" });
      });
    }
    return {
      id: r.id || ("q" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7)),
      at: r.at || new Date().toISOString(),
      title: r.title || (window.HB && HB.pathTitle ? HB.pathTitle() : "Quiz"),
      subject: r.subject || bits.subject || "",
      topic: r.topic || bits.topic || "",
      mode: r.mode || "",
      score: Number(r.score) || 0,
      total: Number(r.total) || 0,
      questions,
      details: Array.isArray(r.details) ? r.details.map(String) : questions.map(q => `${q.ok ? "✓" : "✗"} ${q.q}`)
    };
  }

  function add(r) {
    const attempt = normalize(r);
    const arr = [attempt].concat(list()); // newest first; NO cap
    write(arr);
    // Keep Outbox "latest results" working
    save(LAST, { title: attempt.title, score: attempt.score, total: attempt.total, details: attempt.details, at: attempt.at });
    return attempt;
  }

  // One-time migration: if history empty but lastResult exists, seed it
  (function migrate() {
    if (list().length) return;
    const last = load(LAST, null);
    if (last && (last.score != null || last.total != null)) {
      write([normalize({ ...last, mode: last.mode || "legacy", subject: last.subject || "", topic: last.topic || last.title || "" })]);
    }
  })();

  function exportJSON() {
    return JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), attempts: list() }, null, 2);
  }
  function importJSON(text) {
    let data;
    try { data = JSON.parse(text); } catch (e) { throw new Error("That file is not valid JSON."); }
    const incoming = Array.isArray(data) ? data : (data && data.attempts);
    if (!Array.isArray(incoming)) throw new Error("No attempts array found in that file.");
    const byId = new Map(list().map(a => [a.id, a]));
    let added = 0;
    incoming.forEach(raw => {
      const a = normalize(raw);
      if (!byId.has(a.id)) { byId.set(a.id, a); added++; }
    });
    const merged = [...byId.values()].sort((a, b) => String(b.at).localeCompare(String(a.at)));
    write(merged);
    return { added, total: merged.length };
  }

  HB.quizHistory = {
    KEY, list,
    get: id => list().find(a => a.id === id),
    filter(subj) {
      const all = list();
      if (!subj || subj === "all") return all;
      return all.filter(a => (a.subject || "").toLowerCase() === String(subj).toLowerCase());
    },
    subjects() {
      const s = new Set();
      list().forEach(a => { if (a.subject) s.add(a.subject); });
      return [...s].sort();
    },
    add, clear() { try { localStorage.removeItem(KEY); } catch (e) {} },
    exportJSON, importJSON
  };

  // Replace / wrap recordResult (settings.js may set it later — we re-set after both load)
  HB.recordResult = r => add(r || {});
})();
