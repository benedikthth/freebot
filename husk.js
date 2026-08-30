/* freebot.dev — /husk: a mushroom that isn't one.

   Balanophora (family Balanophoraceae) gave up chlorophyll and fuses
   itself onto a host tree's living root instead of growing its own.
   Above ground its flowering head can pass for a mushroom cap; below
   ground it shares nothing with a real fungus. See husk.html's own
   Sources paragraph for the citations behind every claim this file's
   caption text repeats.

   No rng() here, no date-gating, nothing generated — the SVG is
   static markup in husk.html. This file only cycles one button through
   three states, toggling classes that reveal what's already drawn
   underground, and rewrites the button label, the left-side group
   label, and the live caption to match.

   Added 2026-08-30: a third state. The first two states only ever
   showed a free-living fungus (spreading mycelium, no root touched) or
   Balanophora's own one-sided graft — a real gap named by the visit
   that shipped this room, since most fungi that actually do meet a
   living root neither ignore it nor fuse to it, they trade with it.
   State three swaps the free mycelium for exactly that: a mycorrhizal
   fungus wrapped around a root. Cycling forward only (0→1→2→0) keeps
   one button doing one thing, same as the original two-state toggle. */

(function () {
  "use strict";

  var svg = document.getElementById("hk-svg");
  var toggle = document.getElementById("hk-toggle");
  var caption = document.getElementById("hk-caption");
  var leftLabel = document.getElementById("hk-left-label");
  if (!svg || !toggle || !caption || !leftLabel) return;

  var STATES = ["hidden", "free", "myco"];

  var CAPTIONS = {
    hidden: "Above ground, at a glance, they could be the same species.",
    free: "Below the soil line they share nothing: a fungus's own free " +
      "threads on the left, a tuber fused onto someone else's living " +
      "root on the right.",
    myco: "A different fungus now, wrapped around a living root instead " +
      "of ignoring one: hyphae and, in the arbuscular kind, structures " +
      "growing briefly inside the root's own cells — trading with the " +
      "plant, never fused to it, unlike the graft on the right."
  };

  var LABELS = { hidden: "fungus", free: "fungus", myco: "fungus (mycorrhizal)" };

  var BUTTON_TEXT = {
    hidden: "Look underground →",
    free: "Show a mycorrhizal fungus instead →",
    myco: "← Start over"
  };

  var index = 0;

  function paint() {
    var state = STATES[index];
    svg.classList.toggle("is-revealed", state !== "hidden");
    svg.classList.toggle("is-mycorrhiza", state === "myco");
    toggle.textContent = BUTTON_TEXT[state];
    toggle.setAttribute("aria-pressed", String(state !== "hidden"));
    leftLabel.textContent = LABELS[state];
    caption.textContent = CAPTIONS[state];
  }

  toggle.addEventListener("click", function () {
    index = (index + 1) % STATES.length;
    paint();
  });

  paint();
})();
