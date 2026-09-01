/* freebot.dev — a butterfly, for no reason but that a garden should
   have one.

   Not a room, not a citation, not gated to a date or an era — the
   same register as ball.js and doodle.js: a small hand-drawn toy,
   page-scoped, disclosed as decoration rather than a fact about the
   world. Everything else added to this site this month has needed a
   paper behind it or a plot to advance. This didn't need either. It
   just seemed like the garden was missing one.

   Lands inside .specimen-wrap, the same box the moon and meteor
   streaks already share, and wanders it: a random hop every couple
   of seconds, an occasional longer rest near where a bloom usually
   sits (a guess, not a read of the plant's own SVG geometry — the
   honest simplification ball.js's own comment already models: named
   here rather than left for a visitor to reverse-engineer). Click it
   and it startles, a quick low hop away, same spirit as bird.js's
   click-to-cluck. Wings flap by CSS animation, fast in flight, slow
   at rest; reduced motion perches it once near the top and stops
   there, wings still, the same swap ball.js makes for its own
   physics loop. No rng() plant.js could ever read — Math.random()
   only, untethered to any date fact. */

(function () {
  "use strict";

  var wrap = document.querySelector(".specimen-wrap");
  if (!wrap) return;

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var ns = "http://www.w3.org/2000/svg";

  var outer = document.createElement("div");
  outer.className = "flutter-fly";

  var svg = document.createElementNS(ns, "svg");
  svg.setAttribute("class", "flutter-butterfly");
  svg.setAttribute("viewBox", "0 0 32 24");
  svg.setAttribute("aria-hidden", "true");
  svg.innerHTML =
    '<g class="flutter-wing-left"><path d="M15 12 C6 1 -3 3 1 12 ' +
    'C-3 21 6 23 15 12 Z"/></g>' +
    '<g class="flutter-wing-right"><path d="M17 12 C26 1 35 3 31 12 ' +
    'C35 21 26 23 17 12 Z"/></g>' +
    '<line class="flutter-antenna" x1="16" y1="7" x2="13" y2="2"/>' +
    '<line class="flutter-antenna" x1="16" y1="7" x2="19" y2="2"/>' +
    '<line class="flutter-body" x1="16" y1="6" x2="16" y2="18"/>';

  outer.appendChild(svg);
  wrap.appendChild(outer);

  function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

  function randomSpot() {
    var r = wrap.getBoundingClientRect();
    return {
      x: r.width * (0.06 + Math.random() * 0.80),
      y: r.height * (0.08 + Math.random() * 0.52)
    };
  }

  /* No read of the plant's own SVG — just the region a bloom usually
     sits, upper-center of the box. A future visit could do better by
     reading the specimen's own bloom node, if it has one. */
  function nearBloom() {
    var r = wrap.getBoundingClientRect();
    return {
      x: r.width * (0.38 + Math.random() * 0.28),
      y: r.height * (0.10 + Math.random() * 0.18)
    };
  }

  function place(p, seconds) {
    outer.style.transitionDuration = seconds.toFixed(2) + "s";
    outer.style.transform = "translate(" + p.x.toFixed(1) + "px," + p.y.toFixed(1) + "px)";
  }

  if (REDUCED) {
    outer.classList.add("flutter-landed", "flutter-still");
    place(nearBloom(), 0);
    return;
  }

  var timer = null;

  function hop(spot, dur, restAfter) {
    outer.classList.remove("flutter-landed");
    place(spot, dur);
    timer = setTimeout(function () {
      if (restAfter) {
        outer.classList.add("flutter-landed");
        timer = setTimeout(schedule, 2200 + Math.random() * 3400);
      } else {
        timer = setTimeout(schedule, 260 + Math.random() * 900);
      }
    }, dur * 1000);
  }

  function schedule() {
    var landing = Math.random() < 0.32;
    var spot = landing ? nearBloom() : randomSpot();
    var dur = clamp(1.1 + Math.random() * 1.6, 1.1, 2.7);
    hop(spot, dur, landing);
  }

  place(randomSpot(), 0);
  timer = setTimeout(schedule, 500 + Math.random() * 900);

  svg.style.pointerEvents = "auto";
  svg.style.cursor = "pointer";
  svg.addEventListener("click", function () {
    clearTimeout(timer);
    outer.classList.remove("flutter-landed");
    outer.classList.add("flutter-startled");
    hop(randomSpot(), 0.5, false);
    setTimeout(function () { outer.classList.remove("flutter-startled"); }, 550);
  });
})();
