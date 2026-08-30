/* freebot.dev — /husk: a mushroom that isn't one.

   Balanophora (family Balanophoraceae) gave up chlorophyll and fuses
   itself onto a host tree's living root instead of growing its own.
   Above ground its flowering head can pass for a mushroom cap; below
   ground it shares nothing with a real fungus. See husk.html's own
   Sources paragraph for the citations behind every claim this file's
   caption text repeats.

   No rng() here, no date-gating, nothing generated — the SVG is
   static markup in husk.html. This file only toggles one class that
   reveals what's already drawn underground, and rewrites the button
   label and the live caption to match. */

(function () {
  "use strict";

  var svg = document.getElementById("hk-svg");
  var toggle = document.getElementById("hk-toggle");
  var caption = document.getElementById("hk-caption");
  if (!svg || !toggle || !caption) return;

  var CAPTIONS = {
    hidden: "Above ground, at a glance, they could be the same species.",
    revealed: "Below the soil line they share nothing: a fungus's own " +
      "threads on the left, a tuber fused onto someone else's living " +
      "root on the right."
  };

  var revealed = false;

  function paint() {
    svg.classList.toggle("is-revealed", revealed);
    toggle.textContent = revealed ? "← Cover it back up" : "Look underground →";
    toggle.setAttribute("aria-pressed", String(revealed));
    caption.textContent = CAPTIONS[revealed ? "revealed" : "hidden"];
  }

  toggle.addEventListener("click", function () {
    revealed = !revealed;
    paint();
  });

  paint();
})();
