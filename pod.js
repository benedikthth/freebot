// freebot.dev — /pod
// A real jewelweed (Impatiens capensis) seed pod, drawn live. Touch it
// (click, tap, or Enter/Space on the pod) and four valves split and
// coil backward, launching every seed inside along a real ballistic
// arc. Hayashi, Feilich & Ellerby (J. Exp. Botany, 2009) filmed real
// bursts and measured what this room draws its numbers from: splitting
// and coiling finish in 4.2±0.4 ms, launch speed ranges 0.2-4.08 m/s
// across real seeds, the mean launch angle is 17.4° above horizontal
// (close to a ballistic model's own predicted optimum for distance),
// and a ripe pod holds 2-5 seeds, averaging 3.46.
//
// The 17.4° figure is a mean of 45 measured seeds with a reported
// ±5.2° standard error on that mean — precision of the average, not
// per-seed spread. This room still needs some scatter to read as a
// spray rather than 45 identical copies, so it adds its own ±12°
// jitter around 17.4° as a disclosed liberty, not a measured one. See
// /pod's own honest-gap paragraph for what else is compressed or
// simplified here.
//
// No date, no rng() plant.js, organism.js, or bird.js could ever
// touch — only a visitor's own touch, Math.random() for the untethered
// scatter above, and the clock, same discipline /touch and /cone keep.
(function () {
  "use strict";

  var svg = document.getElementById("pd-svg");
  var podGroup = document.getElementById("pd-pod");
  var seedsGroup = document.getElementById("pd-seeds");
  var hit = document.getElementById("pd-hit");
  var statusEl = document.getElementById("pd-status");
  var resetBtn = document.getElementById("pd-reset");
  if (!svg || !podGroup || !hit) return;

  var svgNS = "http://www.w3.org/2000/svg";

  var LAUNCH_X = 40, LAUNCH_Y = 95, GROUND_Y = 165;
  var PX_PER_M = 220; // 1 real meter = 220px; matches the ground scale's own ticks
  var G = 9.8; // m/s^2
  var H0 = (GROUND_Y - LAUNCH_Y) / PX_PER_M; // pod's own launch height above the ground line

  var MEAN_ANGLE = 17.4, ANGLE_JITTER = 12; // degrees; see the file header on why the spread is this room's own
  var MIN_SPEED = 0.2, MAX_SPEED = 4.08; // m/s, Hayashi et al.'s own measured range
  var SEED_COUNTS = [2, 3, 3, 4, 4, 5]; // averages 3.5, close to the paper's own 3.46
  var SLOWDOWN = 5; // real flights take well under half a second; stretched for visibility
  var NEXT_POD_MS = 1500;

  var reduced = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var busy = false;
  var seedTotal = 0;
  var distSumCm = 0;
  var nextPodTimer = null;

  function rand(min, max) { return min + Math.random() * (max - min); }

  function trajectory(v0, angleDeg) {
    var rad = angleDeg * Math.PI / 180;
    var vx = v0 * Math.cos(rad), vy = v0 * Math.sin(rad);
    // 0.5*g*t^2 - vy*t - H0 = 0, solved for the positive root
    var a = 0.5 * G, b = -vy, c = -H0;
    var t = (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
    return { t: t, vx: vx, vy: vy };
  }

  function positionAt(traj, s) {
    var x = LAUNCH_X + traj.vx * s * PX_PER_M;
    var y = LAUNCH_Y - (traj.vy * s - 0.5 * G * s * s) * PX_PER_M;
    if (y > GROUND_Y) y = GROUND_Y;
    return { x: x, y: y };
  }

  function markLanding(x) {
    var mark = document.createElementNS(svgNS, "circle");
    mark.setAttribute("cx", x.toFixed(1));
    mark.setAttribute("cy", GROUND_Y - 1.5);
    mark.setAttribute("r", "2");
    mark.setAttribute("class", "pd-landing");
    seedsGroup.appendChild(mark);
  }

  function launchSeed(onDone) {
    var v0 = rand(MIN_SPEED, MAX_SPEED);
    var angle = MEAN_ANGLE + rand(-ANGLE_JITTER, ANGLE_JITTER);
    var traj = trajectory(v0, angle);
    var landing = positionAt(traj, traj.t);
    var distCm = ((landing.x - LAUNCH_X) / PX_PER_M) * 100;

    var seed = document.createElementNS(svgNS, "circle");
    seed.setAttribute("r", "2.2");
    seed.setAttribute("class", "pd-seed");
    seed.setAttribute("cx", LAUNCH_X);
    seed.setAttribute("cy", LAUNCH_Y);
    seedsGroup.appendChild(seed);

    if (reduced) {
      seed.setAttribute("cx", landing.x.toFixed(1));
      seed.setAttribute("cy", landing.y.toFixed(1));
      markLanding(landing.x);
      onDone(distCm);
      return;
    }

    var start = null;
    function frame(ts) {
      if (start === null) start = ts;
      var s = ((ts - start) / 1000) / SLOWDOWN;
      if (s >= traj.t) {
        seed.setAttribute("cx", landing.x.toFixed(1));
        seed.setAttribute("cy", landing.y.toFixed(1));
        markLanding(landing.x);
        onDone(distCm);
        return;
      }
      var p = positionAt(traj, s);
      seed.setAttribute("cx", p.x.toFixed(1));
      seed.setAttribute("cy", p.y.toFixed(1));
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function scheduleNextPod() {
    hit.setAttribute("aria-label", "Regrowing a new pod.");
    nextPodTimer = setTimeout(function () {
      podGroup.classList.remove("pd-open");
      busy = false;
      hit.setAttribute("aria-label", "A ripe jewelweed pod, closed. Touch it to trigger explosive seed dispersal.");
    }, reduced ? 0 : NEXT_POD_MS);
  }

  function burst() {
    if (busy) return;
    busy = true;
    podGroup.classList.add("pd-open");

    var count = SEED_COUNTS[Math.floor(Math.random() * SEED_COUNTS.length)];
    var landed = 0, burstMinCm = Infinity, burstMaxCm = 0;

    function afterSeed(distCm) {
      landed++;
      seedTotal++;
      distSumCm += distCm;
      if (distCm < burstMinCm) burstMinCm = distCm;
      if (distCm > burstMaxCm) burstMaxCm = distCm;
      if (landed === count) {
        var avg = (distSumCm / seedTotal).toFixed(0);
        setStatus("burst: " + count + " seed" + (count === 1 ? "" : "s") +
          " landed " + burstMinCm.toFixed(0) + "–" + burstMaxCm.toFixed(0) +
          "cm out. " + seedTotal + " seed" + (seedTotal === 1 ? "" : "s") +
          " total this visit, averaging " + avg + "cm.");
        scheduleNextPod();
      }
    }

    for (var i = 0; i < count; i++) launchSeed(afterSeed);
  }

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text;
  }

  hit.addEventListener("click", burst);
  hit.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); burst(); }
  });

  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      if (nextPodTimer) { clearTimeout(nextPodTimer); nextPodTimer = null; }
      podGroup.classList.remove("pd-open");
      seedsGroup.textContent = "";
      busy = false;
      seedTotal = 0;
      distSumCm = 0;
      hit.setAttribute("aria-label", "A ripe jewelweed pod, closed. Touch it to trigger explosive seed dispersal.");
      setStatus("closed. touch the pod.");
    });
  }
})();
