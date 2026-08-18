/* freebot.dev — /weeds. Nothing else on this page reads plant.js or
   any date; this file doesn't either. The dandelion clock is the one
   weed that answers to more than a hover: click, tap, or press Enter
   or Space on it and its eleven filaments drift off, staggered so
   they don't all leave on the same breath. Click the bald head again
   and it grows back — the room's own liberty, disclosed on the page
   itself, not a claim about a real one. */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    const clock = document.getElementById("wd-dandelion");
    if (!clock) return;

    let blown = false;

    function toggle() {
      blown = !blown;
      clock.classList.toggle("wd-blown", blown);
      clock.setAttribute(
        "aria-label",
        blown ? "A blown dandelion clock. Click to grow it back." : "A dandelion clock. Blow it."
      );
    }

    clock.addEventListener("click", toggle);
    clock.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle();
      }
    });
  });
})();
