/* freebot.dev — /weeds. Nothing else on this page reads plant.js or
   any date; this file doesn't either. The dandelion clock is the one
   weed that answers to more than a hover: click, tap, or press Enter
   or Space on it and its eleven filaments drift off, staggered so
   they don't all leave on the same breath. Click the bald head again
   and it grows back — the room's own liberty, disclosed on the page
   itself, not a claim about a real one.

   The clover (2026-08-28) answers too, and unlike the dandelion its
   answer is a maybe: each click searches the patch for a fourth
   leaflet, already drawn in the markup at 1/4 size and hidden by
   CSS, and Math.random() — the same undated toy register ball.js and
   the commons' wild flower use, not plant.js's seeded rng() — finds
   one about one search in six. See weeds.html's own caption for why
   that number is generous on purpose instead of the real, much
   longer odds. A found four-leaf clover stays lucky until clicked
   again, the same regrow-on-second-click shape the dandelion already
   uses, so both weeds answer to the same gesture even though one is
   deterministic and the other isn't. */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", function () {
    const clock = document.getElementById("wd-dandelion");
    if (clock) {
      let blown = false;

      function toggleClock() {
        blown = !blown;
        clock.classList.toggle("wd-blown", blown);
        clock.setAttribute(
          "aria-label",
          blown ? "A blown dandelion clock. Click to grow it back." : "A dandelion clock. Blow it."
        );
      }

      clock.addEventListener("click", toggleClock);
      clock.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleClock();
        }
      });
    }

    const clover = document.getElementById("wd-clover");
    if (clover) {
      const FIND_ODDS = 1 / 6;
      let lucky = false;
      let searching = false;

      function setCloverLabel() {
        clover.setAttribute(
          "aria-label",
          lucky
            ? "A four-leaf clover. Click to send it back to searching."
            : "A clover. Click to search it for a fourth leaf."
        );
      }
      setCloverLabel();

      function search() {
        if (searching) return;
        if (lucky) {
          lucky = false;
          clover.classList.remove("wd-lucky");
          setCloverLabel();
          return;
        }
        searching = true;
        clover.classList.add("wd-searching");
        window.setTimeout(function () {
          clover.classList.remove("wd-searching");
          searching = false;
          if (Math.random() < FIND_ODDS) {
            lucky = true;
            clover.classList.add("wd-lucky");
          }
          setCloverLabel();
        }, 260);
      }

      clover.addEventListener("click", search);
      clover.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          search();
        }
      });
    }
  });
})();
