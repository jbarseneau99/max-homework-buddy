// ===== Content tree =====
// Subject › Subtopic › Session › Component.   Every session has a Review and a Quiz.
//   subject:   { id, title, icon, blurb, subtopics: [...], moreComingSoon }
//   subtopic:  { id, title, icon, blurb, toolbar?, sessions: [...], moreComingSoon }
//   session:   { id, title, icon, blurb, review: {module, opts, label}, quiz: {module, opts, label},
//                components: [{ id, title, module?, opts? }], componentModule?, componentsSoon? }
// A component without its own `module` opens session.componentModule with opts {session, index}.
// Modules are registered with HB.registerModule(name, { view, enter(ctx), leave() }).
(function () {
  const C = window.COMPONENTS || {};
  const SYS = [
    ["circulatory", "Circulatory", "heart", "Heart, arteries, capillaries, veins and blood."],
    ["respiratory", "Respiratory", "flow", "Nose, epiglottis, trachea and lungs."],
    ["digestive", "Digestive", "flow", "Mouth to large intestine, plus the liver."],
    ["nervous", "Nervous", "body", "Brain, spinal cord, nerves and senses."],
    ["skeletal", "Skeletal", "body", "Skull, ribs, spine, pelvis and limb bones."],
    ["muscular", "Muscular", "body", "Arm, core and leg muscles, plus the heart."],
    ["urinary", "Urinary", "flow", "Kidneys, ureters and bladder."]
  ];
  const mathWorked = [["425 ÷ 18"], ["458 ÷ 19"], ["492 ÷ 22"], ["525 ÷ 23"], ["559 ÷ 24"]];
  const mathQuiz = (window.MATH_QUIZ_DATA ? window.MATH_QUIZ_DATA.problems : []).map(p => p.label);

  window.TOPICS = [
    {
      id: "math", title: "Math", icon: "divide", homeIcon: "math", blurb: "Long division, worked step by step, then on your own.",
      subtopics: [
        { id: "division", title: "Division", icon: "divide", blurb: "Long division with remainders.",
          sessions: [
            { id: "longdiv", title: "Long Division with Remainders", icon: "divide",
              blurb: "3-digit ÷ 2-digit problems that leave a remainder.",
              review: { module: "mathReview", label: "5 narrated worked problems, step by step" },
              quiz: { module: "mathQuiz", label: "5 new problems — enter quotient and remainder" },
              components: mathWorked.map(([t], i) => ({ id: "ex" + (i + 1), title: "Worked: " + t, module: "mathReview", opts: { start: i } }))
                .concat(mathQuiz.map((t, i) => ({ id: "q" + (i + 1), title: "Quiz: " + t, module: "mathQuiz", opts: { start: i } }))) }
          ],
          moreComingSoon: true }
      ],
      moreComingSoon: true
    },
    {
      id: "science", title: "Science", icon: "body", homeIcon: "science", blurb: "Anatomy: organs, body systems and Max's test topics.",
      subtopics: [
        { id: "anatomy", title: "Anatomy", icon: "body", blurb: "Scan the human body on the body scanner.", toolbar: "anatBar",
          sessions: [
            { id: "maxtopics", title: "Max's Test Topics", icon: "quiz", blurb: "The 12 topics from your teacher's list, ready for the test.",
              review: { module: "anatExplore", opts: { mode: "walk", source: "maxtopics", title: "Max's test topics" }, label: "12 topics on the body scanner" },
              quiz: { module: "maxQuiz", label: "15 questions — tap, pick three, or type" },
              componentModule: "anatComponent", components: C.maxtopics || [] },
            { id: "organs", title: "Organs", icon: "heart", blurb: "Step through 13 organs and body parts.",
              review: { module: "anatExplore", opts: { mode: "walk" }, label: "Organ walkthrough on the body scanner" },
              quiz: { module: "anatQuiz", opts: { lesson: "organs" }, label: "Organs quiz" },
              componentModule: "anatComponent", components: C.organs || [] }
          ].concat(SYS.map(([k, t, ic, blurb]) => ({
            id: k, title: t, icon: ic, blurb,
            review: { module: "anatExplore", opts: { mode: "systems", sys: k, title: t + " system" }, label: "Live flow on the body scanner" },
            quiz: { module: "maxQuiz", opts: { set: k }, label: (window.QUIZ_SETS && QUIZ_SETS[k] ? QUIZ_SETS[k].questions.length : 4) + " questions" },
            componentModule: "anatComponent", components: C[k] || []
          }))).concat([
            { id: "allsystems", title: "All Systems", icon: "flow", blurb: "Compare all 7 systems, then the full Body Systems quiz.",
              review: { module: "anatExplore", opts: { mode: "systems" }, label: "Systems view with live flow" },
              quiz: { module: "anatQuiz", opts: { lesson: "systems" }, label: "Body Systems quiz (with match questions)" },
              components: [] }
          ]),
          moreComingSoon: true }
      ],
      moreComingSoon: true
    },
    {
      id: "language", title: "Language", icon: "book", homeIcon: "language", blurb: "Spelling lists and word challenges.",
      subtopics: [
        { id: "spelling", title: "Spelling", icon: "book", blurb: "Weekly word lists.",
          sessions: [
            // Drop a list into window.SPELLING_DATA.week1 (see spelling.js) and these come alive.
            { id: "week1", title: "Word List 1", icon: "book", blurb: "Coming soon.",
              review: { module: "spellingReview", opts: { list: "week1" }, label: "Hear and see each word" },
              quiz: { module: "spellingQuiz", opts: { list: "week1" }, label: "Spell each word you hear" },
              components: [], componentsSoon: true }
          ],
          moreComingSoon: true }
      ],
      moreComingSoon: true
    },
    {
      id: "social", title: "Social Studies", icon: "globe", homeIcon: "social", blurb: "Canada: provinces, maps, Indigenous peoples and early history.",
      subtopics: ((window.SOCIAL_DATA && SOCIAL_DATA.subtopics) || []).map(t => ({
        id: t.id, title: t.title, icon: "globe", blurb: t.blurb, toolbar: "anatBar",
        sessions: [{
          id: t.id, title: t.session, icon: "globe", blurb: t.sessionBlurb,
          review: { module: "factWalk", opts: { set: t.id }, label: ((SOCIAL_DATA.reviews[t.id] || []).length) + "-step narrated walkthrough" },
          quiz: { module: "maxQuiz", opts: { set: "ss_" + t.id }, label: ((window.QUIZ_SETS && QUIZ_SETS["ss_" + t.id]) ? QUIZ_SETS["ss_" + t.id].questions.length : 6) + " questions — tap, pick, or type" },
          componentModule: "factWalk", components: (SOCIAL_DATA.components[t.id] || []).map(c => ({ id: c.id, title: c.title }))
        }],
        moreComingSoon: false
      })),
      moreComingSoon: true
    }
  ];
})();
