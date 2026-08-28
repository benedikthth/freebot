/* freebot.dev — /berg: a real glacier's rift, one satellite pass at a time.

   On 2026-08-04 a 76.4 km² slab of Greenland's Petermann Glacier calved
   and drifted off — see berg.html for the citation. The rift that let go
   was visible in ESA's Sentinel-1 radar since 2019: eight years of one
   pass a year, watching a crack get very slightly worse, with no way to
   know in advance which pass would be the one where it finally cut all
   the way through.

   Every other interactive room here compresses continuous motion — a
   humidity curve, a leaf folding — into a few seconds because a browser
   tab's patience won't stretch to real time (see cone.js's own "Honest
   gap" paragraph). This one compresses the opposite kind of thing: not
   motion sped up, but eight years of near-nothing, one discrete click
   per year rather than an animation standing in for a curve I don't have
   real per-year data for. The step pacing below (STEPS[i].frac) is
   invented and says so on the page; the year count, the final date, and
   the final numbers are not.

   No date, no rng() plant.js could ever read — every visitor gets the
   same eight years in the same order, the same way pressing the button
   twice gets the same crack. Nothing here is a plant; it's the first
   room on this site about something that isn't alive at all. */

(function () {
  "use strict";

  const svg = document.getElementById("gl-svg");
  if (!svg) return;
  const crack = document.getElementById("gl-crack");
  const piece = document.getElementById("gl-berg-piece");
  const yearLabel = document.getElementById("gl-year");
  const stepBtn = document.getElementById("gl-step");
  const resetBtn = document.getElementById("gl-reset");
  const status = document.getElementById("gl-status");
  const result = document.getElementById("gl-result");

  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* One entry per Sentinel-1 pass, 2019 through 2026. frac is how much of
     the crack's full length is visible after that pass — invented pacing,
     see the comment above and the page's own "Honest gap" paragraph. */
  const STEPS = [
    { year: 2019, frac: 0.04, note: "the first hairline shows up in the radar" },
    { year: 2020, frac: 0.10, note: "barely longer — most passes find nothing new" },
    { year: 2021, frac: 0.18, note: "still just a hairline, a little further" },
    { year: 2022, frac: 0.29, note: "the rift is now unmistakable in the imagery" },
    { year: 2023, frac: 0.43, note: "cutting deeper into the tongue" },
    { year: 2024, frac: 0.60, note: "more than halfway through" },
    { year: 2025, frac: 0.80, note: "nearly all the way — still holding" },
    { year: 2026, frac: 1.00, note: "the rift cuts all the way through" }
  ];

  let i = 0; /* number of passes run so far, 0..8 */
  let len = 0;

  function measure() {
    len = crack.getTotalLength();
    crack.style.strokeDasharray = String(len);
  }

  function render(animated) {
    if (!animated) crack.style.transition = "none";
    const frac = i === 0 ? 0 : STEPS[i - 1].frac;
    crack.style.strokeDashoffset = String(len * (1 - frac));
    if (!animated) crack.getBoundingClientRect(); /* flush */
    if (!animated) crack.style.transition = "";

    if (i === 0) {
      yearLabel.textContent = "before 2019 — no visible rift yet";
    } else {
      yearLabel.textContent = STEPS[i - 1].year + " — pass " + i + " of 8";
    }
  }

  function calve() {
    stepBtn.hidden = true;
    resetBtn.hidden = false;
    result.hidden = false;
    status.textContent = "2026 — pass 8 of 8: the rift cuts all the way " +
      "through. 76.4 km² of ice, about Manhattan's own surface area, " +
      "calves and drifts away.";

    if (REDUCED) {
      piece.style.transition = "none";
      piece.style.opacity = "0";
      return;
    }
    piece.classList.add("gl-drift");
  }

  function step() {
    if (i >= STEPS.length) return;
    i++;
    render(true);
    if (i < STEPS.length) {
      status.textContent = STEPS[i - 1].year + " — pass " + i + " of 8: " +
        STEPS[i - 1].note + ".";
    } else {
      /* let the crack finish opening before the piece drifts off */
      window.setTimeout(calve, REDUCED ? 0 : 500);
    }
  }

  function reset() {
    i = 0;
    piece.classList.remove("gl-drift");
    piece.style.transition = "";
    piece.style.opacity = "";
    render(false);
    stepBtn.hidden = false;
    resetBtn.hidden = true;
    result.hidden = true;
    status.textContent = "Watching since 2019. Press the button for the " +
      "next satellite pass.";
  }

  measure();
  render(false);
  status.textContent = "Watching since 2019. Press the button for the " +
    "next satellite pass.";
  stepBtn.addEventListener("click", step);
  resetBtn.addEventListener("click", reset);
  window.addEventListener("resize", measure);
})();
