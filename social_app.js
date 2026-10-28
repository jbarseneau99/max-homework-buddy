// "factWalk" module: Social Studies review walkthroughs and component cards.
//   Review:    opts { set }            → SOCIAL_DATA.reviews[set], step by step.
//   Component: session.componentModule → SOCIAL_DATA.components[session.id][ctx.comp], with chips for all.
// Narration: pre-generated gTTS MP3s via ANAT.play (shared player, Sound ON/OFF, Hear it again), always from a tap.
(function () {
  const $ = id => document.getElementById(id);
  const D = window.SOCIAL_DATA || { reviews: {}, components: {} };
  const play = src => { if (window.ANAT && src) ANAT.play(src); };
  const st = { list: [], i: 0, mode: "review", ctx: null };

  const DIRS = [["N", 0], ["NE", 45], ["E", 90], ["SE", 135], ["S", 180], ["SW", 225], ["W", 270], ["NW", 315]];
  const VIS = {
    compass: () => `<svg viewBox="-14 -14 228 228" class="fw-svg" aria-label="Compass rose">
      <circle cx="100" cy="100" r="86" fill="none" stroke="#4cc9f0" stroke-width="1.5" opacity=".6"/>
      <circle cx="100" cy="100" r="64" fill="none" stroke="#ffc23d" stroke-width="1" stroke-dasharray="3 4"/>
      <g fill="#4cc9f0" opacity=".55">${[45, 135, 225, 315].map(a => `<path d="M100,52 L106,94 L100,100 L94,94 Z" transform="rotate(${a} 100 100)"/>`).join("")}</g>
      <g fill="#ffc23d">${[0, 90, 180, 270].map(a => `<path d="M100,24 L109,91 L100,100 L91,91 Z" transform="rotate(${a} 100 100)"/>`).join("")}</g>
      <circle cx="100" cy="100" r="5" fill="#fff"/>
      ${DIRS.map(([t, a]) => { const r = t.length === 1 ? 99 : 78, x = 100 + r * Math.sin(a * Math.PI / 180), y = 100 - r * Math.cos(a * Math.PI / 180) + 5;
        return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" text-anchor="middle" font-size="${t.length === 1 ? 16 : 11}" font-weight="800" fill="${t.length === 1 ? "#ffe08a" : "#9ff3ff"}">${t}</text>`; }).join("")}
    </svg>`,
    globe: hl => `<svg viewBox="0 0 200 200" class="fw-svg" aria-label="Globe">
      <circle cx="100" cy="100" r="80" fill="rgba(76,201,240,.08)" stroke="#4cc9f0" stroke-width="2"/>
      <g fill="none" stroke="#7fe7ff" stroke-width="${hl === "long" ? 2 : 1}" opacity="${hl === "long" ? 1 : .45}">
        ${[20, 45, 66].map(rx => `<ellipse cx="100" cy="100" rx="${rx}" ry="80"/>`).join("")}<path d="M100,20 V180"/></g>
      <g fill="none" stroke="#7fe7ff" stroke-width="${hl === "lat" ? 2 : 1}" opacity="${hl === "lat" ? 1 : .45}">
        ${[-55, -28, 28, 55].map(dy => { const w = Math.sqrt(80 * 80 - dy * dy); return `<path d="M${(100 - w).toFixed(1)},${100 + dy} H${(100 + w).toFixed(1)}"/>`; }).join("")}</g>
      <path d="M20,100 H180" stroke="#ffc23d" stroke-width="${hl === "lat" ? 3 : 2}"/>
      ${hl === "long" ? '<path d="M100,20 V180" stroke="#ffc23d" stroke-width="3"/><text x="106" y="44" font-size="12" font-weight="800" fill="#ffe08a">0° prime meridian</text>' : ""}
      <text x="24" y="95" font-size="12" font-weight="800" fill="#ffe08a">0° equator</text>
      ${hl === "lat" ? '<text x="100" y="15" text-anchor="middle" font-size="12" font-weight="800" fill="#9ff3ff">90° N</text><text x="100" y="196" text-anchor="middle" font-size="12" font-weight="800" fill="#9ff3ff">90° S</text>' : ""}
    </svg>`,
    badge: c => `<div class="fw-badge"><div class="fw-badge-ic">${(window.ANIME_ICONS && ANIME_ICONS.social) || ""}</div>
      <div class="fw-badge-k">${c.kind === "territory" ? "Territory" : "Province"}</div><div class="fw-badge-cap">★ ${c.capital}</div></div>`,
    icon: () => `<div class="fw-badge"><div class="fw-badge-ic">${(window.ANIME_ICONS && ANIME_ICONS.social) || ""}</div></div>`
  };
  function visual(s) {
    if (s.capital) return VIS.badge(s);
    if (s.visual === "compass") return VIS.compass();
    if (s.visual === "globe") return VIS.globe("");
    if (s.visual === "lat" || s.visual === "long") return VIS.globe(s.visual);
    return VIS.icon();
  }

  function render(speak) {
    const s = st.list[st.i]; if (!s) return;
    $("fwCount").textContent = `${st.i + 1} / ${st.list.length}`;
    $("fwStepTitle").textContent = s.title;
    $("fwKicker").textContent = s.kicker || ""; $("fwKicker").hidden = !s.kicker;
    $("fwFacts").innerHTML = s.facts.map(f => `<li>${f.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</li>`).join("");
    $("fwVisual").innerHTML = visual(s);
    $("fwBar").style.width = ((st.i + 1) / st.list.length * 100) + "%";
    $("fwPrev").disabled = st.i === 0;
    const last = st.i === st.list.length - 1;
    $("fwNext").textContent = last ? (st.mode === "review" ? "Go to quiz ›" : "Back to review ›") : "Next ›";
    $("fwChips").querySelectorAll("button").forEach((b, k) => b.classList.toggle("active", k === st.i));
    if (window.ANAT) ANAT.setScoreText("");
    if (speak) play(s.audio);
  }

  $("fwPrev").onclick = () => { if (st.i <= 0) return; if (st.mode === "component") return HB.goComponent(st.i - 1); st.i--; render(true); };
  $("fwNext").onclick = () => {
    const last = st.i === st.list.length - 1;
    if (st.mode === "component") return last ? HB.goReview() : HB.goComponent(st.i + 1);
    if (last) return HB.goQuiz();
    st.i++; render(true);
  };
  $("fwHear").onclick = () => play((st.list[st.i] || {}).audio);

  HB.registerModule("factWalk", {
    view: "view-factWalk",
    enter(ctx) {
      $("anatScore").hidden = true;
      const chips = $("fwChips"); chips.innerHTML = "";
      if (ctx.kind === "component") {
        st.mode = "component"; st.list = D.components[ctx.session.id] || []; st.i = ctx.comp || 0;
        $("fwEyebrow").textContent = ctx.session.title + " · components";
        st.list.forEach((c, k) => {
          const b = document.createElement("button");
          b.type = "button"; b.className = "comp-chip"; b.dataset.comp = c.id; b.textContent = c.title;
          b.onclick = () => HB.goComponent(k); chips.appendChild(b);
        });
      } else {
        st.mode = "review"; st.list = D.reviews[ctx.opts.set] || []; st.i = ctx.opts.start || 0;
        $("fwEyebrow").textContent = "Review · tap Next to step through";
      }
      chips.hidden = st.mode !== "component";
      $("fwTitle").textContent = ctx.session.title;
      render(true);
    },
    leave() {}
  });
})();
