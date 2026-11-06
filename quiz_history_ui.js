// Quiz History panel UI (view-quizHistory). Reachable from Home › Quiz History.
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const st = { filter: "all", openId: null };

  function status(t, err) { const e = $("qhStatus"); if (!e) return; e.textContent = t || ""; e.classList.toggle("err", !!err); }

  function renderFilters() {
    const box = $("qhFilters"); if (!box) return;
    const subjects = ["all"].concat(HB.quizHistory.subjects());
    box.innerHTML = subjects.map(s => {
      const label = s === "all" ? "All subjects" : s;
      const on = st.filter === s ? " on" : "";
      return `<button type="button" class="${on}" data-subj="${esc(s)}">${esc(label)}</button>`;
    }).join("");
    box.querySelectorAll("button").forEach(b => b.onclick = () => { st.filter = b.dataset.subj; st.openId = null; render(); });
  }

  function renderList() {
    const items = HB.quizHistory.filter(st.filter);
    const ul = $("qhList");
    $("qhDetail").hidden = true; ul.hidden = false;
    if (!items.length) {
      ul.innerHTML = '<li class="qh-empty" style="cursor:default">No quiz attempts saved yet. Finish any quiz and it will show up here.</li>';
      return;
    }
    ul.innerHTML = items.map(a => {
      const when = new Date(a.at).toLocaleString();
      const mode = a.mode ? ` · ${a.mode}` : "";
      return `<li tabindex="0" data-id="${esc(a.id)}"><div class="qh-h"><b>${esc(a.title)}</b><span class="qh-score">${a.score}/${a.total}</span></div>` +
        `<small>${esc(a.subject)}${a.topic ? " › " + esc(a.topic) : ""}${esc(mode)}</small>` +
        `<small>${esc(when)}</small></li>`;
    }).join("");
    ul.querySelectorAll("li[data-id]").forEach(li => {
      li.onclick = () => openDetail(li.dataset.id);
      li.onkeydown = e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openDetail(li.dataset.id); } };
    });
  }

  function openDetail(id) {
    const a = HB.quizHistory.get(id); if (!a) return;
    st.openId = id;
    $("qhList").hidden = true; $("qhDetail").hidden = false;
    $("qhDetailWhen").textContent = new Date(a.at).toLocaleString();
    $("qhDetailTitle").textContent = a.title;
    $("qhDetailMeta").textContent = [a.subject, a.topic, a.mode].filter(Boolean).join(" · ");
    $("qhDetailScore").textContent = `${a.score} / ${a.total}`;
    const qs = a.questions || [];
    $("qhDetailQs").innerHTML = qs.length
      ? qs.map(q => `<li><span class="${q.ok ? "wk-ok" : "wk-bad"}">${q.ok ? "✓" : "✗"}</span> <b>${esc(q.q)}</b>` +
          `<small>Max: ${esc(q.written || q.given || "—")}${q.ok ? "" : ` · correct: ${esc(q.answer)}`}</small></li>`).join("")
      : (a.details || []).map(d => `<li>${esc(d)}</li>`).join("") || "<li>No per-question details were saved for this attempt.</li>";
  }

  function render() { renderFilters(); if (st.openId) openDetail(st.openId); else renderList(); }

  function exportFile() {
    const blob = new Blob([HB.quizHistory.exportJSON()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `max-quiz-history-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    status(`Exported ${HB.quizHistory.list().length} attempts.`);
  }
  function importFile(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const r = HB.quizHistory.importJSON(String(reader.result || ""));
        status(`Imported ${r.added} new attempts (${r.total} total).`);
        st.openId = null; render();
      } catch (e) { status(e.message || "Import failed.", true); }
    };
    reader.readAsText(file);
  }

  HB.registerModule("quizHistory", {
    view: "view-quizHistory",
    enter() { st.filter = "all"; st.openId = null; status(""); render(); },
    leave() {}
  });

  // Wire controls once DOM is ready (script is at end of body)
  $("qhDetailBack").onclick = () => { st.openId = null; render(); };
  $("qhExport").onclick = exportFile;
  $("qhImport").onclick = () => $("qhImportFile").click();
  $("qhImportFile").onchange = () => { const f = $("qhImportFile").files && $("qhImportFile").files[0]; if (f) importFile(f); $("qhImportFile").value = ""; };
  $("qhClear").onclick = () => {
    if (!HB.quizHistory.list().length) return status("Nothing to clear.");
    if (!confirm("Clear ALL quiz history on this device? Export a backup first if you want to keep it.")) return;
    HB.quizHistory.clear(); st.openId = null; status("History cleared."); render();
  };
  if ($("homeHistoryBtn")) $("homeHistoryBtn").onclick = () => HB.go({ level: "quizHistory" });
})();
