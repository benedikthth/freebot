// freebot.dev — /buzz
// A Solanum-type flower (tomato, potato, nightshade family) with a
// poricidal anther cone: pollen sealed inside a tube, reachable only
// through a small tip pore. Grip the cone yourself, or send a
// bumblebee (grabs on, decouples her wings, fires her flight muscles)
// or a honeybee (lands, never grips, never buzzes) — the real
// asymmetry De Luca & Vallejo-Marín 2013 and King & Buchmann 2003
// describe. See /buzz's own citation paragraph for both papers.
//
// What's real: the 15,000–20,000-species scale, the grip-and-decouple
// mechanism, the 1–17 pulses per bout with the first two clearing up
// to 60% and each pulse after returning under 10%, the 100–400 Hz
// fundamental range capped by insect flight-muscle physics, the
// finding that varying frequency alone had a negligible effect on
// pollen release, and honeybees' documented failure to sonicate at
// all. What's illustrative: the exact per-pulse curve below (a model
// of that qualitative pattern, not a plotted dataset), the uniform
// draw across each cited range rather than a real distribution, and
// every timing and pixel here — same disclosed liberty /pod and
// /cone already take with real but compressed clocks.
//
// No date, no rng() plant.js could ever touch — only Math.random()
// and a visitor's own click, the same undated toy-randomness /pod
// and /weeds already use for a mechanism keyed to a click, not a day.
//
// One flower, not a fresh one per bee: `flowerRemaining` tracks what's
// actually still in the anther (100 = untouched) and only resets when
// a visitor clicks "New flower." Each bout removes the same *fraction*
// of whatever's currently there (pulseRelease scales with the stock
// it's given), so successive bumblebee visits each work just as hard
// but come away with a shrinking absolute amount — the plain
// consequence of a shared, finite store. See /buzz's own honest-gap
// paragraph for what that extrapolation does and doesn't claim.
(function () {
  "use strict";

  var svg = document.getElementById("bz-svg");
  var cone = document.getElementById("bz-cone");
  var anther = document.getElementById("bz-anther");
  var pollenGroup = document.getElementById("bz-pollen");
  var hit = document.getElementById("bz-hit");
  var beeBumble = document.getElementById("bz-bee-bumble");
  var beeHoney = document.getElementById("bz-bee-honey");
  var sendBumbleBtn = document.getElementById("bz-send-bumble");
  var sendHoneyBtn = document.getElementById("bz-send-honey");
  var resetBtn = document.getElementById("bz-reset");
  var statusEl = document.getElementById("bz-status");
  var tallyEl = document.getElementById("bz-tally");
  if (!svg || !cone || !hit) return;

  var svgNS = "http://www.w3.org/2000/svg";

  var HOME_BUMBLE = { x: 55, y: 195 };
  var TARGET_BUMBLE = { x: 170, y: 92 }; // gripping the cone, near the pore
  var HOME_HONEY = { x: 285, y: 195 };
  var TARGET_HONEY = { x: 148, y: 54 }; // visiting, never touching the pore

  var TIP = { x: 170, y: 107 };
  var GROUND_Y = 224;
  var FLY_MS = 650;
  var BUZZ_PER_PULSE_MS = 130;

  var reduced = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var busy = false;
  var bumbleVisits = 0, honeyVisits = 0;
  var bumbleHistory = []; // % of what was left, released each visit to this flower
  var flowerRemaining = 100; // % of this flower's original pollen still in the anther
  var returnTimer = null;

  // The stock above outlives one bee visit; it used to reset on the
  // very next page load anyway, since it only ever lived in a JS
  // variable. Same fix as /stir's own saved run (2026-09-03): one
  // flower per browser now survives a refresh too, until "New flower"
  // clears it same as it clears the tally.
  var STORAGE_KEY = "fb-buzz-flower-v1";

  function saveFlower() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        bumbleVisits: bumbleVisits, honeyVisits: honeyVisits,
        bumbleHistory: bumbleHistory, flowerRemaining: flowerRemaining
      }));
    } catch (e) { /* private browsing, quota, or no storage — this flower just won't keep */ }
  }

  function loadFlower() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var s = JSON.parse(raw);
      if (!s || typeof s.flowerRemaining !== "number" || !Array.isArray(s.bumbleHistory)) return null;
      return s;
    } catch (e) { return null; }
  }

  function rand(min, max) { return min + Math.random() * (max - min); }
  function smoothstep(t) { return t * t * (3 - 2 * t); }

  function place(g, x, y) {
    g.setAttribute("transform", "translate(" + x.toFixed(1) + "," + y.toFixed(1) + ")");
  }

  function flyTo(g, from, to, onDone) {
    if (reduced) { place(g, to.x, to.y); onDone(); return; }
    var start = null;
    function frame(ts) {
      if (start === null) start = ts;
      var t = Math.min(1, (ts - start) / FLY_MS);
      var e = smoothstep(t);
      place(g, from.x + (to.x - from.x) * e, from.y + (to.y - from.y) * e);
      if (t < 1) requestAnimationFrame(frame);
      else onDone();
    }
    requestAnimationFrame(frame);
  }

  function setStatus(text) { if (statusEl) statusEl.textContent = text; }

  function setTally() {
    if (!tallyEl) return;
    if (!bumbleVisits && !honeyVisits) { tallyEl.textContent = ""; return; }
    var bits = [];
    if (bumbleVisits) {
      var shown = bumbleHistory.slice(-8);
      var curve = (bumbleHistory.length > shown.length ? "… → " : "") +
        shown.map(function (v) { return v + "%"; }).join(" → ");
      bits.push(bumbleVisits + " bumblebee visit" + (bumbleVisits === 1 ? "" : "s") +
        " to this flower: " + curve + " of what was left, each time — " +
        Math.round(flowerRemaining) + "% of its original pollen remains");
    }
    if (honeyVisits) {
      bits.push(honeyVisits + " honeybee visit" + (honeyVisits === 1 ? "" : "s") +
        ", 0% released, every time");
    }
    tallyEl.textContent = bits.join(" · ") + ".";
  }

  // Percent of the flower's ORIGINAL pollen removed this bout, given
  // `stock` (0-100) still in the anther when the bout starts. Scales
  // linearly with stock, so a bee visiting a half-empty flower clears
  // the same fraction of what's left as one visiting a full flower —
  // the fraction doesn't diminish, the absolute amount does.
  function pulseRelease(pulses, stock) {
    var remaining = stock, released = 0, take;
    for (var p = 1; p <= pulses; p++) {
      if (p === 1) take = stock * 0.35;
      else if (p === 2) take = stock * 0.25;
      else take = remaining * 0.08;
      take = Math.min(take, remaining);
      released += take;
      remaining -= take;
    }
    return released;
  }

  function updateAntherVisual() {
    if (!anther) return;
    var frac = Math.max(0, Math.min(1, flowerRemaining / 100));
    anther.style.opacity = (0.35 + 0.65 * frac).toFixed(2);
  }

  function spawnPollen(count) {
    for (var i = 0; i < count; i++) {
      (function () {
        var g = document.createElementNS(svgNS, "circle");
        g.setAttribute("r", "2");
        g.setAttribute("class", "bz-grain");
        g.setAttribute("cx", TIP.x.toFixed(1));
        g.setAttribute("cy", TIP.y.toFixed(1));
        pollenGroup.appendChild(g);

        var dx = rand(-26, 26);
        var dur = rand(500, 850);
        if (reduced) {
          g.setAttribute("cx", (TIP.x + dx).toFixed(1));
          g.setAttribute("cy", GROUND_Y.toFixed(1));
          return;
        }
        var start = null;
        function frame(ts) {
          if (start === null) start = ts;
          var t = Math.min(1, (ts - start) / dur);
          var y = TIP.y + smoothstep(t) * (GROUND_Y - TIP.y);
          var x = TIP.x + dx * smoothstep(t);
          g.setAttribute("cx", x.toFixed(1));
          g.setAttribute("cy", y.toFixed(1));
          if (t < 1) requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
      })();
    }
  }

  function buzzCone(pulses, onDone) {
    var ms = reduced ? 0 : Math.min(1600, pulses * BUZZ_PER_PULSE_MS);
    cone.classList.add("bz-buzzing");
    setTimeout(function () {
      cone.classList.remove("bz-buzzing");
      onDone();
    }, ms);
  }

  function scheduleReturn(g, home) {
    returnTimer = setTimeout(function () {
      flyTo(g, { x: parseFloat(g.getAttribute("transform").match(/[-\d.]+/g)[0]),
                 y: parseFloat(g.getAttribute("transform").match(/[-\d.]+/g)[1]) },
        home, function () { busy = false; });
    }, 1400);
  }

  function doBumble(viaHit) {
    if (busy) return;
    busy = true;
    var pulses = 1 + Math.floor(Math.random() * 17); // 1–17, the review's own cited range
    var freq = Math.round(rand(100, 400));
    var stockBefore = flowerRemaining;
    var releasedAbs = pulseRelease(pulses, stockBefore);
    var releasedOfAvailable = stockBefore > 0 ? Math.round(releasedAbs / stockBefore * 100) : 0;
    flowerRemaining = Math.max(0, stockBefore - releasedAbs);

    function afterGrip() {
      buzzCone(pulses, function () {
        var grains = releasedAbs > 0.05 ? Math.max(1, Math.min(10, Math.round(releasedAbs / 10))) : 0;
        spawnPollen(grains);
        bumbleVisits++;
        bumbleHistory.push(releasedOfAvailable);
        updateAntherVisual();
        if (stockBefore < 0.5) {
          setStatus((viaHit ? "you grip the emptied cone: " : "bumblebee: grabs on, ") +
            "nothing left to shake loose. This flower is spent.");
        } else {
          setStatus((viaHit ? "you grip the cone yourself: " : "bumblebee: grabbed on, ") +
            pulses + " pulse" + (pulses === 1 ? "" : "s") + " at ~" + freq +
            " Hz, released " + releasedOfAvailable + "% of what was left — " +
            Math.round(flowerRemaining) + "% of the flower's pollen remains.");
        }
        setTally();
        saveFlower();
        if (viaHit) { busy = false; }
        else scheduleReturn(beeBumble, HOME_BUMBLE);
      });
    }

    if (viaHit) { afterGrip(); return; }
    setStatus("a bumblebee flies in.");
    flyTo(beeBumble, HOME_BUMBLE, TARGET_BUMBLE, afterGrip);
  }

  function doHoney() {
    if (busy) return;
    busy = true;
    setStatus("a honeybee flies in.");
    flyTo(beeHoney, HOME_HONEY, TARGET_HONEY, function () {
      honeyVisits++;
      setStatus("honeybee: landed, walked the petals, never gripped the anther. " +
        "0% released — she can vibrate fast enough, she just never does this.");
      setTally();
      saveFlower();
      scheduleReturn(beeHoney, HOME_HONEY);
    });
  }

  hit.addEventListener("click", function () { doBumble(true); });
  hit.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); doBumble(true); }
  });

  beeBumble.addEventListener("click", function () { doBumble(false); });
  beeBumble.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); doBumble(false); }
  });
  beeHoney.addEventListener("click", doHoney);
  beeHoney.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); doHoney(); }
  });

  if (sendBumbleBtn) sendBumbleBtn.addEventListener("click", function () { doBumble(false); });
  if (sendHoneyBtn) sendHoneyBtn.addEventListener("click", doHoney);

  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      if (returnTimer) { clearTimeout(returnTimer); returnTimer = null; }
      cone.classList.remove("bz-buzzing");
      pollenGroup.textContent = "";
      place(beeBumble, HOME_BUMBLE.x, HOME_BUMBLE.y);
      place(beeHoney, HOME_HONEY.x, HOME_HONEY.y);
      busy = false;
      bumbleVisits = 0; honeyVisits = 0; bumbleHistory = [];
      flowerRemaining = 100;
      updateAntherVisual();
      setStatus("waiting for a visitor.");
      setTally();
      try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* nothing to clear */ }
    });
  }

  (function restoreFlower() {
    var s = loadFlower();
    if (s) {
      bumbleVisits = s.bumbleVisits || 0;
      honeyVisits = s.honeyVisits || 0;
      bumbleHistory = s.bumbleHistory;
      flowerRemaining = s.flowerRemaining;
      if (bumbleVisits || honeyVisits) {
        setStatus(flowerRemaining < 0.5 ?
          "welcome back — this flower is already spent." :
          "welcome back — " + Math.round(flowerRemaining) + "% of this flower's pollen remains.");
      }
    }
    place(beeBumble, HOME_BUMBLE.x, HOME_BUMBLE.y);
    place(beeHoney, HOME_HONEY.x, HOME_HONEY.y);
    updateAntherVisual();
    setTally();
  })();
})();
