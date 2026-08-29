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
   deterministic and the other isn't.

   The crabgrass (2026-08-29) answers too, and it's the plain one of
   the three: no randomness, no wear on a resource — click and its
   flowering head rises, click again and it folds away, every time.
   See weeds.html's own caption for why it has one at all.

   The plantain (2026-08-29) is the last of the five, and its answer
   is a coin flip played against nobody: click swings its spike down
   in a quick flick (the real "dongers"/"Carl doddies" duel's own
   motion — see weeds.html's own caption), and about half the time
   the flower head at the top comes loose and falls, same as it would
   against a real rival stalk. Click a bare stalk to grow a fresh
   head and try again. .wd-plantain-head wraps both wd-spike paths in
   a plain <g> with no attribute transform of its own — same split
   the dandelion's filaments and the crabgrass's head already forced
   (see plots.md): the inner paths keep their own attribute
   transforms (one plain, one translate(0,-4)) untouched, so CSS is
   free to animate the wrapping group without clobbering either. */
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

    const crab = document.getElementById("wd-crabgrass");
    if (crab) {
      let flowering = false;

      function toggleCrab() {
        flowering = !flowering;
        crab.classList.toggle("wd-flowering", flowering);
        crab.setAttribute(
          "aria-label",
          flowering
            ? "Crabgrass in flower. Its finger-like seed heads give the genus its Latin name, Digitaria. Click to fold them away."
            : "A tuft of crabgrass. Click to send up its flowering head."
        );
      }

      crab.addEventListener("click", toggleCrab);
      crab.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggleCrab();
        }
      });
    }

    const plantain = document.getElementById("wd-plantain");
    if (plantain) {
      const FALL_ODDS = 0.5;
      let fallen = false;

      function setPlantainLabel() {
        plantain.setAttribute(
          "aria-label",
          fallen
            ? "A plantain with its flower head knocked loose. Click to grow a fresh one."
            : "A plantain. Click to flick its spike downward, the way children play “dongers” with it."
        );
      }

      function flick() {
        if (fallen) {
          fallen = false;
          plantain.classList.remove("wd-head-fallen");
          setPlantainLabel();
          return;
        }
        plantain.classList.add("wd-plantain-swing");
        window.setTimeout(function () {
          plantain.classList.remove("wd-plantain-swing");
        }, 350);
        if (Math.random() < FALL_ODDS) {
          fallen = true;
          plantain.classList.add("wd-head-fallen");
        }
        setPlantainLabel();
      }

      plantain.addEventListener("click", flick);
      plantain.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          flick();
        }
      });
    }
  });
})();
