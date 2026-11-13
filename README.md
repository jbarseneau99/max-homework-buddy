# Max's Study Buddy

(Formerly "Max's Homework Buddy". The repo and URL path stay `max-homework-buddy`; localStorage keys stay `hb.*`.)

A static site with no build tools and no CDNs, just plain HTML, CSS and JS plus pre-generated MP3 narration.
Every path is relative, so it works from the GitHub Pages subpath `/max-homework-buddy/`.

## Content tree

**Subject › Subtopic › Session › Component.** Every session has a **Review** and a **Quiz**.

```
Math ─┬ Division ── Long Division with Remainders
      ├ Multiplication ── 8 lessons × Typed + Notepad (adaptive mastery, Math Heroes)
      └ Fractions ─┬ Equivalent Fractions ── 7-step review, 6 worked examples, 8-question quiz
                   ├ Comparing Fractions ── 6-step review, 4 worked examples, 8-question quiz (<, >, = and ordering)
                   ├ Mixed Numbers ── 6-step review, 4 worked examples, 8-question quiz (keypad both ways + pick the picture)
                   └ Multiplying & Dividing Fractions ── 6-step review, 7 cup-and-bowl worked examples, 8-question quiz
Science ── Anatomy ── Max's Test Topics (12 topics, 15-question quiz)
                    ├─ Organs (13 organs)
                    ├─ Circulatory · Respiratory · Digestive · Nervous · Skeletal · Muscular · Urinary
                    │     (components = that system's parts, e.g. Circulatory: heart, arteries, capillaries, veins, blood)
                    └─ All Systems (overview + full Body Systems quiz)
Language ── Spelling ── Week 7 · Letter boxes (easier) + Week 7 · Notepad (harder); auto-dual modes for every week in SPELLING_DATA
```

The fixed top bar on every screen has **Home**, **Back** (one level up), a full breadcrumb
(for example `Home › Science › Anatomy › Circulatory › Heart`) and **Next**. Next follows this order: subject → first subtopic → first session →
review → quiz → next session. On a component screen it goes to the next component. Navigating anywhere stops all audio.

When you tap a component in an anatomy session, the body scanner opens with that part glowing cyan, a label, a fact panel
and its narration MP3.

## Files

| File | What it is |
|---|---|
| `index.html` | Shell: styles, nav bar, one `<section class="view">` per screen, script tags |
| `topics.js` | **The tree** (`window.TOPICS`): subjects → subtopics → sessions → components |
| `core.js` | Router (`HB.go/back/next/home/goReview/goQuiz/goComponent`), breadcrumbs, list screens |
| `sessions_data.js` | Generated: anatomy components per session (`window.COMPONENTS`) and per-system quizzes (`window.QUIZ_SETS`) |
| `explore_app.js` + `explore_data.js` | Body scanner SVG: walkthrough, systems view, and the `anatComponent` module |
| `anatomy_app.js` + `anatomy_data.js` | Original Organs and Body Systems quizzes (`anatQuiz`) |
| `maxquiz.js` + `maxtopics_data.js` | Mixed-type quiz engine (`maxQuiz`): Max's 15 questions, or a system set via `opts.set` |
| `math_review.js`, `math_quiz.js` + `math_quiz_data.js` | Math review and keypad quiz (`opts.start` opens a given problem) |
| `spelling.js` + `spelling_data.js` | Spelling review + letter-box quiz (`spellingReview` / `spellingQuiz`) |
| `img/bg.jpg` | Background image |

## Add things

- **Component:** add an entry to the session's `components`. For anatomy, add it to `SYSTEM_COMPONENTS` in `sessions_content.py`
  with `parts` (SVG `data-part` ids), optional `hot` (a `data-sub` id inside the part, e.g. `ribs`), `x`/`y`, `does`, `fact`, and either
  `audio` (an existing MP3) or `say` (new narration). Then run `build_sessions.py`.
- **Session:** add one object to a subtopic's `sessions` in `topics.js`: `{ id, title, icon, blurb, review: {module, opts, label},
  quiz: {module, opts, label}, components, componentModule }`. You can reuse existing modules with different `opts`.
- **Subtopic or subject:** add an object to `subtopics` or to `window.TOPICS`. The tiles and lists are generated from it.
- **New module:** call `HB.registerModule("name", { view: "view-id", enter(ctx) {...}, leave() {...} })` and add its `<section>` and `<script>`.

## Home icons (anime style)
`anime_icons.js` holds three inline SVGs (`window.ANIME_ICONS`, viewBox 64x64, cyan #4cc9f0 / gold #ffe08a→#f0a91c glow, CSS-only motion, honours prefers-reduced-motion). A subject picks one with `homeIcon` in `topics.js`:
- math: "Sigil of Division", a rotating rune ring around a hexagram with a gold ÷ core
- science: "Power-up Orb", a pulsing energy core with three atom orbits and a gold lightning bolt
- language: "Word Scroll", an open scroll with gold rods and the kanji 言 ("word / to say")
- social: "Compass-Rose Globe", a glowing latitude/longitude globe with a gold compass-rose star and an orbiting N/E/S/W ring

Home is a 2x2 grid (Math, Science, Language, Social Studies), and it stays 2x2 on phones.

## Social Studies (grade 5, Canada)
- The content lives in `social_content.py`. `build_social.py` generates `social_data.js` (`window.SOCIAL_DATA`) and merges the quizzes into `window.QUIZ_SETS` as `ss_<id>`. It also writes the gTTS MP3s to `audio/social/`, building only the missing clips unless you pass `--force`.
- There are four subtopics, each with one session:
  - Provinces & Territories, with the 13 provinces and territories as component chips
  - Maps & Globes
  - Indigenous Peoples of Canada
  - Early Canadian History
- The Review is the `factWalk` module in `social_app.js`: a step walkthrough with short facts, a visual, and Previous / Hear it / Next. The MP3 always plays on a tap.
- The Quiz uses the `maxQuiz` engine (6 questions, spoken feedback, score, end screen with Email my results).
- Run the build with: `/workspace/division-exercises/.venv/bin/python build_social.py`


## Language › Spelling
- Content lives in `spelling_content.py`. `build_spelling.py` writes `spelling_data.js` (`window.SPELLING_DATA.week7`) and gTTS MP3s under `audio/spelling/` (review per word, quiz prompts, right/wrong, done scores). Only missing clips are built unless you pass `--force`.
- **Week 7 Vocabulary** (prefix `pre-` and blends `thr`, `spl`): 20 words. Review is shared. Each week in `SPELLING_DATA` automatically creates two sessions: **Letter boxes (easier)** — one box per letter with length shown; **Notepad (harder)** — same audio, no letter count, write on `HB.ScratchPad`, graded by `HB.gradeScratch` with a spelling-specific prompt (exact letters, ignore case/neatness). No AI key → plain text input with no length hint. Wrong answers show correct spelling vs what the AI read. Scores go to Quiz History + Outbox.
- Run: `/workspace/division-exercises/.venv/bin/python build_spelling.py`

## Math › Fractions
- The content lives in `fractions_content.py` (one block per session, listed in `SESSIONS`). `build_fractions.py` checks every
  fraction fact with Python's `Fraction` (arithmetic, `=` chains, `<`/`>` claims, remainders, quiz answers, option uniqueness,
  picture values) and stops if anything is wrong. Then it writes `fractions_data.js` (`window.FRACTIONS_DATA`, plus quiz sets
  `frac_equiv`, `frac_compare`, `frac_mixed`, `frac_muldiv` in `window.QUIZ_SETS`) and the gTTS MP3s under `audio/fractions/`
  (sub-folders `compare/`, `mixed/`, `muldiv/`). Narration turns `2/3` into "two thirds", `1 3/4` into "one and three fourths".
- `fractions_app.js` holds `window.FRAC_VIS.render(spec)` (animated SVG: fraction bars, pies, the ×/÷ rule, cross-multiplication,
  number lines, comparisons with a 1/2 benchmark, mixed-number pies, and the **cup and bowl model**) and the `fracWalk` module
  (Review walkthrough and worked-example chips, Previous / Hear it / Next; Hear it also replays the animation).
- Cup and bowl: for `a × b` the cup is `b` of a bowl, filled to `a`, then tipped into a same-size bowl whose level is marked
  (e.g. 1/2 × 1/3 = 1/6). For `a ÷ b` the bowls hold `a` and are cut into numbered `b`-sized scoops (e.g. 2 ÷ 1/4 = 8).
- The quizzes use `maxQuiz`. It accepts optional `vis` (picture with the question), `after` (picture shown once answered) and
  `optVis` (picture answer buttons), all drawn by `FRAC_VIS`.
- Run the build with: `/workspace/division-exercises/.venv/bin/python build_fractions.py`

## Settings, Correspondence and Outbox (`settings.js`)
- The top bar has an Outbox (envelope) button and a Settings (gear) button. Both screens sit off the tree, and Back returns to where you were.
- `window.SETTINGS_SCHEMA` is extensible. It is a list of sections, each with fields `{key, label, type: email|text, placeholder, recipient?}`. Add a section or field there and the Settings screen renders and validates it.
  - Correspondence: Max's email, Dad's email (Brant / Parent 1), Mom's email (Max's mom / Parent 2). Fields with `recipient.results: true` get results by default.
  - Outbox: signature.
- The Outbox is outbound only (there is no inbox).
  - Recipient checkboxes appear only for saved addresses.
  - It has a subject and a message, plus templates ("Send my latest quiz results", "I have a question about …").
  - Send opens a prefilled `mailto:` (`HB.openMailto`, overridable for tests). There is no backend.
- Quiz end screens have an "Email my results" button. It works for the Math quiz, Max's/system quizzes and the Organs/Body Systems lessons. It stores the result (`HB.recordResult`) and opens the Outbox prefilled to the parents.
- Storage is localStorage only, on the device: `hb.settings.v1`, `hb.outbox.sent.v1` (Sent log, with a Clear button) and `hb.lastResult.v1`. No real addresses are kept in the repo; placeholders use example.com.

## Narration MP3s (gTTS)

Never use `speechSynthesis` or the Web Speech API, because the Tesla browser doesn't have them. Every clip is an MP3 played from a button tap.

```bash
source ../.venv/bin/activate        # pip install gTTS
python build_anatomy.py             # anatomy quiz clips (+ explore)   -> audio/anatomy/
python build_explore.py             # body scanner clips               -> audio/anatomy/explore/
python build_maxtopics.py           # Max's Test Topics                -> audio/anatomy/maxtopics/
python build_sessions.py            # components + system quizzes      -> audio/anatomy/components/, audio/anatomy/sessions/
python build_math_quiz.py           # math quiz                        -> audio/math_quiz/
python build_fractions.py           # fractions (4 sessions)           -> audio/fractions/
```

Builders only create missing clips. Add `--force` to regenerate everything, or delete one MP3 to remake just that clip.
Edit the `*_content.py` files, never the generated `*_data.js` files.

## AI grading of scratch-pad work (`ai_grade.js`)

Settings › **AI grading**: `ai.apiKey` (xAI key, password field), `ai.model` (blank = `grok-4.7`), `ai.enabled` (on by default).
All three live only in this browser's `localStorage` (`hb.settings.v1`) — never commit a key; the repo is public.

When the key is set and enabled, **Submit work** on the long-division and fractions quizzes sends the scratch-pad PNG
(`image_url`, detail high) to `https://api.x.ai/v1/chat/completions` with the answer key in the prompt. The model returns
`{ ok, written, feedback }`; the drawing is the submission (keypad/tap hidden behind "Type answer instead").
If the model id is rejected it falls back through `grok-4.7, grok-4.6, grok-4.5, grok-4, grok-2-vision-1212`.
No key, AI off, or any API/network error → the normal keypad / tap flow ("Turn on AI grading in Settings to check handwriting.").
Outbox › Work submissions shows "AI checked" vs "Keypad" and what the AI read. Tests mock `fetch` (`_tools/test_ai.js`).

## Local test

```bash
PORT=8798 python3 serve.py          # then open http://127.0.0.1:8798/
```

`_screens/` holds local test screenshots. The `*.py` files and `serve.py` are not published.

## Quiz History
- Every finished quiz (math, fractions, spelling letter boxes + notepad, anatomy, social studies) is saved permanently in `localStorage` key `hb.quizHistory.v1` with date/time, subject, topic, mode, score, and per-question given/correct/ok.
- Open **Quiz History** from the Home screen. Filter by subject, tap an attempt for details, Export JSON backup, or Import a previous export. Existing `hb.lastResult.v1` (Outbox template) is kept and seeded into history if history was empty.
- Scratch-pad drawings in Outbox still use `hb.work.v1` (last 20 drawings); quiz scores themselves are uncapped in Quiz History.

## Math › Multiplication (year-long)
- Content: `mult_content.py` → `build_mult.py` → `mult_data.js` + `audio/mult/` (gTTS). Visuals in `mult_vis.js`. App: `mult_app.js` (`multWalk`, `multQuiz`). Mastery: `mult_mastery.js` (`hb.multMastery.v1`).
- Eight lessons, each with Review (diagrams + Math Hero) and dual quizzes (Typed / Notepad). Problems are generated and weighted toward weak times-table facts; lesson level 1–3.
- Home › **× Mastery** shows the 12×12 heatmap and per-lesson levels. Quiz History Export/Import includes `mastery.multiplication`.

## Test-style question types (`quiz_types.js` + `school_types.py`)
Max's real tests mix formats, so the shared `maxQuiz` engine supports, beside `mc` / `pick` / `number`:
- `tf` — True / False buttons.
- `wordbank` — `{bank, items:[{pre, answer, post}]}`; each bank word can be used once (1 mark per blank).
- `match` — `{terms, defs:[{letter, text}], answers}`; pick a letter for each term (1 mark per term).
- `inline` — circle-the-answer inside a sentence: `{parts:[text | {choices, answer}]}` (1 mark per group).
- `sentence` — complete-sentence answer, typed or written on the notepad (📝 toggle). `HB.gradeSentence` grades it against a
  rubric `[{idea, pts}]` with partial credit and checks it is a complete sentence (−½ if not). No key / AI off / error →
  Max sees the model answer, ticks the rubric ideas he included and "complete sentence", then **Score my answer**.
- Math `number` questions in **Notepad** mode are graded as show-your-work (`kind:"showwork"`): ½ mark for the steps and ½ for
  the final answer, with feedback on each. Questions carry a `steps` model solution.
Scores can be halves (shown as ½). Quiz History and the Outbox keep per-question `type`, `earned`, `pts`, `grader`, `feedback`.
Write content with the helpers in `school_types.py` (`wordbank, match, tf, inline, sentence`); `check()` validates each one,
`spoken()` makes the narration, `done_tiers()` makes end-of-quiz clips that work for any score. Changed text → new MP3 filename.
Where they are used: every Anatomy body-system quiz and Max's Test Topics, every Social Studies quiz (plus **Test Review:
Government**), Fractions Unit 3 and the Unit 4 practice test, and Spelling **Word Work** (`spell_week7_work`).
The legacy `anatQuiz` quizzes (Organs, All Systems) are unchanged.

## Math › Fractions Unit 3
`u3_equiv` (3.1 Equivalent Fractions), `u3_mixed` (3.2 Mixed Numbers and Improper Fractions), `u3_order` (3.3 Comparing and
Ordering) and `u3_practice` (Unit 3 Practice Test), each with Typed and Notepad sessions, before Unit 4. New pictures in
`FRAC_VIS`: `shapes`, `nline` (number line with improper / mixed labels), `mix2imp`, `imp2mix`.

## Curriculum (`curriculum.js` + `curriculum_ui.js`)
Home › **Curriculum** maps the Ontario Grade 5 curriculum (Math 2020, Science and Technology 2022, Social Studies 2018,
Language 2023, Health and Physical Education 2019) from https://www.dcp.edu.gov.on.ca/en/curriculum. Codes are official
(copied from the ministry's content data); the descriptions are short paraphrases. Each topic is **Covered in class (tested)**,
**Has lessons** (with an Open › link into the app) or **Coming up**. Edit `window.CURRICULUM` in `curriculum.js` to update status.

## Installable app (PWA)
`manifest.json` (name, short name, standalone, dark theme `#060b1a`, icons in `icons/` + `apple-touch-icon.png`, all made by
`make_icons.py` with Pillow) and `sw.js`, registered by `pwa.js` with a relative path. The service worker is **network-first**:
online, every request goes to the network (so `?v=` cache-busting keeps working); the versioned cache (`hb-pwa-v…`) is only an
offline fallback. MP3s are never cached by it. `pwa.js` also shows a dismissible install banner: **Install app** on Android
Chrome (`beforeinstallprompt`), "Tap Share then Add to Home Screen" on iOS Safari, nothing on desktop unless the browser offers
an install. Dismissal is stored in `localStorage` (`hb.installBanner.dismissed`); hidden when already running standalone.
When you change `sw.js`, bump `CACHE`.
