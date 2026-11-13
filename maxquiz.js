// "maxQuiz" module: the shared quiz engine (Anatomy, Social Studies, Fractions, Spelling word work).
//   mc (tap one), tf (True / False), pick (tap N then Check), number (keypad then Check),
//   plus school-test types from quiz_types.js: wordbank, match, inline (circle the word), sentence (AI-graded / self-check).
//   number questions with `steps` are show-your-work: in Notepad mode the AI grades the steps and the answer separately.
// Points: every question is worth HB.QT.pts(q) (wordbank/match/inline = 1 per blank, sentence = rubric points); half marks allowed.
// Audio goes through window.ANAT.play (shared anatomy player, Sound ON/OFF and "Hear it again").
(function () {
  let Q = window.MAX_TOPICS_DATA.quiz;
  const $ = id => document.getElementById(id);
  const QT = HB.QT;
  const st = { i: 0, score: 0, results: [], picked: [], num: "", work: false, set: "", ink: [], manualI: -1, busy: 0, forceTyped: false, forceNotepad: false,
    ans: null, padQ: false, sentPad: {} };
  const pad = HB.ScratchPad.mount($("mxScratch"));
  const NEED_INK = "✎ Write your work on the scratch pad first.";
  const isWorkSet = id => { if (st.forceTyped) return false; if (st.forceNotepad) return true; return /^frac_/.test(id || ""); };
  const aiReady = () => !!(HB.ai && HB.ai.ready());
  const isSentence = q => q.type === "sentence";
  const isRich = q => QT.isRich(q);
  const isChoice = q => q.type === "mc" || q.type === "tf";
  const optsOf = q => q.type === "tf" ? ["True", "False"] : (q.options || []);
  // does this question use the scratch pad? math types in Notepad mode; sentence when Notepad mode or Max switched to handwriting
  const usesPad = q => isSentence(q) ? (st.work || !!st.sentPad[st.i]) : (!isRich(q) && st.work);
  const aiMode = () => { const q = Q.questions[st.i]; return st.padQ && !isSentence(q) && aiReady() && st.manualI !== st.i; };
  const SUBMIT = "Submit work", LOOKING = "Looking at your work…";
  const total = () => Q.questions.reduce((a, q) => a + QT.pts(q), 0);
  const subj = () => Q.subject || (/^frac_/.test(st.set) ? "Math › Fractions" : (HB.state.subject && HB.state.subject.title) || "");
  const LABEL = { tf: "True or false?", wordbank: "Word bank · each word is used once", match: "Matching · tap the letter for each term",
    inline: "Circle the correct word", sentence: "Answer in a complete sentence" };

  function hintFor(q) {
    if (q.type === "wordbank") return "Tap a blank, then tap a word from the bank. Tap a filled blank twice to put the word back. Then tap Check.";
    if (q.type === "match") return "Tap the letter that matches each term. Each letter is used once. Then tap Check.";
    if (q.type === "inline") return "Tap the correct word in each group, then tap Check.";
    if (isSentence(q)) return st.padQ
      ? "Write your answer on the notepad in a complete sentence, then tap Check." + (aiReady() ? " The AI reads your handwriting." : " You'll check it against a model answer.")
      : "Type your answer in a complete sentence, then tap Check." + (aiReady() ? " The AI marks your ideas." : " You'll check it against a model answer.");
    if (st.padQ && aiMode()) return q.steps ? "Show your work: write each step AND your final answer on the scratch pad, then tap Submit work. The AI checks both."
      : "Write your work and your final answer on the scratch pad (the AI reads your handwriting), then tap Submit work.";
    if (st.padQ) return q.type === "pick" ? `Write your work on the scratch pad, pick ${q.n}, then tap Submit work.` : q.type === "number"
      ? (q.steps ? "Show your work on the scratch pad, type your final answer on the keypad, then tap Submit work." : "Write your work on the scratch pad, type your answer on the keypad, then tap Submit work.")
      : "Write your work on the scratch pad, then tap your answer.";
    return q.type === "pick" ? `Pick ${q.n}, then tap Check.` : q.type === "number" ? "Use the keypad, then tap Check." : "Tap your answer.";
  }
  function applyMode(q, res) {
    const ai = st.padQ && !isSentence(q) && (res ? !!res.ai : aiMode());
    $("mxNumWrap").hidden = q.type !== "number" || ai;
    $("mxCheck").hidden = isChoice(q) && !ai && !st.padQ;
    if (isChoice(q) && st.padQ && !ai) $("mxCheck").hidden = true;
    $("mxOpts").classList.toggle("ai-ref", ai);
    $("mxTypeToggle").hidden = !(st.padQ && !isSentence(q) && aiReady() && !res);
    $("mxTypeToggle").textContent = st.manualI === st.i ? "Let the AI check my writing" : "Type answer instead";
    $("mxPadToggle").hidden = !(isSentence(q) && !st.work && !res);
    $("mxPadToggle").textContent = st.sentPad[st.i] ? "⌨ Type it instead" : "✎ Write it on the notepad instead";
    $("mxAiHint").hidden = !(st.padQ || isSentence(q));
    $("mxAiHint").textContent = (st.padQ || isSentence(q)) && !aiReady() ? "Turn on AI grading in Settings to have the AI check your writing." : "";
    if (!res) $("mxHint").textContent = hintFor(q);
  }
  function need(msg) { $("mxFeedback").textContent = msg; $("mxFeedback").className = "mq-feedback need"; }
  const play = src => { if (window.ANAT && src) ANAT.play(src); };
  const n = () => Q.questions.length;
  const setScore = () => { if (window.ANAT) ANAT.setScoreText(`Score: ${QT.fmt(st.score)} / ${total()}`); };

  function render(speak) {
    const q = Q.questions[st.i], res = st.results[st.i];
    st.picked = []; st.num = ""; st.busy = 0; st.padQ = usesPad(q);
    document.querySelectorAll("#mxPad button").forEach(b => b.disabled = false);   // Q2+ fix: always re-enable inputs
    $("mxCheck").disabled = false;
    $("mxCard").hidden = false; $("mxEnd").hidden = true;
    $("mxProgress").textContent = `Question ${st.i + 1} of ${n()}` + (QT.pts(q) > 1 ? ` · ${QT.pts(q)} marks` : "");
    $("mxBar").style.width = ((st.i + 1) / n() * 100) + "%";
    $("mxKind").textContent = LABEL[q.type] || (q.steps ? "Show your work" : ""); $("mxKind").hidden = !$("mxKind").textContent;
    $("mxQ").textContent = q.q;
    showVis(q.vis);
    $("mxScratch").hidden = !st.padQ;
    if (st.padQ) { if (res) { pad.loadImage(st.ink[st.i]); pad.setEnabled(false); } else { pad.loadBlank(); pad.setEnabled(true); } }
    $("mxCheck").textContent = st.padQ && !isSentence(q) ? SUBMIT : "Check";
    const opts = $("mxOpts"); opts.innerHTML = ""; opts.hidden = isRich(q);
    $("mxNumWrap").hidden = q.type !== "number";
    if (!isRich(q) && q.type !== "number") {
      optsOf(q).forEach(o => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "anatomy-option mx-opt" + (q.type === "tf" ? " mx-tf" : ""); b.textContent = o; b.dataset.opt = o;
        if (q.optVis && q.optVis[o] && window.FRAC_VIS) { b.classList.add("has-vis"); b.innerHTML = FRAC_VIS.render(q.optVis[o]) + `<span>${o}</span>`; }
        b.onclick = () => { if (aiMode()) return; if (!isChoice(q)) return togglePick(o, b); if (st.padQ && !pad.hasInk()) return need(NEED_INK); grade([o]); };
        opts.appendChild(b);
      });
    }
    // rich question UI
    const rich = $("mxRich");
    if (isRich(q)) {
      st.ans = QT.render(q, rich, () => { if ($("mxFeedback").classList.contains("need")) { $("mxFeedback").textContent = ""; $("mxFeedback").className = "mq-feedback"; } });
      if (isSentence(q) && st.padQ) rich.hidden = true;
    } else { rich.innerHTML = ""; rich.hidden = true; st.ans = null; }
    renderNum();
    $("mxFeedback").textContent = ""; $("mxFeedback").className = "mq-feedback";
    $("mxSelf").innerHTML = "";
    $("mxPrev").disabled = st.i === 0;
    $("mxNext").textContent = st.i === n() - 1 ? "See results" : "Next question";
    $("mxNext").disabled = !res;
    if (!st.padQ && !isRich(q)) $("mxCheck").disabled = true;   // typed mc/pick/number: enabled once something is chosen
    applyMode(q, res);
    if (res) showResult(q, res, false);
    setScore();
    if (speak && !res) play(st.i === 0 && st.results.length === 0 ? Q.introAudio : q.qAudio);
  }
  function showVis(spec) { const h = spec && window.FRAC_VIS ? FRAC_VIS.render(spec) : ""; $("mxVis").innerHTML = h; $("mxVis").hidden = !h; }
  function renderNum() { $("mxNum").textContent = st.num || "–"; $("mxNum").parentElement.classList.toggle("empty", !st.num); }

  function togglePick(o, b) {
    if (st.results[st.i]) return;
    const q = Q.questions[st.i], k = st.picked.indexOf(o);
    if (k >= 0) st.picked.splice(k, 1); else if (st.picked.length < q.n) st.picked.push(o);
    $("mxOpts").querySelectorAll("button").forEach(x => x.classList.toggle("picked", st.picked.includes(x.dataset.opt)));
    $("mxCheck").disabled = !st.padQ && st.picked.length !== q.n;
  }

  const keyOf = q => QT.key(q) || (isChoice(q) ? q.answer : q.type === "pick" ? q.answers.join(", ") : String(q.answer));
  function saveWork(q, res, png) {
    st.ink[st.i] = png; pad.setEnabled(false);
    if (HB.work) HB.work.save({ subject: subj(), quiz: Q.title || st.set, question: q.q, ok: res.ok, given: (res.given || []).join(", "), answerSummary: keyOf(q), pngDataUrl: png,
      grader: res.grader || (res.ai ? "ai" : "keypad"), written: res.ai ? res.ai.written : "", feedback: res.ai ? res.ai.feedback : "", model: res.ai ? res.ai.model : "" });
  }
  // classic types. ai = { ok, written, feedback, model, png, answerOk?, stepsOk? } when the AI graded the drawing
  function grade(given, ai) {
    if (st.results[st.i]) return;
    const q = Q.questions[st.i];
    let ok, earned;
    if (ai) {
      if (ai.stepsOk != null) { earned = (ai.answerOk ? 0.5 : 0) + (ai.stepsOk ? 0.5 : 0); ok = ai.answerOk && ai.stepsOk; }
      else { ok = !!ai.ok; earned = ok ? 1 : 0; }
    } else {
      if (isChoice(q)) ok = given[0] === q.answer;
      else if (q.type === "pick") ok = given.length === q.answers.length && q.answers.every(a => given.includes(a));
      else ok = Number(given[0]) === q.answer;
      earned = ok ? 1 : 0;
    }
    const res = { ok, earned, pts: 1, given, ai: ai ? { written: ai.written, feedback: ai.feedback, model: ai.model, stepsOk: ai.stepsOk, answerOk: ai.answerOk } : null };
    st.results[st.i] = res;
    if (st.padQ) saveWork(q, res, (ai && ai.png) || pad.toDataURL("image/png"));
    st.score += earned;
    showResult(q, res, true); setScore();
  }
  function gradeRich() {
    const q = Q.questions[st.i]; if (st.results[st.i]) return;
    const r = QT.grade(q, st.ans); const res = { ...r, grader: "auto" };
    st.results[st.i] = res; st.score += res.earned;
    showResult(q, res, true); setScore();
  }
  function finishSentence(q, met, complete, extra) {
    const pts = QT.pts(q), earned = QT.sentencePoints(q, met, complete);
    const res = { ok: earned === pts, earned, pts, met, complete, text: st.ans ? st.ans.text : "", given: [extra.written || (st.ans && st.ans.text) || "(handwritten)"],
      grader: extra.grader, ai: extra.ai || null };
    st.results[st.i] = res; st.score += earned;
    if (st.padQ) saveWork(q, res, extra.png || pad.toDataURL("image/png"));
    showResult(q, res, true); setScore();
  }
  function checkSentence(q) {
    const usePad = st.padQ;
    if (usePad ? !pad.hasInk() : !QT.complete(q, st.ans)) return need(usePad ? "✎ Write your sentence on the notepad first." : "✎ Write a full sentence first (at least a few words).");
    const png = usePad ? pad.toDataURL("image/png") : null;
    const self = () => {
      $("mxCheck").hidden = true; if (usePad) pad.setEnabled(false); else if (st.ans.ta) st.ans.ta.disabled = true;
      $("mxPadToggle").hidden = true;
      QT.selfCheck(q, $("mxSelf"), v => finishSentence(q, v.met, v.complete, { grader: "self", png }));
    };
    if (!aiReady()) { need("No AI key in Settings, so check your own answer against the model answer below."); return self(); }
    const i = st.i, token = ++st.busy;
    $("mxCheck").disabled = true; $("mxCheck").textContent = "Reading your answer…"; $("mxPrev").disabled = true;
    if (usePad) pad.setEnabled(false); else if (st.ans.ta) st.ans.ta.disabled = true;
    $("mxFeedback").textContent = "👀 Reading your answer…"; $("mxFeedback").className = "mq-feedback looking";
    HB.gradeSentence({ text: usePad ? "" : st.ans.text, pngDataUrl: png, question: q.q, rubric: q.rubric, model: q.model, subject: subj(), quiz: Q.title || st.set })
      .then(v => { if (st.busy !== token || st.i !== i) return; st.busy = 0; $("mxCheck").textContent = "Check"; $("mxPrev").disabled = st.i === 0;
        finishSentence(q, v.ideas, v.complete, { grader: "ai", written: v.written, png, ai: { written: v.written, feedback: v.feedback, model: v.model } }); })
      .catch(e => { if (st.busy !== token || st.i !== i) return; st.busy = 0; $("mxCheck").textContent = "Check"; $("mxPrev").disabled = st.i === 0;
        need(`⚠ ${(e && e.message) || "The AI couldn't check this one."} Check your own answer against the model answer below.`); self(); });
  }

  function showResult(q, res, speak) {
    const fb = $("mxFeedback");
    if (isRich(q)) {
      QT.showResult(q, res, $("mxRich"));
      $("mxCheck").hidden = true; $("mxPadToggle").hidden = true;
      if (isSentence(q)) {
        if (st.padQ) pad.setEnabled(false);
        const tick = (q.rubric || []).map((r, k) => `${res.met && res.met[k] ? "✓" : "✗"} ${r.idea}`).join("  ·  ");
        const html = `<div class="qt-self done"><div class="eyebrow">${res.grader === "ai" ? "AI marked" : res.grader === "self" ? "You marked" : "Marked"} · ${QT.fmt(res.earned)} / ${res.pts}</div>` +
          (res.ai && res.ai.written && st.padQ ? `<p class="qt-small"><b>The AI read:</b> ${esc(res.ai.written)}</p>` : "") +
          `<p class="qt-small">${esc(tick)}</p><p class="qt-small">${res.complete ? "✓ Complete sentence" : "✗ Not a complete sentence (−½)"}</p>` +
          `<p class="qt-model"><b>Model answer:</b> ${esc(q.model)}</p></div>`;
        $("mxSelf").innerHTML = html;
      }
      const part = res.earned > 0 && !res.ok;
      fb.textContent = (res.ok ? "✓ " : part ? "◐ " : "✗ ") + `${QT.fmt(res.earned)} / ${res.pts}. ` +
        (res.ai && res.ai.feedback ? res.ai.feedback + " " : "") + (res.ok ? q.rightText : q.wrongText);
      fb.className = "mq-feedback " + (res.ok ? "ok" : "bad");
    } else {
      const correct = isChoice(q) ? [q.answer] : q.type === "pick" ? q.answers : [];
      $("mxOpts").querySelectorAll("button").forEach(b => {
        b.disabled = true;
        if (correct.includes(b.dataset.opt)) b.classList.add("correct");
        else if (res.given.includes(b.dataset.opt)) b.classList.add("incorrect");
      });
      if (q.type === "number") { st.num = res.ai ? "" : String(res.given[0]); renderNum(); }
      document.querySelectorAll("#mxPad button").forEach(b => b.disabled = true);
      $("mxCheck").disabled = true;
      const ans = q.type === "number" ? ` (Answer: ${q.answer})` : q.type === "pick" && res.ai ? ` (Answer: ${q.answers.join(", ")})` : isChoice(q) && res.ai ? ` (Answer: ${q.answer})` : "";
      const work = q.steps ? ` Work: ${q.steps}` : "";
      const part = res.earned > 0 && !res.ok;
      fb.textContent = res.ai
        ? (res.ok ? "✓ " + res.ai.feedback : (part ? "◐ ½ mark. " : "✗ ") + res.ai.feedback + " " + q.wrongText + ans + work)
        : (res.ok ? "✓ " + q.rightText + work : "✗ " + q.wrongText + (q.type === "number" ? ` (Answer: ${q.answer})` : "") + work);
      fb.className = "mq-feedback " + (res.ok ? "ok" : "bad");
    }
    if (q.after) showVis(q.after);
    $("mxTypeToggle").hidden = true;
    $("mxNext").disabled = false;
    if (speak) play(res.ok ? q.rightAudio : q.wrongAudio);
  }
  const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

  function doneFor(score, tot) {
    if (Q.done && Q.done.length === tot + 1 && Number.isInteger(score)) return Q.done[score];
    const T = Q.doneTiers || {}, pct = tot ? score / tot : 0;
    const t = pct >= 1 ? T.perfect : pct >= 0.8 ? T.good : T.review;
    const msg = `You got ${QT.fmt(score)} out of ${tot}. ` + (pct >= 1 ? "Perfect score!" : pct >= 0.8 ? "Nice work." : "Run through the review again, then have another go.");
    return { text: msg, audio: t && t.audio };
  }
  function finish() {
    const tot = total(), d = doneFor(st.score, tot);
    $("mxCard").hidden = true; $("mxEnd").hidden = false;
    $("mxEndScore").textContent = `${QT.fmt(st.score)} / ${tot}`;
    $("mxEndMsg").textContent = d.text;
    if (HB.recordResult) HB.recordResult({ score: st.score, total: tot,
      title: Q.title || HB.pathTitle(), subject: (HB.state.subject && HB.state.subject.title) || "", topic: [HB.state.subtopic, HB.state.session].filter(Boolean).map(x => x.title).join(" › "),
      mode: st.work ? (aiReady() ? "scratch+ai" : "scratch") : "standard",
      questions: Q.questions.map((q, i) => { const r = st.results[i] || {};
        const given = r.ai && r.ai.written ? r.ai.written : (Array.isArray(r.given) ? r.given.join(", ") : (r.given || ""));
        return { q: q.q, type: q.type + (q.steps ? "+work" : ""), given, answer: keyOf(q), ok: !!r.ok, earned: r.earned || 0, pts: r.pts || QT.pts(q),
          grader: r.grader || (r.ai ? "ai" : ""), written: (r.ai && r.ai.written) || "", feedback: (r.ai && r.ai.feedback) || "" }; }),
      details: Q.questions.map((q, i) => { const r = st.results[i]; const p = QT.pts(q);
        return `${r && r.ok ? "✓" : r && r.earned ? "◐" : "✗"} ${q.q}${p > 1 || (r && r.earned % 1) ? ` (${QT.fmt(r ? r.earned : 0)}/${p})` : ""}`; }) });
    $("mxBar").style.width = "100%";
    const missed = Q.questions.map((q, i) => ({ q, r: st.results[i] })).filter(x => x.r && !x.r.ok);
    $("mxMissed").innerHTML = missed.length ? "<div class='eyebrow'>Review these</div>" + missed.map(x => `<li>${esc(x.q.explain)}</li>`).join("") : "";
    play(d.audio);
  }

  function reset() { st.i = 0; st.score = 0; st.results = []; st.ink = []; st.manualI = -1; st.busy = 0; st.sentPad = {}; }

  function aiCheck(q) {
    const i = st.i, token = ++st.busy, png = pad.toDataURL("image/png");
    $("mxCheck").disabled = true; $("mxCheck").textContent = LOOKING; $("mxPrev").disabled = true; pad.setEnabled(false);
    $("mxFeedback").textContent = "👀 " + LOOKING; $("mxFeedback").className = "mq-feedback looking";
    HB.gradeScratch({ pngDataUrl: png, question: q.q, expected: q.type === "pick" ? q.answers.join(" and ") : String(q.answer),
      choices: q.type === "number" ? null : optsOf(q), subject: subj(), quiz: Q.title || st.set, attempt: 1,
      kind: q.steps ? "showwork" : "", steps: q.steps || "" })
      .then(v => { if (st.busy !== token || st.i !== i) return; st.busy = 0; $("mxCheck").textContent = SUBMIT; $("mxPrev").disabled = st.i === 0;
        grade([v.written], { ...v, png }); })
      .catch(e => { if (st.busy !== token || st.i !== i) return; st.busy = 0;
        $("mxCheck").textContent = SUBMIT; $("mxCheck").disabled = false; $("mxPrev").disabled = st.i === 0; pad.setEnabled(true);
        st.manualI = st.i; applyMode(q, null);
        need(`⚠ ${(e && e.message) || "The AI couldn't check this one."} ${q.type === "number" ? "Type your answer on the keypad" : q.type === "pick" ? `Tap ${q.n} answers` : "Tap your answer"}, then Submit work.`); });
  }

  ["1","2","3","4","5","6","7","8","9","clr","0","del"].forEach(k => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "key" + (k.length > 1 ? " fn" : ""); b.dataset.k = k;
    b.textContent = k === "del" ? "⌫" : k === "clr" ? "C" : k;
    b.onclick = () => {
      if (k === "del") st.num = st.num.slice(0, -1); else if (k === "clr") st.num = "";
      else if (st.num.length < 4) st.num = (st.num + k).replace(/^0+(?=\d)/, "");
      renderNum(); $("mxCheck").disabled = !st.padQ && !st.num;
    };
    $("mxPad").appendChild(b);
  });
  $("mxCheck").onclick = () => {
    const q = Q.questions[st.i];
    if (st.results[st.i] || st.busy) return;
    if (isSentence(q)) return checkSentence(q);
    if (isRich(q)) { if (!QT.complete(q, st.ans)) return need(q.type === "wordbank" ? "Fill every blank first." : q.type === "match" ? "Pick a letter for every term first." : "Tap one word in every group first."); return gradeRich(); }
    if (st.padQ) {
      if (!pad.hasInk()) return need(NEED_INK);
      if (aiMode()) return aiCheck(q);
      if (q.type === "pick" && st.picked.length !== q.n) return need(`Great work! Now tap ${q.n} answers, then Submit work.`);
      if (q.type === "number" && !st.num) return need("Great work! Now type your final answer on the keypad, then tap Submit work.");
      if (isChoice(q)) return need("Great work! Now tap your answer.");
    }
    if (q.type === "pick" && st.picked.length === q.n) grade(st.picked.slice());
    if (q.type === "number" && st.num) grade([st.num]);
  };
  $("mxTypeToggle").onclick = () => { if (st.busy || st.results[st.i]) return; const q = Q.questions[st.i];
    st.manualI = st.manualI === st.i ? -1 : st.i; st.picked = []; $("mxOpts").querySelectorAll("button").forEach(x => x.classList.remove("picked"));
    applyMode(q, null); $("mxFeedback").textContent = ""; $("mxFeedback").className = "mq-feedback"; };
  $("mxPadToggle").onclick = () => { if (st.busy || st.results[st.i]) return; st.sentPad[st.i] = !st.sentPad[st.i]; render(false); };
  $("mxPrev").onclick = () => { if (st.i > 0 && !st.busy) { st.i--; render(false); } };
  $("mxNext").onclick = () => { if (st.busy) return; if (st.i < n() - 1) { st.i++; render(true); } else finish(); };
  $("mxEmail").onclick = () => HB.emailResults();
  $("mxAgain").onclick = () => { reset(); render(true); };
  $("mxReview").onclick = () => HB.goReview();

  HB.registerModule("maxQuiz", {
    view: "view-maxQuiz",
    enter(ctx) {
      Q = (ctx.opts.set && window.QUIZ_SETS && QUIZ_SETS[ctx.opts.set]) || window.MAX_TOPICS_DATA.quiz;
      st.set = ctx.opts.set || "";
      st.forceTyped = !!(ctx.opts && ctx.opts.mode === "typed");
      st.forceNotepad = !!(ctx.opts && ctx.opts.mode === "notepad");
      st.work = isWorkSet(st.set) && Q !== window.MAX_TOPICS_DATA.quiz;
      $("mxTitle").textContent = Q.title || "Max's test topics · quiz";
      $("anatScore").hidden = false; reset(); render(true); },
    leave() { reset(); }
  });
})();
