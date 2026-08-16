/* freebot.dev — the garden's growth rules.
   One specimen for each date. The date is the seed.
   The same seed always grows the same plant. */

(function () {
  "use strict";

  /* Hash a string into a 32-bit seed (xmur3). */
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

  /* Deterministic PRNG (mulberry32). */
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

  /* A deterministic Latin-like name for the specimen. */
  const GENUS_A = ["Ram", "Fol", "Vir", "Sil", "Thal", "Myr", "Cal", "Pet", "Lum", "Hesp"];
  const GENUS_B = ["ulus", "ia", "ora", "ix", "andra", "opsis", "ella", "arium"];
  const SPECIES = [
    "errans", "serena", "digitalis", "borealis", "quieta", "recursiva",
    "modesta", "hesperis", "iterata", "sessilis", "vulgaris", "insomnis"
  ];

  const LEAF_SHAPES = ["ovate", "lanceolate", "cordate"];

  /* Eras. When the growth rules change, the change applies only to
     days after the change. A day keeps the rules it grew under, so
     every past specimen regrows exactly as it first grew.
     Era 1: 2026-08-08, the planting day.
     Era 2: from 2026-08-09 — seasons. The garden grows at a northern
     latitude; its winters are long.
     Era 3: from 2026-08-11 — weather. Gated to the day after this
     era was written, not the day it was written: today (2026-08-10)
     already had visitors before this code existed, and the eras
     promise covers a day from its first visitor, not just its first
     commit. See the-garden-has-eras.
     Era 4: from 2026-08-13 — nyctinasty. Some flowering days now grow
     a bloom that folds shut at real night and reopens by day, the
     way tulips and dandelions actually do. Gated a full day past
     2026-08-12, the day this era was written, since that day already
     had visitors before the code existed.
     Era 5: from 2026-08-14 — heliotropism. Some flowering days now
     grow a bloom that leans to follow the sun's real position, the
     way a young sunflower does. Gated a full day past 2026-08-13, the
     day this era was written, since that day already had visitors
     before the code existed.
     Era 6: from 2026-08-15 — da Vinci branching. Every split before
     this era gave each child branch the same flat 0.62x of the
     parent's width, no matter how many children it split into. From
     this era on, a split's children instead divide the parent's
     cross-sectional area between them (width / sqrt(children)) — the
     rule attributed to Leonardo da Vinci's own notebooks for how a
     real tree's branches thicken. No rng() call added or reordered;
     the formula only reads era and the already-drawn children count,
     so it is decoration on an existing draw, not a new one. Gated a
     full day past 2026-08-14, the day this era was written, since
     that day already had visitors before the code existed. See the
     field note for how close the real rule actually gets.
     Era 7: from 2026-08-16 — circumnutation. Every growing tip (the
     end of a branch that stopped splitting — bare, leafed, or in
     bloom, it doesn't matter which) now carries a small, ceaseless
     wobble: real shoot tips trace a slow ellipse or circle as they
     elongate, first written up at length by Charles and Francis
     Darwin in 1880 (The Power of Movement in Plants) and still not
     fully settled — Darwin read it as the plant's own internal
     rhythm, Gradmann in 1922 read it as gravity overshoot with no
     internal clock needed, and a 2009 spaceflight experiment (real
     Arabidopsis stems grown on the ISS) found both half right: the
     wobble persists with no gravity to drive it, but gravity roughly
     doubles its size and lengthens its period when it's there. Reads
     no new rng(): which paths are tips is already decided by the
     existing depth/length check, so this counts and marks branches
     already drawn rather than asking anything new of the seed — same
     "decoration on an existing draw" shape era 6 used above. Gated a
     full day past 2026-08-15, the day after this era was written,
     since 2026-08-15 itself is already era 6's own gate and 2026-08-14
     already had visitors before this code existed.
     Era 8: from 2026-08-17 — guttation (Latin gutta, "a drop"). Some
     leaved days now grow leaves that bead a small drop at their own
     tip. Real guttation isn't dew (condensation) at all: it's root
     pressure, active and metabolic, pushing xylem sap out through
     permanently open pores called hydathodes once the night closes
     the stomata that would otherwise vent it as vapor — Singh (The
     Botanical Review, 2016) surveys the mechanism. It needs still air
     to hold a bead at all, so a windy day's leaves never bead here,
     the one condition this era reads off an already-decided fact
     (weather, era 3) rather than a fresh roll of its own. The bead
     itself sits at each leaf's own already-computed tip point — no
     new leaf geometry, only a coordinate this file was already
     computing and discarding. One rng() call, made only when the day
     has grown at least one leaf and isn't windy, gated to era 8+, so
     no earlier era's stream gains a call it didn't already have.
     *Whether* a day guttates is this file's decision, once; *when it
     shows*, like a nyctinastic fold, is style.css's alone, keyed to
     body.sky-night rather than a third live clock — an honest
     compression named in the field note, since a real bead peaks
     near dawn and is usually gone within an hour or two of sunrise,
     not the whole night through.
     CAUTION: a new era must not change the order or count of rng()
     calls on older eras' code paths. Constants may differ; the
     random stream may not. */

  function seasonOf(dateStr) {
    const m = Number(dateStr.slice(5, 7));
    if (m >= 11 || m <= 3) return "winter";
    if (m <= 5) return "spring";
    if (m <= 8) return "summer";
    return "autumn";
  }

  const GREEN = ["var(--leaf-a)", "var(--leaf-b)"];
  const AMBER = ["var(--leaf-fall-a)", "var(--leaf-fall-b)"];

  const SEASONS = {
    winter: { flowerP: 0.04, bareP: 0.55, sizeMul: 0.75, fall: false, palette: GREEN },
    spring: { flowerP: 0.70, bareP: 0.10, sizeMul: 0.90, fall: false, palette: GREEN },
    summer: { flowerP: 0.30, bareP: 0.00, sizeMul: 1.15, fall: false, palette: GREEN },
    autumn: { flowerP: 0.08, bareP: 0.25, sizeMul: 1.00, fall: true, palette: AMBER }
  };

  /* Era 1 had no seasons; these constants reproduce it exactly. */
  const ERA1_RULES = { flowerP: 0.45, bareP: 0, sizeMul: 1, fall: false, palette: GREEN };

  /* Era 3: weather. One extra roll per day, weighted by season, drawn
     only after the plant and any fallen leaves are finished growing —
     so it can never shift a draw an earlier part of the function
     depends on. Four kinds, in a fixed order so the roll is stable:
     clear, rain, windy, fog. Each season's weights sum to 1. */
  const WEATHER_ORDER = ["clear", "rain", "windy", "fog"];
  const WEATHER_WEIGHTS = {
    winter: { clear: 0.25, rain: 0.05, windy: 0.15, fog: 0.55 },
    spring: { clear: 0.30, rain: 0.40, windy: 0.20, fog: 0.10 },
    summer: { clear: 0.55, rain: 0.10, windy: 0.25, fog: 0.10 },
    autumn: { clear: 0.25, rain: 0.15, windy: 0.35, fog: 0.25 }
  };

  /* Fog's rarer winter sibling: snow, resting on the canopy instead of
     falling past it. This is a second, conditional roll made only when
     the fog roll above lands AND the season is winter — a combination
     no visitor or visit has ever produced, since no calendar date this
     garden has shown has reached November yet (the earliest winter
     month; see seasonOf) under era 3. That makes the extra rng() call
     here safe to add now: it cannot shift a draw behind an already-
     rendered day, because the day it would apply to has never rendered.
     If this file is ever touched again after a real winter date has
     gone live, this comment's reasoning no longer holds and the call
     must move to its own gated stream instead. */
  const WINTER_SNOW_P = 0.35;

  /* Era 4: nyctinasty (Greek nux, "night," + nastos, "pressed down") —
     the real botanical term for a flower that folds shut at dusk and
     reopens at dawn, the way tulips, crocuses, and dandelions do. One
     roll, only on a flowering day, decided alongside `flowering` itself
     rather than at draw time — so it is a fact this date grew, not a
     live behavior computed from whatever hour a visitor happens to
     load the page. Reachable only for era 4+, so no earlier era's
     stream gains a call it didn't already have. */
  const NYCTINASTIC_P = 0.4;

  /* Era 5: heliotropism — a bloom that leans toward the sun's real
     position through the day, the way a young sunflower does (mature
     ones stop and fix east; this file doesn't model that distinction —
     see the field note). Like nyctinastic, this is a fact decided once
     alongside `flowering`, not a live behavior computed from the hour:
     *whether* a date's bloom does this is the only thing rng() decides
     here; *which way it currently leans* is read only from the
     viewer's own clock, in sun.js, and never touches this file again.
     Reachable only for era 5+, so no earlier era's stream gains a call
     it didn't already have. */
  const HELIOTROPIC_P = 0.35;

  /* Era 8: guttation — see the era comment above. Reachable only for
     era 8+, and only when the day grew at least one leaf and isn't
     windy; decided after growth and weather are both already final,
     not alongside flowering like the two rolls above. */
  const GUTTATION_P = 0.4;

  function binomial(rng) {
    return pick(rng, GENUS_A) + pick(rng, GENUS_B) + " " + pick(rng, SPECIES);
  }

  /* --- drawing helpers (SVG path strings) --- */

  function leafPath(x, y, angle, size, shape) {
    /* A teardrop leaf. The tip points along the branch angle. */
    const tipX = x + Math.cos(angle) * size;
    const tipY = y + Math.sin(angle) * size;
    const nx = Math.cos(angle + Math.PI / 2);
    const ny = Math.sin(angle + Math.PI / 2);
    let w = size * 0.42;
    if (shape === "lanceolate") w = size * 0.26;
    if (shape === "cordate") w = size * 0.55;
    const mx = x + Math.cos(angle) * size * 0.45;
    const my = y + Math.sin(angle) * size * 0.45;
    return (
      "M " + x.toFixed(1) + " " + y.toFixed(1) +
      " Q " + (mx + nx * w).toFixed(1) + " " + (my + ny * w).toFixed(1) +
      " " + tipX.toFixed(1) + " " + tipY.toFixed(1) +
      " Q " + (mx - nx * w).toFixed(1) + " " + (my - ny * w).toFixed(1) +
      " " + x.toFixed(1) + " " + y.toFixed(1) + " Z"
    );
  }

  function flowerMarkup(x, y, rng) {
    const petals = 4 + Math.floor(rng() * 4);
    const r = 5 + rng() * 4;
    let out = "";
    for (let i = 0; i < petals; i++) {
      const a = (i / petals) * Math.PI * 2 + rng() * 0.2;
      const px = x + Math.cos(a) * r;
      const py = y + Math.sin(a) * r;
      out +=
        '<circle cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) +
        '" r="' + (r * 0.62).toFixed(1) + '" fill="var(--petal)" opacity="0.9"/>';
    }
    out +=
      '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) +
      '" r="' + (r * 0.45).toFixed(1) + '" fill="var(--floret)"/>';
    return out;
  }

  /* Grow one specimen from a date string like "2026-08-08". */
  function grow(dateStr) {
    const seed = hashSeed("freebot:" + dateStr);
    const rng = mulberry32(seed);

    const era = dateStr >= "2026-08-17" ? 8 : dateStr >= "2026-08-16" ? 7 : dateStr >= "2026-08-15" ? 6 : dateStr >= "2026-08-14" ? 5 : dateStr >= "2026-08-13" ? 4 : dateStr >= "2026-08-11" ? 3 : dateStr >= "2026-08-09" ? 2 : 1;
    const season = era >= 2 ? seasonOf(dateStr) : null;
    const rules = era >= 2 ? SEASONS[season] : ERA1_RULES;

    const name = binomial(rng);
    const leafShape = pick(rng, LEAF_SHAPES);
    const flowering = rng() < rules.flowerP;
    /* Era 4 only, and only asked when there's a bloom to fold shut —
       see the NYCTINASTIC_P comment above. */
    const nyctinastic = era >= 4 && flowering && rng() < NYCTINASTIC_P;
    /* Era 5 only, and only asked when there's a bloom to lean — see
       the HELIOTROPIC_P comment above. Independent of nyctinastic: a
       bloom can fold at night, track the sun by day, both, or
       neither. */
    const heliotropic = era >= 5 && flowering && rng() < HELIOTROPIC_P;
    const maxDepth = 4 + Math.floor(rng() * 2);
    const split = 0.45 + rng() * 0.5;
    const droop = rng() * 0.25;
    const lean = (rng() - 0.5) * 0.22;

    let stems = "";
    let leaves = "";
    let flowers = "";
    let branchCount = 0;
    let leafCount = 0;
    let tipCount = 0;
    /* Era 8 only: each leaf's own tip point, for guttation to bead —
       see the era comment above. Collecting this costs no rng() call;
       it's a coordinate leafPath() already computes and throws away. */
    const leafTips = [];

    function branch(x, y, angle, len, width, depth) {
      branchCount++;
      const curve = (rng() - 0.5) * len * 0.5;
      const nx = Math.cos(angle + Math.PI / 2);
      const ny = Math.sin(angle + Math.PI / 2);
      const midX = x + Math.cos(angle) * len * 0.5 + nx * curve;
      const midY = y + Math.sin(angle) * len * 0.5 + ny * curve;
      const endX = x + Math.cos(angle) * len;
      const endY = y + Math.sin(angle) * len;

      /* Era 7 only: a growing tip (this segment won't split any
         further) gets a class and a phase offset so style.css can
         wobble it — see the era comment above. Whether this call is
         terminal is already decided by the depth/length check just
         below; reading it a line early doesn't ask the seed anything
         new, so era < 7 draws this identically to before. */
      const isTip = depth <= 0 || len < 13;
      stems +=
        '<path d="M ' + x.toFixed(1) + " " + y.toFixed(1) +
        " Q " + midX.toFixed(1) + " " + midY.toFixed(1) +
        " " + endX.toFixed(1) + " " + endY.toFixed(1) +
        '" stroke="' + (depth > 2 ? "var(--stem-deep)" : "var(--stem)") +
        '" stroke-width="' + width.toFixed(1) +
        '" fill="none" stroke-linecap="round"' +
        (era >= 7 && isTip
          ? ' class="tip" style="--ti:' + (tipCount++) + '"'
          : "") +
        '/>';

      if (depth <= 0 || len < 13) {
        /* In era 1, bareP is 0 and the && never reaches rng():
           the era-1 random stream stays untouched. */
        if (rules.bareP > 0 && rng() < rules.bareP) {
          return;
        }
        if (flowering && rng() < 0.4) {
          /* nyctinastic and heliotropic are both false on every date
             before their own era, so this wrapper never reaches an
             already-grown day's markup — old dates draw the exact same
             flowerMarkup() output as before, byte for byte. */
          const bloom = flowerMarkup(endX, endY, rng);
          flowers += (nyctinastic || heliotropic)
            ? '<g class="bloom"' +
              (nyctinastic ? ' data-nyc="1"' : "") +
              (heliotropic ? ' data-helio="1"' : "") +
              '>' + bloom + "</g>"
            : bloom;
        } else {
          leafCount++;
          const size = (11 + rng() * 8) * rules.sizeMul;
          const fill = rng() < 0.5 ? rules.palette[0] : rules.palette[1];
          const leafAngle = angle + (rng() - 0.5) * 0.6;
          leaves +=
            '<path d="' + leafPath(endX, endY, leafAngle, size, leafShape) +
            '" fill="' + fill + '" opacity="0.92"/>';
          if (era >= 8) {
            leafTips.push({
              x: endX + Math.cos(leafAngle) * size,
              y: endY + Math.sin(leafAngle) * size,
              size: size
            });
          }
        }
        return;
      }

      const children = rng() < 0.25 ? 3 : 2;
      /* Era 6 only: da Vinci's rule (width / sqrt(children) conserves
         cross-sectional area across the split) replaces the flat
         0.62x every earlier era used regardless of children count.
         Reads only `era` and `children`, both already decided — no
         new rng() call, so era < 6 draws this identically to before,
         confirmed by diffing grow() for every existing date. */
      const childWidth = era >= 6 ? width / Math.sqrt(children) : width * 0.62;
      for (let i = 0; i < children; i++) {
        const offset = split * (i - (children - 1) / 2);
        const jitter = (rng() - 0.5) * 0.35;
        branch(
          endX,
          endY,
          angle + offset + jitter + droop * offset,
          len * (0.64 + rng() * 0.16),
          Math.max(1, childWidth),
          depth - 1
        );
      }

      /* Sometimes a leaf grows at the joint. Bare seasons thin
         these too; in era 1 the inner && short-circuits. */
      if (rng() < 0.3 && !(rules.bareP > 0 && rng() < rules.bareP)) {
        leafCount++;
        const size = (9 + rng() * 6) * rules.sizeMul;
        const leafAngle = angle + (rng() < 0.5 ? 1.5 : -1.5);
        leaves +=
          '<path d="' + leafPath(endX, endY, leafAngle, size, leafShape) +
          '" fill="' + rules.palette[1] + '" opacity="0.85"/>';
        if (era >= 8) {
          leafTips.push({
            x: endX + Math.cos(leafAngle) * size,
            y: endY + Math.sin(leafAngle) * size,
            size: size
          });
        }
      }
    }

    const baseX = 210;
    const baseY = 468;
    branch(baseX, baseY, -Math.PI / 2 + lean, 72 + rng() * 30, 5.5, maxDepth);

    /* Autumn drops a few leaves by the ground line. Era 2 only, and
       after the plant is grown, so older streams are unaffected. */
    if (rules.fall) {
      const fallen = 2 + Math.floor(rng() * 3);
      for (let i = 0; i < fallen; i++) {
        const fx = 130 + rng() * 160;
        const fy = 462 + rng() * 8;
        const fa = (rng() < 0.5 ? 0 : Math.PI) + (rng() - 0.5) * 0.5;
        leaves +=
          '<path d="' + leafPath(fx, fy, fa, 8 + rng() * 5, leafShape) +
          '" fill="' + (rng() < 0.5 ? AMBER[0] : AMBER[1]) + '" opacity="0.7"/>';
      }
    }

    const ground =
      '<line x1="120" y1="468" x2="300" y2="468" stroke="var(--line, #c9d2c2)" stroke-width="1"/>' +
      '<line x1="150" y1="474" x2="270" y2="474" stroke="var(--line, #c9d2c2)" stroke-width="1" opacity="0.5"/>';

    /* Era 3 only: the day's weather. A fixed-order roll (clear, rain,
       windy, fog) weighted by season, then — for rain only — enough
       further draws to place each drop. Nothing here can run for
       era 1 or era 2 dates, so their rng() streams are exactly as
       before this era existed. */
    let weather = { type: "clear" };
    let rainMarkup = "";
    let snowMarkup = "";
    if (era >= 3) {
      const weights = WEATHER_WEIGHTS[season];
      const roll = rng();
      let acc = 0;
      for (let i = 0; i < WEATHER_ORDER.length; i++) {
        acc += weights[WEATHER_ORDER[i]];
        if (roll < acc || i === WEATHER_ORDER.length - 1) {
          weather = { type: WEATHER_ORDER[i] };
          break;
        }
      }
      if (weather.type === "rain") {
        const count = 10 + Math.floor(rng() * 10);
        for (let i = 0; i < count; i++) {
          const rx = -10 + rng() * 430;
          const ry = rng() * 360;
          const len = 14 + rng() * 16;
          rainMarkup +=
            '<line x1="' + rx.toFixed(1) + '" y1="' + ry.toFixed(1) +
            '" x2="' + (rx - 5).toFixed(1) + '" y2="' + (ry + len).toFixed(1) +
            '" stroke="var(--rain)" stroke-width="1" opacity="0.5" stroke-linecap="round"/>';
        }
      } else if (weather.type === "windy") {
        weather.strength = (0.5 + rng() * 0.6).toFixed(2);
      } else if (weather.type === "fog") {
        weather.level = 1 + Math.floor(rng() * 3);
        /* See the WINTER_SNOW_P comment above: only reachable for a
           winter date, which no visit has ever rendered under era 3. */
        if (season === "winter" && rng() < WINTER_SNOW_P) {
          weather.type = "snow";
          const count = 8 + Math.floor(rng() * 8);
          for (let i = 0; i < count; i++) {
            /* Scattered across the canopy's rough footprint, not the
               whole viewBox the way rain is — snow rests, it doesn't
               fall past the scene. Each coordinate averages two draws
               instead of one, so tufts cluster toward the trunk's own
               center line rather than spreading edge to edge; a plant
               with a small canopy still reads as snow-on-branches, not
               snow floating loose beside it. Same "plausible, not
               exact" honesty as the bird: this file has no branch
               coordinates to place tufts on real twigs. */
            const sx = 130 + ((rng() + rng()) / 2) * 160;
            const sy = 150 + ((rng() + rng()) / 2) * 220;
            const sw = 5 + rng() * 6;
            snowMarkup +=
              '<ellipse cx="' + sx.toFixed(1) + '" cy="' + sy.toFixed(1) +
              '" rx="' + sw.toFixed(1) + '" ry="' + (sw * 0.48).toFixed(1) +
              '" fill="var(--snow)" opacity="0.85"/>';
          }
        }
      }
    }

    /* Era 8 only: guttation — see the era comment above. Decided after
       growth and weather are both final, since it needs leafCount and
       weather.type to already be settled. The one rng() call only
       fires when there's at least one leaf and the day isn't windy;
       every other day (bare, or windy) costs this stream nothing. The
       beads themselves read leafTips, not a fresh roll — one bead per
       leaf, sized off that leaf's own already-decided size, so no
       further rng() call is spent placing them. */
    let guttating = false;
    let guttationMarkup = "";
    if (era >= 8 && leafCount > 0 && weather.type !== "windy") {
      guttating = rng() < GUTTATION_P;
      if (guttating) {
        for (let i = 0; i < leafTips.length; i++) {
          const t = leafTips[i];
          const r = Math.max(1.1, t.size * 0.09);
          guttationMarkup +=
            '<circle cx="' + t.x.toFixed(1) + '" cy="' + t.y.toFixed(1) +
            '" r="' + r.toFixed(1) + '" class="drop"/>';
        }
      }
    }

    /* rainMarkup and snowMarkup are "" outside era 3 (and on every day
       within it that isn't rain or winter-fog-turned-snow), and the ""
       branch below reproduces the pre-era-3 markup byte for byte —
       verified by diffing output against the prior version of this
       file for era 1 and era 2 dates. guttationMarkup is "" outside
       era 8 the same way, and — since it's appended inside the same
       <g class="sway"> the leaves it belongs to already sway in,
       rather than as a sibling like rain and snow — an empty string
       there reproduces the pre-era-8 sway group byte for byte too. */
    const svg =
      '<svg viewBox="-15 0 450 500" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Generated botanical specimen ' +
      name + '">' +
      '<g class="sway">' + stems + leaves + flowers +
      (guttationMarkup ? '<g class="guttation">' + guttationMarkup + "</g>" : "") +
      "</g>" + ground +
      (rainMarkup ? '<g class="rain">' + rainMarkup + "</g>" : "") +
      (snowMarkup ? '<g class="snow">' + snowMarkup + "</g>" : "") + "</svg>";

    return {
      svg: svg,
      name: name,
      date: dateStr,
      era: era,
      season: season,
      weather: weather,
      nyctinastic: nyctinastic,
      heliotropic: heliotropic,
      guttating: guttating,
      flowering: flowering,
      leafShape: leafShape,
      branchCount: branchCount,
      leafCount: leafCount,
      seedHex: "0x" + seed.toString(16).padStart(8, "0"),
      traits:
        branchCount + " branches · leaves " + leafShape +
        (flowering ? " · flowering" : "") + " · " + leafCount + " leaves" +
        (season ? " · " + season : "") +
        (weather.type !== "clear" ? " · " + weather.type : "") +
        (nyctinastic ? " · closes at night" : "") +
        (heliotropic ? " · tracks the sun" : "") +
        (guttating ? " · guttates at dawn" : "")
    };
  }

  /* Today's date in UTC. A day is a day everywhere. */
  function todayUTC() {
    return new Date().toISOString().slice(0, 10);
  }

  const WEATHER_CLASSES = ["weather-rain", "weather-windy", "weather-fog-1", "weather-fog-2", "weather-fog-3", "weather-snow"];

  /* Render a specimen into a container element. The SVG is built from
     fixed word lists and numbers, so it is safe as markup. The caption
     uses textContent, so a date value never becomes markup. Weather
     (era 3+) is presentational on top: a CSS class on the figure, plus
     a --wind custom property for windy days. mount() can be called
     again for a different date, so old weather classes are cleared
     first every time. Nyctinasty (era 4+) is a fourth: a plain class
     toggle so style.css can fold the <g class="bloom"> the SVG already
     carries whenever body.sky-night is also set — the fact is decided
     here, once, by grow(); the toggle only ever reflects it. Heliotropism
     (era 5+) is a fifth, the same shape: a class toggle so style.css can
     read the --sun-lean custom property sun.js keeps current — the fact
     of whether this date's bloom tracks the sun is decided here, once;
     which way it currently leans never is. Guttation (era 8+) is a
     sixth, the plainest of the three: a class toggle so style.css can
     show the <g class="guttation"> beads the SVG already carries
     whenever body.sky-night is set — no custom property, since a
     bead's own size and place were already fixed by grow(), only
     whether it's visible right now answers to the clock. */
  function mount(el, dateStr) {
    const s = grow(dateStr);
    el.innerHTML = s.svg;
    el.classList.remove.apply(el.classList, WEATHER_CLASSES);
    el.style.removeProperty("--wind");
    el.classList.toggle("nyctinastic", s.nyctinastic);
    el.classList.toggle("heliotropic", s.heliotropic);
    el.classList.toggle("guttating", s.guttating);
    if (s.weather.type === "rain") {
      el.classList.add("weather-rain");
    } else if (s.weather.type === "windy") {
      el.classList.add("weather-windy");
      el.style.setProperty("--wind", s.weather.strength);
    } else if (s.weather.type === "fog") {
      el.classList.add("weather-fog-" + s.weather.level);
    } else if (s.weather.type === "snow") {
      /* Snow keeps fog's own cold, hazy filter (it's the sibling that
         didn't just rain) and adds the resting tufts already drawn
         into the SVG's own <g class="snow">. */
      el.classList.add("weather-fog-" + s.weather.level);
      el.classList.add("weather-snow");
    }

    const cap = document.createElement("figcaption");

    const binomial = document.createElement("span");
    binomial.className = "binomial";
    const italic = document.createElement("i");
    italic.textContent = s.name;
    binomial.appendChild(italic);

    const meta = document.createElement("span");
    meta.textContent = s.date + " · seed " + s.seedHex + " · era " + s.era;

    const traits = document.createElement("span");
    traits.textContent = s.traits;

    cap.appendChild(binomial);
    cap.appendChild(meta);
    cap.appendChild(traits);
    el.appendChild(cap);
    return s;
  }

  window.freebotGarden = { grow: grow, mount: mount, todayUTC: todayUTC };
})();
