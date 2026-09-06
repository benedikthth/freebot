// freebot.dev — /snare
// A real 2026 finding, turned into something you trigger yourself
// instead of a paragraph: a small Australian rainforest spider,
// genus Propostira (nicknamed the "ballista spider" — Narendra et
// al., Macquarie University, Current Biology 2026), builds a
// spring-loaded silk snare that only fires when its one prey species
// bites it. This model doesn't wait for the visitor to press a
// "fire" button — the ant does that, same as the real mechanism's
// own point: it's prey-triggered, not predator-triggered. See
// /snare for the full account and its own honest gaps.
//
// No date, no rng() any other file could ever read — same standing
// as pyrenoid.js and veins.js: a visitor's own clicks, a slider, and
// requestAnimationFrame, nothing tied to which day it is.
(function () {
  "use strict";

  var svg = document.getElementById("sn-svg");
  var ant = document.getElementById("sn-ant");
  var strandsGroup = document.getElementById("sn-strands");
  var caughtGroup = document.getElementById("sn-caught");
  var statusEl = document.getElementById("sn-status");
  var sendBtn = document.getElementById("sn-send");
  var rebuildBtn = document.getElementById("sn-rebuild");
  var countSlider = document.getElementById("sn-count");
  var countOut = document.getElementById("sn-count-out");
  if (!svg || !ant) return;

  var svgNS = "http://www.w3.org/2000/svg";

  /* Geometry, in the SVG's own 0-300×0-320 coordinate space. */
  var CONE_TIP = { x: 150, y: 202 };   // where the wrapped cone hangs
  var CONE_RIM_Y = 214;                // the cone's own wide end, ants bite here
  var ANCHOR_Y = 262;                  // where tension lines anchor below
  var ANCHOR_SPAN = 78;                // half-width of the anchor fan
  var START = { x: 26, y: CONE_RIM_Y }; // the ant's own starting point
  var BITE = { x: 150, y: CONE_RIM_Y }; // where it bites the cone's base
  var WEB_CENTER = { x: 150, y: 46 };  // the spider's main web, up and already waiting

  var STATE = { idle: "idle", approaching: "approaching", firing: "firing", caught: "caught" };
  var state = STATE.idle;
  var rafId = null;

  function setStatus(text) { if (statusEl) statusEl.textContent = text; }

  function drawStrands(n) {
    strandsGroup.textContent = "";
    for (var i = 0; i < n; i++) {
      var t = n === 1 ? 0.5 : i / (n - 1);
      var x = CONE_TIP.x - ANCHOR_SPAN + t * ANCHOR_SPAN * 2;
      var line = document.createElementNS(svgNS, "path");
      var midY = (CONE_TIP.y + ANCHOR_Y) / 2 + (Math.abs(t - 0.5) * 10);
      line.setAttribute("d", "M" + CONE_TIP.x + "," + CONE_TIP.y +
        " Q" + ((CONE_TIP.x + x) / 2) + "," + midY + " " + x + "," + ANCHOR_Y);
      line.setAttribute("class", "sn-strand");
      strandsGroup.appendChild(line);
    }
  }

  function updateCountLabel(n) {
    if (countOut) countOut.textContent = n + " strand" + (n === 1 ? "" : "s") + " (real range: 15–60)";
  }

  function placeAnt(x, y) {
    ant.setAttribute("cx", x.toFixed(1));
    ant.setAttribute("cy", y.toFixed(1));
  }

  function setAntVisible(v) { ant.style.display = v ? "" : "none"; }

  /* Quadratic Bezier point at parameter t, control point c. */
  function bez(p0, c, p1, t) {
    var mt = 1 - t;
    return {
      x: mt * mt * p0.x + 2 * mt * t * c.x + t * t * p1.x,
      y: mt * mt * p0.y + 2 * mt * t * c.y + t * t * p1.y
    };
  }

  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function animate(durationMs, onFrame, onDone) {
    var start = null;
    function step(ts) {
      if (start === null) start = ts;
      var t = Math.min(1, (ts - start) / durationMs);
      onFrame(t);
      if (t < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        rafId = null;
        if (onDone) onDone();
      }
    }
    rafId = requestAnimationFrame(step);
  }

  function reset() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    state = STATE.idle;
    caughtGroup.textContent = "";
    strandsGroup.classList.remove("sn-strand-fired");
    drawStrands(parseInt(countSlider.value, 10));
    setAntVisible(false);
    if (sendBtn) sendBtn.disabled = false;
    if (rebuildBtn) rebuildBtn.disabled = true;
    if (countSlider) countSlider.disabled = false;
    setStatus("Snare hung, tensioned, and waiting. Send an ant.");
  }

  function sendAnt() {
    if (state !== STATE.idle) return;
    state = STATE.approaching;
    if (sendBtn) sendBtn.disabled = true;
    if (countSlider) countSlider.disabled = true;
    setAntVisible(true);
    placeAnt(START.x, START.y);
    setStatus("An ant is investigating the cone.");
    animate(1700, function (t) {
      var e = easeInOutCubic(t);
      placeAnt(START.x + (BITE.x - START.x) * e, START.y);
    }, function () {
      fire();
    });
  }

  function fire() {
    state = STATE.firing;
    strandsGroup.classList.add("sn-strand-fired");
    setStatus("Contact — the bite is the trigger. Firing.");
    var control = { x: 150, y: (CONE_TIP.y + WEB_CENTER.y) / 2 - 40 };
    animate(420, function (t) {
      var e = easeOutCubic(t);
      var p = bez(BITE, control, WEB_CENTER, e);
      placeAnt(p.x, p.y);
    }, function () {
      caught();
    });
  }

  function caught() {
    state = STATE.caught;
    var mark = document.createElementNS(svgNS, "circle");
    mark.setAttribute("cx", String(WEB_CENTER.x));
    mark.setAttribute("cy", String(WEB_CENTER.y));
    mark.setAttribute("r", "3.4");
    mark.setAttribute("class", "sn-caught-mark");
    caughtGroup.appendChild(mark);
    setAntVisible(false);
    setStatus("Caught, more than 30 cm up — in well under a tenth of a second in real life, slowed down here so it's watchable. This snare is spent.");
    if (rebuildBtn) rebuildBtn.disabled = false;
  }

  if (sendBtn) sendBtn.addEventListener("click", sendAnt);
  if (rebuildBtn) rebuildBtn.addEventListener("click", reset);
  if (countSlider) {
    countSlider.addEventListener("input", function () {
      var n = parseInt(countSlider.value, 10);
      updateCountLabel(n);
      if (state === STATE.idle) drawStrands(n);
    });
  }

  if (countSlider) updateCountLabel(parseInt(countSlider.value, 10));
  reset();
})();
