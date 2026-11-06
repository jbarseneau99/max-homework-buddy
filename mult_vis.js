// SVG visuals for Multiplication reviews. window.MULT_VIS.render(spec) → HTML.
(function () {
  const CY = "#4cc9f0", CY2 = "#7fe7ff", GD = "#ffc23d", GD2 = "#ffe08a", INK = "#e8f0ff";
  const svg = (w, h, body, label) => `<svg viewBox="0 0 ${w} ${h}" class="fw-svg fv" role="img" aria-label="${label || ""}">${body}</svg>`;
  const txt = (x, y, t, o = {}) => `<text x="${x}" y="${y}" text-anchor="${o.a || "middle"}" font-size="${o.s || 14}" font-weight="${o.w || 700}" fill="${o.c || CY2}">${t}</text>`;

  function arrayVis(v) {
    const r = v.r, c = v.c, cell = 22, gap = 6, ox = 20, oy = 24;
    let s = "";
    for (let i = 0; i < r; i++) for (let j = 0; j < c; j++) {
      const x = ox + j * (cell + gap), y = oy + i * (cell + gap);
      s += `<circle cx="${x + cell / 2}" cy="${y + cell / 2}" r="8" fill="${CY}" fill-opacity=".85" stroke="${GD}" stroke-width="1.2"/>`;
    }
    const H = oy + r * (cell + gap) + 28;
    s += txt(ox + c * (cell + gap) / 2, H - 6, `${r} × ${c} = ${r * c}`, { s: 16, c: GD2, w: 800 });
    if (v.square) s += txt(ox + c * (cell + gap) / 2, 14, "square number", { s: 12, c: GD });
    return svg(Math.max(200, ox + c * (cell + gap) + 10), H, s, `Array ${r} by ${c}`);
  }
  function areaVis(v) {
    const A = v.a, B = v.b;
    if (!v.split) {
      const w = 160, h = 100;
      return svg(220, 140, `<rect x="30" y="20" width="${w}" height="${h}" rx="6" fill="rgba(76,201,240,.2)" stroke="${CY}" stroke-width="2"/>` +
        txt(110, 75, `${A} × ${B}`, { s: 22, c: GD2, w: 800 }) + txt(110, 130, `area ${A * B}`, { s: 14, c: CY2 }), `Area ${A}×${B}`);
    }
    const a0 = Math.floor(A / 10) * 10, a1 = A % 10, b0 = Math.floor(B / 10) * 10, b1 = B % 10;
    const W = 260, H = 200, ox = 40, oy = 36, tw = 180, th = 120;
    const x1 = ox + tw * (a0 / A), y1 = oy + th * (b0 / B);
    const cells = [
      [ox, oy, x1 - ox, y1 - oy, a0 * b0, a0, b0],
      [x1, oy, ox + tw - x1, y1 - oy, a1 * b0, a1, b0],
      [ox, y1, x1 - ox, oy + th - y1, a0 * b1, a0, b1],
      [x1, y1, ox + tw - x1, oy + th - y1, a1 * b1, a1, b1],
    ];
    let s = txt(ox + tw / 2, 18, `${A} × ${B}`, { s: 16, c: GD2, w: 800 });
    s += txt(ox + (x1 - ox) / 2, oy - 4, String(a0), { s: 12, c: CY2 });
    s += txt(x1 + (ox + tw - x1) / 2, oy - 4, String(a1), { s: 12, c: CY2 });
    s += txt(ox - 8, oy + (y1 - oy) / 2, String(b0), { s: 12, c: CY2, a: "end" });
    s += txt(ox - 8, y1 + (oy + th - y1) / 2, String(b1), { s: 12, c: CY2, a: "end" });
    cells.forEach(([x, y, w, h, prod], i) => {
      s += `<rect x="${x}" y="${y}" width="${Math.max(w, 1)}" height="${Math.max(h, 1)}" fill="rgba(76,201,240,${0.12 + i * 0.08})" stroke="${CY}" stroke-width="1.5"/>`;
      if (w > 28 && h > 22) s += txt(x + w / 2, y + h / 2 + 5, String(prod), { s: 14, c: GD2, w: 800 });
    });
    if (v.showSum) {
      const parts = cells.map(c => c[4]);
      s += txt(ox + tw / 2, oy + th + 24, parts.join(" + ") + " = " + A * B, { s: 13, c: GD, w: 800 });
    }
    return svg(W, H, s, `Area model ${A}×${B}`);
  }
  function latticeVis(v) {
    const as = String(v.a).split("").map(Number), bs = String(v.b).split("").map(Number);
    const n = as.length, m = bs.length, cell = 52, ox = 50, oy = 40;
    let s = "";
    as.forEach((d, j) => { s += txt(ox + j * cell + cell / 2, oy - 10, d, { s: 18, c: GD2, w: 800 }); });
    bs.forEach((d, i) => { s += txt(ox + n * cell + 18, oy + i * cell + cell / 2 + 5, d, { s: 18, c: GD2, w: 800 }); });
    for (let i = 0; i < m; i++) for (let j = 0; j < n; j++) {
      const x = ox + j * cell, y = oy + i * cell, prod = as[j] * bs[i];
      const tens = Math.floor(prod / 10), ones = prod % 10;
      s += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="rgba(8,16,36,.5)" stroke="${CY}" stroke-width="1.5"/>`;
      s += `<path d="M${x},${y} L${x + cell},${y + cell}" stroke="${CY2}" stroke-opacity=".5" stroke-width="1"/>`;
      if (v.step >= 1) {
        s += txt(x + cell * 0.32, y + cell * 0.38, tens, { s: 14, c: CY2 });
        s += txt(x + cell * 0.68, y + cell * 0.78, ones, { s: 14, c: GD2 });
      }
    }
    if (v.step >= 2) s += txt(ox + n * cell / 2, oy + m * cell + 28, `${v.a} × ${v.b} = ${v.a * v.b}`, { s: 16, c: GD, w: 800 });
    return svg(ox + n * cell + 50, oy + m * cell + 48, s, `Lattice ${v.a}×${v.b}`);
  }
  function columnVis(v) {
    const a = v.a, b = v.b, step = v.step || 0;
    let lines = [`  ${a}`, `× ${b}`, "────"];
    if (b < 10) {
      if (step >= 1) lines.push(`  ${(a % 10) * b}`.replace(/^ /, " ") );
      if (step >= 2) lines = [`  ${a}`, `×  ${b}`, "────", `  ${a * b}`];
    } else if (step >= 3) {
      const ones = a * (b % 10), tens = a * Math.floor(b / 10);
      lines = [`   ${a}`, `×  ${b}`, "─────", `   ${ones}`, `+ ${tens}0`, "─────", `  ${a * b}`];
    }
    const body = lines.map((t, i) => txt(120, 28 + i * 22, t, { s: 18, c: i === lines.length - 1 ? GD2 : CY2, w: 800, a: "middle" })).join("");
    return svg(240, 28 + lines.length * 22 + 10, `<rect x="40" y="8" width="160" height="${lines.length * 22 + 16}" rx="10" fill="rgba(8,16,36,.55)" stroke="${CY}"/>` + body, "Column method");
  }
  function peasantVis(v) {
    let a = v.a, b = v.b, rows = [], aa = a, bb = b;
    while (aa >= 1) { rows.push({ a: aa, b: bb, keep: aa % 2 === 1 }); aa = Math.floor(aa / 2); bb *= 2; }
    let s = txt(100, 18, "halve", { s: 12, c: CY2 }) + txt(180, 18, "double", { s: 12, c: CY2 });
    rows.forEach((r, i) => {
      const y = 40 + i * 22, col = r.keep ? GD2 : "#6a7a9a";
      const deco = r.keep ? "" : ` text-decoration="line-through"`;
      s += `<text x="100" y="${y}" text-anchor="middle" font-size="16" font-weight="700" fill="${col}"${deco}>${r.a}</text>`;
      s += `<text x="180" y="${y}" text-anchor="middle" font-size="16" font-weight="700" fill="${col}"${deco}>${r.b}</text>`;
    });
    const sum = rows.filter(r => r.keep).reduce((t, r) => t + r.b, 0);
    s += txt(140, 40 + rows.length * 22 + 10, `sum kept = ${sum}`, { s: 15, c: GD, w: 800 });
    return svg(280, 40 + rows.length * 22 + 28, s, "Russian peasant method");
  }
  function linesVis(v) {
    // simplified visual of intersecting groups
    const a = String(v.a), b = String(v.b);
    let s = txt(140, 20, `${v.a} × ${v.b} (line intersections)`, { s: 13, c: GD2 });
    let y = 50;
    a.split("").forEach((d, gi) => {
      for (let i = 0; i < +d; i++) s += `<path d="M40,${y + i * 6} L200,${y + i * 6}" stroke="${CY}" stroke-width="2"/>`;
      y += +d * 6 + 14;
    });
    let x0 = 60;
    b.split("").forEach((d, gi) => {
      for (let i = 0; i < +d; i++) s += `<path d="M${x0 + i * 6},36 L${x0 + i * 6 + 40},160" stroke="${GD}" stroke-width="2" opacity=".85"/>`;
      x0 += +d * 6 + 24;
    });
    s += txt(140, 178, `= ${v.a * v.b}`, { s: 16, c: GD, w: 800 });
    return svg(280, 195, s, "Japanese line method sketch");
  }
  function ninesVis(v) {
    const n = v.n, fingers = [];
    for (let i = 1; i <= 10; i++) fingers.push(i === n ? 0 : 1);
    const left = n - 1, right = 10 - n;
    let s = txt(140, 22, `9 × ${n}`, { s: 16, c: GD2, w: 800 });
    fingers.forEach((up, i) => {
      const x = 40 + i * 20;
      s += `<rect x="${x}" y="${up ? 50 : 90}" width="12" height="${up ? 70 : 30}" rx="4" fill="${up ? CY : "#5a3a4a"}" stroke="${GD}" stroke-width="1"/>`;
    });
    s += txt(140, 150, `${left} tens + ${right} ones = ${9 * n}`, { s: 14, c: GD, w: 800 });
    return svg(280, 170, s, "Nine times finger trick");
  }

  const KINDS = {
    array: arrayVis,
    area: areaVis,
    lattice: latticeVis,
    column: columnVis,
    peasant: peasantVis,
    lines: linesVis,
    nines: ninesVis,
    comm: v => svg(260, 120, txt(80, 50, `${v.a}×${v.b}`, { s: 20, c: CY2, w: 800 }) + txt(130, 50, "=", { s: 22, c: GD }) +
      txt(180, 50, `${v.b}×${v.a}`, { s: 20, c: CY2, w: 800 }) + txt(130, 90, String(v.a * v.b), { s: 24, c: GD2, w: 800 }), "Commutative"),
    dist: v => {
      const parts = v.parts || [10, 3];
      const sum = parts.map(p => v.a * p).join(" + ");
      return svg(280, 110, txt(140, 36, `${v.a} × ${v.b} = ${v.a}×(${parts.join("+")})`, { s: 14, c: CY2 }) +
        txt(140, 70, sum + " = " + v.a * v.b, { s: 18, c: GD2, w: 800 }), "Distributive");
    },
    ladder: v => {
      const lines = v.steps.map(s => `${v.n} × ${s} = ${v.n * s}`);
      return svg(240, 40 + lines.length * 28, lines.map((t, i) => txt(120, 36 + i * 28, t, { s: 18, c: i === lines.length - 1 ? GD2 : CY2, w: 800 })).join(""), "Doubling ladder");
    },
    eq: v => svg(280, 24 + (v.lines || []).length * 26, (v.lines || []).map((t, i) => txt(140, 28 + i * 26, t, { s: 15, c: i === (v.lines.length - 1) ? GD2 : CY2, w: 700 })).join(""), "Equations"),
    ticks: v => svg(280, 90, (v.vals || []).map((n, i) => txt(30 + i * 42, 50, n, { s: 16, c: GD2 })).join("") + txt(140, 80, v.label || "", { s: 13, c: CY2 }), "Counting"),
    badge: v => svg(240, 100, `<rect x="30" y="25" width="180" height="50" rx="25" fill="rgba(255,194,61,.15)" stroke="${GD}" stroke-width="2"/>` + txt(120, 56, v.text || "", { s: 14, c: GD2, w: 800 }), "Badge"),
  };

  window.MULT_VIS = {
    render(spec) {
      if (!spec || !spec.kind) return "";
      const fn = KINDS[spec.kind];
      return fn ? fn(spec) : "";
    }
  };
})();
