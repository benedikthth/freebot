// freebot.dev — /stir
// A simplified re-creation of Vishton & Bartosh, Cognitive Science
// 49(12): e70161 (2025) — Mimosa pudica seedlings run through a
// repeating light-light-dark cycle (12h light + 12h dark, twice, then
// a full day of dark), filmed for 74 days. After ~5 repetitions,
// dark-hour movement rose in the hours right before an oncoming
// light period, and stayed flat at the same clock position on the
// all-dark third day — then carried over instantly when the cycle
// was compressed from 24 to 20 hours, the paper's own case for
// counting discrete events rather than tracking elapsed time.
//
// What's real: the cycle structure (2× 12L/12D days + 1 all-dark
// day), the ~5-cycle/15-day timeline before the pattern appeared, the
// pre-light movement rise that didn't appear on the dark day, the
// instant 24h→20h generalization, the pooled 18-cups-of-5-seeds
// design, and every hedge quoted in this room's own honest-gap
// paragraph. What's illustrative: the exact per-hour activity curve,
// which models anticipation directly from simulated hours-until-
// light rather than the paper's own fixed pre-dawn clock window —
// see that paragraph for what that substitution does and doesn't
// carry over.
//
// No date, no rng() from plant.js — only Math.random(), the same
// undated toy-randomness /buzz, /pod and /weeds already use for a
// mechanism a visitor drives by clicking, not a day.
(function () {
  "use strict";

  var chart = document.getElementById("st-chart");
  var leafletsGroup = document.getElementById("st-leaflets");
  var statusEl = document.getElementById("st-status");
  var cycleEl = document.getElementById("st-cycle");
  var stepBtn = document.getElementById("st-step");
  var cycleSkipBtn = document.getElementById("st-cycle-skip");
  var playBtn = document.getElementById("st-play");
  var resetBtn = document.getElementById("st-reset");
  var phaseRadios = document.querySelectorAll('input[name="st-phase"]');
  if (!chart || !leafletsGroup || !statusEl) return;

  var svgNS = "http://www.w3.org/2000/svg";
  var reduced = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var HIST_MAX = 96;
  var PRE_LIGHT_WINDOW = 6; // hours; matches the paper's own pre-dawn measurement window
  var TRAIN_CYCLES = 5; // the paper's own reported "five repetitions" before the pattern appeared

  // A trained level earned by clicking through five cycles used to
  // vanish on refresh — the same gap /buzz's own memory plot named and
  // closed for its flower (2026-09-03). Same fix here: the run, not
  // just the visitor's preference, persists in this one browser only,
  // nowhere else, and "Start over" clears it same as it clears the run.
  var STORAGE_KEY = "fb-stir-run-v1";

  function saveRun() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        phase: phase, pendingPhase: pendingPhase, dayLen: dayLen,
        dayIndex: dayIndex, hourInDay: hourInDay, cycleCount: cycleCount,
        history: history
      }));
    } catch (e) { /* private browsing, quota, or no storage — the run just won't persist */ }
  }

  function loadRun() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      var s = JSON.parse(raw);
      if (!s || typeof s.cycleCount !== "number" || !Array.isArray(s.history)) return null;
      return s;
    } catch (e) { return null; }
  }

  // --- simulation state ---
  var phase = 1; // applied phase: 1 = 24h, 2 = 20h, 3 = random 10–32h
  var pendingPhase = 1; // takes effect at the next cycle boundary, not mid-cycle
  var dayLen = 24;
  var dayIndex = 0; // 0 = Day1 (light), 1 = Day2 (light), 2 = Day3 (all dark)
  var hourInDay = 0;
  var cycleCount = 0; // full 3-day cycles completed
  var history = []; // { isLight, activity }
  var playing = false;
  var playTimer = null;

  function rand(min, max) { return min + Math.random() * (max - min); }

  function isLightHour(di, hd, dl) { return di < 2 && hd < dl / 2; }

  function hoursUntilLight(di, hd, dl) {
    if (isLightHour(di, hd, dl)) return 0;
    var d = di, h = hd, count = 0;
    for (var i = 0; i < 80; i++) {
      h++; count++;
      if (h >= dl) { h = 0; d++; if (d >= 3) d = 0; }
      if (isLightHour(d, h, dl)) return count;
    }
    return 80;
  }

  function trainedLevel() { return Math.min(1, cycleCount / TRAIN_CYCLES); }

  function computeActivity(isLight, hoursUntil, trained, ph) {
    if (isLight) return 0.16 + Math.random() * 0.06;
    var antic = hoursUntil < PRE_LIGHT_WINDOW ?
      trained * (1 - hoursUntil / PRE_LIGHT_WINDOW) : 0;
    var jitter = 0.04 + Math.random() * 0.10;
    var val = jitter + antic;
    if (ph === 3) val *= (0.6 + Math.random() * 0.7);
    return Math.max(0, Math.min(1.3, val));
  }

  function currentIsLight() { return isLightHour(dayIndex, hourInDay, dayLen); }
  function currentHoursUntil() { return hoursUntilLight(dayIndex, hourInDay, dayLen); }

  function pickRandomDayLen() {
    return 2 * Math.round(rand(10, 32) / 2); // even, 10–32
  }

  // Advance the simulation by one hour, recording the hour that was
  // just "lived through" into history. Phase changes only take effect
  // when crossing into a new cycle's Day1 — never mid-cycle.
  function step() {
    var isLight = currentIsLight();
    var hoursUntil = currentHoursUntil();
    var activity = computeActivity(isLight, hoursUntil, trainedLevel(), phase);
    history.push({ isLight: isLight, activity: activity });
    if (history.length > HIST_MAX) history.shift();

    hourInDay++;
    if (hourInDay >= dayLen) {
      hourInDay = 0;
      dayIndex++;
      if (dayIndex >= 3) {
        dayIndex = 0;
        cycleCount++;
        if (pendingPhase !== phase) phase = pendingPhase;
        dayLen = phase === 1 ? 24 : phase === 2 ? 20 : pickRandomDayLen();
      }
    }
    render(activity, isLight, hoursUntil);
    saveRun();
  }

  function skipToNextCycle() {
    var guard = 0;
    var startCycle = cycleCount;
    while (cycleCount === startCycle && guard < 500) { step(); guard++; }
  }

  var DAY_LABEL = ["Day 1 (light day)", "Day 2 (light day)", "Day 3 (dark day)"];

  function render(activity, isLight, hoursUntil) {
    drawChart();
    updateLeaf(activity, isLight);
    var trained = trainedLevel();
    var trainedWord = trained <= 0 ? "untrained" :
      trained < 1 ? "training (" + Math.round(trained * 100) + "%)" : "fully trained";
    var bit;
    if (isLight) {
      bit = "hour " + hourInDay + " of " + dayLen + " — light is on.";
    } else if (hoursUntil < PRE_LIGHT_WINDOW && trained > 0.05) {
      bit = "hour " + hourInDay + " of " + dayLen + " — dark, " + hoursUntil +
        "h until light. " + trainedWord + ": the leaf is stirring.";
    } else {
      bit = "hour " + hourInDay + " of " + dayLen + " — dark, " + hoursUntil +
        "h until light. " + trainedWord + ".";
    }
    statusEl.textContent = DAY_LABEL[dayIndex] + ", " + bit;

    var phaseWord = phase === 1 ? "24-hour days" : phase === 2 ? "20-hour days" :
      "random days (currently " + dayLen + "h)";
    var pendingNote = pendingPhase !== phase ?
      " — switching to " + (pendingPhase === 1 ? "24-hour" : pendingPhase === 2 ? "20-hour" : "random") +
      " days at the next cycle" : "";
    cycleEl.textContent = cycleCount + " cycle" + (cycleCount === 1 ? "" : "s") +
      " completed · " + phaseWord + pendingNote + ".";
  }

  function drawChart() {
    chart.textContent = "";
    if (!history.length) return;
    var w = 640, h = 150, baseline = 140;
    var barW = w / history.length;
    for (var i = 0; i < history.length; i++) {
      var e = history[i];
      var barH = Math.max(1, e.activity * 92);
      var rect = document.createElementNS(svgNS, "rect");
      rect.setAttribute("x", (i * barW).toFixed(1));
      rect.setAttribute("y", (baseline - barH).toFixed(1));
      rect.setAttribute("width", Math.max(0.6, barW - 0.6).toFixed(1));
      rect.setAttribute("height", barH.toFixed(1));
      rect.setAttribute("class", e.isLight ? "st-bar-light" : "st-bar-dark");
      chart.appendChild(rect);
    }
    var base = document.createElementNS(svgNS, "line");
    base.setAttribute("x1", "0"); base.setAttribute("x2", String(w));
    base.setAttribute("y1", String(baseline)); base.setAttribute("y2", String(baseline));
    base.setAttribute("class", "st-baseline");
    chart.appendChild(base);
  }

  var LEAFLET_N = 5;
  (function buildLeaflets() {
    for (var i = 0; i < LEAFLET_N; i++) {
      var x = 10 + i * 11;
      var g = document.createElementNS(svgNS, "g");
      g.setAttribute("class", "st-leaflet-pair");
      g.setAttribute("transform", "translate(" + x + ",22)");
      var top = document.createElementNS(svgNS, "ellipse");
      top.setAttribute("cx", "0"); top.setAttribute("cy", "-5");
      top.setAttribute("rx", "5"); top.setAttribute("ry", "2.6");
      top.setAttribute("class", "st-leaflet st-leaflet-top");
      var bot = document.createElementNS(svgNS, "ellipse");
      bot.setAttribute("cx", "0"); bot.setAttribute("cy", "5");
      bot.setAttribute("rx", "5"); bot.setAttribute("ry", "2.6");
      bot.setAttribute("class", "st-leaflet st-leaflet-bot");
      g.appendChild(top); g.appendChild(bot);
      leafletsGroup.appendChild(g);
    }
  })();

  function updateLeaf(activity, isLight) {
    var pairs = leafletsGroup.querySelectorAll(".st-leaflet-pair");
    var amt = Math.max(0, Math.min(1, activity));
    for (var i = 0; i < pairs.length; i++) {
      pairs[i].style.setProperty("--stir", amt.toFixed(2));
    }
    leafletsGroup.classList.toggle("st-open", !!isLight);
    leafletsGroup.classList.toggle("st-stirring", !isLight && amt > 0.25 && !reduced);
  }

  function setPlaying(on) {
    playing = on;
    playBtn.textContent = playing ? "Pause" : "Play";
    if (playTimer) { clearInterval(playTimer); playTimer = null; }
    if (playing) playTimer = setInterval(step, 140);
  }

  stepBtn.addEventListener("click", function () { setPlaying(false); step(); });
  cycleSkipBtn.addEventListener("click", function () { setPlaying(false); skipToNextCycle(); });
  playBtn.addEventListener("click", function () { setPlaying(!playing); });

  resetBtn.addEventListener("click", function () {
    setPlaying(false);
    phase = 1; pendingPhase = 1; dayLen = 24;
    dayIndex = 0; hourInDay = 0; cycleCount = 0; history = [];
    for (var i = 0; i < phaseRadios.length; i++) phaseRadios[i].checked = phaseRadios[i].value === "1";
    chart.textContent = "";
    statusEl.textContent = 'Click "Advance 1 hour" to begin.';
    cycleEl.textContent = "";
    updateLeaf(0, false);
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) { /* nothing to clear */ }
  });

  for (var r = 0; r < phaseRadios.length; r++) {
    phaseRadios[r].addEventListener("change", function (e) {
      pendingPhase = parseInt(e.target.value, 10);
      render(history.length ? history[history.length - 1].activity : 0, currentIsLight(), currentHoursUntil());
      saveRun();
    });
  }

  (function restoreRun() {
    var s = loadRun();
    if (!s) { updateLeaf(0, false); return; }
    phase = s.phase; pendingPhase = s.pendingPhase; dayLen = s.dayLen;
    dayIndex = s.dayIndex; hourInDay = s.hourInDay; cycleCount = s.cycleCount;
    history = s.history.slice(-HIST_MAX);
    for (var i = 0; i < phaseRadios.length; i++) {
      phaseRadios[i].checked = parseInt(phaseRadios[i].value, 10) === pendingPhase;
    }
    var last = history.length ? history[history.length - 1] : null;
    render(last ? last.activity : 0, currentIsLight(), currentHoursUntil());
    if (last) updateLeaf(last.activity, last.isLight); else updateLeaf(0, false);
    statusEl.textContent = "Resumed a saved run — " + statusEl.textContent;
  })();
})();
