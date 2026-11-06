// Spelling review + letter-box quiz. Data: window.SPELLING_DATA[listId] from spelling_data.js.
// Narration: pre-generated gTTS MP3s via ANAT.play (no speechSynthesis — Tesla / iPad safe).
(function () {
  const $ = id => document.getElementById(id);
  const play = src => { if (window.ANAT && src) ANAT.play(src); };
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  function list(id) {
    const D = (window.SPELLING_DATA || {})[id];
    return D && D.words ? D : null;
  }
  function hlWord(word, hl) {
    const w = String(word), h = String(hl || "");
    if (!h || !w.toLowerCase().startsWith(h.toLowerCase())) return `<span class="sp-word">${esc(w)}</span>`;
    return `<span class="sp-word"><span class="sp-hl">${esc(w.slice(0, h.length))}</span>${esc(w.slice(h.length))}</span>`;
  }
  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // ---------- Review / component walkthrough ----------
  const rv = { words: [], i: 0, mode: "review", listId: "" };

  function renderReview(speak) {
    const w = rv.words[rv.i]; if (!w) return;
    $("spCount").textContent = `${rv.i + 1} / ${rv.words.length}`;
    $("spWord").innerHTML = hlWord(w.word, w.highlight);
    $("spBlend").textContent = (w.highlight || "").toUpperCase();
    $("spMeaning").textContent = w.meaning;
    $("spSentence").textContent = w.sentence;
    $("spFact").textContent = w.fact;
    $("spBar").style.width = ((rv.i + 1) / rv.words.length * 100) + "%";
    $("spPrev").disabled = rv.i === 0;
    const last = rv.i === rv.words.length - 1;
    $("spNext").textContent = last ? (rv.mode === "review" ? "Go to quiz ›" : "Back to review ›") : "Next ›";
    $("spChips").querySelectorAll("button").forEach((b, k) => b.classList.toggle("active", k === rv.i));
    if (window.ANAT) ANAT.setScoreText("");
    if (speak) play(w.reviewAudio);
  }

  $("spPrev").onclick = () => {
    if (rv.i <= 0) return;
    if (rv.mode === "component") return HB.goComponent(rv.i - 1);
    rv.i--; renderReview(true);
  };
  $("spNext").onclick = () => {
    const last = rv.i === rv.words.length - 1;
    if (rv.mode === "component") return last ? HB.goReview() : HB.goComponent(rv.i + 1);
    if (last) return HB.goQuiz();
    rv.i++; renderReview(true);
  };
  $("spHear").onclick = () => play((rv.words[rv.i] || {}).reviewAudio);

  HB.registerModule("spellingReview", {
    view: "view-spellingReview",
    enter(ctx) {
      const listId = (ctx.opts && ctx.opts.list) || (ctx.session && ctx.session.id) || "week7";
      const D = list(listId); if (!D) return;
      rv.listId = listId; rv.words = D.words;
      $("anatScore").hidden = true;
      const chips = $("spChips"); chips.innerHTML = "";
      if (ctx.kind === "component") {
        rv.mode = "component"; rv.i = ctx.comp || 0;
        $("spEyebrow").textContent = ctx.session.title + " · words";
        rv.words.forEach((w, k) => {
          const b = document.createElement("button");
          b.type = "button"; b.className = "comp-chip"; b.dataset.comp = w.id; b.textContent = w.word;
          b.onclick = () => HB.goComponent(k); chips.appendChild(b);
        });
      } else {
        rv.mode = "review"; rv.i = ctx.opts.start || 0;
        $("spEyebrow").textContent = "Review · " + (D.week.theme || "tap Next to step through");
      }
      chips.hidden = rv.mode !== "component";
      $("spTitle").textContent = ctx.session.title;
      renderReview(true);
    },
    leave() {}
  });

  // ---------- Quiz: letter boxes ----------
  const qz = { order: [], i: 0, score: 0, results: [], letters: [], focus: 0, listId: "", D: null };

  function cur() { return qz.order[qz.i]; }
  function n() { return qz.order.length; }

  function buildBoxes(len) {
    const box = $("spBoxes"); box.innerHTML = "";
    qz.letters = Array(len).fill("");
    qz.focus = 0;
    for (let i = 0; i < len; i++) {
      const inp = document.createElement("input");
      inp.type = "text"; inp.className = "sp-box"; inp.maxLength = 1;
      inp.autocomplete = "off"; inp.autocapitalize = "none"; inp.spellcheck = false;
      inp.inputMode = "text"; inp.dataset.i = String(i);
      inp.setAttribute("aria-label", "Letter " + (i + 1));
      inp.addEventListener("input", onBoxInput);
      inp.addEventListener("keydown", onBoxKey);
      inp.addEventListener("focus", () => { qz.focus = i; syncFocus(); });
      inp.addEventListener("beforeinput", e => {
        // Keep only a single letter (iPad / predictive keyboards can dump words)
        if (e.inputType === "insertText" && e.data && e.data.length > 1) {
          e.preventDefault();
          const ch = e.data.replace(/[^a-zA-Z]/g, "").charAt(0);
          if (ch) putLetter(i, ch);
        }
      });
      box.appendChild(inp);
    }
    syncFocus();
    // Focus first box so the iPad keyboard opens
    const first = box.querySelector("input"); if (first) setTimeout(() => first.focus(), 40);
  }
  function syncFocus() {
    $("spBoxes").querySelectorAll("input").forEach((el, i) => el.classList.toggle("focus", i === qz.focus));
  }
  function putLetter(i, ch) {
    const boxes = [...$("spBoxes").querySelectorAll("input")];
    if (!boxes[i]) return;
    const c = String(ch).toLowerCase().replace(/[^a-z]/g, "").charAt(0);
    if (!c) return;
    boxes[i].value = c; qz.letters[i] = c;
    if (i < boxes.length - 1) { qz.focus = i + 1; boxes[qz.focus].focus(); }
    else qz.focus = i;
    syncFocus();
    $("spCheck").disabled = qz.letters.some(x => !x);
  }
  function onBoxInput(e) {
    const i = +e.target.dataset.i;
    const raw = e.target.value;
    if (!raw) { qz.letters[i] = ""; $("spCheck").disabled = true; return; }
    putLetter(i, raw.slice(-1));
  }
  function onBoxKey(e) {
    const i = +e.target.dataset.i;
    const boxes = [...$("spBoxes").querySelectorAll("input")];
    if (e.key === "Backspace") {
      if (e.target.value) { e.target.value = ""; qz.letters[i] = ""; $("spCheck").disabled = true; }
      else if (i > 0) {
        e.preventDefault();
        boxes[i - 1].value = ""; qz.letters[i - 1] = ""; qz.focus = i - 1;
        boxes[qz.focus].focus(); syncFocus(); $("spCheck").disabled = true;
      }
    } else if (e.key === "ArrowLeft" && i > 0) { e.preventDefault(); qz.focus = i - 1; boxes[qz.focus].focus(); syncFocus(); }
    else if (e.key === "ArrowRight" && i < boxes.length - 1) { e.preventDefault(); qz.focus = i + 1; boxes[qz.focus].focus(); syncFocus(); }
    else if (e.key === "Enter") { e.preventDefault(); if (!$("spCheck").disabled) $("spCheck").click(); }
  }

  function renderQuiz(speak) {
    const w = cur(); if (!w) return;
    $("spqCard").hidden = false; $("spqEnd").hidden = true;
    $("spqProgress").textContent = `Word ${qz.i + 1} of ${n()}`;
    $("spqBar").style.width = ((qz.i + 1) / n() * 100) + "%";
    $("spqHint").textContent = "Listen, then type each letter. Tap Replay to hear it again.";
    $("spFeedback").textContent = ""; $("spFeedback").className = "mq-feedback";
    $("spReveal").hidden = true; $("spReveal").innerHTML = "";
    buildBoxes(w.word.length);
    $("spCheck").disabled = true; $("spCheck").hidden = false;
    $("spqPrev").disabled = qz.i === 0;
    $("spqNext").textContent = qz.i === n() - 1 ? "See results" : "Next word";
    $("spqNext").disabled = !qz.results[qz.i];
    if (window.ANAT) ANAT.setScoreText(`Score: ${qz.score} / ${n()}`);
    const res = qz.results[qz.i];
    if (res) showQuizResult(w, res, false);
    if (speak && !res) play(qz.i === 0 && qz.results.length === 0 ? qz.D.quiz.introAudio : w.quizAudio);
  }

  function typed() { return qz.letters.join("").toLowerCase(); }

  function showQuizResult(w, res, speak) {
    const boxes = [...$("spBoxes").querySelectorAll("input")];
    boxes.forEach((el, i) => {
      el.disabled = true;
      const got = (res.given[i] || "").toLowerCase();
      const want = w.word[i].toLowerCase();
      el.classList.toggle("ok", got === want);
      el.classList.toggle("bad", got !== want);
      el.value = got || "";
    });
    $("spCheck").disabled = true;
    if (!res.ok) {
      $("spReveal").hidden = false;
      $("spReveal").innerHTML = "Correct: " + w.word.split("").map((ch, i) => {
        const got = (res.given[i] || "").toLowerCase();
        const cls = got === ch.toLowerCase() ? "ok" : "bad";
        return `<span class="sp-rev ${cls}">${esc(ch)}</span>`;
      }).join("");
    }
    $("spFeedback").textContent = (res.ok ? "✓ " : "✗ ") + (res.ok ? w.rightText : w.wrongText);
    $("spFeedback").className = "mq-feedback " + (res.ok ? "ok" : "bad");
    $("spqNext").disabled = false;
    if (speak) play(res.ok ? w.rightAudio : w.wrongAudio);
  }

  function grade() {
    if (qz.results[qz.i]) return;
    const w = cur();
    const given = typed();
    if (given.length !== w.word.length) return;
    const ok = given === w.word.toLowerCase();
    const res = { ok, given: given.split("") };
    qz.results[qz.i] = res;
    if (ok) qz.score++;
    showQuizResult(w, res, true);
    if (window.ANAT) ANAT.setScoreText(`Score: ${qz.score} / ${n()}`);
  }

  function finish() {
    const d = qz.D.quiz.done[qz.score];
    $("spqCard").hidden = true; $("spqEnd").hidden = false;
    $("spqEndScore").textContent = `${qz.score} / ${n()}`;
    $("spqEndMsg").textContent = d.text;
    const missed = qz.order.map((w, i) => ({ w, r: qz.results[i] })).filter(x => x.r && !x.r.ok);
    $("spqMissed").innerHTML = missed.length
      ? "<div class='eyebrow'>Practice these</div>" + missed.map(x =>
          `<li><b>${esc(x.w.word)}</b> — you wrote <span class="sp-miss">${esc(x.r.given.join(""))}</span></li>`).join("")
      : "";
    if (HB.recordResult) HB.recordResult({
      title: qz.D.quiz.title,
      score: qz.score, total: n(),
      details: qz.order.map((w, i) => `${qz.results[i] && qz.results[i].ok ? "✓" : "✗"} ${w.word}`)
    });
    $("spqBar").style.width = "100%";
    play(d.audio);
  }

  function resetQuiz() { qz.i = 0; qz.score = 0; qz.results = []; qz.letters = []; }

  $("spCheck").onclick = grade;
  $("spReplay").onclick = () => {
    const w = cur(); if (!w) return;
    play(w.quizAudio);
  };
  $("spqPrev").onclick = () => { if (qz.i > 0) { qz.i--; renderQuiz(false); } };
  $("spqNext").onclick = () => { if (qz.i < n() - 1) { qz.i++; renderQuiz(true); } else finish(); };
  $("spqEmail").onclick = () => HB.emailResults();
  $("spqAgain").onclick = () => { qz.order = shuffle(qz.D.words); resetQuiz(); renderQuiz(true); };
  $("spqReview").onclick = () => HB.goReview();

  HB.registerModule("spellingQuiz", {
    view: "view-spellingQuiz",
    enter(ctx) {
      const listId = (ctx.opts && ctx.opts.list) || (ctx.session && ctx.session.id) || "week7";
      const D = list(listId);
      if (!D) return;
      qz.D = D; qz.listId = listId;
      qz.order = shuffle(D.words);
      $("spqTitle").textContent = D.quiz.title;
      $("anatScore").hidden = false;
      resetQuiz();
      renderQuiz(true);
    },
    leave() { resetQuiz(); }
  });
})();
