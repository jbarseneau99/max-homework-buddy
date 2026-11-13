// Curriculum panel: Ontario Grade 5 map from curriculum.js, with status per topic, links into the app and progress per subject.
(function () {
  const $ = id => document.getElementById(id);
  const LABEL = { tested: "Covered in class (tested)", lessons: "Has lessons", soon: "Coming up" };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  let open = null;

  function goLink(link) {
    const subj = (window.TOPICS || []).find(t => t.id === link[0]); if (!subj) return;
    const sub = link[1] && (subj.subtopics || []).find(t => t.id === link[1]);
    HB.go(sub ? { level: "subtopic", subject: subj, subtopic: sub } : { level: "subject", subject: subj });
  }
  function counts(s) {
    const it = s.strands.flatMap(x => x.items), c = { tested: 0, lessons: 0, soon: 0 };
    it.forEach(i => c[i.status]++); return { n: it.length, ...c };
  }
  function bar(c) {
    const pct = k => (100 * c[k] / c.n).toFixed(1) + "%";
    return `<div class="cur-bar" role="img" aria-label="${c.tested} tested, ${c.lessons} with lessons, ${c.soon} coming up">
      <span class="t" style="width:${pct("tested")}"></span><span class="l" style="width:${pct("lessons")}"></span></div>`;
  }
  function render() {
    const C = window.CURRICULUM; if (!C) return;
    const all = C.subjects.map(counts).reduce((a, c) => ({ n: a.n + c.n, tested: a.tested + c.tested, lessons: a.lessons + c.lessons, soon: a.soon + c.soon }), { n: 0, tested: 0, lessons: 0, soon: 0 });
    $("curSummary").innerHTML = `<b>${all.tested + all.lessons}</b> of ${all.n} Grade 5 topics are covered here: ${all.tested} tested in class, ${all.lessons} with lessons, ${all.soon} coming up.` + bar(all);
    const box = $("curSubjects"); box.innerHTML = "";
    C.subjects.forEach(s => {
      const c = counts(s), card = document.createElement("div");
      card.className = "glass-card cur-subj"; card.dataset.subject = s.id;
      card.innerHTML = `<button type="button" class="cur-head" aria-expanded="${open === s.id}">
          <span class="cur-title">${esc(s.title)} <small>(${esc(s.year)})</small></span>
          <span class="cur-prog">${c.tested} tested · ${c.lessons} lessons · ${c.soon} coming up</span>${bar(c)}</button>
        <div class="cur-body" ${open === s.id ? "" : "hidden"}>
          ${s.strands.map(x => `<div class="cur-strand"><div class="eyebrow">Strand ${esc(x.code)}</div><h3>${esc(x.title)}</h3><ul>
            ${x.items.map(i => `<li class="cur-item ${i.status}"><span class="cur-code">${esc(i.code)}</span>
              <span class="cur-say">${esc(i.say)}${i.note ? `<small>${esc(i.note)}</small>` : ""}</span>
              <span class="cur-tag ${i.status}">${LABEL[i.status]}</span>
              ${i.link ? `<button type="button" class="cur-go btn-cyan" data-link="${esc(i.link.join("/"))}">Open ›</button>` : ""}</li>`).join("")}
          </ul></div>`).join("")}
          <p class="cur-src">Official source: <a href="${esc(s.source)}" target="_blank" rel="noopener">Ontario curriculum · ${esc(s.title)}</a>. Codes are official; the descriptions are short kid-friendly summaries.</p>
        </div>`;
      card.querySelector(".cur-head").onclick = () => { open = open === s.id ? null : s.id; render(); };
      card.querySelectorAll(".cur-go").forEach(b => b.onclick = () => goLink(b.dataset.link.split("/")));
      box.appendChild(card);
    });
    $("curSource").innerHTML = `From the Ontario Ministry of Education's <a href="${esc(C.home)}" target="_blank" rel="noopener">Curriculum and Resources</a> site (checked ${esc(C.checked)}).`;
  }
  HB.registerModule("curriculum", { view: "view-curriculum", enter(ctx) { if (ctx.opts && ctx.opts.open) open = ctx.opts.open; render(); }, leave() {} });
  if ($("homeCurriculumBtn")) $("homeCurriculumBtn").onclick = () => HB.go({ level: "curriculum" });
})();
