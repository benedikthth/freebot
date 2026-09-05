/* freebot.dev — /slack: the rope-around-the-Earth puzzle, computed for
   real, for four real bodies of wildly different size.

   A circle's circumference is C = 2*PI*r. Raise it by height h and the
   new circumference is 2*PI*(r+h) = 2*PI*r + 2*PI*h — the old
   circumference plus exactly 2*PI*h. The original radius cancels out
   of that sum completely: it appears on both sides and is gone. So
   the extra rope a given rise needs never depends on r, only on h.
   This file doesn't assert that — it computes both circumferences
   from each body's own real radius and subtracts them live, so the
   page shows the cancellation happening rather than stating it.

   No date, no rng(), no Math.random() anywhere — every number here is
   a real physical constant (cited on the page) or a direct function
   of the slider. */
(function () {
  "use strict";

  var svg = document.getElementById("sl-svg");
  var slider = document.getElementById("sl-slider");
  if (!svg || !slider) return;

  var heightVal = document.getElementById("sl-height-val");
  var status = document.getElementById("sl-status");
  var formula = document.getElementById("sl-formula");
  var bodyName = document.getElementById("sl-body-name");
  var radiusEl = document.getElementById("sl-radius");
  var circEl = document.getElementById("sl-circ");
  var circNewEl = document.getElementById("sl-circ-new");
  var extraEl = document.getElementById("sl-extra");

  /* Real radii, in meters. Sources on the page itself (Sources
     paragraph): NASA Earth/Moon fact sheets, IAU 2015 Resolution B3,
     Wikipedia's basketball (ball) entry. The basketball's radius is
     derived from its own official circumference (29.5 in = 749.3 mm),
     not looked up separately — computed once below. */
  var BALL_CIRC_M = 0.7493; // 29.5 in, NBA/FIBA official size-7 ball
  var BODIES = {
    ball: { name: "Basketball", rMeters: BALL_CIRC_M / (2 * Math.PI) },
    moon: { name: "The Moon", rMeters: 1737400 }, // 1,737.4 km, volumetric mean radius
    earth: { name: "Earth", rMeters: 6378137 }, // 6,378.137 km, WGS84 equatorial radius
    sun: { name: "The Sun", rMeters: 695700000 } // 695,700 km, IAU nominal solar radius
  };

  var PICKS = {
    ball: document.getElementById("sl-ball"),
    moon: document.getElementById("sl-moon"),
    earth: document.getElementById("sl-earth"),
    sun: document.getElementById("sl-sun")
  };

  var current = "earth";

  /* Drawing scale. The two circles' own radii are a fixed, identical
     size for every body (arbitrary, not to scale of one another —
     see the Honest gap paragraph). The gap between them is drawn at
     one fixed real scale, pixels per meter of height — not
     exaggerated, and the same scale for every body, which is the
     entire visual point: the gap looks the same size because it is
     the same size. */
  var DRAW_R = 76; // px, the inner "surface" circle
  var PX_PER_M = 14; // px per meter of rise
  var CX = 120, CY = 120;

  function commas(n, decimals) {
    var fixed = n.toFixed(decimals);
    var parts = fixed.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  }

  function fmtRadius(rMeters) {
    if (rMeters < 1) return (rMeters * 100).toFixed(1) + " cm";
    if (rMeters < 10000) return commas(rMeters, 1) + " m";
    return commas(rMeters / 1000, 1) + " km";
  }

  function render(bodyId, h) {
    var body = BODIES[bodyId];
    var r = body.rMeters;
    var c1 = 2 * Math.PI * r;
    var c2 = 2 * Math.PI * (r + h);
    var extra = c2 - c1; // computed by subtraction, not assumed

    var gapPx = h * PX_PER_M;
    var outerR = DRAW_R + gapPx;

    svg.innerHTML =
      '<circle class="sl-surface" cx="' + CX + '" cy="' + CY + '" r="' + DRAW_R.toFixed(1) + '"/>' +
      '<circle class="sl-rope" cx="' + CX + '" cy="' + CY + '" r="' + outerR.toFixed(1) + '"/>' +
      (gapPx > 2
        ? '<line class="sl-gap-line" x1="' + CX + '" y1="' + (CY - DRAW_R).toFixed(1) +
          '" x2="' + CX + '" y2="' + (CY - outerR).toFixed(1) + '"/>' +
          '<text class="sl-gap-label" x="' + (CX + 6) + '" y="' + (CY - DRAW_R - gapPx / 2).toFixed(1) +
          '">h</text>'
        : "");

    if (bodyName) bodyName.textContent = body.name;
    if (radiusEl) radiusEl.textContent = fmtRadius(r);
    if (circEl) circEl.textContent = commas(c1, 2) + " m";
    if (circNewEl) circNewEl.textContent = commas(c2, 2) + " m";
    if (extraEl) extraEl.textContent = commas(extra, 4) + " m";

    if (status) {
      status.textContent =
        "Raise the rope " + h.toFixed(1) + " m off " + body.name.toLowerCase() +
        " and it needs " + commas(extra, 2) + " m more rope — same as any other body at this height.";
    }
  }

  function setBody(id) {
    current = id;
    Object.keys(PICKS).forEach(function (k) {
      if (PICKS[k]) PICKS[k].setAttribute("aria-pressed", k === id ? "true" : "false");
    });
    render(id, Number(slider.value));
  }

  Object.keys(PICKS).forEach(function (id) {
    var btn = PICKS[id];
    if (!btn) return;
    btn.addEventListener("click", function () { setBody(id); });
  });

  slider.addEventListener("input", function () {
    var h = Number(slider.value);
    if (heightVal) heightVal.textContent = h.toFixed(1);
    render(current, h);
  });

  if (formula) {
    formula.textContent = "extra rope = 2π × height, independent of the body's own radius";
  }

  if (heightVal) heightVal.textContent = Number(slider.value).toFixed(1);
  setBody("earth");
})();
