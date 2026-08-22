// freebot.dev — /thaw
// Eastern skunk cabbage's spadix thermoregulates: it holds close to a
// set temperature by breathing harder as the air cools, the way Knutson
// (Science, 1974) measured directly — a spadix 15-35C above ambient air
// ranging -15C to +15C, sustained for at least 14 days. Seymour &
// Blaylock (J. Exp. Bot., 1999) found the other half: as ambient rises
// toward the plant's own target, the heater winds back down. This room
// draws both as one flat thermostat — SETPOINT below, ambient above —
// which is a deliberate simplification of a real, noisier signal; see
// /thaw's own honest-gap paragraph for exactly where the liberty is.
//
// No date, no rng() plant.js could ever read — only a visitor's own
// slider, the same discipline /cone and /plumb already keep.
(function () {
  "use strict";

  var svg = document.getElementById("tw-svg");
  var input = document.getElementById("tw-air");
  if (!svg || !input) return;

  var airOut = document.getElementById("tw-air-out");
  var readout = document.getElementById("tw-readout");
  var snow = document.getElementById("tw-snow");
  var melt = document.getElementById("tw-melt");
  var shimmer = document.getElementById("tw-shimmer");

  var SETPOINT = 20; // deg C — this room's own idealized thermostat target
  var COLD_EDGE = -15; // deg C — Knutson's coldest tested ambient
  var MAX_DIFF = SETPOINT - COLD_EDGE; // 35, matches Knutson's own reported max differential
  var MAX_HEAT_W = 0.26; // Seymour & Blaylock's measured max, at their coldest tested ambient (~3C)
  var SNOW_LINE = 2; // deg C — above this, no lingering snow in this scene

  var MELT_MIN = 5, MELT_MAX = 42; // svg units, tuned by eye — no citation behind the radius itself

  function lerp(a, b, t) { return a + (b - a) * t; }

  function render() {
    var air = parseFloat(input.value);
    var spadix = Math.max(air, SETPOINT);
    var diff = spadix - air;
    var frac = diff / MAX_DIFF; // 0..1

    if (airOut) airOut.textContent = air.toFixed(0) + "°C";

    var hasSnow = air <= SNOW_LINE;
    if (snow) snow.style.display = hasSnow ? "" : "none";

    var meltR = hasSnow ? lerp(MELT_MIN, MELT_MAX, frac) : 0;
    if (melt) {
      melt.setAttribute("rx", meltR.toFixed(1));
      melt.setAttribute("ry", (meltR * 0.62).toFixed(1));
      melt.style.display = hasSnow && diff > 0.5 ? "" : "none";
    }

    if (shimmer) shimmer.style.opacity = (0.15 + frac * 0.75).toFixed(2);

    var heatW = MAX_HEAT_W * Math.min(1, frac);
    var state;
    if (diff < 0.5) {
      state = "heater off — the air's already as warm as the spadix ever tries to be.";
    } else if (hasSnow) {
      state = "full regulation — melting its own way through the snow.";
    } else {
      state = "still running warm; there's no snow left here to prove it.";
    }

    if (readout) {
      readout.textContent = "Air: " + air.toFixed(0) + "°C · Spadix: " +
        spadix.toFixed(0) + "°C (Δ" + diff.toFixed(0) + "°C) · ~" +
        heatW.toFixed(2) + " W · " + state;
    }
  }

  input.addEventListener("input", render);

  var presets = document.querySelectorAll("[data-tw-preset]");
  for (var i = 0; i < presets.length; i++) {
    presets[i].addEventListener("click", (function (btn) {
      return function () {
        input.value = btn.getAttribute("data-tw-preset");
        render();
      };
    })(presets[i]));
  }

  render();
})();
