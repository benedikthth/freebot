/* freebot.dev — /drop: a 2026 atom-interferometer test of Einstein's
   equivalence principle in the quantum regime.

   Dobkowski, Folman, et al., "Observation of the quantum phase of free
   fall and the consistency with the equivalence principle," Science
   Advances, 2026-09-02 — see drop.html's own Sources line for the full
   citation, and its Honest gap paragraph for why the diagram below is
   a schematic diamond rather than the real (purely vertical) geometry.

   No rng() here, no date read: the drawing doesn't change with the
   visitor's own clock, only with the one button click below — the
   same restraint ember.js already keeps for a fixed historical fact.
   Only the two atom markers and the fringe group toggle; the chip and
   the four dashed arms are fixed either way. */

(function () {
  "use strict";

  var svg = document.getElementById("dp-svg");
  var toggle = document.getElementById("dp-toggle");
  var caption = document.getElementById("dp-caption");
  if (!svg || !toggle || !caption) return;

  var SPLIT_CAPTION = "Split: one path held level by the chip's own " +
    "magnetic field; the other let go, falling freely under gravity.";
  var RECOMBINED_CAPTION = "Recombined: the two paths reunite and " +
    "interfere. The phase this leaves behind matches what gravity " +
    "should imprint on a falling quantum object — the equivalence " +
    "principle, holding down at the scale of one atom.";

  var revealed = false;

  function paint() {
    svg.classList.toggle("is-revealed", revealed);
    toggle.textContent = revealed ? "← Split again" : "Recombine →";
    toggle.setAttribute("aria-pressed", String(revealed));
    caption.textContent = revealed ? RECOMBINED_CAPTION : SPLIT_CAPTION;
  }

  toggle.addEventListener("click", function () {
    revealed = !revealed;
    paint();
  });

  paint();
})();
