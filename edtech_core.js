// Study Buddy "edtech" core (no DOM): skills, fraction maths, mistake diagnosis, question generators and step-by-step hints.
// Runs in the browser (window.HB.ED) and in Node (build_edtech.js uses it to pre-build the read-aloud car-ride bank).
// Word problems use Ontario / Canadian places; every number in them is invented (no real statistics).
(function (root) {
  const HB = root.HB = root.HB || {};
  const DATA = () => root.EDTECH_DATA || {};
  let rnd = Math.random;
  const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const pick = arr => arr[Math.floor(rnd() * arr.length)];
  const shuffle = arr => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a || 1; };

  // ---------- fractions ----------
  const F = (n, d) => { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d); return { n: n / g, d: d / g }; };
  const T = String.raw`(?:\d+ \d+\/\d+|\d+\/\d+|\d+)`;
  function parseF(s) {
    s = String(s == null ? "" : s).trim().replace(/\s*(L|km|kg|cups?)$/i, "");
    let m = s.match(/^(\d+) (\d+)\/(\d+)$/); if (m) return F(+m[1] * +m[3] + +m[2], +m[3]);
    m = s.match(/^(\d+)\/(\d+)$/); if (m && +m[2]) return F(+m[1], +m[2]);
    m = s.match(/^(\d+)$/); if (m) return F(+m[1], 1);
    return null;
  }
  const raw = s => { s = String(s).trim(); let m = s.match(/^(\d+) (\d+)\/(\d+)$/); if (m) return { w: +m[1], n: +m[2], d: +m[3] };
    m = s.match(/^(\d+)\/(\d+)$/); if (m) return { w: 0, n: +m[1], d: +m[2] }; m = s.match(/^(\d+)$/); return m ? { w: +m[1], n: 0, d: 1 } : null; };
  const val = f => f ? f.n / f.d : NaN;
  const eq = (a, b) => !!a && !!b && a.n * b.d === b.n * a.d;
  function fmt(f) { // simplest mixed form
    if (!f) return ""; f = F(f.n, f.d);
    if (f.d === 1) return String(f.n);
    const w = Math.floor(f.n / f.d), r = f.n % f.d;
    return w ? `${w} ${r}/${f.d}` : `${r}/${f.d}`;
  }
  const add = (a, b) => F(a.n * b.d + b.n * a.d, a.d * b.d), sub = (a, b) => F(a.n * b.d - b.n * a.d, a.d * b.d);
  const mul = (a, b) => F(a.n * b.n, a.d * b.d), div = (a, b) => F(a.n * b.d, a.d * b.n);

  // ---------- skills ----------
  const SET_SKILL = { frac_equiv: "frac.equiv", frac_u3_31: "frac.equiv", frac_compare: "frac.compare", frac_u3_33: "frac.compare",
    frac_mixed: "frac.mixed", frac_u3_32: "frac.mixed", frac_muldiv: "frac.unit", frac_u4_42: "frac.unit", frac_u4_41: "frac.addsub",
    circulatory: "anat.systems", respiratory: "anat.systems", digestive: "anat.systems", nervous: "anat.systems", skeletal: "anat.systems",
    muscular: "anat.systems", urinary: "anat.systems", ss_provinces: "ss.provinces", ss_maps: "ss.maps", ss_indigenous: "ss.indigenous",
    ss_history: "ss.history", ss_government: "ss.gov", ss_govreview: "ss.gov" };
  function fracSkillOfText(t) {
    t = String(t || "");
    if (/\bcompare|order from|in order|greater|less than|largest|smallest|least|which is bigger|skated farther/i.test(t)) return "frac.compare";
    if (/\d\s*[+−-]\s*\d|\badd\b|subtract|in all\?|altogether|farther/i.test(t) && !/×|÷/.test(t)) return "frac.addsub";
    if (/×|÷|half of|cups?|scoops?|bottles?|slices\?/i.test(t)) return "frac.unit";
    if (/mixed|improper|wholes\?|\d \d+\/\d|\d+ \?\/|\? \d+\//i.test(t)) return "frac.mixed";
    return "frac.equiv";
  }
  function skillOfSetQuestion(setId, q) {
    if (/^spell_/.test(setId || "")) return "spell.words";
    if (SET_SKILL[setId] && !/practice/.test(setId)) {
      const s = SET_SKILL[setId];
      if (s === "anat.systems" && q && /together|work with|team|helps? the|both systems/i.test(q.q || "")) return "anat.together";
      return s;
    }
    if (/^frac_/.test(setId || "")) return fracSkillOfText(q && q.q);
    if (!setId) return /organ|heart|lung|brain|stomach|liver|kidney/i.test(q && q.q || "") ? "anat.organs" : "anat.systems"; // Max's test topics
    return null;
  }
  // question index: text -> { set, i, q, skill }   (QUIZ_SETS, Max's test topics, anatomy lessons)
  let IDX = null;
  const key = s => String(s || "").toLowerCase().replace(/\s+/g, " ").trim();
  function index() {
    if (IDX) return IDX;
    IDX = new Map();
    const Q = root.QUIZ_SETS || {};
    Object.keys(Q).forEach(setId => (Q[setId].questions || []).forEach((q, i) => { const k = key(q.q); if (!IDX.has(k) || ["wordbank", "match", "inline"].includes(q.type)) IDX.set(k, { set: setId, i, q, skill: skillOfSetQuestion(setId, q) }); }));
    const MT = root.MAX_TOPICS_DATA && root.MAX_TOPICS_DATA.quiz;
    if (MT) (MT.questions || []).forEach((q, i) => { const k = key(q.q); if (!IDX.has(k)) IDX.set(k, { set: "", i, q, skill: skillOfSetQuestion("", q) }); });
    const A = root.ANATOMY;
    if (A) A.sets.forEach(S => S.lessons.forEach(L => L.items.forEach((it, i) => { if (!it.question) return;
      const k = key(it.question); if (!IDX.has(k)) IDX.set(k, { set: "anat:" + L.id, i, q: { type: "mc", q: it.question, options: it.options, answer: it.answer, explain: it.fact,
        rightText: it.rightText, wrongText: it.wrongText, qAudio: it.questionAudio, rightAudio: it.rightAudio, wrongAudio: it.wrongAudio }, skill: L.id === "organs" ? "anat.organs" : "anat.systems" }); })));
    return IDX;
  }
  function multSkill(qText) { const m = String(qText).match(/(\d+)\s*×\s*(\d+)/); return m && +m[1] <= 12 && +m[2] <= 12 ? "mult.facts" : "mult.multi"; }
  // skill for one saved history question (attempt a, question row hq)
  function skillOfHist(a, hq) {
    if (hq && hq.skill) return hq.skill;
    const hit = hq && index().get(key(hq.q));
    if (hit && hit.skill) return hit.skill;
    return skillOfAttempt(a, hq);
  }
  function skillOfAttempt(a, hq) {
    if (a.skill) return a.skill;
    const t = [a.title, a.subject, a.topic].join(" ");
    if (/long division/i.test(t)) return "div.long";
    if (/multiplication/i.test(t)) return /times tables|patterns/i.test(t) ? "mult.facts" : (hq ? multSkill(hq.q) : "mult.multi");
    if (/spelling|word work|vocabulary/i.test(t)) return "spell.words";
    if (/fraction|unit [34]/i.test(t)) return fracSkillOfText(hq ? hq.q : a.title);
    const Q = root.QUIZ_SETS || {};
    const setId = Object.keys(Q).find(k => Q[k].title && Q[k].title === a.title);
    if (setId) return skillOfSetQuestion(setId, hq);
    if (/organs?/i.test(t)) return "anat.organs";
    if (/body systems|anatomy|science|test topics/i.test(t)) return "anat.systems";
    if (/government/i.test(t)) return "ss.gov";
    if (/maps|globes/i.test(t)) return "ss.maps";
    if (/provinces|capitals/i.test(t)) return "ss.provinces";
    if (/indigenous|first nations|inuit|métis/i.test(t)) return "ss.indigenous";
    if (/history|new france|confederation/i.test(t)) return "ss.history";
    return null;
  }

  // ---------- mistake diagnosis ----------
  // returns { id, detail } — id is a key of EDTECH_DATA.misc. detail is an optional sentence about THIS answer.
  function candidatesOf(expr) { // expr "A op B" or single → [{id, f}]
    const m = String(expr).match(new RegExp(`^(${T}) ([+−\\-×÷]) (${T})$`));
    if (!m) return [];
    const A = raw(m[1]), B = raw(m[3]), op = m[2], fa = parseF(m[1]), fb = parseF(m[3]), out = [];
    if (op === "+" || op === "−" || op === "-") {
      const plus = op === "+";
      if (A.d === B.d || A.w === 0 || B.w === 0) {
        const dd = (A.d || B.d) + (B.d || A.d), nn = plus ? A.n + B.n : A.n - B.n;
        if (dd > 0 && nn >= 0) out.push({ id: "added_denoms", f: F((A.w + (plus ? B.w : -B.w)) * dd + nn, dd) });
        if (!plus && A.d - B.d === 0 && nn > 0) out.push({ id: "sub_denoms", f: null });
      }
      out.push({ id: plus ? "sub_instead_add" : "added_instead_sub", f: plus ? (val(fa) >= val(fb) ? sub(fa, fb) : sub(fb, fa)) : add(fa, fb) });
      if (A.w || B.w) out.push({ id: "forgot_whole", f: F(plus ? A.n + B.n : Math.abs(A.n - B.n), A.d) });
      if (!plus && A.n < B.n && A.d === B.d) out.push({ id: "no_regroup", f: F((A.w - B.w) * A.d + (B.n - A.n), A.d) });
    } else if (op === "×" && fb && fb.n === 1 && A.d === 1) {
      out.push({ id: "unit_mult_denom", f: F(A.w * fb.d, 1) }, { id: "unit_bottom", f: F(1, A.w * fb.d) }, { id: "unit_bottom", f: F(A.w, A.w * fb.d) }, { id: "unit_flip", f: F(fb.d, A.w) });
    } else if (op === "÷" && fb && fb.n === 1 && A.d === 1) {
      out.push({ id: "unit_div_divided", f: F(A.w, fb.d) }, { id: "unit_one_whole", f: F(fb.d, 1) }, { id: "mult_added", f: F(A.w + fb.d, 1) });
    }
    return out.filter(c => !c.f || !eq(c.f, op === "+" ? add(fa, fb) : op === "×" ? mul(fa, fb) : op === "÷" ? div(fa, fb) : sub(fa, fb)));
  }
  // project a value onto an answer slot pattern like "?/5", "2 ?/6", "? 2/5", "1/?" -> number in the slot (or null)
  function slotOf(pattern, f) {
    if (!f) return null; const p = String(pattern).trim();
    let m = p.match(/^\?\/(\d+)$/); if (m) { const n = f.n * +m[1] / f.d; return Number.isInteger(n) ? n : null; }
    m = p.match(/^(\d+) \?\/(\d+)$/); if (m) { const n = (f.n / f.d - +m[1]) * +m[2]; return Math.abs(n - Math.round(n)) < 1e-9 ? Math.round(n) : null; }
    m = p.match(/^\? (\d+)\/(\d+)$/); if (m) { const w = f.n / f.d - +m[1] / +m[2]; return Math.abs(w - Math.round(w)) < 1e-9 ? Math.round(w) : null; }
    m = p.match(/^(\d+)\/\?$/); if (m) { const d = +m[1] * f.d / f.n; return Number.isInteger(d) ? d : null; }
    if (p === "?") return f.d === 1 ? f.n : null;
    return null;
  }
  function diagFraction(q, given) {
    const text = String(q.q || ""), g = String(given == null ? "" : given).trim();
    const ans = q.answer, gf = parseF(g), af = parseF(ans);
    let m;
    // "LHS = RHS. What is the missing ..." (keypad)
    m = text.match(new RegExp(`(${T}(?: [+−\\-×÷] ${T})?) = ([\\d ?/]*\\?[\\d ?/]*?)(?:[.?]|$)`));
    if (m && q.type === "number") {
      const lhs = m[1], pat = m[2].trim(), gn = Number(g);
      const L = raw(lhs), single = !/[+−\-×÷]/.test(lhs);
      const cands = [];
      if (single && L) {
        const D = (pat.match(/\/(\d+)$/) || [])[1], N = (pat.match(/^(\d+)\/\?$/) || [])[1];
        if (/^\?\/\d+$/.test(pat) && L.w === 0) { cands.push(["equiv_added", L.n + (+D - L.d)], ["equiv_factor_only", +D / L.d], ["equiv_factor_only", L.d / +D]); }
        if (N && L.w === 0) cands.push(["equiv_added", L.d + (+N - L.n)], ["equiv_factor_only", +N / L.n]);
        if (/^\?\/\d+$/.test(pat) && L.w > 0) {
          if (+D === L.d) cands.push(["mixed_forgot_num", L.w * L.d], ["mixed_added_whole", L.w + L.n], ["forgot_whole", L.n]);
          else cands.push(["equiv_top_only", L.w * L.d + L.n], ["forgot_whole", L.n * +D / L.d], ["equiv_top_only", L.w * +D + L.n]);
        }
        if (/^\d+ \?\/\d+$/.test(pat) && L.w > 0) cands.push(["equiv_added", L.n + (+D - L.d)], ["equiv_factor_only", +D / L.d], ["equiv_factor_only", L.d / +D]);
        if (/^\d+ \?\/\d+$/.test(pat) && L.w === 0) cands.push(["mixed_wholes", L.n - L.d], ["mixed_wrong_den", L.n % L.d === 0 ? -1 : Math.floor(L.n / L.d)]);
        if (/^\? \d+\/\d+$/.test(pat)) cands.push(["mixed_wholes", L.n], ["mixed_wholes", Math.ceil(L.n / L.d)], ["mixed_wholes", L.n - +((pat.match(/ (\d+)\//) || [])[1] || 0)]);
      } else candidatesOf(lhs).forEach(c => cands.push([c.id, slotOf(pat, c.f)]));
      const hit = cands.find(([, v]) => v != null && Number.isFinite(v) && v === gn);
      if (hit) return { id: hit[0] };
      if (Number.isFinite(gn) && Number.isFinite(+ans) && +ans !== 0) return { id: Math.abs(gn - ans) <= Math.max(1, Math.abs(ans) * 0.15) ? "num_close" : gn > ans ? "frac_too_big" : "frac_too_small" };
    }
    // mc "A op B = ?"
    m = text.match(new RegExp(`(${T} [+−\\-×÷] ${T}) = \\?$`));
    if (m && gf) { const c = candidatesOf(m[1]).find(c => c.f && eq(c.f, gf)); if (c) return { id: c.id }; if (af) return { id: val(gf) > val(af) ? "frac_too_big" : "frac_too_small" }; }
    // Compare: X ? Y
    m = text.match(new RegExp(`^Compare: (${T}) \\? (${T})$`));
    if (m) return diagCompare(raw(m[1]), raw(m[2]), g === "<" ? -1 : g === ">" ? 1 : 0);
    // greater / less than (true / false)
    m = text.match(new RegExp(`^(${T}) is (greater|less) than (${T})\\.?$`));
    if (m && q.type === "tf") { const said = g === "True"; const rel = m[2] === "greater" ? 1 : -1; return diagCompare(raw(m[1]), raw(m[3]), said ? rel : -rel, true); }
    // ordering
    m = text.match(/^(?:Put in order|Order from) ?,? ?(smallest to largest|least to greatest|greatest to least)?[^:]*: (.+)$/i);
    if (m && g) {
      const desc = /greatest to least/i.test(text), items = g.split(/,\s*/).map(s => parseF(s.replace(/\s*L$/, ""))), rs = g.split(/,\s*/).map(s => raw(s.replace(/\s*L$/, "")));
      if (items.every(Boolean)) {
        const vals = items.map(val), sorted = (a, dir) => a.every((v, i) => i === 0 || (dir > 0 ? v >= a[i - 1] : v <= a[i - 1]));
        if (sorted(vals, desc ? 1 : -1)) return { id: "order_reversed" };
        const tops = rs.map(r => r.w * 1000 + r.n), dens = rs.map(r => r.d);
        if (sorted(tops, desc ? -1 : 1) && new Set(dens).size > 1) return { id: "compare_tops_only" };
        if (sorted(dens, desc ? 1 : -1) && rs.every(r => r.n === rs[0].n)) return { id: "compare_big_denom" };
        if (rs.some(r => r.w) && rs.some(r => !r.w && r.n > r.d)) return { id: "compare_improper" };
        return { id: "compare_tops_only" };
      }
    }
    // equivalent: "Tap the fraction that is equivalent to a/b." / "Simplify a/b."
    m = text.match(/(?:equivalent to|Simplify) (\d+)\/(\d+)/);
    if (m && gf && /\d+\/\d+/.test(g)) { const G = raw(g), a = +m[1], b = +m[2];
      if (G.n - a === G.d - b) return { id: "equiv_added" };
      if (G.n % a === 0 && G.d % b === 0 && G.n / a !== G.d / b) return { id: "equiv_top_only" };
      if (a % G.n === 0 || b % G.d === 0) return { id: "equiv_top_only" };
      return { id: "equiv_top_only" };
    }
    m = text.match(/^Is (\d+)\/(\d+) equivalent to (\d+)\/(\d+)\?/);
    if (m) { const [a, b, c, d] = m.slice(1).map(Number); if (g === "Yes") return { id: c - a === d - b ? "equiv_added" : "compare_equal" }; return { id: "compare_not_equal" }; }
    // tf "A op B = C is correct."
    m = text.match(new RegExp(`^(${T} [+−\\-×÷] ${T}) = (${T}) is correct\\.?$`));
    if (m && q.type === "tf" && g === "True") { const c = candidatesOf(m[1]).find(c => c.f && eq(c.f, parseF(m[2]))); return { id: c ? c.id : "tf_check" }; }
    m = text.match(new RegExp(`^(${T}) (?:is the same as|and) (${T})(?: are equivalent fractions)?\\.?$`));
    if (m && q.type === "tf") { const A = raw(m[1]), B = raw(m[2]);
      if ((A.w && !B.w) || (!A.w && B.w)) return { id: "mixed_wrong_den" };
      if (g === "True" && B.n - A.n === B.d - A.d) return { id: "equiv_added" };
      return { id: g === "True" ? "compare_equal" : "compare_not_equal" };
    }
    if (q.type === "tf") return { id: "tf_check" };
    if (gf && af) return { id: val(gf) > val(af) ? "frac_too_big" : "frac_too_small" };
    return { id: "generic" };
  }
  function diagCompare(A, B, said, isTf) { // said: -1 "<", 1 ">", 0 "="
    const a = A.w + A.n / A.d, b = B.w + B.n / B.d, truth = Math.sign(a - b);
    if (said === truth) return { id: "generic" };
    if (truth === 0) return { id: "compare_not_equal" };
    if (said === 0) return { id: "compare_equal" };
    const imp = (A.w && !B.w && B.n > B.d) || (B.w && !A.w && A.n > A.d);
    if (imp && Math.sign((A.w || A.n) - (B.w || B.n)) === said) return { id: "compare_improper" };
    if (A.n === B.n && A.w === B.w && Math.sign(A.d - B.d) === said) return { id: "compare_big_denom" };
    if (Math.sign(A.n - B.n) === said && A.d !== B.d) return { id: "compare_tops_only" };
    return { id: isTf ? "tf_check" : "compare_tops_only" };
  }
  function diagDivision(dividend, divisor, given) {
    const q = Math.floor(dividend / divisor), r = dividend % divisor;
    const m = String(given || "").match(/(\d+)\s*(?:R|r|rem\w*)?\s*(\d+)?/);
    if (!m) return { id: "generic" };
    const gq = +m[1], gr = m[2] == null ? 0 : +m[2];
    if (gr >= divisor) return { id: "div_rem_big" };
    if (gq === q && gr !== r) return { id: m[2] == null && r ? "div_no_rem" : "div_rem_off" };
    if (gq === q * 10 || gq * 10 === q || (q >= 10 && String(gq).length !== String(q).length)) return { id: "div_place" };
    if (Math.abs(gq - q) === 1) return { id: "div_quot_off" };
    return { id: "num_close" };
  }
  function diagMult(a, b, given) {
    const g = Number(String(given).replace(/[^\d]/g, "")), p = a * b;
    if (!Number.isFinite(g)) return { id: "generic" };
    if (g === a + b) return { id: "mult_added" };
    if ([a * (b + 1), a * (b - 1), (a + 1) * b, (a - 1) * b].includes(g)) return { id: "mult_one_off" };
    const big = Math.max(a, b), small = Math.min(a, b);
    if (big >= 10) { const t = Math.floor(big / 10), u = big % 10;
      if (g === t * small + u * small || (small >= 10 && g === a * (b % 10) + a * Math.floor(b / 10))) return { id: "mult_place" };
      if (noCarry(big, small) === g) return { id: "mult_regroup" };
    }
    return { id: Math.abs(g - p) <= Math.max(2, p * 0.1) ? "num_close" : "generic" };
  }
  function noCarry(a, b) { if (b >= 10) return NaN; const ds = String(a).split("").reverse(); return +ds.map(d => (+d * b) % 10).reverse().join(""); }
  // spelling: compare what Max wrote with the word
  function diagSpelling(word, given) {
    const w = String(word).toLowerCase(), g = String(given || "").toLowerCase().replace(/[^a-z]/g, "");
    if (!g) return { id: "sp_other" };
    const lev = (a, b) => { const d = Array.from({ length: a.length + 1 }, (_, i) => [i]); for (let j = 1; j <= b.length; j++) d[0][j] = j;
      for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; };
    const sorted = s => s.split("").sort().join("");
    if (g.length === w.length && sorted(g) === sorted(w)) return { id: "sp_swapped", detail: "All the right letters are there, but two are in the wrong order." };
    const dbl = w.match(/(.)\1/);
    if (dbl && g === w.replace(dbl[0], dbl[1])) return { id: "sp_double", detail: `“${w}” has a double “${dbl[1]}”.` };
    const gd = g.match(/(.)\1/); if (gd && g.replace(gd[0], gd[1]) === w) return { id: "sp_double", detail: `“${w}” has only one “${gd[1]}” there.` };
    const D = (window_ => (root.SPELLING_DATA || {}))(); let hl = "";
    Object.values(D).forEach(L => (L.words || []).forEach(x => { if (x.word.toLowerCase() === w) hl = (x.highlight || "").toLowerCase(); }));
    if (hl && !g.startsWith(hl) && w.startsWith(hl)) return { id: "sp_part", detail: `It starts with “${hl}”.` };
    if (g.length === w.length - 1 && lev(g, w) === 1) { let i = 0; while (i < g.length && g[i] === w[i]) i++; return { id: "sp_missing", detail: `The missing letter is “${w[i]}”.` }; }
    if (g.length === w.length + 1 && lev(g, w) === 1) return { id: "sp_extra" };
    if (g.length === w.length && lev(g, w) <= 2) { const i = [...w].findIndex((c, k) => c !== g[k]); if (/[aeiouy]/.test(w[i]) && /[aeiouy]/.test(g[i])) return { id: "sp_vowel", detail: `Check the vowel after “${w.slice(0, i)}”.` }; }
    return { id: "sp_other" };
  }
  // non-math multiple choice / tf: mix-ups, strong words
  function diagChoice(q, given) {
    if (q.type === "tf") return { id: /\b(always|never|only|all|every|none|no one)\b/i.test(q.q || "") ? "tf_strong_words" : "tf_check" };
    if (given && q.answer && given !== q.answer) return { id: "mixup", detail: `You picked “${given}”, but the answer is “${q.answer}”.`, a: given, b: q.answer };
    return { id: "generic" };
  }
  function diagRich(q, res) {
    if (q.type === "match") return { id: "match_swap" };
    if (q.type === "wordbank") {
      const sel = res.sel || [], answers = q.items.map(it => it.answer);
      const swapped = sel.some((w, i) => w && w !== answers[i] && answers.includes(w));
      return { id: swapped ? "wordbank_swap" : "generic" };
    }
    if (q.type === "inline") { const gs = HB.QT ? HB.QT.groups(q) : []; const k = (res.sel || []).findIndex((s, i) => gs[i] && s !== gs[i].answer);
      return k >= 0 ? { id: "mixup", detail: `You circled “${res.sel[k]}”, but it should be “${gs[k].answer}”.`, a: res.sel[k], b: gs[k].answer } : { id: "generic" }; }
    if (q.type === "sentence") { if (res.met && res.met.some(x => !x)) { const miss = q.rubric.filter((r, i) => !res.met[i]).map(r => r.idea);
        return { id: "sentence_missing", detail: "Add this idea: " + miss.join("; ") + "." }; }
      return { id: res.complete === false ? "sentence_incomplete" : "generic" }; }
    return { id: "generic" };
  }
  // main entry. ctx = { skill, q, given, res }
  function diagnose(ctx) {
    const q = ctx.q || {}, skill = ctx.skill || "", given = ctx.given;
    if (q.misc && given != null && q.misc[given]) return { id: q.misc[given] };
    if (q.div) return diagDivision(q.div[0], q.div[1], given);
    if (q.mult) return diagMult(q.mult[0], q.mult[1], given);
    if (skill === "spell.words" && q.word) return diagSpelling(q.word, given);
    if (HB.QT && HB.QT.isRich && HB.QT.isRich(q)) return diagRich(q, ctx.res || {});
    if (/^frac\./.test(skill)) return diagFraction(q, given);
    if (q.type === "mc" || q.type === "tf") return diagChoice(q, given);
    return { id: "generic" };
  }

  // ---------- generators (procedural "Try one like it"; every question carries steps + misc per wrong option) ----------
  const C = () => DATA().places || { on: ["Sudbury", "Kingston", "Thunder Bay"], ca: ["Halifax", "Winnipeg"], names: ["Max", "Aanya", "Liam"] };
  const place = () => pick(C().on), name = () => pick(C().names);
  function mc(skill, q, answer, wrongs, extra) {
    // wrongs: [[text, miscId]] — drop duplicates of the answer (by text or value) and of each other
    const seen = new Set([answer]), av = parseF(answer), misc = {}, opts = [answer];
    wrongs.forEach(([t, id]) => { t = String(t); const tv = parseF(t); if (!t || t === "0" || seen.has(t) || (av && tv && eq(av, tv)) || /\/0\b|-|NaN/.test(t)) return; seen.add(t); misc[t] = id; opts.push(t); });
    return Object.assign({ type: "mc", skill, q, options: shuffle(opts.slice(0, 4)), answer, misc, gen: true }, extra);
  }
  const GEN = {
    "frac.equiv"() {
      const b = pick([2, 3, 4, 5, 6]), a = ri(1, b - 1), k = ri(2, 4), D = b * k, A = a * k;
      const steps = [`${b} × ? = ${D}. What do you multiply ${b} by to get ${D}?`, `${b} × ${k} = ${D}, so the multiplier is ${k}.`, `Now multiply the top by ${k} too: ${a} × ${k} = ?`];
      const explain = `${b} × ${k} = ${D}, so multiply the top by ${k} too: ${a} × ${k} = ${A}. ${a}/${b} = ${A}/${D}.`;
      const v = ri(0, 2);
      if (v === 0) return { type: "number", skill: "frac.equiv", q: `${a}/${b} = ?/${D}. What is the missing numerator?`, answer: A, steps, explain, gen: true };
      if (v === 1) return mc("frac.equiv", `Which fraction is equivalent to ${a}/${b}?`, `${A}/${D}`,
        [[`${a + k}/${b + k}`, "equiv_added"], [`${A}/${b}`, "equiv_top_only"], [`${a}/${D}`, "equiv_top_only"], [`${a + 1}/${b + 1}`, "equiv_added"]], { steps, explain });
      const n = name(), p = place();
      return { type: "number", skill: "frac.equiv", q: `${n} in ${p} cut a tourtière into ${b} equal slices and ate ${a}. A cousin cut the same-size tourtière into ${D} slices. How many slices must the cousin eat to eat the same amount?`,
        answer: A, steps, explain, gen: true, canadian: true };
    },
    "frac.mixed"() {
      const d = pick([3, 4, 5, 6, 8]), w = ri(1, 4); let n = ri(1, d - 1); while (gcd(n, d) !== 1) n = ri(1, d - 1); const N = w * d + n;
      if (rnd() < 0.5) {
        const steps = [`How many ${d}ths are in one whole? ${d}.`, `How many are in ${w} wholes? ${w} × ${d} = ${w * d}.`, `Now add the ${n} extra pieces: ${w * d} + ${n} = ?`];
        return { type: "number", skill: "frac.mixed", q: `${w} ${n}/${d} = ?/${d}. What is the missing numerator?`, answer: N, steps,
          explain: `${w} × ${d} = ${w * d}, plus ${n} is ${N}. So ${w} ${n}/${d} = ${N}/${d}.`, gen: true };
      }
      const steps = [`How many groups of ${d} fit into ${N}?`, `${d} × ${w} = ${w * d}, so ${w} wholes fit.`, `${N} − ${w * d} = ${n} pieces are left over, and they stay ${d}ths.`];
      const p = place(), story = rnd() < 0.5;
      return mc("frac.mixed", story ? `A bakery in ${p} packs muffins in trays of ${d}. It baked ${N} muffins. How many trays is that, as a mixed number?` : `Write ${N}/${d} as a mixed number.`,
        `${w} ${n}/${d}`, [[`${n} ${w}/${d}`, "mixed_wholes"], [`${w} ${n}/${N}`, "mixed_wrong_den"], [`${w + 1} ${n}/${d}`, "mixed_wholes"], [`${w} ${n}/${w}`, "mixed_wrong_den"]],
        { steps, explain: `${N} ÷ ${d} = ${w} with ${n} left over, so ${N}/${d} = ${w} ${n}/${d}.`, canadian: story });
    },
    "frac.compare"() {
      const v = ri(0, 2); let A, B;
      if (v === 0) { const d = pick([5, 6, 8, 10, 12]); const x = ri(1, d - 2); A = [x, d]; B = [ri(x + 1, d - 1), d]; }
      else if (v === 1) { const n = ri(1, 3); const d1 = ri(n + 1, 6); A = [n, d1]; B = [n, ri(d1 + 1, 10)]; }
      else { const b = pick([2, 3, 4]); const k = pick([2, 3]); A = [ri(1, b - 1), b]; B = [A[0] * k + pick([-1, 1]), b * k]; if (B[0] <= 0) B[0] = 1; }
      if (rnd() < 0.5) [A, B] = [B, A];
      const a = A[0] / A[1], b = B[0] / B[1], sign = a < b ? "<" : a > b ? ">" : "=";
      const steps = A[1] === B[1] ? ["The bottom numbers are the same, so the pieces are the same size.", `Compare the tops: ${A[0]} and ${B[0]}.`]
        : A[0] === B[0] ? ["The tops are the same, so look at the size of the pieces.", `${A[1]}ths or ${B[1]}ths: which pieces are bigger?`]
        : [`Make the bottom numbers the same: ${A[1]} and ${B[1]} can both become ${A[1] * B[1] / gcd(A[1], B[1])}.`, `${A[0]}/${A[1]} = ${A[0] * (B[1] / gcd(A[1], B[1]))}/${A[1] * B[1] / gcd(A[1], B[1])} and ${B[0]}/${B[1]} = ${B[0] * (A[1] / gcd(A[1], B[1]))}/${A[1] * B[1] / gcd(A[1], B[1])}.`, "Now compare the tops."];
      const explain = `${A[0]}/${A[1]} ${sign} ${B[0]}/${B[1]}.` + (A[0] === B[0] ? " Same top, and bigger bottom numbers mean smaller pieces." : "");
      const wrong = s => { const sd = s === "<" ? -1 : s === ">" ? 1 : 0; return diagCompare({ w: 0, n: A[0], d: A[1] }, { w: 0, n: B[0], d: B[1] }, sd).id; };
      if (rnd() < 0.5) {
        const n1 = name(); let n2 = name(); while (n2 === n1) n2 = name();
        const ans = sign === ">" ? n1 : sign === "<" ? n2 : "Same distance";
        const misc = {}; [[n1, ">"], [n2, "<"], ["Same distance", "="]].forEach(([t, s]) => { if (t !== ans) misc[t] = wrong(s); });
        return { type: "mc", skill: "frac.compare", q: `${n1} skated ${A[0]}/${A[1]} km on the Rideau Canal in Ottawa. ${n2} skated ${B[0]}/${B[1]} km. Who skated farther?`,
          options: [n1, n2, "Same distance"], answer: ans, misc, steps, explain, gen: true, canadian: true };
      }
      const misc = {}; ["<", ">", "="].forEach(s => { if (s !== sign) misc[s] = wrong(s); });
      return { type: "mc", skill: "frac.compare", q: `Compare: ${A[0]}/${A[1]} ? ${B[0]}/${B[1]}`, options: ["<", ">", "="], answer: sign, misc, steps, explain, gen: true };
    },
    "frac.addsub"() {
      const d = pick([4, 5, 6, 7, 8, 9, 10]), plus = rnd() < 0.6;
      let a = ri(1, d - 1), b = ri(1, d - 1); if (!plus && a <= b) { [a, b] = [Math.max(a, b) + (a === b ? 1 : 0), Math.min(a, b)]; if (a >= d) { a = d - 1; b = Math.max(1, b - 1); } }
      if (!plus && a === b) b = a - 1;
      const res = plus ? F(a + b, d) : F(a - b, d), ans = fmt(res);
      const steps = ["Are the bottom numbers the same? Yes, so only the tops change.", `${plus ? "Add" : "Subtract"} the tops: ${a} ${plus ? "+" : "−"} ${b} = ${plus ? a + b : a - b}.`, `Keep the bottom number ${d}${plus && a + b >= d ? ", then change it to a mixed number" : ""}.`];
      const explain = `${a}/${d} ${plus ? "+" : "−"} ${b}/${d} = ${plus ? a + b : a - b}/${d}${fmt(res) !== `${plus ? a + b : a - b}/${d}` ? " = " + ans : ""}.`;
      const story = rnd() < 0.5, n = name(), p = pick(["Algonquin Park", "Muskoka", "Killarney Provincial Park", "Temagami"]);
      const q = story ? (plus ? `${n} paddled ${a}/${d} of the way across a lake in ${p} before lunch and ${b}/${d} of the way after lunch. How much of the way did ${n} paddle in all?`
                               : `${n} had ${a}/${d} of a bag of trail mix on a hike in ${p} and ate ${b}/${d} of the bag. How much of the bag is left?`)
                      : `${a}/${d} ${plus ? "+" : "−"} ${b}/${d} = ?`;
      const wr = plus ? [[fmt(F(a + b, d + d)), "added_denoms"], [`${a + b}/${d + d}`, "added_denoms"], [fmt(F(Math.abs(a - b), d)), "sub_instead_add"], [fmt(F(a * b, d)), "generic"]]
                      : [[fmt(F(a + b, d)), "added_instead_sub"], [`${a - b}/${d - b}`, "sub_denoms"], [`${a}/${d}`, "generic"], [`${a - b}/${d + d}`, "added_denoms"]];
      return mc("frac.addsub", q, ans, wr, { steps, explain, canadian: story });
    },
    "frac.unit"() {
      const w = ri(2, 9), d = pick([2, 3, 4, 5, 6, 8, 10]), times = rnd() < 0.5;
      if (times) {
        const ans = fmt(F(w, d));
        const steps = ["Times 1/" + d + " means groups of that one piece.", `${w} groups of 1/${d} is ${w} pieces that are ${d}ths.`, `Write it as ${w}/${d}, then change to a mixed number if it's more than 1.`];
        return mc("frac.unit", `${w} × 1/${d} = ?`, ans, [[String(w * d), "unit_mult_denom"], [`1/${w * d}`, "unit_bottom"], [fmt(F(d, w)), "unit_flip"], [`${w}/${w * d}`, "unit_bottom"]],
          { steps, explain: `${w} × 1/${d} = ${w}/${d}${ans !== `${w}/${d}` ? " = " + ans : ""}.` });
      }
      const ans = String(w * d), story = rnd() < 0.6, p = place();
      const steps = [`How many 1/${d} pieces fit in one whole? ${d}.`, `There are ${w} wholes, so multiply: ${w} × ${d} = ?`];
      const q = story ? `A sugar shack near ${p} poured ${w} litres of maple syrup into bottles that each hold 1/${d} of a litre. How many bottles did they fill?` : `${w} ÷ 1/${d} = ?`;
      return mc("frac.unit", q, ans, [[fmt(F(w, d)), "unit_div_divided"], [String(d), "unit_one_whole"], [String(w + d), "mult_added"], [String(w * d - d), "unit_one_whole"]],
        { steps, explain: `Each whole holds ${d} pieces, so ${w} ÷ 1/${d} = ${w} × ${d} = ${w * d}.`, canadian: story });
    },
    "mult.facts"(opts) {
      const a = (opts && opts.a) || ri(3, 12), b = (opts && opts.b) || ri(3, 12), p = a * b;
      const base = b > 5 ? 5 : b - 1;
      const steps = [`Start from a fact you know: ${a} × ${base} = ${a * base}.`, `${a} × ${b} is ${b - base} more group${b - base > 1 ? "s" : ""} of ${a}: ${a * base} + ${a * (b - base)} = ?`];
      return mc("mult.facts", `${a} × ${b} = ?`, String(p), [[String(a + b), "mult_added"], [String(a * (b + 1)), "mult_one_off"], [String(a * (b - 1)), "mult_one_off"], [String(p + 10), "num_close"]],
        { steps, explain: `${a} × ${b} = ${p}.`, mult: [a, b] });
    },
    "mult.multi"() {
      const a = ri(12, 49), b = ri(3, 9), p = a * b, t = Math.floor(a / 10) * 10, u = a % 10;
      const steps = [`Break ${a} into ${t} + ${u}.`, `${t} × ${b} = ${t * b} and ${u} × ${b} = ${u * b}.`, `Add the two parts: ${t * b} + ${u * b} = ?`];
      const story = rnd() < 0.5, pl = place();
      const q = story ? `The arena in ${pl} has ${a} rows of seats for a hockey game, with ${b} seats in each row. How many seats is that?` : `${a} × ${b} = ?`;
      return mc("mult.multi", q, String(p), [[String(t / 10 * b + u * b), "mult_place"], [String(noCarry(a, b)), "mult_regroup"], [String(p + 10), "num_close"], [String(p - b), "mult_one_off"]],
        { steps, explain: `${t} × ${b} = ${t * b}, ${u} × ${b} = ${u * b}, and ${t * b} + ${u * b} = ${p}.`, mult: [a, b], canadian: story });
    },
    "div.long"(opts) {
      const d = (opts && opts.d) || ri(12, 25), q = (opts && opts.q) || ri(11, 39), r = ri(1, d - 1), N = d * q + r;
      if (N > 999) return GEN["div.long"](opts);
      const first = Math.floor(N / 10), q1 = Math.floor(first / d), rest = first - q1 * d;
      const steps = [`How many times does ${d} fit into ${first}? ${q1} times (${q1} × ${d} = ${q1 * d}).`, `${first} − ${q1 * d} = ${rest}. Bring down the ${N % 10} to make ${rest * 10 + N % 10}.`,
        `How many times does ${d} fit into ${rest * 10 + N % 10}? Multiply, subtract, and what's left is the remainder.`];
      const story = rnd() < 0.5, pl = place();
      const qq = story ? `${N} students from schools in ${pl} are going to a museum in Toronto. Each bus holds ${d} students. How many full buses, and how many students are left over?` : `${N} ÷ ${d} = ?`;
      return mc("div.long", qq, `${q} R ${r}`, [[`${q - 1} R ${r + d}`, "div_rem_big"], [`${q + 1} R ${r}`, "div_quot_off"], [`${q} R ${(r + 3) % d || 1}`, "div_rem_off"], [`${q}`, "div_no_rem"]],
        { steps, explain: `${d} × ${q} = ${d * q}, and ${N} − ${d * q} = ${r}. So ${N} ÷ ${d} = ${q} R ${r}.`, div: [N, d], canadian: story });
    }
  };
  function gen(skill, opts) { const g = GEN[skill]; if (!g) return null; for (let k = 0; k < 6; k++) { const q = g(opts); if (q && (q.type !== "mc" || q.options.length >= 3)) return q; } return g(opts); }

  // ---------- step-by-step hints ----------
  // returns { steps:[...], worked } — steps never contain the final answer; worked is the full solution.
  function hintsFor(q, skill) {
    if (!q) return null;
    if (q.gen && q.steps) return { steps: q.steps.slice(), worked: q.explain || "" };
    const strat = (DATA().strategy || {})[skill];
    const worked = q.explain || (q.steps && typeof q.steps === "string" ? q.steps : "") || "";
    if (!strat && !worked) return null;
    const ans = q.answer == null ? "" : String(q.answer);
    const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const mask = s => ans && !/^[<>=]$|^(Yes|No|True|False)$/.test(ans) ? s.replace(new RegExp(`(=|is|makes|equals)\\s+${esc(ans)}(?![\\d/])`, "g"), "$1 ?") : s;
    let parts = String(typeof q.steps === "string" ? q.steps : worked).replace(/^(True|False|Yes|No)[.!,]\s*/i, "").split(/(?<=\.)\s+|,\s*so\s+|:\s+|;\s*/).map(s => s.trim().replace(/\.$/, "")).filter(Boolean);
    if (parts.length > 1) parts = parts.slice(0, -1);   // the last clause is usually the answer
    parts = parts.map(mask).filter(s => !/^(True|False|Yes|No)$/i.test(s)).slice(0, 3);
    const steps = [strat].concat(parts).filter(Boolean);
    return { steps: [...new Set(steps)], worked: worked || ("Answer: " + ans) };
  }
  function hintsForDivision(p) {
    const s = (p.steps || []).slice();
    return { steps: [(DATA().strategy || {})["div.long"]].concat(s.slice(0, -1)).filter(Boolean), worked: s.join(" ") + (p.revealText ? " " + p.revealText : "") };
  }
  function hintsForMult(a, b) { const g = GEN["mult." + (a <= 12 && b <= 12 ? "facts" : "multi")]; const q = a <= 12 && b <= 12 ? GEN["mult.facts"]({ a, b }) : null;
    if (q) return { steps: q.steps, worked: q.explain };
    const big = Math.max(a, b), small = Math.min(a, b), t = Math.floor(big / 10) * 10, u = big % 10;
    return { steps: [`Break ${big} into ${t} + ${u}.`, `${t} × ${small} = ${t * small} and ${u} × ${small} = ${u * small}.`, "Add the two parts."], worked: `${t * small} + ${u * small} = ${big * small}.` }; }

  HB.ED = { setRandom: f => { rnd = f || Math.random; }, ri, pick, shuffle, parseF, fmt, eq, val,
    skillOfSetQuestion, skillOfAttempt, skillOfHist, fracSkillOfText, multSkill, index, resetIndex: () => { IDX = null; }, qkey: key,
    diagnose, diagFraction, diagDivision, diagMult, diagSpelling, diagChoice, diagRich, gen, GEN, hintsFor, hintsForDivision, hintsForMult };
})(typeof window !== "undefined" ? window : globalThis);
