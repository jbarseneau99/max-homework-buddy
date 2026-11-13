// School-test question types for the maxQuiz engine (mirror Max's real tests).
//   wordbank {q, bank:[w..], items:[{pre, post, answer}]}        fill in the blanks, each word used once (1 pt per blank)
//   match    {q, terms:[..], defs:[{letter, text}], answers:[L..]} term → letter (1 pt per term)
//   tf       {q, answer:"True"|"False"}                             true / false (1 pt) — drawn as two buttons by maxquiz.js
//   inline   {q, parts:["text", {choices:[..], answer}, "text"...]} circle the correct word inside a sentence (1 pt per circle)
//   sentence {q, rubric:[{idea, pts}], model}                       complete-sentence answer, AI-graded (or self-check)
// API: HB.QT.isRich(q), pts(q), key(q), render(q, el, onChange) -> ans, complete(q, ans), grade(q, ans), showResult(q, res, el)
(function () {
  const HB = window.HB = window.HB || {};
  const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const RICH = ["wordbank", "match", "inline", "sentence"];
  const groups = q => (q.parts || []).filter(p => typeof p === "object");
  function pts(q) {
    if (q.type === "wordbank") return q.items.length;
    if (q.type === "match") return q.terms.length;
    if (q.type === "inline") return groups(q).length;
    if (q.type === "sentence") return q.rubric.reduce((a, r) => a + (r.pts || 1), 0);
    return 1;
  }
  function key(q) {
    if (q.type === "wordbank") return q.items.map(it => it.answer).join(" · ");
    if (q.type === "match") return q.terms.map((t, i) => `${t} → ${q.answers[i]}`).join(", ");
    if (q.type === "inline") return groups(q).map(g => g.answer).join(" · ");
    if (q.type === "sentence") return q.model;
    return null;
  }

  function render(q, el, onChange) {
    const ans = { fill: [], active: 0, sel: [], text: "" };
    el.innerHTML = ""; el.hidden = false; el.className = "qt qt-" + q.type;
    const changed = () => onChange && onChange(ans);
    if (q.type === "wordbank") {
      ans.fill = q.items.map(() => null);
      const draw = () => {
        const used = new Set(ans.fill.filter(Boolean));
        el.innerHTML = `<div class="qt-bank" role="group" aria-label="Word bank">${q.bank.map(w =>
            `<button type="button" class="qt-word${used.has(w) ? " used" : ""}" data-w="${esc(w)}" ${used.has(w) ? "disabled" : ""}>${esc(w)}</button>`).join("")}</div>` +
          `<ol class="qt-items">${q.items.map((it, i) =>
            `<li>${esc(it.pre)}<button type="button" class="qt-blank${ans.fill[i] ? " filled" : ""}${i === ans.active ? " active" : ""}" data-i="${i}" aria-label="Blank ${i + 1}">${ans.fill[i] ? esc(ans.fill[i]) : "&nbsp;"}</button>${esc(it.post)}</li>`).join("")}</ol>`;
        el.querySelectorAll(".qt-blank").forEach(b => b.onclick = () => {
          if (el.dataset.locked) return; const i = +b.dataset.i;
          if (ans.fill[i] && ans.active === i) ans.fill[i] = null;   // tap an active filled blank again → word back to the bank
          ans.active = i; draw(); changed(); });
        el.querySelectorAll(".qt-word").forEach(b => b.onclick = () => {
          if (el.dataset.locked) return;
          let i = ans.active; if (i == null || i < 0) i = ans.fill.indexOf(null); if (i < 0) return;
          ans.fill[i] = b.dataset.w;
          const nx = ans.fill.findIndex((f, k) => !f && k > i), first = ans.fill.indexOf(null);
          ans.active = nx >= 0 ? nx : first; draw(); changed(); });
      };
      ans.redraw = draw; draw();
    } else if (q.type === "match") {
      ans.sel = q.terms.map(() => "");
      const letters = q.defs.map(d => d.letter);
      const draw = () => {
        el.innerHTML = `<ul class="qt-defs">${q.defs.map(d => `<li><b>${esc(d.letter)}</b> ${esc(d.text)}</li>`).join("")}</ul>` +
          `<ol class="qt-terms">${q.terms.map((t, i) => `<li><span class="qt-term">${esc(t)}</span><span class="qt-letters" role="group" aria-label="Letter for ${esc(t)}">${letters.map(L =>
            `<button type="button" class="qt-letter${ans.sel[i] === L ? " on" : ""}" data-i="${i}" data-l="${L}">${L}</button>`).join("")}</span></li>`).join("")}</ol>`;
        el.querySelectorAll(".qt-letter").forEach(b => b.onclick = () => {
          if (el.dataset.locked) return; const i = +b.dataset.i, L = b.dataset.l;
          ans.sel = ans.sel.map((s, k) => k === i ? (s === L ? "" : L) : (s === L ? "" : s));   // each letter used once
          draw(); changed(); });
      };
      ans.redraw = draw; draw();
    } else if (q.type === "inline") {
      const gs = groups(q); ans.sel = gs.map(() => "");
      const draw = () => {
        let g = -1;
        el.innerHTML = `<p class="qt-sentence">${q.parts.map(p => {
          if (typeof p === "string") return esc(p);
          g++; const gi = g;
          return `<span class="qt-choices" role="group">${p.choices.map(c => `<button type="button" class="qt-choice${ans.sel[gi] === c ? " on" : ""}" data-g="${gi}" data-c="${esc(c)}">${esc(c)}</button>`).join('<span class="qt-slash">/</span>')}</span>`;
        }).join("")}</p>`;
        el.querySelectorAll(".qt-choice").forEach(b => b.onclick = () => {
          if (el.dataset.locked) return; const gi = +b.dataset.g; ans.sel[gi] = ans.sel[gi] === b.dataset.c ? "" : b.dataset.c; draw(); changed(); });
      };
      ans.redraw = draw; draw();
    } else if (q.type === "sentence") {
      el.innerHTML = `<textarea class="qt-text" rows="3" placeholder="Write your answer in a complete sentence…" aria-label="Your sentence"></textarea>`;
      const ta = el.querySelector("textarea");
      ta.oninput = () => { ans.text = ta.value; changed(); };
      ans.ta = ta;
    }
    delete el.dataset.locked;
    return ans;
  }
  function complete(q, ans) {
    if (q.type === "wordbank") return ans.fill.every(Boolean);
    if (q.type === "match") return ans.sel.every(Boolean);
    if (q.type === "inline") return ans.sel.every(Boolean);
    if (q.type === "sentence") return ans.text.trim().split(/\s+/).filter(Boolean).length >= 3;
    return true;
  }
  const norm = s => String(s).trim().toLowerCase();
  // local grading for wordbank / match / inline (sentence goes through the AI or self-check)
  function grade(q, ans) {
    let marks = [];
    if (q.type === "wordbank") marks = q.items.map((it, i) => norm(ans.fill[i] || "") === norm(it.answer));
    if (q.type === "match") marks = q.answers.map((L, i) => ans.sel[i] === L);
    if (q.type === "inline") marks = groups(q).map((g, i) => ans.sel[i] === g.answer);
    const earned = marks.filter(Boolean).length, total = marks.length;
    const given = q.type === "wordbank" ? ans.fill.map(x => x || "—").join(" · ")
      : q.type === "match" ? q.terms.map((t, i) => `${t} → ${ans.sel[i] || "—"}`).join(", ") : ans.sel.join(" · ");
    return { earned, pts: total, ok: earned === total, marks, given: [given], sel: (ans.fill.length ? ans.fill : ans.sel).slice() };
  }
  // paint a graded answer (also used when revisiting with Previous)
  function showResult(q, res, el) {
    el.dataset.locked = "1";
    const m = res.marks || [], sel = res.sel || [];
    if (q.type === "wordbank") {
      el.querySelectorAll(".qt-blank").forEach((b, i) => {
        b.classList.remove("active"); b.disabled = true; b.textContent = sel[i] || "—";
        b.classList.add(m[i] ? "correct" : "incorrect");
        if (!m[i]) b.insertAdjacentHTML("afterend", `<span class="qt-fix">${esc(q.items[i].answer)}</span>`);
      });
      el.querySelectorAll(".qt-word").forEach(b => b.disabled = true);
    } else if (q.type === "match") {
      el.querySelectorAll(".qt-terms > li").forEach((li, i) => {
        li.querySelectorAll(".qt-letter").forEach(b => { b.disabled = true; b.classList.toggle("on", b.dataset.l === sel[i]);
          if (b.dataset.l === q.answers[i]) b.classList.add("correct"); else if (b.dataset.l === sel[i]) b.classList.add("incorrect"); });
      });
    } else if (q.type === "inline") {
      el.querySelectorAll(".qt-choice").forEach(b => { const g = +b.dataset.g, gr = groups(q)[g]; b.disabled = true;
        b.classList.toggle("on", sel[g] === b.dataset.c);
        if (b.dataset.c === gr.answer) b.classList.add("correct"); else if (sel[g] === b.dataset.c) b.classList.add("incorrect"); });
    } else if (q.type === "sentence") {
      const ta = el.querySelector("textarea"); if (ta) { ta.value = res.text || ""; ta.disabled = true; }
    }
  }
  // self-check panel for sentence answers when the AI is not available
  function selfCheck(q, el, onDone) {
    const box = document.createElement("div"); box.className = "qt-self";
    box.innerHTML = `<div class="eyebrow">Check your own answer</div><p class="qt-model"><b>Model answer:</b> ${esc(q.model)}</p>` +
      `<p class="qt-small">Tick each idea your answer has:</p>` +
      q.rubric.map((r, i) => `<label class="qt-tick"><input type="checkbox" data-i="${i}"> ${esc(r.idea)} <small>(${r.pts || 1} pt)</small></label>`).join("") +
      `<label class="qt-tick"><input type="checkbox" data-cs="1"> I wrote a complete sentence: capital letter, a subject and a verb, and an end mark.</label>` +
      `<div style="text-align:center"><button type="button" class="btn-gold qt-score">Score my answer</button></div>`;
    el.appendChild(box);
    box.querySelector(".qt-score").onclick = () => {
      const met = q.rubric.map((r, i) => box.querySelector(`input[data-i="${i}"]`).checked);
      const cs = box.querySelector("input[data-cs]").checked;
      box.querySelectorAll("input,button").forEach(x => x.disabled = true);
      onDone({ met, complete: cs });
    };
    return box;
  }
  // points for a sentence answer: rubric ideas met, minus 1/2 if it is not a complete sentence (never below 0)
  function sentencePoints(q, met, completeSentence) {
    const raw = q.rubric.reduce((a, r, i) => a + (met[i] ? (r.pts || 1) : 0), 0);
    return Math.max(0, raw - (completeSentence ? 0 : 0.5));
  }
  const fmt = x => (Math.round(x * 2) / 2).toString().replace(/\.5$/, "½").replace(/^0½$/, "½");
  HB.QT = { isRich: q => RICH.includes(q.type), pts, key, render, complete, grade, showResult, selfCheck, sentencePoints, fmt, groups };
})();
