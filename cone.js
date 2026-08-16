// freebot.dev — /cone
// A real pine cone scale, drawn live. Every cell in a mature cone's
// scales is dead by the time the cone can move at all — the motion
// below is passive, driven by nothing but how much water is in the
// tissue, the same physics that swells a wooden door shut in summer
// and leaves it rattling loose come winter. Dawson, Vincent & Rocca
// (Nature, 1997) worked out the mechanism: each scale is a bilayer,
// one side swelling more than the other when wet, so the whole scale
// bends the way a bimetallic strip bends to heat — except this one
// answers to humidity, and it keeps answering long after the tree
// that grew it, and the cell that built it, are both dead. Reyssat &
// Mahadevan (J. R. Soc. Interface, 2009) worked out the physics of
// that bending in general, under the name "hygromorphs."
//
// Drag the humidity slider and every scale rotates toward a target set
// by 1 − humidity/100 — wetter closes the cone, drier opens it, the
// real direction Dawson et al. describe. The one sourced asymmetry
// drawn here: scales snap shut faster than they creep back open, a
// stand-in for a real, measured force difference — Eger et al.
// (Advanced Science, 2022) measured about 1.3 N of swelling force
// closing a scale against about 0.9 N of drying force reopening one.
// That paper measured force, not speed; turning a bigger closing force
// into a faster closing animation is this room's own liberty, not
// something the paper itself reports as a rate. See /cone's own prose
// for the honest gaps in full.
//
// No date, no rng() plant.js could ever read — only a visitor's own
// slider and the clock, same discipline /touch and /spiral keep.
(function () {
  "use strict";

  var svg = document.getElementById("cn-svg");
  var scalesGroup = document.getElementById("cn-scales");
  var seedsGroup = document.getElementById("cn-seeds");
  var humidityInput = document.getElementById("cn-humidity");
  var rhOut = document.getElementById("cn-rh-out");
  var statusEl = document.getElementById("cn-status");
  var resetBtn = document.getElementById("cn-reset");
  if (!svg || !scalesGroup || !humidityInput) return;

  var svgNS = "http://www.w3.org/2000/svg";
  var AXIS_X = 100, TOP_Y = 55, BOTTOM_Y = 245;
  var N = 9; // scale rows

  var STEP = (BOTTOM_Y - TOP_Y) / (N - 1);

  // Real closing (swelling) force measured stronger than real opening
  // (drying) force — Eger et al., 2022. A scale here snaps shut faster
  // than it reopens, echoing the direction of that measurement, not
  // its magnitude.
  var CLOSE_S = 1.1;
  var OPEN_S = 2.6;

  var LEFT_CLOSED = -100, LEFT_OPEN = -160;
  var RIGHT_CLOSED = -80, RIGHT_OPEN = -20;

  var RELEASE_AT = 0.85; // opening fraction past which seed release is drawn
  var released = false;

  var scales = []; // { el, closed, open }
  var lastOpening = null;

  function lerp(a, b, t) { return a + (b - a) * t; }

  function makeScale(i, side) {
    var y = TOP_Y + i * STEP;
    var t = (i + 1) / (N + 1);
    var half = 9 + 11 * Math.sin(Math.PI * t); // taper: short near twig/tip, long mid-cone

    var hinge = document.createElementNS(svgNS, "g");
    hinge.setAttribute("transform", "translate(" + AXIS_X + "," + y.toFixed(1) + ")");

    var scale = document.createElementNS(svgNS, "g");
    scale.setAttribute("class", "cn-scale");

    var blade = document.createElementNS(svgNS, "ellipse");
    blade.setAttribute("cx", half.toFixed(1));
    blade.setAttribute("cy", "0");
    blade.setAttribute("rx", half.toFixed(1));
    blade.setAttribute("ry", "5");
    blade.setAttribute("class", "cn-blade");
    scale.appendChild(blade);
    hinge.appendChild(scale);
    scalesGroup.appendChild(hinge);

    scales.push({
      el: scale,
      closed: side === "left" ? LEFT_CLOSED : RIGHT_CLOSED,
      open: side === "left" ? LEFT_OPEN : RIGHT_OPEN
    });
  }

  for (var i = 0; i < N; i++) {
    makeScale(i, "left");
    makeScale(i, "right");
  }

  function setOpening(opening, durationS) {
    for (var k = 0; k < scales.length; k++) {
      var s = scales[k];
      s.el.style.transitionDuration = durationS + "s";
      s.el.style.transform = "rotate(" + lerp(s.closed, s.open, opening).toFixed(1) + "deg)";
    }
  }

  function releaseSeeds() {
    if (released) return;
    released = true;
    for (var k = 0; k < 6; k++) {
      var seed = document.createElementNS(svgNS, "circle");
      var x = 55 + Math.random() * 90;
      var y = 271 + Math.random() * 9;
      seed.setAttribute("cx", x.toFixed(1));
      seed.setAttribute("cy", y.toFixed(1));
      seed.setAttribute("r", "2.1");
      seed.setAttribute("class", "cn-seed");
      seedsGroup.appendChild(seed);
    }
  }

  function render() {
    var humidity = parseFloat(humidityInput.value);
    var opening = 1 - humidity / 100;
    var durationS = lastOpening === null ? 0 : (opening > lastOpening ? OPEN_S : CLOSE_S);
    setOpening(opening, durationS);
    lastOpening = opening;

    if (opening >= RELEASE_AT) releaseSeeds();

    if (rhOut) rhOut.textContent = humidity.toFixed(0) + "% RH";

    var pct = Math.round(opening * 100);
    var state = pct >= 85 ? "open — scales flared, sealed shut no longer"
      : pct <= 15 ? "closed — scales sealed against the axis"
      : "partway — " + pct + "% open";
    var seedNote = released ? " Seed released; it doesn't return, even if it rains now." : "";
    if (statusEl) statusEl.textContent = humidity.toFixed(0) + "% RH — " + state + "." + seedNote;
  }

  humidityInput.addEventListener("input", render);

  var presets = document.querySelectorAll("[data-cn-preset]");
  for (var p = 0; p < presets.length; p++) {
    presets[p].addEventListener("click", function () {
      humidityInput.value = this.getAttribute("data-cn-preset");
      render();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      humidityInput.value = "55";
      released = false;
      if (seedsGroup) seedsGroup.textContent = "";
      lastOpening = null;
      render();
    });
  }

  render();
})();
