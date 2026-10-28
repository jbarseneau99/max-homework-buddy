// Settings (extensible schema) + Outbox (outbound-only compose via mailto:, no backend, no inbox).
// Everything is stored in this browser's localStorage only. No addresses live in the repo.
(function () {
  const $ = id => document.getElementById(id);
  const KEY = "hb.settings.v1", SENT = "hb.outbox.sent.v1", LAST = "hb.lastResult.v1";
  const EMAIL_RE = /^[^\s@,;<>"]+@[^\s@,;<>"]+\.[^\s@,;<>"]{2,}$/;

  // ---- Extensible schema: add a section or field here and the Settings screen renders it. ----
  // field: { key, label, type: "email" | "text" | "toggle", placeholder, help, recipient?: { id, name, results } }
  window.SETTINGS_SCHEMA = [
    { id: "correspondence", title: "Correspondence", blurb: "Addresses the Outbox can send to. Saved on this device only.",
      fields: [
        { key: "email.max", label: "Max's email", type: "email", placeholder: "max@example.com", recipient: { id: "max", name: "Max", results: false } },
        { key: "email.dad", label: "Dad's email (Brant / Parent 1)", type: "email", placeholder: "parent1@example.com", recipient: { id: "dad", name: "Dad", results: true } },
        { key: "email.mom", label: "Mom's email (Max's mom / Parent 2)", type: "email", placeholder: "parent2@example.com", recipient: { id: "mom", name: "Mom", results: true } }
      ] },
    { id: "outbox", title: "Outbox", blurb: "How composed messages are signed.",
      fields: [ { key: "outbox.signature", label: "Signature", type: "text", placeholder: "— Max" } ] }
  ];

  const load = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const save = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
  const settings = () => load(KEY, {});
  const get = key => settings()[key] || "";
  const allFields = () => window.SETTINGS_SCHEMA.flatMap(s => s.fields);
  const recipients = () => allFields().filter(f => f.recipient).map(f => ({ ...f.recipient, key: f.key, email: get(f.key) }));
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  HB.settings = { get, recipients, isEmail: v => EMAIL_RE.test(v) };

  // ---------- Settings screen ----------
  function renderSettings() {
    const box = $("settingsSections"); box.innerHTML = "";
    const vals = settings();
    window.SETTINGS_SCHEMA.forEach(sec => {
      const card = document.createElement("form");
      card.className = "glass-card set-sec"; card.dataset.section = sec.id; card.noValidate = true;
      card.innerHTML = `<div class="eyebrow">${esc(sec.title)}</div><p class="set-blurb">${esc(sec.blurb || "")}</p>` +
        sec.fields.map(f => `<label class="set-field"><span>${esc(f.label)}</span>
          <input type="${f.type === "email" ? "email" : "text"}" inputmode="${f.type === "email" ? "email" : "text"}" autocomplete="off" autocapitalize="off" spellcheck="false"
            data-key="${f.key}" placeholder="${esc(f.placeholder || "")}" value="${esc(vals[f.key] || "")}"><small class="set-err" data-err="${f.key}"></small></label>`).join("") +
        `<div class="set-actions"><button type="submit" class="btn-gold">Save ${esc(sec.title)}</button><span class="set-status" aria-live="polite"></span></div>`;
      card.onsubmit = e => { e.preventDefault(); saveSection(sec, card); };
      box.appendChild(card);
    });
    renderSentInfo();
  }
  function saveSection(sec, card) {
    const vals = settings(); let okAll = true;
    sec.fields.forEach(f => {
      const inp = card.querySelector(`[data-key="${f.key}"]`), err = card.querySelector(`[data-err="${f.key}"]`);
      const v = inp.value.trim();
      if (f.type === "email" && v && !EMAIL_RE.test(v)) { err.textContent = "That doesn't look like an email address."; inp.classList.add("bad"); okAll = false; return; }
      err.textContent = ""; inp.classList.remove("bad");
      if (v) vals[f.key] = v; else delete vals[f.key];
    });
    const st = card.querySelector(".set-status");
    if (okAll && save(KEY, vals)) st.textContent = "Saved on this device.";
    else if (!okAll) st.textContent = "Fix the highlighted field.";
    else st.textContent = "Couldn't save (storage blocked).";
    st.classList.toggle("err", !okAll);
  }
  function renderSentInfo() {
    const n = load(SENT, []).length;
    $("settingsSentInfo").textContent = `${n} message${n === 1 ? "" : "s"} in the Sent log on this device.`;
  }

  // ---------- Outbox ----------
  function sig() { return get("outbox.signature") || "— Max"; }
  const TEMPLATES = {
    results(ctx) {
      const r = load(LAST, null);
      if (!r) return { subject: "Max's quiz results", body: `Hi,\n\nNo quiz results yet on this device.\n\n${sig()}` };
      return { subject: `Max's quiz results — ${r.title}: ${r.score}/${r.total}`,
        body: `Hi,\n\nI just finished "${r.title}" in Max's Homework Buddy.\nScore: ${r.score} / ${r.total}\n` +
          (r.details && r.details.length ? `\n${r.details.join("\n")}\n` : "") + `\nDate: ${new Date(r.at).toLocaleString()}\n\n${sig()}`, onlyResults: true };
    },
    question(ctx) {
      const about = ctx.about || "my homework";
      return { subject: `Question about ${about}`, body: `Hi,\n\nI have a question about ${about}:\n\n\n${sig()}`, onlyResults: true };
    }
  };
  const ob = { about: "" };

  function renderOutbox(opts) {
    const rs = recipients().filter(r => r.email);
    const list = $("obRecipients"); list.innerHTML = "";
    $("obNoRecipients").hidden = rs.length > 0;
    rs.forEach(r => {
      const l = document.createElement("label"); l.className = "ob-rcpt";
      l.innerHTML = `<input type="checkbox" value="${r.id}" data-email="${esc(r.email)}"><span><b>${esc(r.name)}</b><small>${esc(r.email)}</small></span>`;
      list.appendChild(l);
    });
    $("obSubject").value = ""; $("obBody").value = ""; $("obStatus").textContent = "";
    if (opts && opts.template) applyTemplate(opts.template);
    renderSent();
  }
  function applyTemplate(name) {
    const t = TEMPLATES[name](ob);
    $("obSubject").value = t.subject; $("obBody").value = t.body; status("");
    if (t.onlyResults) $("obRecipients").querySelectorAll("input").forEach(c => {
      const r = recipients().find(x => x.id === c.value); c.checked = !!(r && r.results);
    });
  }
  function mailtoUrl(to, subject, body) {
    const addr = to.map(a => a.replace(/\+/g, "%2B")).join(",");
    return `mailto:${addr}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body.replace(/\r?\n/g, "\r\n"))}`;
  }
  HB.openMailto = url => { window.location.href = url; };   // overridable (tests)
  function status(t, err) { const e = $("obStatus"); e.textContent = t; e.classList.toggle("err", !!err); }
  function send() {
    const checked = [...$("obRecipients").querySelectorAll("input:checked")];
    const subject = $("obSubject").value.trim(), body = $("obBody").value;
    if (!checked.length) { status("Pick at least one recipient.", true); return; }
    if (!subject && !body.trim()) { status("Add a subject or a message.", true); return; }
    const to = checked.map(c => c.dataset.email).filter(e => EMAIL_RE.test(e));
    const names = checked.map(c => (recipients().find(r => r.id === c.value) || {}).name);
    const url = mailtoUrl(to, subject, body);
    const log = load(SENT, []);
    log.unshift({ at: new Date().toISOString(), to: names.map((n, i) => `${n} <${to[i]}>`), subject, body });
    save(SENT, log.slice(0, 100));
    status("Opening your email app… (saved to the Sent log on this device)");
    renderSent();
    HB.openMailto(url);
  }
  function renderSent() {
    const log = load(SENT, []);
    $("obSentCount").textContent = `${log.length}`;
    $("obSent").innerHTML = log.length ? log.map(m => `<li><div class="ob-sent-h"><b>${esc(m.subject || "(no subject)")}</b><small>${new Date(m.at).toLocaleString()}</small></div>` +
      `<small>To: ${esc(m.to.join(", "))}</small></li>`).join("") : '<li class="ob-empty">Nothing sent from this device yet.</li>';
    $("obClear").disabled = !log.length;
  }

  // ---------- results hook for quiz end screens ----------
  HB.pathTitle = () => { const s = HB.state; return [s.subject, s.subtopic, s.session].filter(Boolean).map(x => x.title).join(" › ") + " quiz"; };
  HB.recordResult = r => save(LAST, { title: r.title || HB.pathTitle(), score: r.score, total: r.total, details: r.details || [], at: new Date().toISOString() });
  HB.emailResults = () => HB.go({ level: "outbox", opts: { template: "results" } });

  // ---------- modules ----------
  HB.registerModule("settings", { view: "view-settings", enter() { renderSettings(); }, leave() {} });
  HB.registerModule("outbox", { view: "view-outbox",
    enter(ctx) { ob.about = ctx.about || ""; renderOutbox(ctx.opts); }, leave() {} });

  $("obSend").onclick = send;
  $("obTplResults").onclick = () => applyTemplate("results");
  $("obTplQuestion").onclick = () => applyTemplate("question");
  $("obClear").onclick = () => { save(SENT, []); renderSent(); };
  $("obToSettings").onclick = () => HB.go({ level: "settings" });
  $("settingsToOutbox").onclick = () => HB.go({ level: "outbox" });
})();
