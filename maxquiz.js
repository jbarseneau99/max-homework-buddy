// "maxQuiz" module: Anatomy › Max's Test Topics › Quiz. Mixed question types:
//   mc (tap one), pick (tap N then Check), number (keypad then Check). Data: window.MAX_TOPICS_DATA.quiz.
// Audio goes through window.ANAT.play (shared anatomy player, Sound ON/OFF and "Hear it again").
(function () {
  // opts.set picks a question set from window.QUIZ_SETS (per-system quizzes); default = Max's Test Topics.
  let Q = window.MAX_TOPICS_DATA.quiz;
  const $ = id => document.getElementById(id);
  const st = { i: 0, score: 0, results: [], picked: [], num: "", work: false, set: "", ink: [], manualI: -1, busy: 0 };
  // Work questions (fractions sets frac_*): scratch pad on every question; ink required before grading.
  const pad = HB.ScratchPad.mount($("mxScratch"));
  const NEED_INK = "✎ Write your work on the scratch pad first.";
  const isWorkSet = id => /^frac_/.test(id || "");
  // AI grading (ai_grade.js): when Ready, the drawing is the submission — no keypad / tap needed on work questions.
  const aiReady = () => !!(HB.ai && HB.ai.ready());
  const aiMode = () => st.work && aiReady() && st.manualI !== st.i;
  const SUBMIT = "Submit work", LOOKING = "Looking at your work…";
  function applyMode(q, res) {
    const ai = st.work && (res ? !!res.ai : aiMode());
    $("mxNumWrap").hidden = q.type !== "number" || ai;
    $("mxCheck").hidden = q.type === "mc" && !ai;
    $("mxOpts").classList.toggle("ai-ref", ai);
    $("mxTypeToggle").hidden = !(st.work && aiReady() && !res);
    $("mxTypeToggle").textContent = st.manualI === st.i ? "Let the AI check my writing" : "Type answer instead";
    $("mxAiHint").hidden = !st.work; $("mxAiHint").textContent = st.work && !aiReady() ? "Turn on AI grading in Settings to check handwriting." : "";
    if (st.work && !res) $("mxHint").textContent = ai
      ? "Write your work and your final answer on the scratch pad (the AI reads your handwriting), then tap Submit work."
      : (q.type === "pick" ? `Write your work on the scratch pad, pick ${q.n}, then tap Submit work.` : q.type === "number" ? "Write your work on the scratch pad, type your answer on the keypad, then tap Submit work." : "Write your work on the scratch pad, then tap your answer.");
  }
  function need(msg) { $("mxFeedback").textContent = msg; $("mxFeedback").className = "mq-feedback need"; }
  const play = src => { if (window.ANAT) ANAT.play(src); };
  const n = () => Q.questions.length;
  const setScore = () => { if (window.ANAT) ANAT.setScoreText(`Score: ${st.score} / ${n()}`); };

  function render(speak) {
    const q = Q.questions[st.i], res = st.results[st.i];
    st.picked = []; st.num = ""; st.busy = 0; $("mxCheck").textContent = st.work ? SUBMIT : "Check";
    document.querySelectorAll("#mxPad button").forEach(b => b.disabled = false);
    $("mxCard").hidden = false; $("mxEnd").hidden = true;
    $("mxProgress").textContent = `Question ${st.i + 1} of ${n()}`;
    $("mxBar").style.width = ((st.i + 1) / n() * 100) + "%";
    $("mxQ").textContent = q.q;
    showVis(q.vis);
    $("mxHint").textContent = st.work
      ? (q.type === "pick" ? `Write your work on the scratch pad, pick ${q.n}, then tap Submit work.` : q.type === "number" ? "Write your work on the scratch pad, type your answer on the keypad, then tap Submit work." : "Write your work on the scratch pad, then tap your answer.")
      : (q.type === "pick" ? `Pick ${q.n}, then tap Check.` : q.type === "number" ? "Use the keypad, then tap Check." : "Tap your answer.");
    $("mxScratch").hidden = !st.work;
    if (st.work) { if (res) { pad.loadImage(st.ink[st.i]); pad.setEnabled(false); } else { pad.loadBlank(); pad.setEnabled(true); } }
    $("mxCheck").textContent = st.work ? "Submit work" : "Check";
    const opts = $("mxOpts"); opts.innerHTML = "";
    $("mxNumWrap").hidden = q.type !== "number";
    $("mxCheck").hidden = q.type === "mc";
    if (q.type !== "number") {
      q.options.forEach(o => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "anatomy-option mx-opt"; b.textContent = o; b.dataset.opt = o;
        if (q.optVis && q.optVis[o] && window.FRAC_VIS) { b.classList.add("has-vis"); b.innerHTML = FRAC_VIS.render(q.optVis[o]) + `<span>${o}</span>`; }
        b.onclick = () => { if (aiMode()) return; if (q.type !== "mc") return togglePick(o, b); if (st.work && !pad.hasInk()) return need(NEED_INK); grade([o]); };
        opts.appendChild(b);
      });
    }
    renderNum();
    $("mxFeedback").textContent = ""; $("mxFeedback").className = "mq-feedback";
    $("mxPrev").disabled = st.i === 0;
    $("mxNext").textContent = st.i === n() - 1 ? "See results" : "Next question";
    $("mxNext").disabled = !res;
    $("mxCheck").disabled = !st.work;
    applyMode(q, res);
    if (res) showResult(q, res, false);
    setScore();
    if (speak && !res) play(st.i === 0 && st.results.length === 0 ? Q.introAudio : q.qAudio);
  }
  // Optional visual (Equivalent Fractions): q.vis with the question, q.after once it is answered. Drawn by window.FRAC_VIS.
  function showVis(spec) { const h = spec && window.FRAC_VIS ? FRAC_VIS.render(spec) : ""; $("mxVis").innerHTML = h; $("mxVis").hidden = !h; }
  function renderNum() { $("mxNum").textContent = st.num || "–"; $("mxNum").parentElement.classList.toggle("empty", !st.num); }

  function togglePick(o, b) {
    if (st.results[st.i]) return;
    const q = Q.questions[st.i], k = st.picked.indexOf(o);
    if (k >= 0) st.picked.splice(k, 1); else if (st.picked.length < q.n) st.picked.push(o);
    $("mxOpts").querySelectorAll("button").forEach(x => x.classList.toggle("picked", st.picked.includes(x.dataset.opt)));
    $("mxCheck").disabled = !st.work && st.picked.length !== q.n;
  }

  const keyOf = q => q.type === "mc" ? q.answer : q.type === "pick" ? q.answers.join(", ") : String(q.answer);
  // ai = { ok, written, feedback, model, png } when the AI graded the drawing; otherwise graded on the tapped / typed answer
  function grade(given, ai) {
    if (st.results[st.i]) return;
    const q = Q.questions[st.i];
    let ok;
    if (ai) ok = !!ai.ok;
    else if (q.type === "mc") ok = given[0] === q.answer;
    else if (q.type === "pick") ok = given.length === q.answers.length && q.answers.every(a => given.includes(a));
    else ok = Number(given[0]) === q.answer;
    const res = { ok, given, ai: ai ? { written: ai.written, feedback: ai.feedback } : null };
    st.results[st.i] = res;
    if (st.work) {   // the drawing is saved with every work submission
      const png = (ai && ai.png) || pad.toDataURL("image/png"); st.ink[st.i] = png; pad.setEnabled(false);
      if (HB.work) HB.work.save({ subject: "Math › Fractions", quiz: Q.title || st.set, question: q.q, ok, given: given.join(", "), answerSummary: keyOf(q), pngDataUrl: png,
        grader: ai ? "ai" : "keypad", written: ai ? ai.written : "", feedback: ai ? ai.feedback : "", model: ai ? ai.model : "" });
    }
    if (ok) st.score++;
    showResult(q, res, true);
    setScore();
  }

  function showResult(q, res, speak) {
    const correct = q.type === "mc" ? [q.answer] : q.type === "pick" ? q.answers : [];
    $("mxOpts").querySelectorAll("button").forEach(b => {
      b.disabled = true;
      if (correct.includes(b.dataset.opt)) b.classList.add("correct");
      else if (res.given.includes(b.dataset.opt)) b.classList.add("incorrect");
    });
    if (q.type === "number") { st.num = String(res.given[0]); renderNum(); }
    if (q.after) showVis(q.after);
    document.querySelectorAll("#mxPad button").forEach(b => b.disabled = true);
    $("mxCheck").disabled = true;
    const ans = q.type === "number" ? ` (Answer: ${q.answer})` : q.type === "pick" && res.ai ? ` (Answer: ${q.answers.join(", ")})` : q.type === "mc" && res.ai ? ` (Answer: ${q.answer})` : "";
    $("mxFeedback").textContent = res.ai
      ? (res.ok ? "✓ " + res.ai.feedback : "✗ " + res.ai.feedback + " " + q.wrongText + ans)
      : (res.ok ? "✓ " + q.rightText : "✗ " + q.wrongText + (q.type === "number" ? ` (Answer: ${q.answer})` : ""));
    $("mxFeedback").className = "mq-feedback " + (res.ok ? "ok" : "bad");
    $("mxNext").disabled = false;
    if (speak) play(res.ok ? q.rightAudio : q.wrongAudio);
  }

  function finish() {
    const d = Q.done[st.score];
    $("mxCard").hidden = true; $("mxEnd").hidden = false;
    $("mxEndScore").textContent = `${st.score} / ${n()}`;
    $("mxEndMsg").textContent = d.text;
    if (HB.recordResult) HB.recordResult({ score: st.score, total: n(),
      title: Q.title || HB.pathTitle(), subject: (HB.state.subject && HB.state.subject.title) || "", topic: [HB.state.subtopic, HB.state.session].filter(Boolean).map(x => x.title).join(" › "),
      mode: st.work ? (aiReady() ? "scratch+ai" : "scratch") : "standard",
      questions: Q.questions.map((q, i) => { const r = st.results[i] || {}; const ans = q.type === "mc" ? q.answer : q.type === "pick" ? (q.answers || []).join(", ") : String(q.answer);
        const given = r.ai && r.ai.written ? r.ai.written : (Array.isArray(r.given) ? r.given.join(", ") : (r.given || ""));
        return { q: q.q, given, answer: ans, ok: !!r.ok, written: (r.ai && r.ai.written) || "" }; }),
      details: Q.questions.map((q, i) => `${st.results[i] && st.results[i].ok ? "✓" : "✗"} ${q.q}`) });
    $("mxBar").style.width = "100%";
    const missed = Q.questions.map((q, i) => ({ q, r: st.results[i] })).filter(x => x.r && !x.r.ok);
    $("mxMissed").innerHTML = missed.length ? "<div class='eyebrow'>Review these</div>" + missed.map(x => `<li>${x.q.explain}</li>`).join("") : "";
    play(d.audio);
  }

  function reset() { st.i = 0; st.score = 0; st.results = []; st.ink = []; st.manualI = -1; st.busy = 0; }

  function aiCheck(q) {
    const i = st.i, token = ++st.busy, png = pad.toDataURL("image/png");
    $("mxCheck").disabled = true; $("mxCheck").textContent = LOOKING; $("mxPrev").disabled = true; pad.setEnabled(false);
    $("mxFeedback").textContent = "👀 " + LOOKING; $("mxFeedback").className = "mq-feedback looking";
    HB.gradeScratch({ pngDataUrl: png, question: q.q, expected: q.type === "pick" ? q.answers.join(" and ") : String(q.answer),
      choices: q.type === "number" ? null : q.options, subject: "Math › Fractions", quiz: Q.title || st.set, attempt: 1 })
      .then(v => { if (st.busy !== token || st.i !== i) return; st.busy = 0; $("mxCheck").textContent = SUBMIT; $("mxPrev").disabled = st.i === 0;
        grade([v.written], { ...v, png }); })
      .catch(e => { if (st.busy !== token || st.i !== i) return; st.busy = 0;
        $("mxCheck").textContent = SUBMIT; $("mxCheck").disabled = false; $("mxPrev").disabled = st.i === 0; pad.setEnabled(true);
        st.manualI = st.i; applyMode(q, null);   // AI unavailable → this question falls back to the keypad / tap
        need(`⚠ ${(e && e.message) || "The AI couldn't check this one."} ${q.type === "number" ? "Type your answer on the keypad" : q.type === "pick" ? `Tap ${q.n} answers` : "Tap your answer"}, then Submit work.`); });
  }

  ["1","2","3","4","5","6","7","8","9","clr","0","del"].forEach(k => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "key" + (k.length > 1 ? " fn" : ""); b.dataset.k = k;
    b.textContent = k === "del" ? "⌫" : k === "clr" ? "C" : k;
    b.onclick = () => {
      if (k === "del") st.num = st.num.slice(0, -1); else if (k === "clr") st.num = "";
      else if (st.num.length < 4) st.num = (st.num + k).replace(/^0+(?=\d)/, "");
      renderNum(); $("mxCheck").disabled = !st.work && !st.num;
    };
    $("mxPad").appendChild(b);
  });
  $("mxCheck").onclick = () => {
    const q = Q.questions[st.i];
    if (st.results[st.i] || st.busy) return;
    if (st.work) {
      if (!pad.hasInk()) return need(NEED_INK);
      if (aiMode()) return aiCheck(q);
      if (q.type === "pick" && st.picked.length !== q.n) return need(`Great work! Now tap ${q.n} answers, then Submit work.`);
      if (q.type === "number" && !st.num) return need("Great work! Now type your final answer on the keypad, then tap Submit work.");
      if (q.type === "mc") return need("Great work! Now tap your answer.");
    }
    if (q.type === "pick" && st.picked.length === q.n) grade(st.picked.slice());
    if (q.type === "number" && st.num) grade([st.num]);
  };
  $("mxTypeToggle").onclick = () => { if (st.busy || st.results[st.i]) return; const q = Q.questions[st.i];
    st.manualI = st.manualI === st.i ? -1 : st.i; st.picked = []; $("mxOpts").querySelectorAll("button").forEach(x => x.classList.remove("picked"));
    applyMode(q, null); $("mxFeedback").textContent = ""; $("mxFeedback").className = "mq-feedback"; };
  $("mxPrev").onclick = () => { if (st.i > 0) { st.i--; render(false); } };
  $("mxNext").onclick = () => { if (st.i < n() - 1) { st.i++; render(true); } else finish(); };
  $("mxEmail").onclick = () => HB.emailResults();
  $("mxAgain").onclick = () => { reset(); document.querySelectorAll("#mxPad button").forEach(b => b.disabled = false); render(true); };
  $("mxReview").onclick = () => HB.goReview();

  HB.registerModule("maxQuiz", {
    view: "view-maxQuiz",
    enter(ctx) {
      Q = (ctx.opts.set && window.QUIZ_SETS && QUIZ_SETS[ctx.opts.set]) || window.MAX_TOPICS_DATA.quiz;
      st.set = ctx.opts.set || ""; st.work = isWorkSet(st.set) && Q !== window.MAX_TOPICS_DATA.quiz;
      $("mxTitle").textContent = Q.title || "Max's test topics · quiz";
      $("anatScore").hidden = false; reset(); document.querySelectorAll("#mxPad button").forEach(b => b.disabled = false); render(true); },
    leave() { reset(); }
  });
})();
