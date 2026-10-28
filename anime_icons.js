// Anime-style Home tile icons (inline SVG, no external assets). Used by core.js renderHome via subject.homeIcon.
//   math     — "Sigil of Division": glowing magic circle (rune ring + hexagram) with a gold ÷ core.
//   science  — "Power-up Orb": energy orb with three atom orbits and a gold lightning spark.
//   language — "Word Scroll": open scroll with gold rods and a brush-stroke kanji 言 ("word / to say").
window.ANIME_ICONS = (function () {
  const defs = id => `<defs>
    <filter id="${id}-glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <radialGradient id="${id}-core" cx="50%" cy="45%" r="55%"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#9ff3ff"/><stop offset="1" stop-color="#1b6f9c" stop-opacity="0"/></radialGradient>
    <linearGradient id="${id}-gold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe08a"/><stop offset="1" stop-color="#f0a91c"/></linearGradient>
  </defs>`;
  const ticks = Array.from({ length: 24 }, (_, i) => {
    const a = i * Math.PI / 12, r1 = 27, r2 = i % 2 ? 29 : 30.5;
    return `M${(32 + r1 * Math.cos(a)).toFixed(2)},${(32 + r1 * Math.sin(a)).toFixed(2)} L${(32 + r2 * Math.cos(a)).toFixed(2)},${(32 + r2 * Math.sin(a)).toFixed(2)}`;
  }).join(" ");
  return {
    math: `<svg class="anime-ic am-math" viewBox="0 0 64 64" aria-hidden="true">${defs("amm")}
      <g filter="url(#amm-glow)" fill="none" stroke-linecap="round" stroke-linejoin="round">
        <g class="am-spin"><circle cx="32" cy="32" r="29.5" stroke="#4cc9f0" stroke-width="1.6"/><path d="${ticks}" stroke="#7fe7ff" stroke-width="1.2"/></g>
        <circle cx="32" cy="32" r="22" stroke="#ffc23d" stroke-width="1.1" stroke-dasharray="3 2.4"/>
        <path d="M32,12 L49.3,42 L14.7,42 Z M32,52 L14.7,22 L49.3,22 Z" stroke="#4cc9f0" stroke-width="1.1" opacity=".75"/>
        <circle cx="32" cy="32" r="11" stroke="#7fe7ff" stroke-width="1.3"/>
        <g stroke="url(#amm-gold)" fill="url(#amm-gold)"><circle cx="32" cy="25.5" r="2.1"/><circle cx="32" cy="38.5" r="2.1"/><path d="M24.5,32 L39.5,32" stroke-width="2.8" fill="none"/></g>
      </g></svg>`,
    science: `<svg class="anime-ic am-sci" viewBox="0 0 64 64" aria-hidden="true">${defs("ams")}
      <circle class="am-pulse" cx="32" cy="32" r="15" fill="url(#ams-core)"/>
      <g filter="url(#ams-glow)" fill="none" stroke="#4cc9f0" stroke-width="1.5">
        <ellipse cx="32" cy="32" rx="27" ry="10"/><ellipse cx="32" cy="32" rx="27" ry="10" transform="rotate(60 32 32)"/><ellipse cx="32" cy="32" rx="27" ry="10" transform="rotate(-60 32 32)"/>
        <circle cx="59" cy="32" r="2" fill="#7fe7ff" stroke="none"/><circle cx="18.5" cy="55.4" r="2" fill="#7fe7ff" stroke="none"/><circle cx="18.5" cy="8.6" r="2" fill="#7fe7ff" stroke="none"/>
        <path d="M35.5,17 L26,34 L32.5,34 L28.5,47 L39,28.5 L32.5,28.5 Z" fill="url(#ams-gold)" stroke="#fff3c4" stroke-width=".8" stroke-linejoin="round"/>
      </g></svg>`,
    language: `<svg class="anime-ic am-lang" viewBox="0 0 64 64" aria-hidden="true">${defs("aml")}
      <g filter="url(#aml-glow)" stroke-linecap="round" stroke-linejoin="round">
        <path d="M15,12 L49,12 L49,52 L15,52 Z" fill="rgba(10,30,60,.85)" stroke="#4cc9f0" stroke-width="1.3"/>
        <rect x="10" y="8" width="44" height="5" rx="2.5" fill="url(#aml-gold)"/><rect x="10" y="51" width="44" height="5" rx="2.5" fill="url(#aml-gold)"/>
        <g fill="none" stroke="#7fe7ff" stroke-width="3">
          <path d="M30,17.5 C31.5,18.5 33,19.5 33.5,21"/>
          <path d="M21.5,24 C27,23.2 37,23 43,23.6"/>
          <path d="M25,29.2 C29,28.8 35,28.8 39,29.2"/>
          <path d="M25,34.2 C29,33.8 35,33.8 39,34.2"/>
          <path d="M25.5,39 L26,47.5 M25.8,39.2 C30,38.8 35,38.8 38.5,39.2 L38,47.5 M26.2,46.8 C30,46.4 34,46.4 37.6,46.8"/>
        </g>
      </g></svg>`
  };
})();
