// Spelling modules ("spellingReview", "spellingQuiz"). Placeholder until content exists.
// To add content: set window.SPELLING_DATA = { week1: { words: [{ word, sentence, audio }] } } in a spelling_data.js
// (generate MP3s with gTTS like build_explore.py), include it in index.html, then build the screens below.
(function () {
  window.SPELLING_DATA = window.SPELLING_DATA || {};
  function make(kind) {
    return {
      view: "view-comingSoon",
      enter(ctx) {
        const data = window.SPELLING_DATA[ctx.opts.list];
        HB.comingSoon("view-comingSoon", `${ctx.session.title} · ${kind === "review" ? "Review" : "Quiz"}`,
          data && data.words && data.words.length
            ? `${data.words.length} words loaded — the ${kind} screen is next to build.`
            : "Coming soon. Spelling content will drop in here.");
      },
      leave() {}
    };
  }
  HB.registerModule("spellingReview", make("review"));
  HB.registerModule("spellingQuiz", make("quiz"));
})();
