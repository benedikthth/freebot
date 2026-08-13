/* freebot.dev — verses. A short poem for whatever day is on screen.

   Reads only what plant.js, organism.js, and bird.js already decided
   for a date — the same read-only discipline the almanac, sky, and
   rings already keep. But it goes one step more conservative than any
   of them: this file calls no rng() of its own at all, not even for
   cosmetic placement. Every choice a line makes (which of a handful
   of phrasings to use) is plain arithmetic on numbers that date's
   grow() already produced — the seed itself, and the branch/leaf
   counts — divided by a different small prime per slot so the choices
   don't all move together. Nothing here is drawn; it's picked, the
   way a hash table bucket is picked. There is nothing for the eras
   promise to even ask about, because there is no draw to ask about.

   A day's verse is not a fixed length. Season and the specimen itself
   always get a line; weather, ground cover, and a bird only earn one
   if that day actually grew them. A quiet, clear, bare day reads as a
   short poem; a rainy, flowering, mossy day with a bird in the canopy
   reads as a longer one. The length is itself a fact about the day,
   the same honest way a growth ring's width is. */

(function () {
  "use strict";

  const MIN = "2026-08-08";

  const SEASON_LINES = {
    spring: [
      "Spring keeps its promises early here.",
      "Everything green is in a hurry.",
      "The thaw arrived exactly on schedule, because it always does."
    ],
    summer: [
      "The long light asks nothing twice.",
      "Noon sits heavy in every leaf.",
      "Summer keeps its own late hours."
    ],
    autumn: [
      "The light is already leaving early.",
      "What falls here falls on purpose.",
      "Autumn keeps a tidy ledger of everything it takes back."
    ],
    winter: [
      "The cold arrived and stayed to read.",
      "Little moves here; less is asked to.",
      "Winter is patient about everything, including itself."
    ]
  };
  const ERA1_LINE = "Before the seasons began, a plant grew anyway.";

  const BRANCH_PHRASES = [
    "spare, and in no hurry to fill the frame",
    "modestly built, nothing wasted",
    "reaching a little further than it needs to",
    "busier than the sketch of it suggests",
    "built the ordinary way, for an ordinary day",
    "sprawling more than the ground line asked for"
  ];

  const BARE_LINES = [
    "Nothing on it today but the shape of waiting.",
    "Bare, but the wood underneath is still doing the work."
  ];
  const LEAFY_LINES = [
    "{n} leaves, and not one of them idle.",
    "{n} leaves keeping the light honest."
  ];
  const FLOWER_LINES = [
    "It flowered anyway, with no one there to see it.",
    "A bloom opened today, for reasons of its own."
  ];
  const FLOWER_NYCT_LINES = [
    "It flowered, and knows already to fold shut before dark.",
    "A bloom opened today — it will close itself before night asks."
  ];

  const GROUND_LINES = {
    moss: [
      "Moss has taken the ground line, quietly, the way moss does.",
      "Something soft is claiming the ground below."
    ],
    lichen: [
      "Lichen freckles the ground line, unhurried.",
      "The ground has gone speckled — slow work, patient work."
    ]
  };

  const BIRD_LINES = [
    "A bird sat through all of it and said nothing.",
    "Something with wings kept watch a while, then didn't."
  ];

  const WEATHER_LINES = {
    rain: [
      "Rain all day, and the branch never once complained.",
      "It rained, the way this garden's rain always means only itself."
    ],
    windy: [
      "Wind kept leaning on it, and it kept leaning back.",
      "A wind moved through that answered to no forecast."
    ],
    fog: [
      "Fog sat on the garden and stayed exactly as long as it was drawn to.",
      "Everything read a little softer under the fog."
    ],
    snow: [
      "Snow rested on the branches instead of falling through them.",
      "The rare cold trick happened again: fog turned to snow, and stayed."
    ]
  };

  /* pool[ floor(seedNum / salt) % pool.length ] — a different prime
     salt per call site so two slots on the same day rarely land on
     the same index together. seedNum is grow()'s own seedHex, parsed
     once; nothing here rolls anything new. */
  function choose(pool, seedNum, salt) {
    return pool[Math.floor(seedNum / salt) % pool.length];
  }

  function buildVerse(s, ground, bird) {
    const seedNum = parseInt(s.seedHex, 16) >>> 0;
    const lines = [];

    if (s.season) {
      lines.push(choose(SEASON_LINES[s.season], seedNum, 3));
    } else {
      lines.push(ERA1_LINE);
    }

    const branchPhrase = choose(BRANCH_PHRASES, seedNum, 7);
    lines.push({ html: true, text:
      '<i>' + s.name + '</i>, ' + s.leafShape + '-leaved, ' + branchPhrase + '.' });

    if (s.flowering) {
      const pool = s.nyctinastic ? FLOWER_NYCT_LINES : FLOWER_LINES;
      lines.push(choose(pool, seedNum, 11));
    } else if (s.leafCount === 0) {
      lines.push(choose(BARE_LINES, seedNum, 11));
    } else {
      lines.push(choose(LEAFY_LINES, seedNum, 11).replace("{n}", s.leafCount));
    }

    if (ground && ground.present) {
      lines.push(choose(GROUND_LINES[ground.kind], seedNum, 13));
    }
    if (bird && bird.present) {
      lines.push(choose(BIRD_LINES, seedNum, 17));
    }
    if (s.weather && s.weather.type !== "clear" && WEATHER_LINES[s.weather.type]) {
      lines.push(choose(WEATHER_LINES[s.weather.type], seedNum, 19));
    }

    return lines;
  }

  const verseEl = document.getElementById("verse");
  const caption = document.getElementById("verse-caption");
  const input = document.getElementById("day");
  const hint = document.getElementById("hint");

  function clamp(dateStr) {
    const max = freebotGarden.todayUTC();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return max;
    if (dateStr < MIN) return MIN;
    if (dateStr > max) return max;
    return dateStr;
  }

  function show(dateStr) {
    const d = clamp(dateStr);
    input.value = d;
    input.max = freebotGarden.todayUTC();

    const s = freebotGarden.grow(d);
    const ground = window.freebotGround ? window.freebotGround.grow(d) : { present: false };
    const bird = window.freebotBird ? window.freebotBird.grow(d) : { present: false };
    const lines = buildVerse(s, ground, bird);

    verseEl.innerHTML = "";
    lines.forEach(function (line) {
      const p = document.createElement("p");
      if (typeof line === "object" && line.html) {
        p.innerHTML = line.text;
      } else {
        p.textContent = line;
      }
      verseEl.appendChild(p);
    });

    const byline = document.createElement("p");
    byline.className = "verse-byline";
    byline.textContent = d + " · " + (s.season || "era 1");
    verseEl.appendChild(byline);

    const link = document.createElement("p");
    link.className = "label";
    const a = document.createElement("a");
    a.href = "/garden?day=" + d;
    a.textContent = "see " + d + " in the garden →";
    link.appendChild(a);
    verseEl.appendChild(link);

    caption.textContent = lines.length + " line" + (lines.length === 1 ? "" : "s") +
      " — a quiet day writes a short poem, a busy one a longer one";
    hint.textContent = d === freebotGarden.todayUTC() ? "today" : "";

    const url = new URL(location.href);
    if (d === freebotGarden.todayUTC()) {
      url.searchParams.delete("day");
    } else {
      url.searchParams.set("day", d);
    }
    history.replaceState(null, "", url);
  }

  function shift(days) {
    const t = new Date(input.value + "T00:00:00Z");
    t.setUTCDate(t.getUTCDate() + days);
    show(t.toISOString().slice(0, 10));
  }

  input.addEventListener("change", function () { show(input.value); });
  document.getElementById("prev").addEventListener("click", function () { shift(-1); });
  document.getElementById("next").addEventListener("click", function () { shift(1); });

  const fromUrl = new URL(location.href).searchParams.get("day");
  show(fromUrl || freebotGarden.todayUTC());
})();
