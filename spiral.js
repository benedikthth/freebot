// freebot.dev — /spiral
// Vogel's model (1979): the nth floret sits at r = c·√n, θ = n·angle.
// Drag the angle and watch the interlocking spiral collapse into
// straight, gappy arms anywhere off 137.5077…°, the golden angle.
//
// No rng(), no date. The only inputs are the angle and count a
// visitor sets — same discipline /veins keeps, a different room.
(function () {
  "use strict";

  var svg = document.getElementById("sp-svg");
  var dots = document.getElementById("sp-dots");
  var angleInput = document.getElementById("sp-angle");
  var angleOut = document.getElementById("sp-angle-out");
  var countInput = document.getElementById("sp-count");
  var countOut = document.getElementById("sp-count-out");
  var goldenBtn = document.getElementById("sp-golden");
  if (!svg || !dots || !angleInput || !countInput) return;

  var svgNS = "http://www.w3.org/2000/svg";
  var CX = 150, CY = 150, MAX_R = 138;

  // Computed, not typed in: 1/φ = φ − 1 is the golden ratio's own
  // defining property, so 360°×(1 − 1/φ) is exact to floating point,
  // not a copied decimal.
  var PHI = (1 + Math.sqrt(5)) / 2;
  var GOLDEN_ANGLE = 360 * (1 - 1 / PHI);

  function render() {
    var angleDeg = parseFloat(angleInput.value);
    var n = parseInt(countInput.value, 10);
    var angleRad = (angleDeg * Math.PI) / 180;
    var c = MAX_R / Math.sqrt(n);

    dots.textContent = "";
    for (var i = 0; i < n; i++) {
      var r = c * Math.sqrt(i);
      var theta = i * angleRad;
      var x = CX + r * Math.cos(theta);
      var y = CY + r * Math.sin(theta);
      var circle = document.createElementNS(svgNS, "circle");
      circle.setAttribute("cx", x.toFixed(2));
      circle.setAttribute("cy", y.toFixed(2));
      circle.setAttribute("r", 2.4);
      circle.setAttribute("class", "sp-dot");
      dots.appendChild(circle);
    }

    if (angleOut) angleOut.textContent = angleDeg.toFixed(2) + "°";
    if (countOut) countOut.textContent = String(n);
  }

  angleInput.value = GOLDEN_ANGLE.toFixed(2);
  angleInput.addEventListener("input", render);
  countInput.addEventListener("input", render);

  if (goldenBtn) {
    goldenBtn.addEventListener("click", function () {
      angleInput.value = GOLDEN_ANGLE.toFixed(2);
      render();
    });
  }

  var presets = document.querySelectorAll("[data-sp-preset]");
  for (var p = 0; p < presets.length; p++) {
    presets[p].addEventListener("click", function () {
      angleInput.value = this.getAttribute("data-sp-preset");
      render();
    });
  }

  render();
})();
