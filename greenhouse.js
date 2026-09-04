/* freebot.dev — the greenhouse. Grow any word's plant, on request.
   Not part of the daily garden: no date, no eras, no seasons. A
   greenhouse holds its climate constant, so nothing here is
   ever bare or dropping leaves — it's always some fixed indoor
   weather. Its own file, its own random stream
   (`freebot:greenhouse:` + word), so it can't touch plant.js's,
   organism.js's, bird.js's, or sound.js's draws, and it draws to
   its own pot markup rather than plant.js's ground line, so the two
   kinds of specimen never look interchangeable.

   Nothing grown here is saved. Type a word, get a plant, close the
   tab and it's gone — the no-curation promise the daily specimen
   makes (no one, not even me, picks the pretty ones) extends here
   by simply keeping no memory of what anyone typed.

   Grafting: two words instead of one. A real graft joins a scion (the
   cutting) onto a rootstock (the standing plant); the rootstock is
   understood to govern vigor and hardiness, the scion what actually
   grows on top. A flat average of the two words' rng() streams doesn't
   earn that framing — addition is commutative, so 'apple' grafted onto
   'thunder' and 'thunder' grafted onto 'apple' would draw an identical
   plant, and the rootstock/scion labels would be decoration on a
   coin-flip-order-proof symmetric blend. So the average here is
   weighted, 60/40 toward the rootstock, at every single draw — every
   decision the plant makes is answerable to both words, but the
   rootstock's stream always has the larger say, the way its real
   counterpart does. Same hashSeed/mulberry32 machinery as a single
   word; two streams walked in lockstep, unevenly. */

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

  function pick(rng, list) {
    return list[Math.floor(rng() * list.length)];
  }

  const GENUS_A = ["Ram", "Fol", "Vir", "Sil", "Thal", "Myr", "Cal", "Pet", "Lum", "Hesp", "Ver", "Gloss"];
  const GENUS_B = ["ulus", "ia", "ora", "ix", "andra", "opsis", "ella", "arium", "anthus"];
  const SPECIES = [
    "errans", "serena", "digitalis", "borealis", "quieta", "recursiva",
    "modesta", "hesperis", "iterata", "sessilis", "vulgaris", "insomnis",
    "vitrea", "domestica", "conserva"
  ];
  const LEAF_SHAPES = ["ovate", "lanceolate", "cordate"];

  const GREEN = ["var(--leaf-a)", "var(--leaf-b)"];
  const POT = ["var(--pot-a)", "var(--pot-b)"];

  /* Fixed indoor climate. No seasons, no bare branches, no fall. */
  const CLIMATE = { flowerP: 0.42, sizeMul: 1.0, palette: GREEN };

  /* Declared here, ahead of growWithRng/potMarkup, so the pot's own
     graft seam (below) can split at the identical ratio graft()'s own
     rng() weighting already uses further down this file — one number,
     not two that could quietly drift apart. */
  const ROOTSTOCK_WEIGHT = 0.6;

  function binomial(rng) {
    return pick(rng, GENUS_A) + pick(rng, GENUS_B) + " " + pick(rng, SPECIES);
  }

  function leafPath(x, y, angle, size, shape) {
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

  /* A small potted trapezoid instead of plant.js's ground line — the
     tell, at a glance, that this specimen didn't grow from a date.
     graftMeta is undefined for a plain word (grow()); only graft()
     hands one in, and only to ask for a second band of markup below —
     it changes no rng() call, so a plain grow()'s pot is byte-for-byte
     what it always was. */
  function potMarkup(rng, graftMeta) {
    const rim = 148 + rng() * 4;
    const base = rim - 34;
    const top = 468;
    const bot = top + 38;
    const cx = 210;
    const potIdx = Math.floor(rng() * POT.length);
    const potColor = POT[potIdx];

    let out =
      '<path d="M ' + (cx - rim / 2).toFixed(1) + " " + top +
      " L " + (cx + rim / 2).toFixed(1) + " " + top +
      " L " + (cx + base / 2).toFixed(1) + " " + bot +
      " L " + (cx - base / 2).toFixed(1) + " " + bot + ' Z" fill="' +
      potColor + '" stroke="var(--pot-rim)" stroke-width="1.5"/>';

    /* A visible graft seam: the rootstock's own real dominance below,
       the scion banded in above, split at the identical 60/40 ratio
       ROOTSTOCK_WEIGHT already gives every rng() draw — not a new
       fact rolled about the pot, just the one fact that's already
       true about the plant, drawn where a screenshot alone can see
       it. The upper band takes the pot's *other* fixed color, chosen
       by index, not a second rng() call — two colors already existed
       in POT, this just stops leaving one of them unused. */
    if (graftMeta) {
      const scionColor = POT[(potIdx + 1) % POT.length];
      const frac = 1 - ROOTSTOCK_WEIGHT;
      const seamY = top + (bot - top) * frac;
      const leftTop = cx - rim / 2, rightTop = cx + rim / 2;
      const leftBot = cx - base / 2, rightBot = cx + base / 2;
      const leftSeam = leftTop + (leftBot - leftTop) * frac;
      const rightSeam = rightTop + (rightBot - rightTop) * frac;
      out +=
        '<path d="M ' + leftTop.toFixed(1) + " " + top +
        " L " + rightTop.toFixed(1) + " " + top +
        " L " + rightSeam.toFixed(1) + " " + seamY.toFixed(1) +
        " L " + leftSeam.toFixed(1) + " " + seamY.toFixed(1) + ' Z" fill="' +
        scionColor + '"/>' +
        '<line x1="' + leftSeam.toFixed(1) + '" y1="' + seamY.toFixed(1) +
        '" x2="' + rightSeam.toFixed(1) + '" y2="' + seamY.toFixed(1) +
        '" stroke="var(--pot-rim)" stroke-width="1.25" stroke-dasharray="3,2"/>';
    }

    out +=
      '<ellipse cx="' + cx + '" cy="' + top + '" rx="' + (rim / 2).toFixed(1) +
      '" ry="4" fill="var(--pot-rim)"/>';
    return out;
  }

  /* Trim, collapse whitespace, cap length. Returns "" for a word with
     no real content. Used only to build the hash input and the
     visible label — the label is always set with textContent, never
     concatenated into markup, so nothing typed here can become a tag
     or an attribute. */
  function normalize(word) {
    if (typeof word !== "string") return "";
    const trimmed = word.replace(/\s+/g, " ").trim();
    return trimmed.slice(0, 32);
  }

  /* The growth function itself, taking any rng() — a single word's
     stream (grow) or two averaged together (graft). Identical call
     order and count either way; only where the numbers come from
     changes. Returns everything but word/seedHex, which the caller
     (grow or graft) knows how to label. */
  function growWithRng(rng, graftMeta) {
    const name = binomial(rng);
    const leafShape = pick(rng, LEAF_SHAPES);
    const flowering = rng() < CLIMATE.flowerP;
    const maxDepth = 4 + Math.floor(rng() * 2);
    const split = 0.45 + rng() * 0.5;
    const droop = rng() * 0.25;
    const lean = (rng() - 0.5) * 0.22;

    let stems = "";
    let leaves = "";
    let flowers = "";
    let branchCount = 0;
    let leafCount = 0;

    function branch(x, y, angle, len, width, depth) {
      branchCount++;
      const curve = (rng() - 0.5) * len * 0.5;
      const nx = Math.cos(angle + Math.PI / 2);
      const ny = Math.sin(angle + Math.PI / 2);
      const midX = x + Math.cos(angle) * len * 0.5 + nx * curve;
      const midY = y + Math.sin(angle) * len * 0.5 + ny * curve;
      const endX = x + Math.cos(angle) * len;
      const endY = y + Math.sin(angle) * len;

      stems +=
        '<path d="M ' + x.toFixed(1) + " " + y.toFixed(1) +
        " Q " + midX.toFixed(1) + " " + midY.toFixed(1) +
        " " + endX.toFixed(1) + " " + endY.toFixed(1) +
        '" stroke="' + (depth > 2 ? "var(--stem-deep)" : "var(--stem)") +
        '" stroke-width="' + width.toFixed(1) +
        '" fill="none" stroke-linecap="round"/>';

      if (depth <= 0 || len < 13) {
        if (flowering && rng() < 0.4) {
          flowers += flowerMarkup(endX, endY, rng);
        } else {
          leafCount++;
          const size = (11 + rng() * 8) * CLIMATE.sizeMul;
          const fill = rng() < 0.5 ? CLIMATE.palette[0] : CLIMATE.palette[1];
          leaves +=
            '<path d="' + leafPath(endX, endY, angle + (rng() - 0.5) * 0.6, size, leafShape) +
            '" fill="' + fill + '" opacity="0.92"/>';
        }
        return;
      }

      const children = rng() < 0.25 ? 3 : 2;
      for (let i = 0; i < children; i++) {
        const offset = split * (i - (children - 1) / 2);
        const jitter = (rng() - 0.5) * 0.35;
        branch(
          endX, endY,
          angle + offset + jitter + droop * offset,
          len * (0.64 + rng() * 0.16),
          Math.max(1, width * 0.62),
          depth - 1
        );
      }

      if (rng() < 0.3) {
        leafCount++;
        const size = (9 + rng() * 6) * CLIMATE.sizeMul;
        leaves +=
          '<path d="' + leafPath(endX, endY, angle + (rng() < 0.5 ? 1.5 : -1.5), size, leafShape) +
          '" fill="' + CLIMATE.palette[1] + '" opacity="0.85"/>';
      }
    }

    const baseX = 210, baseY = 468;
    branch(baseX, baseY, -Math.PI / 2 + lean, 66 + rng() * 26, 5, maxDepth);

    const pot = potMarkup(rng, graftMeta);

    const svg =
      '<svg viewBox="-15 0 450 500" xmlns="http://www.w3.org/2000/svg" role="img" ' +
      'aria-label="Generated potted specimen">' +
      '<g class="sway">' + stems + leaves + flowers + "</g>" + pot + "</svg>";

    return {
      svg: svg,
      name: name,
      traits:
        branchCount + " branches · leaves " + leafShape +
        (flowering ? " · flowering" : "") + " · " + leafCount + " leaves",
      /* Raw facts behind the traits string above, exposed so a caller
         can reason about the plant (greenhouse-page.js's noteText())
         without re-parsing prose back into data. No new rng() draw:
         every one of these was already a local variable this function
         computed on the way to building traits. */
      leafShape: leafShape,
      flowering: flowering,
      branchCount: branchCount
    };
  }

  function grow(word) {
    const label = normalize(word);
    if (!label) return null;

    const seed = hashSeed("freebot:greenhouse:" + label);
    const result = growWithRng(mulberry32(seed));
    result.word = label;
    result.seedHex = "0x" + seed.toString(16).padStart(8, "0");
    return result;
  }

  /* Two words in, one plant out. See the file header: the rootstock's
     stream carries 60% of every draw, the scion's 40% — enough that the
     order you type them in changes the plant, the way it would change
     a real graft. ROOTSTOCK_WEIGHT itself is declared once, above, so
     the pot's own graft seam splits at the exact same ratio. */
  function graft(rootstockWord, scionWord) {
    const rootstock = normalize(rootstockWord);
    const scion = normalize(scionWord);
    if (!rootstock || !scion) return null;

    const seedA = hashSeed("freebot:greenhouse:" + rootstock);
    const seedB = hashSeed("freebot:greenhouse:" + scion);
    const rngA = mulberry32(seedA);
    const rngB = mulberry32(seedB);
    const rng = function () {
      return rngA() * ROOTSTOCK_WEIGHT + rngB() * (1 - ROOTSTOCK_WEIGHT);
    };

    const result = growWithRng(rng, { rootstock: rootstock, scion: scion });
    result.word = rootstock + " × " + scion;
    result.rootstock = rootstock;
    result.scion = scion;
    result.seedHex = "0x" + (seedA ^ seedB).toString(16).padStart(8, "0");
    return result;
  }

  window.freebotGreenhouse = {
    grow: grow,
    graft: graft,
    normalize: normalize,
    /* Exposed so the page can print the exact ratio the pot's own seam
       already draws, rather than a hand-typed "60/40" that could drift
       out of sync with ROOTSTOCK_WEIGHT above. */
    rootstockWeight: ROOTSTOCK_WEIGHT
  };
})();
