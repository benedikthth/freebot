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
   future, gets a line the moment this file exists.

   2026-08-18: a line now varies with season too, not just weather
   kind — the gap this file's own plots.md entry named from the day it
   shipped, since a foggy summer day and a foggy winter day used to
   read identically. Gated at LORE_CUTOFF, the same discipline plant.js
   gives an era: every date before the cutoff keeps calling exactly the
   old two-line-per-weather-kind lists, same rng() draw, same index
   arithmetic, so nothing already shown to a visitor changes. Only a
   date on or after the cutoff — none of which any visit had rendered
   yet when this shipped — reads the new season-crossed lists instead.
   Snow keeps its single line, ungated: it was already winter-only by
   construction, so there was no season gap in it to close. */

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

  /* Only a date on or after this cutoff reads LORE_SEASONAL below.
     Set to the first date no visit had shown yet when this shipped,
     so no line any visitor already read can change under them —
     the same discipline plant.js gives a new era. */
  const LORE_CUTOFF = "2026-08-19";

  /* Season-crossed lines, added 2026-08-18 to close the gap this
     plot's own next step named: a foggy summer day and a foggy
     winter day used to read identically. Two per weather kind per
     season, same as the flat lists above; snow stays ungated and
     unlisted here since it was already winter-only by construction. */
  const LORE_SEASONAL = {
    clear: {
      spring: [
        "A clear spring dawn, the almanacs swore, meant frost was done for the year. This one draws no forecast at all — the season only shapes the odds, never the promise.",
        "Old growers called a clear sky in planting season a green light. Nothing here was waiting for one; the seed was already decided before the sky had an opinion."
      ],
      summer: [
        "A cloudless summer noon, the old rule went, was the day to cut hay before a storm turned it. No storm is coming and none was ever tracked — this sky was fixed the moment the date was.",
        "Clear in high summer, growers said, meant the well would need watching. This branch has never once needed water; its whole season was drawn dry or wet in a single roll, long before noon."
      ],
      autumn: [
        "A clear autumn morning was read as the last warning before frost. There is no warning system here, only the one number this date was always going to draw.",
        "Old almanacs took a clear fall sky as a sign the harvest window was closing. This garden has no window and no harvest — only a date, asked for once."
      ],
      winter: [
        "A clear winter sky, the old sayings held, meant the cold snap wasn't done yet. Nothing here snaps or holds; the cold, such as it is, was decided the instant the date existed.",
        "Growers once read a clear winter dawn as a lucky, bitter one. Luck had no vote here — the hash didn't know it was drawing a cold month, only a season weight."
      ]
    },
    rain: {
      spring: [
        "Spring rain, the old rhyme promised, brings the whole year's flowers. This branch's bloom was never waiting on the rain that fell beside it — both were drawn together, in the same instant.",
        "A grower reading a spring shower would guess at a wet planting season ahead. There is no season ahead here to guess at — only the one day this page was asked to show."
      ],
      summer: [
        "Summer rain before noon, the almanacs said, clears by supper and cools the ground for good. Here noon and supper were decided together, in the same roll, with nothing left to clear.",
        "A grower caught in a summer downpour would read it as the crop's own thirst answered. This branch was never thirsty; the rain and the leaf arrived on the same draw, not in answer to one."
      ],
      autumn: [
        "Rain in the fall, old growers warned, softens the ground before the first frost sets it hard. Nothing here is softening toward anything — the frost, if any, was decided the same instant as the rain.",
        "An autumn shower was once read as the season's last watering before dormancy. There is no watering and no dormancy here, only a fact about one date, settled once."
      ],
      winter: [
        "Winter rain instead of snow, the old rule held, meant a mild season ahead. There is no season ahead to be mild — only the one roll already spent on this single day.",
        "A grower seeing winter rain instead of frost called it a borrowed day. Nothing here is borrowed; this day was never going to be any other way once its date was drawn."
      ]
    },
    windy: {
      spring: [
        "A spring gust, the old lore said, carries seed further than a still day would. This branch's own seed was never going anywhere; the wind and the branch were both fixed by the same draw.",
        "Growers once read a blustery spring day as the frost's last stand. There is no stand and no frost fighting it here — only a lean, decided once and never revised."
      ],
      summer: [
        "A summer wind, the almanacs said, breaks a heat spell before it can settle. No spell was building here to break; the sway was the whole forecast, and it was over before it began.",
        "Old growers read a hot, windy afternoon as a storm gathering somewhere off. Nothing gathers here. The lean you see is the entire weather system this date will ever have."
      ],
      autumn: [
        "An autumn wind, the old sayings held, strips the last leaves before frost can. This branch's leaves, kept or fallen, were never waiting on either — both were decided at once.",
        "A grower reading a fall gust called it the season turning over. Nothing turns here; the lean was drawn once, the same moment the season itself was."
      ],
      winter: [
        "A winter wind, old lore claimed, cuts colder than the thermometer says. There is no thermometer here, only a lean, fixed the instant this date was asked for.",
        "Growers once blamed a bent winter branch on a front pushing through. There is no front and never was — only the one number this date's hash produced."
      ]
    },
    fog: {
      spring: [
        "Spring fog, the almanacs promised, burns off by ten and leaves a fine planting day. Ten o'clock was never in doubt here — the fog is just how today happens to look while it arrives.",
        "A hazed spring morning was once read as the ground still too cold to plant. The ground here was never cold or warm on its own; the fog and the season were drawn in the same breath."
      ],
      summer: [
        "Summer fog before dawn, growers said, promised the day's worst heat by noon. There is no noon to dread here — the haze is the whole of this date's weather, decided once.",
        "A grower waking to summer fog called it the humidity settling in early. Nothing settles here; the fog was fixed the moment the date was, with no morning left to arrive at."
      ],
      autumn: [
        "Autumn fog, the old rule held, meant an early frost was already close. Nothing is close here — the fog is the entire distance this date's weather ever travels.",
        "A grower reading a foggy fall dawn called it the season losing its grip. The season never had one to lose; the haze and the month were decided together, once."
      ],
      winter: [
        "Heavy winter fog, an old rule held, sometimes rests on the branch as frost instead of falling through. This one still fell as fog, plainly, the way its one draw came out.",
        "Growers once read a winter haze as the cold holding its breath before a hard frost. There's no breath being held here — only the single roll this date's fog was drawn from."
      ]
    }
  };

  /* Deterministic pick — one line per date, forever. `season` is only
     ever consulted for a date on or after LORE_CUTOFF (see above); an
     era-1 date passes season as null and falls through to the flat
     list the same as every date always has. */
  function line(dateStr, weatherType, season) {
    let list = LORE[weatherType] || LORE.clear;
    if (season && dateStr >= LORE_CUTOFF) {
      const seasonal = LORE_SEASONAL[weatherType];
      if (seasonal && seasonal[season]) list = seasonal[season];
    }
    const rng = mulberry32(hashSeed("freebot:lore:" + dateStr));
    return list[Math.floor(rng() * list.length)];
  }

  /* Append (or replace) the lore line under a mounted specimen's
     figcaption. Safe to call every time a date is shown: mount()
     already clears `fig` via innerHTML before this runs, but a
     leftover .lore-line is removed here too, defensively. */
  function attach(fig, dateStr, weather, season) {
    const old = fig.querySelector(".lore-line");
    if (old) old.remove();
    const type = (weather && weather.type) || "clear";
    const text = line(dateStr, type, season);
    const p = document.createElement("p");
    p.className = "lore-line";
    p.textContent = text;
    fig.appendChild(p);
    return text;
  }

  window.freebotLore = { line: line, attach: attach };
})();
