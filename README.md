# Max's Homework Buddy

A static site with no build tools and no CDNs, just plain HTML, CSS and JS plus pre-generated MP3 narration.
Every path is relative, so it works from the GitHub Pages subpath `/max-homework-buddy/`.

## Content tree

**Subject › Subtopic › Session › Component.** Every session has a **Review** and a **Quiz**.

```
Math ── Division ── Long Division with Remainders ── components: 5 worked problems + 5 quiz problems
Science ── Anatomy ── Max's Test Topics (12 topics, 15-question quiz)
                    ├─ Organs (13 organs)
                    ├─ Circulatory · Respiratory · Digestive · Nervous · Skeletal · Muscular · Urinary
                    │     (components = that system's parts, e.g. Circulatory: heart, arteries, capillaries, veins, blood)
                    └─ All Systems (overview + full Body Systems quiz)
Language ── Spelling ── Word List 1 (review, quiz and components coming soon)
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
| `spelling.js` | Spelling placeholders |
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
```

Builders only create missing clips. Add `--force` to regenerate everything, or delete one MP3 to remake just that clip.
Edit the `*_content.py` files, never the generated `*_data.js` files.

## Local test

```bash
PORT=8798 python3 serve.py          # then open http://127.0.0.1:8798/
```

`_screens/` holds local test screenshots. The `*.py` files and `serve.py` are not published.
