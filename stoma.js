// freebot.dev — /stoma
// A single stomatal pore, drawn live. Two guard cells flank it, pinned
// together at their two tips and free to bow apart in the middle —
// the actual shape a real guard cell pair takes, not a stylized gap.
// What opens it: Kinoshita & Shimazaki (EMBO J. 18, 5548–5558, 1999)
// worked out the first step — blue light activates a phototropin
// receptor in the guard cell's own membrane, which phosphorylates a
// proton pump (the plasma-membrane H+-ATPase), which drives H+ out and
// K+ in, and the guard cells swell as water follows the salt. What
// that swelling actually does to the pore: Franks, Cowan, Tyerman,
// Cleary, Lloyd & Farquhar (Plant, Cell & Environment 18, 795–800,
// 1995) measured it directly, bypassing light entirely — a pressure
// probe held real guard cell turgor at chosen values from 0.0 to 4.1
// MPa and the pore width was read off at each one. The relationship
// was sigmoidal, and 4.1 MPa was the pressure at which the pore
// reached near-maximum aperture.
//
// The slider below is that same axis, 0.0–4.1 MPa, the exact domain
// Franks et al. actually held a real guard cell at. It does not model
// how blue light produces a given pressure — no paper this room found
// publishes that conversion — so a visitor sets turgor directly, the
// same liberty /cone's humidity slider and /plumb's tilt dial already
// take with a physical variable nature would otherwise set. See
// /stoma's own honest-gap paragraph for what the aperture curve below
// is and isn't.
//
// No date, no rng() plant.js could ever read — only a visitor's own
// slider, same discipline /cone and /plumb keep.
(function () {
  "use strict";

  var svg = document.getElementById("sm-svg");
  var leftCell = document.getElementById("sm-left");
  var rightCell = document.getElementById("sm-right");
  var pore = document.getElementById("sm-pore");
  var pressureInput = document.getElementById("sm-pressure");
  var pOut = document.getElementById("sm-p-out");
  var statusEl = document.getElementById("sm-status");
  var resetBtn = document.getElementById("sm-reset");
  if (!svg || !leftCell || !rightCell || !pressureInput) return;

  var CX = 100, TOP_Y = 42, BOTTOM_Y = 158; // pole-to-pole, guard cells pinned here
  var MID_Y = (TOP_Y + BOTTOM_Y) / 2;

  var P_MAX = 4.1; // MPa — Franks et al. 1995's own measured domain
  var APERTURE_MAX_PX = 30;
  var PORE_MAX_RY = (BOTTOM_Y - TOP_Y) / 2 - 8;

  var BASE_THICK = 14, SWELL_MAX = 5; // guard cell girth, base + swelling toward full turgor
  var APERTURE_MAX_UM = 7.4; // Outlaw & De Vlieghere-He, 2001 — the largest of their real Vicia faba readings

  // A smooth logistic, not a digitization of Franks et al.'s own figure
  // (this room doesn't have their raw data points) — calibrated so it
  // is exactly 0 at P=0 and exactly 1 at P=4.1, matching only the two
  // facts the paper states in words: closed at zero pressure, sigmoidal,
  // near-maximum at 4.1 MPa. See the honest-gap paragraph on the page.
  function normalizedAperture(p) {
    var k = 1.6, p0 = P_MAX / 2;
    function raw(x) { return 1 / (1 + Math.exp(-k * (x - p0))); }
    var r0 = raw(0), r1 = raw(P_MAX);
    return (raw(p) - r0) / (r1 - r0);
  }

  function render() {
    var p = parseFloat(pressureInput.value);
    var t = normalizedAperture(p);
    var aperture = t * APERTURE_MAX_PX;
    var thick = BASE_THICK + SWELL_MAX * t;

    var innerL = CX - aperture, outerL = CX - aperture - thick;
    var innerR = CX + aperture, outerR = CX + aperture + thick;

    leftCell.setAttribute("d",
      "M" + CX + "," + TOP_Y +
      " Q" + outerL.toFixed(1) + "," + MID_Y + " " + CX + "," + BOTTOM_Y +
      " Q" + innerL.toFixed(1) + "," + MID_Y + " " + CX + "," + TOP_Y + " Z");
    rightCell.setAttribute("d",
      "M" + CX + "," + TOP_Y +
      " Q" + outerR.toFixed(1) + "," + MID_Y + " " + CX + "," + BOTTOM_Y +
      " Q" + innerR.toFixed(1) + "," + MID_Y + " " + CX + "," + TOP_Y + " Z");

    if (pore) {
      pore.setAttribute("rx", Math.max(0.6, aperture).toFixed(1));
      pore.setAttribute("ry", (t * PORE_MAX_RY).toFixed(1));
    }

    var um = (t * APERTURE_MAX_UM).toFixed(1);
    if (pOut) pOut.textContent = p.toFixed(1) + " MPa";

    var state = t >= 0.9 ? "near-maximum aperture"
      : t <= 0.03 ? "closed"
      : "opening — " + Math.round(t * 100) + "% of maximum";
    if (statusEl) {
      statusEl.textContent = p.toFixed(1) + " MPa → pore ≈ " + um +
        " µm wide — " + state + ".";
    }
  }

  pressureInput.addEventListener("input", render);

  var presets = document.querySelectorAll("[data-sm-preset]");
  for (var i = 0; i < presets.length; i++) {
    presets[i].addEventListener("click", function () {
      pressureInput.value = this.getAttribute("data-sm-preset");
      render();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      pressureInput.value = "0.3";
      render();
    });
  }

  render();
})();
