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
  // level: home | subject | subtopic | session | review | quiz | component
  const st = { level: "home", subject: null, subtopic: null, session: null, comp: null, active: null };
  const HB = window.HB = { icon, modules, state: st };

  HB.registerModule = (name, mod) => { modules[name] = mod; };
  HB.stopAudio = () => {
    document.querySelectorAll("audio").forEach(a => { try { a.pause(); a.currentTime = 0; } catch (e) {} });
  };

  function leaveActive() {
    if (st.active && st.active.leave) { try { st.active.leave(); } catch (e) { console.error(e); } }
    st.active = null;
  }

  function placeToolbar(viewEl) {
    const holder = $("toolbarHolder");
    window.TOPICS.forEach(s => s.subtopics.forEach(t => { if (t.toolbar && $(t.toolbar)) holder.appendChild($(t.toolbar)); }));
    const tb = st.subtopic && st.subtopic.toolbar;
    if (!tb || !viewEl) return;
    const slot = viewEl.querySelector(".toolbar-slot");
    if (slot && $(tb)) slot.appendChild($(tb));
  }

  const here = () => ({ subject: st.subject, subtopic: st.subtopic, session: st.session });
  // ---- navigation targets ----
  function nextTarget() {
    const sessions = st.subtopic ? st.subtopic.sessions : [];
    switch (st.level) {
      case "home": return null;
      case "subject": { const t = st.subject.subtopics[0]; return t ? { level: "subtopic", subject: st.subject, subtopic: t, label: t.title } : null; }
      case "subtopic": { const s = sessions[0]; return s ? { level: "session", ...here(), session: s, label: s.title } : null; }
      case "session": return { level: "review", ...here(), label: "Review" };
      case "review": return { level: "quiz", ...here(), label: "Quiz" };
      case "quiz": {
        const i = sessions.indexOf(st.session);
        return i < sessions.length - 1 ? { level: "session", ...here(), session: sessions[i + 1], label: sessions[i + 1].title }
                                       : { level: "subtopic", subject: st.subject, subtopic: st.subtopic, label: "All sessions" };
      }
      case "component": {
        const comps = st.session.components;
        return st.comp < comps.length - 1 ? { level: "component", ...here(), comp: st.comp + 1, label: comps[st.comp + 1].title.replace(/^\d+\.\s*/, "") }
                                          : { level: "review", ...here(), label: "Review" };
      }
    }
  }
  function backTarget() {
    switch (st.level) {
      case "subject": return { level: "home" };
      case "subtopic": return { level: "subject", subject: st.subject };
      case "session": return { level: "subtopic", subject: st.subject, subtopic: st.subtopic };
      case "review": case "quiz": case "component": return { level: "session", ...here() };
      default: return null;
    }
  }

  function crumbs() {
    const parts = ["Home"];
    [st.subject, st.subtopic, st.session].forEach(x => { if (x) parts.push(x.title); });
    if (st.level === "review") parts.push("Review");
    if (st.level === "quiz") parts.push("Quiz");
    if (st.level === "component") parts.push(st.session.components[st.comp].title.replace(/^\d+\.\s*/, ""));
    return parts;
  }

  function updateNav() {
    const b = backTarget(), n = nextTarget();
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

  // ---- shared template screens ----
  function cardList(container, items, kindAttr, onPick, soon) {
    container.innerHTML = "";
    items.forEach((it, i) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "card-btn"; b.dataset[kindAttr] = it.id;
      b.innerHTML = `<span class="num">${String(i + 1).padStart(2, "0")}</span>${icon(it.icon, "card-ic")}<span class="card-txt"><b>${it.title}</b><small>${it.blurb || ""}</small></span>${icon("next", "chev")}`;
      b.onclick = () => onPick(it, i);
      container.appendChild(b);
    });
    if (soon) {
      const d = document.createElement("div");
      d.className = "card-btn soon"; d.setAttribute("aria-disabled", "true");
      d.innerHTML = `<span class="num">+</span>${icon("lock", "card-ic")}<span class="card-txt"><b>More coming soon</b><small>New items will appear here.</small></span>`;
      container.appendChild(d);
    }
  }
  function renderHome() {
    const g = $("homeTiles"); g.innerHTML = "";
    window.TOPICS.forEach(t => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "tile"; b.dataset.subject = t.id;
      b.innerHTML = `${icon(t.icon, "tile-ic")}<span class="tile-title">${t.title}</span><span class="tile-blurb">${t.blurb}</span>`;
      b.onclick = () => HB.go({ level: "subject", subject: t });
      g.appendChild(b);
    });
  }
  function renderSubject() {
    const s = st.subject;
    $("subjIcon").innerHTML = icon(s.icon, "hero-ic"); $("subjTitle").textContent = s.title; $("subjBlurb").textContent = s.blurb;
    cardList($("subjList"), s.subtopics, "subtopic", t => HB.go({ level: "subtopic", subject: s, subtopic: t }), s.moreComingSoon);
  }
  function renderSubtopic() {
    const t = st.subtopic;
    $("subtIcon").innerHTML = icon(t.icon, "hero-ic"); $("subtTitle").textContent = t.title; $("subtBlurb").textContent = t.blurb;
    cardList($("sessList"), t.sessions, "session", s => HB.go({ level: "session", subject: st.subject, subtopic: t, session: s }), t.moreComingSoon);
  }
  function renderSession() {
    const s = st.session;
    $("sessIcon").innerHTML = icon(s.icon, "hero-ic"); $("sessTitle").textContent = s.title; $("sessBlurb").textContent = s.blurb;
    $("sessReviewLabel").textContent = s.review.label || ""; $("sessQuizLabel").textContent = s.quiz.label || "";
    const box = $("compChipsSession"); box.innerHTML = "";
    const comps = s.components || [];
    $("compSection").hidden = !comps.length && !s.componentsSoon;
    comps.forEach((c, i) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "comp-chip"; b.dataset.comp = c.id; b.textContent = c.title;
      b.onclick = () => HB.go({ level: "component", ...here(), comp: i });
      box.appendChild(b);
    });
    if (s.componentsSoon) box.innerHTML = '<span class="comp-chip soon">Components coming soon</span>';
  }

  HB.go = function (t) {
    leaveActive();
    HB.stopAudio();
    st.level = t.level; st.subject = t.subject || null; st.subtopic = t.subtopic || null; st.session = t.session || null;
    st.comp = t.level === "component" ? t.comp : null;
    if (t.level === "home") showView("view-home");
    else if (t.level === "subject") { renderSubject(); showView("view-subject"); }
    else if (t.level === "subtopic") { renderSubtopic(); showView("view-subtopic"); }
    else if (t.level === "session") { renderSession(); showView("view-session"); }
    else {
      let name, opts, entry;
      if (t.level === "component") {
        entry = st.session.components[st.comp];
        name = entry.module || st.session.componentModule;
        opts = entry.opts || { session: st.session.id, index: st.comp };
      } else { entry = st.session[t.level]; name = entry.module; opts = entry.opts || {}; }
      const mod = modules[name];
      if (!mod) { console.error("missing module", name); return; }
      showView(mod.view);
      st.active = mod;
      updateNav();
      mod.enter({ subject: st.subject, subtopic: st.subtopic, session: st.session, kind: t.level, opts, entry, comp: st.comp });
      return;
    }
    updateNav();
  };
  HB.home = () => HB.go({ level: "home" });
  HB.back = () => { const b = backTarget(); if (b) HB.go(b); };
  HB.next = () => { const n = nextTarget(); if (n) HB.go(n); };
  HB.goQuiz = () => { if (st.session) HB.go({ level: "quiz", ...here() }); };
  HB.goReview = () => { if (st.session) HB.go({ level: "review", ...here() }); };
  HB.goComponent = i => { if (st.session) HB.go({ level: "component", ...here(), comp: i }); };

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
    $("sessReviewBtn").onclick = HB.goReview;
    $("sessQuizBtn").onclick = HB.goQuiz;
    $("homeHelloBtn").onclick = () => {
      const a = $("aud-greeting"); HB.stopAudio();
      if (a) { a.muted = false; const p = a.play(); if (p && p.catch) p.catch(e => console.error(e)); }
    };
    renderHome();
    HB.home();
  };
})();
