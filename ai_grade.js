// AI grading of Max's scratch-pad drawings (xAI chat completions, called straight from the browser).
// The API key lives ONLY in this browser's localStorage (Settings › AI grading); nothing secret is in the repo.
// API: HB.ai.status() -> { ready, state: "ready"|"missing_key"|"off", model }
//      HB.gradeScratch({ pngDataUrl, question, expected, subject, quiz, attempt, choices, hideExpected })
//        resolves { mode:"ai", ok, written, feedback, model }
//        rejects  { mode:"fallback", reason:"no_key"|"disabled"|"no_image" }  -> caller uses the keypad / tap flow
//        rejects  { mode:"error", message }                                  -> network / API / parse problem
(function () {
  const ENDPOINT = "https://api.x.ai/v1/chat/completions";
  const SETTINGS = "hb.settings.v1";
  const DEFAULT_MODEL = "grok-4.7";
  // tried in order after the Settings model; the first one the API accepts wins (and is remembered for this page load)
  const FALLBACK_MODELS = ["grok-4.7", "grok-4.6", "grok-4.5", "grok-4", "grok-2-vision-1212"];
  const TIMEOUT_MS = 45000;
  let goodModel = "";

  const cfg = () => { try { return JSON.parse(localStorage.getItem(SETTINGS)) || {}; } catch (e) { return {}; } };
  function status() {
    const c = cfg(), key = String(c["ai.apiKey"] || "").trim(), model = String(c["ai.model"] || "").trim() || DEFAULT_MODEL;
    if (!key) return { ready: false, state: "missing_key", model };
    if (c["ai.enabled"] === "off") return { ready: false, state: "off", model };
    return { ready: true, state: "ready", model };
  }

  const SYSTEM = [
    "You are a kind, careful math tutor checking the handwritten work of Max, a Canadian grade-5 student.",
    "You get a picture of his scratch pad: light (white) pen strokes on a dark navy background with a faint grid.",
    "1. Look closely at the handwriting/drawing and read what Max wrote: numbers, fractions, long-division layout (bracket, quotient on top, subtraction steps, remainder 'R'), comparison symbols (<, >, =), circled or boxed answers.",
    "2. Find Max's FINAL answer (circled/boxed/underlined, written after '=' or 'Answer', or the last result in his work). Ignore crossed-out work.",
    "3. Compare it with the expected answer you are given. Accept equivalent ways of writing the same answer (e.g. '43 R 11', '43r11', 'Q=43 R=11'; '6' or '6/9' when the question asks for a missing numerator 6) unless the question asks for a specific form such as simplest form.",
    "4. If there is no readable final answer, ok is false and the feedback asks him to write his final answer clearly.",
    "Reply with ONLY a JSON object, no markdown, exactly: {\"ok\": true|false, \"written\": \"<what Max wrote as his final answer, plus a few words on his work>\", \"feedback\": \"<one short warm sentence for Max>\"}",
    "feedback rules: speak to Max directly, at most 25 words, kid-friendly. If ok, cheer and name one thing he did well. If not ok, give a gentle nudge about where to look again (e.g. check the subtraction step) and do NOT state the correct answer or the full solution."
  ].join("\n");

  function userText(o) {
    return [
      `Subject: ${o.subject || "Math"}${o.quiz ? " · " + o.quiz : ""}`,
      `Question: ${o.question}`,
      o.choices && o.choices.length ? `Answer choices shown to Max: ${o.choices.join(" | ")}` : "",
      `Expected correct answer (for grading only — never reveal it in feedback when he is wrong): ${o.expected}`,
      o.attempt ? `This is try number ${o.attempt}.` : "",
      "Grade the attached scratch-pad picture now. JSON only."
    ].filter(Boolean).join("\n");
  }

  function textOf(data) {
    const m = data && data.choices && data.choices[0] && data.choices[0].message;
    if (!m) return "";
    if (typeof m.content === "string") return m.content;
    if (Array.isArray(m.content)) return m.content.map(p => p.text || "").join("");
    return "";
  }
  function parseVerdict(raw) {
    let s = String(raw || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
    const a = s.indexOf("{"), b = s.lastIndexOf("}");
    if (a < 0 || b <= a) throw new Error("no JSON in reply");
    const j = JSON.parse(s.slice(a, b + 1));
    const ok = j.ok === true || j.ok === "true";
    if (typeof j.ok !== "boolean" && j.ok !== "true" && j.ok !== "false") throw new Error("reply missing ok");
    return { ok, written: String(j.written == null ? "" : j.written).slice(0, 300), feedback: String(j.feedback == null ? "" : j.feedback).slice(0, 300) };
  }
  const norm = s => String(s).toLowerCase().replace(/\s+/g, "");

  async function post(key, model, body, signal) {
    const res = await fetch(ENDPOINT, { method: "POST", signal,
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + key },
      body: JSON.stringify({ ...body, model }) });
    let data = null, txt = "";
    try { txt = await res.text(); data = JSON.parse(txt); } catch (e) {}
    return { status: res.status, ok: res.ok, data, txt };
  }
  const apiMsg = r => (r.data && (r.data.error && (r.data.error.message || r.data.error) || r.data.message || r.data.code)) || r.txt.slice(0, 160) || ("HTTP " + r.status);
  // a "this model doesn't exist / can't see images" answer → try the next model; auth / quota / network errors stop
  const modelProblem = r => r.status === 404 || ((r.status === 400 || r.status === 422) && /model|image|vision|modalit/i.test(String(apiMsg(r))));

  async function gradeScratch(o) {
    o = o || {};
    const st = status();
    if (!st.ready) throw { mode: "fallback", reason: st.state === "off" ? "disabled" : "no_key" };
    if (!/^data:image\/(png|jpe?g);base64,/.test(o.pngDataUrl || "")) throw { mode: "fallback", reason: "no_image" };
    const key = String(cfg()["ai.apiKey"]).trim();
    const body = { temperature: 0, stream: false, messages: [
      { role: "system", content: SYSTEM },
      { role: "user", content: [
        { type: "image_url", image_url: { url: o.pngDataUrl, detail: "high" } },
        { type: "text", text: userText(o) } ] } ] };
    const models = [...new Set([goodModel, st.model, ...FALLBACK_MODELS].filter(Boolean))];
    const ac = new AbortController(), timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
    try {
      let last = null;
      for (const model of models) {
        let r;
        try { r = await post(key, model, body, ac.signal); }
        catch (e) { throw { mode: "error", message: e && e.name === "AbortError" ? "The AI took too long (45 s)." : "Couldn't reach the AI (network)." }; }
        if (r.ok) {
          let v;
          try { v = parseVerdict(textOf(r.data)); } catch (e) { throw { mode: "error", message: "The AI reply couldn't be read." }; }
          goodModel = model;
          if (!v.ok && o.hideExpected && o.expected && norm(v.feedback).includes(norm(o.expected)))
            v.feedback = "Not quite — look over your steps again and find the spot to fix.";
          if (!v.feedback) v.feedback = v.ok ? "Great work, Max!" : "Not quite — check your work and try again.";
          return { mode: "ai", ...v, model };
        }
        last = r;
        if (!modelProblem(r)) break;
      }
      const s = last ? last.status : 0;
      throw { mode: "error", status: s, message: s === 401 || s === 403 ? "The AI key was not accepted — check it in Settings." : s === 429 ? "The AI is busy (rate limit). Try again in a moment." : "AI error: " + String(apiMsg(last)).slice(0, 120) };
    } finally { clearTimeout(timer); }
  }

  HB.ai = { status, ready: () => status().ready, DEFAULT_MODEL, FALLBACK_MODELS, ENDPOINT, _parse: parseVerdict };
  HB.gradeScratch = gradeScratch;
})();
