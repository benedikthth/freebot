/* freebot.dev — weather lore, a small aphorism under each day's card.

   Old growers had proverbs for every kind of sky: a clear dawn read as
   a lucky sign, a fogged one as a reason to wait before planting. This
   file borrows that voice and then argues with it — every line quietly
   says the same thing this garden has said since "Weather with no
   yesterday": there was never a forecast here, only a fact, decided
   once, the instant a date's hash was drawn.

   Own file, own random stream (freebot:lore: + date), same discipline
   as organism.js and bird.js: it never calls plant.js's rng() or
   theirs, so it cannot touch any era's draws. It also reads a date's
   weather rather than deciding anything about the specimen — pure
   presentation, appended after the figcaption, never inside the SVG
   press.js reads — so a pressed sheet carries no lore line, the same
   restraint it already keeps for rain streaks and fog's blur. Ungated:
   it repaints nothing that already grew, so every date, past or
   future, gets a line the moment this file exists. */

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

  const LORE = {
    clear: [
      "Old almanacs called a clear day a lucky one. This one was never left to luck — it was fixed the moment its date existed.",
      "No cloud in the reading, the almanacs would say, and take it as an omen. Here it isn't an omen of anything. It's just what the hash came out to."
    ],
    rain: [
      "Rain before noon, the old sayings promised, clears by supper. Here noon and supper were decided together, in the same instant, by the same roll.",
      "Green things drink first in a rain, growers used to say. This branch has been drinking since the seed was drawn, not a moment before."
    ],
    windy: [
      "A gardener reading the sway would guess a storm is coming. None is coming. None ever was — the lean was the whole forecast, decided once and never revised.",
      "Old lore blamed a bent branch on a front moving in. There is no front here, and no weather system behind it — only the one number this date was always going to draw."
    ],
    fog: [
      "Fog at dawn, they used to say, burns off by noon and promises a fine day after. Here noon was never in doubt — the fog is just how today happens to look while it arrives.",
      "A hazed garden was once read as a sign to wait before planting. Nothing here is waiting. It was planted the only way this place plants anything: the moment its date was asked for."
    ],
    snow: [
      "Heavy fog in the deep of winter, an old rule held, sometimes rests on the branch as frost instead of falling through — rarely, at that. About a third of the time, this garden's own idea of rare, drawn once and never redrawn."
    ]
  };

  /* Deterministic pick — one line per date, forever. */
  function line(dateStr, weatherType) {
    const list = LORE[weatherType] || LORE.clear;
    const rng = mulberry32(hashSeed("freebot:lore:" + dateStr));
    return list[Math.floor(rng() * list.length)];
  }

  /* Append (or replace) the lore line under a mounted specimen's
     figcaption. Safe to call every time a date is shown: mount()
     already clears `fig` via innerHTML before this runs, but a
     leftover .lore-line is removed here too, defensively. */
  function attach(fig, dateStr, weather) {
    const old = fig.querySelector(".lore-line");
    if (old) old.remove();
    const type = (weather && weather.type) || "clear";
    const text = line(dateStr, type);
    const p = document.createElement("p");
    p.className = "lore-line";
    p.textContent = text;
    fig.appendChild(p);
    return text;
  }

  window.freebotLore = { line: line, attach: attach };
})();
