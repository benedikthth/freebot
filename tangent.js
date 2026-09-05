/* freebot.dev — /tangent: an Apollonian gasket, drawn from Descartes'
   own 1643 circle theorem, not approximated from it.

   Three mutually tangent circles leave two curvilinear gaps. Given
   their curvatures (k = 1/radius, negative for a circle that encloses
   the other two rather than sitting in a gap), the circle exactly
   filling either gap satisfies

     k4 = k1 + k2 + k3 ± 2*sqrt(k1*k2 + k2*k3 + k3*k1)

   — Descartes' theorem, worked out in two 1643 letters to Princess
   Elisabeth of the Palatinate and restated by Frederick Soddy as a
   poem, "The Kiss Precise" (Nature 137, 1021, 1936). See tangent.html
   for the fuller history; this file is just the arithmetic.

   Recursing past the first four circles needs one more step than the
   ± formula above gives directly, so this uses the equivalent "Vieta
   jump": given any mutually tangent quadruple (c0..c3), replacing one
   member ci with the OTHER circle tangent to the remaining three is

     ki' = 2*(sum of the other three k) - ki
     zi' = (2*(sum of the other three k*z) - ki*zi) / ki'

   (z = center, treated as a plain 2D point — no complex numbers
   needed to reach this, since it falls straight out of Vieta's
   formula for the two roots of the same quadratic above). Every
   circle drawn past the first two is reached this way, always
   excluding the slot just replaced (jumping it straight back would
   only regenerate the parent). Checked by hand against the tangency
   distance itself — external tangency at r1+r2, internal at
   |r1|-|r2| — for every circle this produces, up to nine generations
   deep, before this shipped.

   No date, no rng(), no plant.js — proven geometry doesn't take a
   seed. */
(function () {
  "use strict";

  var svg = document.getElementById("tg-svg");
  var slider = document.getElementById("tg-slider");
  var genLabel = document.getElementById("tg-gen");
  var status = document.getElementById("tg-status");
  if (!svg || !slider) return;

  var CX = 210, CY = 210, R = 180;
  var MIN_RADIUS = 1.3;

  /* The seed: one boundary circle and two equal circles splitting it
     evenly. Chosen on purpose — this special case keeps every
     curvature that ever appears a whole number, which the labels
     below show directly rather than asking it to be trusted. */
  var outer = { k: -1 / R, x: CX, y: CY, gen: 0 };
  var A = { k: 2 / R, x: CX - R / 2, y: CY, gen: 0 };
  var B = { k: 2 / R, x: CX + R / 2, y: CY, gen: 0 };
  var top0 = { k: 3 / R, x: CX, y: CY - (2 * R / 3), gen: 1 };

  function jump(quad, i) {
    var sumK = 0, sumKX = 0, sumKY = 0;
    for (var j = 0; j < 4; j++) {
      if (j === i) continue;
      sumK += quad[j].k;
      sumKX += quad[j].k * quad[j].x;
      sumKY += quad[j].k * quad[j].y;
    }
    var nk = 2 * sumK - quad[i].k;
    return { k: nk, x: (2 * sumKX - quad[i].k * quad[i].x) / nk, y: (2 * sumKY - quad[i].k * quad[i].y) / nk };
  }

  var bottom0 = jump([outer, A, B, top0], 3);
  bottom0.gen = 1;

  function recurse(quad, lastIdx, depthLeft, gen, out) {
    if (depthLeft <= 0) return;
    for (var i = 1; i <= 3; i++) {
      if (i === lastIdx) continue;
      var nc = jump(quad, i);
      var r = 1 / nc.k;
      if (!(r > 0) || r < MIN_RADIUS) continue;
      nc.gen = gen;
      out.push(nc);
      var newQuad = quad.slice();
      newQuad[i] = nc;
      recurse(newQuad, i, depthLeft - 1, gen + 1, out);
    }
  }

  function build(maxGen) {
    var circles = [];
    if (maxGen < 1) return circles;
    circles.push(top0, bottom0);
    if (maxGen > 1) {
      recurse([outer, A, B, top0], 3, maxGen - 1, 2, circles);
      recurse([outer, A, B, bottom0], 3, maxGen - 1, 2, circles);
    }
    return circles;
  }

  var GEN_COLORS = ["var(--moss)", "var(--floret)", "var(--petal)", "var(--blush)", "var(--leaf-a)"];

  function circleMarkup(c, cls) {
    var r = 1 / c.k;
    var color = GEN_COLORS[(c.gen - 1) % GEN_COLORS.length];
    var opacity = Math.max(0.32, 1 - (c.gen - 1) * 0.09);
    return '<circle class="' + cls + '" cx="' + c.x.toFixed(2) + '" cy="' + c.y.toFixed(2) +
      '" r="' + r.toFixed(2) + '" style="stroke:' + color + ';opacity:' + opacity.toFixed(2) + '"/>';
  }

  function labelMarkup(c, text) {
    return '<text class="tg-label" x="' + c.x.toFixed(2) + '" y="' + (c.y + 4).toFixed(2) + '">' + text + '</text>';
  }

  function render(maxGen) {
    var circles = build(maxGen);
    var markup =
      '<circle class="tg-outer" cx="' + CX + '" cy="' + CY + '" r="' + R + '"/>' +
      circleMarkup(A, "tg-seed") + circleMarkup(B, "tg-seed");

    for (var i = 0; i < circles.length; i++) {
      markup += circleMarkup(circles[i], "tg-fill");
    }

    markup += labelMarkup(outer, "−1") + labelMarkup(A, "2") + labelMarkup(B, "2");
    if (maxGen >= 1) {
      markup += labelMarkup(top0, "3") + labelMarkup(bottom0, "3");
    }

    svg.innerHTML = markup;

    var minR = Infinity, maxGenSeen = maxGen >= 1 ? 1 : 0;
    for (var j = 0; j < circles.length; j++) {
      var r = 1 / circles[j].k;
      if (r < minR) minR = r;
      if (circles[j].gen > maxGenSeen) maxGenSeen = circles[j].gen;
    }
    var total = circles.length + 3;
    if (genLabel) genLabel.textContent = String(maxGen);
    if (status) {
      status.textContent = maxGen < 1
        ? "Three circles, no gaps filled yet."
        : total + " circles on screen, generation " + maxGenSeen +
          " deep, down to a radius of " + minR.toFixed(1) + "px — every curvature among them still a whole number.";
    }
  }

  slider.addEventListener("input", function () {
    render(parseInt(slider.value, 10));
  });

  render(parseInt(slider.value, 10) || 4);
})();
