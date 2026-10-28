// Math quiz module ("mathQuiz"): Max solves long division problems himself on an on-screen keypad.
// Data: window.MATH_QUIZ_DATA (build_math_quiz.py). Audio: MP3 via #mqPlayer, always from a tap.
(function () {
  const D = window.MATH_QUIZ_DATA;
  const $ = id => document.getElementById(id);
  const player = $("mqPlayer");
  const st = { i: 0, score: 0, tries: 0, field: "q", vals: { q: "", r: "" }, done: false, answered: [], sound: true, last: "" };

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
    st.i = i; st.tries = 0; st.field = "q"; st.vals = { q: "", r: "" };
    const p = prob(), a = st.answered[i];
    $("mqCard").hidden = false; $("mqEnd").hidden = true;
    $("mqProgress").textContent = `Problem ${i + 1} of ${D.problems.length}`;
    $("mqBar").style.width = ((i + 1) / D.problems.length * 100) + "%";
    $("mqDividend").textContent = p.dividend; $("mqDivisor").textContent = p.divisor;
    $("mqHow").hidden = true; $("mqHowSteps").innerHTML = "";
    $("mqPrev").disabled = i === 0;
    if (a) { st.vals = { q: String(p.quotient), r: String(p.remainder) }; lock(a.ok ? "✓ Solved" : "Answer shown", a.ok); }
    else { unlock(); $("mqFeedback").textContent = i === 0 ? D.intro : "Enter the quotient and remainder, then tap Check."; $("mqFeedback").className = "mq-feedback"; }
    $("mqNext").disabled = !a;
    $("mqNext").textContent = i === D.problems.length - 1 ? "See results" : "Next problem";
    renderFields(); setScore();
    if (speak) play(i === 0 && !a ? D.introAudio : p.askAudio);
  }
  function lock(msg, ok) {
    document.querySelectorAll("#mqPad button").forEach(b => b.disabled = true);
    $("mqCheck").disabled = true;
    if (msg) { $("mqFeedback").textContent = msg; $("mqFeedback").className = "mq-feedback " + (ok ? "ok" : "bad"); }
  }
  function unlock() { document.querySelectorAll("#mqPad button").forEach(b => b.disabled = false); $("mqCheck").disabled = false; }

  function key(k) {
    const f = st.field;
    if (k === "del") st.vals[f] = st.vals[f].slice(0, -1);
    else if (k === "clr") st.vals[f] = "";
    else if (st.vals[f].length < 3) st.vals[f] = (st.vals[f] + k).replace(/^0+(?=\d)/, "");
    renderFields();
  }

  function check() {
    const p = prob();
    if (st.vals.q === "" || st.vals.r === "") {
      $("mqFeedback").textContent = "Fill in both the quotient and the remainder first."; $("mqFeedback").className = "mq-feedback";
      st.field = st.vals.q === "" ? "q" : "r"; renderFields(); return;
    }
    const ok = +st.vals.q === p.quotient && +st.vals.r === p.remainder;
    if (ok) {
      if (!st.answered[st.i]) st.score++;
      st.answered[st.i] = { ok: true };
      const c = D.cheers[st.i % D.cheers.length];
      lock(`✓ ${c.text} ${p.label} = ${p.quotient} R ${p.remainder}`, true);
      $("mqNext").disabled = false; setScore(); play(c.audio);
    } else if (st.tries === 0) {
      st.tries = 1;
      $("mqFeedback").textContent = "✗ " + D.tryAgain; $("mqFeedback").className = "mq-feedback bad";
      play(D.tryAgainAudio);
    } else {
      st.answered[st.i] = { ok: false };
      st.vals = { q: String(p.quotient), r: String(p.remainder) }; renderFields();
      lock("✗ " + p.revealText, false);
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
    st.i = 0; st.score = 0; st.answered = []; st.last = "";
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
