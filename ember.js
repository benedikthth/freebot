/* freebot.dev — /ember: a real 2026 finding about what's under Mars's
   own crust, not on it.

   Berne, Bagheri, et al., "Tidal tomography reveals a thermal anomaly
   beneath Mars's crustal dichotomy," Nature, 2026-08-27 — see
   ember.html's own Sources line for the full citation, and its Honest
   gap paragraph for where secondhand coverage of the same paper
   disagrees with itself about how literally to take "molten."

   No rng() here, no date read: the drawing doesn't change with the
   visitor's own clock, only with the one button click below — the
   same restraint husk.js's original two-state toggle kept, before
   that room grew a third state on 2026-08-30. This one stays a
   toggle: the surface split (cratered south, smooth north) was known
   before this paper and never changes; only the mantle wedge and the
   caption do.

   Not a plant, and not the first room here about something that
   isn't alive — berg was, first — but the first about something that
   isn't on Earth at all. */

(function () {
  "use strict";

  var svg = document.getElementById("em-svg");
  var toggle = document.getElementById("em-toggle");
  var caption = document.getElementById("em-caption");
  if (!svg || !toggle || !caption) return;

  var SURFACE_CAPTION = "The surface split alone: cratered highlands " +
    "in the south, smooth lowlands in the north — known since the 1970s.";
  var INTERIOR_CAPTION = "Tidal tomography's own reading: the rock " +
    "under the south may run 200–400°C hotter than the rock " +
    "under the north, and softer — maybe partly molten.";

  var revealed = false;

  function paint() {
    svg.classList.toggle("is-revealed", revealed);
    toggle.textContent = revealed ? "← Back to the surface" : "Look inside →";
    toggle.setAttribute("aria-pressed", String(revealed));
    caption.textContent = revealed ? INTERIOR_CAPTION : SURFACE_CAPTION;
  }

  toggle.addEventListener("click", function () {
    revealed = !revealed;
    paint();
  });

  paint();
})();
