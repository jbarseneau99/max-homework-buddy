// ===== Homework Buddy core: router, nav bar, breadcrumbs, shared screens =====
// No speech APIs. All audio is pre-generated MP3 played from a button tap.
(function () {
  const $ = id => document.getElementById(id);
  const ICONS = {
    home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5h5v-6h3v6h5V10"/>',
    back: '<path d="M15 5 8 12l7 7"/>',
    next: '<path d="M9 5l7 7-7 7"/>',
    divide: '<circle cx="12" cy="6" r="1.6"/><circle cx="12" cy="18" r="1.6"/><path d="M5 12h14"/>',
    book: '<path d="M4 5.5C6.5 4 9.5 4 12 6c2.5-2 5.5-2 8-.5V19c-2.5-1.5-5.5-1.5-8 .5-2.5-2-5.5-2-8-.5z"/><path d="M12 6v13.5"/>',
    body: '<circle cx="12" cy="4.5" r="2.3"/><path d="M12 7v7M7 9.5l5-1.5 5 1.5M12 14l-3 6.5M12 14l3 6.5"/>',
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
    flow: '<path d="M4 7h11a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h11"/><path d="M17 16.5 20 19l-3 2.5"/>',
    play: '<path d="M8 5v14l11-7z"/>',
    quiz: '<path d="M4 12.5 9 17.5 20 6.5"/>',
    lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    sound: '<path d="M4 9.5h4L13 5v14l-5-4.5H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7"/>'
  };
  function icon(name, cls) {
    return `<svg class="ic ${cls || ""}" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[name] || ICONS.next}</svg>`;
  }

  const modules = {};
  const st = { level: "home", topic: null, sub: null, kind: null, active: null };
  const HB = window.HB = { icon, modules, state: st };

  HB.registerModule = (name, mod) => { modules[name] = mod; };
  HB.stopAudio = () => {
    document.querySelectorAll("audio").forEach(a => { try { a.pause(); a.currentTime = 0; } catch (e) {} });
  };
  const topicById = id => window.TOPICS.find(t => t.id === id);

  function leaveActive() {
    if (st.active && st.active.leave) { try { st.active.leave(); } catch (e) { console.error(e); } }
    st.active = null;
  }

  function placeToolbar(viewEl) {
    const holder = $("toolbarHolder");
    window.TOPICS.forEach(t => { if (t.toolbar && $(t.toolbar)) holder.appendChild($(t.toolbar)); });
    if (!st.topic || !st.topic.toolbar || !viewEl) return;
    const slot = viewEl.querySelector(".toolbar-slot");
    if (slot && $(st.topic.toolbar)) slot.appendChild($(st.topic.toolbar));
  }

  // ---- navigation targets ----
  function sequenceTarget() {
    const T = st.topic, subs = T ? T.subtopics : [];
    switch (st.level) {
      case "home": return null;
      case "topic": return { level: "subtopics", topic: T, label: "Subtopics" };
      case "subtopics": return subs.length ? { level: "sub", topic: T, sub: subs[0], label: subs[0].title } : null;
      case "sub": return { level: "review", topic: T, sub: st.sub, label: "Review" };
      case "review": return { level: "quiz", topic: T, sub: st.sub, label: "Quiz" };
      case "quiz": {
        const i = subs.indexOf(st.sub);
        return i < subs.length - 1 ? { level: "sub", topic: T, sub: subs[i + 1], label: subs[i + 1].title }
                                   : { level: "subtopics", topic: T, label: "All subtopics" };
      }
    }
  }
  function backTarget() {
    switch (st.level) {
      case "topic": return { level: "home" };
      case "subtopics": return { level: "topic", topic: st.topic };
      case "sub": return { level: "subtopics", topic: st.topic };
      case "review": case "quiz": return { level: "sub", topic: st.topic, sub: st.sub };
      default: return null;
    }
  }

  function crumbs() {
    const parts = ["Home"];
    if (st.topic) parts.push(st.topic.title);
    if (st.level === "subtopics") parts.push("Subtopics");
    if (st.sub) parts.push(st.sub.title);
    if (st.level === "review") parts.push("Review");
    if (st.level === "quiz") parts.push("Quiz");
    return parts;
  }

  function updateNav() {
    const b = backTarget(), n = sequenceTarget();
    $("navHome").disabled = st.level === "home";
    $("navBack").disabled = !b;
    $("navNext").disabled = !n;
    $("navNextLabel").textContent = n ? "Next: " + n.label : "Next";
    const c = crumbs();
    $("crumbs").innerHTML = c.map((p, i) => `<span class="${i === c.length - 1 ? "here" : ""}">${p}</span>`).join('<span class="sep">›</span>');
    document.body.dataset.level = st.level;
  }

  function showView(id) {
    document.querySelectorAll(".view").forEach(v => { v.hidden = v.id !== id; });
    const el = $(id); placeToolbar(el);
    window.scrollTo(0, 0);
    return el;
  }

  // ---- renderers for the shared template screens ----
  function renderHome() {
    const g = $("homeTiles"); g.innerHTML = "";
    window.TOPICS.forEach(t => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "tile"; b.dataset.topic = t.id;
      b.innerHTML = `${icon(t.icon, "tile-ic")}<span class="tile-title">${t.title}</span><span class="tile-blurb">${t.blurb}</span>`;
      b.onclick = () => HB.go({ level: "topic", topic: t });
      g.appendChild(b);
    });
  }
  function renderTopic() {
    const t = st.topic;
    $("topicIcon").innerHTML = icon(t.icon, "hero-ic");
    $("topicTitle").textContent = t.title;
    $("topicIntro").textContent = t.intro;
    $("topicCount").textContent = `${t.subtopics.length} subtopic${t.subtopics.length === 1 ? "" : "s"} available`;
  }
  function renderSubtopics() {
    const t = st.topic, g = $("subList"); g.innerHTML = "";
    $("subHeading").textContent = t.title + " · Subtopics";
    t.subtopics.forEach((s, i) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "card-btn"; b.dataset.sub = s.id;
      b.innerHTML = `<span class="num">${String(i + 1).padStart(2, "0")}</span>${icon(s.icon, "card-ic")}<span class="card-txt"><b>${s.title}</b><small>${s.blurb}</small></span>${icon("next", "chev")}`;
      b.onclick = () => HB.go({ level: "sub", topic: t, sub: s });
      g.appendChild(b);
    });
    if (t.moreComingSoon) {
      const d = document.createElement("div");
      d.className = "card-btn soon"; d.setAttribute("aria-disabled", "true");
      d.innerHTML = `<span class="num">+</span>${icon("lock", "card-ic")}<span class="card-txt"><b>More coming soon</b><small>New subtopics will appear here.</small></span>`;
      g.appendChild(d);
    }
  }
  function renderSub() {
    const s = st.sub;
    $("subIcon").innerHTML = icon(s.icon, "hero-ic");
    $("subTitle").textContent = s.title;
    $("subBlurb").textContent = s.blurb;
    $("subReviewLabel").textContent = s.review.label || "";
    $("subQuizLabel").textContent = s.quiz.label || "";
  }

  HB.go = function (t) {
    leaveActive();
    HB.stopAudio();
    st.level = t.level; st.topic = t.topic || null; st.sub = t.sub || null;
    if (t.level === "home") { showView("view-home"); }
    else if (t.level === "topic") { renderTopic(); showView("view-topic"); }
    else if (t.level === "subtopics") { renderSubtopics(); showView("view-subtopics"); }
    else if (t.level === "sub") { renderSub(); showView("view-sub"); }
    else {
      const entry = st.sub[t.level], mod = modules[entry.module];
      if (!mod) { console.error("missing module", entry.module); return; }
      showView(mod.view);
      st.active = mod;
      updateNav();
      mod.enter({ topic: st.topic, sub: st.sub, kind: t.level, opts: entry.opts || {}, entry });
      return;
    }
    updateNav();
  };
  HB.home = () => HB.go({ level: "home" });
  HB.back = () => { const b = backTarget(); if (b) HB.go(b); };
  HB.next = () => { const n = sequenceTarget(); if (n) HB.go(n); };
  HB.goQuiz = () => { if (st.sub) HB.go({ level: "quiz", topic: st.topic, sub: st.sub }); };

  // Shared "coming soon" module (used by placeholder content).
  HB.comingSoon = function (viewId, title, msg) {
    const v = $(viewId);
    v.querySelector(".cs-title").textContent = title;
    v.querySelector(".cs-msg").textContent = msg;
  };

  HB.start = function () {
    document.querySelectorAll("[data-icon]").forEach(el => { el.insertAdjacentHTML("afterbegin", icon(el.dataset.icon)); });
    $("navHome").onclick = HB.home;
    $("navBack").onclick = HB.back;
    $("navNext").onclick = HB.next;
    $("subReviewBtn").onclick = () => HB.go({ level: "review", topic: st.topic, sub: st.sub });
    $("subQuizBtn").onclick = () => HB.go({ level: "quiz", topic: st.topic, sub: st.sub });
    $("topicGoBtn").onclick = () => HB.go({ level: "subtopics", topic: st.topic });
    $("homeHelloBtn").onclick = () => {
      const a = $("aud-greeting"); HB.stopAudio();
      if (a) { a.muted = false; const p = a.play(); if (p && p.catch) p.catch(e => console.error(e)); }
    };
    renderHome();
    HB.home();
  };
})();
