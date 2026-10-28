// Anatomy lessons. Data lives in window.ANATOMY (built by build_anatomy.py).
// Every play() call happens directly inside a button tap; MP3s only, no speech APIs.
// Registered as the "anatQuiz" module (Anatomy › <subtopic> › Quiz). The shared audio bar (#anatBar) is also used by explore_app.js.
(function () {
  const A = window.ANATOMY;
  const $ = id => document.getElementById(id);
  const player = $("anatPlayer");
  const els = {
    audioBtn: $("anatAudioBtn"), soundBtn: $("anatSoundBtn"), replayBtn: $("anatReplayBtn"), score: $("anatScore"),
    picker: $("anatPicker"), sets: $("anatSets"), lesson: $("anatLesson"), progress: $("anatomyProgress"),
    emoji: $("anatEmoji"), title: $("anatTitle"), organs: $("anatOrgans"), text: $("anatText"),
    options: $("anatomyOptions"), feedback: $("anatomyFeedback"), quizBtn: $("anatQuizBtn"),
    nextBtn: $("anatNextBtn"), backBtn: $("anatBackBtn")
  };
  const st = { sound: true, lesson: null, idx: 0, phase: "pick", score: 0, lastClip: "" };

  function play(src) {
    st.lastClip = src || "";
    if (!src || !st.sound) return;
    try { if (typeof stopAll === "function") stopAll(); } catch (e) {}
    try {
      player.pause();
      player.src = src;
      player.muted = false; player.volume = 1.0;
      const p = player.play();
      if (p && p.catch) p.catch(err => console.error("[anatomy audio] play failed", src, err));
    } catch (e) { console.error("[anatomy audio]", e); }
  }

  function setScore() {
    const n = st.lesson ? st.lesson.items.length : 0;
    els.score.textContent = st.lesson ? `Score: ${st.score} / ${n}` : "Score: 0";
  }

  function renderPicker() {
    els.sets.innerHTML = "";
    A.sets.forEach(set => {
      const h = document.createElement("div");
      h.className = "anat-set-title"; h.textContent = set.title;
      els.sets.appendChild(h);
      const grid = document.createElement("div");
      grid.className = "lesson-grid";
      set.lessons.forEach(lesson => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "lesson-btn";
        b.innerHTML = `<span class="big">${lesson.emoji}</span>${lesson.title}`;
        b.onclick = () => startLesson(lesson);
        grid.appendChild(b);
      });
      els.sets.appendChild(grid);
    });
  }

  function showPicker() {
    st.phase = "pick"; st.lesson = null; player.pause();
    els.lesson.hidden = true; els.picker.hidden = false; setScore();
  }

  function startLesson(lesson) {
    st.lesson = lesson; st.idx = 0; st.score = 0; st.phase = "welcome";
    els.picker.hidden = true; els.lesson.hidden = false;
    els.progress.textContent = lesson.title;
    els.emoji.textContent = lesson.emoji;
    els.title.textContent = lesson.title.split(": ")[1] || lesson.title;
    els.organs.textContent = "";
    els.text.textContent = lesson.welcome;
    els.options.innerHTML = ""; els.feedback.textContent = "";
    els.quizBtn.hidden = true;
    els.nextBtn.disabled = false; els.nextBtn.textContent = "Start ›";
    setScore();
    play(lesson.welcomeAudio);
  }

  function item() { return st.lesson.items[st.idx]; }

  function showItem() {
    const it = item(), n = st.lesson.items.length;
    els.progress.textContent = `${st.lesson.title} — ${st.idx + 1} of ${n}`;
    els.emoji.textContent = it.emoji;
    els.options.innerHTML = ""; els.feedback.textContent = "";
    els.nextBtn.disabled = true; els.nextBtn.textContent = "Next ›";
    if (it.intro) {
      st.phase = "intro";
      els.title.textContent = it.name;
      els.organs.textContent = it.organs ? "Team members: " + it.organs : "";
      els.text.textContent = it.intro;
      els.quizBtn.hidden = false;
      play(it.introAudio);
    } else {
      showQuestion();
    }
  }

  function showQuestion() {
    const it = item();
    st.phase = "question";
    els.quizBtn.hidden = true;
    if (!it.intro) { els.title.textContent = it.name; els.organs.textContent = ""; }
    else { els.title.textContent = "Quiz time"; els.organs.textContent = ""; }
    els.text.textContent = it.question;
    els.feedback.textContent = "Tap your answer, Max!";
    els.options.innerHTML = "";
    it.options.forEach(opt => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "anatomy-option"; b.textContent = opt;
      b.onclick = () => answer(opt, b);
      els.options.appendChild(b);
    });
    play(it.questionAudio);
  }

  function answer(opt, btn) {
    if (st.phase !== "question") return;
    const it = item();
    st.phase = "answered";
    els.options.querySelectorAll("button").forEach(b => {
      b.disabled = true;
      if (b.textContent === it.answer) b.classList.add("correct");
    });
    const ok = opt === it.answer;
    if (ok) { st.score++; btn.classList.add("correct"); }
    else btn.classList.add("incorrect");
    els.feedback.textContent = (ok ? "✓ " : "✗ ") + (ok ? it.rightText : it.wrongText);
    setScore();
    const last = st.idx === st.lesson.items.length - 1;
    els.nextBtn.disabled = false;
    els.nextBtn.textContent = last ? "See results" : "Next ›";
    play(ok ? it.rightAudio : it.wrongAudio);
  }

  function finish() {
    const n = st.lesson.items.length;
    st.phase = "done";
    els.progress.textContent = st.lesson.title;
    els.emoji.textContent = st.score === n ? "🏆" : "🎉";
    els.title.textContent = "Lesson complete!";
    els.organs.textContent = "";
    els.text.textContent = `You got ${st.score} out of ${n}! ` + (st.score === n ? "A perfect score — you are a body expert!" : "Great work — play again to learn even more!");
    els.options.innerHTML = ""; els.feedback.textContent = "";
    els.quizBtn.hidden = true;
    els.nextBtn.disabled = false; els.nextBtn.textContent = "Play again";
    play(st.lesson.doneAudioPrefix + st.score + ".mp3");
  }

  els.nextBtn.onclick = () => {
    if (!st.lesson) return;
    if (st.phase === "welcome") { st.idx = 0; showItem(); }
    else if (st.phase === "answered") {
      if (st.idx < st.lesson.items.length - 1) { st.idx++; showItem(); } else finish();
    } else if (st.phase === "done") startLesson(st.lesson);
  };
  els.quizBtn.onclick = () => { if (st.phase === "intro") showQuestion(); };
  els.backBtn.onclick = () => (window.HB ? HB.back() : showPicker());
  els.replayBtn.onclick = () => { if (st.lastClip) play(st.lastClip); };
  els.audioBtn.onclick = () => {
    st.sound = true;
    els.soundBtn.textContent = "Sound ON"; els.soundBtn.setAttribute("aria-pressed", "true");
    els.audioBtn.textContent = "Audio ready"; els.audioBtn.classList.add("ready");
    const ex = window.ANAT_EXPLORE_DATA;
    play(st.lastClip || (st.lesson ? A.helloAudio : (ex ? ex.helloAudio : A.helloAudio)));
  };
  els.soundBtn.onclick = () => {
    st.sound = !st.sound;
    els.soundBtn.textContent = st.sound ? "Sound ON" : "Sound OFF";
    els.soundBtn.setAttribute("aria-pressed", st.sound ? "true" : "false");
    if (!st.sound) player.pause();
  };

  renderPicker();
  showPicker();

  window.ANAT = { play, isSound: () => st.sound, setScoreText: t => { els.score.textContent = t; } };
  function findLesson(id) {
    for (const set of A.sets) for (const L of set.lessons) if (L.id === id) return L;
    return null;
  }
  if (window.HB) HB.registerModule("anatQuiz", {
    view: "view-anatQuiz",
    enter(ctx) {
      els.score.hidden = false;
      const L = findLesson(ctx.opts.lesson);
      if (L) startLesson(L); else showPicker();
    },
    leave() { player.pause(); showPicker(); st.lastClip = ""; }
  });
})();
