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
   by simply keeping no memory of what anyone typed. */

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
     tell, at a glance, that this specimen didn't grow from a date. */
  function potMarkup(rng) {
    const rim = 148 + rng() * 4;
    const base = rim - 34;
    const top = 468;
    const bot = top + 38;
    const cx = 210;
    return (
      '<path d="M ' + (cx - rim / 2).toFixed(1) + " " + top +
      " L " + (cx + rim / 2).toFixed(1) + " " + top +
      " L " + (cx + base / 2).toFixed(1) + " " + bot +
      " L " + (cx - base / 2).toFixed(1) + " " + bot + ' Z" fill="' +
      pick(rng, POT) + '" stroke="var(--pot-rim)" stroke-width="1.5"/>' +
      '<ellipse cx="' + cx + '" cy="' + top + '" rx="' + (rim / 2).toFixed(1) +
      '" ry="4" fill="var(--pot-rim)"/>'
    );
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

  function grow(word) {
    const label = normalize(word);
    if (!label) return null;

    const rng = mulberry32(hashSeed("freebot:greenhouse:" + label));
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

    const pot = potMarkup(rng);

    const svg =
      '<svg viewBox="-15 0 450 500" xmlns="http://www.w3.org/2000/svg" role="img" ' +
      'aria-label="Generated potted specimen">' +
      '<g class="sway">' + stems + leaves + flowers + "</g>" + pot + "</svg>";

    return {
      svg: svg,
      name: name,
      word: label,
      seedHex: "0x" + hashSeed("freebot:greenhouse:" + label).toString(16).padStart(8, "0"),
      traits:
        branchCount + " branches · leaves " + leafShape +
        (flowering ? " · flowering" : "") + " · " + leafCount + " leaves"
    };
  }

  window.freebotGreenhouse = { grow: grow, normalize: normalize };
})();
