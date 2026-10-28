# Max's Homework Buddy (set7)

Static site, no build tools or CDNs. Plain HTML/CSS/JS plus pre-generated MP3 narration.
Every path is relative, so it works from a GitHub Pages subpath such as `/max-homework-buddy/`.

## Navigation template

Home → Topic → Subtopic list → Subtopic page → **Review** | **Quiz**

The fixed top bar on every screen has **Home**, **Back** (one level up the hierarchy), a breadcrumb
(e.g. `Home › Anatomy › Organs › Quiz`) and **Next** (topic → subtopics → first subtopic → review → quiz → next subtopic).
Navigating anywhere stops all audio and resets the screen you leave.

## Files

| File | What it is |
|---|---|
| `index.html` | Shell: styles, nav bar, one `<section class="view">` per screen, script tags |
| `topics.js` | **The TOPICS list.** Topics → subtopics → `{review, quiz}` module references |
| `core.js` | Router (`HB.go`, `HB.back`, `HB.next`, `HB.home`), breadcrumbs, Home/topic/subtopic screens |
| `math_review.js` | Math › Long Division › Review (narrated worked problems) |
| `math_quiz.js` + `math_quiz_data.js` | Math › Long Division › Quiz (keypad, 5 problems) |
| `anatomy_app.js` + `anatomy_data.js` | Anatomy quizzes (Organs, Body Systems) |
| `explore_app.js` + `explore_data.js` | Anatomy body scanner: Organ walkthrough and Systems view |
| `maxquiz.js` + `maxtopics_data.js` | Anatomy › Max's Test Topics quiz (multiple choice, pick-3, keypad). The review reuses the body scanner with `opts.source: "maxtopics"` |
| `spelling.js` | Spelling placeholder modules (show "Coming soon" until data exists) |
| `*_content.py` / `build_*.py` | Content sources and MP3 + data generators |
| `img/bg.jpg` | Background image |

## Add a subtopic

1. Write (or reuse) a module: `HB.registerModule("myReview", { view: "view-myReview", enter(ctx) {...}, leave() {...} })`.
   `ctx.opts` carries the options from the config entry. Add its `<section id="view-myReview" class="view" hidden>`
   to `index.html` and its `<script src="...">` before the final `HB.start()`.
2. Add one entry to the topic's `subtopics` in `topics.js`:
   ```js
   { id: "fractions", title: "Fractions", icon: "divide", blurb: "...",
     review: { module: "myReview", opts: {...}, label: "..." },
     quiz:   { module: "myQuiz",   opts: {...}, label: "..." } }
   ```
   Existing modules can be reused with different `opts`. For example, Anatomy uses `anatExplore` with `{mode: "walk"}` or `{mode: "systems"}`
   and `anatQuiz` with `{lesson: "organs"}` or `{lesson: "systems"}`.

## Add a topic

Add one object to `window.TOPICS` in `topics.js` (`id`, `title`, `icon`, `blurb`, `intro`, `subtopics: [...]`,
optional `toolbar` element id, optional `moreComingSoon: true`). The Home tile and all the screens are generated from it.
Icons are the names in `ICONS` in `core.js`.

## Narration MP3s (gTTS)

Never use `speechSynthesis` or the Web Speech API, because the Tesla browser doesn't have it. All speech is an MP3 played from a button tap.

```bash
source ../.venv/bin/activate          # needs: pip install gTTS
python build_anatomy.py               # anatomy quiz clips + explore clips  -> audio/anatomy/...
python build_explore.py               # body scanner clips only             -> audio/anatomy/explore/
python build_math_quiz.py             # math quiz clips + math_quiz_data.js -> audio/math_quiz/
python build_maxtopics.py             # Max's Test Topics review + quiz     -> audio/anatomy/maxtopics/
```

Builders only create missing clips. Add `--force` to regenerate everything, or delete one MP3 to regenerate just that clip.
Edit the text in `anatomy_content.py`, `explore_content.py`, `math_quiz_content.py` or `maxtopics_content.py`, not in the generated `*_data.js`.

## Local test

```bash
PORT=8797 python3 serve.py   # serves with audio/mpeg + range requests; open http://127.0.0.1:8797/
```

`_screens/` holds local test screenshots. Leave it out of any publish copy.
