// Math › Equivalent Fractions.
//   window.FRAC_VIS.render(spec) → animated SVG (fraction bars, pies, ×/÷ rule, cross-multiplication, number lines).
//   "fracWalk" module: the Review walkthrough (opts {}) and the worked-example components (session.componentModule).
// Data: window.FRACTIONS_DATA (built by build_fractions.py). Quiz: maxQuiz with opts.set = "frac_equiv".
// Narration: pre-generated gTTS MP3s via ANAT.play (shared player, Sound ON/OFF, Hear it again), always from a tap.
(function () {
  const $ = id => document.getElementById(id);
  const CY = "#4cc9f0", CY2 = "#7fe7ff", GD = "#ffc23d", GD2 = "#ffe08a", BAD = "#ff7a8a";
  const fx = v => (+v).toFixed(1);
  let seq = 0;                                   // stagger counter for the build-in animation
  const dl = () => `style="--d:${Math.min(seq++ * 0.05, 0.9).toFixed(2)}s"`;

  // stacked fraction n over d, centred at x; y = baseline of the numerator
  function frac(n, d, x, y, size = 18, col = GD2) {
    const w = Math.max(String(n).length, String(d).length) * size * 0.62 + 6;
    return `<g class="fv-pop" ${dl()}><text x="${fx(x)}" y="${fx(y)}" text-anchor="middle" font-size="${size}" font-weight="800" fill="${col}">${n}</text>
      <path d="M${fx(x - w / 2)},${fx(y + size * 0.3)} H${fx(x + w / 2)}" stroke="${col}" stroke-width="2"/>
      <text x="${fx(x)}" y="${fx(y + size * 1.25)}" text-anchor="middle" font-size="${size}" font-weight="800" fill="${col}">${d}</text></g>`;
  }
  function bar(n, d, x, y, w, h, opt = {}) {
    const cw = w / d; let s = "";
    for (let i = 0; i < d; i++) {
      const on = i < n;
      s += `<rect class="${on ? "fv-fill" : ""}" ${on ? dl() : ""} x="${fx(x + i * cw + 1)}" y="${fx(y + 1)}" width="${fx(cw - 2)}" height="${fx(h - 2)}" rx="2"
        fill="${on ? (opt.col || CY) : "rgba(76,201,240,.06)"}" fill-opacity="${on ? .8 : 1}" stroke="${CY2}" stroke-opacity=".55" stroke-width="1"/>`;
    }
    return s + `<rect x="${fx(x)}" y="${fx(y)}" width="${fx(w)}" height="${fx(h)}" rx="3" fill="none" stroke="${CY2}" stroke-width="1.6"/>`;
  }
  function pie(n, d, cx, cy, r) {
    let s = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="rgba(76,201,240,.06)" stroke="${CY2}" stroke-width="1.6"/>`;
    for (let i = 0; i < d; i++) {
      const a0 = -Math.PI / 2 + i * 2 * Math.PI / d, a1 = a0 + 2 * Math.PI / d;
      const p = `M${cx},${cy} L${fx(cx + r * Math.cos(a0))},${fx(cy + r * Math.sin(a0))} A${r},${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${fx(cx + r * Math.cos(a1))},${fx(cy + r * Math.sin(a1))} Z`;
      s += `<path class="${i < n ? "fv-fill" : ""}" ${i < n ? dl() : ""} d="${p}" fill="${i < n ? CY : "none"}" fill-opacity=".8" stroke="${CY2}" stroke-opacity=".6" stroke-width="1"/>`;
    }
    return s;
  }
  const guide = (x, y0, y1, col = GD) => `<path class="fv-draw" ${dl()} d="M${fx(x)},${y0} V${y1}" stroke="${col}" stroke-width="2.4" stroke-dasharray="5 4" pathLength="100"/>`;
  const svg = (w, h, body, label) => `<svg viewBox="0 0 ${w} ${h}" class="fw-svg fv" role="img" aria-label="${label}">${body}</svg>`;
  const txt = (x, y, t, o = {}) => `<text class="fv-pop" ${dl()} x="${fx(x)}" y="${fx(y)}" text-anchor="${o.a || "middle"}" font-size="${o.s || 12}" font-weight="${o.w || 700}" fill="${o.c || CY2}">${t}</text>`;
  const F = p => `${p[0]}/${p[1]}`;
  const ORDW = d => ({ 2: "halves", 3: "thirds", 4: "fourths", 5: "fifths", 6: "sixths", 8: "eighths", 9: "ninths", 10: "tenths", 12: "twelfths" })[d] || d + "ths";

  const KINDS = {
    anatomy: v => svg(260, 190,
      frac(v.n, v.d, 52, 50, 34) +
      `<path d="M78,40 H120" stroke="${CY2}" stroke-width="1.4"/><path d="M78,90 H120" stroke="${CY2}" stroke-width="1.4"/>` +
      txt(124, 36, "numerator", { a: "start", s: 14, c: GD2, w: 800 }) + txt(124, 52, `${v.n} parts we have`, { a: "start", s: 12 }) +
      txt(124, 86, "denominator", { a: "start", s: 14, c: GD2, w: 800 }) + txt(124, 102, `${v.d} equal parts in all`, { a: "start", s: 12 }) +
      bar(v.n, v.d, 16, 132, 228, 40), `Fraction ${F([v.n, v.d])} with numerator and denominator labelled`),
    bars: v => {
      const rows = v.rows, h = 34, gap = 14, H = rows.length * (h + gap) + 14, x = 64, w = 186, first = rows[0][0] / rows[0][1];
      let s = rows.map((r, i) => frac(r[0], r[1], 30, 14 + i * (h + gap) + 12, 15) + bar(r[0], r[1], x, 10 + i * (h + gap), w, h)).join("");
      if (v.mark) s += guide(x + w * v.mark[0] / v.mark[1], 2, H - 6) + txt(x + w * v.mark[0] / v.mark[1], H - 1, F(v.mark), { s: 10, c: GD2 });
      else if (!v.noGuide) s += guide(x + w * first, 2, H - 6);
      return svg(260, H, s, "Fraction bars: " + rows.map(F).join(", "));
    },
    pies: v => {
      const k = v.items.length, W = 260, step = W / k, r = Math.min(52, step / 2 - 10);
      const s = v.items.map((p, i) => pie(p[0], p[1], step * i + step / 2, 66, r) + frac(p[0], p[1], step * i + step / 2, 146, 17)).join("") +
        (k === 2 ? txt(W / 2, 72, "=", { s: 26, c: GD, w: 800 }) : "");
      return svg(W, 190, s, "Pie circles: " + v.items.map(F).join(", "));
    },
    op: v => {
      const [a, b] = [v.a, v.b], o = v.op + " " + v.k;
      let s = frac(a[0], a[1], 40, 38, 26) + frac(b[0], b[1], 220, 38, 26) +
        `<path class="fv-draw" ${dl()} d="M70,36 Q130,4 190,36" fill="none" stroke="${GD}" stroke-width="2" pathLength="100" marker-end="url(#fvArr)"/>` +
        `<path class="fv-draw" ${dl()} d="M70,74 Q130,106 190,74" fill="none" stroke="${GD}" stroke-width="2" pathLength="100" marker-end="url(#fvArr)"/>` +
        txt(130, 22, o, { s: 15, c: GD2, w: 800 }) + txt(130, 100, o, { s: 15, c: GD2, w: 800 }) + txt(130, 62, "=", { s: 24, c: CY2, w: 800 });
      const imp = a[0] > a[1];   // improper fractions: no bars, just the rule
      if (!imp) s += bar(a[0], a[1], 16, 124, 228, 26) + bar(b[0], b[1], 16, 158, 228, 26, { col: GD }) + guide(16 + 228 * a[0] / a[1], 118, 190, CY2);
      else s += txt(130, 140, `${v.op === "×" ? "multiplied" : "divided"} top and bottom by ${v.k}`, { s: 13, c: CY2 });
      return svg(260, imp ? 156 : 196, `<defs><marker id="fvArr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${GD}"/></marker></defs>` + s,
        `${F(a)} ${o} on top and bottom gives ${F(b)}`);
    },
    cross: v => {
      const a = v.a, b = v.b, eq = v.l === v.r;
      let s = frac(a[0], a[1], 70, 40, 30, CY2) + frac(b[0], b[1], 190, 40, 30, CY2) +
        `<path class="fv-draw" ${dl()} d="M88,30 L172,76" stroke="${GD}" stroke-width="2.4" pathLength="100"/>` +
        `<path class="fv-draw" ${dl()} d="M88,76 L172,30" stroke="${GD}" stroke-width="2.4" pathLength="100"/>` +
        txt(130, 60, eq ? "=" : "≠", { s: 26, c: eq ? GD2 : BAD, w: 800 });
      s += txt(70, 128, `${a[0]} × ${b[1]} = ${v.l}`, { s: 17, c: GD2, w: 800 }) + txt(190, 128, `${a[1]} × ${b[0]} = ${v.r}`, { s: 17, c: GD2, w: 800 });
      s += `<g class="fv-pop" ${dl()}><rect x="60" y="146" width="140" height="32" rx="16" fill="${eq ? "rgba(255,194,61,.18)" : "rgba(255,122,138,.15)"}" stroke="${eq ? GD : BAD}"/>` +
        `<text x="130" y="168" text-anchor="middle" font-size="15" font-weight="800" fill="${eq ? GD2 : BAD}">${v.l} ${eq ? "=" : "≠"} ${v.r} · ${eq ? "equivalent" : "not equal"}</text></g>`;
      return svg(260, 186, s, `Cross-multiply ${F(a)} and ${F(b)}: ${v.l} and ${v.r}`);
    },
    line: v => {
      const x0 = 26, x1 = 238, gap = 50; let s = "";
      v.fr.forEach((p, i) => {
        const y = 30 + i * gap;
        s += `<path d="M${x0},${y} H${x1}" stroke="${CY2}" stroke-width="2"/>`;
        for (let t = 0; t <= p[1]; t++) { const x = x0 + (x1 - x0) * t / p[1]; s += `<path d="M${fx(x)},${y - 6} V${y + 6}" stroke="${CY2}" stroke-width="${t % p[1] ? 1.2 : 2}"/>`; }
        s += txt(x0, y + 22, "0", { s: 11 }) + txt(x1, y + 22, "1", { s: 11 });
        const x = x0 + (x1 - x0) * p[0] / p[1];
        s += `<circle class="fv-pop" ${dl()} cx="${fx(x)}" cy="${y}" r="6.5" fill="${GD}" stroke="#fff" stroke-width="1.5"/>` + txt(x + 22, y - 9, F(p), { s: 13, c: GD2, w: 800 });
      });
      const xp = x0 + (x1 - x0) * v.fr[0][0] / v.fr[0][1];
      s += guide(xp, 14, 30 + (v.fr.length - 1) * gap + 14);
      return svg(260, 30 + v.fr.length * gap - 10, s, "Number lines with " + v.fr.map(F).join(", ") + " marked");
    },
    missing: v => svg(260, 110,
      frac(v.a[0], v.a[1], 30, 24, 15) + bar(v.a[0], v.a[1], 64, 10, 186, 34) +
      `<g class="fv-pop" ${dl()}><text x="30" y="72" text-anchor="middle" font-size="15" font-weight="800" fill="${GD2}">?</text><path d="M20,76 H40" stroke="${GD2}" stroke-width="2"/><text x="30" y="94" text-anchor="middle" font-size="15" font-weight="800" fill="${GD2}">${v.d}</text></g>` +
      bar(0, v.d, 64, 58, 186, 34), `${F(v.a)} as a bar, and an empty bar cut into ${v.d} parts`),
    // two bars and the comparison: a  (<, > or =)  b. mark draws the 1/2 benchmark line.
    compare: v => {
      const x = 64, w = 186, h = 34, rows = [v.a, v.b], col = v.sym === "=" ? GD2 : v.sym === "<" ? CY2 : GD2;
      let s = rows.map((r, i) => frac(r[0], r[1], 30, 22 + i * 48, 15) + bar(r[0], r[1], x, 10 + i * 48, w, h, { col: i ? GD : CY })).join("");
      if (v.mark) s += guide(x + w * v.mark[0] / v.mark[1], 2, 104) + txt(x + w * v.mark[0] / v.mark[1], 116, "1/2 mark", { s: 10, c: GD2 });
      s += `<g class="fv-pop" ${dl()}><rect x="62" y="126" width="136" height="44" rx="12" fill="rgba(76,201,240,.10)" stroke="${CY}"/></g>` +
        frac(v.a[0], v.a[1], 96, 142, 14) + txt(130, 156, v.sym, { s: 26, c: col, w: 900 }) + frac(v.b[0], v.b[1], 164, 142, 14);
      return svg(260, 178, s, `${F(v.a)} ${v.sym} ${F(v.b)}`);
    },
    // mixed number: w whole pies + n/d of another. improper:true also shows the improper fraction; bare:true hides all labels.
    mixed: v => {
      const k = v.w + (v.n ? 1 : 0), W = 260, step = W / Math.max(k, 1), r = Math.min(38, step / 2 - 5);
      let s = "";
      for (let i = 0; i < k; i++) s += pie(i < v.w ? v.d : v.n, v.d, step * i + step / 2, 50, r);
      if (!v.bare) {
        const mx = v.improper ? 80 : 130;
        s += `<g class="fv-pop" ${dl()}><text x="${mx - 14}" y="${v.n ? 136 : 128}" text-anchor="middle" font-size="26" font-weight="800" fill="${GD2}">${v.w}</text></g>`;
        if (v.n) s += frac(v.n, v.d, mx + 12, 118, 16);
        if (v.improper) s += txt(130, 132, "=", { s: 22, c: CY2, w: 800 }) + frac(v.w * v.d + v.n, v.d, 180, 118, 16);
      }
      return svg(W, v.bare ? 100 : 160, s, v.bare ? "Pie picture" : `${v.w}${v.n ? " " + F([v.n, v.d]) : ""} = ${F([v.w * v.d + v.n, v.d])}`);
    },
    // shapes {items:[{shape:"square"|"rect"|"triangle"|"circle", n, d}]} cut into d equal parts, n shaded; "=" between
    shapes: v => {
      const k = v.items.length, W = 300, step = W / k, R = Math.min(46, step / 2 - 12);
      let s = "";
      v.items.forEach((it, i) => {
        const cx = step * i + step / 2, cy = 62, n = it.n, d = it.d;
        if (it.shape === "circle") s += pie(n, d, cx, cy, R);
        else if (it.shape === "triangle") {
          const top = [cx, cy - R], L = cx - R * 1.1, Rt = cx + R * 1.1, by = cy + R * 0.85;
          for (let j = 0; j < d; j++) { const x0 = L + (Rt - L) * j / d, x1 = L + (Rt - L) * (j + 1) / d, on = j < n;
            s += `<path class="${on ? "fv-fill" : ""}" ${on ? dl() : ""} d="M${fx(top[0])},${fx(top[1])} L${fx(x0)},${fx(by)} L${fx(x1)},${fx(by)} Z" fill="${on ? CY : "rgba(76,201,240,.06)"}" fill-opacity=".8" stroke="${CY2}" stroke-opacity=".6" stroke-width="1"/>`; }
          s += `<path d="M${fx(top[0])},${fx(top[1])} L${fx(L)},${fx(by)} L${fx(Rt)},${fx(by)} Z" fill="none" stroke="${CY2}" stroke-width="1.6"/>`;
        } else {
          let cols = d, rows = 1; for (let r = Math.floor(Math.sqrt(d)); r >= 1; r--) if (d % r === 0) { rows = r; cols = d / r; break; }
          if (it.shape === "rect") { rows = 1; cols = d; }
          const w = it.shape === "rect" ? R * 2.4 : R * 1.8, h = it.shape === "rect" ? R * 1.0 : R * 1.8, x0 = cx - w / 2, y0 = cy - h / 2;
          for (let j = 0; j < d; j++) { const c = j % cols, r = Math.floor(j / cols), on = j < n;
            s += `<rect class="${on ? "fv-fill" : ""}" ${on ? dl() : ""} x="${fx(x0 + c * w / cols + 1)}" y="${fx(y0 + r * h / rows + 1)}" width="${fx(w / cols - 2)}" height="${fx(h / rows - 2)}" rx="2" fill="${on ? CY : "rgba(76,201,240,.06)"}" fill-opacity=".8" stroke="${CY2}" stroke-opacity=".55"/>`; }
          s += `<rect x="${fx(x0)}" y="${fx(y0)}" width="${fx(w)}" height="${fx(h)}" rx="3" fill="none" stroke="${CY2}" stroke-width="1.6"/>`;
        }
        if (!v.bare) s += frac(n, d, cx, 138, 17);
        if (i && !v.bare) s += txt(step * i, 70, v.eq === false ? "≠" : "=", { s: 24, c: GD, w: 800 });
      });
      return svg(W, v.bare ? 120 : 180, s, "Shapes: " + v.items.map(it => `${it.shape} ${it.n}/${it.d}`).join(", "));
    },
    // number line nline {d, max, marks:[{v:[n,d], label?, up?}], show:"both"|"improper"|"mixed"|"none"} 0..max cut into 1/d steps
    nline: v => {
      const x0 = 18, x1 = 302, y = 66, W = 320, N = v.d * v.max, X = t => x0 + (x1 - x0) * t / N;
      let s = `<path d="M${x0},${y} H${x1}" stroke="${CY2}" stroke-width="2"/>`;
      for (let t = 0; t <= N; t++) { const whole = t % v.d === 0;
        s += `<path d="M${fx(X(t))},${y - (whole ? 10 : 6)} V${y + (whole ? 10 : 6)}" stroke="${whole ? GD2 : CY2}" stroke-width="${whole ? 2.4 : 1.2}"/>`;
        if (whole) s += txt(X(t), y + 26, String(t / v.d), { s: 13, c: GD2, w: 800 }) + (v.show === "both" || v.show === "improper" ? txt(X(t), y + 40, `${t}/${v.d}`, { s: 9, c: CY2 }) : ""); }
      (v.marks || []).forEach((m, i) => { const t = m.v[0] * v.d / m.v[1], x = X(t), up = i % 2 === 0, ly = up ? y - 22 : y - 40;
        const w = Math.floor(m.v[0] / m.v[1]), r = m.v[0] - w * m.v[1];
        const lab = m.label || (v.show === "mixed" ? (r ? `${w ? w + " " : ""}${r}/${m.v[1]}` : String(w)) : v.show === "both" ? `${m.v[0]}/${m.v[1]} = ${w ? w + " " : ""}${r}/${m.v[1]}` : `${m.v[0]}/${m.v[1]}`);
        s += `<circle class="fv-pop" ${dl()} cx="${fx(x)}" cy="${y}" r="6.5" fill="${GD}" stroke="#fff" stroke-width="1.5"/>` +
          `<path class="fv-pop" ${dl()} d="M${fx(x)},${y - 8} V${ly + 4}" stroke="${GD}" stroke-width="1.2" stroke-dasharray="2 2"/>` + txt(x, ly, lab, { s: 13, c: GD2, w: 800 }); });
      return svg(W, 112, s, `Number line from 0 to ${v.max} in ${ORDW(v.d)}`);
    },
    // mixed → improper: w d/n → (w × d + n)/d, with the steps drawn
    mix2imp: v => {
      const N = v.w * v.d + v.n;
      let s = `<g class="fv-pop" ${dl()}><text x="46" y="70" text-anchor="middle" font-size="40" font-weight="900" fill="${GD2}">${v.w}</text></g>` + frac(v.n, v.d, 84, 46, 22) +
        `<path class="fv-draw" ${dl()} d="M84,96 Q70,124 50,82" fill="none" stroke="${CY}" stroke-width="2.2" pathLength="100" marker-end="url(#fvArr2)"/>` +
        `<path class="fv-draw" ${dl()} d="M58,58 Q74,20 84,36" fill="none" stroke="${GD}" stroke-width="2.2" pathLength="100" marker-end="url(#fvArr2)"/>` +
        txt(30, 118, "① multiply", { s: 11, c: CY2, a: "start" }) + txt(56, 16, "② add", { s: 11, c: GD2, a: "start" }) +
        txt(196, 56, `${v.w} × ${v.d} + ${v.n} = ${N}`, { s: 17, c: GD2, w: 800 }) +
        frac(N, v.d, 196, 88, 22) + txt(196, 152, `same denominator: ${v.d}`, { s: 12, c: CY2 });
      return svg(270, 160, `<defs><marker id="fvArr2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${GD}"/></marker></defs>` + s,
        `${v.w} ${v.n}/${v.d}: ${v.w} times ${v.d} plus ${v.n} = ${N}, so ${N}/${v.d}`);
    },
    // improper → mixed: N/d → N ÷ d = q R r → q r/d (the denominator stays d)
    imp2mix: v => {
      const q = Math.floor(v.N / v.d), r = v.N - q * v.d;
      let s = frac(v.N, v.d, 36, 44, 24) + txt(78, 62, "→", { s: 24, c: CY2, w: 800 }) +
        txt(170, 50, `${v.N} ÷ ${v.d} = ${q} R ${r}`, { s: 18, c: GD2, w: 800 }) +
        txt(170, 76, `${q} whole${q === 1 ? "" : "s"}, ${r} left over`, { s: 12, c: CY2 }) +
        `<g class="fv-pop" ${dl()}><text x="132" y="132" text-anchor="middle" font-size="34" font-weight="900" fill="${GD2}">${q}</text></g>` + (r ? frac(r, v.d, 162, 110, 20) : "") +
        `<g class="fv-pop" ${dl()}><rect x="146" y="128" width="32" height="30" rx="6" fill="none" stroke="${GD}" stroke-width="2" stroke-dasharray="4 3"/></g>` +
        txt(236, 140, `stays ${v.d}`, { s: 12, c: GD2, w: 800 }) + txt(236, 156, `not ${v.N}!`, { s: 11, c: BAD, w: 800 });
      return svg(280, 166, s, `${v.N}/${v.d}: ${v.N} divided by ${v.d} is ${q} remainder ${r}, so ${q} ${r}/${v.d}`);
    },
    cup: v => cupVis(v)
  };
  // ---------- the cup and bowl model ----------
  // mul: a cup (cup × bowl size) fills to `fill`, tips and pours into same-size bowls (times pours) → bowls hold res.
  // div: `total` bowls of water, cut into cup-sized scoops that light up and are counted → count.
  function bowl(x, y, w, h) {
    return `<path d="M${x},${y} V${y + h - 10} Q${x},${y + h} ${x + 10},${y + h} H${x + w - 10} Q${x + w},${y + h} ${x + w},${y + h - 10} V${y}" fill="rgba(76,201,240,.05)" stroke="${CY2}" stroke-width="2"/>`;
  }
  const water = (x, y, w, h, level, cls, style, col = CY) => level <= 0 ? "" :
    `<rect class="${cls}" style="${style}" x="${fx(x + 2)}" y="${fx(y + h * (1 - level))}" width="${fx(w - 4)}" height="${fx(h * level - 2)}" rx="3" fill="${col}" fill-opacity=".75"/>`;
  const fval = p => p[0] / p[1];
  function cupVis(v) {
    const H = 100, Y = 56;
    if (v.mode === "mul") {
      const times = v.times || 1, res = fval(v.res), nb = Math.max(1, Math.ceil(res - 1e-9));
      const bw = nb > 2 ? 52 : 64, gap = 10, W = 120 + nb * (bw + gap) + 20, ch = H * fval(v.cup), cw = 40, T = 3.2;
      const cy = 30, Y = Math.round(cy + ch + 16), cx = 128 - cw;              // cup lip sits just above the first target bowl
      let s = bowl(10, Y, 64, H) + `<path d="M10,${fx(Y + H - ch)} H74" stroke="${GD}" stroke-width="1.6" stroke-dasharray="4 3"/>` +
        txt(42, Y + H + 16, "bowl = 1", { s: 11 }) + txt(42, fx(Y + H - ch - 5), `cup = ${F(v.cup)}`, { s: 10, c: GD2 });
      // target bowls (same size as the first)
      for (let i = 0; i < nb; i++) {
        const bx = 120 + i * (bw + gap), lv = Math.min(1, res - i);
        s += bowl(bx, Y, bw, H) + water(bx, Y, bw, H, lv, "fv-rise", `--d:${(1.6 + i * (times * T - 1.6) / nb).toFixed(2)}s;--t:${((times * T - 1.6) / nb).toFixed(2)}s`);
      }
      const last = 120 + (nb - 1) * (bw + gap), ll = res - (nb - 1);
      s += `<path class="fv-pop" style="--d:${(times * T).toFixed(2)}s" d="M${last - 4},${fx(Y + H * (1 - ll))} H${last + bw + 4}" stroke="${GD}" stroke-width="2.4" stroke-dasharray="5 3"/>`;
      s += `<g class="fv-pop" style="--d:${(times * T).toFixed(2)}s">` + frac(v.res[0], v.res[1], last + bw / 2, Y + H + 18, 13) + `</g>`;
      const fl = fval(v.fill);
      s += `<g class="fv-cup" style="--n:${times};transform-origin:${cx + cw}px ${fx(cy)}px">` +
        `<path d="M${cx},${fx(cy)} V${fx(cy + ch)} H${cx + cw} V${fx(cy)}" fill="rgba(255,194,61,.06)" stroke="${GD}" stroke-width="2"/>` +
        `<rect class="fv-cupw" style="--n:${times}" x="${cx + 2}" y="${fx(cy + ch * (1 - fl))}" width="${cw - 4}" height="${fx(ch * fl - 1)}" fill="${CY}" fill-opacity=".85"/>` +
        `<path d="M${cx - 3},${fx(cy + ch * (1 - fl))} H${cx + cw + 3}" stroke="${GD2}" stroke-width="1.6" stroke-dasharray="3 2"/></g>` +
        `<path class="fv-stream" style="--n:${times}" d="M${cx + cw + 1},${fx(cy + 2)} Q${cx + cw + 12},${fx(cy + 8)} ${cx + cw + 10},${Y + H - 4}" stroke="${CY2}" stroke-width="4" fill="none" stroke-linecap="round"/>` +
        txt(cx + cw / 2, 18, `${v.fill[0] === v.fill[1] ? "full" : F(v.fill) + " full"}${times > 1 ? " · pour ×" + times : ""}`, { s: 11, c: GD2 });
      const sum = `${times > 1 ? times + " × " : (v.fill[0] === v.fill[1] ? "" : F(v.fill) + " × ")}${F(v.cup)} = ${F(v.res)}`;
      return svg(W, Y + H + 42, s, `Cup and bowls: ${sum} of a bowl`);
    }
    // div
    const tot = fval(v.total), c = fval(v.cup), nb = Math.max(1, Math.ceil(tot - 1e-9)), bw = nb > 2 ? 60 : 70, gap = 12;
    const W = 20 + nb * (bw + gap) + 70, ch = H * c;
    let s = "";
    for (let i = 0; i < nb; i++) {
      const bx = 10 + i * (bw + gap);
      s += bowl(bx, Y, bw, H);
      for (let j = 0; j < v.count; j++) {                                    // cup-sized scoops, numbered in order
        const lo = Math.max(j * c, i), hi = Math.min((j + 1) * c, i + 1, tot);
        if (hi - lo < 1e-9) continue;
        const y0 = Y + H * (1 - (hi - i)), y1 = Y + H * (1 - (lo - i));
        s += `<rect class="fv-scoop" style="--d:${(0.3 + j * 0.55).toFixed(2)}s" x="${bx + 2}" y="${fx(y0 + 1)}" width="${bw - 4}" height="${fx(y1 - y0 - 2)}" rx="2" fill="${j % 2 ? GD : CY}" fill-opacity=".7"/>`;
        const mid = (j + .5) * c;
        if (mid >= i && mid < i + 1 && mid <= tot) s += `<text class="fv-pop" style="--d:${(0.3 + j * 0.55).toFixed(2)}s" x="${bx + bw / 2}" y="${fx(Y + H * (1 - (mid - i)) + 5)}" text-anchor="middle" font-size="${Math.min(14, H * c * 0.8)}" font-weight="900" fill="#08101e">${j + 1}</text>`;
      }
    }
    const cx = W - 56;
    s += `<g class="fv-scoopcup" style="--n:${v.count}"><path d="M${cx},${fx(Y + H - ch)} V${Y + H} H${cx + 40} V${fx(Y + H - ch)}" fill="rgba(255,194,61,.06)" stroke="${GD}" stroke-width="2"/>` +
      `<rect class="fv-cupw" style="--n:${v.count};animation-duration:.55s" x="${cx + 2}" y="${fx(Y + H - ch + 1)}" width="36" height="${fx(ch - 2)}" fill="${CY}" fill-opacity=".85"/></g>` +
      txt(cx + 20, Y + H + 16, `cup = ${F(v.cup)}`, { s: 11, c: GD2 });
    s += `<g class="fv-pop" style="--d:${(0.3 + v.count * 0.55).toFixed(2)}s">` + txt(W / 2 - 30, 26, `${v.total[1] === 1 ? v.total[0] : F(v.total)} ÷ ${F(v.cup)} = ${v.count} cups`, { s: 16, c: GD2, w: 800 }) + `</g>`;
    return svg(W, Y + H + 26, s, `${F(v.total)} bowls ÷ ${F(v.cup)} cup = ${v.count} cupfuls`);
  }
  window.FRAC_VIS = { render: spec => { seq = 0; return spec && KINDS[spec.kind] ? KINDS[spec.kind](spec) : ""; } };

  // ---------- fracWalk module ----------
  const D = window.FRACTIONS_DATA || { sessions: {} };
  const sess = id => {
    if (D.sessions[id]) return D.sessions[id];
    // dual Typed/Notepad nav ids end in -typed / -notepad
    const base = String(id || "").replace(/-typed$|-notepad$/, "");
    return D.sessions[base] || { review: [], components: [] };
  };
  const play = src => { if (window.ANAT && src) ANAT.play(src); };
  const st = { list: [], i: 0, mode: "review" };
  const KICK = { multiply: "Make an equivalent fraction · multiply", simplify: "Simplify · divide", check: "Check · cross-multiply",
    compare: "Compare · <, > or =", toMixed: "Improper → mixed · divide", toImproper: "Mixed → improper · multiply and add",
    mul: "Multiply · pour part of a cup", div: "Divide · count the cupfuls",
    add: "Add like fractions · same denominator", sub: "Subtract like fractions · same denominator",
    mixedEq: "Equivalent mixed number · the whole stays", model: "Same amount, different shapes", chain: "Show your work · step by step",
    order: "Order · convert first, then sort" };
  const esc = s => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

  function render(speak) {
    const s = st.list[st.i]; if (!s) return;
    $("frCount").textContent = st.mode === "review" ? `Step ${st.i + 1} of ${st.list.length}` : `Example ${st.i + 1} of ${st.list.length}`;
    $("frStepTitle").textContent = s.title;
    $("frKicker").textContent = KICK[s.kind] || ""; $("frKicker").hidden = !KICK[s.kind];
    $("frFacts").innerHTML = s.facts.map(f => `<li>${esc(f)}</li>`).join("");
    $("frFacts").classList.toggle("numbered", st.mode === "component");
    $("frVisual").innerHTML = FRAC_VIS.render(s.vis);
    $("frBar").style.width = ((st.i + 1) / st.list.length * 100) + "%";
    $("frPrev").disabled = st.i === 0;
    const last = st.i === st.list.length - 1;
    $("frNext").textContent = last ? (st.mode === "review" ? "Go to quiz ›" : "Back to review ›") : "Next ›";
    $("frChips").querySelectorAll("button").forEach((b, k) => b.classList.toggle("active", k === st.i));
    if (window.ANAT) ANAT.setScoreText("");
    if (speak) play(s.audio);
  }
  $("frPrev").onclick = () => { if (st.i <= 0) return; if (st.mode === "component") return HB.goComponent(st.i - 1); st.i--; render(true); };
  $("frNext").onclick = () => {
    const last = st.i === st.list.length - 1;
    if (st.mode === "component") return last ? HB.goReview() : HB.goComponent(st.i + 1);
    if (last) return HB.goQuiz();
    st.i++; render(true);
  };
  // Hear it replays the narration and restarts the animation
  $("frHear").onclick = () => { const s = st.list[st.i]; if (!s) return; $("frVisual").innerHTML = FRAC_VIS.render(s.vis); play(s.audio); };

  HB.registerModule("fracWalk", {
    view: "view-fracWalk",
    enter(ctx) {
      $("anatScore").hidden = true;
      const chips = $("frChips"); chips.innerHTML = "";
      if (ctx.kind === "component") {
        st.mode = "component"; st.list = sess((ctx.opts && ctx.opts.session) || ctx.session.id).components; st.i = ctx.comp || 0;
        $("frEyebrow").textContent = "Worked examples";
        st.list.forEach((c, k) => {
          const b = document.createElement("button");
          b.type = "button"; b.className = "comp-chip"; b.dataset.comp = c.id; b.textContent = c.title;
          b.onclick = () => HB.goComponent(k); chips.appendChild(b);
        });
      } else {
        st.mode = "review"; st.list = sess((ctx.opts && ctx.opts.session) || ctx.session.id).review; st.i = (ctx.opts && ctx.opts.start) || 0;
        $("frEyebrow").textContent = "Review · tap Next to step through";
      }
      chips.hidden = st.mode !== "component";
      $("frTitle").textContent = ctx.session.title;
      render(true);
    },
    leave() {}
  });
})();
