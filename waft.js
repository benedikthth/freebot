/* freebot.dev — /waft
   Two seedlings, not touching. Damage the left one and a cloud of
   volatile organic compounds drifts to the right one — priming it,
   not defending it, the real distinction Engelberth, Alborn, Schmelz
   & Tumlinson (PNAS, 2004) drew in corn: exposure to a neighbor's
   green leaf volatiles alone didn't trigger full defense, but it made
   a *later*, real attack draw a bigger, faster jasmonic-acid and
   sesquiterpene response than an unprimed plant's. Attack the right
   seedling either way and compare — primed ramps faster and higher,
   unprimed ramps slower and lower. Karban, Baldwin, Baxter, Laue &
   Felton (Oecologia, 2000) is the field half: clipped sagebrush primed
   real, unclipped wild tobacco growing next to it, which then took
   measurably less herbivore damage over three field seasons.

   No date, no rng() plant.js could ever read — only two buttons and a
   reset, the same standing every undated toy on this site already
   holds. The one piece of real randomness anywhere near this file:
   none. Every run of this room behaves identically to the last. */

(function () {
  "use strict";

  var svg = document.getElementById("wf-svg");
  if (!svg) return;

  var damageBtn = document.getElementById("wf-damage");
  var attackBtn = document.getElementById("wf-attack");
  var resetBtn = document.getElementById("wf-reset");
  var status = document.getElementById("wf-status");
  var leftLeaves = document.getElementById("wf-left-leaves");
  var wound = document.getElementById("wf-wound");
  var cloud = document.getElementById("wf-cloud");
  var halo = document.getElementById("wf-halo");
  var defense = document.getElementById("wf-right-defense");

  var REDUCED = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var DRIFT_MS = REDUCED ? 250 : 2200;
  var RAMP_PRIMED_MS = REDUCED ? 200 : 900;
  var RAMP_NAIVE_MS = REDUCED ? 500 : 3000;
  var PEAK_PRIMED = 0.62;
  var PEAK_NAIVE = 0.32;

  var primed = false;
  var damaged = false;
  var driftTimer = null;
  var rampFrame = null;

  function setStatus(text) {
    if (status) status.textContent = text;
  }

  function damageLeft() {
    damaged = true;
    if (leftLeaves) leftLeaves.classList.add("wf-damaged");
    if (wound) wound.classList.add("wf-show");

    if (cloud) {
      cloud.classList.remove("wf-active");
      void cloud.getBoundingClientRect(); /* restart the CSS animation, same trick as reed's rd-playing */
      cloud.classList.add("wf-active");
    }

    setStatus("Left seedling wounded — it's already releasing volatile compounds into the air.");

    if (driftTimer) clearTimeout(driftTimer);
    driftTimer = setTimeout(function () {
      primed = true;
      if (halo) halo.classList.add("wf-primed");
      setStatus("The airborne signal has reached the right seedling. It hasn't been touched and isn't defending — just primed to respond faster if it is.");
    }, DRIFT_MS);
  }

  function attackRight() {
    if (rampFrame) cancelAnimationFrame(rampFrame);
    var wasPrimed = primed;
    var duration = wasPrimed ? RAMP_PRIMED_MS : RAMP_NAIVE_MS;
    var peak = wasPrimed ? PEAK_PRIMED : PEAK_NAIVE;

    if (defense) {
      defense.style.transitionDuration = (duration / 1000).toFixed(2) + "s";
      /* force current value to commit before changing the target, so a
         second attack mid-ramp restarts cleanly from wherever it was */
      var current = getComputedStyle(defense).opacity;
      defense.style.opacity = current;
      void defense.getBoundingClientRect();
      defense.style.opacity = String(peak);
    }

    setStatus(wasPrimed ?
      "Right seedling attacked after priming. Its defense ramps up faster and higher than an unprimed plant's would — the effect Engelberth et al. measured in corn." :
      "Right seedling attacked cold, no priming. It still defends itself — real plants always do when actually damaged — just slower, and to a lower level.");

    setTimeout(function () {
      setStatus(wasPrimed ?
        "Primed and defended: fast, strong response." :
        "Unprimed and defended: slow, weaker response. Reset and try damaging the left seedling first.");
    }, duration);
  }

  function reset() {
    damaged = false;
    primed = false;
    if (driftTimer) clearTimeout(driftTimer);
    if (rampFrame) cancelAnimationFrame(rampFrame);
    if (leftLeaves) leftLeaves.classList.remove("wf-damaged");
    if (wound) wound.classList.remove("wf-show");
    if (cloud) cloud.classList.remove("wf-active");
    if (halo) halo.classList.remove("wf-primed");
    if (defense) {
      defense.style.transitionDuration = "0.2s";
      defense.style.opacity = "0";
    }
    setStatus("Neither seedling has been touched yet.");
  }

  damageBtn && damageBtn.addEventListener("click", damageLeft);
  attackBtn && attackBtn.addEventListener("click", attackRight);
  resetBtn && resetBtn.addEventListener("click", reset);
})();
