// Anatomy body scanner: Organ walkthrough (mode "walk") and Systems view (mode "systems").
// Registered as the "anatExplore" module. Inline SVG + CSS animation only; MP3 narration via window.ANAT.play.
(function () {
  const D = window.ANAT_EXPLORE_DATA;
  const $ = id => document.getElementById(id);
  const VB = { x: -90, y: 0, w: 480, h: 560 };

  // ---------- body silhouette (left contour, mirrored) ----------
  const LEFT = [[138,96],[137,112],[120,120],[98,128],[88,145],[84,190],[80,235],[76,280],[72,318],[66,340],[70,360],
    [80,352],[84,322],[92,282],[98,240],[104,195],[108,168],[110,200],[116,262],[108,312],[106,360],[112,446],[110,480],
    [124,532],[120,546],[102,552],[106,558],[140,557],[138,530],[138,480],[140,446],[146,390],[150,374]];
  function silhouette() {
    const right = LEFT.slice(0, -1).reverse().map(([x, y]) => [300 - x, y]);
    const pts = LEFT.concat(right), n = pts.length;
    let d = `M${pts[0][0]},${pts[0][1]}`;
    for (let i = 0; i < n; i++) {
      const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      d += ` C${c1[0].toFixed(1)},${c1[1].toFixed(1)} ${c2[0].toFixed(1)},${c2[1].toFixed(1)} ${p2[0]},${p2[1]}`;
    }
    return d + " Z";
  }
  const mirror = d => d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, (m, x, y) => `${300 - x},${y}`);

  // ---------- vessels / flows ----------
  const ART = ["M156,204 C154,186 146,170 144,150 L142,112 C142,98 146,88 150,80",
    "M152,206 C130,180 110,160 98,182 L88,240 L80,320", "M162,206 C180,180 196,170 204,182 L212,240 L220,320",
    "M154,214 L152,330 C140,340 132,360 128,400 L126,450 L128,530", "M156,214 L156,330 C164,342 170,360 172,400 L174,450 L172,530"];
  const VEIN = ["M156,80 C160,90 158,100 158,112 L158,150 C158,170 160,186 160,204",
    "M90,320 L97,240 L105,192 C113,178 132,188 150,210", "M210,320 L203,240 L195,192 C187,178 168,188 162,212",
    "M134,530 L132,450 L134,400 C136,362 144,342 148,330 L150,222", "M166,530 L168,450 L166,400 C164,362 158,342 154,330 L152,222"];
  const FLOWS = {
    digestive: [["#ffb703", "M150,88 C152,100 153,120 154,150 C156,180 160,210 166,232 C178,236 188,248 182,262 C176,276 160,280 150,276 C140,272 136,284 146,290 C156,296 166,288 164,300 C162,312 144,306 138,314 C134,322 142,328 128,330 C120,326 118,316 120,300 L122,272 C124,264 132,262 140,264 L162,264 C172,262 180,266 180,276 L182,316 C182,328 172,336 160,338 C154,340 152,346 150,354"]],
    respiratory: [["#7fe7ff", "M150,80 L150,92 L150,158 C144,164 136,170 128,186 C124,200 124,215 126,232"],
                  ["#7fe7ff", "M150,80 L150,158 C156,164 164,170 172,186 C176,200 176,215 174,232"]],
    circulatory: ART.map(d => ["#ff4d6d", d]).concat(VEIN.map(d => ["#4d8dff", d])),
    nervous: [["#ffd166", "M150,62 L150,332"], ["#ffd166", "M150,128 C130,138 100,150 92,200 L78,320"],
              ["#ffd166", "M150,128 C170,138 200,150 208,200 L222,320"], ["#ffd166", "M150,332 C140,352 130,382 128,450 L126,540"],
              ["#ffd166", "M150,332 C160,352 170,382 172,450 L174,540"], ["#ffd166", "M150,200 C136,206 120,212 110,222"],
              ["#ffd166", "M150,200 C164,206 180,212 190,222"]],
    urinary: [["#ffe066", "M126,266 C128,280 130,286 132,292 C138,308 142,324 146,338"],
              ["#ffe066", "M174,266 C172,280 170,286 168,292 C162,308 158,324 154,338"], ["#ffe066", "M150,352 L150,370"]]
  };
  const SYS_LABELS = {
    circulatory: [[160,212,"Heart","R"],[88,240,"Arteries","L"],[212,250,"Veins","R"],[152,300,"Aorta","L"]],
    respiratory: [[150,86,"Nose / mouth","R"],[150,130,"Trachea","L"],[124,205,"Right lung","L"],[178,205,"Left lung","R"]],
    digestive: [[150,88,"Mouth","L"],[154,150,"Esophagus","R"],[182,250,"Stomach","R"],[150,300,"Small int.","L"],[180,312,"Large int.","R"]],
    nervous: [[150,48,"Brain","L"],[150,250,"Spinal cord","R"],[86,260,"Nerves","L"]],
    skeletal: [[150,30,"Skull","L"],[124,200,"Ribs","L"],[150,280,"Spine","R"],[124,336,"Pelvis","L"],[176,410,"Femur","R"],[84,210,"Humerus","L"]],
    muscular: [[96,150,"Deltoid","L"],[203,200,"Biceps","R"],[150,280,"Core","L"],[176,420,"Quadriceps","R"],[160,212,"Heart","R"]],
    urinary: [[124,268,"Kidneys","L"],[136,310,"Ureters","L"],[150,346,"Bladder","R"]]
  };

  function grad(id, c1, c2) {
    return `<radialGradient id="${id}" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></radialGradient>`;
  }
  function buildSVG() {
    const kidneyL = "M124,254 C113,254 110,268 112,278 C114,288 126,290 131,283 C127,277 126,264 131,259 C130,256 127,254 124,254 Z";
    const lungR = "M141,150 C122,148 108,170 106,205 C104,232 110,250 122,252 C134,250 142,238 142,220 Z";
    const lungL = "M159,150 C178,148 192,170 194,205 C196,232 190,250 178,252 C168,250 164,244 166,234 C172,226 170,214 160,210 Z";
    const ribs = [0,1,2,3,4,5].map(i => { const y = 160 + i * 14, w = 34 + Math.min(i, 3) * 4;
      return `<path d="M150,${y} C${150 - w * .6},${y - 6} ${150 - w},${y + 4} ${150 - w + 4},${y + 18}"/><path d="${mirror(`M150,${y} C${150 - w * .6},${y - 6} ${150 - w},${y + 4} ${150 - w + 4},${y + 18}`)}"/>`; }).join("");
    const verts = Array.from({ length: 17 }, (_, i) => `<rect x="146" y="${102 + i * 13.5}" width="8" height="10" rx="2"/>`).join("");
    const limbBones = ["M98,136 L86,236", "M86,240 L76,318", "M90,240 L82,318", "M128,340 L124,446", "M124,452 L126,532", "M130,452 L132,530"];
    const muscles = [
      ["M96,130 C86,136 84,160 90,172 C98,166 104,150 104,136 Z"], ["M100,176 C92,184 88,210 90,232 C96,226 102,206 102,186 Z"],
      ["M112,150 C122,144 142,146 148,152 L148,184 C136,190 118,186 112,176 Z"],
      ["M136,236 L148,236 L148,320 L138,320 C134,300 134,260 136,236 Z"],
      ["M112,348 C106,370 108,410 116,438 C126,430 134,400 140,372 C134,356 122,346 112,348 Z"],
      ["M114,458 C108,474 110,500 118,516 C124,500 126,476 122,458 Z"]];
    const pair = d => `<path d="${d}"/><path d="${mirror(d)}"/>`;
    const musclesSvg = `<g data-sub="arm">${pair(muscles[0][0])}${pair(muscles[1][0])}</g>` +
      `<g data-sub="core">${pair(muscles[2][0])}${pair(muscles[3][0])}</g>` +
      `<g data-sub="leg">${pair(muscles[4][0])}${pair(muscles[5][0])}</g>`;
    const cap = (x, y) => `<path d="M${x},${y} c3,-5 7,3 10,-2 c3,-5 7,3 10,-1 M${x + 2},${y + 6} c3,-4 6,3 9,-1 c3,-4 6,3 9,0 M${x + 4},${y - 6} c3,4 6,-3 9,1"/>`;
    const vessels = `<g data-sub="arteries">${ART.map(d => `<path class="art" d="${d}"/>`).join("")}</g>` +
      `<g data-sub="veins">${VEIN.map(d => `<path class="vein" d="${d}"/>`).join("")}</g>` +
      `<g data-sub="capillaries">${cap(62, 340)}${cap(220, 340)}${cap(118, 518)}${cap(164, 518)}</g>`;
    const nerves = FLOWS.nervous.slice(1).map(([, d]) => `<path d="${d}"/>`).join("");
    const flows = Object.entries(FLOWS).map(([k, list]) => `<g class="flowgrp" data-sys="${k}">` +
      list.map(([c, d]) => `<path class="flow-track" d="${d}" stroke="${c}"/><path class="flow" d="${d}" stroke="${c}"/>`).join("") + `</g>`).join("");
    return `
<svg class="scan" id="scanSvg" viewBox="${VB.x} ${VB.y} ${VB.w} ${VB.h}" role="img" aria-label="Body scanner">
 <defs>
  <linearGradient id="gBody" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b4a6b" stop-opacity=".55"/><stop offset="1" stop-color="#0d2238" stop-opacity=".35"/></linearGradient>
  <linearGradient id="gScan" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4cc9f0" stop-opacity="0"/><stop offset="1" stop-color="#4cc9f0" stop-opacity=".35"/></linearGradient>
  ${grad("gBrain", "#f0c9cc", "#b98089")}${grad("gLung", "#e59aa2", "#9c4552")}${grad("gHeart", "#e0485c", "#7d1424")}
  ${grad("gLiver", "#a8483a", "#5a1c15")}${grad("gStom", "#f0b39c", "#b86a58")}${grad("gKid", "#b8434f", "#6a1c26")}${grad("gBlad", "#f3d78a", "#b8902f")}
  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur in="SourceAlpha" stdDeviation="3.2" result="b"/>
   <feFlood flood-color="#4cf0ff" flood-opacity=".95"/><feComposite in2="b" operator="in" result="g"/>
   <feMerge><feMergeNode in="g"/><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20,0 L0,0 0,20" fill="none" stroke="#4cc9f0" stroke-opacity=".07" stroke-width="1"/></pattern>
 </defs>
 <rect x="${VB.x}" y="0" width="${VB.w}" height="${VB.h}" fill="url(#grid)"/>
 <g class="hud-frame"><path d="M-80,14 L-80,2 L-68,2 M368,2 L380,2 L380,14 M380,546 L380,558 L368,558 M-68,558 L-80,558 L-80,546"/></g>
 <g class="part p-skin" data-part="skin"><path class="sil" d="${silhouette()}"/><ellipse class="sil" cx="150" cy="56" rx="33" ry="41"/></g>
 <g class="part p-muscles layer" data-part="muscles">${musclesSvg}</g>
 <g class="part p-bones layer" data-part="bones"><g data-sub="skull"><ellipse cx="150" cy="54" rx="29" ry="36"/><path d="M134,84 C140,94 160,94 166,84"/></g>
  <g data-sub="ribs"><path d="M112,128 L146,138 M188,128 L154,138"/><path d="M150,142 L150,232"/>${ribs}</g><g data-sub="spinebones">${verts}</g>
  <g data-sub="pelvis"><path d="M118,320 C112,300 132,296 146,316 L154,316 C168,296 188,300 182,320 C176,340 160,346 150,344 C140,346 124,340 118,320 Z"/></g>
  <g data-sub="limbs">${limbBones.map(d => `<path d="${d}"/><path d="${mirror(d)}"/>`).join("")}
  <circle cx="86" cy="238" r="4"/><circle cx="214" cy="238" r="4"/><circle cx="125" cy="449" r="5"/><circle cx="175" cy="449" r="5"/></g></g>
 <g class="part p-vessels faint" data-part="vessels">${vessels}</g>
 <g class="part p-nerves faint" data-part="nerves">${nerves}</g>
 <g class="part p-spine faint" data-part="spine"><path d="M150,62 L150,332"/></g>
 <g class="part p-kidneys" data-part="kidneys"><path d="${kidneyL}"/><path d="${mirror(kidneyL)}"/></g>
 <g class="part p-ureters faint" data-part="ureters"><path d="M130,286 C138,306 142,324 146,338"/><path d="M170,286 C162,306 158,324 154,338"/></g>
 <g class="part p-bladder" data-part="bladder"><path d="M137,344 C137,334 163,334 163,344 C163,354 156,358 150,358 C144,358 137,354 137,344 Z"/></g>
 <g class="part p-esophagus" data-part="esophagus"><path d="M153,92 C153,120 154,150 156,180 C158,205 161,220 166,232"/></g>
 <g class="part p-trachea" data-part="trachea"><path class="tube" d="M150,94 L150,158 M150,158 C144,164 138,168 132,174 M150,158 C156,164 162,168 168,174"/>
  ${Array.from({ length: 8 }, (_, i) => `<path class="ring" d="M146,${100 + i * 7} L154,${100 + i * 7}"/>`).join("")}</g>
 <g class="part p-epiglottis" data-part="epiglottis"><path d="M145,95 C147,89 155,88 158,92 C155,94 151,96 147,97 Z"/></g>
 <g class="part p-lungs" data-part="lungs"><path d="${lungR}"/><path d="${lungL}"/><path class="lobe" d="M108,206 C120,200 132,206 142,200 M164,216 C176,210 186,206 192,200"/></g>
 <g class="part p-liver" data-part="liver"><path d="M110,232 C126,225 150,227 168,233 C164,248 150,256 134,262 C120,264 110,257 108,246 Z"/></g>
 <g class="part p-stomach" data-part="stomach"><path d="M166,232 C176,226 190,230 192,244 C194,262 182,278 166,280 C156,280 150,274 154,268 C164,266 172,258 170,246 C169,240 167,236 166,232 Z"/></g>
 <g class="part p-largeint" data-part="largeint"><path d="M128,330 C120,326 118,316 120,300 L122,272 C124,264 132,262 140,264 L162,264 C172,262 180,266 180,276 L182,316 C182,328 172,336 160,338 C154,340 152,346 150,354"/></g>
 <g class="part p-smallint" data-part="smallint"><path d="M136,282 C142,274 152,290 160,280 C168,272 172,290 164,296 C156,302 146,290 138,298 C130,306 142,316 150,308 C158,300 170,312 162,320 C154,328 142,320 136,326"/></g>
 <g class="part p-heart" data-part="heart"><path d="M150,198 C142,196 138,206 142,214 C146,224 156,232 164,236 C172,228 178,218 176,208 C174,198 164,196 160,202 C158,198 154,196 150,198 Z"/>
  <path class="aorta" d="M154,198 C152,188 156,182 164,184 C170,186 170,192 168,198"/></g>
 <g class="part p-brain" data-part="brain"><path d="M124,52 C122,30 140,20 152,22 C170,22 180,34 178,52 C176,64 166,68 150,68 C134,68 125,62 124,52 Z"/>
  <path class="gyri" d="M132,36 C138,32 142,40 148,34 C154,28 158,38 164,34 C170,32 172,40 170,46 M130,50 C136,44 142,54 150,48 C158,42 164,54 172,50 M150,24 L150,66"/></g>
 <g class="part p-eyes" data-part="eyes"><ellipse class="sclera" cx="137" cy="74" rx="6.5" ry="3.6"/><ellipse class="sclera" cx="163" cy="74" rx="6.5" ry="3.6"/><circle class="iris" cx="137" cy="74" r="2.4"/><circle class="iris" cx="163" cy="74" r="2.4"/></g>
 <g class="part p-mouth" data-part="mouth"><path d="M143,88 C147,91 153,91 157,88 C153,86 147,86 143,88 Z"/></g>
 <g id="flows">${flows}</g>
 <g id="sysLabels"></g>
 <g id="reticle" class="reticle" hidden><line id="leader" x1="0" y1="0" x2="388" y2="0"/><circle id="retRing" r="13"/><circle id="retDot" r="2.5"/></g>
 <rect class="scanline" x="-20" y="-24" width="340" height="24" fill="url(#gScan)"/>
</svg>`;
  }

  // ---------- state + rendering ----------
  const st = { mode: "walk", step: 0, sys: null, bones: false, steps: D.steps, doneText: D.walkDone, doneAudio: D.walkDoneAudio };
  // Optional alternate step sources for the walkthrough (opts.source in topics.js).
  const SOURCES = { maxtopics: () => window.MAX_TOPICS_DATA && window.MAX_TOPICS_DATA.review };
  let svg, els;

  function clearParts() {
    svg.querySelectorAll(".part").forEach(p => p.classList.remove("on", "has-hot"));
    svg.querySelectorAll(".hot").forEach(p => p.classList.remove("hot"));
    svg.querySelectorAll(".flowgrp").forEach(g => g.classList.remove("show"));
    $("sysLabels").innerHTML = "";
    svg.classList.remove("focus");
    $("reticle").setAttribute("hidden", "");
  }
  function lightParts(parts) {
    svg.classList.add("focus");
    parts.forEach(p => { const g = svg.querySelector(`[data-part="${p}"]`); if (g) g.classList.add("on"); });
  }
  function play(src) { if (window.ANAT) window.ANAT.play(src); }

  function placeCallout(y) {
    const r = $("reticle");
    const narrow = window.matchMedia("(max-width: 700px)").matches;
    if (narrow) { els.callout.style.marginTop = "0px"; return; }
    const rect = svg.getBoundingClientRect();
    const px = (y - VB.y) / VB.h * rect.height;
    const h = els.callout.offsetHeight || 160;
    const top = Math.max(0, Math.min(rect.height - h, px - 28));
    els.callout.style.marginTop = top + "px";
    r.removeAttribute("hidden");
  }

  function showStep(i, speak) {
    clearParts();
    const n = st.steps.length;
    st.step = Math.max(0, Math.min(n, i));
    els.count.textContent = `${Math.min(st.step + 1, n)} / ${n}`;
    els.prev.disabled = st.step === 0;
    els.next.disabled = st.step >= n;
    els.bar.style.width = (Math.min(st.step + 1, n) / n * 100) + "%";
    if (st.step >= n) {
      els.cTag.textContent = "SCAN COMPLETE";
      els.cName.textContent = st.doneTitle || "All organs checked";
      els.cDoes.textContent = st.doneText;
      els.cFact.textContent = "";
      els.callout.style.marginTop = "0px";
      els.count.textContent = `${n} / ${n}`;
      if (speak) play(st.doneAudio);
      return;
    }
    const s = st.steps[st.step];
    lightParts(s.parts);
    if (s.flow) { const fg = svg.querySelector(`.flowgrp[data-sys="${s.flow}"]`); if (fg) fg.classList.add("show"); }
    const ret = $("reticle"); ret.removeAttribute("hidden");
    $("retRing").setAttribute("cx", s.x); $("retRing").setAttribute("cy", s.y);
    $("retDot").setAttribute("cx", s.x); $("retDot").setAttribute("cy", s.y);
    const L = $("leader"); L.setAttribute("x1", s.x + 13); L.setAttribute("y1", s.y); L.setAttribute("y2", s.y);
    els.cTag.textContent = s.tag || `TARGET ${String(st.step + 1).padStart(2, "0")}`;
    els.cName.textContent = s.name;
    els.cDoes.textContent = s.does;
    els.cFact.textContent = s.factRaw ? s.fact : "Fun fact: " + s.fact;
    placeCallout(s.y);
    if (speak) play(s.audio);
  }

  function showSystem(key, speak) {
    clearParts();
    st.sys = key;
    els.sysBtns.querySelectorAll("button").forEach(b => b.classList.toggle("active", b.dataset.sys === key));
    const s = D.systems.find(x => x.key === key);
    if (!s) return;
    lightParts(s.parts);
    const fg = svg.querySelector(`.flowgrp[data-sys="${key}"]`);
    if (fg) fg.classList.add("show");
    svg.dataset.sys = key;
    $("sysLabels").innerHTML = (SYS_LABELS[key] || []).map(([x, y, t, side]) => {
      const ex = side === "L" ? -8 : 308, tx = side === "L" ? -12 : 312;
      return `<g class="lbl"><circle cx="${x}" cy="${y}" r="2.6"/><path d="M${x},${y} L${side === "L" ? 60 : 240},${y} L${ex},${y}"/>` +
        `<text x="${tx}" y="${y + 3.5}" text-anchor="${side === "L" ? "end" : "start"}">${t}</text></g>`;
    }).join("");
    els.cTag.textContent = "SYSTEM";
    els.cName.textContent = s.name + " system";
    els.cDoes.textContent = s.does;
    els.cFact.innerHTML = "<span class='parts-h'>Parts</span>" + s.partNames.map(p => `<span class="chip">${p}</span>`).join("");
    els.callout.style.marginTop = "0px";
    if (speak) play(s.audio);
  }

  function setMode(mode) {
    st.mode = mode;
    els.view.dataset.mode = mode;
    els.walkCtl.hidden = mode !== "walk";
    els.sysBtns.hidden = mode !== "systems" || !!st.fixedSys;
    $("compChips").hidden = mode !== "component";
    $("compCtl").hidden = mode !== "component";
    $("exploreTitle").textContent = st.title || (mode === "walk" ? "Organ walkthrough" : mode === "systems" ? "Body systems" : "Component");
    $("exploreEyebrow").textContent = mode === "component" ? "Body scanner · component" : "Body scanner · review";
  }

  function init() {
    els = {
      view: $("view-anatExplore"), stage: $("scanStage"), callout: $("scanCallout"),
      cTag: $("cTag"), cName: $("cName"), cDoes: $("cDoes"), cFact: $("cFact"),
      walkCtl: $("walkCtl"), prev: $("walkPrev"), next: $("walkNext"), count: $("walkCount"), bar: $("walkBar"),
      sysBtns: $("sysBtns"), bonesBtn: $("bonesBtn"), quizBtn: $("exploreQuizBtn")
    };
    $("scanSvgWrap").innerHTML = buildSVG();
    svg = $("scanSvg");
    D.systems.forEach(s => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "sys-btn"; b.dataset.sys = s.key;
      b.style.setProperty("--c", s.color);
      b.innerHTML = `<span class="dot"></span>${s.name}`;
      b.onclick = () => showSystem(s.key, true);
      els.sysBtns.appendChild(b);
    });
    els.prev.onclick = () => showStep(st.step - 1, true);
    els.next.onclick = () => showStep(st.step + 1, true);
    els.bonesBtn.onclick = () => {
      st.bones = !st.bones; svg.classList.toggle("bones-on", st.bones);
      els.bonesBtn.setAttribute("aria-pressed", st.bones ? "true" : "false");
    };
    els.quizBtn.onclick = () => HB.goQuiz();
    window.addEventListener("resize", () => {
      if (st.mode === "walk" && st.step < st.steps.length && !els.view.hidden) placeCallout(st.steps[st.step].y);
    });
  }

  init();
  HB.registerModule("anatExplore", {
    view: "view-anatExplore",
    enter(ctx) {
      $("anatScore").hidden = true;
      const src = ctx.opts.source && SOURCES[ctx.opts.source] && SOURCES[ctx.opts.source]();
      st.steps = src ? src.steps : D.steps;
      st.doneText = src ? src.doneText : D.walkDone;
      st.doneAudio = src ? src.doneAudio : D.walkDoneAudio;
      st.title = ctx.opts.title || "";
      st.fixedSys = ctx.opts.sys || null;
      st.doneTitle = src ? "All topics reviewed" : "";
      setMode(ctx.opts.mode || "walk");
      st.bones = false; svg.classList.remove("bones-on"); els.bonesBtn.setAttribute("aria-pressed", "false");
      if (st.mode === "walk") { requestAnimationFrame(() => showStep(0, false)); showStep(0, true); }
      else if (st.fixedSys) { showSystem(st.fixedSys, true); }
      else {
        clearParts(); st.sys = null; delete svg.dataset.sys;
        els.sysBtns.querySelectorAll("button").forEach(b => b.classList.remove("active"));
        els.cTag.textContent = "SYSTEMS"; els.cName.textContent = "Pick a system";
        els.cDoes.textContent = "Tap a system to light up its parts and watch the flow.";
        els.cFact.textContent = ""; els.callout.style.marginTop = "0px";
      }
    },
    leave() { clearParts(); }
  });

  // ---------- component view (Session › Component) ----------
  function showComponent(list, i, speak) {
    clearParts();
    const c = list[i];
    const chips = $("compChips");
    chips.querySelectorAll("button").forEach((b, k) => b.classList.toggle("active", k === i));
    lightParts(c.parts);
    if (c.hot) {
      svg.querySelectorAll(`[data-sub="${c.hot}"]`).forEach(g => { g.classList.add("hot"); const p = g.closest(".part"); if (p) p.classList.add("has-hot"); });
    }
    if (c.flow) { const fg = svg.querySelector(`.flowgrp[data-sys="${c.flow}"]`); if (fg) fg.classList.add("show"); }
    const side = c.x < 150 || c.x === 150 ? "L" : "R";
    const ex = side === "L" ? -8 : 308, tx = side === "L" ? -12 : 312;
    $("sysLabels").innerHTML = `<g class="lbl"><circle cx="${c.x}" cy="${c.y}" r="2.6"/><path d="M${c.x},${c.y} L${ex},${c.y}"/>` +
      `<text x="${tx}" y="${c.y + 3.5}" text-anchor="${side === "L" ? "end" : "start"}">${c.title.replace(/^\d+\.\s*/, "")}</text></g>`;
    const ret = $("reticle"); ret.removeAttribute("hidden");
    $("retRing").setAttribute("cx", c.x); $("retRing").setAttribute("cy", c.y);
    $("retDot").setAttribute("cx", c.x); $("retDot").setAttribute("cy", c.y);
    const L = $("leader"); L.setAttribute("x1", c.x + 13); L.setAttribute("y1", c.y); L.setAttribute("y2", c.y);
    L.style.display = side === "L" ? "" : "";
    els.cTag.textContent = `COMPONENT ${String(i + 1).padStart(2, "0")}`;
    els.cName.textContent = c.title.replace(/^\d+\.\s*/, "");
    els.cDoes.textContent = c.does;
    els.cFact.textContent = /^Tip:/.test(c.fact) ? c.fact : "Fun fact: " + c.fact;
    $("compCount").textContent = `${i + 1} / ${list.length}`;
    $("compPrev").disabled = i === 0;
    $("compNext").disabled = i >= list.length - 1;
    placeCallout(c.y);
    requestAnimationFrame(() => placeCallout(c.y));
    if (speak && c.audio) play(c.audio);
  }
  HB.registerModule("anatComponent", {
    view: "view-anatExplore",
    enter(ctx) {
      $("anatScore").hidden = true;
      const list = ctx.session.components;
      st.title = ctx.session.title + " · components"; st.fixedSys = null;
      setMode("component");
      st.bones = false; svg.classList.remove("bones-on");
      const chips = $("compChips"); chips.innerHTML = "";
      list.forEach((c, k) => {
        const b = document.createElement("button");
        b.type = "button"; b.className = "comp-chip"; b.dataset.comp = c.id; b.textContent = c.title;
        b.onclick = () => HB.goComponent(k);
        chips.appendChild(b);
      });
      $("compPrev").onclick = () => HB.goComponent(ctx.comp - 1);
      $("compNext").onclick = () => HB.goComponent(ctx.comp + 1);
      $("compHear").onclick = () => { const c = list[ctx.comp]; if (c.audio) play(c.audio); };
      showComponent(list, ctx.comp, true);
    },
    leave() { clearParts(); }
  });
  window.ANAT_EXPLORE = { showStep: i => showStep(i, false), showSystem: k => showSystem(k, false) };
})();
