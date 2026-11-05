// Scratch pad: a drawing canvas for Apple Pencil / finger / mouse (Pointer Events), used on "work" questions.
// No libraries, no network. API: HB.ScratchPad.mount(el) -> pad { clear, hasInk, strokeCount, toDataURL, setEnabled,
// loadBlank, loadImage, undo }. The module-level HB.ScratchPad.clear() etc. act on the pad that is currently visible.
(function () {
  const HB = window.HB = window.HB || {};
  const BG = "#08122a", GRID = "rgba(76,201,240,.10)", INK = "#eaf2ff";
  const SIZES = { thin: 2, medium: 3.6, thick: 6.5 };
  const pads = [];

  function mount(el, opts) {
    opts = opts || {};
    el.classList.add("sp");
    el.innerHTML =
      `<div class="sp-head"><span class="sp-label">✎ ${opts.label || "Scratch pad — write your work with the pen"}</span>
        <span class="sp-tools">
          <span class="sp-sizes" role="group" aria-label="Pen size">
            <button type="button" class="sp-size" data-size="thin" aria-label="Thin pen" title="Thin"><i style="width:4px;height:4px"></i></button>
            <button type="button" class="sp-size on" data-size="medium" aria-label="Medium pen" title="Medium"><i style="width:7px;height:7px"></i></button>
            <button type="button" class="sp-size" data-size="thick" aria-label="Thick pen" title="Thick"><i style="width:11px;height:11px"></i></button>
          </span>
          <button type="button" class="sp-undo" aria-label="Undo last stroke">↶ Undo</button>
          <button type="button" class="sp-clear" aria-label="Clear the scratch pad">Clear</button>
        </span></div>
       <div class="sp-stage"><canvas class="sp-canvas" aria-label="Scratch pad drawing area"></canvas><div class="sp-empty">Write here</div></div>`;
    const cv = el.querySelector("canvas"), stage = el.querySelector(".sp-stage"), ctx = cv.getContext("2d");
    const undoB = el.querySelector(".sp-undo"), clearB = el.querySelector(".sp-clear"), empty = el.querySelector(".sp-empty");
    const s = { strokes: [], cur: null, size: "medium", enabled: true, bgImg: null, penSeen: false, w: 0, h: 0, dpr: 1 };

    function resize() {
      const r = stage.getBoundingClientRect();
      const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      if (w === s.w && h === s.h && dpr === s.dpr) return;
      s.w = w; s.h = h; s.dpr = dpr;
      cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
      cv.style.width = w + "px"; cv.style.height = h + "px";
      redraw();
    }
    function paintBg() {
      ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0);
      ctx.fillStyle = BG; ctx.fillRect(0, 0, s.w, s.h);
      ctx.strokeStyle = GRID; ctx.lineWidth = 1;
      ctx.beginPath();
      for (let y = 32; y < s.h; y += 32) { ctx.moveTo(0, y + .5); ctx.lineTo(s.w, y + .5); }
      ctx.stroke();
      if (s.bgImg) { const k = Math.min(s.w / s.bgImg.width, s.h / s.bgImg.height, 1); ctx.drawImage(s.bgImg, 0, 0, s.bgImg.width * k, s.bgImg.height * k); }
    }
    function drawStroke(st) {
      const p = st.pts; if (!p.length) return;
      ctx.strokeStyle = INK; ctx.fillStyle = INK; ctx.lineCap = "round"; ctx.lineJoin = "round";
      if (p.length === 1) { ctx.beginPath(); ctx.arc(p[0].x, p[0].y, p[0].w / 2, 0, Math.PI * 2); ctx.fill(); return; }
      for (let i = 1; i < p.length; i++) drawSeg(p[i - 1], p[i]);
    }
    function drawSeg(a, b) {
      ctx.lineWidth = (a.w + b.w) / 2; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    function redraw() { paintBg(); s.strokes.forEach(drawStroke); sync(); }
    function sync() {
      const ink = hasInk();
      undoB.disabled = !s.enabled || !s.strokes.length; clearB.disabled = !s.enabled || !ink;
      empty.hidden = ink; cv.style.touchAction = s.enabled ? "none" : "pan-y"; el.classList.toggle("sp-off", !s.enabled); el.classList.toggle("sp-has-ink", ink);
    }
    function pt(e) {
      const r = cv.getBoundingClientRect(), base = SIZES[s.size];
      const pen = e.pointerType === "pen" && e.pressure > 0;   // Apple Pencil reports real pressure
      return { x: e.clientX - r.left, y: e.clientY - r.top, w: pen ? base * (0.35 + e.pressure * 1.3) : base };
    }
    function down(e) {
      if (!s.enabled || (e.pointerType === "mouse" && e.button !== 0)) return;
      if (e.pointerType === "pen") s.penSeen = true;
      else if (e.pointerType === "touch" && s.penSeen) return;    // palm rejection once the Pencil is in use
      e.preventDefault(); resize();
      try { cv.setPointerCapture(e.pointerId); } catch (x) {}
      s.cur = { id: e.pointerId, pts: [pt(e)] }; s.strokes.push(s.cur);
      ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0); drawStroke(s.cur); sync();
    }
    function move(e) {
      if (!s.cur || e.pointerId !== s.cur.id) return;
      e.preventDefault();
      const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [];
      (evs.length ? evs : [e]).forEach(ce => {
        const q = pt(ce), last = s.cur.pts[s.cur.pts.length - 1];
        if (Math.abs(q.x - last.x) + Math.abs(q.y - last.y) < 0.6) return;
        s.cur.pts.push(q); ctx.setTransform(s.dpr, 0, 0, s.dpr, 0, 0); ctx.strokeStyle = INK; ctx.lineCap = "round"; drawSeg(last, q);
      });
    }
    function up(e) { if (s.cur && e.pointerId === s.cur.id) { s.cur = null; sync(); } }
    cv.addEventListener("pointerdown", down);
    cv.addEventListener("pointermove", move);
    cv.addEventListener("pointerup", up);
    cv.addEventListener("pointercancel", up);
    // iOS Safari: stop the page scrolling / magnifier while writing
    ["touchstart", "touchmove"].forEach(t => cv.addEventListener(t, e => { if (s.enabled) e.preventDefault(); }, { passive: false }));
    cv.addEventListener("contextmenu", e => e.preventDefault());

    el.querySelectorAll(".sp-size").forEach(b => b.onclick = () => {
      s.size = b.dataset.size; el.querySelectorAll(".sp-size").forEach(x => x.classList.toggle("on", x === b));
    });
    undoB.onclick = () => { if (s.enabled) { s.strokes.pop(); redraw(); } };
    clearB.onclick = () => { if (s.enabled) pad.clear(); };
    if (window.ResizeObserver) new ResizeObserver(resize).observe(stage); else window.addEventListener("resize", resize);

    function hasInk() { return s.strokes.length > 0 || !!s.bgImg; }
    const pad = {
      el, canvas: cv,
      clear() { s.strokes = []; s.cur = null; s.bgImg = null; resize(); redraw(); },
      hasInk, strokeCount: () => s.strokes.length,
      undo() { s.strokes.pop(); redraw(); },
      toDataURL(type) {
        resize(); redraw();
        // saved copy at ~1x CSS size (max 1400px wide) so many submissions fit in localStorage
        const k = Math.min(1, 1400 / cv.width, Math.max(1, s.w) / cv.width * 1.25);
        if (k >= 1) return cv.toDataURL(type || "image/png");
        const o = document.createElement("canvas"); o.width = Math.round(cv.width * k); o.height = Math.round(cv.height * k);
        const c2 = o.getContext("2d"); c2.imageSmoothingQuality = "high"; c2.drawImage(cv, 0, 0, o.width, o.height);
        return o.toDataURL(type || "image/png");
      },
      setEnabled(on) { s.enabled = !!on; s.cur = null; sync(); },
      loadBlank() { s.enabled = true; pad.clear(); },
      // show a saved drawing (read-only review of an answered question)
      loadImage(url) {
        return new Promise(res => {
          s.strokes = []; s.cur = null; s.bgImg = null;
          if (!url) { redraw(); return res(false); }
          const im = new Image();
          im.onload = () => { s.bgImg = im; resize(); redraw(); res(true); };
          im.onerror = () => { redraw(); res(false); };
          im.src = url;
        });
      },
      isVisible: () => !!el.offsetParent
    };
    resize(); sync();
    pads.push(pad);
    return pad;
  }

  const active = () => pads.find(p => p.isVisible()) || pads[pads.length - 1] || null;
  const call = (m, d) => (...a) => { const p = active(); return p ? p[m](...a) : d; };
  HB.ScratchPad = { mount, active, pads,
    clear: call("clear"), hasInk: call("hasInk", false), strokeCount: call("strokeCount", 0), toDataURL: call("toDataURL", ""),
    setEnabled: call("setEnabled"), loadBlank: call("loadBlank"), loadImage: call("loadImage"), undo: call("undo") };

  // ---------- saved work submissions (localStorage hb.work.v1; last 20) ----------
  const WORK = "hb.work.v1", MAX = 20;
  function list() { try { return JSON.parse(localStorage.getItem(WORK)) || []; } catch (e) { return []; } }
  function write(arr) {
    for (;;) {
      try { localStorage.setItem(WORK, JSON.stringify(arr)); return true; }
      catch (e) {
        // quota: strip the oldest drawing first, then drop the oldest entries
        const k = arr.map(x => !!x.pngDataUrl).lastIndexOf(true);
        if (k > 0) arr[k] = { ...arr[k], pngDataUrl: "" };
        else if (arr.length > 1) arr.pop();
        else return false;
      }
    }
  }
  HB.work = {
    KEY: WORK, list,
    save(rec) {
      const r = { id: "w" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), ts: new Date().toISOString(), ...rec };
      const arr = [r].concat(list()).slice(0, MAX);
      write(arr); return r;
    },
    get: id => list().find(x => x.id === id),
    clear() { try { localStorage.removeItem(WORK); } catch (e) {} }
  };
})();
