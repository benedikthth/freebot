/* freebot.dev — /haha: a sunk fence, computed, not just described.

   An 18th-century ha-ha hides a real drop from a real distance for one
   reason: the near lip (grade level, right where the lawn ends) sits
   between a walker's eye and the ditch floor beyond it. Far enough
   back, the straight line from eye to floor has to pass through solid
   ground at the lip, which is impossible — so the eye sees only the
   lip and the level parkland past it, never the drop. Close enough,
   that same line clears the lip and the ditch pops into view. This
   file finds that exact crossing point by drawing the eye-to-floor
   line for real and testing where it sits relative to the lip's own
   height, not by animating a canned "reveal" at a fixed slider value.

   The three lengths a real builder had to pick — eye height, ditch
   width, ditch depth — turn out to cancel down to one clean number:
   reveal distance = eye height x ditch width / ditch depth. See
   haha.html's own paragraph for the derivation in prose; this file
   computes it the long way (a real line/point test, run fresh for
   every slider position) and the short way (the closed form) and
   they agree, which is the whole check worth running.

   No date, no rng() plant.js could ever touch — Math.random() never
   appears here either; every number is a fixed constant or a direct
   function of the slider. */
(function () {
  "use strict";

  var svg = document.getElementById("hh-svg");
  var slider = document.getElementById("hh-slider");
  if (!svg || !slider) return;

  var distVal = document.getElementById("hh-distance-val");
  var status = document.getElementById("hh-status");
  var formula = document.getElementById("hh-formula");

  /* Real dimensions: Stowe's own restored ha-ha, still standing at
     roughly 1.5m (5 ft) deep and 5m (16 ft) wide — see haha.html's
     Sources paragraph. Eye height is a plain adult standing average,
     not tied to any one visitor. */
  var EYE = 5.5; // ft, eye above grade
  var DITCH_W = 16; // ft, floor width
  var DITCH_H = 5; // ft, depth below grade
  var SLOPE_RUN = 2 * DITCH_H; // ft, the far (park-side) grassed slope back to grade

  var X_LIP = 100; // ft along the walk — scene layout only, not a measurement
  var SCENE_END = 148; // ft — far enough to show level parkland past the slope

  /* px scale. Vertical is exaggerated relative to horizontal (about
     5x) so a 5 ft drop reads as a drop at all across a 148 ft walk —
     the same honest compression a real elevation profile uses. See
     the Honest gap paragraph. */
  var SX = 3.9; // px per ft, horizontal
  var SY = 19.5; // px per ft, vertical
  var BASE_Y = 118; // px, grade line

  function px(xFt) { return xFt * SX; }
  function py(depthFt) { return BASE_Y + depthFt * SY; } // +depth = below grade

  /* The far floor corner: the lowest, furthest point that has to come
     into view before the dip reads as "a ditch is here" at all. This
     is the point every visibility test below is run against. */
  var FAR_X = X_LIP + DITCH_W;
  var FAR_DEPTH = DITCH_H;

  /* Exact line-of-sight test: given the walker's distance from the
     lip, is the far floor corner visible? Builds the real eye→corner
     line and checks its height at the lip's own x — if that height is
     at or above grade, the line clears the lip and the corner is
     visible; if it would have to run below grade to get there, the
     lip blocks it. This is the mechanism itself, not a lookup against
     the closed-form distance below. */
  function farCornerVisible(distanceFt) {
    var walkerX = X_LIP - distanceFt;
    var eyeDepth = -EYE;
    var run = FAR_X - walkerX;
    var slope = (FAR_DEPTH - eyeDepth) / run;
    var depthAtLip = eyeDepth + slope * (X_LIP - walkerX);
    return depthAtLip <= 0;
  }

  /* Closed form: eye height x ditch width / ditch depth. The eyeDepth
     term cancels out of the line/point test above algebraically —
     this is that same test, solved once instead of asked at every
     slider position. Shown on the page so the two can be checked
     against each other instead of one being trusted blind. */
  var REVEAL_DISTANCE = (EYE * DITCH_W) / DITCH_H;

  function groundTruthPoints() {
    return [
      [0, 0], [X_LIP, 0], [X_LIP, DITCH_H], [FAR_X, DITCH_H],
      [FAR_X + SLOPE_RUN, 0], [SCENE_END, 0]
    ];
  }

  function pathFromPoints(pts) {
    return pts.map(function (p, i) {
      return (i === 0 ? "M " : "L ") + px(p[0]).toFixed(1) + " " + py(p[1]).toFixed(1);
    }).join(" ");
  }

  function perceivedPoints(distanceFt, visible) {
    var walkerX = X_LIP - distanceFt;
    if (visible) return groundTruthPoints();
    /* Hidden: the lawn looks like it just keeps going. Same lip point,
       flat all the way to the scene's own far edge — the illusion a
       ha-ha is built to hold. */
    return [[0, 0], [X_LIP, 0], [SCENE_END, 0]];
  }

  function sheep(cx, groundY) {
    var bodyY = groundY - 8;
    return (
      '<g class="hh-sheep">' +
      '<line x1="' + (cx - 5).toFixed(1) + '" y1="' + (groundY - 2).toFixed(1) + '" x2="' + (cx - 5).toFixed(1) + '" y2="' + groundY.toFixed(1) + '"/>' +
      '<line x1="' + (cx + 5).toFixed(1) + '" y1="' + (groundY - 2).toFixed(1) + '" x2="' + (cx + 5).toFixed(1) + '" y2="' + groundY.toFixed(1) + '"/>' +
      '<ellipse cx="' + cx.toFixed(1) + '" cy="' + bodyY.toFixed(1) + '" rx="10" ry="6.5" class="hh-sheep-body"/>' +
      '<circle cx="' + (cx - 10).toFixed(1) + '" cy="' + (bodyY + 1).toFixed(1) + '" r="3.4" class="hh-sheep-head"/>' +
      "</g>"
    );
  }

  function render(distanceFt) {
    var visible = farCornerVisible(distanceFt);
    var walkerX = X_LIP - distanceFt;

    var truth = pathFromPoints(groundTruthPoints());
    var seen = pathFromPoints(perceivedPoints(distanceFt, visible));

    /* The sightline: eye, through the lip, out toward the far corner's
       own x — drawn a little past the corner so it's visible whether
       or not it currently clears the lip. */
    var eyeX = px(walkerX), eyeY = py(-EYE);
    var lipX = px(X_LIP), lipY = py(0);
    var dx = lipX - eyeX, dy = lipY - eyeY;
    var extend = 1.35;
    var rayX = eyeX + dx * extend, rayY = eyeY + dy * extend;

    var groundY0 = py(0);

    svg.innerHTML =
      '<path class="hh-truth" d="' + truth + '"/>' +
      '<path class="hh-seen" d="' + seen + '"/>' +
      '<line class="hh-sightline" x1="' + eyeX.toFixed(1) + '" y1="' + eyeY.toFixed(1) +
      '" x2="' + rayX.toFixed(1) + '" y2="' + rayY.toFixed(1) + '"/>' +
      sheep(px(FAR_X + SLOPE_RUN + 7), groundY0) +
      sheep(px(FAR_X + SLOPE_RUN + 17), groundY0) +
      '<line class="hh-walker-stem" x1="' + eyeX.toFixed(1) + '" y1="' + eyeY.toFixed(1) +
      '" x2="' + eyeX.toFixed(1) + '" y2="' + py(0).toFixed(1) + '"/>' +
      '<circle class="hh-walker-eye" cx="' + eyeX.toFixed(1) + '" cy="' + eyeY.toFixed(1) + '" r="3.4"/>';

    if (distVal) distVal.textContent = distanceFt;
    if (status) {
      status.textContent = visible
        ? "Visible — you're " + distanceFt + " ft out, inside the " + REVEAL_DISTANCE.toFixed(1) + " ft the sightline needs to clear the edge."
        : "Hidden — you're " + distanceFt + " ft out, still past the " + REVEAL_DISTANCE.toFixed(1) + " ft it takes to see over the edge.";
    }
    svg.classList.toggle("hh-revealed", visible);
  }

  if (formula) {
    formula.textContent =
      EYE + " ft eye height × " + DITCH_W + " ft ditch width ÷ " +
      DITCH_H + " ft ditch depth = " + REVEAL_DISTANCE.toFixed(1) + " ft";
  }

  slider.min = "3";
  slider.max = "97";
  if (!slider.value || Number(slider.value) < 3) slider.value = "88";

  slider.addEventListener("input", function () {
    render(Number(slider.value));
  });

  render(Number(slider.value));
})();
