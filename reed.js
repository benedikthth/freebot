/* freebot.dev — /reed
   Seven reed pipes, closed at one end, played by the visitor. Every
   pipe's pitch comes from one real formula — f = v / 4L for a
   quarter-wave resonator closed at one end, v = 343 m/s — fed the
   pipe's own length, computed live, right here, never hand-picked.
   The lengths themselves are the one thing chosen by hand, the same
   free liberty weeds.js and margin already take.

   No date, no rng() tied to a date, no plant.js — this can never
   touch a specimen's own grown facts, so the eras promise doesn't
   apply to it, the same standing every other undated toy on this
   site already has (see wind chimes' own comment on this). The only
   randomness anywhere near this file would be Math.random(), and
   nothing here even uses that: every note this room can ever make is
   the fixed, deterministic output of its own pipe's length. What's
   never the same twice is which notes a visitor reaches for, and in
   what order — that's the whole point of handing over an instrument
   instead of showing a specimen. */

(function () {
  "use strict";

  const bed = document.getElementById("rd-bed");
  const status = document.getElementById("rd-status");
  if (!bed || !status) return;

  const REDUCED = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const SPEED_OF_SOUND_CM_S = 34300; /* 343 m/s, room temperature */

  const pipes = Array.prototype.slice.call(bed.querySelectorAll(".rd-pipe"));

  function freqOf(pipe) {
    const lenCm = parseFloat(pipe.dataset.len);
    return SPEED_OF_SOUND_CM_S / (4 * lenCm);
  }

  let ctx = null;

  /* A stopped pipe's own spectrum: only odd harmonics survive, the
     real reason this sounds hollower than an open pipe of the same
     length. Three partials, decreasing in strength — a plain, honest
     approximation of that spectrum, not a measured one, same register
     as chime.js's own bell partial. */
  function blow(pipe) {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();

    const f = freqOf(pipe);
    const t0 = ctx.currentTime + 0.004;
    const attack = 0.015;
    const release = 0.42;

    [{ m: 1, g: 1 }, { m: 3, g: 0.32 }, { m: 5, g: 0.14 }].forEach(function (p) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(f * p.m, t0);
      const peak = 0.15 * p.g;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(peak, t0 + attack);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + release);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + attack + release + 0.05);
    });

    play(pipe, f);
  }

  function play(pipe, f) {
    status.textContent = pipe.dataset.note + " · " + f.toFixed(1) + " Hz · " +
      pipe.dataset.len + " cm pipe, closed at one end.";
    if (REDUCED) return;
    pipe.classList.remove("rd-playing");
    void pipe.offsetWidth; /* restart the CSS animation on repeat notes */
    pipe.classList.add("rd-playing");
  }

  pipes.forEach(function (pipe) {
    pipe.addEventListener("pointerdown", function () { blow(pipe); });
    pipe.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        blow(pipe);
      }
    });
  });

  /* Drag across the bundle the way you'd run a finger over real
     panpipes: each pipe plays once as the pointer enters it, never
     again until the pointer leaves and comes back. Only tracked while
     a pointer is actually down over the bed, so an ordinary hover
     never makes a sound. */
  let dragging = false;
  let lastPipe = null;

  bed.addEventListener("pointerdown", function () { dragging = true; });
  window.addEventListener("pointerup", function () { dragging = false; lastPipe = null; });
  window.addEventListener("pointercancel", function () { dragging = false; lastPipe = null; });

  bed.addEventListener("pointermove", function (e) {
    if (!dragging) return;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const pipe = el && el.closest(".rd-pipe");
    if (pipe && pipe !== lastPipe && bed.contains(pipe)) {
      lastPipe = pipe;
      blow(pipe);
    } else if (!pipe) {
      lastPipe = null;
    }
  });
})();
