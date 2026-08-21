/* freebot.dev — /whirl
   A maple samara: autorotation, not gliding. A stable spin about a
   near-vertical axis that slows descent enough for wind to carry the
   seed further than it would fall alone. Numbers are Schaeffer, Truman,
   Truscott & Dickerson, Communications Biology 7:248 (2024), n=160 across
   eight Acer species, unless flagged illustrative below.

   Real, measured:
   - baseline descent speed Vd0 = 0.83 m/s, baseline spin 18.8 rad/s
   - Vd/Vd0 = (A/A0)^-0.79 (R²=0.91), from their wing-ablation experiment
   - stable autorotation fails somewhere in A/A0 ≈ 0.6-0.8 (seed to seed);
     this room rolls that edge once per release, uniformly in that range

   Not measured, flagged in the room's own honest-gaps paragraph:
   - release height (4m), crosswind (0.6 m/s), tumble fall speed (~3.2 m/s)
   - the wing's own drawn length shortening with trim (area, not length,
     is what drives the physics)
   - drawing the spin in the picture plane rather than as a cone traced
     from above, the same liberty this site already takes elsewhere

   No date, no plant.js, no rng() this file could ever touch — only a
   visitor's own click and Math.random() for the once-per-release failure
   edge and the tumble's own wobble, the same undated register /pod and
   /roots already use. */
(function () {
  "use strict";

  var svg = document.getElementById("wh-svg");
  if (!svg) return;
  var seed = document.getElementById("wh-seed");
  var wing = document.getElementById("wh-wing");
  var vein = document.getElementById("wh-vein");
  var pedicel = document.getElementById("wh-pedicel");
  var marksGroup = document.getElementById("wh-marks");
  var readout = document.getElementById("wh-readout");
  var trimBtn = document.getElementById("wh-trim");
  var regrowBtn = document.getElementById("wh-regrow");
  var releaseBtn = document.getElementById("wh-release");
  var resetBtn = document.getElementById("wh-reset");
  if (!seed || !wing) return;

  var SVGNS = "http://www.w3.org/2000/svg";
  var reduced = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- real numbers --- */
  var VD0 = 0.83;          // m/s, baseline descent, intact wing
  var EXP = -0.79;         // Vd/Vd0 = (A/A0)^EXP
  var SPIN = 18.8;         // rad/s, baseline, while autorotation holds
  var FAIL_MIN = 0.6, FAIL_MAX = 0.8; // A/A0 range where stable spin fails

  /* --- disclosed illustrative constants, not from the cited papers --- */
  var RELEASE_H = 4;       // m, a plausible low branch
  var WIND = 0.6;          // m/s, a steady gentle crosswind
  var TUMBLE_V = 3.2;      // m/s, rough stand-in for a wingless fall

  var AREA_STEPS = [1.0, 0.9, 0.8, 0.7, 0.6, 0.5];
  var stepIdx = 0;

  var ORIGIN_X = 96, ORIGIN_Y = 40; // where the seed hangs, matches the pedicel tip
  var GROUND_Y = 256;
  var PX_PER_M = 54;
  var WING_BASE_LEN = 46; // px, at 100% area

  var falling = false;
  var releases = 0, tumbles = 0;

  function descentSpeed(areaFrac) {
    return VD0 * Math.pow(areaFrac, EXP);
  }

  function wingPath(len) {
    /* A curved blade sweeping out and down from the attachment point
       (0,0, the seed's own rotation axis) to a tapered tip — the
       classic scythe shape of a real Acer samara wing. */
    var tipX = -len * 0.18, tipY = -len;
    var c1x = -len * 0.62, c1y = -len * 0.30;
    var c2x = -len * 0.72, c2y = -len * 0.66;
    var c3x = -len * 0.30, c3y = -len * 0.94;
    return "M0,0 C" + c1x.toFixed(1) + "," + c1y.toFixed(1) + " " +
      c2x.toFixed(1) + "," + c2y.toFixed(1) + " " + tipX.toFixed(1) + "," + tipY.toFixed(1) +
      " C" + c3x.toFixed(1) + "," + c3y.toFixed(1) + " -6,-14 0,0 Z";
  }

  function drawWing() {
    var frac = AREA_STEPS[stepIdx];
    var len = WING_BASE_LEN * frac;
    wing.setAttribute("d", wingPath(len));
    vein.setAttribute("x1", "0");
    vein.setAttribute("y1", "-4");
    vein.setAttribute("x2", (-len * 0.5).toFixed(1));
    vein.setAttribute("y2", (-len * 0.86).toFixed(1));
  }

  function placeSeed(x, y, angleDeg) {
    seed.setAttribute("transform", "translate(" + x.toFixed(1) + "," + y.toFixed(1) + ") rotate(" + angleDeg.toFixed(1) + ")");
  }

  function say(msg) { if (readout) readout.textContent = msg; }

  function updateWingLabel() {
    var pct = Math.round(AREA_STEPS[stepIdx] * 100);
    trimBtn.disabled = stepIdx >= AREA_STEPS.length - 1;
    if (!falling) say("wing: " + pct + "%. hanging, ready to fall.");
  }

  function reset() {
    stepIdx = 0;
    falling = false;
    releases = 0;
    tumbles = 0;
    marksGroup.textContent = "";
    pedicel.style.opacity = "1";
    placeSeed(ORIGIN_X, ORIGIN_Y, 0);
    drawWing();
    updateWingLabel();
  }

  function trim() {
    if (falling || stepIdx >= AREA_STEPS.length - 1) return;
    stepIdx++;
    drawWing();
    updateWingLabel();
  }

  function regrow() {
    if (falling) return;
    stepIdx = 0;
    drawWing();
    updateWingLabel();
  }

  function markLanding(x, ok) {
    var m = document.createElementNS(SVGNS, "circle");
    m.setAttribute("cx", x.toFixed(1));
    m.setAttribute("cy", GROUND_Y - 2);
    m.setAttribute("r", "3");
    m.setAttribute("class", ok ? "wh-mark-ok" : "wh-mark-tumble");
    marksGroup.appendChild(m);
  }

  function release() {
    if (falling) return;
    falling = true;
    trimBtn.disabled = true;
    regrowBtn.disabled = true;
    releaseBtn.disabled = true;
    pedicel.style.opacity = "0.35";

    var areaFrac = AREA_STEPS[stepIdx];
    var pct = Math.round(areaFrac * 100);
    var edge = FAIL_MIN + Math.random() * (FAIL_MAX - FAIL_MIN);
    var stable = areaFrac >= edge;
    releases++;
    if (!stable) tumbles++;

    var v = stable ? descentSpeed(areaFrac) : TUMBLE_V;
    var tAloft = RELEASE_H / v;
    var driftM = WIND * tAloft;
    var driftPx = driftM * PX_PER_M;
    var dropPx = RELEASE_H * PX_PER_M;
    var landX = ORIGIN_X + driftPx;
    var landY = ORIGIN_Y + dropPx;

    function finish() {
      placeSeed(landX, landY, stable ? 0 : (Math.random() * 40 - 20));
      markLanding(landX, stable);
      var hz = (SPIN / (2 * Math.PI)).toFixed(1);
      var msg;
      if (stable) {
        msg = "released at " + pct + "% wing — autorotating at " +
          v.toFixed(2) + " m/s, ~" + hz + " Hz, aloft " + tAloft.toFixed(1) +
          "s, drifted " + driftM.toFixed(1) + "m.";
      } else {
        msg = "released at " + pct + "% wing — this one's own edge fell at " +
          Math.round(edge * 100) + "%: couldn't hold a stable spin. Tumbled down " +
          "at a rough ~" + v.toFixed(1) + " m/s, aloft " + tAloft.toFixed(1) +
          "s, drifted only " + driftM.toFixed(1) + "m.";
      }
      msg += " " + releases + " release" + (releases === 1 ? "" : "s") + " this visit, " +
        tumbles + " tumbled.";
      say(msg);
      falling = false;
      trimBtn.disabled = stepIdx >= AREA_STEPS.length - 1;
      regrowBtn.disabled = false;
      releaseBtn.disabled = false;
    }

    if (reduced) {
      finish();
      return;
    }

    var start = null;
    var durationMs = Math.min(tAloft * 1000, 6000); // cap so a slow fall stays watchable
    var spinRateVisual = stable ? SPIN : SPIN * 2.2; // visual only; wobble stands for instability
    var wobble = 0;

    function frame(ts) {
      if (start === null) start = ts;
      var elapsed = ts - start;
      var s = Math.min(elapsed / durationMs, 1);
      var x = ORIGIN_X + driftPx * s;
      var y = ORIGIN_Y + dropPx * s;
      var angle;
      if (stable) {
        angle = (spinRateVisual * (elapsed / 1000)) * (180 / Math.PI);
      } else {
        wobble += (Math.random() - 0.5) * 70;
        angle = wobble;
      }
      placeSeed(x, y, angle % 360);
      if (s < 1) {
        requestAnimationFrame(frame);
      } else {
        finish();
      }
    }
    requestAnimationFrame(frame);
  }

  trimBtn.addEventListener("click", trim);
  regrowBtn.addEventListener("click", regrow);
  releaseBtn.addEventListener("click", release);
  resetBtn.addEventListener("click", reset);
  seed.addEventListener("click", function () { if (!falling) release(); });
  seed.addEventListener("keydown", function (e) {
    if ((e.key === "Enter" || e.key === " ") && !falling) {
      e.preventDefault();
      release();
    }
  });

  reset();
})();
