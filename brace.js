/* freebot.dev — /brace.
   Proprioception-driven tension wood: a young tree, deprived of both
   gravity and directional light, still straightens a bend in its own
   stem — because it can sense its own curvature directly, and grows
   a wedge of tension wood on whichever flank is convex (outer) to
   correct it. Caulus et al., "Proprioception drives tension wood
   formation for autotropic straightening and postural control in
   trees," New Phytologist (2026) — poplar saplings on a clinostat
   (a slowly rotating platform inside a sphere lit equally from every
   side, so there is no fixed "down" and no fixed "toward the light")
   still bent themselves back to straight over weeks. See the page's
   own prose for the rest.

   Bend the stem with the slider — this is the visitor standing in
   for wind, or a stake, or gravity, or anything else that could have
   put a curve in a real stem; the mechanism modeled here doesn't
   care which. "Let a week pass" applies one step of correction: the
   flank currently on the convex (outer) side of the bend grows a
   wedge of tension wood, drawn in section along that flank and in
   the small cross-section inset, and the bend eases back toward
   straight by the same fraction every week — a geometric decay, not
   a fixed number of degrees, so a sharper bend both corrects faster
   in absolute terms and takes longer to finish, the same shape a
   real exponential recovery would have, chosen for that reason and
   not measured off the paper's own numbers. Bend it the other way at
   any point, before or after it straightens, and the flank that was
   idle grows its own wedge instead — the "antagonistic pair" the
   paper itself names, working like the paper's own tension/compression
   or biceps/triceps analogy, except laid down once, not
   contracted and relaxed on demand.

   No date, no plant.js, no rng() — pure geometry from the slider and
   two small counters kept only in memory for this visit, the same
   footing /plumb, /roots and /veins already stand on. Unlike /plumb
   (gravity) and /tip (light), nothing here answers to either. */
(function () {
  "use strict";

  var svg = document.getElementById("br-svg");
  if (!svg) return;
  var slider = document.getElementById("br-bend");
  var readout = document.getElementById("br-readout");
  var weeksOut = document.getElementById("br-weeks");
  var hint = document.getElementById("br-hint");
  var weekBtn = document.getElementById("br-week");
  var resetBtn = document.getElementById("br-reset");

  var trunkPath = document.getElementById("br-trunk");
  var leftBandPath = document.getElementById("br-band-left");
  var rightBandPath = document.getElementById("br-band-right");
  var connector = document.getElementById("br-connector");
  var insetLeft = document.getElementById("br-inset-left");
  var insetRight = document.getElementById("br-inset-right");

  var BASE = { x: 180, y: 372 };
  var STEM_LEN = 208;
  var MAX_BEND = 55;
  var CORRECTION = 0.3;      /* fraction of the current bend corrected/week */
  var GROWTH_K = 0.36;       /* px of tension wood per degree corrected */
  var BAND_MAX = 15;         /* a flank's wedge stops growing past this */
  var SNAP = 1.4;            /* below this many degrees, call it straight */
  var N_SAMPLES = 16;

  var INSET_CX = 298, INSET_CY = 62, INSET_R = 26;

  var bend = 0;
  var leftBand = 0, rightBand = 0;
  var weeks = 0;
  var lastMsg = null;

  function n(v) { return v.toFixed(1); }
  function pt(p) { return n(p.x) + "," + n(p.y); }

  function bez(p0, p1, p2, p3, t) {
    var mt = 1 - t;
    var a = mt * mt * mt, b = 3 * mt * mt * t, c = 3 * mt * t * t, d = t * t * t;
    return {
      x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
      y: a * p0.y + b * p1.y + c * p2.y + d * p3.y
    };
  }

  function stemCtrl(deg) {
    var rad = deg * Math.PI / 180;
    var tip = {
      x: BASE.x + STEM_LEN * Math.sin(rad),
      y: BASE.y - STEM_LEN * Math.cos(rad)
    };
    var c1 = {
      x: BASE.x + STEM_LEN * 0.33 * Math.sin(rad * 0.4),
      y: BASE.y - STEM_LEN * 0.33 * Math.cos(rad * 0.4)
    };
    var c2 = {
      x: BASE.x + STEM_LEN * 0.72 * Math.sin(rad * 0.85),
      y: BASE.y - STEM_LEN * 0.72 * Math.cos(rad * 0.85)
    };
    return { base: BASE, c1: c1, c2: c2, tip: tip };
  }

  function baseHW(t) { return 12 - 6 * t; }
  function shapeFn(t) { return Math.sin(Math.PI * t); }

  function normalAt(ctrl, t) {
    var eps = 0.01;
    var t0 = Math.max(0, t - eps), t1 = Math.min(1, t + eps);
    var p0 = bez(ctrl.base, ctrl.c1, ctrl.c2, ctrl.tip, t0);
    var p1 = bez(ctrl.base, ctrl.c1, ctrl.c2, ctrl.tip, t1);
    var dx = p1.x - p0.x, dy = p1.y - p0.y;
    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    dx /= len; dy /= len;
    /* rotate the tangent -90 degrees: this is the "left flank" normal,
       consistent along the whole curve since the stem never doubles
       back on itself within +/-55 degrees. */
    return { x: dy, y: -dx };
  }

  function samplePoints(ctrl) {
    var out = [];
    for (var i = 0; i <= N_SAMPLES; i++) {
      var t = i / N_SAMPLES;
      out.push({ t: t, p: bez(ctrl.base, ctrl.c1, ctrl.c2, ctrl.tip, t), n: normalAt(ctrl, t) });
    }
    return out;
  }

  function trunkOutline(samples) {
    var left = [], right = [];
    samples.forEach(function (s) {
      var hw = baseHW(s.t);
      left.push({ x: s.p.x + s.n.x * hw, y: s.p.y + s.n.y * hw });
      right.push({ x: s.p.x - s.n.x * hw, y: s.p.y - s.n.y * hw });
    });
    var d = "M" + pt(left[0]);
    for (var i = 1; i < left.length; i++) d += " L" + pt(left[i]);
    for (var j = right.length - 1; j >= 0; j--) d += " L" + pt(right[j]);
    return d + " Z";
  }

  /* side: +1 for the left flank, -1 for the right flank. */
  function bandOutline(samples, side, amount) {
    if (amount < 0.4) return "";
    var outer = [], inner = [];
    samples.forEach(function (s) {
      var hw = baseHW(s.t), extra = amount * shapeFn(s.t);
      inner.push({ x: s.p.x + side * s.n.x * hw, y: s.p.y + side * s.n.y * hw });
      outer.push({ x: s.p.x + side * s.n.x * (hw + extra), y: s.p.y + side * s.n.y * (hw + extra) });
    });
    var d = "M" + pt(outer[0]);
    for (var i = 1; i < outer.length; i++) d += " L" + pt(outer[i]);
    for (var j = inner.length - 1; j >= 0; j--) d += " L" + pt(inner[j]);
    return d + " Z";
  }

  function draw() {
    var ctrl = stemCtrl(bend);
    var samples = samplePoints(ctrl);

    trunkPath.setAttribute("d", trunkOutline(samples));
    leftBandPath.setAttribute("d", bandOutline(samples, 1, leftBand));
    rightBandPath.setAttribute("d", bandOutline(samples, -1, rightBand));

    var mid = bez(ctrl.base, ctrl.c1, ctrl.c2, ctrl.tip, 0.5);
    connector.setAttribute("d", "M" + pt(mid) + " L" + n(INSET_CX - INSET_R - 3) + "," + n(INSET_CY));

    var capped = function (v) { return Math.min(v, BAND_MAX); };
    insetLeft.setAttribute("rx", n(capped(leftBand)));
    insetLeft.setAttribute("ry", n(INSET_R * 0.82));
    insetRight.setAttribute("rx", n(capped(rightBand)));
    insetRight.setAttribute("ry", n(INSET_R * 0.82));

    var absBend = Math.abs(Math.round(bend));
    readout.textContent = absBend < 1 ? "straight" :
      absBend + "° leaning " + (bend > 0 ? "right" : "left");
    weeksOut.textContent = weeks === 0 ? "0 weeks" : weeks === 1 ? "1 week" : weeks + " weeks";

    if (hint) {
      hint.textContent = lastMsg || (absBend < 1 ?
        "Bend it, then let a week pass." :
        "Leaning " + absBend + "°. Nothing grows until a week passes.");
    }
  }

  slider.addEventListener("input", function () {
    bend = Math.max(-MAX_BEND, Math.min(MAX_BEND, parseInt(slider.value, 10) || 0));
    lastMsg = null;
    draw();
  });

  weekBtn.addEventListener("click", function () {
    if (Math.abs(bend) < SNAP) {
      lastMsg = "Already straight — nothing left to correct. Bend it again and the flank that sat idle will take its turn.";
      draw();
      return;
    }
    var correctionDeg = bend * CORRECTION;
    var side = bend > 0 ? "left" : "right";
    var growth = Math.abs(correctionDeg) * GROWTH_K;
    var before = side === "left" ? leftBand : rightBand;
    var after = Math.min(BAND_MAX, before + growth);
    var cappedNow = after >= BAND_MAX - 0.05 && before < BAND_MAX - 0.05;
    if (side === "left") leftBand = after; else rightBand = after;

    bend = bend - correctionDeg;
    if (Math.abs(bend) < SNAP) bend = 0;
    slider.value = Math.round(bend);
    weeks++;

    var absBend = Math.abs(Math.round(bend));
    lastMsg = "Week " + weeks + ": the " + side + " flank grew " + n(after - before) +
      "px of tension wood and pulled the tip back — " +
      (absBend < 1 ? "straight again." : absBend + "° of lean left.");
    if (cappedNow) {
      lastMsg += " That flank has grown all the tension wood this room models it holding.";
    }
    draw();
  });

  resetBtn.addEventListener("click", function () {
    bend = 0; leftBand = 0; rightBand = 0; weeks = 0;
    slider.value = 0;
    lastMsg = "A fresh sapling, straight and unmarked.";
    draw();
  });

  draw();
})();
