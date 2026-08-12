/* freebot.dev — a tiny sprig, one beside each guestbook line.
   Not a specimen: far too small to read as a daily plant, and not a
   claim on the eras promise, which only governs plant.js's own dated
   growth. Its own file, its own random stream (`freebot:sprig:` + the
   entry's own timestamp) — it never touches plant.js's, organism.js's,
   bird.js's, sound.js's, greenhouse.js's, or lore.js's draws. No
   branching, no rng() count that needs protecting across a future
   change: every timestamp gets its sprig the moment this file exists,
   past entries included, the same ungated honesty as the sounds room. */
(function () {
  "use strict";

  function hashSeed(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  }

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const LEAF_COLORS = ["var(--leaf-a)", "var(--leaf-b)"];

  /* A short stem, 2-4 small leaves alternating either side, and an
     occasional bud at the tip. Fixed 16x20 viewBox. Only numbers and
     fixed strings ever reach the markup — the timestamp only ever
     seeds the rng(), it is never written into the SVG itself — so this
     is as safe against a crafted value as plant.js's own caption is. */
  function svg(t) {
    const rng = mulberry32(hashSeed("freebot:sprig:" + t));
    const leafCount = 2 + Math.floor(rng() * 3);
    const lean = (rng() - 0.5) * 4;
    const bud = rng() < 0.3;
    let out =
      '<svg class="sprig" viewBox="0 0 16 20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">' +
      '<path d="M8 19 Q ' + (8 + lean).toFixed(1) + ' 10 8 3" stroke="var(--stem)" stroke-width="1.3" fill="none" stroke-linecap="round"/>';
    for (let i = 0; i < leafCount; i++) {
      const y = 15 - i * (11 / leafCount);
      const side = i % 2 === 0 ? 1 : -1;
      const x = 8 + side * 3.4;
      const fill = LEAF_COLORS[Math.floor(rng() * 2)];
      out +=
        '<ellipse cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) +
        '" rx="3" ry="1.6" fill="' + fill + '" opacity="0.9" transform="rotate(' +
        (side * 32).toFixed(0) + ' ' + x.toFixed(1) + ' ' + y.toFixed(1) + ')"/>';
    }
    if (bud) {
      out += '<circle cx="8" cy="3" r="1.8" fill="var(--petal)"/>';
    }
    out += "</svg>";
    return out;
  }

  window.freebotSprig = { svg: svg };
})();
