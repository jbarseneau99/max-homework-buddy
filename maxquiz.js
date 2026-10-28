// "maxQuiz" module: Anatomy › Max's Test Topics › Quiz. Mixed question types:
//   mc (tap one), pick (tap N then Check), number (keypad then Check). Data: window.MAX_TOPICS_DATA.quiz.
// Audio goes through window.ANAT.play (shared anatomy player, Sound ON/OFF and "Hear it again").
(function () {
  // opts.set picks a question set from window.QUIZ_SETS (per-system quizzes); default = Max's Test Topics.
  let Q = window.MAX_TOPICS_DATA.quiz;
  const $ = id => document.getElementById(id);
  const st = { i: 0, score: 0, results: [], picked: [], num: "" };
  const play = src => { if (window.ANAT) ANAT.play(src); };
  const n = () => Q.questions.length;
  const setScore = () => { if (window.ANAT) ANAT.setScoreText(`Score: ${st.score} / ${n()}`); };

  function render(speak) {
    const q = Q.questions[st.i], res = st.results[st.i];
    st.picked = []; st.num = "";
    document.querySelectorAll("#mxPad button").forEach(b => b.disabled = false);
    $("mxCard").hidden = false; $("mxEnd").hidden = true;
    $("mxProgress").textContent = `Question ${st.i + 1} of ${n()}`;
    $("mxBar").style.width = ((st.i + 1) / n() * 100) + "%";
    $("mxQ").textContent = q.q;
    $("mxHint").textContent = q.type === "pick" ? `Pick ${q.n}, then tap Check.` : q.type === "number" ? "Use the keypad, then tap Check." : "Tap your answer.";
    const opts = $("mxOpts"); opts.innerHTML = "";
    $("mxNumWrap").hidden = q.type !== "number";
    $("mxCheck").hidden = q.type === "mc";
    if (q.type !== "number") {
      q.options.forEach(o => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "anatomy-option mx-opt"; b.textContent = o; b.dataset.opt = o;
        b.onclick = () => q.type === "mc" ? grade([o]) : togglePick(o, b);
        opts.appendChild(b);
      });
    }
    renderNum();
    $("mxFeedback").textContent = ""; $("mxFeedback").className = "mq-feedback";
    $("mxPrev").disabled = st.i === 0;
    $("mxNext").textContent = st.i === n() - 1 ? "See results" : "Next question";
    $("mxNext").disabled = !res;
    $("mxCheck").disabled = true;
    if (res) showResult(q, res, false);
    setScore();
    if (speak && !res) play(st.i === 0 && st.results.length === 0 ? Q.introAudio : q.qAudio);
  }
  function renderNum() { $("mxNum").textContent = st.num || "–"; $("mxNum").parentElement.classList.toggle("empty", !st.num); }

  function togglePick(o, b) {
    if (st.results[st.i]) return;
    const q = Q.questions[st.i], k = st.picked.indexOf(o);
    if (k >= 0) st.picked.splice(k, 1); else if (st.picked.length < q.n) st.picked.push(o);
    $("mxOpts").querySelectorAll("button").forEach(x => x.classList.toggle("picked", st.picked.includes(x.dataset.opt)));
    $("mxCheck").disabled = st.picked.length !== q.n;
  }

  function grade(given) {
    if (st.results[st.i]) return;
    const q = Q.questions[st.i];
    let ok;
    if (q.type === "mc") ok = given[0] === q.answer;
    else if (q.type === "pick") ok = given.length === q.answers.length && q.answers.every(a => given.includes(a));
    else ok = Number(given[0]) === q.answer;
    const res = { ok, given };
    st.results[st.i] = res;
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
    document.querySelectorAll("#mxPad button").forEach(b => b.disabled = true);
    $("mxCheck").disabled = true;
    $("mxFeedback").textContent = (res.ok ? "✓ " + q.rightText : "✗ " + q.wrongText + (q.type === "number" ? ` (Answer: ${q.answer})` : ""));
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
      details: Q.questions.map((q, i) => `${st.results[i] && st.results[i].ok ? "✓" : "✗"} ${q.q}`) });
    $("mxBar").style.width = "100%";
    const missed = Q.questions.map((q, i) => ({ q, r: st.results[i] })).filter(x => x.r && !x.r.ok);
    $("mxMissed").innerHTML = missed.length ? "<div class='eyebrow'>Review these</div>" + missed.map(x => `<li>${x.q.explain}</li>`).join("") : "";
    play(d.audio);
  }

  function reset() { st.i = 0; st.score = 0; st.results = []; }

  ["1","2","3","4","5","6","7","8","9","clr","0","del"].forEach(k => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "key" + (k.length > 1 ? " fn" : ""); b.dataset.k = k;
    b.textContent = k === "del" ? "⌫" : k === "clr" ? "C" : k;
    b.onclick = () => {
      if (k === "del") st.num = st.num.slice(0, -1); else if (k === "clr") st.num = "";
      else if (st.num.length < 4) st.num = (st.num + k).replace(/^0+(?=\d)/, "");
      renderNum(); $("mxCheck").disabled = !st.num;
    };
    $("mxPad").appendChild(b);
  });
  $("mxCheck").onclick = () => {
    const q = Q.questions[st.i];
    if (q.type === "pick" && st.picked.length === q.n) grade(st.picked.slice());
    if (q.type === "number" && st.num) grade([st.num]);
  };
  $("mxPrev").onclick = () => { if (st.i > 0) { st.i--; render(false); } };
  $("mxNext").onclick = () => { if (st.i < n() - 1) { st.i++; render(true); } else finish(); };
  $("mxEmail").onclick = () => HB.emailResults();
  $("mxAgain").onclick = () => { reset(); document.querySelectorAll("#mxPad button").forEach(b => b.disabled = false); render(true); };
  $("mxReview").onclick = () => HB.goReview();

  HB.registerModule("maxQuiz", {
    view: "view-maxQuiz",
    enter(ctx) {
      Q = (ctx.opts.set && window.QUIZ_SETS && QUIZ_SETS[ctx.opts.set]) || window.MAX_TOPICS_DATA.quiz;
      $("mxTitle").textContent = Q.title || "Max's test topics · quiz";
      $("anatScore").hidden = false; reset(); document.querySelectorAll("#mxPad button").forEach(b => b.disabled = false); render(true); },
    leave() { reset(); }
  });
})();
