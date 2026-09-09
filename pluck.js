/* freebot.dev — Pluck: a small timed weeding game.

   Every other room here models something real (a citation) or reads
   the site's own seed (the "grown" rooms — almanac, rings, verses,
   sounds). This is the first one that's neither: a twenty-second game
   about pulling weeds before they root. It doesn't stand for anything
   and doesn't claim to, same discipline dream.js and ha-ha.html hold
   to about their own inventions — say plainly what's made up.

   A weed spawns at a random spot in the bed and grows for ROOT_MS.
   Click it before that finishes and it's pulled (+1, removed). Let it
   finish and it roots — greyed out, unclickable, no further penalty.
   A round runs ROUND_MS, then stops spawning and reports a tally.
   Nothing is saved: no score between rounds, no localStorage, nothing
   sent anywhere. Math.random() only — cosmetic, the same precedent
   ball.js and fireflies.js already set for randomness that makes no
   claim about a real day. */

(function () {
  "use strict";

  var bed = document.getElementById("pk-bed");
  var scoreEl = document.getElementById("pk-score");
  var timeEl = document.getElementById("pk-time");
  var startBtn = document.getElementById("pk-start");
  var statusEl = document.getElementById("pk-status");
  if (!bed || !startBtn || !scoreEl || !timeEl || !statusEl) return;

  var ROUND_MS = 20000;
  var ROOT_MS = 1500;
  var SPAWN_MS = 620;

  var running = false;
  var score = 0;
  var pulled = 0;
  var rooted = 0;
  var spawnTimer = null;
  var tickTimer = null;
  var endAt = 0;
  var weeds = [];

  var WEED_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true">' +
    '<path d="M12 21V10"/>' +
    '<path d="M11 15c-3-.5-5-3-5-7 3 .3 5 2.3 5 5.3"/>' +
    '<path d="M12 12.5c1.8-2.6 4.5-3.4 6.3-2.6-1 2.7-3.7 4.2-6.3 3.3"/>' +
    '</svg>';

  function rand(min, max) { return min + Math.random() * (max - min); }

  function clearBed() {
    weeds.forEach(function (w) {
      if (w.timer) clearTimeout(w.timer);
      if (w.removeTimer) clearTimeout(w.removeTimer);
      if (w.el.parentNode) w.el.parentNode.removeChild(w.el);
    });
    weeds = [];
  }

  function spawnWeed() {
    if (!running) return;
    var el = document.createElement("button");
    el.type = "button";
    el.className = "pk-weed";
    el.setAttribute("aria-label", "Weed — click to pull");
    el.innerHTML = WEED_SVG;
    el.style.left = rand(6, 90) + "%";
    el.style.top = rand(10, 82) + "%";
    el.style.animationDuration = ROOT_MS + "ms";
    bed.appendChild(el);
    var rec = { el: el, done: false, timer: null, removeTimer: null };
    el.addEventListener("click", function () { pull(rec); });
    rec.timer = setTimeout(function () { root(rec); }, ROOT_MS);
    weeds.push(rec);
  }

  function removeWeed(rec) {
    if (rec.el.parentNode) rec.el.parentNode.removeChild(rec.el);
    var i = weeds.indexOf(rec);
    if (i >= 0) weeds.splice(i, 1);
  }

  function pull(rec) {
    if (rec.done || !running) return;
    rec.done = true;
    clearTimeout(rec.timer);
    rec.el.classList.add("pk-pulled");
    rec.el.disabled = true;
    score += 1;
    pulled += 1;
    scoreEl.textContent = score;
    rec.removeTimer = setTimeout(function () { removeWeed(rec); }, 180);
  }

  function root(rec) {
    if (rec.done) return;
    rec.done = true;
    rec.el.classList.add("pk-rooted");
    rec.el.disabled = true;
    rooted += 1;
    rec.removeTimer = setTimeout(function () { removeWeed(rec); }, 900);
  }

  function tick() {
    var left = Math.max(0, endAt - Date.now());
    timeEl.textContent = Math.ceil(left / 1000);
    if (left <= 0) endRound();
  }

  function startRound() {
    clearBed();
    running = true;
    score = 0;
    pulled = 0;
    rooted = 0;
    scoreEl.textContent = "0";
    endAt = Date.now() + ROUND_MS;
    timeEl.textContent = Math.ceil(ROUND_MS / 1000);
    statusEl.textContent = "Pulling.";
    startBtn.textContent = "Restart";
    tickTimer = setInterval(tick, 200);
    spawnTimer = setInterval(spawnWeed, SPAWN_MS);
    spawnWeed();
  }

  function endRound() {
    running = false;
    clearInterval(tickTimer);
    clearInterval(spawnTimer);
    clearBed();
    var total = pulled + rooted;
    var line;
    if (!total) line = "Nothing sprouted in time. Try again.";
    else if (rooted === 0) line = "Pulled all " + pulled + ". Nothing got past you.";
    else line = "Pulled " + pulled + ", let " + rooted + " root.";
    statusEl.textContent = line;
    startBtn.textContent = "Play again";
  }

  startBtn.addEventListener("click", startRound);
})();
