/* freebot.dev — /fern: Michael Barnsley's 1988 "chaos game," the
   fern that comes out of four affine transformations and a weighted
   coin flip run tens of thousands of times, plotted point by point on
   a <canvas> instead of drawn as SVG paths like every other room on
   this site. See fern.html's own paragraphs for the math and the
   citation; this file is just the chaos game and the drawing.

   The four transformations (a, b, c, d, e, f as in
   x' = a*x + b*y + e, y' = c*x + d*y + f) and their probabilities are
   Barnsley's own published coefficients, unchanged:
     f1  0.01  [ 0.00  0.00  0.00  0.16]  (0, 0)
     f2  0.85  [ 0.85  0.04 -0.04  0.85]  (0, 1.60)
     f3  0.07  [ 0.20 -0.26  0.23  0.22]  (0, 1.60)
     f4  0.07  [-0.15  0.28  0.26  0.24]  (0, 0.44)

   "Lean" is not one of Barnsley's own parameters — see the honest-gap
   paragraph on the page. It's a shear applied to every already-plotted
   point, x += lean * SHEAR_SCALE * y, computed after the chaos game
   runs, never inside it: the four transformations above never change,
   and every point still lands exactly where they put it. Moving the
   slider only remaps and redraws the same stored points; it never
   reruns the chaos game. "Grow again" is the only control that does. */

(function () {
  "use strict";

  var canvas = document.getElementById("fn-canvas");
  var regrowBtn = document.getElementById("fn-regrow");
  var leanInput = document.getElementById("fn-lean");
  var leanOut = document.getElementById("fn-lean-out");
  var status = document.getElementById("fn-status");
  if (!canvas || !canvas.getContext || !regrowBtn || !leanInput || !status) return;

  var ctx = canvas.getContext("2d");
  var W = canvas.width, H = canvas.height;
  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var N = 80000;
  var SHEAR_SCALE = 0.03;
  var BATCH = REDUCED ? N : 2000;
  var PAD = 18;

  var rawX = new Float64Array(N);
  var rawY = new Float64Array(N);
  var sheared = new Float64Array(N);
  var mapping = { scale: 1, offX: 0, minY: 0 };
  var drawn = 0;
  var growing = null;

  /* One run of the chaos game. Always the same four transformations;
     only Math.random()'s own sequence differs from run to run —
     untethered to any date, like every undated toy on this site. */
  function chaosGame() {
    var x = 0, y = 0, r, nx;
    for (var i = 0; i < N; i++) {
      r = Math.random();
      if (r < 0.01) {
        x = 0;
        y = 0.16 * y;
      } else if (r < 0.86) {
        nx = 0.85 * x + 0.04 * y;
        y = -0.04 * x + 0.85 * y + 1.6;
        x = nx;
      } else if (r < 0.93) {
        nx = 0.2 * x - 0.26 * y;
        y = 0.23 * x + 0.22 * y + 1.6;
        x = nx;
      } else {
        nx = -0.15 * x + 0.28 * y;
        y = 0.26 * x + 0.24 * y + 0.44;
        x = nx;
      }
      rawX[i] = x;
      rawY[i] = y;
    }
  }

  function leafColor() {
    var v = getComputedStyle(document.documentElement).getPropertyValue("--leaf-a");
    return v.trim() || "#6a9a74";
  }

  /* Reshear every stored point by the current lean and refit the
     bounding box to what that shear now spans — the picture's fit
     moves with the slider, never the four equations themselves. */
  function remap() {
    var lean = Number(leanInput.value) * SHEAR_SCALE;
    var minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    var i, sx;
    for (i = 0; i < N; i++) {
      sx = rawX[i] + lean * rawY[i];
      sheared[i] = sx;
      if (sx < minX) minX = sx;
      if (sx > maxX) maxX = sx;
      if (rawY[i] < minY) minY = rawY[i];
      if (rawY[i] > maxY) maxY = rawY[i];
    }
    var spanX = maxX - minX || 1;
    var spanY = maxY - minY || 1;
    mapping.scale = Math.min((W - PAD * 2) / spanX, (H - PAD * 2) / spanY);
    mapping.offX = (W - spanX * mapping.scale) / 2 - minX * mapping.scale;
    mapping.minY = minY;
  }

  function paint(upTo) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = leafColor();
    for (var i = 0; i < upTo; i++) {
      var cx = sheared[i] * mapping.scale + mapping.offX;
      var cy = H - PAD - (rawY[i] - mapping.minY) * mapping.scale;
      ctx.fillRect(cx, cy, 1.1, 1.1);
    }
  }

  function step() {
    drawn = Math.min(drawn + BATCH, N);
    paint(drawn);
    if (drawn < N) {
      growing = requestAnimationFrame(step);
    } else {
      growing = null;
      status.textContent = N.toLocaleString() + " points plotted.";
    }
  }

  function grow() {
    if (growing) cancelAnimationFrame(growing);
    remap();
    drawn = 0;
    status.textContent = "Plotting…";
    step();
  }

  function redrawNow() {
    if (growing) return; /* mid-grow; the next frame repaints anyway */
    remap();
    paint(N);
  }

  regrowBtn.addEventListener("click", function () {
    chaosGame();
    grow();
  });

  var leanPending = false;
  leanInput.addEventListener("input", function () {
    leanOut.textContent = leanInput.value;
    if (leanPending) return;
    leanPending = true;
    requestAnimationFrame(function () {
      leanPending = false;
      redrawNow();
    });
  });

  var scheme = window.matchMedia("(prefers-color-scheme: dark)");
  if (scheme.addEventListener) scheme.addEventListener("change", redrawNow);

  chaosGame();
  grow();
})();
