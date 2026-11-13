// AI grading of Max's scratch-pad drawings (xAI chat completions, called straight from the browser).
// The API key lives ONLY in this browser's localStorage (Settings › AI grading); nothing secret is in the repo.
// API: HB.ai.status() -> { ready, state: "ready"|"missing_key"|"off", model }
//      HB.gradeScratch({ pngDataUrl, question, expected, subject, quiz, attempt, choices, hideExpected })
//        resolves { mode:"ai", ok, written, feedback, model }
//        rejects  { mode:"fallback", reason:"no_key"|"disabled"|"no_image" }  -> caller uses the keypad / tap flow
//        rejects  { mode:"error", message }                                  -> network / API / parse problem
//      HB.gradeScratch({ ..., kind:"showwork", steps })   math show-your-work: grades the steps and the final answer separately
//        resolves { mode:"ai", ok, answer_ok, steps_ok, steps_feedback, answer_feedback, written, feedback, model }
//      HB.gradeSentence({ text | pngDataUrl, question, rubric:[{idea, pts}], model })   complete-sentence answers
//        resolves { mode:"ai", ideas:[bool per rubric idea], complete, written, feedback, model }
//        rejects like gradeScratch -> maxquiz.js falls back to the model answer + self-check (HB.QT.selfCheck)
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

  const SYSTEM_MATH = [
    "You are a kind, careful math tutor checking the handwritten work of Max, a Canadian grade-5 student.",
    "You get a picture of his scratch pad: light (white) pen strokes on a dark navy background with a faint grid.",
    "1. Look closely at the handwriting/drawing and read what Max wrote: numbers, fractions, long-division layout (bracket, quotient on top, subtraction steps, remainder 'R'), comparison symbols (<, >, =), circled or boxed answers.",
    "2. Find Max's FINAL answer (circled/boxed/underlined, written after '=' or 'Answer', or the last result in his work). Ignore crossed-out work.",
    "3. Compare it with the expected answer you are given. Accept equivalent ways of writing the same answer (e.g. '43 R 11', '43r11', 'Q=43 R=11'; '6' or '6/9' when the question asks for a missing numerator 6) unless the question asks for a specific form such as simplest form.",
    "4. If there is no readable final answer, ok is false and the feedback asks him to write his final answer clearly.",
    "Reply with ONLY a JSON object, no markdown, exactly: {\"ok\": true|false, \"written\": \"<what Max wrote as his final answer, plus a few words on his work>\", \"feedback\": \"<one short warm sentence for Max>\"}",
    "feedback rules: speak to Max directly, at most 25 words, kid-friendly. If ok, cheer and name one thing he did well. If not ok, give a gentle nudge about where to look again (e.g. check the subtraction step) and do NOT state the correct answer or the full solution."
  ].join("\n");

  const SYSTEM_SPELLING = [
    "You are a kind spelling checker for Max, a Canadian grade-5 student.",
    "You get a picture of his scratch pad: light (white) pen strokes on a dark navy background with a faint grid.",
    "1. Read the single English word Max wrote. Ignore neatness, size, slant, and letter case.",
    "2. Compare what you read to the expected spelling case-insensitively. Every letter must match exactly (no extras, no missing letters).",
    "3. Put the letters you actually read into \"written\" (preferably lowercase, letters only). Do not invent letters you cannot see.",
    "4. If you cannot read any word, ok is false and written is empty.",
    "Reply with ONLY a JSON object, no markdown, exactly: {\"ok\": true|false, \"written\": \"<the word you read>\", \"feedback\": \"<one short warm sentence for Max>\"}",
    "feedback rules: speak to Max directly, at most 25 words, kid-friendly. If ok, cheer briefly. If not ok, encourage him to listen again and rewrite carefully — NEVER reveal or hint the correct spelling in feedback."
  ].join("\n");

  function systemFor(o) {
    return (o && (o.kind === "spelling" || /spelling/i.test(o.subject || ""))) ? SYSTEM_SPELLING : SYSTEM_MATH;
  }

  function userText(o) {
    const spelling = o.kind === "spelling" || /spelling/i.test(o.subject || "");
    return [
      `Subject: ${o.subject || "Math"}${o.quiz ? " · " + o.quiz : ""}`,
      spelling ? "Task: spell the word you hear. Max wrote one word on the pad." : `Question: ${o.question}`,
      !spelling && o.choices && o.choices.length ? `Answer choices shown to Max: ${o.choices.join(" | ")}` : "",
      `Expected correct ${spelling ? "spelling" : "answer"} (for grading only — never reveal it in feedback when he is wrong): ${o.expected}`,
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

  const SYSTEM_SHOWWORK = [
    "You are a kind, careful math tutor checking the handwritten work of Max, a Canadian grade-5 student.",
    "You get a picture of his scratch pad: light (white) pen strokes on a dark navy background with a faint grid.",
    "Max must SHOW HIS WORK (the steps) and give a FINAL ANSWER. Grade the two parts separately.",
    "steps_ok: true if his written steps use a correct method that leads to the answer (e.g. for mixed to improper: whole × denominator + numerator over the same denominator; for improper to mixed: divide, the remainder goes over the SAME denominator; for equivalent fractions: multiply or divide top and bottom by the same number). Small slips that he fixes are fine. No steps written means steps_ok is false.",
    "answer_ok: true if his final answer equals the expected answer (equivalent forms are fine unless the question asks for a specific form).",
    "Reply with ONLY a JSON object, no markdown, exactly: {\"answer_ok\": true|false, \"steps_ok\": true|false, \"written\": \"<his final answer and a short summary of his steps>\", \"steps_feedback\": \"<one short sentence on the steps>\", \"answer_feedback\": \"<one short sentence on the answer>\"}",
    "Feedback rules: speak to Max directly, kid-friendly, at most 20 words each. When something is wrong, name the step to look at again, but do NOT state the final answer."
  ].join("\n");
  const SYSTEM_SENTENCE = [
    "You are a kind grade-5 teacher in Ontario, Canada, marking a short written answer from Max.",
    "You get the question, a rubric of key ideas, and Max's answer (typed text, or a picture of his handwriting: white pen on a dark navy pad).",
    "1. If it is a picture, read his handwriting carefully. Put exactly what he wrote into \"written\".",
    "2. For EACH rubric idea, decide if his answer clearly includes that idea (his own words are fine; the meaning must be right). Be fair but not generous: a wrong fact does not earn the idea.",
    "3. complete_sentence: true only if the answer is written as at least one complete sentence (starts with a capital letter, has a subject and a verb, ends with . ! or ?). Spelling mistakes alone do not make it incomplete.",
    "Reply with ONLY a JSON object, no markdown, exactly: {\"ideas\": [true|false, ...one per rubric idea in order], \"complete_sentence\": true|false, \"written\": \"<his answer>\", \"feedback\": \"<one or two short warm sentences for Max: what he did well, and what idea or sentence part to add>\"}",
    "Feedback: speak to Max directly, at most 35 words."
  ].join("\n");

  // one POST with model fallbacks; parse(text) turns the reply into a verdict or throws
  async function callAI(messages, parse, o) {
    const st = status();
    if (!st.ready) throw { mode: "fallback", reason: st.state === "off" ? "disabled" : "no_key" };
    const key = String(cfg()["ai.apiKey"]).trim();
    const body = { temperature: 0, stream: false, messages };
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
          try { v = parse(textOf(r.data)); } catch (e) { throw { mode: "error", message: "The AI reply couldn't be read." }; }
          goodModel = model;
          return { mode: "ai", ...v, model };
        }
        last = r;
        if (!modelProblem(r)) break;
      }
      const s = last ? last.status : 0;
      throw { mode: "error", status: s, message: s === 401 || s === 403 ? "The AI key was not accepted — check it in Settings." : s === 429 ? "The AI is busy (rate limit). Try again in a moment." : "AI error: " + String(apiMsg(last)).slice(0, 120) };
    } finally { clearTimeout(timer); }
  }
  const jsonOf = raw => { const s = String(raw || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "").trim();
    const a = s.indexOf("{"), b = s.lastIndexOf("}"); if (a < 0 || b <= a) throw new Error("no JSON in reply"); return JSON.parse(s.slice(a, b + 1)); };
  const bool = x => x === true || x === "true";
  function parseShowWork(raw) {
    const j = jsonOf(raw);
    if (j.answer_ok == null || j.steps_ok == null) throw new Error("reply missing answer_ok/steps_ok");
    const answerOk = bool(j.answer_ok), stepsOk = bool(j.steps_ok);
    const sf = String(j.steps_feedback || "").slice(0, 200), af = String(j.answer_feedback || "").slice(0, 200);
    return { ok: answerOk && stepsOk, answerOk, stepsOk, written: String(j.written == null ? "" : j.written).slice(0, 300),
      stepsFeedback: sf, answerFeedback: af, feedback: `Steps ${stepsOk ? "✓" : "✗"}: ${sf || (stepsOk ? "Clear steps." : "Show each step.")} · Answer ${answerOk ? "✓" : "✗"}: ${af || (answerOk ? "Correct." : "Check your final answer.")}` };
  }

  async function gradeScratch(o) {
    o = o || {};
    const st = status();
    if (!st.ready) throw { mode: "fallback", reason: st.state === "off" ? "disabled" : "no_key" };
    if (!/^data:image\/(png|jpe?g);base64,/.test(o.pngDataUrl || "")) throw { mode: "fallback", reason: "no_image" };
    const showWork = o.kind === "showwork";
    const text = showWork ? [
        `Subject: ${o.subject || "Math"}${o.quiz ? " · " + o.quiz : ""}`, `Question: ${o.question}`,
        `Expected final answer (for grading only — never reveal it): ${o.expected}`,
        o.steps ? `A correct way to show the work (for grading only): ${o.steps}` : "",
        "Grade the attached scratch-pad picture now: steps and final answer separately. JSON only."].filter(Boolean).join("\n") : userText(o);
    const v = await callAI([{ role: "system", content: showWork ? SYSTEM_SHOWWORK : systemFor(o) },
      { role: "user", content: [{ type: "image_url", image_url: { url: o.pngDataUrl, detail: "high" } }, { type: "text", text }] }],
      showWork ? parseShowWork : parseVerdict, o);
    if (!showWork) {
      if (!v.ok && o.hideExpected && o.expected && norm(v.feedback).includes(norm(o.expected)))
        v.feedback = "Not quite — look over your steps again and find the spot to fix.";
      if (!v.feedback) v.feedback = v.ok ? "Great work, Max!" : "Not quite — check your work and try again.";
    }
    return v;
  }

  // Short written answer (typed text or handwriting picture) against a rubric of key ideas + complete-sentence check.
  //   o = { text? , pngDataUrl?, question, rubric:[{idea,pts}], model, subject, quiz }
  //   resolves { mode:"ai", ideas:[bool], complete, written, feedback, model }
  async function gradeSentence(o) {
    o = o || {};
    const hasImg = /^data:image\/(png|jpe?g);base64,/.test(o.pngDataUrl || "");
    if (!hasImg && !String(o.text || "").trim()) throw { mode: "fallback", reason: "empty" };
    const rub = (o.rubric || []).map((r, i) => `${i + 1}. ${r.idea} (${r.pts || 1} pt)`).join("\n");
    const text = [`Subject: ${o.subject || ""}${o.quiz ? " · " + o.quiz : ""}`, `Question: ${o.question}`, `Rubric ideas:\n${rub}`,
      `A model answer (for you only): ${o.model || ""}`, hasImg ? "Max's answer is the handwriting in the attached picture." : `Max's typed answer: """${String(o.text).slice(0, 800)}"""`,
      "Mark it now. JSON only."].join("\n");
    const content = hasImg ? [{ type: "image_url", image_url: { url: o.pngDataUrl, detail: "high" } }, { type: "text", text }] : text;
    const n = (o.rubric || []).length;
    return callAI([{ role: "system", content: SYSTEM_SENTENCE }, { role: "user", content }], raw => {
      const j = jsonOf(raw);
      if (!Array.isArray(j.ideas)) throw new Error("reply missing ideas");
      const ideas = Array.from({ length: n }, (_, i) => bool(j.ideas[i]));
      return { ideas, complete: bool(j.complete_sentence), written: String(j.written == null ? (o.text || "") : j.written).slice(0, 600),
        feedback: String(j.feedback || "").slice(0, 300) || "Thanks, Max!" };
    }, o);
  }

  HB.ai = { status, ready: () => status().ready, DEFAULT_MODEL, FALLBACK_MODELS, ENDPOINT, _parse: parseVerdict, _parseShowWork: parseShowWork };
  HB.gradeScratch = gradeScratch;
  HB.gradeSentence = gradeSentence;
})();
