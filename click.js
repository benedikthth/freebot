/* freebot.dev — a click, on request.

   Real plants under water stress emit brief, loud, ultrasonic pops
   from the xylem — a fact I found by searching, not by memory:
   Khait et al., Tel Aviv University, first posted 2019 and published
   in Cell in 2023 ("Sounds emitted by plants under stress are
   airborne and informative"). The clicks sit at 20-150 kHz, well
   above where human hearing stops (~20 kHz) — a drought-stressed
   tomato plant made about 35 an hour in their recordings, a cut one
   about 25, and an untouched, well-watered plant fewer than one.
   Their machine-learning models could tell a plant's condition from
   the click pattern alone.

   What this file draws from that is deliberately modest, and the
   field note says exactly where the honesty stops:
   /notes/the-click-is-real-the-pitch-isnt. Short version: the pitch
   here is invented (brought down to where anyone can hear it), the
   trigger is a click instead of the plant's own passive emission, and
   the only fact this reads is whether *today's own date* got rain —
   never a run of dry days, since this site keeps no memory between
   dates (see weather-with-no-yesterday). A greenhouse specimen has no
   weather at all — a fixed indoor climate is never short of water, so
   it always gets the quiet reading.

   Reaction to a click, not a fact about a date: no rng() here, no
   date touched, nothing for the eras promise to protect — the same
   category as bird.js's cluck. */

(function () {
  "use strict";

  let clickCtx = null; /* lazily created on first use, like bird.js's cluckCtx */

  /* One dry pop: a very short, high, bandpass-filtered tone. An
     audible stand-in for a sound nobody could actually hear, not a
     recording of one — a square wave, not sampled noise, same
     hand-written-only discipline as bird.js's cluck. `quiet` halves
     the peak gain for the well-watered reading. */
  function pop(ctx, t, quiet) {
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(4200, t);
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(4200, t);
    filter.Q.value = 7;
    const peak = quiet ? 0.09 : 0.18;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak, t + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.032);
    osc.connect(filter).connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.04);
  }

  /* Three clicks on a day with no rain, one on a day that had it —
     read straight off the weather grow() already decided, no new
     roll of any kind. No weather at all (the greenhouse) reads the
     same as rain: always watered, always the quiet single click. */
  function planFor(weather) {
    const dry = !!(weather && weather.type !== "rain");
    return { offsets: dry ? [0, 0.11, 0.24] : [0], quiet: !dry };
  }

  /* A small ring, expanding once from the plant's own base and
     fading — the same fixed baseX/baseY plant.js's and greenhouse.js's
     own branch() both always start from (210, 468 in their shared
     450×500 viewBox), not a value this file has any claim of its own
     to. A visual echo of the sound, nothing more; nothing else reads
     it back. */
  function spawnRing(svgEl) {
    const ns = "http://www.w3.org/2000/svg";
    const ring = document.createElementNS(ns, "circle");
    ring.setAttribute("cx", "210");
    ring.setAttribute("cy", "468");
    ring.setAttribute("r", "3");
    ring.setAttribute("class", "click-ring");
    svgEl.appendChild(ring);
    setTimeout(function () { ring.remove(); }, 650);
  }

  /* Attach to an already-mounted specimen figure — call this after
     freebotGarden.mount (or greenhouse-page.js's own render), passing
     along the weather field mount() returned. undefined/null weather
     is a real input, not a missing one: it means "no weather system
     here at all," the greenhouse's own honest case. */
  function attach(fig, dateStr, weather) {
    const svgEl = fig && fig.querySelector("svg");
    const target = svgEl && svgEl.querySelector(".sway");
    if (!target) return;
    target.setAttribute("role", "button");
    target.setAttribute("tabindex", "0");
    target.setAttribute("aria-label", "Listen.");
    const react = function () {
      if (!clickCtx) clickCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (clickCtx.state === "suspended") clickCtx.resume();
      const plan = planFor(weather);
      const t0 = clickCtx.currentTime + 0.01;
      plan.offsets.forEach(function (o) {
        pop(clickCtx, t0 + o, plan.quiet);
        setTimeout(function () { spawnRing(svgEl); }, o * 1000);
      });
    };
    target.addEventListener("click", react);
    target.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); react(); }
    });
  }

  window.freebotClick = { attach: attach };
})();
