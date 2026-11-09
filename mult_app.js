// Math › Multiplication: multWalk (review + hero) and multQuiz (typed | notepad, adaptive).
// Data: MULT_DATA. Mastery: HB.multMastery. Visuals: MULT_VIS. Audio: ANAT.play (gTTS MP3s).
(function () {
  const $ = id => document.getElementById(id);
  const play = src => { if (window.ANAT && src) ANAT.play(src); };
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const aiReady = () => !!(HB.ai && HB.ai.ready());
  const D = () => window.MULT_DATA || { sessions: {}, order: [] };
  const lessonIdOf = ctx => {
    if (ctx.opts && ctx.opts.lesson) return ctx.opts.lesson;
    const sid = ctx.session && ctx.session.id;
    return sid ? String(sid).replace(/-(typed|notepad|letters)$/, "") : "tables";
  };

  // ---------- Review walkthrough ----------
  const rv = { steps: [], i: 0, lessonId: "", mode: "review" };

  function renderReview(speak) {
    const s = rv.steps[rv.i]; if (!s) return;
    $("mvCount").textContent = `${rv.i + 1} / ${rv.steps.length}`;
    $("mvStepTitle").textContent = s.title;
    $("mvFacts").innerHTML = (s.facts || (s.say ? [s.say] : [])).map(f => `<li>${esc(f)}</li>`).join("");
    // For normal steps show say as facts if no facts array; hero has facts
    if (!s.facts && s.say) $("mvFacts").innerHTML = `<li>${esc(s.say)}</li>`;
    $("mvVisual").innerHTML = (window.MULT_VIS && s.vis) ? MULT_VIS.render(s.vis) : (s.heroBadge || "");
    $("mvBar").style.width = ((rv.i + 1) / rv.steps.length * 100) + "%";
    $("mvPrev").disabled = rv.i === 0;
    const last = rv.i === rv.steps.length - 1;
    $("mvNext").textContent = last ? (rv.mode === "review" ? "Go to quiz ›" : "Back to review ›") : "Next ›";
    if (window.ANAT) ANAT.setScoreText("");
    if (speak) play(s.audio);
  }

  $("mvPrev").onclick = () => { if (rv.i <= 0) return; if (rv.mode === "component") return HB.goComponent(rv.i - 1); rv.i--; renderReview(true); };
  $("mvNext").onclick = () => {
    const last = rv.i === rv.steps.length - 1;
    if (rv.mode === "component") return last ? HB.goReview() : HB.goComponent(rv.i + 1);
    if (last) return HB.goQuiz();
    rv.i++; renderReview(true);
  };
  $("mvHear").onclick = () => play((rv.steps[rv.i] || {}).audio);

  function buildSteps(S) {
    const steps = (S.review || []).map(x => Object.assign({}, x));
    const h = S.hero;
    if (h) steps.push({ id: "hero", title: h.title || ("Math Hero: " + h.name), say: h.say, facts: h.facts, audio: h.audio, vis: { kind: "badge", text: h.name }, heroBadge: "" });
    return steps;
  }

  HB.registerModule("multWalk", {
    view: "view-multWalk",
    enter(ctx) {
      const id = lessonIdOf(ctx);
      const S = D().sessions[id]; if (!S) return;
      rv.lessonId = id; rv.steps = buildSteps(S);
      $("anatScore").hidden = true;
      const chips = $("mvChips"); chips.innerHTML = "";
      if (ctx.kind === "component") {
        rv.mode = "component"; rv.i = ctx.comp || 0;
        $("mvEyebrow").textContent = S.title + " · steps";
        rv.steps.forEach((c, k) => {
          const b = document.createElement("button"); b.type = "button"; b.className = "comp-chip"; b.textContent = c.title;
          b.onclick = () => HB.goComponent(k); chips.appendChild(b);
        });
      } else {
        rv.mode = "review"; rv.i = ctx.opts.start || 0;
        $("mvEyebrow").textContent = "Review · diagrams + Math Hero";
      }
      chips.hidden = rv.mode !== "component";
      $("mvTitle").textContent = S.title;
      renderReview(true);
    },
    leave() {}
  });

  // ---------- Quiz ----------
  const qz = {
    lessonId: "", mode: "typed", i: 0, score: 0, results: [], order: [], busy: 0,
    pad: null, fallback: false, startedAt: 0, speedMode: false, speedStart: 0, seen: new Set()
  };
  const NQ = 10;
  const SUBMIT = "Submit work", LOOKING = "Looking at your writing…";

  if ($("mvScratch") && HB.ScratchPad) qz.pad = HB.ScratchPad.mount($("mvScratch"), { label: "Scratch pad — write the product" });

  function session() { return D().sessions[qz.lessonId] || {}; }
  function level() { return (HB.multMastery && HB.multMastery.lessonLevel(qz.lessonId)) || 1; }

  function genProblem() {
    const L = level();
    const lid = qz.lessonId;
    const M = HB.multMastery;
    // Avoid repeats within this quiz session via seen keys
    for (let tries = 0; tries < 40; tries++) {
      let p;
      if (lid === "tables" || lid === "patterns") {
        const f = M ? M.pickFact(L) : { a: 1 + Math.floor(Math.random() * 6), b: 1 + Math.floor(Math.random() * 6) };
        p = { kind: "fact", a: f.a, b: f.b, answer: f.a * f.b, q: `${f.a} × ${f.b}`, key: f.a + "x" + f.b,
          audio: (D().tablePrompts || {})[f.a + "x" + f.b] };
      } else if (lid === "area" || lid === "breakapart" || lid === "standard" || lid === "lattice") {
        const maxA = L === 1 ? 25 : L === 2 ? 45 : 80;
        const maxB = L === 1 ? 12 : L === 2 ? 18 : 35;
        const a = 11 + Math.floor(Math.random() * (maxA - 10));
        const b = 3 + Math.floor(Math.random() * (maxB - 2));
        p = { kind: "multi", a, b, answer: a * b, q: `${a} × ${b}`, key: a + "x" + b,
          audio: session().quiz.introAudio };
      } else if (lid === "checking") {
        const a = 6 + Math.floor(Math.random() * (L === 1 ? 8 : 14));
        const b = 6 + Math.floor(Math.random() * (L === 1 ? 8 : 14));
        const correct = a * b;
        const wrong = correct + (Math.random() < 0.5 ? 10 : -10) * (1 + Math.floor(Math.random() * 3));
        const show = Math.random() < 0.55 ? correct : wrong;
        p = { kind: "check", a, b, show, answer: correct, okProduct: show === correct,
          q: `Does ${a} × ${b} = ${show}? (type yes or no)`, key: "chk" + a + "x" + b + "=" + show,
          expectYes: show === correct, audio: session().quiz.introAudio };
      } else { // fun — peasant style ask for product
        const a = 9 + Math.floor(Math.random() * (L === 1 ? 10 : 20));
        const b = 8 + Math.floor(Math.random() * (L === 1 ? 12 : 24));
        p = { kind: "fun", a, b, answer: a * b, q: `${a} × ${b}`, key: a + "x" + b, audio: session().quiz.introAudio };
      }
      if (!qz.seen.has(p.key)) { qz.seen.add(p.key); return p; }
    }
    // fallback
    const a = 2 + Math.floor(Math.random() * 9), b = 2 + Math.floor(Math.random() * 9);
    return { kind: "fact", a, b, answer: a * b, q: `${a} × ${b}`, key: a + "x" + b + Math.random(), audio: (D().tablePrompts || {})[a + "x" + b] };
  }

  function buildQuiz() {
    qz.order = []; qz.seen = new Set();
    for (let i = 0; i < NQ; i++) qz.order.push(genProblem());
  }

  function cur() { return qz.order[qz.i]; }

  function setModeUI() {
    const np = qz.mode === "notepad";
    $("mvqEyebrow").textContent = np ? "Quiz · Notepad (harder)" : "Quiz · Type the product (easier)";
    $("mvTypedWrap").hidden = np && !qz.fallback;
    $("mvScratch").hidden = !np || qz.fallback;
    $("mvFallback").hidden = !np || !qz.fallback;
    $("mvCheck").textContent = np ? (qz.busy ? LOOKING : SUBMIT) : "Check";
  }

  function renderQuiz(speak) {
    const p = cur(); if (!p) return;
    qz.busy = 0; qz.fallback = false; qz.startedAt = Date.now();
    $("mvqCard").hidden = false; $("mvqEnd").hidden = true;
    $("mvqProgress").textContent = `Question ${qz.i + 1} of ${NQ} · Level ${level()}`;
    $("mvqBar").style.width = ((qz.i + 1) / NQ * 100) + "%";
    $("mvqPrompt").textContent = p.kind === "check" ? p.q : p.q + " = ?";
    $("mvqVis").innerHTML = (window.MULT_VIS && (p.kind === "fact" || p.kind === "multi"))
      ? MULT_VIS.render({ kind: "array", r: Math.min(p.a, 6), c: Math.min(p.b, 6) }) : "";
    if (p.a > 6 || p.b > 6) $("mvqVis").innerHTML = "";
    $("mvFeedback").textContent = ""; $("mvFeedback").className = "mq-feedback";
    $("mvReveal").hidden = true;
    $("mvAnswer").value = ""; $("mvFallbackInput").value = "";
    // Critical: showResult() disables inputs after Q1 — always clear that for a fresh unanswered question.
    const answered = !!qz.results[qz.i];
    $("mvAnswer").disabled = answered;
    $("mvFallbackInput").disabled = answered;
    setModeUI();
    if (qz.mode === "notepad") {
      if (!aiReady()) { qz.fallback = true; setModeUI(); }
      if (qz.pad) {
        if (answered && qz.results[qz.i].png) { qz.pad.loadImage(qz.results[qz.i].png); qz.pad.setEnabled(false); }
        else { qz.pad.loadBlank(); qz.pad.setEnabled(!answered); }
      }
      $("mvCheck").disabled = answered;
      if (!answered && qz.fallback) setTimeout(() => { try { $("mvFallbackInput").focus(); } catch (e) {} }, 40);
    } else {
      $("mvCheck").disabled = true; // enabled again when Max types
      if (!answered) setTimeout(() => { try { $("mvAnswer").focus(); } catch (e) {} }, 40);
    }
    $("mvqPrev").disabled = qz.i === 0;
    $("mvqNext").textContent = qz.i === NQ - 1 ? "See results" : "Next";
    $("mvqNext").disabled = !qz.results[qz.i];
    if (window.ANAT) ANAT.setScoreText(`Score: ${qz.score} / ${NQ}`);
    if (qz.results[qz.i]) showResult(p, qz.results[qz.i], false);
    if (speak && !qz.results[qz.i]) {
      const intro = qz.mode === "notepad" ? (session().quiz.introNotepadAudio || session().quiz.introAudio) : session().quiz.introAudio;
      play(qz.i === 0 && !qz.results.length ? intro : (p.audio || intro));
    }
  }

  function normalizeAnswer(raw, p) {
    let s = String(raw || "").trim().toLowerCase().replace(/,/g, "");
    if (p.kind === "check") {
      if (/^(y|yes|true|correct|right)$/.test(s)) return p.expectYes ? String(p.answer) : "__no__";
      if (/^(n|no|false|wrong|incorrect)$/.test(s)) return p.expectYes ? "__no__" : String(p.answer);
      // also allow typing the product
      if (s === String(p.answer) && p.expectYes) return s;
      return s;
    }
    s = s.replace(/[^0-9-]/g, "");
    return s;
  }

  function showResult(p, res, speak) {
    qz.busy = 0;
    $("mvCheck").disabled = true; $("mvCheck").textContent = qz.mode === "notepad" ? SUBMIT : "Check";
    if (qz.pad) qz.pad.setEnabled(false);
    $("mvAnswer").disabled = true; $("mvFallbackInput").disabled = true;
    if (!res.ok) {
      $("mvReveal").hidden = false;
      const read = res.written || res.given || "";
      $("mvReveal").innerHTML = qz.mode === "notepad"
        ? `Correct: <b>${esc(p.answer)}</b>${read ? ` · read: <span class="sp-miss">${esc(read)}</span>` : ""}`
        : `Correct: <b>${esc(p.answer)}</b>`;
    }
    $("mvFeedback").textContent = (res.ok ? "✓ " : "✗ ") + (res.feedback || (res.ok ? "Nice!" : "Not quite."));
    $("mvFeedback").className = "mq-feedback " + (res.ok ? "ok" : "bad");
    $("mvqNext").disabled = false;
    if (speak) {
      const pack = res.ok ? D().cheers : D().wrongs;
      const clip = pack && pack.length ? pack[qz.i % pack.length].audio : null;
      if (clip) play(clip);
    }
  }

  function commit(p, res) {
    const ms = Date.now() - qz.startedAt;
    qz.results[qz.i] = res;
    if (res.ok) qz.score++;
    if (HB.multMastery) {
      HB.multMastery.record({
        lessonId: qz.lessonId, a: p.a, b: p.b, ok: res.ok, ms,
        answer: p.answer, given: res.given
      });
    }
    showResult(p, res, true);
    if (window.ANAT) ANAT.setScoreText(`Score: ${qz.score} / ${NQ}`);
  }

  function gradeTyped() {
    if (qz.results[qz.i]) return;
    const p = cur();
    const raw = qz.fallback ? $("mvFallbackInput").value : $("mvAnswer").value;
    const given = normalizeAnswer(raw, p);
    if (!given) { $("mvFeedback").textContent = "Enter an answer first."; $("mvFeedback").className = "mq-feedback need"; return; }
    let ok;
    if (p.kind === "check") ok = (given === String(p.answer) && p.expectYes) || (given === "__no__" && !p.expectYes) || (given === String(p.answer));
    else ok = given === String(p.answer);
    // For check questions if they typed yes/no mapped to __no__/answer
    if (p.kind === "check" && given === "__no__") ok = !p.expectYes;
    commit(p, { ok, given: raw.trim(), written: raw.trim() });
  }

  function aiCheck() {
    if (qz.results[qz.i] || qz.busy) return;
    const p = cur(), i = qz.i, token = ++qz.busy;
    if (!qz.pad || !qz.pad.hasInk()) {
      $("mvFeedback").textContent = "✎ Write the product on the scratch pad first."; $("mvFeedback").className = "mq-feedback need";
      qz.busy = 0; return;
    }
    const png = qz.pad.toDataURL("image/png");
    $("mvCheck").disabled = true; $("mvCheck").textContent = LOOKING;
    if (qz.pad) qz.pad.setEnabled(false);
    $("mvFeedback").textContent = "👀 " + LOOKING; $("mvFeedback").className = "mq-feedback looking";
    HB.gradeScratch({
      pngDataUrl: png, question: p.q + " (multiplication — find the product)", expected: String(p.answer),
      subject: "Math › Multiplication", quiz: session().title, hideExpected: true, attempt: 1
    }).then(v => {
      if (qz.busy !== token || qz.i !== i) return;
      qz.busy = 0; $("mvCheck").textContent = SUBMIT;
      const read = String(v.written || "").replace(/[^0-9-]/g, "");
      const ok = read ? read === String(p.answer) : !!v.ok;
      if (HB.work) HB.work.save({ subject: "Math › Multiplication", quiz: session().title + " · Notepad", question: p.q, ok, given: read || v.written, answerSummary: String(p.answer), pngDataUrl: png, grader: "ai", written: v.written || "", feedback: v.feedback || "", model: v.model || "" });
      commit(p, { ok, given: read || v.written, written: v.written || read, feedback: v.feedback, png, ai: true });
    }).catch(e => {
      if (qz.busy !== token || qz.i !== i) return;
      qz.busy = 0; $("mvCheck").textContent = SUBMIT; $("mvCheck").disabled = false;
      if (qz.pad) qz.pad.setEnabled(true);
      qz.fallback = true; setModeUI();
      $("mvFeedback").textContent = "⚠ " + ((e && e.message) || "AI unavailable.") + " Type the product below.";
      $("mvFeedback").className = "mq-feedback need";
      $("mvFallbackInput").disabled = false; $("mvFallbackInput").focus();
    });
  }

  function onCheck() {
    if (qz.results[qz.i] || qz.busy) return;
    if (qz.mode !== "notepad" || qz.fallback) return gradeTyped();
    if (!aiReady()) { qz.fallback = true; setModeUI(); return; }
    aiCheck();
  }

  function finish() {
    $("mvqCard").hidden = true; $("mvqEnd").hidden = false;
    const d = (session().quiz.done || [])[Math.min(qz.score, 10)] || { text: `You got ${qz.score} / ${NQ}.` };
    $("mvqEndScore").textContent = `${qz.score} / ${NQ}`;
    $("mvqEndMsg").textContent = d.text + ` · Lesson level: ${level()}`;
    const missed = qz.order.map((p, i) => ({ p, r: qz.results[i] })).filter(x => x.r && !x.r.ok);
    $("mvqMissed").innerHTML = missed.length
      ? "<div class='eyebrow'>Practice these</div>" + missed.map(x => `<li><b>${esc(x.p.q)}</b> = ${x.p.answer} <span class="sp-miss">(you: ${esc(x.r.written || x.r.given || "")})</span></li>`).join("")
      : "";
    // heat mini
    if (HB.multMastery) {
      const hm = HB.multMastery.heatmap();
      let cells = "";
      for (let a = 1; a <= 12; a++) for (let b = 1; b <= 12; b++) {
        const c = hm.grid[a - 1][b - 1];
        cells += `<i class="mv-heat ${c.state}" title="${a}×${b}"></i>`;
      }
      $("mvqHeat").innerHTML = `<div class="eyebrow">Times-table mastery</div><div class="mv-heatgrid">${cells}</div>`;
    }
    if (HB.recordResult) HB.recordResult({
      title: session().title + (qz.mode === "notepad" ? " · Notepad" : " · Typed"),
      subject: "Math", topic: "Multiplication › " + session().title, mode: qz.mode,
      score: qz.score, total: NQ,
      questions: qz.order.map((p, i) => { const r = qz.results[i] || {}; return { q: p.q, given: r.written || r.given || "", answer: String(p.answer), ok: !!r.ok, written: r.written || "" }; }),
      details: qz.order.map((p, i) => `${qz.results[i] && qz.results[i].ok ? "✓" : "✗"} ${p.q}`)
    });
    if (d.audio) play(d.audio);
  }

  $("mvAnswer").addEventListener("input", () => { $("mvCheck").disabled = !$("mvAnswer").value.trim(); });
  $("mvAnswer").addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); onCheck(); } });
  $("mvFallbackInput").addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); onCheck(); } });
  $("mvCheck").onclick = onCheck;
  $("mvReplay").onclick = () => { const p = cur(); if (p) play(p.audio || session().quiz.introAudio); };
  $("mvqPrev").onclick = () => { if (qz.i > 0 && !qz.busy) { qz.i--; renderQuiz(false); } };
  $("mvqNext").onclick = () => { if (qz.busy) return; if (qz.i < NQ - 1) { qz.i++; renderQuiz(true); } else finish(); };
  $("mvqAgain").onclick = () => { qz.i = 0; qz.score = 0; qz.results = []; buildQuiz(); renderQuiz(true); };
  $("mvqReview").onclick = () => HB.goReview();
  $("mvqEmail").onclick = () => HB.emailResults();
  $("mvqHistory").onclick = () => HB.go({ level: "quizHistory" });
  $("mvqMastery").onclick = () => HB.go({ level: "multMastery" });

  HB.registerModule("multQuiz", {
    view: "view-multQuiz",
    enter(ctx) {
      qz.lessonId = lessonIdOf(ctx);
      qz.mode = (ctx.opts && ctx.opts.mode) === "notepad" ? "notepad" : "typed";
      $("mvqTitle").textContent = session().title + (qz.mode === "notepad" ? " · Notepad quiz" : " · Typed quiz");
      $("anatScore").hidden = false;
      if (!qz.pad && $("mvScratch") && HB.ScratchPad) qz.pad = HB.ScratchPad.mount($("mvScratch"), { label: "Scratch pad — write the product" });
      qz.i = 0; qz.score = 0; qz.results = [];
      buildQuiz();
      $("mvAnswer").disabled = false; $("mvFallbackInput").disabled = false;
      renderQuiz(true);
    },
    leave() { qz.busy = 0; }
  });

  // ---------- Mastery panel ----------
  function renderMastery() {
    if (!HB.multMastery) return;
    const hm = HB.multMastery.heatmap();
    let cells = "";
    for (let a = 1; a <= 12; a++) for (let b = 1; b <= 12; b++) {
      const c = hm.grid[a - 1][b - 1];
      cells += `<i class="mv-heat ${c.state}" title="${a}×${b}: ${c.right}/${c.attempts}"></i>`;
    }
    $("mmHeat").innerHTML = `<div class="mv-heatgrid big">${cells}</div>
      <div class="mm-legend"><span class="mm-swatch new"></span> new <span class="mv-heat swatch weak"></span> weak <span class="mv-heat swatch learning"></span> learning <span class="mv-heat swatch mastered"></span> mastered</div>`;
    const lessons = D().order || [];
    $("mmLessons").innerHTML = lessons.map(id => {
      const S = D().sessions[id]; const L = hm.lessons[id] || { level: 1, attempts: 0, right: 0 };
      return `<li><b>${esc(S.title)}</b> · Level ${L.level}/3 · ${L.right}/${L.attempts || 0} correct</li>`;
    }).join("");
    $("mmSpeed").textContent = hm.speedBestMs != null ? `Best speed-round: ${(hm.speedBestMs / 1000).toFixed(1)}s` : "No speed-round best yet.";
  }
  HB.registerModule("multMastery", {
    view: "view-multMastery",
    enter() { renderMastery(); },
    leave() {}
  });
})();
