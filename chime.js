/* freebot.dev — wind chimes, hung on the real wind.

   wind.js already asks Open-Meteo for the real wind over a real
   garden and turns it into a sway nobody can hear. This turns the
   same live number into something you can: five hanging tubes, and
   the harder it's blowing, the more often — and the more of them at
   once — actually ring.

   This is not a physical model of a chime and doesn't pretend to be:
   real wind chimes are tuned metal, sized to real pitches, struck by
   real air turbulence nothing here computes. What's real is the one
   number driving it — the same live km/h wind.js already fetched for
   the sway, reused rather than asked for twice. The pitches are five
   notes of an ordinary pentatonic scale, picked because they sound
   pleasant together, not measured from anything; which tube rings and
   when is Math.random(), the same undated, unticketed randomness
   ball.js's fling and weeds.js's filament drift already use for a toy
   with no claim to be a fact about a date.

   Silent until asked twice, on purpose: wind mode itself is already
   opt-in (a click, never on load), and sound is a second, separate
   ask, since a visitor who wanted to see the sway didn't necessarily
   want a tab that starts making noise. The toggle button is the only
   thing that ever creates or resumes an AudioContext, so it only ever
   runs on a real user gesture. "Let it go still" (wind.js's own
   button) silences this too, immediately — nothing here keeps a timer
   running, or a live wind reading in use, after a visitor asks wind
   mode to stop.

   Reacts to wind.js's own "freebot:wind" / "freebot:wind-stop" window
   events rather than reading its internal state or polling Open-Meteo
   a second time. No rng(), no date, no plant.js — this could never
   touch a specimen's own grown facts, and the eras promise doesn't
   apply to it. */

(function () {
  "use strict";

  const wrap = document.getElementById("wc-wrap");
  const toggle = document.getElementById("wc-toggle");
  const status = document.getElementById("wc-status");
  if (!wrap || !toggle || !status) return;

  const REDUCED = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Five tubes, longest (lowest note) at the left, same left-to-right
     reading order a real set of chimes usually hangs in. Length here
     is purely visual — the pitch below is an independent pick, not
     derived from it, since nothing here claims to be a physically
     modeled tube. */
  const TUBES = [
    { x: 30, len: 92, freq: 392.00 },  /* G4 */
    { x: 68, len: 80, freq: 440.00 },  /* A4 */
    { x: 106, len: 70, freq: 523.25 }, /* C5 */
    { x: 144, len: 64, freq: 587.33 }, /* D5 */
    { x: 182, len: 58, freq: 659.25 }  /* E5 */
  ];
  const BAR_Y = 12;

  let svgEl = null;
  let tubeEls = [];
  let ctx = null;
  let strikeTimer = null;
  let on = false;
  let currentKmh = null;
  let shown = false;

  function buildSVG() {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("class", "wc-chimes");
    svg.setAttribute("viewBox", "0 0 212 116");
    svg.setAttribute("aria-hidden", "true");
    const bar = document.createElementNS(ns, "line");
    bar.setAttribute("x1", "16");
    bar.setAttribute("y1", String(BAR_Y));
    bar.setAttribute("x2", "196");
    bar.setAttribute("y2", String(BAR_Y));
    bar.setAttribute("class", "wc-bar");
    svg.appendChild(bar);
    TUBES.forEach(function (t) {
      const string = document.createElementNS(ns, "line");
      string.setAttribute("x1", String(t.x));
      string.setAttribute("y1", String(BAR_Y));
      string.setAttribute("x2", String(t.x));
      string.setAttribute("y2", String(BAR_Y + 14));
      string.setAttribute("class", "wc-string");
      svg.appendChild(string);
      const tube = document.createElementNS(ns, "rect");
      tube.setAttribute("x", String(t.x - 3.5));
      tube.setAttribute("y", String(BAR_Y + 14));
      tube.setAttribute("width", "7");
      tube.setAttribute("height", String(t.len));
      tube.setAttribute("rx", "3");
      tube.setAttribute("class", "wc-tube");
      svg.appendChild(tube);
      tubeEls.push(tube);
    });
    wrap.insertBefore(svg, wrap.firstChild);
    svgEl = svg;
  }

  /* A short, bright, quickly-decaying bell: a fundamental sine plus a
     quieter partial just under three times its frequency (a real bell
     or tube's overtones aren't a clean harmonic series; this is a
     plain, honest approximation of that, not a measured spectrum). */
  function ring(freq, gainMul) {
    if (!ctx) return;
    const t0 = ctx.currentTime + 0.005;
    [{ f: freq, g: 1 }, { f: freq * 2.76, g: 0.28 }].forEach(function (p) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(p.f, t0);
      const peak = 0.16 * p.g * gainMul;
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(peak, t0 + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + 1.5);
    });
  }

  function struck(el) {
    if (REDUCED) return;
    el.classList.add("wc-struck");
    setTimeout(function () { el.classList.remove("wc-struck"); }, 260);
  }

  function strike() {
    const kmh = currentKmh === null ? 0 : currentKmh;
    /* Calm air nudges one tube softly; a real gust catches several at
       once. Both the count and the volume scale with the live
       reading, capped so a gale doesn't just distort. */
    const two = Math.random() < Math.min(0.7, kmh / 30);
    const three = two && Math.random() < Math.min(0.4, kmh / 55);
    const n = three ? 3 : (two ? 2 : 1);
    const idxs = [];
    while (idxs.length < n) {
      const i = Math.floor(Math.random() * TUBES.length);
      if (idxs.indexOf(i) === -1) idxs.push(i);
    }
    const gainMul = Math.min(1.4, 0.55 + kmh * 0.022);
    idxs.forEach(function (i) {
      ring(TUBES[i].freq, gainMul);
      struck(tubeEls[i]);
    });
  }

  function nextDelay() {
    const kmh = currentKmh === null ? 0 : currentKmh;
    /* A calm reading rings every 7-14s or so; a strong gust, closer
       to every 1-2s. Picked for a pleasant tab, not measured — the
       one honest fact underneath is the km/h itself. */
    const base = Math.max(1, 8 - kmh * 0.22);
    return (base * (0.6 + Math.random() * 0.8)) * 1000;
  }

  function scheduleNext() {
    strikeTimer = setTimeout(function () {
      strike();
      if (on) scheduleNext();
    }, nextDelay());
  }

  function stopChiming() {
    on = false;
    if (strikeTimer !== null) { clearTimeout(strikeTimer); strikeTimer = null; }
    toggle.textContent = "Hang the chimes";
    toggle.setAttribute("aria-pressed", "false");
    status.textContent = "";
  }

  function startChiming() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    on = true;
    toggle.textContent = "Let the chimes rest";
    toggle.setAttribute("aria-pressed", "true");
    status.textContent = REDUCED
      ? "Ringing on the real wind reading above. Your browser asked for less motion, so the tubes hold still, but the sound is live."
      : "Ringing on the real wind reading above — softer and rarer when it's calm, quicker and fuller when it isn't.";
    scheduleNext();
  }

  toggle.addEventListener("click", function () {
    if (on) stopChiming(); else startChiming();
  });

  window.addEventListener("freebot:wind", function (e) {
    currentKmh = e.detail && typeof e.detail.kmh === "number" ? e.detail.kmh : null;
    if (!shown) {
      if (!svgEl) buildSVG();
      wrap.hidden = false;
      shown = true;
    }
  });

  window.addEventListener("freebot:wind-stop", function () {
    stopChiming();
    currentKmh = null;
    wrap.hidden = true;
    shown = false;
  });
})();
