// Math quiz module ("mathQuiz"): Max solves long division problems himself on an on-screen keypad.
// Data: window.MATH_QUIZ_DATA (build_math_quiz.py). Audio: MP3 via #mqPlayer, always from a tap.
(function () {
  const D = window.MATH_QUIZ_DATA;
  const $ = id => document.getElementById(id);
  const player = $("mqPlayer");
  const st = { i: 0, score: 0, tries: 0, field: "q", vals: { q: "", r: "" }, done: false, answered: [], ink: [], sound: true, last: "", manual: false, busy: 0 };
  // Scratch pad (scratchpad.js): Max writes his work with the pen. Submit work needs ink; with AI grading Ready
  // (ai_grade.js) the drawing is the submission, otherwise both keypad answer fields are required too.
  const sp = HB.ScratchPad.mount($("mqScratch"));
  const INTRO = "Quiz time, Max. Write your work on the scratch pad, enter the quotient and the remainder, then tap Submit work.";
  const NEED_INK = "✎ Write your work on the scratch pad first.";
  const AI_HINT_OFF = "Turn on AI grading in Settings to check handwriting.";
  const SUBMIT = "Submit work", LOOKING = "Looking at your work…";
  // AI mode: the drawing itself is the submission (keypad hidden unless Max taps "Type answer instead").
  const aiMode = () => !!(HB.ai && HB.ai.ready()) && !st.manual;
  function renderMode() {
    const ai = aiMode(), ready = !!(HB.ai && HB.ai.ready());
    $("mqCard").classList.toggle("ai-mode", ai);
    $("mqTypeToggle").hidden = !ready;
    $("mqTypeToggle").textContent = st.manual ? "Let the AI check my writing" : "Type answer instead";
    $("mqAiHint").textContent = ai ? "The AI will read your handwriting — write your final answer (like 12 R 3) on the pad." : ready ? "" : AI_HINT_OFF;
  }

  function play(src) {
    st.last = src || "";
    if (!src || !st.sound) return;
    try { if (window.HB) HB.stopAudio(); player.src = src; player.muted = false;
      const p = player.play(); if (p && p.catch) p.catch(e => console.error("[mathquiz audio]", e)); } catch (e) { console.error(e); }
  }
  function prob() { return D.problems[st.i]; }

  function renderFields() {
    ["q", "r"].forEach(f => {
      const el = $(f === "q" ? "mqQ" : "mqR");
      el.textContent = st.vals[f] || "–";
      el.parentElement.classList.toggle("sel", st.field === f);
      el.parentElement.classList.toggle("empty", !st.vals[f]);
    });
  }
  function setScore() { $("mqScore").textContent = `Score ${st.score} / ${D.problems.length}`; }

  function show(i, speak) {
    st.i = i; st.tries = 0; st.field = "q"; st.vals = { q: "", r: "" }; st.busy = 0; st.manual = false; $("mqCheck").textContent = SUBMIT;
    renderMode();
    const p = prob(), a = st.answered[i];
    $("mqCard").hidden = false; $("mqEnd").hidden = true;
    $("mqProgress").textContent = `Problem ${i + 1} of ${D.problems.length}`;
    $("mqBar").style.width = ((i + 1) / D.problems.length * 100) + "%";
    $("mqDividend").textContent = p.dividend; $("mqDivisor").textContent = p.divisor;
    $("mqHow").hidden = true; $("mqHowSteps").innerHTML = "";
    $("mqPrev").disabled = i === 0;
    if (a) { st.vals = { q: String(p.quotient), r: String(p.remainder) }; lock(a.ok ? "✓ Solved" : "Answer shown", a.ok); sp.loadImage(st.ink[i]); }
    else { sp.loadBlank(); unlock(); $("mqFeedback").textContent = aiMode() ? "Write your work and your final answer on the scratch pad, then tap Submit work." : i === 0 ? INTRO : "Write your work on the scratch pad, enter the quotient and remainder, then tap Submit work."; $("mqFeedback").className = "mq-feedback"; }
    $("mqNext").disabled = !a;
    $("mqNext").textContent = i === D.problems.length - 1 ? "See results" : "Next problem";
    renderFields(); setScore();
    if (speak) play(i === 0 && !a ? D.introAudio : p.askAudio);
  }
  function lock(msg, ok) {
    document.querySelectorAll("#mqPad button").forEach(b => b.disabled = true);
    $("mqCheck").disabled = true; sp.setEnabled(false);
    if (msg) { $("mqFeedback").textContent = msg; $("mqFeedback").className = "mq-feedback " + (ok ? "ok" : "bad"); }
  }
  function unlock() { document.querySelectorAll("#mqPad button").forEach(b => b.disabled = false); $("mqCheck").disabled = false; sp.setEnabled(true); }

  function key(k) {
    const f = st.field;
    if (k === "del") st.vals[f] = st.vals[f].slice(0, -1);
    else if (k === "clr") st.vals[f] = "";
    else if (st.vals[f].length < 3) st.vals[f] = (st.vals[f] + k).replace(/^0+(?=\d)/, "");
    renderFields();
  }

  function check() {
    const p = prob();
    if (st.busy || st.answered[st.i]) return;
    if (!sp.hasInk()) { $("mqFeedback").textContent = NEED_INK; $("mqFeedback").className = "mq-feedback need"; return; }
    if (aiMode()) return aiCheck();
    if (st.vals.q === "" || st.vals.r === "") {
      $("mqFeedback").textContent = "Great work! Now enter your final answer: fill in both the quotient and the remainder, then tap Submit work."; $("mqFeedback").className = "mq-feedback";
      st.field = st.vals.q === "" ? "q" : "r"; renderFields(); return;
    }
    const ok = +st.vals.q === p.quotient && +st.vals.r === p.remainder;
    // graded on the final answer typed on the keypad; the drawing is kept as proof of work
    apply(ok, sp.toDataURL("image/png"), { given: `${+st.vals.q} R ${+st.vals.r}`, grader: "keypad" });
  }

  // AI path: send the drawing; the AI reads Max's handwriting and judges it against the answer key.
  function aiCheck() {
    const p = prob(), i = st.i, token = ++st.busy, png = sp.toDataURL("image/png");
    $("mqCheck").disabled = true; $("mqCheck").textContent = LOOKING; $("mqPrev").disabled = true; sp.setEnabled(false);
    $("mqFeedback").textContent = "👀 " + LOOKING; $("mqFeedback").className = "mq-feedback looking";
    const expected = `${p.quotient} R ${p.remainder}`;
    HB.gradeScratch({ pngDataUrl: png, question: `${p.label} — long division: find the quotient and the remainder`, expected,
      subject: "Math › Division", quiz: "Long division quiz", attempt: st.tries + 1, hideExpected: st.tries === 0 })
      .then(v => { if (st.busy !== token || st.i !== i) return; st.busy = 0; done();
        apply(v.ok, png, { given: v.written, written: v.written, feedback: v.feedback, model: v.model, grader: "ai" }); })
      .catch(e => { if (st.busy !== token || st.i !== i) return; st.busy = 0; done(); unlock();
        // AI unavailable → this problem falls back to the keypad
        st.manual = true; renderMode(); renderFields();
        $("mqFeedback").textContent = `⚠ ${(e && e.message) || "The AI couldn't check this one."} Enter your answer on the keypad, then tap Submit work.`;
        $("mqFeedback").className = "mq-feedback need"; });
    function done() { $("mqCheck").textContent = SUBMIT; $("mqCheck").disabled = false; $("mqPrev").disabled = st.i === 0; }
  }

  // shared result path (keypad or AI): score, cheer / one retry / reveal, saved submission
  function apply(ok, png, x) {
    const p = prob(), ai = x.grader === "ai";
    if (HB.work) HB.work.save({ subject: "Math › Division", quiz: "Long division quiz", question: p.label, ok,
      given: x.given, answerSummary: `${p.quotient} R ${p.remainder}`, attempt: st.tries + 1, pngDataUrl: png,
      grader: x.grader, written: x.written || "", feedback: x.feedback || "", model: x.model || "" });
    if (ok || st.tries > 0) st.ink[st.i] = png;
    if (ok) {
      if (!st.answered[st.i]) st.score++;
      st.answered[st.i] = { ok: true };
      const c = D.cheers[st.i % D.cheers.length];
      st.vals = { q: String(p.quotient), r: String(p.remainder) }; renderFields();
      lock(`✓ ${ai ? x.feedback : c.text} ${p.label} = ${p.quotient} R ${p.remainder}`, true);
      $("mqNext").disabled = false; setScore(); play(c.audio);
    } else if (st.tries === 0) {
      st.tries = 1;
      if (ai) sp.setEnabled(true);   // keep his drawing so he can fix it
      $("mqFeedback").textContent = "✗ " + (ai ? x.feedback + " Fix your work on the pad and tap Submit work again." : D.tryAgain); $("mqFeedback").className = "mq-feedback bad";
      play(D.tryAgainAudio);
    } else {
      st.answered[st.i] = { ok: false };
      st.vals = { q: String(p.quotient), r: String(p.remainder) }; renderFields();
      lock("✗ " + (ai && x.feedback ? x.feedback + " " : "") + p.revealText, false);
      $("mqNext").disabled = false; play(p.revealAudio);
    }
  }

  function howTo() {
    const p = prob();
    $("mqHow").hidden = false;
    $("mqHowSteps").innerHTML = p.steps.map(s => `<li>${s}</li>`).join("");
    play(p.howAudio);
  }

  function finish() {
    const n = D.problems.length, d = D.done[st.score];
    $("mqCard").hidden = true; $("mqEnd").hidden = false;
    $("mqEndScore").textContent = `${st.score} / ${n}`;
    $("mqEndMsg").textContent = d.text;
    if (HB.recordResult) HB.recordResult({ score: st.score, total: n,
      details: D.problems.map((p, k) => `${st.answered[k] && st.answered[k].ok ? "✓" : "✗"} ${p.label} = ${p.quotient} R ${p.remainder}`) });
    $("mqBar").style.width = "100%";
    play(d.audio);
  }

  function reset() {
    st.i = 0; st.score = 0; st.answered = []; st.ink = []; st.last = ""; st.manual = false; st.busy = 0;
    try { player.pause(); } catch (e) {}
  }

  // keypad
  const pad = $("mqPad");
  ["1","2","3","4","5","6","7","8","9","clr","0","del"].forEach(k => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "key" + (k.length > 1 ? " fn" : ""); b.dataset.k = k;
    b.textContent = k === "del" ? "⌫" : k === "clr" ? "C" : k;
    b.setAttribute("aria-label", k === "del" ? "Delete" : k === "clr" ? "Clear" : k);
    b.onclick = () => key(k);
    pad.appendChild(b);
  });
  $("mqQBtn").onclick = () => { st.field = "q"; renderFields(); };
  $("mqRBtn").onclick = () => { st.field = "r"; renderFields(); };
  $("mqCheck").onclick = check;
  $("mqTypeToggle").onclick = () => { if (st.busy) return; st.manual = !st.manual; renderMode();
    if (!st.answered[st.i]) { $("mqFeedback").textContent = aiMode() ? "Write your final answer on the scratch pad, then tap Submit work." : "Enter the quotient and remainder on the keypad, then tap Submit work."; $("mqFeedback").className = "mq-feedback"; } };
  $("mqHowBtn").onclick = howTo;
  $("mqPrev").onclick = () => { if (st.i > 0) show(st.i - 1, true); };
  $("mqNext").onclick = () => { if (st.i < D.problems.length - 1) show(st.i + 1, true); else finish(); };
  $("mqReplay").onclick = () => { if (st.last) play(st.last); };
  $("mqSound").onclick = () => {
    st.sound = !st.sound; $("mqSound").setAttribute("aria-pressed", st.sound ? "true" : "false");
    $("mqSoundLabel").textContent = st.sound ? "Sound on" : "Sound off"; if (!st.sound) player.pause();
  };
  $("mqEmail").onclick = () => HB.emailResults();
  $("mqAgain").onclick = () => { reset(); show(0, true); };
  $("mqReview").onclick = () => HB.goReview();

  HB.registerModule("mathQuiz", {
    view: "view-mathQuiz",
    enter(ctx) { reset(); show((ctx.opts && ctx.opts.start) || 0, true); },
    leave() { reset(); }
  });
})();
