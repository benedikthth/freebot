// freebot.dev — /pyrenoid
// A real 2026 finding, turned into a toggle instead of a paragraph:
// hornwort Rubisco carries an extra tail on its small subunit (Li lab,
// Boyce Thompson Institute, named it STAR) whose own coiled-coil end
// self-sticks, and that alone is enough to condense free-floating
// Rubisco into a pyrenoid — the dense, CO2-concentrating clump every
// alga builds but almost no land plant does. See /pyrenoid for the
// full account and its own honest gaps.
//
// No date, no rng() any other file could ever read — this is a
// generic point-aggregation model, not a draw from plant.js's,
// organism.js's, or bird.js's seeded streams. Same standing as
// fireflies.js and veins.js: a visitor's own clicks and the checkbox,
// nothing else.
(function () {
  "use strict";

  var svg = document.getElementById("pyr-svg");
  var group = document.getElementById("pyr-enzymes");
  var caption = document.getElementById("pyr-caption");
  var statusEl = document.getElementById("pyr-status");
  var toggle = document.getElementById("pyr-star-toggle");
  var addBtn = document.getElementById("pyr-add");
  var resetBtn = document.getElementById("pyr-reset");
  var meterFill = document.getElementById("pyr-meter-fill");
  var meterValue = document.getElementById("pyr-meter-value");
  if (!svg || !group) return;

  var svgNS = "http://www.w3.org/2000/svg";
  var CX = 150, CY = 135, R = 112; /* chloroplast membrane the model bounces particles off */
  var MAX = 50;
  var RADIUS = 3.6; /* one enzyme's own drawn radius */
  var TICK_MS = 16.7; /* one animation tick at 60fps — every constant below is tuned per tick, not per millisecond, so step() normalizes real dt against this before using them */
  var JITTER = 0.55; /* px of random acceleration per tick, always on — the ordinary thermal jostling every dissolved protein gets, tail or no tail */
  var DAMP = 0.88; /* velocity decay per tick, keeps the jitter from ever building into a runaway drift */
  var ATTRACT_R = 70; /* how far one enzyme can "feel" another — only meaningful once the tail is on */
  var ATTRACT_K = 0.018; /* spring-toward-neighbor strength once within ATTRACT_R, tuned only so clustering finishes in a browser tab's patience, not measured from the paper's own kinetics (see the room's own honest-gap paragraph) */
  var MIN_DIST = RADIUS * 2.1; /* soft floor once two enzymes are this close — keeps a "clump" from collapsing into one overlapping point */
  var REPEL_K = 0.05;

  var enzymes = [];
  var star = false;
  var lastT = null;

  function rand(min, max) { return min + Math.random() * (max - min); }

  function randomPointInDisc() {
    var a = Math.random() * Math.PI * 2;
    var r = R * 0.92 * Math.sqrt(Math.random()); /* sqrt so points land uniformly by area, not bunched at the center */
    return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) };
  }

  function addEnzyme() {
    if (enzymes.length >= MAX) return false;
    var p = randomPointInDisc();
    var e = { x: p.x, y: p.y, vx: rand(-0.02, 0.02), vy: rand(-0.02, 0.02) };
    var c = document.createElementNS(svgNS, "circle");
    c.setAttribute("r", String(RADIUS));
    c.setAttribute("class", "pyr-enzyme");
    group.appendChild(c);
    e.el = c;
    enzymes.push(e);
    return true;
  }

  function addTen() {
    var added = 0;
    for (var i = 0; i < 10; i++) { if (addEnzyme()) added++; }
    setStatus(enzymes.length + " of " + MAX + " enzymes" + (enzymes.length >= MAX ? " — this stroma is full. Reset to start over." : "."));
  }

  function setStatus(text) { if (statusEl) statusEl.textContent = text; }

  function step(k) {
    var n = enzymes.length;
    if (!n) return;
    var damp = Math.pow(DAMP, k); /* Math.pow so a slower or faster tab still damps at the same real-time rate, not a per-frame one */
    var i, j, e, o, dx, dy, dist, ax, ay;
    for (i = 0; i < n; i++) {
      e = enzymes[i];
      ax = rand(-1, 1) * JITTER;
      ay = rand(-1, 1) * JITTER;
      if (star) {
        for (j = 0; j < n; j++) {
          if (j === i) continue;
          o = enzymes[j];
          dx = o.x - e.x; dy = o.y - e.y;
          dist = Math.sqrt(dx * dx + dy * dy) || 0.0001;
          if (dist < MIN_DIST) {
            /* too close — the tail sticks enzymes together, it doesn't
               fuse them, so push apart softly once they'd otherwise
               overlap */
            ax -= (dx / dist) * REPEL_K * (MIN_DIST - dist);
            ay -= (dy / dist) * REPEL_K * (MIN_DIST - dist);
          } else if (dist < ATTRACT_R) {
            ax += (dx / dist) * ATTRACT_K * (dist - MIN_DIST);
            ay += (dy / dist) * ATTRACT_K * (dist - MIN_DIST);
          }
        }
      }
      e.vx = (e.vx + ax * k) * damp;
      e.vy = (e.vy + ay * k) * damp;
      e.x += e.vx * k;
      e.y += e.vy * k;
      /* reflect off the chloroplast's own membrane */
      dx = e.x - CX; dy = e.y - CY;
      dist = Math.sqrt(dx * dx + dy * dy);
      var limit = R - RADIUS;
      if (dist > limit) {
        var nx = dx / dist, ny = dy / dist;
        e.x = CX + nx * limit;
        e.y = CY + ny * limit;
        var vDotN = e.vx * nx + e.vy * ny;
        e.vx -= 2 * vDotN * nx;
        e.vy -= 2 * vDotN * ny;
      }
    }
  }

  function render() {
    for (var i = 0; i < enzymes.length; i++) {
      var e = enzymes[i];
      e.el.setAttribute("cx", e.x.toFixed(2));
      e.el.setAttribute("cy", e.y.toFixed(2));
    }
  }

  /* Concentration meter — this page's own measurement, disclosed on
     the page itself as illustrative, not a real CO2 reading. Radius of
     gyration (mean distance from the group's own centroid), turned
     into a 0-100% reading against a fully scattered cloud (roughly R
     * 0.5, the expected spread of points drawn uniformly across the
     disc) so denser is always a bigger number regardless of where the
     clump happens to settle. */
  var lastPct = -1, lastUpdate = 0;
  var SCATTER_SPREAD = R * 0.5;
  var LOW = [0x8a, 0xa0, 0x6a], HIGH = [0x2f, 0x6b, 0x3a];

  function lerpColor(a, b, t) {
    return "rgb(" + Math.round(a[0] + (b[0] - a[0]) * t) + "," +
      Math.round(a[1] + (b[1] - a[1]) * t) + "," +
      Math.round(a[2] + (b[2] - a[2]) * t) + ")";
  }

  function renderMeter(t) {
    if (!meterFill || !meterValue) return;
    var n = enzymes.length;
    if (!n) {
      if (lastPct !== -1) {
        meterFill.style.width = "0%";
        meterFill.style.background = lerpColor(LOW, HIGH, 0);
        meterValue.textContent = "—";
        lastPct = -1;
      }
      return;
    }
    var cx = 0, cy = 0, i;
    for (i = 0; i < n; i++) { cx += enzymes[i].x; cy += enzymes[i].y; }
    cx /= n; cy /= n;
    var sum = 0;
    for (i = 0; i < n; i++) {
      var dx = enzymes[i].x - cx, dy = enzymes[i].y - cy;
      sum += Math.sqrt(dx * dx + dy * dy);
    }
    var spread = sum / n;
    var frac = 1 - Math.min(1, spread / SCATTER_SPREAD);
    var pct = Math.round(Math.max(0, frac) * 100);
    meterFill.style.width = pct + "%";
    meterFill.style.background = lerpColor(LOW, HIGH, frac);
    if (pct !== lastPct && t - lastUpdate > 250) {
      meterValue.textContent = pct + "%";
      lastPct = pct;
      lastUpdate = t;
      if (caption) {
        caption.textContent = !star
          ? "Scattered, ordinary Rubisco — no pyrenoid, no clump."
          : pct >= 85
            ? "Condensed into one dense body — this is the pyrenoid."
            : "Condensing — the STAR tail is pulling enzymes together.";
      }
    }
  }

  function frame(t) {
    if (lastT === null) lastT = t;
    var dt = Math.min(t - lastT, 100);
    lastT = t;
    if (!document.hidden) {
      step(dt / TICK_MS);
      render();
    }
    renderMeter(t);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  if (toggle) {
    toggle.addEventListener("change", function () {
      star = toggle.checked;
      if (caption) {
        caption.textContent = star
          ? "Condensing — the STAR tail is pulling enzymes together."
          : "Scattered, ordinary Rubisco — no pyrenoid, no clump.";
      }
    });
  }
  if (addBtn) addBtn.addEventListener("click", addTen);
  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      enzymes = [];
      group.textContent = "";
      if (toggle) { toggle.checked = false; star = false; }
      if (caption) caption.textContent = "Scattered, ordinary Rubisco — no pyrenoid, no clump.";
      setStatus("Stroma cleared. Add enzymes to start again.");
      if (meterFill) { meterFill.style.width = "0%"; meterFill.style.background = lerpColor(LOW, HIGH, 0); }
      if (meterValue) meterValue.textContent = "—";
      lastPct = -1;
    });
  }

  addTen();
  addTen();
  setStatus(enzymes.length + " of " + MAX + " enzymes — check STAR tail to watch them condense.");
})();
