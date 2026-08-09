/* freebot.dev — a bird, some days, perched in the canopy.
   The third form the ground-organism seed named. Deterministic and
   date-seeded, same discipline as the plant and the ground — but its
   own organism, on its own random stream. It never calls plant.js's
   or organism.js's rng(), so it cannot touch either of their draws;
   see the CAUTION comment in plant.js about that stream.

   Gated like an era, for the same reason plant.js has eras and
   organism.js has GROUND_START: a specimen that already grew must
   never get a retroactive repaint. Dates before BIRD_START render
   nothing here — see "The garden has eras".

   Unlike moss and lichen, this is not a blob-and-speckle scatter: a
   bird needs a silhouette, so it gets its own drawing logic — a body,
   a head, a beak, a tail, a perch twig — built the same way plant.js
   builds a leaf: fixed shapes, positioned and colored by rng(). */

(function () {
  "use strict";

  const BIRD_START = "2026-08-09";

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

  /* Grow the bird for a date. A little over a third of days it is
     present at all — rarer than moss or lichen, since a bird is an
     event, not a ground cover. When present it perches somewhere in
     the canopy's rough airspace (plant.js keeps no branch coordinates
     this file can read, so "somewhere plausible" is the contract, not
     "on this exact twig"), facing left or right, in one of two color
     ways. */
  function grow(dateStr) {
    if (dateStr < BIRD_START) {
      return { present: false, svg: "" };
    }
    const rng = mulberry32(hashSeed("freebot:bird:" + dateStr));
    if (rng() > 0.36) {
      return { present: false, svg: "" };
    }

    const dir = rng() < 0.5 ? 1 : -1; /* which way it faces */
    const px = 165 + rng() * 90;
    const py = 155 + rng() * 110;
    const warm = rng() < 0.5; /* two color ways, not two species */
    const bodyFill = warm ? "var(--bird-body-a)" : "var(--bird-body-b)";
    const wingFill = warm ? "var(--bird-wing-a)" : "var(--bird-wing-b)";
    const breastFill = warm ? "var(--bird-breast-a)" : "var(--bird-breast-b)";
    const tailUp = rng() < 0.5;
    const twigLean = (rng() - 0.5) * 8;

    const fx = px.toFixed(1), fy = py.toFixed(1);

    /* Perch twig first, so the bird's feet sit on top of it. */
    let svg =
      '<path d="M ' + (px - 16).toFixed(1) + " " + (py + 9 + twigLean * 0.3).toFixed(1) +
      " Q " + fx + " " + (py + 9 - twigLean).toFixed(1) +
      " " + (px + 16).toFixed(1) + " " + (py + 9 + twigLean * 0.3).toFixed(1) +
      '" stroke="var(--stem-deep)" stroke-width="2" fill="none" stroke-linecap="round"/>';

    /* Two thin legs down to the twig. */
    svg +=
      '<path d="M ' + (px - 3).toFixed(1) + " " + (py + 6).toFixed(1) +
      " L " + (px - 3).toFixed(1) + " " + (py + 9.5).toFixed(1) +
      " M " + (px + 3).toFixed(1) + " " + (py + 6).toFixed(1) +
      " L " + (px + 3).toFixed(1) + " " + (py + 9.5).toFixed(1) +
      '" stroke="var(--bird-leg)" stroke-width="1.1" fill="none" stroke-linecap="round"/>';

    /* Tail — a small fan of three pointed strokes, opposite the head. */
    const tailX = px - dir * 11;
    const tailAngle = tailUp ? -0.55 : 0.15;
    for (let i = -1; i <= 1; i++) {
      const a = tailAngle + i * 0.32;
      const tx = tailX - dir * Math.cos(a) * 12;
      const ty = py + Math.sin(a) * 12;
      svg +=
        '<path d="M ' + tailX.toFixed(1) + " " + py.toFixed(1) +
        " L " + tx.toFixed(1) + " " + ty.toFixed(1) +
        '" stroke="' + wingFill + '" stroke-width="2.4" fill="none" stroke-linecap="round"/>';
    }

    /* Body — a round-bellied oval, tipped slightly toward the tail. */
    svg +=
      '<ellipse cx="' + fx + '" cy="' + fy + '" rx="10.5" ry="8.5" fill="' + bodyFill +
      '" transform="rotate(' + (dir * -12).toFixed(1) + " " + fx + " " + fy + ')"/>';

    /* Breast — a smaller lower ellipse, the warm or cool accent. */
    svg +=
      '<ellipse cx="' + (px + dir * 2).toFixed(1) + '" cy="' + (py + 3).toFixed(1) +
      '" rx="6.5" ry="5.5" fill="' + breastFill + '" opacity="0.85"/>';

    /* Wing — a folded teardrop over the body's flank. */
    const wx = px - dir * 1;
    svg +=
      '<path d="M ' + wx.toFixed(1) + " " + (py - 4).toFixed(1) +
      " Q " + (wx - dir * 9).toFixed(1) + " " + (py + 1).toFixed(1) +
      " " + (wx - dir * 2).toFixed(1) + " " + (py + 8).toFixed(1) +
      " Q " + (wx + dir * 2).toFixed(1) + " " + (py + 2).toFixed(1) +
      " " + wx.toFixed(1) + " " + (py - 4).toFixed(1) +
      ' Z" fill="' + wingFill + '" opacity="0.92"/>';

    /* Head, beak, eye. */
    const hx = px + dir * 10;
    const hy = py - 7;
    svg += '<circle cx="' + hx.toFixed(1) + '" cy="' + hy.toFixed(1) + '" r="5.6" fill="' + bodyFill + '"/>';
    svg +=
      '<path d="M ' + (hx + dir * 5).toFixed(1) + " " + (hy - 0.5).toFixed(1) +
      " L " + (hx + dir * 9.5).toFixed(1) + " " + hy.toFixed(1) +
      " L " + (hx + dir * 5).toFixed(1) + " " + (hy + 2).toFixed(1) +
      ' Z" fill="var(--bird-beak)"/>';
    svg += '<circle cx="' + (hx + dir * 2).toFixed(1) + '" cy="' + (hy - 1.4).toFixed(1) + '" r="1" fill="var(--bird-eye)"/>';

    return { present: true, svg: svg };
  }

  /* Attach the bird to an already-mounted specimen figure. Call this
     after freebotGarden.mount and freebotGround.attach. Outside the
     swaying group, like the ground layer, so it does not sway with
     the branches — a perched bird rides the twig, not the whole
     plant. Markup is built only from fixed shapes and numbers, the
     same safety pattern plant.js and organism.js use. */
  function attach(fig, dateStr) {
    const svgEl = fig.querySelector("svg");
    if (!svgEl) return null;
    const b = grow(dateStr);
    if (b.present) {
      svgEl.insertAdjacentHTML("beforeend", '<g class="bird">' + b.svg + "</g>");
    }
    return b;
  }

  window.freebotBird = { grow: grow, attach: attach, START: BIRD_START };
})();
