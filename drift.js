// freebot.dev — /drift
// A paper boat, folded on request and set on a fixed river path. Not a
// mechanism to explain and not a game to win — see /drift for why that's
// a deliberate third shape, next to every other room's "watch this" or
// "beat your own score." Nothing here is measured against a source,
// timed against a clock, or written to storage; it exists for exactly
// as long as it's on screen.
//
// No rng() plant.js could ever read, no date. A boat's fall speed and
// sideways sway both come from plain Math.random() — the same undated
// toy register ball.js and glean.js already use for a thing that isn't
// claimed to be real.
(function () {
  "use strict";

  var SVGNS = "http://www.w3.org/2000/svg";
  var svg = document.getElementById("dr-svg");
  var water = document.getElementById("dr-water");
  var boatsLayer = document.getElementById("dr-boats");
  var wordInput = document.getElementById("dr-word");
  var launchBtn = document.getElementById("dr-launch");
  var statusEl = document.getElementById("dr-status");
  if (!svg || !water || !boatsLayer || !launchBtn) return;

  var MAX_BOATS = 6;
  var TOTAL_LEN = water.getTotalLength();
  var reduceMotion = !!(window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  var boats = []; // {el, wordEl, start, duration, amp, freq, phase, rockAmp}
  var rafId = null;

  function pointAt(t) {
    var len = Math.max(0, Math.min(TOTAL_LEN, t * TOTAL_LEN));
    return water.getPointAtLength(len);
  }

  function tangentAt(t) {
    var eps = 0.0015;
    var a = pointAt(Math.max(0, t - eps));
    var b = pointAt(Math.min(1, t + eps));
    var dx = b.x - a.x, dy = b.y - a.y;
    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    return { x: dx / len, y: dy / len };
  }

  function buildBoat() {
    var g = document.createElementNS(SVGNS, "g");
    g.setAttribute("class", "dr-boat");
    var hull = document.createElementNS(SVGNS, "path");
    hull.setAttribute("class", "dr-hull");
    hull.setAttribute("d", "M-15,0 L15,0 L9,9 L-9,9 Z");
    g.appendChild(hull);
    var mast = document.createElementNS(SVGNS, "line");
    mast.setAttribute("class", "dr-mast");
    mast.setAttribute("x1", "0"); mast.setAttribute("y1", "0");
    mast.setAttribute("x2", "0"); mast.setAttribute("y2", "-24");
    g.appendChild(mast);
    var sail = document.createElementNS(SVGNS, "path");
    sail.setAttribute("class", "dr-sail");
    sail.setAttribute("d", "M0,-24 L0,-2 L16,-13 Z");
    g.appendChild(sail);
    return g;
  }

  function launch() {
    if (boats.length >= MAX_BOATS) {
      if (statusEl) statusEl.textContent = MAX_BOATS + " boats already drifting — wait for one to reach the mist.";
      return;
    }
    var word = (wordInput && wordInput.value ? wordInput.value : "").trim().slice(0, 16);
    var g = buildBoat();
    if (word) {
      var text = document.createElementNS(SVGNS, "text");
      text.setAttribute("class", "dr-word");
      text.setAttribute("x", "2");
      text.setAttribute("y", "-11");
      text.setAttribute("font-family", "'IBM Plex Mono', ui-monospace, monospace");
      text.setAttribute("font-size", "6.2");
      text.textContent = word;
      g.appendChild(text);
    }
    boatsLayer.appendChild(g);
    if (wordInput) wordInput.value = "";

    boats.push({
      el: g,
      start: performance.now(),
      duration: 15000 + Math.random() * 9000,
      amp: 6 + Math.random() * 7,
      freq: 2 + Math.random() * 2,
      phase: Math.random() * Math.PI * 2,
      rockAmp: reduceMotion ? 0 : 5 + Math.random() * 4
    });

    if (statusEl) {
      statusEl.textContent = boats.length === 1 ?
        "One boat is drifting." :
        boats.length + " boats are drifting.";
    }
    if (!rafId) rafId = requestAnimationFrame(tick);
  }

  function removeBoat(i) {
    boats[i].el.remove();
    boats.splice(i, 1);
    if (statusEl) {
      statusEl.textContent = boats.length ?
        (boats.length === 1 ? "One boat is drifting." : boats.length + " boats are drifting.") :
        "The water's clear again.";
    }
  }

  function tick(now) {
    for (var i = boats.length - 1; i >= 0; i--) {
      var b = boats[i];
      var t = (now - b.start) / b.duration;
      if (t >= 1) { removeBoat(i); continue; }

      var base = pointAt(t);
      var tan = tangentAt(t);
      var normal = { x: -tan.y, y: tan.x };
      var sway = Math.sin(t * b.freq * Math.PI * 2 + b.phase) * b.amp;
      var x = base.x + normal.x * sway;
      var y = base.y + normal.y * sway;
      var angle = Math.atan2(tan.y, tan.x) * 180 / Math.PI +
        Math.sin(t * b.freq * Math.PI * 4 + b.phase) * b.rockAmp;

      var opacity = 1;
      if (t < 0.04) opacity = t / 0.04;
      else if (t > 0.85) opacity = Math.max(0, (1 - t) / 0.15);
      b.el.setAttribute("transform", "translate(" + x.toFixed(1) + "," + y.toFixed(1) + ") rotate(" + angle.toFixed(1) + ")");
      b.el.setAttribute("opacity", opacity.toFixed(2));
    }
    rafId = boats.length ? requestAnimationFrame(tick) : null;
  }

  launchBtn.addEventListener("click", launch);
  if (wordInput) {
    wordInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter") launch();
    });
  }
})();
