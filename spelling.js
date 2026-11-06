// Spelling review + dual quiz modes (letters | notepad). Data: window.SPELLING_DATA[listId].
// Narration: gTTS MP3s via ANAT.play (no speechSynthesis). Notepad grades via HB.gradeScratch (spelling prompt).
(function () {
  const $ = id => document.getElementById(id);
  const play = src => { if (window.ANAT && src) ANAT.play(src); };
  const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const aiReady = () => !!(HB.ai && HB.ai.ready());

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

  // ---------- Review ----------
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
      const listId = (ctx.opts && ctx.opts.list) || (ctx.session && String(ctx.session.id).replace(/-(letters|notepad)$/, "")) || "week7";
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
      $("spTitle").textContent = (ctx.session && ctx.session.title) || D.week.title;
      renderReview(true);
    },
    leave() {}
  });

  // ---------- Quiz ----------
  const qz = { order: [], i: 0, score: 0, results: [], letters: [], focus: 0, listId: "", D: null, mode: "letters", busy: 0, pad: null };
  const SUBMIT = "Submit work", LOOKING = "Looking at your writing…", CHECK = "Check";

  function cur() { return qz.order[qz.i]; }
  function n() { return qz.order.length; }
  function isNotepad() { return qz.mode === "notepad"; }

  // Mount scratch pad once
  if ($("spScratch") && HB.ScratchPad) qz.pad = HB.ScratchPad.mount($("spScratch"), { label: "Scratch pad — write the word you hear" });

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
        if (e.inputType === "insertText" && e.data && e.data.length > 1) {
          e.preventDefault();
          const ch = e.data.replace(/[^a-zA-Z]/g, "").charAt(0);
          if (ch) putLetter(i, ch);
        }
      });
      box.appendChild(inp);
    }
    syncFocus();
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

  function setModeUI(res) {
    const np = isNotepad();
    $("spqEyebrow").textContent = np ? "Quiz · Notepad (harder) — no letter count" : "Quiz · Letter boxes (easier)";
    $("spBoxes").hidden = np;
    $("spScratch").hidden = !np || !!qz.fallbackText;
    $("spFallback").hidden = !np || !qz.fallbackText;
    $("spCheck").textContent = np ? (qz.busy ? LOOKING : SUBMIT) : CHECK;
    if (!np) {
      $("spScratch").hidden = true; $("spFallback").hidden = true;
    }
  }

  function renderQuiz(speak) {
    const w = cur(); if (!w) return;
    qz.busy = 0; qz.fallbackText = false;
    $("spqCard").hidden = false; $("spqEnd").hidden = true;
    $("spqProgress").textContent = `Word ${qz.i + 1} of ${n()}`;
    $("spqBar").style.width = ((qz.i + 1) / n() * 100) + "%";
    $("spFeedback").textContent = ""; $("spFeedback").className = "mq-feedback";
    $("spReveal").hidden = true; $("spReveal").innerHTML = "";
    $("spFallbackInput").value = "";
    setModeUI();
    if (isNotepad()) {
      $("spqHint").textContent = aiReady()
        ? "Listen, write the whole word on the scratch pad, then tap Submit work. No letter count is shown."
        : "AI grading needs a key in Settings. Listen, then type the whole word below (no length hint).";
      if (!aiReady()) { qz.fallbackText = true; setModeUI(); }
      if (qz.pad) { if (qz.results[qz.i] && qz.results[qz.i].png) { qz.pad.loadImage(qz.results[qz.i].png); qz.pad.setEnabled(false); } else { qz.pad.loadBlank(); qz.pad.setEnabled(!qz.results[qz.i]); } }
      $("spCheck").disabled = !!qz.results[qz.i];
      $("spBoxes").innerHTML = "";
    } else {
      $("spqHint").textContent = "Listen, then type each letter into its box. Tap Replay to hear it again.";
      buildBoxes(w.word.length);
      $("spCheck").disabled = true;
    }
    $("spCheck").hidden = false;
    $("spqPrev").disabled = qz.i === 0;
    $("spqNext").textContent = qz.i === n() - 1 ? "See results" : "Next word";
    $("spqNext").disabled = !qz.results[qz.i];
    if (window.ANAT) ANAT.setScoreText(`Score: ${qz.score} / ${n()}`);
    const res = qz.results[qz.i];
    if (res) showQuizResult(w, res, false);
    if (speak && !res) {
      const intro = isNotepad() ? (qz.D.quiz.introNotepadAudio || qz.D.quiz.introAudio) : qz.D.quiz.introAudio;
      play(qz.i === 0 && qz.results.length === 0 ? intro : w.quizAudio);
    }
  }

  function typed() { return qz.letters.join("").toLowerCase(); }

  function showQuizResult(w, res, speak) {
    if (!isNotepad()) {
      const boxes = [...$("spBoxes").querySelectorAll("input")];
      const givenStr = Array.isArray(res.given) ? res.given.join("") : String(res.given || "");
      boxes.forEach((el, i) => {
        el.disabled = true;
        const got = (givenStr[i] || "").toLowerCase();
        const want = w.word[i].toLowerCase();
        el.classList.toggle("ok", got === want);
        el.classList.toggle("bad", got !== want);
        el.value = got || "";
      });
      if (!res.ok) {
        $("spReveal").hidden = false;
        $("spReveal").innerHTML = "Correct: " + w.word.split("").map((ch, i) => {
          const got = (givenStr[i] || "").toLowerCase();
          return `<span class="sp-rev ${got === ch.toLowerCase() ? "ok" : "bad"}">${esc(ch)}</span>`;
        }).join("");
      }
    } else {
      if (qz.pad) qz.pad.setEnabled(false);
      $("spFallbackInput").disabled = true;
      if (!res.ok) {
        $("spReveal").hidden = false;
        const read = res.written || (Array.isArray(res.given) ? res.given.join("") : res.given) || "(nothing read)";
        $("spReveal").innerHTML = `Correct: <b>${esc(w.word)}</b> · AI read: <span class="sp-miss">${esc(read)}</span>`;
      }
    }
    $("spCheck").disabled = true;
    const msg = res.ok
      ? ("✓ " + (res.feedback || w.rightText))
      : ("✗ " + (res.feedback || w.wrongText));
    $("spFeedback").textContent = msg;
    $("spFeedback").className = "mq-feedback " + (res.ok ? "ok" : "bad");
    $("spqNext").disabled = false;
    if (speak) play(res.ok ? w.rightAudio : w.wrongAudio);
  }

  function commit(w, res) {
    qz.results[qz.i] = res;
    if (res.ok) qz.score++;
    showQuizResult(w, res, true);
    if (window.ANAT) ANAT.setScoreText(`Score: ${qz.score} / ${n()}`);
  }

  function gradeLetters() {
    if (qz.results[qz.i]) return;
    const w = cur();
    const given = typed();
    if (given.length !== w.word.length) return;
    commit(w, { ok: given === w.word.toLowerCase(), given: given.split(""), written: given });
  }

  function gradeFallbackText() {
    if (qz.results[qz.i]) return;
    const w = cur();
    const given = String($("spFallbackInput").value || "").trim().toLowerCase().replace(/[^a-z]/g, "");
    if (!given) { $("spFeedback").textContent = "Type the word you heard, then Submit."; $("spFeedback").className = "mq-feedback need"; return; }
    commit(w, { ok: given === w.word.toLowerCase(), given, written: given, feedback: given === w.word.toLowerCase() ? w.rightText : w.wrongText });
  }

  function aiCheck() {
    if (qz.results[qz.i] || qz.busy) return;
    const w = cur(), i = qz.i, token = ++qz.busy;
    if (!qz.pad || !qz.pad.hasInk()) {
      $("spFeedback").textContent = "✎ Write the word on the scratch pad first."; $("spFeedback").className = "mq-feedback need";
      qz.busy = 0; return;
    }
    const png = qz.pad.toDataURL("image/png");
    $("spCheck").disabled = true; $("spCheck").textContent = LOOKING; $("spqPrev").disabled = true;
    if (qz.pad) qz.pad.setEnabled(false);
    $("spFeedback").textContent = "👀 " + LOOKING; $("spFeedback").className = "mq-feedback looking";
    HB.gradeScratch({
      pngDataUrl: png, kind: "spelling",
      question: "Spell the word you hear.", expected: w.word,
      subject: "Language › Spelling", quiz: (qz.D.week && qz.D.week.title) || "Spelling",
      hideExpected: true, attempt: 1
    }).then(v => {
      if (qz.busy !== token || qz.i !== i) return;
      qz.busy = 0; $("spCheck").textContent = SUBMIT; $("spqPrev").disabled = qz.i === 0;
      // Prefer exact letter compare on what AI read; fall back to AI's ok
      const read = String(v.written || "").toLowerCase().replace(/[^a-z]/g, "");
      const ok = read ? read === w.word.toLowerCase() : !!v.ok;
      if (HB.work) HB.work.save({
        subject: "Language › Spelling", quiz: (qz.D.week && qz.D.week.title) + " · Notepad",
        question: "Spell: (spoken word)", ok, given: read || v.written || "", answerSummary: w.word,
        pngDataUrl: png, grader: "ai", written: v.written || "", feedback: v.feedback || "", model: v.model || ""
      });
      commit(w, { ok, given: read || v.written || "", written: v.written || read, feedback: v.feedback, png, ai: true });
    }).catch(e => {
      if (qz.busy !== token || qz.i !== i) return;
      qz.busy = 0; $("spCheck").textContent = SUBMIT; $("spCheck").disabled = false; $("spqPrev").disabled = qz.i === 0;
      if (qz.pad) qz.pad.setEnabled(true);
      // Fallback to plain text — never reveal letter count
      qz.fallbackText = true; setModeUI();
      const why = (e && e.mode === "fallback")
        ? (e.reason === "no_key" ? "Add an AI key in Settings › AI grading, or type the word below." : "AI grading is off — type the word below.")
        : ((e && e.message) || "The AI couldn't check this one.") + " Type the word below (no length hint).";
      $("spFeedback").textContent = "⚠ " + why; $("spFeedback").className = "mq-feedback need";
      $("spFallbackInput").disabled = false; $("spFallbackInput").focus();
    });
  }

  function onCheck() {
    if (qz.results[qz.i] || qz.busy) return;
    if (!isNotepad()) return gradeLetters();
    if (qz.fallbackText) return gradeFallbackText();
    if (!aiReady()) { qz.fallbackText = true; setModeUI(); $("spFeedback").textContent = "Add an AI key in Settings, or type the word below."; $("spFeedback").className = "mq-feedback need"; return; }
    aiCheck();
  }

  function finish() {
    const d = qz.D.quiz.done[qz.score];
    $("spqCard").hidden = true; $("spqEnd").hidden = false;
    $("spqEndScore").textContent = `${qz.score} / ${n()}`;
    $("spqEndMsg").textContent = d.text;
    const missed = qz.order.map((w, i) => ({ w, r: qz.results[i] })).filter(x => x.r && !x.r.ok);
    $("spqMissed").innerHTML = missed.length
      ? "<div class='eyebrow'>Practice these</div>" + missed.map(x => {
          const got = x.r.written || (Array.isArray(x.r.given) ? x.r.given.join("") : x.r.given) || "";
          return `<li><b>${esc(x.w.word)}</b> — ${got ? `wrote <span class="sp-miss">${esc(got)}</span>` : "missed"}</li>`;
        }).join("")
      : "";
    if (HB.recordResult) HB.recordResult({
      title: (qz.D.week && qz.D.week.title) + (isNotepad() ? " · Notepad quiz" : " · Letter boxes quiz"),
      subject: "Language",
      topic: "Spelling › " + ((qz.D.week && qz.D.week.title) || qz.listId),
      mode: isNotepad() ? "notepad" : "letters",
      score: qz.score, total: n(),
      questions: qz.order.map((w, i) => {
        const r = qz.results[i] || {};
        const given = r.written || (Array.isArray(r.given) ? r.given.join("") : r.given) || "";
        return { q: w.word, given, answer: w.word, ok: !!(r && r.ok), written: r.written || "" };
      }),
      details: qz.order.map((w, i) => `${qz.results[i] && qz.results[i].ok ? "✓" : "✗"} ${w.word}`)
    });
    $("spqBar").style.width = "100%";
    play(d.audio);
  }

  function resetQuiz() { qz.i = 0; qz.score = 0; qz.results = []; qz.letters = []; qz.busy = 0; qz.fallbackText = false; }

  $("spCheck").onclick = onCheck;
  $("spReplay").onclick = () => { const w = cur(); if (w) play(w.quizAudio); };
  $("spqPrev").onclick = () => { if (qz.i > 0 && !qz.busy) { qz.i--; renderQuiz(false); } };
  $("spqNext").onclick = () => { if (qz.busy) return; if (qz.i < n() - 1) { qz.i++; renderQuiz(true); } else finish(); };
  $("spqEmail").onclick = () => HB.emailResults();
  $("spqAgain").onclick = () => { qz.order = shuffle(qz.D.words); resetQuiz(); renderQuiz(true); };
  $("spqReview").onclick = () => HB.goReview();
  $("spFallbackInput").addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); onCheck(); } });

  HB.registerModule("spellingQuiz", {
    view: "view-spellingQuiz",
    enter(ctx) {
      const listId = (ctx.opts && ctx.opts.list) || (ctx.session && String(ctx.session.id).replace(/-(letters|notepad)$/, "")) || "week7";
      const D = list(listId); if (!D) return;
      qz.D = D; qz.listId = listId;
      qz.mode = (ctx.opts && ctx.opts.mode) === "notepad" ? "notepad" : "letters";
      qz.order = shuffle(D.words);
      $("spqTitle").textContent = (D.week && D.week.title) + (isNotepad() ? " · Notepad quiz" : " · Letter boxes quiz");
      $("anatScore").hidden = false;
      if (!qz.pad && $("spScratch") && HB.ScratchPad) qz.pad = HB.ScratchPad.mount($("spScratch"), { label: "Scratch pad — write the word you hear" });
      resetQuiz();
      renderQuiz(true);
    },
    leave() { resetQuiz(); if (qz.pad) qz.pad.setEnabled(false); }
  });
})();
