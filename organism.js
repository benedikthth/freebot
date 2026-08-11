/* freebot.dev — the ground line's other life.
   Moss and lichen, growing underfoot of the daily specimen. Deterministic
   and date-seeded, same discipline as the plant — but its own organism,
   on its own random stream. It never calls plant.js's rng(), so it
   cannot touch an era's random draws there; see the CAUTION comment in
   plant.js about that stream.

   Gated like an era, for the same reason plant.js has eras: a specimen
   that already grew must never get a retroactive repaint. Dates before
   GROUND_START render nothing here — see "The garden has eras". */

(function () {
  "use strict";

  const GROUND_START = "2026-08-09";

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

  function pick(rng, list) {
    return list[Math.floor(rng() * list.length)];
  }

  const MOSS = ["var(--ground-moss-a)", "var(--ground-moss-b)"];
  const LICHEN = ["var(--ground-lichen-a)", "var(--ground-lichen-b)"];

  /* Grow the ground organism for a date. Roughly three days in ten
     the ground stays bare — not everything present is always visible.
     Of the days something grows, a little over half is moss, the rest
     lichen. Both sit inside the plant's own ground-line span (x 120–300
     in the specimen's viewBox), so they read as part of the same
     picture, not a decoration bolted on. */
  function grow(dateStr) {
    if (dateStr < GROUND_START) {
      return { present: false, kind: null, svg: "" };
    }
    const rng = mulberry32(hashSeed("freebot:ground:" + dateStr));
    if (rng() > 0.7) {
      return { present: false, kind: null, svg: "" };
    }
    const kind = rng() < 0.55 ? "moss" : "lichen";
    let svg = "";

    if (kind === "moss") {
      const clumps = 3 + Math.floor(rng() * 4);
      for (let i = 0; i < clumps; i++) {
        const cx = 122 + rng() * 156;
        const cy = 466 + rng() * 9;
        const r = 3 + rng() * 4.5;
        svg +=
          '<ellipse cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) +
          '" rx="' + r.toFixed(1) + '" ry="' + (r * 0.6).toFixed(1) +
          '" fill="' + pick(rng, MOSS) + '" opacity="0.6"/>';
      }
    } else {
      const speckles = 10 + Math.floor(rng() * 12);
      for (let i = 0; i < speckles; i++) {
        const sx = 126 + rng() * 148;
        const sy = 464 + rng() * 7;
        const sr = 0.7 + rng() * 1.3;
        svg +=
          '<circle cx="' + sx.toFixed(1) + '" cy="' + sy.toFixed(1) +
          '" r="' + sr.toFixed(1) + '" fill="' + pick(rng, LICHEN) +
          '" opacity="0.55"/>';
      }
    }

    return { present: true, kind: kind, svg: svg };
  }

  /* Fog dims the ground the same amount it dims the specimen above it:
     era 3's weather-fog-N filter on the <svg> already applies
     saturate(0.85/0.7/0.55) by level, so a matching group opacity here
     reads as one weather, not two disagreeing effects. Snow (fog's
     winter sibling — see plant.js) keeps that same weather-fog-N class
     on the <svg> for its own filter, so it dims the ground the same
     way; only its glyph and its resting tufts differ from plain fog.
     This only ever reads plant.js's already-decided weather field — it
     never calls plant.js's rng(), so an era's random stream is
     untouched. On dates before era 3 (or on a clear day) weather is
     undefined or "clear" and this is a no-op. */
  const FOG_OPACITY = { 1: 0.85, 2: 0.7, 3: 0.55 };

  /* Attach the ground organism to an already-mounted specimen figure.
     Call this right after freebotGarden.mount(fig, dateStr), passing
     along the weather field that call returned. It reads the <svg>
     plant.js just wrote and appends a static <g> — outside the swaying
     group, so it never moves with the plant above it. The markup is
     built only from fixed word lists and numbers, the same safety
     pattern plant.js uses, so it is safe to insert as markup. */
  function attach(fig, dateStr, weather) {
    const svgEl = fig.querySelector("svg");
    if (!svgEl) return null;
    const g = grow(dateStr);
    if (g.present) {
      const isFoggy = weather && (weather.type === "fog" || weather.type === "snow");
      const op = isFoggy ? FOG_OPACITY[weather.level] : 1;
      svgEl.insertAdjacentHTML(
        "beforeend",
        '<g class="ground" opacity="' + op + '">' + g.svg + "</g>"
      );
    }
    return g;
  }

  window.freebotGround = { grow: grow, attach: attach, START: GROUND_START };
})();
