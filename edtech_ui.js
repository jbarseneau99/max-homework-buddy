// Study Buddy edtech features (UI). Data: EDTECH_DATA (edtech_data.js). Logic: HB.ED (edtech_core.js).
//   HB.Help      mistake-specific feedback after a wrong answer + "Explain it another way" + "Try one like it"
//   HB.Hint      step-by-step hints for math (one step per tap, then the worked solution)
//   HB.Practice  small question runner (Try one like it, Practise one, Warm-up, Car ride)
//   HB.Lesson    "Today you'll learn / You've got it when…" goal card, Start → Learn → Wrap-up, confidence tap
//   HB.Narr      chunked narration with Pause, Replay this part and Slower (HTML5 audio playbackRate; MP3 only)
//   HB.Describe  spoken picture descriptions;  HB.SkillMap  Curriculum skill map;  HB.Warmup / HB.CarRide
//   HB.confidence (hb.confidence.v1)
// No timers, lives, streaks, coins or grade labels. Nothing leaves the device (AI explanations use the key in Settings only).
(function () {
  const $ = id => document.getElementById(id);
  const D = window.EDTECH_DATA || { misc: {}, alt: {}, goals: {}, goalSkills: {}, chunks: {}, describe: {}, glossary: {}, car: [], ui: {}, skills: {} };
  const E = HB.ED;
  const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
  const isMath = sk => !!(D.skills[sk] && D.skills[sk].math);
  const kid = sk => (D.skills[sk] && D.skills[sk].kid) || sk;
  const playClip = src => { if (!src) return; if (window.ANAT) ANAT.play(src); };
  const el = (tag, cls, html) => { const x = document.createElement(tag); if (cls) x.className = cls; if (html != null) x.innerHTML = html; return x; };

  // ===================== confidence (hb.confidence.v1) =====================
  const CKEY = "hb.confidence.v1";
  const CONF = { got: { label: "Got it", emoji: "😀" }, kind: { label: "Kind of", emoji: "🙂" }, notyet: { label: "Not yet", emoji: "🤔" } };
  HB.confidence = {
    KEY: CKEY, LEVELS: CONF,
    list: () => { const a = load(CKEY, []); return Array.isArray(a) ? a : []; },
    add(r) { const e = { id: "c" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), at: new Date().toISOString(), lesson: r.lesson || "", title: r.title || "",
        subject: r.subject || "", skill: r.skill || "", level: CONF[r.level] ? r.level : "kind" };
      save(CKEY, [e].concat(HB.confidence.list())); return e; },
    merge(arr) { if (!Array.isArray(arr)) return 0; const have = new Set(HB.confidence.list().map(x => x.id)); const add = arr.filter(x => x && x.id && !have.has(x.id));
      save(CKEY, add.concat(HB.confidence.list()).sort((a, b) => String(b.at).localeCompare(String(a.at)))); return add.length; },
    clear: () => { try { localStorage.removeItem(CKEY); } catch (e) {} }
  };

  // ===================== history: tag every saved question with its skill =====================
  if (HB.recordResult) {
    const rr = HB.recordResult;
    HB.recordResult = r => {
      try { if (r && Array.isArray(r.questions)) { r.questions.forEach(q => { if (!q.skill) { const s = E.skillOfHist(r, q); if (s) q.skill = s; } });
        const ss = [...new Set(r.questions.map(q => q.skill).filter(Boolean))]; if (!r.skill && ss.length === 1) r.skill = ss[0]; } } catch (e) { console.warn(e); }
      return rr(r);
    };
  }

  // ===================== narration: chunks + Pause / Replay this part / Slower =====================
  const NKEY = "hb.narration.v1", SLOW = 0.8;
  const nset = Object.assign({ slow: false }, load(NKEY, {}));
  let cur = null, seq = null;
  const pill = el("div", "ed-narr", `<span class="ed-narr-lbl" id="edNarrLbl">Narration</span>
    <button type="button" id="edNarrPause" aria-label="Pause">⏸ Pause</button>
    <button type="button" id="edNarrReplay">↺ Replay this part</button>
    <button type="button" id="edNarrSlow" aria-pressed="${nset.slow}">🐢 Slower</button>
    <button type="button" id="edNarrClose" class="ed-x" aria-label="Hide narration controls">×</button>`);
  pill.id = "edNarr"; pill.hidden = true; document.body.appendChild(pill);
  const rate = () => nset.slow ? SLOW : 1;
  // the controls sit inside the lesson (sticky at the top while scrolling), only on review / walkthrough screens
  const lessonLevel = () => !!(HB.state && (HB.state.level === "review" || HB.state.level === "component"));
  function placePill() {
    const v = document.querySelector("section.view:not([hidden])"); if (!v) return;
    if (pill.parentNode !== v) { const g = v.querySelector(":scope > .ed-goal"), t = v.querySelector(":scope > .toolbar-slot");
      const after = g && !g.hidden ? g : t; if (after) after.after(pill); else v.prepend(pill); }
    pill.hidden = false;
  }
  const applyRate = a => { try { a.defaultPlaybackRate = rate(); a.playbackRate = rate(); if ("preservesPitch" in a) a.preservesPitch = true; } catch (e) {} };
  const ends = (a, src) => !!(a && src && decodeURIComponent(a.currentSrc || a.src || "").endsWith(src));
  function updatePill() {
    if (pill.hidden) return;
    const playing = cur && !cur.paused && !cur.ended;
    $("edNarrPause").textContent = playing ? "⏸ Pause" : "▶ Play";
    $("edNarrPause").setAttribute("aria-label", playing ? "Pause" : "Play");
    $("edNarrSlow").setAttribute("aria-pressed", String(nset.slow));
    $("edNarrSlow").classList.toggle("on", nset.slow);
    $("edNarrLbl").textContent = seq ? `Narration · part ${seq.k + 1} of ${seq.list.length}` : "Narration";
  }
  document.addEventListener("play", e => {
    const a = e.target; if (!(a instanceof HTMLMediaElement)) return;
    cur = a; applyRate(a);
    if (seq && !(a === seq.player && ends(a, seq.expect))) endSeq();
    if (lessonLevel() && !pill.dataset.closed) placePill();
    updatePill();
  }, true);
  ["pause", "ended"].forEach(t => document.addEventListener(t, e => { if (e.target === cur) updatePill(); }, true));
  function highlight() { document.querySelectorAll(".narr-on").forEach(x => x.classList.remove("narr-on"));
    if (!seq || !seq.listEl) return; const lis = seq.listEl.querySelectorAll(":scope > li"); if (lis.length === seq.list.length && lis[seq.k]) lis[seq.k].classList.add("narr-on"); }
  function endSeq() { seq = null; document.querySelectorAll(".narr-on").forEach(x => x.classList.remove("narr-on")); }
  function playChunk() { const c = seq.list[seq.k]; seq.expect = c.src; highlight(); updatePill(); playClip(c.src); }
  const anatPlayer = $("anatPlayer");
  if (anatPlayer) anatPlayer.addEventListener("ended", () => {
    if (!seq || seq.paused || !ends(anatPlayer, seq.expect)) return;
    if (seq.k < seq.list.length - 1) { seq.k++; playChunk(); } else { endSeq(); updatePill(); }
  });
  HB.Narr = {
    // play a step's narration: in short chunks when chunk MP3s exist (highlighting the matching line), else the whole MP3
    say(src, listEl) {
      endSeq();
      const ch = src && D.chunks[src];
      if (!ch || !window.ANAT || !anatPlayer) return playClip(src);
      seq = { list: ch, k: 0, listEl: listEl || null, player: anatPlayer, paused: false, src };
      playChunk();
    },
    pause() { if (cur && !cur.paused) cur.pause(); if (seq) seq.paused = true; updatePill(); },
    resume() { if (seq) seq.paused = false; if (cur) { applyRate(cur); const p = cur.play(); if (p && p.catch) p.catch(() => {}); } updatePill(); },
    replay() { if (seq) { seq.paused = false; playChunk(); return; } if (cur) { try { cur.currentTime = 0; } catch (e) {} applyRate(cur); const p = cur.play(); if (p && p.catch) p.catch(() => {}); } },
    setSlow(on) { nset.slow = !!on; save(NKEY, nset); document.querySelectorAll("audio").forEach(applyRate); updatePill(); },
    isSlow: () => nset.slow, rate, state: () => ({ seq: seq ? { k: seq.k, n: seq.list.length, paused: seq.paused } : null, slow: nset.slow, rate: cur ? cur.playbackRate : 1 })
  };
  $("edNarrPause").onclick = () => { if (cur && !cur.paused && !cur.ended) HB.Narr.pause(); else HB.Narr.resume(); };
  $("edNarrReplay").onclick = () => HB.Narr.replay();
  $("edNarrSlow").onclick = () => HB.Narr.setSlow(!nset.slow);
  $("edNarrClose").onclick = () => { pill.hidden = true; pill.dataset.closed = "1"; };

  // ===================== spoken picture descriptions =====================
  HB.Describe = {
    set(box, key) {
      if (!box) return; const d = key && D.describe[key];
      box.hidden = !d; box.innerHTML = d ? `<button type="button" class="ed-describe-btn btn-cyan">🔊 Describe the picture</button><p class="ed-describe-text" hidden></p>` : "";
      if (!d) return;
      box.dataset.key = key;
      box.querySelector("button").onclick = () => { const p = box.querySelector("p"); p.hidden = false; p.textContent = d.text; playClip(d.audio); };
    },
    get: key => D.describe[key] || null
  };

  // ===================== step-by-step hints =====================
  HB.Hint = {
    mount(box, hints) {
      if (!box) return; box.innerHTML = ""; box.hidden = !hints || !(hints.steps || []).length && !hints.worked;
      if (box.hidden) return;
      const steps = (hints.steps || []).filter(Boolean); let k = 0;
      box.innerHTML = `<button type="button" class="ed-hint-btn">💡 Hint</button><ol class="ed-hint-steps"></ol><div class="ed-worked" hidden><div class="eyebrow">Worked solution</div><p></p></div>`;
      const btn = box.querySelector(".ed-hint-btn"), ol = box.querySelector("ol"), wk = box.querySelector(".ed-worked");
      const label = () => { btn.textContent = k < steps.length ? (k === 0 ? `💡 Hint (step 1 of ${steps.length})` : `💡 Next hint (step ${k + 1} of ${steps.length})`) : wk.hidden ? "📖 Show the worked solution" : "✓ Solution shown"; btn.disabled = !wk.hidden && k >= steps.length; };
      btn.onclick = () => {
        if (k < steps.length) { ol.insertAdjacentHTML("beforeend", `<li>${esc(steps[k])}</li>`); k++; }
        else if (wk.hidden) { wk.hidden = false; wk.querySelector("p").textContent = hints.worked || ""; }
        label();
      };
      label();
    },
    // reveal the worked solution and stop (after the question is answered)
    finish(box) { if (!box || box.hidden) return; const b = box.querySelector(".ed-hint-btn"); if (b) b.hidden = true; },
    clear(box) { if (box) { box.innerHTML = ""; box.hidden = true; } }
  };

  // ===================== mistake feedback =====================
  function altList(ctx) {
    const out = [], sk = ctx.skill;
    const g = t => t && D.glossary[String(t).toLowerCase().replace(/\(.*?\)/g, "").replace(/^the /, "").replace(/ system$/, "").replace(/[^a-zé ]/g, "").replace(/s$/, "").trim()];
    if (!isMath(sk)) {
      const q = ctx.q || {}, ans = q.answer || (ctx.diag && ctx.diag.b), given = ctx.diag && ctx.diag.a;
      const ga = g(ans) || (q.word && g(q.word)); if (ga) out.push({ text: `${ga.term}: ${ga.text}`, audio: ga.audio, from: "lesson" });
      const gg = g(given); if (gg && gg !== ga) out.push({ text: `And ${gg.term}: ${gg.text}`, audio: gg.audio, from: "lesson" });
    } else if (ctx.q && ctx.q.explain) out.push({ text: "With your numbers: " + ctx.q.explain, audio: "", from: "question" });
    (D.alt[sk] || []).forEach(a => out.push({ text: a.text, audio: a.audio, from: "skill" }));
    return out;
  }
  function similar(ctx) {
    const sk = ctx.skill, q = ctx.q || {};
    if (isMath(sk)) {
      if (sk === "mult.facts" && q.mult) return E.gen(sk, { a: q.mult[0] });
      if (sk === "div.long" && q.div) return E.gen(sk, { d: Math.min(25, Math.max(12, q.div[1])) });
      return E.gen(sk);
    }
    if (sk === "spell.words") { const pool = D.car.filter(c => c.skill === "spell.words" && c.word && c.word !== q.word); return pool.length ? Object.assign({}, E.pick(pool)) : null; }
    return poolPick(sk, q);
  }
  // non-math: a question of the same skill, preferring one that mentions the same idea
  function poolPick(sk, q, exclude) {
    const idx = E.index(), cands = [];
    idx.forEach(v => { if (v.skill !== sk || !v.q || v.q.type === "sentence" || v.q.type === "number" && !isMath(sk)) return;
      if (q && E.qkey(v.q.q) === E.qkey(q.q)) return; if (exclude && exclude.has(E.qkey(v.q.q))) return; cands.push(v.q); });
    if (!cands.length) return null;
    const words = new Set(String([q && q.q, q && q.answer].join(" ")).toLowerCase().match(/[a-zé]{4,}/g) || []);
    const score = x => (String([x.q, x.answer, (x.options || []).join(" ")].join(" ")).toLowerCase().match(/[a-zé]{4,}/g) || []).filter(w => words.has(w)).length;
    const best = E.shuffle(cands).sort((a, b) => score(b) - score(a));
    return best[0];
  }
  HB.Help = {
    // ctx = { skill, q, given, res, notepad, subject, practice }
    show(box, ctx) {
      if (!box) return;
      const diag = E.diagnose(ctx) || { id: "generic" }, m = D.misc[diag.id] || D.misc.generic || { label: "Not quite.", why: "" };
      ctx.diag = diag;
      const alts = altList(ctx);
      const aiOk = !!(HB.ai && HB.ai.ready() && HB.explainAnother) && (ctx.notepad || (ctx.q && ctx.q.type === "sentence"));
      const canSimilar = !!similar(ctx);
      box.hidden = false; box.dataset.misc = diag.id;
      box.innerHTML = `<div class="ed-help" role="region" aria-label="What happened">
        <div class="eyebrow">🔎 What happened</div>
        <p class="ed-miss"><b>${esc(m.label)}</b>${diag.detail ? " " + esc(diag.detail) : ""}</p>
        <p class="ed-why">${esc(m.why)}</p>
        <div class="ed-help-btns">
          ${m.audio ? `<button type="button" class="btn-cyan ed-hear">🔊 Hear why</button>` : ""}
          ${alts.length ? `<button type="button" class="ed-another-btn">💡 Explain it another way</button>` : ""}
          ${canSimilar ? `<button type="button" class="btn-gold ed-similar">🔁 Try one like it</button>` : ""}
          ${aiOk ? `<button type="button" class="ed-ai">✨ Ask the AI to explain</button>` : ""}
        </div>
        <div class="ed-another" hidden></div><div class="ed-ai-out" hidden></div></div>`;
      const hear = box.querySelector(".ed-hear"); if (hear) hear.onclick = () => playClip(m.audio);
      let k = 0;
      const ab = box.querySelector(".ed-another-btn");
      if (ab) ab.onclick = () => {
        const a = alts[k % alts.length], out = box.querySelector(".ed-another"); out.hidden = false;
        out.innerHTML = `<div class="eyebrow">Another way${alts.length > 1 ? ` · ${k % alts.length + 1} of ${alts.length}` : ""}</div><p>${esc(a.text)}</p>`;
        if (a.audio) playClip(a.audio);
        k++; ab.textContent = alts.length > 1 ? "💡 Explain it another way (next)" : "💡 Explain it another way";
      };
      const sb = box.querySelector(".ed-similar");
      if (sb) sb.onclick = () => { const q2 = similar(ctx); if (!q2) return;
        if (ctx.practice && ctx.practice.push) ctx.practice.push(q2); else HB.Practice.open({ title: "Try one like it", subtitle: kid(ctx.skill), questions: [Object.assign({ skill: ctx.skill }, q2)] }); };
      const ai = box.querySelector(".ed-ai");
      if (ai) ai.onclick = () => { const out = box.querySelector(".ed-ai-out"); out.hidden = false; out.textContent = "✨ Asking the AI…"; ai.disabled = true;
        const q = ctx.q || {};
        HB.explainAnother({ question: q.q || "", answer: String(q.model || q.answer || (HB.QT && HB.QT.key(q)) || ""), given: String(ctx.given || ""), subject: ctx.subject || kid(ctx.skill), misconception: m.label })
          .then(v => { out.innerHTML = `<div class="eyebrow">AI explanation</div><p>${esc(v.text)}</p>`; })
          .catch(e => { out.textContent = "⚠ " + ((e && e.message) || "The AI couldn't answer right now. Try “Explain it another way”."); ai.disabled = false; }); };
      return diag;
    },
    clear(box) { if (box) { box.innerHTML = ""; box.hidden = true; delete box.dataset.misc; } },
    similar, poolPick
  };

  // ===================== Practice runner (overlay) =====================
  const ov = el("div", "ed-overlay"); ov.id = "edPractice"; ov.hidden = true; ov.setAttribute("role", "dialog"); ov.setAttribute("aria-modal", "true");
  ov.innerHTML = `<div class="ed-sheet glass-card">
    <div class="ed-sheet-head"><div><div class="eyebrow" id="edPrTitle">Practice</div><div class="ed-sub" id="edPrSub"></div></div>
      <button type="button" class="ed-x" id="edPrClose" aria-label="Close">×</button></div>
    <div id="edPrBody"></div></div>`;
  document.body.appendChild(ov);
  const P = { list: [], i: 0, res: [], opts: {}, ans: null, num: "", picked: [] };
  function cur_() { return P.list[P.i]; }
  function pclose() { ov.hidden = true; document.body.classList.remove("ed-modal-open"); if (P.opts.onClose) try { P.opts.onClose(); } catch (e) {} }
  $("edPrClose").onclick = pclose;
  function opt(q) { return q.type === "tf" ? ["True", "False"] : (q.options || []); }
  function prender() {
    const q = cur_(), car = P.opts.mode === "car", body = $("edPrBody");
    P.ans = null; P.num = ""; P.picked = [];
    if (!q) return pend();
    const n = P.list.length;
    $("edPrSub").textContent = [P.opts.subtitle, n > 1 ? `Question ${P.i + 1} of ${n}` : ""].filter(Boolean).join(" · ");
    const skill = q.skill || P.opts.skill;
    body.innerHTML = `${q.skill ? `<div class="ed-skill-tag">${esc(kid(q.skill))}</div>` : ""}
      <p class="ed-q">${esc(q.q)}</p>
      ${q.vis && window.FRAC_VIS ? `<div class="ed-vis">${FRAC_VIS.render(q.vis)}</div>` : ""}
      ${car || q.wordAudio ? `<div class="ed-row"><button type="button" class="btn-cyan ed-hearq">🔊 ${car ? "Hear it again" : "Hear the word"}</button></div>` : ""}
      <div class="ed-opts${car ? " car" : ""}" id="edPrOpts"></div><div id="edPrRich" hidden></div>
      <div id="edPrNum" class="ed-num" hidden><div class="mq-field ed-num-v"><small>Your answer</small><span class="v" id="edPrNumV">–</span></div><div class="pad ed-pad" id="edPrPad"></div></div>
      <div class="ed-row"><button type="button" class="btn-gold" id="edPrCheck" hidden>Check</button></div>
      <div class="ed-hint" id="edPrHint" hidden></div>
      <div class="mq-feedback" id="edPrFb" aria-live="polite"></div>
      <div id="edPrHelp" hidden></div>
      <div class="ed-row ed-nav"><button type="button" class="btn-gold${car ? " ed-big" : ""}" id="edPrNext" disabled>${P.i < n - 1 ? "Next ›" : "Finish"}</button></div>`;
    const hq = body.querySelector(".ed-hearq"); if (hq) hq.onclick = () => playClip(car ? q.audio : q.wordAudio);
    const opts = $("edPrOpts");
    if (q.type === "mc" || q.type === "tf" || q.type === "pick") {
      opt(q).forEach(o => { const b = el("button", "anatomy-option ed-opt", esc(o)); b.type = "button"; b.dataset.opt = o;
        b.onclick = () => { if (P.res[P.i]) return; if (q.type === "pick") { const k = P.picked.indexOf(o); if (k >= 0) P.picked.splice(k, 1); else if (P.picked.length < q.n) P.picked.push(o);
          opts.querySelectorAll("button").forEach(x => x.classList.toggle("picked", P.picked.includes(x.dataset.opt))); $("edPrCheck").disabled = P.picked.length !== q.n; return; } pgrade(o); };
        opts.appendChild(b); });
      if (q.type === "pick") { $("edPrCheck").hidden = false; $("edPrCheck").disabled = true; $("edPrCheck").onclick = () => pgrade(P.picked.slice()); }
    } else if (q.type === "number") {
      $("edPrNum").hidden = false;
      ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clr", "0", "del"].forEach(k => { const b = el("button", "key" + (k.length > 1 ? " fn" : ""), k === "del" ? "⌫" : k === "clr" ? "C" : k); b.type = "button";
        b.onclick = () => { if (P.res[P.i]) return; if (k === "del") P.num = P.num.slice(0, -1); else if (k === "clr") P.num = ""; else if (P.num.length < 4) P.num = (P.num + k).replace(/^0+(?=\d)/, "");
          $("edPrNumV").textContent = P.num || "–"; $("edPrCheck").disabled = !P.num; }; $("edPrPad").appendChild(b); });
      $("edPrCheck").hidden = false; $("edPrCheck").disabled = true; $("edPrCheck").onclick = () => pgrade(P.num);
    } else if (HB.QT && HB.QT.isRich(q)) {
      const rich = $("edPrRich"); P.ans = HB.QT.render(q, rich, () => {}); rich.hidden = false;
      $("edPrCheck").hidden = false; $("edPrCheck").onclick = () => { if (!HB.QT.complete(q, P.ans)) { $("edPrFb").textContent = "Finish every part first."; $("edPrFb").className = "mq-feedback need"; return; } pgrade(null); };
    }
    if (!car && isMath(skill)) HB.Hint.mount($("edPrHint"), E.hintsFor(q, skill));
    $("edPrNext").onclick = () => { if (P.i < P.list.length - 1) { P.i++; prender(); if (car) playClip(cur_().audio); } else pend(); };
    if (P.res[P.i]) pshow(P.res[P.i], false);
  }
  function pgrade(given) {
    const q = cur_(); if (P.res[P.i]) return;
    let ok, r;
    if (HB.QT && HB.QT.isRich(q)) { r = HB.QT.grade(q, P.ans); ok = r.ok; }
    else if (q.type === "pick") ok = given.length === q.answers.length && q.answers.every(a => given.includes(a));
    else if (q.type === "number") ok = Number(given) === Number(q.answer);
    else ok = given === q.answer;
    P.res[P.i] = Object.assign({ ok, given: Array.isArray(given) ? given.join(", ") : given }, r || {});
    pshow(P.res[P.i], true);
  }
  function pshow(res, speak) {
    const q = cur_(), car = P.opts.mode === "car", fb = $("edPrFb");
    const opts = $("edPrOpts"), correct = q.type === "pick" ? q.answers : [String(q.answer)];
    opts.querySelectorAll("button").forEach(b => { b.disabled = true; if (correct.includes(b.dataset.opt)) b.classList.add("correct"); else if (String(res.given).split(", ").includes(b.dataset.opt)) b.classList.add("incorrect"); });
    if (HB.QT && HB.QT.isRich(q)) HB.QT.showResult(q, res, $("edPrRich"));
    $("edPrCheck").hidden = true; document.querySelectorAll("#edPrPad button").forEach(b => b.disabled = true);
    const ansTxt = HB.QT && HB.QT.isRich(q) ? HB.QT.key(q) : q.type === "pick" ? q.answers.join(", ") : q.answer;
    fb.textContent = res.ok ? "✓ " + (q.rightText && !/^That's right/.test(q.rightText) ? q.rightText : "That's right! " + (q.explain || "")) :
      "✗ Not quite. The answer is " + ansTxt + ". " + (q.explain || "");
    fb.className = "mq-feedback " + (res.ok ? "ok" : "bad");
    HB.Hint.finish($("edPrHint"));
    if (!res.ok) HB.Help.show($("edPrHelp"), { skill: q.skill || P.opts.skill, q, given: res.given, res, practice: car ? null : { push: q2 => { P.list.splice(P.i + 1, 0, Object.assign({ skill: q.skill }, q2)); $("edPrNext").textContent = "Next ›"; } } });
    $("edPrNext").disabled = false;
    if (speak && car) playClip(res.ok ? (q.right || (D.ui.car_right || {}).audio) : (q.wrong || (D.ui.car_wrong || {}).audio));
    else if (speak && q.rightAudio && res.ok) playClip(q.rightAudio);
    else if (speak && q.wrongAudio && !res.ok) playClip(q.wrongAudio);
  }
  function pend() {
    const n = P.list.length, score = P.res.filter(r => r && r.ok).length, car = P.opts.mode === "car";
    if (P.opts.record && n && HB.recordResult) HB.recordResult({ title: P.opts.record.title, subject: "Review", topic: P.opts.record.topic || P.opts.record.title, mode: P.opts.mode === "car" ? "car ride" : "practice",
      score, total: n, questions: P.list.map((q, i) => { const r = P.res[i] || {}; return { q: q.q, given: r.given == null ? "" : String(r.given), answer: HB.QT && HB.QT.isRich(q) ? HB.QT.key(q) : q.type === "pick" ? q.answers.join(", ") : String(q.answer), ok: !!r.ok, skill: q.skill || "" }; }) });
    $("edPrSub").textContent = P.opts.subtitle || "";
    $("edPrBody").innerHTML = `<div class="ed-end"><div class="big">${score} / ${n}</div>
      <p>${n === 1 ? (score ? "You got it! 🎉" : "Good try. Use “Explain it another way” and have another go any time.") : score === n ? "Every one right. Nice work, Max!" : "Nice work. The ones you missed will come back in a later Warm-up."}</p>
      <div class="ed-row">${P.opts.more ? `<button type="button" class="btn-cyan${car ? " ed-big" : ""}" id="edPrMore">${esc(P.opts.moreLabel || "More")}</button>` : ""}<button type="button" class="btn-gold${car ? " ed-big" : ""}" id="edPrDone">Done</button></div></div>`;
    $("edPrDone").onclick = pclose;
    if ($("edPrMore")) $("edPrMore").onclick = () => P.opts.more();
    if (car && D.ui.car_done) playClip(D.ui.car_done.audio);
  }
  HB.Practice = {
    // o = { title, subtitle, intro, questions, mode: "modal" | "car", record: {title, topic}, more(), moreLabel, startLabel, onClose }
    open(o) {
      P.opts = o || {}; P.list = (o.questions || []).filter(Boolean); P.i = 0; P.res = [];
      ov.hidden = false; ov.classList.toggle("car", o.mode === "car"); document.body.classList.add("ed-modal-open");
      $("edPrTitle").textContent = o.title || "Practice";
      if (!P.list.length) { $("edPrSub").textContent = o.subtitle || ""; $("edPrBody").innerHTML = `<p class="ed-q">${esc(o.empty || "Nothing to practise yet.")}</p><div class="ed-row"><button type="button" class="btn-gold" id="edPrDone">OK</button></div>`; $("edPrDone").onclick = pclose; return; }
      if (o.intro) {
        $("edPrSub").textContent = o.subtitle || "";
        $("edPrBody").innerHTML = `<p class="ed-intro">${esc(o.intro)}</p><div class="ed-row"><button type="button" class="btn-gold${o.mode === "car" ? " ed-big" : ""}" id="edPrStart">${esc(o.startLabel || "Start")}</button></div>`;
        $("edPrStart").onclick = () => { prender(); if (o.mode === "car") playClip(cur_().audio); else if (o.introAudio) playClip(o.introAudio); };
        return;
      }
      prender();
    },
    close: pclose, state: () => ({ open: !ov.hidden, i: P.i, n: P.list.length, res: P.res.slice(), mode: P.opts.mode, list: P.list.slice() })
  };

  // ===================== skill map (from Quiz History) =====================
  function stats() {
    const S = {}; Object.keys(D.skills).forEach(k => S[k] = { skill: k, n: 0, earned: 0, pts: 0, recent: [], last: "", conf: "" });
    (HB.quizHistory ? HB.quizHistory.list() : []).forEach(a => (a.questions || []).forEach(q => {   // newest first
      const sk = E.skillOfHist(a, q); if (!sk || !S[sk]) return;
      const pts = q.pts != null ? Number(q.pts) || 1 : 1, earned = q.pts != null ? Number(q.earned) || 0 : (q.ok ? 1 : 0), s = S[sk];
      s.n++; s.earned += earned; s.pts += pts; if (s.recent.length < 12) s.recent.push(earned / pts); if (!s.last) s.last = a.at;
    }));
    HB.confidence.list().forEach(c => { if (c.skill && S[c.skill] && !S[c.skill].conf) S[c.skill].conf = c.level; });
    Object.values(S).forEach(s => { s.pct = s.recent.length ? s.recent.reduce((a, b) => a + b, 0) / s.recent.length : 0;
      s.status = !s.n ? "none" : s.n >= 4 && s.pct >= 0.8 ? "got" : "practising"; });
    return S;
  }
  const ST_LABEL = { none: "Not tried yet", practising: "Practising", got: "Got it ✓" };
  function codeStatus(S, subj, code) {
    const sks = Object.keys(D.skills).filter(k => D.skills[k].subject === subj && D.skills[k].codes.includes(code));
    if (!sks.length) return null;
    const tried = sks.map(k => S[k]).filter(s => s.n);
    const status = !tried.length ? "none" : tried.length === sks.length && tried.every(s => s.status === "got") ? "got" : "practising";
    return { status, skills: sks };
  }
  function weakSkills(S, n) {
    S = S || stats();
    const conf = s => s.conf === "notyet" ? -0.2 : s.conf === "kind" ? -0.1 : 0;
    const pr = Object.values(S).filter(s => s.status === "practising").sort((a, b) => (a.pct + conf(a)) - (b.pct + conf(b)));
    const got = Object.values(S).filter(s => s.status === "got").sort((a, b) => a.pct - b.pct);
    const list = pr.concat(got).map(s => s.skill);
    ["frac.compare", "frac.addsub", "frac.mixed", "anat.systems", "ss.gov", "frac.unit", "mult.facts"].forEach(k => { if (!list.includes(k)) list.push(k); });
    return list.slice(0, n || 3);
  }
  function practiseSkill(sk, count) {
    const qs = [];
    const seen = new Set();
    for (let i = 0; i < (count || 3); i++) {
      let q = isMath(sk) ? E.gen(sk) : sk === "spell.words" ? E.pick(D.car.filter(c => c.skill === sk)) : poolPick(sk, null, seen);
      if (!q) break; seen.add(E.qkey(q.q)); qs.push(Object.assign({ skill: sk }, q));
    }
    HB.Practice.open({ title: "Practise", subtitle: kid(sk), questions: qs, record: { title: "Practise: " + kid(sk) } });
  }
  HB.SkillMap = {
    stats, weakSkills, practiseSkill, label: s => ST_LABEL[s],
    badge(subj, code) { const c = codeStatus(stats(), subj, code); return c ? `<span class="ed-sk ed-sk-${c.status}" title="Skill map">${ST_LABEL[c.status]}</span>` : ""; },
    render(box) {
      if (!box) return; const S = stats();
      const groups = [["math", "Math"], ["science", "Science"], ["social", "Social Studies"], ["language", "Language"]];
      const next = Object.values(S).filter(s => s.status === "practising").sort((a, b) => a.pct - b.pct).slice(0, 3);
      box.innerHTML = `<div class="ed-map-h"><div><div class="eyebrow">Your skill map</div>
          <p class="ed-map-note">Coloured from your Quiz History. It's private, on this device, and it's about what to practise next. It's not a grade.</p></div>
          <div class="ed-legend"><span class="ed-sk ed-sk-none">Not tried yet</span><span class="ed-sk ed-sk-practising">Practising</span><span class="ed-sk ed-sk-got">Got it ✓</span></div></div>
        ${groups.map(([g, t]) => `<div class="ed-map-g"><b>${t}</b><div class="ed-map-chips">${Object.keys(D.skills).filter(k => D.skills[k].subject === g).map(k => { const s = S[k];
          return `<button type="button" class="ed-chip ed-sk-${s.status}" data-skill="${k}" title="${s.n ? `${s.n} questions answered` : "No questions yet"}">${esc(kid(k))}<small>${ST_LABEL[s.status]}${s.conf ? " · " + CONF[s.conf].emoji : ""}</small></button>`; }).join("")}</div></div>`).join("")}
        <div class="ed-map-next">${next.length ? `<b>Practise next:</b> ${next.map(s => `<button type="button" class="btn-cyan ed-pn" data-skill="${s.skill}">${esc(kid(s.skill))}</button>`).join("")}` : "<b>Tip:</b> finish a quiz and your skill map fills in here."}
          <button type="button" class="btn-gold ed-warm-go">☀ Warm-up</button></div>`;
      box.querySelectorAll("[data-skill]").forEach(b => b.onclick = () => practiseSkill(b.dataset.skill, 3));
      box.querySelector(".ed-warm-go").onclick = () => HB.Warmup.start();
    }
  };

  // ===================== spaced-review warm-up =====================
  function questionFromMiss(a, hq) {
    const sk = E.skillOfHist(a, hq);
    const hit = E.index().get(E.qkey(hq.q));
    if (hit && hit.q && hit.q.type !== "sentence") return Object.assign({ skill: sk || hit.skill }, hit.q);
    let m;
    if (sk === "div.long" && (m = String(hq.q).match(/(\d+)\s*÷\s*(\d+)/))) return Object.assign({ skill: sk }, E.gen("div.long", { d: Math.min(25, Math.max(12, +m[2])) }));
    if ((sk === "mult.facts" || sk === "mult.multi") && (m = String(hq.q).match(/(\d+)\s*×\s*(\d+)/))) {
      const a1 = +m[1], b1 = +m[2]; return { type: "number", skill: sk, q: `${a1} × ${b1} = ?`, answer: a1 * b1, mult: [a1, b1], explain: `${a1} × ${b1} = ${a1 * b1}.`, steps: E.hintsForMult(a1, b1).steps, gen: true };
    }
    if (sk === "spell.words") { const c = D.car.find(x => x.word && x.word.toLowerCase() === String(hq.q).toLowerCase()); if (c) return Object.assign({}, c); }
    if (sk && isMath(sk)) return Object.assign({ skill: sk }, E.gen(sk));
    return null;
  }
  function buildWarmup(now) {
    now = now || Date.now();
    const DAY = 864e5, misses = [];
    (HB.quizHistory ? HB.quizHistory.list() : []).forEach(a => {
      if (a.subject === "Review") return;   // only real quizzes feed the warm-up
      const age = (now - new Date(a.at).getTime()) / DAY;
      (a.questions || []).forEach(q => { if (!q.ok) misses.push({ a, q, age }); });
    });
    const pickFrom = (arr, max, used) => { const out = [], bySkill = {};
      arr.forEach(x => { const k = E.skillOfHist(x.a, x.q) || "?"; (bySkill[k] = bySkill[k] || []).push(x); });
      const keys = Object.keys(bySkill); let r = 0;
      while (out.length < max && keys.some(k => bySkill[k].length)) { const k = keys[r++ % keys.length]; const x = bySkill[k].shift(); if (!x) continue;
        const key = E.qkey(x.q.q); if (used.has(key)) continue; const q = questionFromMiss(x.a, x.q); if (!q) continue; used.add(key); out.push(q); }
      return out; };
    const used = new Set();
    let qs = pickFrom(misses.filter(x => x.age >= 7 && x.age <= 21), 5, used), source = "window";
    if (qs.length < 3) { qs = qs.concat(pickFrom(misses.filter(x => !(x.age >= 7 && x.age <= 21)), 5 - qs.length, used)); source = qs.length ? (source === "window" && qs.length && misses.some(x => x.age >= 7 && x.age <= 21) ? "mixed" : "recent") : "none"; }
    if (!qs.length) { const S = stats(); const tried = Object.values(S).filter(s => s.n).map(s => s.skill);
      if (tried.length) { tried.slice(0, 5).forEach(sk => { const q = isMath(sk) ? E.gen(sk) : poolPick(sk, null, used); if (q) qs.push(Object.assign({ skill: sk }, q)); }); source = "practised"; } }
    return { questions: qs.slice(0, 5), source };
  }
  HB.Warmup = {
    build: buildWarmup,
    start() {
      const w = buildWarmup();
      const sub = { window: "Skills you missed 1–3 weeks ago", mixed: "Skills you missed 1–3 weeks ago, plus recent ones", recent: "Your most recent misses", practised: "A mix of skills you've practised", none: "" }[w.source];
      HB.Practice.open({ title: "☀ Warm-up", subtitle: sub, questions: w.questions, intro: w.questions.length ? `${w.questions.length} quick questions. ${sub}. No rush, and hints are there if you need them.` : "",
        introAudio: D.ui.warm_intro && D.ui.warm_intro.audio, startLabel: "Start warm-up", record: { title: "Warm-up", topic: "Warm-up · " + sub },
        empty: "No missed questions to review yet. Finish a quiz first, and the warm-up will bring back anything you missed." });
    }
  };

  // ===================== car ride (read aloud, tap only) =====================
  function carQuestions(n, avoid) {
    const weak = weakSkills(null, 3), out = [];
    const pool = sk => E.shuffle(D.car.filter(c => c.skill === sk && !(avoid && avoid.has(c.id))));
    let r = 0, guard = 0;
    while (out.length < n && guard++ < 30) { const sk = weak[r++ % weak.length]; const p = pool(sk).find(c => !out.includes(c)); if (p) out.push(p); }
    if (out.length < n) E.shuffle(D.car).forEach(c => { if (out.length < n && !out.includes(c)) out.push(c); });
    return out.map(c => Object.assign({}, c));
  }
  HB.CarRide = {
    questions: carQuestions,
    start(avoid) {
      avoid = avoid || new Set();
      const qs = carQuestions(3, avoid); qs.forEach(q => avoid.add(q.id));
      HB.Practice.open({ mode: "car", title: "🚗 Car ride", subtitle: "Listen, then tap", questions: qs,
        intro: (D.ui.car_intro || {}).text || "Car ride! Three quick questions, read out loud. Tap your answer.", startLabel: "▶ Start car ride",
        record: { title: "Car ride", topic: "Car ride · " + [...new Set(qs.map(q => kid(q.skill)))].join(", ") },
        more: () => HB.CarRide.start(avoid), moreLabel: "3 more questions" });
    }
  };

  // ===================== lessons: goal card, stages, wrap-up, confidence =====================
  const LESSON_MODS = ["fracWalk", "factWalk", "multWalk", "mathReview", "anatExplore", "spellingReview"];
  function lessonKey(name, ctx) {
    const o = ctx.opts || {}, sid = String((ctx.session && ctx.session.id) || "").replace(/-(typed|notepad|letters|work)$/, "");
    if (name === "fracWalk") return "frac:" + String(o.session || sid).replace(/-(typed|notepad)$/, "");
    if (name === "factWalk") return "ss:" + (o.set || sid);
    if (name === "multWalk") return "mult:" + (o.lesson || sid);
    if (name === "mathReview") return "div:longdiv";
    if (name === "anatExplore") return o.source === "maxtopics" ? "anat:maxtopics" : o.mode === "systems" ? (o.sys ? "anat:" + o.sys : "anat:allsystems") : "anat:organs";
    if (name === "spellingReview") return "spell:" + (o.list || sid);
    return "";
  }
  const L = { key: "", goal: null, view: null, name: "" };
  function goalOf(key) {
    const g = D.goals[key]; if (g) return g;
    const sk = /^spell:/.test(key) ? "spell.words" : /^ss:/.test(key) ? "ss.gov" : null;
    return sk && D.goalSkills[sk] ? Object.assign({ skill: sk, title: key }, D.goalSkills[sk]) : null;
  }
  function ensureCards(view) {
    let g = view.querySelector(":scope > .ed-goal"), w = view.querySelector(":scope > .ed-wrap");
    if (!g) { g = el("div", "ed-goal glass-card"); const anchor = view.querySelector(":scope > .meter, :scope > .sys-btns, :scope > .meta, :scope > .glass-card, :scope > .scan-stage");
      if (anchor) view.insertBefore(g, anchor); else view.appendChild(g); }
    if (!w) { w = el("div", "ed-wrap glass-card"); view.appendChild(w); }
    return { g, w };
  }
  function renderGoal(g, goal) {
    g.innerHTML = `<div class="ed-goal-h"><ol class="ed-stages"><li data-s="start">Start</li><li data-s="learn">Learn &amp; practise</li><li data-s="wrap">Wrap-up</li></ol>
        <span><button type="button" class="btn-cyan ed-goal-hear">🔊 Hear the goals</button> <button type="button" class="ed-goal-tog" aria-expanded="true">Hide</button></span></div>
      <div class="ed-goal-b"><div class="eyebrow">Today you'll learn</div><p class="ed-learn">${esc(goal.learn.charAt(0).toUpperCase() + goal.learn.slice(1))}</p>
      <div class="eyebrow">You've got it when…</div><ul class="ed-got">${goal.got.map(x => `<li>${esc(x)}</li>`).join("")}</ul></div>`;
    g.querySelector(".ed-goal-hear").onclick = () => playClip(goal.audio);
    const tog = g.querySelector(".ed-goal-tog");
    tog.onclick = () => { const b = g.querySelector(".ed-goal-b"); b.hidden = !b.hidden; tog.textContent = b.hidden ? "Show" : "Hide"; tog.setAttribute("aria-expanded", String(!b.hidden)); };
  }
  function renderWrap(w, goal) {
    const sk = goal.skill;
    w.innerHTML = `<div class="eyebrow">Wrap-up</div><h3 class="ed-wrap-t">Check yourself: you've got it when…</h3>
      <ul class="ed-check">${goal.got.map((x, i) => `<li><button type="button" class="ed-tick" aria-pressed="false" data-i="${i}">○</button> ${esc(x)}</li>`).join("")}</ul>
      <div class="ed-row"><button type="button" class="btn-gold ed-practise">✏️ Practise one${isMath(sk) ? " (with hints)" : ""}</button></div>
      <div class="ed-conf"><div class="eyebrow">How do you feel about this lesson?</div>
        <div class="ed-conf-btns">${Object.entries(CONF).map(([k, c]) => `<button type="button" class="ed-conf-b" data-c="${k}">${c.emoji} ${c.label}</button>`).join("")}
        ${D.ui.conf_ask ? `<button type="button" class="ed-conf-hear" aria-label="Hear the question">🔊</button>` : ""}</div>
        <p class="ed-conf-msg" aria-live="polite"></p></div>`;
    w.querySelectorAll(".ed-tick").forEach(b => b.onclick = () => { const on = b.getAttribute("aria-pressed") !== "true"; b.setAttribute("aria-pressed", String(on)); b.textContent = on ? "✓" : "○"; });
    w.querySelector(".ed-practise").onclick = () => {
      let q = isMath(sk) ? E.gen(sk) : sk === "spell.words" ? E.pick(D.car.filter(c => c.skill === sk)) : poolPick(sk, null);
      if (q) HB.Practice.open({ title: "Practise one", subtitle: kid(sk), questions: [Object.assign({ skill: sk }, q)] });
    };
    const h = w.querySelector(".ed-conf-hear"); if (h) h.onclick = () => playClip(D.ui.conf_ask.audio);
    w.querySelectorAll(".ed-conf-b").forEach(b => b.onclick = () => {
      const lvl = b.dataset.c; HB.confidence.add({ lesson: L.key, title: goal.title || L.key, subject: (HB.state.subject && HB.state.subject.title) || "", skill: sk, level: lvl });
      w.querySelectorAll(".ed-conf-b").forEach(x => x.classList.toggle("on", x === b));
      w.querySelector(".ed-conf-msg").textContent = lvl === "got" ? "Saved. Nice! Take the quiz when you're ready." : lvl === "kind" ? "Saved. A Warm-up later will help it stick." : "That's okay, saved. Try the review again, or tap Practise one.";
    });
  }
  HB.Lesson = {
    prepare(name, ctx) {
      const view = $(HB.modules[name].view); L.name = name; L.view = view;
      const on = ctx.kind === "review"; L.key = on ? lessonKey(name, ctx) : ""; L.goal = on ? goalOf(L.key) : null;
      const { g, w } = ensureCards(view);
      g.hidden = !L.goal; w.hidden = true;
      if (L.goal) { renderGoal(g, L.goal); renderWrap(w, L.goal); }
    },
    hide(view) { if (!view) return; view.querySelectorAll(":scope > .ed-goal, :scope > .ed-wrap").forEach(x => x.hidden = true); },
    // called by every lesson module when it shows a step
    step(o) {
      if (!L.view || !L.goal) return;
      const g = L.view.querySelector(":scope > .ed-goal"), w = L.view.querySelector(":scope > .ed-wrap");
      const stage = o.last ? "wrap" : o.first ? "start" : "learn";
      if (g) g.querySelectorAll(".ed-stages li").forEach(li => li.classList.toggle("on", li.dataset.s === stage));
      if (w) w.hidden = !o.last;
    },
    key: () => L.key, goalOf
  };
  HB.lessonStep = o => HB.Lesson.step(o || {});
  LESSON_MODS.forEach(name => { const m = HB.modules[name]; if (!m) return; const orig = m.enter;
    m.enter = function (ctx) { try { HB.Lesson.prepare(name, ctx); } catch (e) { console.error(e); } return orig.call(this, ctx); }; });
  if (HB.modules.anatComponent) { const m = HB.modules.anatComponent, orig = m.enter; m.enter = function (ctx) { HB.Lesson.hide($(m.view)); L.view = null; HB.Describe.set($("exDescribe"), ""); return orig.call(this, ctx); }; }

  // ===================== navigation glue + Home buttons =====================
  const go = HB.go;
  HB.go = function (t) {
    endSeq();
    if (!ov.hidden) pclose();
    const r = go.apply(this, arguments);
    if (!lessonLevel()) pill.hidden = true;
    if (HB.state.level === "home") { delete pill.dataset.closed; homeInfo(); }
    return r;
  };
  HB.home = () => HB.go({ level: "home" });
  function homeInfo() {
    const box = $("homeQuickInfo"); if (!box) return;
    const w = buildWarmup();
    box.textContent = w.questions.length ? `Warm-up ready: ${w.questions.length} question${w.questions.length > 1 ? "s" : ""} to refresh.` : "Warm-up: finish a quiz first, then misses come back here.";
  }
  if ($("homeWarmBtn")) $("homeWarmBtn").onclick = () => HB.Warmup.start();
  if ($("homeCarBtn")) $("homeCarBtn").onclick = () => HB.CarRide.start();
  homeInfo();
})();
