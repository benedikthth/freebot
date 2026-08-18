// freebot.dev — /fireflies
// A real phenomenon this site had no fauna-in-motion room for yet:
// Photinus carolinus, a firefly native to the southern Appalachians,
// synchronizes its flashing with thousands of others across a whole
// meadow for about two weeks each summer. Each firefly here starts on
// its own random clock — click (or tab to "Add a firefly" and press
// it) to add one, at a random flash period of its own. Watch long
// enough and the flashes stop being scattered.
//
// The mechanism drawn here is the classic pulse-coupled oscillator
// model: Mirollo & Strogatz (1990, SIAM J. Applied Math.) proved that
// a population of identical relaxation oscillators, each nudging every
// other oscillator's own clock forward a little whenever it fires,
// always converges to firing together — the same abstract model used
// for cardiac pacemaker cells, not invented for fireflies but applied
// to them. Buck & Buck's field studies (1968, Science) on a related
// Southeast Asian species first described the behavior this models;
// Moiseff & Copeland (2010, Science) proposed why it's adaptive at
// all — synchronized flashing helps a female pick her own species'
// flash pattern out of a meadow's visual clutter rather than getting
// lost in the noise of hundreds of unsynchronized males.
//
// No date, no rng() draw plant.js, organism.js, or bird.js could ever
// read — this file has no seed of its own to protect, only a
// visitor's own clicks and the clock, same discipline touch.js keeps.
(function () {
  "use strict";

  var svg = document.getElementById("ff-svg");
  var group = document.getElementById("ff-bugs");
  var statusEl = document.getElementById("ff-status");
  var addBtn = document.getElementById("ff-add");
  var scatterBtn = document.getElementById("ff-scatter");
  var resetBtn = document.getElementById("ff-reset");
  var syncFill = document.getElementById("ff-sync-fill");
  var syncValue = document.getElementById("ff-sync-value");
  if (!svg || !group) return;

  var svgNS = "http://www.w3.org/2000/svg";
  var W = 600, H = 220;
  var MAX = 30;
  var COUPLING = 0.045; /* fraction of a firefly's own period it gets nudged forward, once, on any tick where at least one other firefly flashed — the one free parameter Mirollo-Strogatz's proof allows */
  var PERIOD_MIN = 900, PERIOD_MAX = 1500; /* ms; real Photinus carolinus flash trains repeat roughly every 1-2s in the wild */
  var REFRACTORY_MS = 150; /* a firefly that just flashed ignores the next 150ms of nudges and can't re-cross its own threshold before then — without this, a crowd converging at almost the same instant can shove a straggler's phase far enough past the line to trigger a second flash within the same round, and the "one pulse" this room is built to show degrades into a flicker */

  var fireflies = [];
  var lastT = null;

  function rand(min, max) { return min + Math.random() * (max - min); }

  function addFirefly(x, y) {
    if (fireflies.length >= MAX) {
      setStatus(fireflies.length + " fireflies — that is as many as this meadow holds. Reset to start over.");
      return;
    }
    var period = rand(PERIOD_MIN, PERIOD_MAX);
    var f = {
      period: period,
      phase: Math.random() * period, /* starts on its own random clock, on purpose */
      sinceFlash: REFRACTORY_MS /* eligible to flash or be nudged immediately */
    };
    var g = document.createElementNS(svgNS, "g");
    g.setAttribute("class", "ff-bug");
    var halo = document.createElementNS(svgNS, "circle");
    halo.setAttribute("cx", x); halo.setAttribute("cy", y);
    halo.setAttribute("r", "11"); halo.setAttribute("class", "ff-halo");
    var core = document.createElementNS(svgNS, "circle");
    core.setAttribute("cx", x); core.setAttribute("cy", y);
    core.setAttribute("r", "2.4"); core.setAttribute("class", "ff-core");
    g.appendChild(halo); g.appendChild(core);
    group.appendChild(g);
    f.el = g;
    fireflies.push(f);
    setStatus(fireflies.length + " of " + MAX + " fireflies — click the meadow, or press Add, for more.");
  }

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text;
  }

  function flash(f) {
    f.el.classList.add("flash");
    setTimeout(function () { f.el.classList.remove("flash"); }, 260);
  }

  function step(dt) {
    var justFlashed = [];
    for (var i = 0; i < fireflies.length; i++) {
      var f = fireflies[i];
      f.phase += dt;
      f.sinceFlash += dt;
      if (f.phase >= f.period && f.sinceFlash >= REFRACTORY_MS) justFlashed.push(i);
    }
    if (justFlashed.length === 0) return;
    /* Every firefly that just crossed its own threshold flashes and
       resets; every firefly that did not, and isn't still in its own
       refractory window, gets nudged toward its own next flash — the
       "pulse coupling" Mirollo-Strogatz's proof depends on. The nudge
       is applied once per tick, not once per flash seen that tick: an
       earlier version scaled it by how many fireflies flashed
       together, which let a near-synchronized crowd shove its last
       stragglers clean past their own threshold and into a
       self-sustaining flicker instead of settling into one pulse. */
    for (var k = 0; k < fireflies.length; k++) {
      if (justFlashed.indexOf(k) !== -1) continue;
      if (fireflies[k].sinceFlash < REFRACTORY_MS) continue;
      var nudged = fireflies[k].phase + fireflies[k].period * COUPLING;
      fireflies[k].phase = Math.min(nudged, fireflies[k].period);
    }
    justFlashed.forEach(function (idx) {
      var f = fireflies[idx];
      f.phase = 0;
      f.sinceFlash = 0;
      flash(f);
    });
  }

  /* Synchrony meter. The mechanism above is Mirollo-Strogatz pulse
     coupling, not the sinusoidal Kuramoto model — but Kuramoto's own
     order parameter (Kuramoto, 1975) is the standard way the wider
     synchronization literature measures how coherent any population of
     oscillators has become, mechanism aside, and Strogatz himself later
     wrote the bridge between the two frameworks (Strogatz, "From
     Kuramoto to Crawford," Physica D, 2000). Borrowed here purely as a
     read-only diagnostic: each firefly's progress through its own
     period (phase / period, 0..1) is mapped onto a point on the unit
     circle, and the meter is the length of those points' average
     vector — 1 if every firefly sits at the identical fraction of its
     own cycle, 0 if they're scattered evenly around it. Nothing here
     feeds back into step(); the meter only ever reads the state that
     function already produced. */
  var lastSyncPct = -1, lastSyncUpdate = 0;

  /* The bar used to be one fixed hue (#eaf28a, the same yellow as a
     firefly's own core and halo) at every synchrony level, so a reader
     had to look at the number to tell 5% from 95%. It now tints along
     r itself — dim unsynced slate (#4a5578, the CSS default above,
     picked to sit near the card's own #131b2e/#232c40 palette rather
     than invent a new one) at r=0, climbing to that same firefly glow
     yellow at r=1 — so the bar itself, not just its width or the text
     beside it, reads as the meadow converging. Plain linear RGB lerp;
     r (0..1, not the rounded pct) drives it so the tint moves as
     smoothly as the width already does. */
  var SYNC_LOW = [0x4a, 0x55, 0x78], SYNC_HIGH = [0xea, 0xf2, 0x8a];
  function lerpColor(a, b, t) {
    return "rgb(" + Math.round(a[0] + (b[0] - a[0]) * t) + "," +
      Math.round(a[1] + (b[1] - a[1]) * t) + "," +
      Math.round(a[2] + (b[2] - a[2]) * t) + ")";
  }

  function renderSync(t) {
    if (!syncFill || !syncValue) return;
    if (fireflies.length === 0) {
      if (lastSyncPct !== -1) {
        syncFill.style.width = "0%";
        syncFill.style.background = lerpColor(SYNC_LOW, SYNC_HIGH, 0);
        syncValue.textContent = "—";
        lastSyncPct = -1;
      }
      return;
    }
    var sumCos = 0, sumSin = 0;
    for (var i = 0; i < fireflies.length; i++) {
      var theta = (fireflies[i].phase / fireflies[i].period) * 2 * Math.PI;
      sumCos += Math.cos(theta);
      sumSin += Math.sin(theta);
    }
    var n = fireflies.length;
    var r = Math.sqrt(sumCos * sumCos + sumSin * sumSin) / n;
    var pct = Math.round(r * 100);
    syncFill.style.width = pct + "%"; /* the bar itself can move every frame, smoothly */
    syncFill.style.background = lerpColor(SYNC_LOW, SYNC_HIGH, r); /* every frame too, same as width — r itself, not the throttled/rounded pct below */
    /* the text is throttled so it neither spams aria-live nor thrashes
       layout every animation frame — a real change, read a few times a
       second, not a number twitching in place */
    if (pct !== lastSyncPct && t - lastSyncUpdate > 250) {
      syncValue.textContent = pct + "%";
      lastSyncPct = pct;
      lastSyncUpdate = t;
    }
  }

  /* Anticipation glow. Neither flash() nor step() gives a firefly any
     visible state between one flash and the next — the meadow reads
     as converged only at the instant of a shared burst, then goes
     dark again until the next one. This reads out how close each
     firefly sits to its own next flash (phase / period, the same
     fraction renderSync() already turns into a phase angle) as a
     gradual rise in glow, so a nearly-locked meadow visibly breathes
     together in the gap between bursts too, not just at the peak.
     Real Photinus carolinus give no such warning — a flash is a
     sudden on, not a ramp — so this is disclosed on the page itself
     as a legibility aid, not a modeled behavior. Written as CSS custom
     properties, not inline opacity, so the .flash class rule (a more
     specific selector) still wins outright the instant a firefly
     actually fires; this never fights that transition, only fills the
     quiet stretch before it. */
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  function renderAnticipation() {
    for (var i = 0; i < fireflies.length; i++) {
      var f = fireflies[i];
      var p = f.phase / f.period; /* 0 right after a flash, approaches 1 just before the next */
      var coreT = clamp01((p - 0.55) / 0.45);
      var haloT = clamp01((p - 0.65) / 0.35);
      f.el.style.setProperty("--ff-core-glow", (0.16 + 0.34 * coreT * coreT).toFixed(3));
      f.el.style.setProperty("--ff-halo-glow", (0.14 * haloT * haloT * haloT).toFixed(3));
    }
  }

  function frame(t) {
    if (lastT === null) lastT = t;
    var dt = t - lastT;
    lastT = t;
    if (!document.hidden && fireflies.length) {
      dt = Math.min(dt, 100); /* a backgrounded tab shouldn't dump a huge dt in on return */
      step(dt);
      renderAnticipation();
    }
    renderSync(t);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame); /* one loop, started once; step() is a no-op with zero fireflies */

  function svgPoint(clientX, clientY) {
    var rect = svg.getBoundingClientRect();
    var x = ((clientX - rect.left) / rect.width) * W;
    var y = ((clientY - rect.top) / rect.height) * H;
    return { x: Math.max(8, Math.min(W - 8, x)), y: Math.max(8, Math.min(H - 8, y)) };
  }

  svg.addEventListener("click", function (e) {
    var p = svgPoint(e.clientX, e.clientY);
    addFirefly(p.x, p.y);
  });

  if (addBtn) {
    addBtn.addEventListener("click", function () {
      addFirefly(rand(30, W - 30), rand(30, H - 30));
    });
  }
  if (scatterBtn) {
    scatterBtn.addEventListener("click", function () {
      for (var i = 0; i < 8; i++) addFirefly(rand(30, W - 30), rand(30, H - 30));
    });
  }
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      fireflies = [];
      group.textContent = "";
      setStatus("Meadow cleared. Click it, or press Add, to start again.");
      /* set the meter directly rather than waiting on renderSync()'s
         next frame — its own empty-state branch only redraws when
         lastSyncPct has changed *away* from -1, so leaving that to the
         next tick would ship a real bug: the bar and number would keep
         showing the last synced reading instead of clearing */
      if (syncFill) { syncFill.style.width = "0%"; syncFill.style.background = lerpColor(SYNC_LOW, SYNC_HIGH, 0); }
      if (syncValue) syncValue.textContent = "—";
      lastSyncPct = -1;
    });
  }

  setStatus("Click the meadow, or press Add, to place a firefly.");
})();
