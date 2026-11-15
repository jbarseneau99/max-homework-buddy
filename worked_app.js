// Worked Examples — the third kind of work next to Lessons (Review) and Quizzes.
//   Data: window.WORKED_DATA (built by build_worked.py). Add an example there and it appears everywhere below.
//   Where it shows: Home tile "Worked Examples", a card on the subject page, a section on the subtopic page,
//   and a third button next to "Start review" / "Take the quiz" on every session of that subtopic.
//   Modules: "workedList" (list, filterable by subject/subtopic) and "worked" (one example, one step per tap).
//   Narration: one gTTS MP3 per line, played through HB.Narr (Pause / Replay this part / Slower). No speech APIs.
//   "Try one like it": HB.Practice with step hints + mistake feedback (HB.Hint / HB.Help); results go to Quiz History.
(function () {
  const $ = id => document.getElementById(id);
  const W = window.WORKED_DATA || { examples: [] };
  const D = window.EDTECH_DATA = window.EDTECH_DATA || {};
  const E = HB.ED;
  const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  // ---------- merge into the edtech machinery (skills, mistakes, "another way", strategy, chunked narration) ----------
  ["skills", "misc", "alt", "strategy", "chunks"].forEach(k => { D[k] = D[k] || {}; });
  Object.assign(D.skills, W.skills || {}); Object.assign(D.misc, W.misc || {}); Object.assign(D.alt, W.alt || {}); Object.assign(D.strategy, W.strategy || {});
  const stepKey = (ex, i) => `worked:${ex.id}:s${i + 1}`;
  W.examples.forEach(ex => ex.steps.forEach((s, i) => { D.chunks[stepKey(ex, i)] = s.lines.map(l => ({ text: l.t, src: l.audio })); }));

  // ---------- generator: subtract mixed numbers with regrouping (used by "Try one like it", Practise, Warm-up) ----------
  const gcd = (a, b) => { while (b) [a, b] = [b, a % b]; return a; };
  const ORD = d => ({ 2: "halves", 3: "thirds", 4: "fourths", 5: "fifths", 6: "sixths", 8: "eighths", 10: "tenths", 12: "twelfths" })[d] || d + "ths";
  const mix = (w, n, d) => n ? `${w} ${n}/${d}` : String(w);
  function genMixedSub() {
    const { ri, pick, shuffle, parseF, fmt, eq } = E;
    const pairs = [[2, 4], [4, 4], [3, 3], [3, 6], [2, 6], [6, 6], [4, 8], [2, 8], [8, 8], [5, 10], [2, 10], [5, 5], [3, 12], [4, 12]];
    for (let guard = 0; guard < 200; guard++) {
      let [d1, d2] = pick(pairs); if (Math.random() < 0.5) [d1, d2] = [d2, d1];
      const Dn = Math.max(d1, d2);
      const n1 = ri(1, d1 - 1), n2 = ri(1, d2 - 1);
      if (gcd(n1, d1) !== 1 || gcd(n2, d2) !== 1) continue;
      const a = n1 * Dn / d1, b = n2 * Dn / d2;
      if (a >= b) continue;                                     // must need regrouping
      const w1 = ri(3, 7), w2 = ri(1, w1 - 2);
      const A = parseF(mix(w1, n1, d1)), B = parseF(mix(w2, n2, d2));
      const res = { n: A.n * B.d - B.n * A.d, d: A.d * B.d }, ans = fmt(res);
      const wrongs = [[fmt({ n: (w1 - w2) * Dn + (b - a), d: Dn }), "wk_flip"], [fmt({ n: res.n + res.d, d: res.d }), "wk_whole_kept"],
        [fmt({ n: A.n * B.d + B.n * A.d, d: A.d * B.d }), "added_instead_sub"], [fmt({ n: (w1 - w2) * Dn + a, d: Dn }), "generic"]];
      const misc = {}, opts = [ans];
      wrongs.forEach(([t, id]) => { const v = parseF(t); if (opts.length >= 4 || !v || opts.some(o => eq(parseF(o), v))) return; misc[t] = id; opts.push(t); });
      if (opts.length < 4) continue;
      const conv = d1 === d2 ? `Are the bottom numbers the same? Yes, both are ${ORD(Dn)}.`
        : d1 < d2 ? `Make the bottom numbers the same: ${n1}/${d1} = ${a}/${Dn}. Now it's ${mix(w1, a, Dn)} − ${mix(w2, b, Dn)}.`
                  : `Make the bottom numbers the same: ${n2}/${d2} = ${b}/${Dn}. Now it's ${mix(w1, a, Dn)} − ${mix(w2, b, Dn)}.`;
      const steps = [conv, `Is ${a}/${Dn} less than ${b}/${Dn}? Yes, so regroup: 1 whole = ${Dn}/${Dn}. ${mix(w1, a, Dn)} becomes ${mix(w1 - 1, a + Dn, Dn)}.`,
        `Subtract the fractions (${a + Dn}/${Dn} − ${b}/${Dn}), then the wholes (${w1 - 1} − ${w2}).`];
      const fr = a + Dn - b, simp = fmt({ n: fr, d: Dn });
      const explain = `${d1 !== d2 ? (d1 < d2 ? `${n1}/${d1} = ${a}/${Dn}. ` : `${n2}/${d2} = ${b}/${Dn}. `) : ""}${mix(w1, a, Dn)} = ${mix(w1 - 1, a + Dn, Dn)}. ` +
        `${a + Dn}/${Dn} − ${b}/${Dn} = ${fr}/${Dn}${simp !== `${fr}/${Dn}` ? ` = ${simp}` : ""} and ${w1 - 1} − ${w2} = ${w1 - 1 - w2}, so the answer is ${ans}.`;
      const story = Math.random() < 0.4, P = (D.places && D.places.on) || ["Sudbury"], p = pick(P);
      const q = story ? `A sugar shack near ${p} had ${mix(w1, n1, d1)} buckets of maple sap. They boiled ${mix(w2, n2, d2)} buckets. How many buckets are left?`
                      : `${mix(w1, n1, d1)} − ${mix(w2, n2, d2)} = ?`;
      return { type: "mc", skill: "frac.mixedsub", q, answer: ans, options: shuffle(opts), misc, steps, explain, gen: true, canadian: story };
    }
    return null;
  }
  if (E && E.GEN) E.GEN["frac.mixedsub"] = genMixedSub;

  // ---------- visuals (animated SVG: fraction bars + number line) ----------
  const CY = "#4cc9f0", CY2 = "#7fe7ff", GD = "#ffc23d", GD2 = "#ffe08a", BAD = "#ff7a8a", MUT = "#93a6c6";
  const fx = v => (+v).toFixed(1);
  // phones: the 560-wide drawing is shrunk to ~300px, so draw the text bigger there
  const big = () => (window.innerWidth || 1024) < 560 ? 1.45 : 1;
  let seq = 0; const dl = (step = 0.05) => `style="--d:${Math.min(seq++ * step, 1.6).toFixed(2)}s"`;
  const T = (x, y, t, o = {}) => `<text class="fv-pop" ${dl()} x="${fx(x)}" y="${fx(y)}" text-anchor="${o.a || "middle"}" font-size="${fx((o.s || 14) * big())}" font-weight="${o.w || 800}" fill="${o.c || CY2}">${esc(t)}</text>`;
  function oneBar(b, x, y, w, h) {
    const d = b.d || 1, on = b.on == null ? d : b.on, xN = b.x || 0, cw = w / d, gold = b.col === "gold";
    let s = "";
    for (let i = 0; i < d; i++) {
      const lit = i < on, crossed = lit && i >= on - xN;
      const col = !lit ? "rgba(76,201,240,.06)" : (b.mix != null ? (i < b.mix ? CY : GD) : gold ? GD : CY);
      s += `<rect class="${lit ? "fv-fill" : ""}" ${lit ? dl() : ""} x="${fx(x + i * cw + 1)}" y="${fx(y + 1)}" width="${fx(cw - 2)}" height="${fx(h - 2)}" rx="2" fill="${col}" fill-opacity="${lit ? (crossed ? .28 : .85) : 1}" stroke="${CY2}" stroke-opacity=".5" stroke-width="1"/>`;
      if (crossed) s += `<path class="fv-draw wk-x" ${dl(0.12)} d="M${fx(x + i * cw + 5)},${fx(y + 5)} L${fx(x + (i + 1) * cw - 5)},${fx(y + h - 5)} M${fx(x + (i + 1) * cw - 5)},${fx(y + 5)} L${fx(x + i * cw + 5)},${fx(y + h - 5)}" stroke="${BAD}" stroke-width="3" stroke-linecap="round" pathLength="100"/>`;
    }
    if (b.split) for (let i = 1; i < d; i++) s += `<path class="fv-draw" ${dl(0.15)} d="M${fx(x + i * cw)},${fx(y - 4)} V${fx(y + h + 4)}" stroke="${GD2}" stroke-width="2.6" pathLength="100"/>`;
    s += `<rect x="${fx(x)}" y="${fx(y)}" width="${fx(w)}" height="${fx(h)}" rx="3" fill="none" stroke="${b.tag || b.split ? GD : CY2}" stroke-width="${b.tag || b.split ? 2.4 : 1.6}"${b.tag ? ' stroke-dasharray="6 4"' : ""}/>`;
    if (b.tag) s += T(x + w / 2, y - 8, b.tag === "borrow" ? "borrow 1 whole" : b.tag, { s: 12, c: GD2 });
    return s;
  }
  const KIND = {
    bars(v) {
      seq = 0;
      const k = big(), Wd = 560, LX = k > 1 ? 136 : 104, gap = 12, bw = v.bw ? Math.min(v.bw, Wd - LX - 12) : (Wd - LX - 3 * gap - 4) / 4, h = 36 * (k > 1 ? 1.15 : 1);
      let y = 14, s = "";
      v.rows.forEach((r, ri) => {
        if (r.brace || r.bars.some(b => b.tag)) y += 26 * k;
        s += T(LX - 12, y + h / 2 + 2, r.label, { a: "end", s: 19, c: GD2 });
        if (r.note) s += T(LX - 12, y + h / 2 + 18 * k, r.note, { a: "end", s: 11, c: MUT, w: 600 });
        r.bars.forEach((b, i) => { s += oneBar(b, LX + i * (bw + gap), y, bw, h); });
        if (r.brace) { const [i0, i1, t] = r.brace, x0 = LX + i0 * (bw + gap), x1 = LX + i1 * (bw + gap) + bw;
          s += `<path class="fv-draw" ${dl()} d="M${fx(x0)},${y - 3} V${y - 9} H${fx(x1)} V${y - 3}" fill="none" stroke="${GD}" stroke-width="2" pathLength="100"/>` + T((x0 + x1) / 2, y - 13, t, { s: 13, c: GD2 }); }
        y += h + 16 * k;
        if (v.arrow && ri === 0) { s += `<path class="fv-draw" ${dl()} d="M${LX + 2.5 * (bw + gap)},${y - 12} v18" stroke="${GD}" stroke-width="2.4" marker-end="url(#wkArr)" pathLength="100"/>` + T(LX + 2.5 * (bw + gap) - 12, y + 2, "cut 1 whole into 4/4", { a: "end", s: 12, c: GD2 }); y += 16; }
      });
      if (v.big) { s += T(Wd / 2, y + 22 * k, v.big, { s: v.answer ? 26 : 22, c: v.answer ? GD : GD2 }); y += 36 * k; }
      return `<svg viewBox="0 0 ${Wd} ${y + 6}" class="wk-svg fv" role="img" aria-label="${esc(v.rows.map(r => r.label).join(", ") + (v.big ? ". " + v.big : ""))}">
        <defs><marker id="wkArr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${GD}"/></marker></defs>${s}</svg>`;
    },
    numline(v) {
      seq = 0;
      const Wd = 560, x0 = 40, x1 = 520, Y = 92, X = n => x0 + (x1 - x0) * n / v.max;
      let s = "";
      if (v.range) s += `<rect class="fv-fill" ${dl()} x="${fx(X(v.range[0]))}" y="${Y - 14}" width="${fx(X(v.range[1]) - X(v.range[0]))}" height="28" rx="4" fill="${GD}" fill-opacity=".28" stroke="${GD}" stroke-width="1.5"/>` + T((X(v.range[0]) + X(v.range[1])) / 2, Y + 44, "answer is in here", { s: 12, c: GD2 });
      s += `<path d="M${x0 - 10},${Y} H${x1 + 10}" stroke="${CY2}" stroke-width="2"/>`;
      for (let k = 0; k <= v.max * 4; k++) { const n = k / 4, big = k % 4 === 0, mid = k % 2 === 0;
        s += `<path d="M${fx(X(n))},${Y - (big ? 10 : mid ? 7 : 4)} V${Y + (big ? 10 : mid ? 7 : 4)}" stroke="${CY2}" stroke-width="${big ? 2 : 1.2}" stroke-opacity="${big ? 1 : .7}"/>`;
        if (big) s += `<text x="${fx(X(n))}" y="${Y + 26}" text-anchor="middle" font-size="14" font-weight="700" fill="${CY2}">${n}</text>`; }
      const a = X(v.start), b = X(v.start - v.jump);
      s += `<path class="fv-draw" ${dl(0.2)} d="M${fx(a)},${Y - 8} Q${fx((a + b) / 2)},${Y - 70} ${fx(b)},${Y - 8}" fill="none" stroke="${GD}" stroke-width="2.6" marker-end="url(#wkArr)" pathLength="100"/>`;
      s += T((a + b) / 2, Y - 46, "− 2", { s: 16, c: GD2 });
      s += `<circle class="fv-pop" ${dl()} cx="${fx(a)}" cy="${Y}" r="7" fill="${CY}" stroke="#fff" stroke-width="1.5"/>` + T(a, Y - 18, v.labels[String(v.start)] || v.start, { s: 14 });
      s += `<circle class="fv-pop" ${dl()} cx="${fx(b)}" cy="${Y}" r="7" fill="${GD}" stroke="#fff" stroke-width="1.5"/>` + T(b - 4, Y - 18, v.labels[String(v.start - v.jump)] || "", { s: 14, c: GD2, a: "end" });
      if (v.caption) s += T(Wd / 2, Y + 66, v.caption, { s: 13, c: MUT, w: 600 });
      return `<svg viewBox="0 0 ${Wd} ${Y + 76}" class="wk-svg fv" role="img" aria-label="${esc(v.caption || "Number line")}">
        <defs><marker id="wkArr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="${GD}"/></marker></defs>${s}</svg>`;
    }
  };
  const WV = window.WORKED_VIS = { render: v => (v && KIND[v.kind] ? KIND[v.kind](v) : "") };

  // stacked fractions in text: "3 1/2" → 3 ½-style stacked
  function mathHTML(s) {
    return esc(s).replace(/(\d+)\/(\d+)/g, '<span class="wk-fr" aria-label="$1 over $2"><span class="wk-n">$1</span><span class="wk-d">$2</span></span>');
  }

  // ---------- lookup ----------
  const subjects = () => window.TOPICS || [];
  const subjOf = id => subjects().find(s => s.id === id);
  const subtOf = (sid, tid) => { const s = subjOf(sid); return s && (s.subtopics || []).find(t => t.id === tid); };
  const where = ex => { const s = subjOf(ex.subject), t = subtOf(ex.subject, ex.subtopic); return [s && s.title, t && t.title].filter(Boolean).join(" › "); };
  function list(f) { f = f || {}; return W.examples.filter(ex => (!f.subject || ex.subject === f.subject) && (!f.subtopic || ex.subtopic === f.subtopic)); }
  const byId = id => W.examples.find(e => e.id === id);

  // ---------- entry points (called by core.js render functions) ----------
  function card(ex, i, onClick) {
    const b = document.createElement("button");
    b.type = "button"; b.className = "card-btn wk-card-btn"; b.dataset.worked = ex.id;
    b.innerHTML = `<span class="num">${String(i + 1).padStart(2, "0")}</span><span class="wk-badge" aria-hidden="true">✎</span><span class="card-txt"><b>${mathHTML(ex.title)}</b><small>${esc(ex.blurb)} · ${ex.steps.length} narrated steps</small></span>${HB.icon("next", "chev")}`;
    b.onclick = onClick || (() => open(ex.id, { via: "page" }));
    return b;
  }
  function section(cls, title, items) {
    const sec = document.createElement("div"); sec.className = "wk-section " + cls;
    sec.innerHTML = `<div class="eyebrow">✎ Worked examples · watch it solved, step by step</div><div class="card-list wk-list"></div>`;
    items.forEach((ex, i) => sec.querySelector(".wk-list").appendChild(card(ex, i)));
    return sec;
  }
  function decorate(kind, ctx) {
    if (kind === "home") {
      const g = $("homeTiles"); if (!g || !W.examples.length) return;
      const b = document.createElement("button");
      b.type = "button"; b.className = "tile wk-tile"; b.dataset.subject = "worked";
      b.innerHTML = `<span class="wk-tile-ic" aria-hidden="true">✎</span><span class="tile-title">Worked Examples</span><span class="tile-blurb">Watch a problem solved step by step, then try one like it. ${W.examples.length} example${W.examples.length > 1 ? "s" : ""} so far.</span>`;
      b.onclick = () => HB.go({ level: "workedList", opts: {} });
      const cur = g.querySelector('[data-subject="curriculum"]'); g.insertBefore(b, cur || null);
      return;
    }
    if (kind === "subject") {
      const host = $("view-subject"); host.querySelectorAll(".wk-section").forEach(x => x.remove());
      const L = list({ subject: ctx.subject.id }); if (!L.length) return;
      const sec = document.createElement("div"); sec.className = "wk-section wk-subj";
      sec.innerHTML = `<div class="eyebrow">Three kinds of work: Lessons · Quizzes · Worked examples</div>`;
      const b = document.createElement("button"); b.type = "button"; b.className = "card-btn wk-card-btn"; b.id = "subjWorkedBtn";
      b.innerHTML = `<span class="num">✎</span><span class="wk-badge" aria-hidden="true">✎</span><span class="card-txt"><b>Worked Examples</b><small>${L.length} step-by-step example${L.length > 1 ? "s" : ""} in ${esc(ctx.subject.title)}: ${L.map(e => esc(e.title)).join(", ")}</small></span>${HB.icon("next", "chev")}`;
      b.onclick = () => HB.go({ level: "workedList", opts: { subject: ctx.subject.id } });
      sec.appendChild(b); host.appendChild(sec);
      return;
    }
    if (kind === "subtopic") {
      const host = $("view-subtopic"); host.querySelectorAll(".wk-section").forEach(x => x.remove());
      const L = list({ subject: ctx.subject.id, subtopic: ctx.subtopic.id }); if (!L.length) return;
      const sec = section("wk-subt", "", L);
      const lists = host.querySelectorAll(":scope > .eyebrow");
      host.insertBefore(sec, lists[lists.length - 1] || null);
      return;
    }
    if (kind === "session") {
      const btn = $("sessWorkedBtn"); if (!btn) return;
      const L = ctx.subject && ctx.subtopic ? list({ subject: ctx.subject.id, subtopic: ctx.subtopic.id }) : [];
      btn.hidden = !L.length; btn.closest(".big-actions").classList.toggle("three", !!L.length);
      if (!L.length) return;
      $("sessWorkedLabel").textContent = L.length === 1 ? `${L[0].title} · narrated, step by step` : `${L.length} examples · narrated, step by step`;
      btn.onclick = () => L.length === 1 ? open(L[0].id, { via: "page" }) : HB.go({ level: "workedList", opts: { subject: ctx.subject.id, subtopic: ctx.subtopic.id } });
    }
  }
  function open(id, o) { HB.state.workedVia = (o && o.via) || "list"; HB.state.workedId = id; HB.go({ level: "worked", opts: { id } }); }

  // ---------- list screen ----------
  let listOpts = {};
  HB.registerModule("workedList", {
    view: "view-workedList",
    enter(ctx) {
      listOpts = ctx.opts || {}; HB.state.workedListOpts = listOpts;
      const L = list(listOpts), box = $("wkListBox"); box.innerHTML = "";
      const s = listOpts.subject && subjOf(listOpts.subject), t = listOpts.subtopic && subtOf(listOpts.subject, listOpts.subtopic);
      $("wkListScope").textContent = t ? `${s.title} › ${t.title}` : s ? s.title : "All subjects";
      $("wkListAll").hidden = !listOpts.subject;
      $("wkListAll").onclick = () => HB.go({ level: "workedList", opts: {} });
      // group by subject › subtopic
      const groups = {}; L.forEach(ex => { const k = where(ex) || "More"; (groups[k] = groups[k] || []).push(ex); });
      Object.keys(groups).forEach(k => {
        const g = document.createElement("div"); g.className = "wk-group";
        g.innerHTML = `<div class="eyebrow">${esc(k)}</div><div class="card-list"></div>`;
        groups[k].forEach((ex, i) => g.querySelector(".card-list").appendChild(card(ex, i, () => open(ex.id, { via: "list" }))));
        box.appendChild(g);
      });
      const soon = document.createElement("div"); soon.className = "card-btn soon"; soon.setAttribute("aria-disabled", "true");
      soon.innerHTML = `<span class="num">+</span>${HB.icon("lock", "card-ic")}<span class="card-txt"><b>More worked examples coming</b><small>New ones appear here and next to the lessons and quizzes they go with.</small></span>`;
      box.appendChild(soon);
    },
    leave() {}
  });

  // ---------- one worked example ----------
  const S = { ex: null, i: 0 };
  const say = (src, listEl) => { if (!src) return; if (HB.Narr) HB.Narr.say(src, listEl); else if (window.ANAT) ANAT.play(src); };
  function render(speak) {
    const ex = S.ex, n = ex.steps.length, end = S.i >= n;
    $("wkEnd").hidden = !end; $("wkCard").hidden = end;
    $("wkBar").style.width = (Math.min(S.i + 1, n) / n * 100) + "%";
    $("wkDots").querySelectorAll("button").forEach((b, k) => { b.classList.toggle("active", k === S.i); b.classList.toggle("done", k < S.i); });
    // the written work so far (like Max's notebook)
    $("wkWork").innerHTML = ex.steps.slice(0, Math.min(S.i + 1, n)).map((s, k) => s.work ? `<li class="${k === S.i ? "now" : ""}${s.another ? " alt" : ""}">${mathHTML(s.work)}</li>` : "").join("");
    $("wkPrev").disabled = S.i === 0;
    $("wkNext").textContent = end ? "Try one like it ›" : S.i === n - 1 ? "Finish ›" : "Next ›";
    $("wkHear").hidden = false;
    if (end) {
      $("wkEndText").innerHTML = mathHTML(ex.end.t);
      if (speak) say(ex.end.audio);
      return;
    }
    const s = ex.steps[S.i];
    $("wkCount").textContent = s.another ? "Another way" : `Step ${S.i + 1} of ${n}`;
    $("wkCard").classList.toggle("another", !!s.another);
    $("wkStepTitle").innerHTML = mathHTML(s.title);
    $("wkKicker").textContent = s.kicker || ""; $("wkKicker").hidden = !s.kicker;
    $("wkLines").innerHTML = s.lines.map(l => `<li>${mathHTML(l.t)}</li>`).join("");
    $("wkVisual").innerHTML = WV.render(s.vis);
    const co = $("wkCallout");
    co.hidden = !s.callout;
    if (s.callout) {
      co.innerHTML = `<div class="wk-co-h"><b>${esc(s.callout.title)}</b><button type="button" class="btn-cyan wk-co-hear">🔊 Hear it</button></div><p>${mathHTML(s.callout.text)}</p>`;
      co.querySelector(".wk-co-hear").onclick = () => say(s.callout.audio);
    }
    if (speak) say(stepKey(ex, S.i), $("wkLines"));
  }
  function startTry() {
    const ex = S.ex, t = ex.try;
    const qs = t.questions.map(q => Object.assign({ skill: ex.skill }, q, { options: q.options.slice() }));
    const more = () => HB.Practice.open({ title: "More like it", subtitle: D.skills[ex.skill] ? D.skills[ex.skill].kid : "", questions: [genMixedSub(), genMixedSub(), genMixedSub()].filter(Boolean),
      record: { title: "Worked example · More like it", topic: "Worked example: " + ex.title }, more, moreLabel: "3 more like it" });
    HB.Practice.open({ title: "✎ " + t.title, subtitle: "Like " + ex.title, questions: qs, intro: t.intro, introAudio: t.introAudio, startLabel: "Start",
      record: { title: "Worked example · Try one like it", topic: "Worked example: " + ex.title }, more: ex.skill === "frac.mixedsub" ? more : null, moreLabel: "3 more like it" });
  }
  $("wkPrev").onclick = () => { if (S.i > 0) { S.i--; render(true); } };
  $("wkNext").onclick = () => { if (S.i >= S.ex.steps.length) return startTry(); S.i++; render(true); };
  $("wkHear").onclick = () => { render(false); if (S.i >= S.ex.steps.length) say(S.ex.end.audio); else say(stepKey(S.ex, S.i), $("wkLines")); };
  $("wkTry").onclick = startTry;
  $("wkAgain").onclick = () => { S.i = 0; render(true); };
  $("wkMore").onclick = () => HB.go({ level: "workedList", opts: {} });

  HB.registerModule("worked", {
    view: "view-worked",
    enter(ctx) {
      const ex = byId(ctx.opts && ctx.opts.id) || W.examples[0]; S.ex = ex; S.i = (ctx.opts && ctx.opts.start) || 0;
      HB.state.workedId = ex.id;
      $("wkWhere").textContent = "Worked example" + (where(ex) ? " · " + where(ex) : "");
      $("wkTitle").innerHTML = mathHTML(ex.title);
      $("wkGoal").innerHTML = `<b>You'll learn:</b> ${mathHTML(ex.goal || ex.blurb)}`;
      $("wkTags").innerHTML = (ex.tags || []).map(t => `<span class="wk-tag">${esc(t)}</span>`).join("");
      const dots = $("wkDots"); dots.innerHTML = "";
      ex.steps.forEach((s, k) => { const b = document.createElement("button"); b.type = "button"; b.className = "wk-dot" + (s.another ? " alt" : "");
        b.textContent = s.another ? "★" : String(k + 1); b.title = s.title; b.setAttribute("aria-label", `Step ${k + 1}: ${s.title}`);
        b.onclick = () => { S.i = k; render(true); }; dots.appendChild(b); });
      render(!!(ctx.opts && ctx.opts.speak !== false));
    },
    leave() {}
  });

  HB.Worked = { data: W, list, byId, open, decorate, render: WV.render, gen: genMixedSub, mathHTML, state: () => ({ id: S.ex && S.ex.id, i: S.i, n: S.ex ? S.ex.steps.length : 0 }), startTry };
})();
