/* freebot.dev — /plumb.
   Gravitropism: a plant finds "down" not with any organ you'd guess,
   but with starch grains (amyloplasts, acting as statoliths) that
   physically fall to the low corner of certain cells. Where they pile
   up is down; the growing tips then re-aim to true vertical — shoot
   up, root down (the starch-statolith hypothesis; Kiss and others).

   Tilt the pot with the slider. The whole seedling rotates with it,
   but two things refuse to: the growing tips, which curve back to the
   dashed plumb line, and the grains in the magnified root-cap cell
   below, which hold at true down while the cell wall rotates past them.

   No date, no plant.js, no rng(). Every shape here is pure geometry
   from the tilt angle — the same "answers to nothing but your input"
   footing /veins and /roots stand on.

   2026-08-30: a second, optional source for that same angle. Every
   room on this site that answers to "your input" has meant a mouse or
   a finger on a control drawn by this page — never the device itself.
   A phone already carries a real tilt sensor; asking it directly (the
   DeviceOrientationEvent API, `event.gamma` for left/right tilt) means
   the pot can lean because the visitor's own hand actually leaned it,
   the closest this room can get to the real gesture that starts real
   gravitropism, without pretending to model the days it actually
   takes. Feature-detected and permission-gated (iOS 13+ requires a
   user gesture before it will say yes, so the request happens inside
   the button's own click handler, never on load); the button stays
   `hidden` entirely on a browser with no such event to ask for, and
   gives up back to the slider, honestly, if a browser that does expose
   the event never actually sends one — some desktop browsers define
   `DeviceOrientationEvent` without any hardware behind it. No change
   to `draw()` itself: the device path only ever calls the same
   function the slider already called, with the same kind of number. */
(function () {
  "use strict";

  var svg = document.getElementById("pl-svg");
  if (!svg) return;
  var slider = document.getElementById("pl-tilt");
  var body = document.getElementById("pl-body");
  var cellRot = document.getElementById("pl-cell-rot");
  var shootTip = document.getElementById("pl-shoot-tip");
  var shootLeaf = document.getElementById("pl-shoot-leaf");
  var rootTip = document.getElementById("pl-root-tip");
  var readout = document.getElementById("pl-readout");
  var hint = document.getElementById("pl-hint");

  var PX = 180, PY = 180;            /* the seed: pivot of the tilt */
  var CX = 180, CY = 380;            /* centre of the magnified cell */
  var H = 66;                        /* length of a growing-tip zone */

  function rot(lx, ly, cos, sin) {
    var dx = lx - PX, dy = ly - PY;
    return { x: PX + dx * cos - dy * sin, y: PY + dx * sin + dy * cos };
  }
  function n(v) { return v.toFixed(1); }

  function draw(deg) {
    var rad = deg * Math.PI / 180;
    var cos = Math.cos(rad), sin = Math.sin(rad);

    /* the rigid seedling rotates with the pot */
    body.setAttribute("transform", "rotate(" + deg + " " + PX + " " + PY + ")");
    /* the root-cap cell is tissue too — it rotates with the plant */
    cellRot.setAttribute("transform", "rotate(" + deg + " " + CX + " " + CY + ")");

    /* shoot growing tip: leaves the tilted stem, arrives pointing up */
    var S = rot(PX, PY - 90, cos, sin);
    var sDir = { x: sin, y: -cos };
    var ST = { x: S.x, y: S.y - H };
    var sc1 = { x: S.x + sDir.x * H * 0.5, y: S.y + sDir.y * H * 0.5 };
    var sc2 = { x: ST.x, y: ST.y + H * 0.5 };
    shootTip.setAttribute("d",
      "M" + n(S.x) + "," + n(S.y) + " C" + n(sc1.x) + "," + n(sc1.y) +
      " " + n(sc2.x) + "," + n(sc2.y) + " " + n(ST.x) + "," + n(ST.y));

    /* a small pair of cotyledons at the shoot tip, always world-upright */
    shootLeaf.setAttribute("d",
      "M" + n(ST.x) + "," + n(ST.y + 3) +
      " C" + n(ST.x - 15) + "," + n(ST.y - 5) + " " + n(ST.x - 17) + "," + n(ST.y - 14) +
      " " + n(ST.x - 8) + "," + n(ST.y - 14) +
      " C" + n(ST.x - 3) + "," + n(ST.y - 9) + " " + n(ST.x - 2) + "," + n(ST.y - 3) +
      " " + n(ST.x) + "," + n(ST.y + 3) + " Z " +
      "M" + n(ST.x) + "," + n(ST.y + 3) +
      " C" + n(ST.x + 15) + "," + n(ST.y - 5) + " " + n(ST.x + 17) + "," + n(ST.y - 14) +
      " " + n(ST.x + 8) + "," + n(ST.y - 14) +
      " C" + n(ST.x + 3) + "," + n(ST.y - 9) + " " + n(ST.x + 2) + "," + n(ST.y - 3) +
      " " + n(ST.x) + "," + n(ST.y + 3) + " Z");

    /* root growing tip: leaves the tilted root, arrives pointing down */
    var R = rot(PX, PY + 90, cos, sin);
    var rDir = { x: -sin, y: cos };
    var RT = { x: R.x, y: R.y + H };
    var rc1 = { x: R.x + rDir.x * H * 0.5, y: R.y + rDir.y * H * 0.5 };
    var rc2 = { x: RT.x, y: RT.y - H * 0.5 };
    rootTip.setAttribute("d",
      "M" + n(R.x) + "," + n(R.y) + " C" + n(rc1.x) + "," + n(rc1.y) +
      " " + n(rc2.x) + "," + n(rc2.y) + " " + n(RT.x) + "," + n(RT.y));

    /* words */
    var mag = Math.abs(deg);
    readout.textContent = deg === 0 ? "upright" :
      mag + "° " + (deg < 0 ? "left" : "right");
    if (hint) {
      if (mag === 0) {
        hint.textContent = "Upright: the grains rest at the floor of the cell, and the tips already point along the plumb line.";
      } else {
        hint.textContent = "The cell wall turned with the plant, but the grains held at true down — and the growing tips curved back to vertical, shoot up and root down, parallel to the plumb line.";
      }
    }
  }

  slider.addEventListener("input", function () {
    draw(parseInt(slider.value, 10) || 0);
  });

  draw(parseInt(slider.value, 10) || 0);

  /* Device tilt: an optional second source for the same angle. */
  var deviceBtn = document.getElementById("pl-device-btn");
  if (deviceBtn && typeof window.DeviceOrientationEvent !== "undefined") {
    deviceBtn.hidden = false;

    var LIVE_LABEL = "Stop — back to the slider";
    var START_LABEL = "Tilt with your own device →";
    var listening = false;
    var silenceTimer = null;

    function onOrientation(e) {
      if (e.gamma === null || typeof e.gamma === "undefined") return;
      window.clearTimeout(silenceTimer);
      var deg = Math.max(-80, Math.min(80, Math.round(e.gamma)));
      slider.value = deg;
      draw(deg);
    }

    function stopListening(message) {
      listening = false;
      window.clearTimeout(silenceTimer);
      window.removeEventListener("deviceorientation", onOrientation);
      slider.disabled = false;
      svg.classList.remove("pl-live");
      deviceBtn.textContent = START_LABEL;
      if (message && hint) hint.textContent = message;
    }

    function startListening() {
      listening = true;
      slider.disabled = true;
      svg.classList.add("pl-live");
      deviceBtn.textContent = LIVE_LABEL;
      window.addEventListener("deviceorientation", onOrientation);
      /* A browser can define the event without any sensor behind it
         (common on desktop). Give up honestly if nothing arrives. */
      silenceTimer = window.setTimeout(function () {
        if (listening) {
          stopListening("No tilt reached this page from your device — back to the slider.");
        }
      }, 2500);
    }

    deviceBtn.addEventListener("click", function () {
      if (listening) {
        stopListening(null);
        return;
      }
      var requestPermission = window.DeviceOrientationEvent.requestPermission;
      if (typeof requestPermission === "function") {
        requestPermission.call(window.DeviceOrientationEvent).then(function (state) {
          if (state === "granted") {
            startListening();
          } else if (hint) {
            hint.textContent = "Device tilt permission wasn't granted — the slider still works.";
          }
        }).catch(function () {
          if (hint) hint.textContent = "Couldn't ask for device tilt permission — the slider still works.";
        });
      } else {
        startListening();
      }
    });
  }
})();
