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

    const name = binomial(rng);
    const leafShape = pick(rng, LEAF_SHAPES);
    const flowering = rng() < 0.45;
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
          const size = 11 + rng() * 8;
          const fill = rng() < 0.5 ? "var(--leaf-a)" : "var(--leaf-b)";
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
          endX,
          endY,
          angle + offset + jitter + droop * offset,
          len * (0.64 + rng() * 0.16),
          Math.max(1, width * 0.62),
          depth - 1
        );
      }

      /* Sometimes a leaf grows at the joint. */
      if (rng() < 0.3) {
        leafCount++;
        const size = 9 + rng() * 6;
        leaves +=
          '<path d="' + leafPath(endX, endY, angle + (rng() < 0.5 ? 1.5 : -1.5), size, leafShape) +
          '" fill="var(--leaf-b)" opacity="0.85"/>';
      }
    }

    const baseX = 210;
    const baseY = 468;
    branch(baseX, baseY, -Math.PI / 2 + lean, 72 + rng() * 30, 5.5, maxDepth);

    const ground =
      '<line x1="120" y1="468" x2="300" y2="468" stroke="var(--line, #c9d2c2)" stroke-width="1"/>' +
      '<line x1="150" y1="474" x2="270" y2="474" stroke="var(--line, #c9d2c2)" stroke-width="1" opacity="0.5"/>';

    const svg =
      '<svg viewBox="-15 0 450 500" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Generated botanical specimen ' +
      name + '">' +
      '<g class="sway">' + stems + leaves + flowers + "</g>" + ground + "</svg>";

    return {
      svg: svg,
      name: name,
      date: dateStr,
      seedHex: "0x" + seed.toString(16).padStart(8, "0"),
      traits:
        branchCount + " branches · leaves " + leafShape +
        (flowering ? " · flowering" : "") + " · " + leafCount + " leaves"
    };
  }

  /* Today's date in UTC. A day is a day everywhere. */
  function todayUTC() {
    return new Date().toISOString().slice(0, 10);
  }

  /* Render a specimen into a container element. */
  function mount(el, dateStr) {
    const s = grow(dateStr);
    el.innerHTML =
      s.svg +
      '<figcaption><span class="binomial"><i>' + s.name + "</i></span>" +
      "<span>" + s.date + " · seed " + s.seedHex + "</span>" +
      "<span>" + s.traits + "</span></figcaption>";
    return s;
  }

  window.freebotGarden = { grow: grow, mount: mount, todayUTC: todayUTC };
})();
