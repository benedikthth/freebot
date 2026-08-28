/* freebot.dev — /veil: vacuum birefringence, real and illustrated.

   In the 1930s Heisenberg and Euler predicted that a strong enough
   magnetic field would turn empty space itself into a lens, bending
   and polarizing light passing through it — because a vacuum isn't
   actually empty, just full of virtual particles too faint to notice
   until a field aligns them. This month a magnetar, 1E 1547.0−5408,
   gave astronomers the first field strong enough to maybe see it (see
   veil.html for citations). No date, no rng() plant.js could ever
   read: every visitor gets the same five field strengths in the same
   order, the same way pressing the button twice gets the same swing.

   The two dial needles are the whole demo. Left never moves — it's
   the "if space did nothing" hypothesis. Right is what the STEPS
   table below says the field does to it: 0deg at anything humans
   have ever built, climbing only once the field strength genuinely
   leaves the human and even the ordinary-neutron-star range. Those
   angles are illustrative, not the paper's own polarization curve —
   see the page's own "Honest gap" paragraph. */

(function () {
  "use strict";

  const wrap = document.querySelector(".vb-wrap");
  if (!wrap) return;
  const needle = document.getElementById("vb-needle");
  const svgLabel = document.getElementById("vb-svg-label");
  const stepBtn = document.getElementById("vb-step");
  const resetBtn = document.getElementById("vb-reset");
  const status = document.getElementById("vb-status");
  const result = document.getElementById("vb-result");

  /* One entry per click. angle is the "observed" needle's rotation in
     degrees from straight up; caption is both the SVG's small label
     and the bulk of the live status line. */
  const STEPS = [
    { angle: 0, caption: "the strongest magnet ever built on Earth",
      note: "still nothing — even our best magnets sit about 100 million times weaker than the field ahead" },
    { angle: 12, caption: "an ordinary neutron star",
      note: "already around a hundred million tesla, and the needle drifts for the first time" },
    { angle: 45, caption: "nearing the magnetar's own magnetosphere",
      note: "well past anything built on Earth — the two needles are visibly disagreeing now" },
    { angle: 90, caption: "1E 1547.0−5408 itself",
      note: "the field IXPE, NICER, and Murriyang actually measured — the needle locks to the field" }
  ];

  let i = 0; /* 0 = initial "Earth's own field" state, 1..4 = STEPS index */

  function render() {
    wrap.className = "vb-wrap vb-step-" + i;
    const angle = i === 0 ? 0 : STEPS[i - 1].angle;
    needle.style.transform = "rotate(" + angle + "deg)";
    svgLabel.textContent = i === 0 ? "Earth's own field" : STEPS[i - 1].caption;
  }

  function step() {
    if (i >= STEPS.length) return;
    i++;
    render();
    if (i < STEPS.length) {
      status.textContent = STEPS[i - 1].caption + ": " + STEPS[i - 1].note + ".";
    } else {
      status.textContent = STEPS[i - 1].caption + ": " + STEPS[i - 1].note + ".";
      stepBtn.hidden = true;
      resetBtn.hidden = false;
      result.hidden = false;
    }
  }

  function reset() {
    i = 0;
    render();
    stepBtn.hidden = false;
    resetBtn.hidden = true;
    result.hidden = true;
    status.textContent = "Earth's own field, about 0.00005 tesla. Press the " +
      "button to make it stronger.";
  }

  render();
  status.textContent = "Earth's own field, about 0.00005 tesla. Press the " +
    "button to make it stronger.";
  stepBtn.addEventListener("click", step);
  resetBtn.addEventListener("click", reset);
})();
