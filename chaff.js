/* freebot.dev — /chaff: how often pure noise alone throws a bump that
   looks like a real signal.

   The real-world hook: on 1 September 2026 the LUX-ZEPLIN (LZ)
   collaboration reported one unexplained event at roughly 2.6 standard
   deviations (sigma) above its own background model — genuinely
   interesting, openly short of the 5-sigma bar particle physics uses
   before calling something a discovery. See chaff.html's own Sources
   paragraph for the real numbers and their real honest gap.

   This room answers a narrower, checkable question: if there's
   nothing there at all — pure Math.random() noise, no signal hidden
   in it on purpose, ever — how often does the single largest reading
   in a batch clear 2.6 sigma anyway, just by chance? Each press draws
   200 fresh standard-normal values (Box-Muller, not a library), plots
   all 200 along a real sigma axis, and highlights whichever one came
   out highest. A running tally across every batch this visitor has
   pressed answers the question directly, in this browser, rather than
   asserting a number.

   200 is a disclosed, arbitrary choice (see the page's own honest-gap
   paragraph) — not a real detector's bin or live-day count. No rng()
   from plant.js, no date read: this has nothing to do with the
   specimen above and never claims otherwise. */
(function () {
  "use strict";

  var svg = document.getElementById("cf-svg");
  var ticksGroup = document.getElementById("cf-ticks");
  var dotsGroup = document.getElementById("cf-dots");
  var thresholdLine = document.getElementById("cf-threshold-line");
  var thresholdLabel = document.getElementById("cf-threshold-label");
  var runBtn = document.getElementById("cf-run");
  var statusEl = document.getElementById("cf-status");
  var tallyEl = document.getElementById("cf-tally");
  if (!svg || !ticksGroup || !dotsGroup || !runBtn) return;

  var NS = "http://www.w3.org/2000/svg";
  var N = 200;
  var THRESHOLD = 2.6;
  var PAD_L = 36, AXIS_Y = 128;
  var PLOT_W = 388; // 424 - 36, matching the SVG's own hand-picked line ends
  var PX_PER_SIGMA = PLOT_W / 8; // axis spans -4..+4

  function xAt(z) {
    var clamped = Math.max(-4, Math.min(4, z));
    return PAD_L + (clamped + 4) * PX_PER_SIGMA;
  }

  // Box-Muller: two uniform draws in, one standard-normal value out.
  function randNormal() {
    var u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  }

  // Ticks at every integer sigma, drawn once — they never change.
  for (var t = -4; t <= 4; t++) {
    var x = xAt(t).toFixed(1);
    var mark = document.createElementNS(NS, "line");
    mark.setAttribute("class", "cf-tick");
    mark.setAttribute("x1", x); mark.setAttribute("x2", x);
    mark.setAttribute("y1", "128"); mark.setAttribute("y2", "133");
    ticksGroup.appendChild(mark);
    var lbl = document.createElementNS(NS, "text");
    lbl.setAttribute("class", "cf-tick-label");
    lbl.setAttribute("x", x); lbl.setAttribute("y", "146");
    lbl.setAttribute("text-anchor", "middle");
    lbl.textContent = (t > 0 ? "+" : "") + t;
    ticksGroup.appendChild(lbl);
  }

  // The 2.6-sigma reference line is fixed geometry, positioned once.
  var thresholdX = xAt(THRESHOLD).toFixed(1);
  thresholdLine.setAttribute("x1", thresholdX);
  thresholdLine.setAttribute("x2", thresholdX);
  thresholdLabel.setAttribute("x", thresholdX);

  var runs = 0, hits = 0;

  function countWord(n, singular, pluralForm) {
    return n + " " + (n === 1 ? singular : pluralForm);
  }

  function run() {
    dotsGroup.textContent = "";
    var maxZ = -Infinity, maxIndex = -1;
    var vals = [];
    for (var i = 0; i < N; i++) {
      var z = randNormal();
      vals.push(z);
      if (z > maxZ) { maxZ = z; maxIndex = i; }
    }
    for (var j = 0; j < N; j++) {
      var isHit = j === maxIndex;
      var dot = document.createElementNS(NS, "circle");
      dot.setAttribute("cx", xAt(vals[j]).toFixed(1));
      dot.setAttribute("cy", (isHit ? 40 : (34 + Math.random() * 84)).toFixed(1));
      dot.setAttribute("r", isHit ? "4.5" : "2");
      dot.setAttribute("class", isHit ? "cf-dot cf-dot-hit" : "cf-dot");
      dotsGroup.appendChild(dot);
    }
    var label = document.createElementNS(NS, "text");
    label.setAttribute("class", "cf-hit-label");
    label.setAttribute("x", xAt(maxZ).toFixed(1));
    label.setAttribute("y", "28");
    label.setAttribute("text-anchor", "middle");
    label.textContent = (maxZ >= 0 ? "+" : "") + maxZ.toFixed(2) + "σ";
    dotsGroup.appendChild(label);

    runs++;
    var cleared = maxZ >= THRESHOLD;
    if (cleared) hits++;

    statusEl.textContent = "This batch's biggest wobble: " + maxZ.toFixed(2) +
      "σ — " + (cleared
        ? "a false alarm this size, purely by chance."
        : "nowhere near 2.6σ.");

    var pct = (100 * hits / runs).toFixed(0);
    tallyEl.textContent = countWord(runs, "batch", "batches") + " winnowed, " + N +
      " fake readings each. " + countWord(hits, "false alarm", "false alarms") +
      " at 2.6σ or worse (" + pct + "%) — with nothing real behind any of them.";
  }

  runBtn.addEventListener("click", run);
})();
