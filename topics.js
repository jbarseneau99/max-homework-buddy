// ===== Topic registry =====
// Home → Topic → Subtopic list → Subtopic page → Review | Quiz.
// To add a subtopic: add one entry to a topic's `subtopics` with a review + quiz module (and its content).
// To add a topic: add one object here. Modules are registered with HB.registerModule(name, {view, enter, leave}).
window.TOPICS = [
  {
    id: "math", title: "Math", icon: "divide",
    blurb: "Long division, worked step by step, then on your own.",
    intro: "Watch the method, then prove you've got it.",
    subtopics: [
      { id: "longdiv", title: "Long Division with Remainders", icon: "divide",
        blurb: "3-digit ÷ 2-digit problems that leave a remainder.",
        review: { module: "mathReview", label: "5 narrated worked problems, step by step" },
        quiz:   { module: "mathQuiz",   label: "5 new problems — enter quotient and remainder" } }
    ],
    moreComingSoon: true
  },
  {
    id: "spelling", title: "Spelling", icon: "book",
    blurb: "Word lists and spelling challenges.",
    intro: "Spelling lists are on the way.",
    subtopics: [
      // Drop a list into window.SPELLING_DATA.week1 (see spelling.js) and these come alive.
      { id: "week1", title: "Word List 1", icon: "book", blurb: "Coming soon.",
        review: { module: "spellingReview", opts: { list: "week1" }, label: "Hear and see each word" },
        quiz:   { module: "spellingQuiz",   opts: { list: "week1" }, label: "Spell each word you hear" } }
    ],
    moreComingSoon: true
  },
  {
    id: "anatomy", title: "Anatomy", icon: "body",
    blurb: "Scan the body: organs, systems and how they work.",
    intro: "Run a scan of the human body, then test what you know.",
    toolbar: "anatBar",
    subtopics: [
      { id: "maxtopics", title: "Max's Test Topics", icon: "quiz",
        blurb: "The 12 topics from your teacher's list, ready for the test.",
        review: { module: "anatExplore", opts: { mode: "walk", source: "maxtopics", title: "Max's test topics" }, label: "12 topics on the body scanner" },
        quiz:   { module: "maxQuiz", label: "15 questions — tap, pick three, or type" } },
      { id: "organs", title: "Organs", icon: "heart",
        blurb: "Step through 13 organs and body parts on the scanner.",
        review: { module: "anatExplore", opts: { mode: "walk" },    label: "Organ walkthrough on the body scanner" },
        quiz:   { module: "anatQuiz",    opts: { lesson: "organs" }, label: "Organs quiz" } },
      { id: "systems", title: "Body Systems", icon: "flow",
        blurb: "See blood, air, food and signals flow through 7 systems.",
        review: { module: "anatExplore", opts: { mode: "systems" },  label: "Systems view with live flow" },
        quiz:   { module: "anatQuiz",    opts: { lesson: "systems" }, label: "Body Systems quiz (with match questions)" } }
    ],
    moreComingSoon: true
  }
];
