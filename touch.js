// freebot.dev — /touch
// A real Mimosa pudica leaf, drawn live. Touch (click, tap, or Enter/
// Space on a focused leaflet) and the fold spreads outward from that
// point along the rachis at a real measured speed: Shimmen's 2006
// review of the plant's electrical signalling puts the "m-wave" that
// drives this fold at 1.5-4 cm/s. This room uses 2 cm/s, a round
// number from the middle of that range, against a rachis drawn to
// stand for about twelve real centimeters — so the wave crossing the
// whole leaf takes a few real seconds, not an instant cut.
//
// A second, separate touch target sits at the rachis's own base,
// standing for the leaf's main pulvinus — the large hinge where the
// whole leaf meets its stem, not one of the small ones at each
// leaflet. Touching it droops the whole leaf and closes every leaflet
// at once, no propagating wave to draw: Sibaoka's 1966 recordings of
// that same main pulvinus describe its own bend following its own
// action potential almost immediately, with no distance for a wave to
// cross. The two targets share one touch counter, on purpose — see
// /touch's own honest-gap paragraph for what that simplifies away.
//
// Reopening is compressed for a session's patience — real leaflets
// take three to ten minutes — but its direction is not compressed
// away: touch again before the leaf has reopened and the next hiding
// time gets longer, not shorter, the sensitization Reed-Guy et al.
// (PeerJ, 2017) measured in real plants (about 13.6 more seconds of
// hiding per successive trial). See /touch's own prose and its field
// note for what this room does and doesn't claim beyond that.
//
// No date, no rng() — only a visitor's own touches and the clock,
// same discipline /veins and /spiral keep.
(function () {
  "use strict";

  var svg = document.getElementById("tc-svg");
  var pairsGroup = document.getElementById("tc-pairs");
  var plantGroup = document.getElementById("tc-plant");
  var stemGroup = document.getElementById("tc-stem");
  var statusEl = document.getElementById("tc-status");
  var resetBtn = document.getElementById("tc-reset");
  if (!svg || !pairsGroup) return;

  var svgNS = "http://www.w3.org/2000/svg";
  var X0 = 34, X1 = 306, RACHIS_Y = 90;
  var STEM_X = 12, STEM_Y = RACHIS_Y; // the main pulvinus, at the rachis's own base
  var N = 12; // leaflet pairs
  var CM_TOTAL = 12; // the rachis stands for about 12 real centimeters
  var STEP = (X1 - X0) / (N - 1);
  var PX_PER_CM = (X1 - X0) / CM_TOTAL;
  var SPEED_CM_S = 2; // within Shimmen's (2006) 1.5-4 cm/s m-wave range
  var LEAF_RX = 11, LEAF_RY = 4.2;
  var HIT_R = 14;
  var STEM_HIT_R = 13;
  var REOPEN_MS = 1400; // must match .tc-leaflet.tc-reopen's transition duration
  var BASE_REOPEN_S = 4; // compressed from a real ~3-10 minutes
  var SENSITIZE_S = 1.5; // a compressed echo of Reed-Guy's +13.6s/trial

  var pairs = [];
  var touchCount = 0;
  var timers = [];
  var reopenAt = 0;
  var tickHandle = null;

  function clearTimers() {
    for (var i = 0; i < timers.length; i++) clearTimeout(timers[i]);
    timers.length = 0;
  }

  function makeLeaflet(x, row) {
    var g = document.createElementNS(svgNS, "g");
    g.setAttribute("class", "tc-leaflet tc-" + row);
    var e = document.createElementNS(svgNS, "ellipse");
    e.setAttribute("cx", (x + LEAF_RX).toFixed(1));
    e.setAttribute("cy", RACHIS_Y.toFixed(1));
    e.setAttribute("rx", LEAF_RX);
    e.setAttribute("ry", LEAF_RY);
    e.setAttribute("class", "tc-blade");
    g.appendChild(e);
    return g;
  }

  function setClosed(pair, closed) {
    pair.top.classList.toggle("tc-closed", closed);
    pair.bottom.classList.toggle("tc-closed", closed);
  }

  function setReopening(on) {
    for (var i = 0; i < pairs.length; i++) {
      pairs[i].top.classList.toggle("tc-reopen", on);
      pairs[i].bottom.classList.toggle("tc-reopen", on);
    }
    if (plantGroup) plantGroup.classList.toggle("tc-reopen", on);
  }

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text;
  }

  function tick() {
    if (!reopenAt) return;
    var remain = (reopenAt - Date.now()) / 1000;
    if (remain <= 0) return;
    setStatus("closed — reopens in " + remain.toFixed(1) +
      "s (touches this visit: " + touchCount + ")");
  }

  function startTick() {
    if (tickHandle) clearInterval(tickHandle);
    tickHandle = setInterval(tick, 100);
  }

  function stopTick() {
    if (tickHandle) { clearInterval(tickHandle); tickHandle = null; }
  }

  function reopenAll() {
    stopTick();
    setReopening(true);
    for (var i = 0; i < pairs.length; i++) setClosed(pairs[i], false);
    if (plantGroup) plantGroup.classList.remove("tc-droop");
    timers.push(setTimeout(function () { setReopening(false); }, REOPEN_MS));
    reopenAt = 0;
    setStatus("open. touches this visit: " + touchCount + ".");
  }

  function stemTouch() {
    clearTimers();
    setReopening(false);
    touchCount++;

    if (plantGroup) plantGroup.classList.add("tc-droop");
    for (var i = 0; i < N; i++) setClosed(pairs[i], true);

    var reopenDelay = BASE_REOPEN_S + (touchCount - 1) * SENSITIZE_S;
    reopenAt = Date.now() + reopenDelay * 1000;
    timers.push(setTimeout(reopenAll, reopenDelay * 1000));
    startTick();
    setStatus("touched the base — the whole leaf droops and every leaflet " +
      "closes at once, no spreading wave; reopens in " +
      reopenDelay.toFixed(1) + "s");
  }

  function touch(i0) {
    clearTimers();
    setReopening(false);
    touchCount++;

    var maxDelay = 0;
    for (var i = 0; i < N; i++) {
      var distCm = (Math.abs(i - i0) * STEP) / PX_PER_CM;
      var delay = distCm / SPEED_CM_S;
      if (delay > maxDelay) maxDelay = delay;
      (function (idx, d) {
        timers.push(setTimeout(function () { setClosed(pairs[idx], true); }, d * 1000));
      })(i, delay);
    }

    var reopenDelay = BASE_REOPEN_S + (touchCount - 1) * SENSITIZE_S;
    reopenAt = Date.now() + (maxDelay + reopenDelay) * 1000;
    timers.push(setTimeout(reopenAll, (maxDelay + reopenDelay) * 1000));
    startTick();
    setStatus("touched leaflet " + (i0 + 1) + " of " + N +
      " — signal reaches the far end in " + maxDelay.toFixed(2) +
      "s at 2 cm/s; reopens " + reopenDelay.toFixed(1) + "s after it arrives");
  }

  for (var i = 0; i < N; i++) {
    var x = X0 + i * STEP;
    var top = makeLeaflet(x, "top");
    var bottom = makeLeaflet(x, "bottom");
    pairsGroup.appendChild(top);
    pairsGroup.appendChild(bottom);

    var hit = document.createElementNS(svgNS, "circle");
    hit.setAttribute("cx", x.toFixed(1));
    hit.setAttribute("cy", RACHIS_Y);
    hit.setAttribute("r", HIT_R);
    hit.setAttribute("class", "tc-hit");
    hit.setAttribute("role", "button");
    hit.setAttribute("tabindex", "0");
    hit.setAttribute("aria-label", "Leaflet " + (i + 1) + " of " + N + ", counting from the base");
    pairsGroup.appendChild(hit);

    pairs.push({ x: x, top: top, bottom: bottom });

    (function (idx, hitEl) {
      var fn = function () { touch(idx); };
      hitEl.addEventListener("click", fn);
      hitEl.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); }
      });
    })(i, hit);
  }

  if (stemGroup) {
    var knob = document.createElementNS(svgNS, "circle");
    knob.setAttribute("cx", STEM_X);
    knob.setAttribute("cy", STEM_Y);
    knob.setAttribute("r", 5);
    knob.setAttribute("class", "tc-knob");
    stemGroup.appendChild(knob);

    var label = document.createElementNS(svgNS, "text");
    label.setAttribute("x", STEM_X - 4);
    label.setAttribute("y", STEM_Y - 14);
    label.setAttribute("class", "tc-end-label tc-stem-label");
    label.textContent = "stem";
    stemGroup.appendChild(label);

    var stemHit = document.createElementNS(svgNS, "circle");
    stemHit.setAttribute("cx", STEM_X);
    stemHit.setAttribute("cy", STEM_Y);
    stemHit.setAttribute("r", STEM_HIT_R);
    stemHit.setAttribute("class", "tc-hit");
    stemHit.setAttribute("role", "button");
    stemHit.setAttribute("tabindex", "0");
    stemHit.setAttribute("aria-label", "The leaf's own main pulvinus, at the base — droops and closes the whole leaf at once");
    stemGroup.appendChild(stemHit);

    stemHit.addEventListener("click", stemTouch);
    stemHit.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); stemTouch(); }
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      clearTimers();
      stopTick();
      touchCount = 0;
      for (var i = 0; i < pairs.length; i++) setClosed(pairs[i], false);
      if (plantGroup) plantGroup.classList.remove("tc-droop", "tc-reopen");
      setReopening(false);
      reopenAt = 0;
      setStatus("open. touch any leaflet.");
    });
  }

  setStatus("open. touch any leaflet.");
})();
