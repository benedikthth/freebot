// freebot.dev — /pulse
// A real electrical dichotomy, drawn as an oscilloscope. A non-damaging
// touch and a damaging wound don't produce the same signal in a plant's
// own tissue — Fromm & Lautner's 2007 review (Plant, Cell & Environment
// 30, 249-257) names the two: an action potential (AP) for touch-like
// stimuli, and a variation potential (VP) for wounding. Vodeneev,
// Akinchits & Sukhov's 2015 review (Plant Signaling & Behavior 10(9),
// e1057365) summarizes what tells them apart at a distance: an AP
// travels fast (about 10 cm/s) and arrives the same size no matter how
// far the probe sits from the trigger — the same all-or-none law an
// animal nerve obeys. A VP travels far slower (0.5-5 mm/s, this room
// uses 2 mm/s, the middle of that range, the same "pick the middle of a
// cited range" move /touch already makes) and decrements — weaker and
// more irregular in shape the farther it has to travel.
//
// AP amplitude here is a fixed, representative ~100 mV depolarization;
// Bakker, Belterman & Coronel's 2021 comparative electrophysiology
// study (Bioelectrochemistry 140, 107810) reports real measured AP
// amplitudes anywhere from about 14 to 200 mV depending on species and
// electrode method, so 100 mV is this room's own round pick inside that
// range, not a specific finding. VP's starting amplitude is drawn equal
// to AP's on purpose — the literature doesn't offer one universal VP
// magnitude to draw instead, so this room only claims the one thing
// that IS robust across it: VP decays with distance and AP does not.
// The exp(-cm/8) decay curve itself is invented for legibility, the
// same disclosed liberty /cone's animation-speed stand-in already
// takes for a different measured asymmetry.
//
// VP's real transit time is compressed 8x on screen so a browser tab's
// patience is enough (the same clock-compression /touch, /cone, and
// /pod already take with their own plants' real timing) — AP needs no
// compression, its own real numbers already fit a tab's patience.
// Both the real, uncompressed number and the on-screen one are named
// in the status line every time, never only the fast one.
//
// No date, no rng() plant.js, organism.js, or bird.js could ever
// touch — only a visitor's own choices and Math.random() for the VP
// trace's own untethered jitter, same discipline every by-hand room
// here already keeps.
(function () {
  "use strict";

  var stemSvg = document.getElementById("ps-stem-svg");
  var scopeSvg = document.getElementById("ps-scope-svg");
  var tracePath = document.getElementById("ps-trace");
  var sweepLine = document.getElementById("ps-sweep");
  var statusEl = document.getElementById("ps-status");
  var resetBtn = document.getElementById("ps-reset");
  var touchBtn = document.getElementById("ps-fire-touch");
  var woundBtn = document.getElementById("ps-fire-wound");
  var probeEls = Array.prototype.slice.call(document.querySelectorAll(".ps-probe"));
  if (!stemSvg || !scopeSvg || !tracePath) return;

  var reduced = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var AP_SPEED_CM_S = 10;    // Vodeneev, Akinchits & Sukhov (2015), citing Fromm & Lautner
  var VP_SPEED_CM_S = 0.2;   // 2 mm/s, the middle of the reviewed 0.5-5 mm/s range
  var VP_COMPRESS = 8;       // on-screen speed-up for VP only; disclosed in the page's own prose
  var DECAY_CM = 8;          // this room's own invented VP decay constant, not a measured one

  var TRACE_X0 = 12, TRACE_X1 = 348;
  var BASELINE_Y = 92, PEAK_Y = 14;
  var AP_SHAPE_MS = 650, VP_SHAPE_MS = 2600;

  var probes = probeEls.map(function (el) {
    return { el: el, cm: parseFloat(el.getAttribute("data-cm")) };
  });
  var selected = probes.length ? 1 : -1; // default: the middle probe
  var busy = false;
  var rafId = null;

  function selectProbe(i) {
    if (busy || i < 0 || i >= probes.length) return;
    selected = i;
    probes.forEach(function (p, idx) {
      p.el.classList.toggle("ps-probe-selected", idx === i);
      p.el.setAttribute("aria-pressed", idx === i ? "true" : "false");
    });
    setStatus("probe at " + probes[i].cm + "cm selected. fire touch or wound.");
  }

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text;
  }

  // Keyframes as [tFraction, yFraction] pairs; yFraction 0 = baseline, 1 = full peak.
  function apKeyframes() {
    return [[0, 0], [0.16, 1], [0.32, 1], [0.6, 0.05], [1, 0]];
  }
  function vpKeyframes() {
    var j = function (spread) { return (Math.random() * 2 - 1) * spread; };
    return [
      [0, 0],
      [0.28, 0.55 + j(0.08)],
      [0.42, 0.8 + j(0.1)],
      [0.58, 0.62 + j(0.12)],
      [0.75, 0.7 + j(0.08)],
      [1, 0]
    ];
  }

  function yAt(keyframes, t) {
    for (var i = 0; i < keyframes.length - 1; i++) {
      var a = keyframes[i], b = keyframes[i + 1];
      if (t >= a[0] && t <= b[0]) {
        var span = b[0] - a[0];
        var f = span > 0 ? (t - a[0]) / span : 0;
        return a[1] + (b[1] - a[1]) * f;
      }
    }
    return 0;
  }

  function buildPath(waitFrac, shapeKeyframes, amplitude) {
    var pts = [];
    var steps = 140;
    for (var i = 0; i <= steps; i++) {
      var frac = i / steps;
      var x = TRACE_X0 + (TRACE_X1 - TRACE_X0) * frac;
      var y;
      if (frac < waitFrac) {
        y = BASELINE_Y;
      } else {
        var localT = waitFrac < 1 ? (frac - waitFrac) / (1 - waitFrac) : 0;
        var yFrac = yAt(shapeKeyframes, Math.min(localT, 1)) * amplitude;
        y = BASELINE_Y - (BASELINE_Y - PEAK_Y) * yFrac;
      }
      pts.push(x.toFixed(1) + "," + y.toFixed(1));
    }
    return "M" + pts.join(" L");
  }

  function fire(type) {
    if (busy || selected < 0) return;
    busy = true;
    touchBtn.disabled = true;
    woundBtn.disabled = true;
    var cm = probes[selected].cm;

    var realDelayS, onScreenDelayS, shapeMs, amplitude, keyframes, kind;
    if (type === "touch") {
      kind = "Touch (AP)";
      realDelayS = cm / AP_SPEED_CM_S;
      onScreenDelayS = realDelayS;
      shapeMs = AP_SHAPE_MS;
      amplitude = 1; // non-decremental — same height at every probe
      keyframes = apKeyframes();
    } else {
      kind = "Wound (VP)";
      realDelayS = cm / VP_SPEED_CM_S;
      onScreenDelayS = realDelayS / VP_COMPRESS;
      shapeMs = VP_SHAPE_MS;
      amplitude = Math.exp(-cm / DECAY_CM);
      keyframes = vpKeyframes();
    }

    var totalMs = onScreenDelayS * 1000 + shapeMs;
    var waitFrac = (onScreenDelayS * 1000) / totalMs;

    setStatus(kind + " fired at the base. reading the " + cm + "cm probe…");

    function finish() {
      var pct = Math.round(amplitude * 100);
      var summary;
      if (type === "touch") {
        summary = kind + " reached the " + cm + "cm probe in " +
          realDelayS.toFixed(2) + "s, peaking at its full height (~100mV) " +
          "— a real action potential arrives the same size no matter the " +
          "distance.";
      } else {
        var compressedNote = onScreenDelayS < realDelayS - 0.01 ?
          " (shown here sped up ×" + VP_COMPRESS + " to " +
          onScreenDelayS.toFixed(2) + "s on screen so a tab's patience is " +
          "enough)" : "";
        summary = kind + " reached the " + cm + "cm probe after " +
          realDelayS.toFixed(1) + "s of real transit time" + compressedNote +
          ", arriving at about " + pct + "% of its strength at the wound " +
          "itself — a real variation potential fades and slows the " +
          "farther it travels.";
      }
      setStatus(summary);
      busy = false;
      touchBtn.disabled = false;
      woundBtn.disabled = false;
    }

    if (reduced) {
      tracePath.setAttribute("d", buildPath(0, keyframes, amplitude));
      sweepLine.setAttribute("x1", TRACE_X1);
      sweepLine.setAttribute("x2", TRACE_X1);
      finish();
      return;
    }

    var start = null;
    function frame(ts) {
      if (start === null) start = ts;
      var elapsed = ts - start;
      var frac = Math.min(elapsed / totalMs, 1);
      var revealX = TRACE_X0 + (TRACE_X1 - TRACE_X0) * frac;
      tracePath.setAttribute("d", buildPath(waitFrac, keyframes, amplitude));
      // clip the trace to only what's swept so far, via a moving sweep line
      // and a dasharray-free reveal: draw full path but mask with a rect.
      tracePath.setAttribute("clip-path", "url(#ps-reveal-clip)");
      var clipRect = document.getElementById("ps-reveal-rect");
      if (clipRect) clipRect.setAttribute("width", (revealX - TRACE_X0).toFixed(1));
      sweepLine.setAttribute("x1", revealX.toFixed(1));
      sweepLine.setAttribute("x2", revealX.toFixed(1));
      if (frac < 1) {
        rafId = requestAnimationFrame(frame);
      } else {
        finish();
      }
    }
    rafId = requestAnimationFrame(frame);
  }

  probes.forEach(function (p, idx) {
    p.el.addEventListener("click", function () { selectProbe(idx); });
    p.el.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectProbe(idx); }
    });
  });

  if (touchBtn) touchBtn.addEventListener("click", function () { fire("touch"); });
  if (woundBtn) woundBtn.addEventListener("click", function () { fire("wound"); });

  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
      busy = false;
      touchBtn.disabled = false;
      woundBtn.disabled = false;
      tracePath.setAttribute("d", "M" + TRACE_X0 + "," + BASELINE_Y + " L" + TRACE_X1 + "," + BASELINE_Y);
      sweepLine.setAttribute("x1", TRACE_X0);
      sweepLine.setAttribute("x2", TRACE_X0);
      var clipRect = document.getElementById("ps-reveal-rect");
      if (clipRect) clipRect.setAttribute("width", "0");
      selectProbe(probes.length ? 1 : -1);
    });
  }

  // initial state
  tracePath.setAttribute("d", "M" + TRACE_X0 + "," + BASELINE_Y + " L" + TRACE_X1 + "," + BASELINE_Y);
  selectProbe(probes.length ? 1 : -1);
})();
