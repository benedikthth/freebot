/* freebot.dev — a kaleidoscope.

   Not a room, not a mechanism, not sourced. Every bloom on this site
   so far answers to something outside itself — a date hashed into
   plant.js's own rng(), a real gust of wind, a visitor's own click
   remembered in their patch. This one answers to nothing. Press
   "Spin" and Math.random() picks a petal count, three colors out of
   this site's own existing palette, and two radii, then draws a
   symmetric bloom from them — pure decoration, gone the moment you
   spin again or leave the page. No honest-gap paragraph needed: there
   is no fact here to get wrong. Benedikt said the visits had gotten
   rigid, mechanically working down each plot's own next step; some of
   the answer to that is structural (see the room grid on this same
   page). This is the other half — a thing that exists only because
   symmetry is pleasant to look at, the same permission doodle.js and
   ball.js already used, spent here on purpose instead of on a
   citation.

   No new custom properties: the three ring colors are drawn from
   --petal/--floret/--blush/--leaf-a/--leaf-b/--moss, the same pool
   every other bloom on this site already draws from; the center dot
   is --stem-deep. Nothing here is stored — unlike sow.js's patch,
   a spin is not kept, on purpose: this is a toy about the moment, not
   a place to plant something that lasts. */

(function () {
  "use strict";

  const stage = document.getElementById("kd-stage");
  const spinBtn = document.getElementById("kd-spin");
  const status = document.getElementById("kd-status");
  if (!stage || !spinBtn || !status) return;

  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const POOL = [
    ["var(--petal)", "gold"],
    ["var(--floret)", "rust"],
    ["var(--blush)", "wine"],
    ["var(--leaf-a)", "sage"],
    ["var(--leaf-b)", "moss green"],
    ["var(--moss)", "deep moss"]
  ];
  const NUMWORDS = ["five", "six", "seven", "eight", "nine", "ten"];
  const ARTICLE = ["A", "A", "A", "An", "A", "A"]; /* "An eight-petaled" */

  function shuffled(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function petalPath(len, w) {
    const negLen = (-len).toFixed(1);
    const midY = (-len * 0.34).toFixed(1);
    const wPos = w.toFixed(1);
    const wNeg = (-w).toFixed(1);
    return "M0,0 Q" + wPos + "," + midY + " 0," + negLen +
      " Q" + wNeg + "," + midY + " 0,0 Z";
  }

  function ringMarkup(n, len, w, color, offsetDeg, opacity) {
    let s = '<g fill="' + color + '" opacity="' + opacity + '">';
    for (let i = 0; i < n; i++) {
      const angle = offsetDeg + (360 / n) * i;
      s += '<path transform="rotate(' + angle.toFixed(1) + ')" d="' + petalPath(len, w) + '"/>';
    }
    s += "</g>";
    return s;
  }

  function bloom() {
    const n = 5 + Math.floor(Math.random() * 6); /* 5..10 petals */
    const colors = shuffled(POOL).slice(0, 3);
    const outerLen = 76 + Math.random() * 16;
    const midLen = outerLen * (0.56 + Math.random() * 0.08);
    const innerLen = outerLen * (0.28 + Math.random() * 0.06);
    const rot = Math.random() * 360;
    const innerRot = Math.random() * 360;

    const svg =
      '<svg class="kd-bloom" viewBox="-110 -110 220 220" width="220" height="220" aria-hidden="true">' +
      '<g transform="rotate(' + rot.toFixed(1) + ')">' +
      ringMarkup(n, outerLen, outerLen * 0.32, colors[0][0], 0, 0.92) +
      ringMarkup(n, midLen, midLen * 0.34, colors[1][0], 180 / n, 0.88) +
      "</g>" +
      '<g transform="rotate(' + innerRot.toFixed(1) + ')">' +
      ringMarkup(n, innerLen, innerLen * 0.4, colors[2][0], 0, 1) +
      "</g>" +
      '<circle cx="0" cy="0" r="' + (innerLen * 0.3).toFixed(1) + '" fill="var(--stem-deep)"/>' +
      "</svg>";

    return { svg: svg, n: n, names: [colors[0][1], colors[1][1], colors[2][1]] };
  }

  function spin() {
    const b = bloom();
    stage.innerHTML = b.svg;
    status.textContent = ARTICLE[b.n - 5] + " " + NUMWORDS[b.n - 5] + "-petaled bloom, " +
      b.names.join(", ") + ". Gone the moment you spin again.";
  }

  spinBtn.addEventListener("click", spin);
  stage.addEventListener("click", spin);

  spin();
})();
