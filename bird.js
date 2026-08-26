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
   builds a leaf: fixed shapes, positioned and colored by rng().

   Since 2026-08-26 (dates from 2026-08-27 on — today already had
   visitors before this code existed, same reasoning as any other
   cutoff on this site) two present-days no longer always read as the
   same bird recolored: a second pose, gated the way plant.js gates a
   new era — the extra rng() call for it only ever fires past the
   cutoff, so every date already grown keeps calling exactly the six
   draws it always has and comes out byte-identical. And the cluck
   itself now has a voice: a small per-date pitch shift, drawn from its
   own separate stream (never plant.js's, this file's growth stream, or
   any other room's) so a click reacting to a date doesn't touch what
   that date grows — the same "own stream, own business" discipline
   sound.js's rain patter already keeps. Both were the two smallest
   items left open on this plot since the day the bird was built. */

(function () {
  "use strict";

  const BIRD_START = "2026-08-09";
  const BIRD_V2 = "2026-08-27"; /* pose + voice cutoff, see header comment */

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
     ways. From BIRD_V2 on, about two birds in five sit preening
     instead of perched forward — the seventh rng() draw, reachable
     only past the cutoff, so it never touches a date that already
     grew its six. */
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
    const preening = dateStr >= BIRD_V2 && rng() < 0.4;

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
      '<path class="wing" d="M ' + wx.toFixed(1) + " " + (py - 4).toFixed(1) +
      " Q " + (wx - dir * 9).toFixed(1) + " " + (py + 1).toFixed(1) +
      " " + (wx - dir * 2).toFixed(1) + " " + (py + 8).toFixed(1) +
      " Q " + (wx + dir * 2).toFixed(1) + " " + (py + 2).toFixed(1) +
      " " + wx.toFixed(1) + " " + (py - 4).toFixed(1) +
      ' Z" fill="' + wingFill + '" opacity="0.92"/>';

    /* Head, beak, eye — perched forward by default. Preening tucks the
       head down and back toward the folded wing instead: a different
       silhouette from the same six body draws above, not a second set
       of colors on the same shape. */
    let hx, hy;
    if (preening) {
      hx = px - dir * 3;
      hy = py - 1;
    } else {
      hx = px + dir * 10;
      hy = py - 7;
    }
    svg += '<circle cx="' + hx.toFixed(1) + '" cy="' + hy.toFixed(1) + '" r="5.6" fill="' + bodyFill + '"/>';
    if (preening) {
      svg +=
        '<path d="M ' + (hx - dir * 1).toFixed(1) + " " + (hy + 4).toFixed(1) +
        " L " + (hx - dir * 0.5).toFixed(1) + " " + (hy + 9).toFixed(1) +
        " L " + (hx + dir * 3.5).toFixed(1) + " " + (hy + 5).toFixed(1) +
        ' Z" fill="var(--bird-beak)"/>';
      svg += '<circle cx="' + (hx - dir * 2).toFixed(1) + '" cy="' + (hy - 1.2).toFixed(1) + '" r="1" fill="var(--bird-eye)"/>';
    } else {
      svg +=
        '<path d="M ' + (hx + dir * 5).toFixed(1) + " " + (hy - 0.5).toFixed(1) +
        " L " + (hx + dir * 9.5).toFixed(1) + " " + hy.toFixed(1) +
        " L " + (hx + dir * 5).toFixed(1) + " " + (hy + 2).toFixed(1) +
        ' Z" fill="var(--bird-beak)"/>';
      svg += '<circle cx="' + (hx + dir * 2).toFixed(1) + '" cy="' + (hy - 1.4).toFixed(1) + '" r="1" fill="var(--bird-eye)"/>';
    }

    return { present: true, svg: svg, headX: hx, headY: hy, preening: preening };
  }

  /* A cluck, synthesized. A visitor asked for one in the guestbook
     (2026-08-11) as "an easter egg somewhere" — this is the somewhere:
     the bird itself, on the roughly one day in three it shows up at
     all, so finding it stays a small discovery rather than a button
     on every page. Two short pitch-dropping blips through a lowpass
     filter, not a sample — hand-written like everything else here, no
     recording, no dependency. Purely a reaction to a click; it draws
     no rng() from the growth stream and touches no date's own SVG, so
     there is nothing here for the eras promise to protect on that
     front. `pitch` scales every frequency by a fixed ratio — 1 for
     every date before BIRD_V2, so an already-heard cluck sounds
     identical on a second click; from BIRD_V2 on, a small per-date
     ratio from the bird's own voice stream, so two different birds no
     longer sound alike either. */
  function cluck(ctx, pitch) {
    const t0 = ctx.currentTime + 0.01;
    const p = pitch || 1;
    [0, 0.15].forEach(function (offset, i) {
      const t = t0 + offset;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1600 * p, t);
      filter.frequency.exponentialRampToValueAtTime(500 * p, t + 0.1);
      osc.frequency.setValueAtTime((i === 0 ? 620 : 520) * p, t);
      osc.frequency.exponentialRampToValueAtTime(180 * p, t + 0.1);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.25, t + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
      osc.connect(filter).connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.15);
    });
  }

  /* A small "bawk!" that floats up from the bird's head and fades,
     so the click has something to see as well as hear. Built as a
     real SVG text node, same textContent-only safety plant.js and
     greenhouse.js use — nothing here is ever markup from outside. */
  function spawnBawk(svgEl, x, y) {
    const ns = "http://www.w3.org/2000/svg";
    const t = document.createElementNS(ns, "text");
    t.setAttribute("x", x.toFixed(1));
    t.setAttribute("y", (y - 10).toFixed(1));
    t.setAttribute("class", "bawk");
    t.setAttribute("text-anchor", "middle");
    t.textContent = "bawk!";
    svgEl.appendChild(t);
    setTimeout(function () { t.remove(); }, 900);
  }

  /* Attach the bird to an already-mounted specimen figure. Call this
     after freebotGarden.mount and freebotGround.attach, passing along
     the weather field that mount() returned. Outside the swaying
     group, like the ground layer, so it does not sway with the
     branches — a perched bird rides the twig, not the whole plant.
     Markup is built only from fixed shapes and numbers, the same
     safety pattern plant.js and organism.js use.

     On a windy day the wing gets a "windy" class instead of any new
     drawing: style.css ruffles it with the same --wind custom
     property plant.js already set on the figure for the sway
     animation, so the bird reacts to the same gust the branches do,
     read once from the already-decided weather field — never from a
     second rng() call here. */
  let cluckCtx = null; /* lazily created on the first click, like sound.js */

  function attach(fig, dateStr, weather) {
    const svgEl = fig.querySelector("svg");
    if (!svgEl) return null;
    const b = grow(dateStr);
    if (b.present) {
      const cls = "bird" + (weather && weather.type === "windy" ? " windy" : "");
      const label = "A bird." + (b.preening ? " Preening." : "");
      svgEl.insertAdjacentHTML(
        "beforeend",
        '<g class="' + cls + '" role="button" tabindex="0" aria-label="' + label + '">' + b.svg + "</g>"
      );
      const g = svgEl.lastElementChild;
      /* A voice, own stream — "freebot:bird:voice:" + date, never the
         growth stream above. 1 before BIRD_V2 so an already-heard
         cluck can't change pitch on a later click. */
      const pitch = dateStr >= BIRD_V2
        ? 0.82 + mulberry32(hashSeed("freebot:bird:voice:" + dateStr))() * 0.36
        : 1;
      const react = function () {
        if (!cluckCtx) cluckCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (cluckCtx.state === "suspended") cluckCtx.resume();
        cluck(cluckCtx, pitch);
        spawnBawk(svgEl, b.headX, b.headY);
      };
      g.addEventListener("click", react);
      g.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); react(); }
      });
    }
    return b;
  }

  window.freebotBird = { grow: grow, attach: attach, START: BIRD_START };
})();
