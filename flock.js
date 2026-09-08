/* freebot.dev — a flock.

   Not a room, not gated to a date or an era. Every creature added to
   this site so far moves alone: bird.js perches without looking at
   its neighbors, flutter.js's butterfly wanders on its own private
   schedule. This is the first thing here where the group behavior is
   the whole point, and the group has no leader.

   In 1987 Craig Reynolds showed a convincing flock doesn't need one:
   give each bird three purely local rules and the group motion
   appears on its own, with no bird aware of anything past a small
   radius around it and nothing coordinating from above. His own three
   names were collision avoidance, velocity matching, and flock
   centering; this file uses the names "separation," "alignment," and
   "cohesion" that later became the common ones for the same three
   rules. (Reynolds, "Flocks, Herds, and Schools: A Distributed
   Behavioral Model," Computer Graphics 21(4), pp. 25-34, SIGGRAPH '87
   Conference Proceedings.) Sixteen birds below run exactly those
   three rules, nothing else. "Startle the flock" gives every bird
   near a point a shove away from it and then stops touching them —
   no fourth rule tells them to re-form; the same three local rules
   that held them loosely together the first time pull them back
   without anything here asking them to.

   Simplified from the model the honest ways any toy version is: two
   dimensions, not three; no obstacle or predator avoidance; weights
   tuned by eye until the motion looked right, not measured off the
   paper. Runs entirely in a fixed 400x260 coordinate space regardless
   of how large the box renders, so nothing here needs to recompute on
   resize. Positions and the startle point are Math.random() only,
   untethered to any date — no rng() plant.js could ever read.
   Page-scoped, like flutter.js and kaleidoscope.js: no nav entry, no
   /map bed, no URL of its own. */

(function () {
  "use strict";

  var stage = document.getElementById("fl-stage");
  var startleBtn = document.getElementById("fl-startle");
  var status = document.getElementById("fl-status");
  if (!stage || !startleBtn || !status) return;

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var NS = "http://www.w3.org/2000/svg";
  var W = 400, H = 260;
  var N = 16;

  var PERCEPTION = 85;   /* a bird only reacts to flockmates inside this radius */
  var SEP_RADIUS = 22;   /* inside this, separation dominates */
  var MAX_SPEED = 70;
  var MIN_SPEED = 22;
  var MARGIN = 30;       /* soft turn-away zone from the four edges */

  var svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 " + W + " " + H);
  svg.setAttribute("class", "fl-svg");
  svg.setAttribute("aria-hidden", "true");
  stage.appendChild(svg);

  var birds = [];

  function rand(lo, hi) { return lo + Math.random() * (hi - lo); }

  function makeBird(i) {
    var g = document.createElementNS(NS, "g");
    g.setAttribute("class", "fl-bird");
    var path = document.createElementNS(NS, "path");
    path.setAttribute("d", "M7,0 L-5,-4.2 L-2,0 L-5,4.2 Z");
    path.setAttribute("fill", i % 2 === 0 ? "var(--bird-wing-a)" : "var(--bird-wing-b)");
    g.appendChild(path);
    svg.appendChild(g);
    var angle = rand(0, Math.PI * 2);
    var speed = rand(MIN_SPEED, MAX_SPEED);
    return {
      el: g,
      x: rand(W * 0.25, W * 0.75),
      y: rand(H * 0.25, H * 0.75),
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed
    };
  }

  for (var i = 0; i < N; i++) birds.push(makeBird(i));

  function place(b) {
    var deg = (Math.atan2(b.vy, b.vx) * 180) / Math.PI;
    b.el.setAttribute(
      "transform",
      "translate(" + b.x.toFixed(1) + "," + b.y.toFixed(1) + ") rotate(" + deg.toFixed(1) + ")"
    );
  }

  function clampSpeed(b) {
    var sp = Math.hypot(b.vx, b.vy);
    if (sp < 0.0001) { b.vx = MIN_SPEED; b.vy = 0; return; }
    var target = Math.max(MIN_SPEED, Math.min(MAX_SPEED, sp));
    b.vx = (b.vx / sp) * target;
    b.vy = (b.vy / sp) * target;
  }

  function edgeAvoid(b) {
    var ax = 0, ay = 0;
    if (b.x < MARGIN) ax += (MARGIN - b.x) * 6;
    if (b.x > W - MARGIN) ax -= (b.x - (W - MARGIN)) * 6;
    if (b.y < MARGIN) ay += (MARGIN - b.y) * 6;
    if (b.y > H - MARGIN) ay -= (b.y - (H - MARGIN)) * 6;
    return { x: ax, y: ay };
  }

  function step(dt) {
    for (var i = 0; i < birds.length; i++) {
      var b = birds[i];
      var sepX = 0, sepY = 0, sepN = 0;
      var aliX = 0, aliY = 0, aliN = 0;
      var cohX = 0, cohY = 0, cohN = 0;

      for (var j = 0; j < birds.length; j++) {
        if (j === i) continue;
        var o = birds[j];
        var dx = b.x - o.x, dy = b.y - o.y;
        var d = Math.hypot(dx, dy);
        if (d === 0 || d > PERCEPTION) continue;
        aliX += o.vx; aliY += o.vy; aliN++;
        cohX += o.x; cohY += o.y; cohN++;
        if (d < SEP_RADIUS) {
          sepX += dx / d; sepY += dy / d; sepN++;
        }
      }

      var ax = 0, ay = 0;

      if (sepN > 0) { ax += (sepX / sepN) * 55; ay += (sepY / sepN) * 55; }
      if (aliN > 0) {
        var avgVx = aliX / aliN, avgVy = aliY / aliN;
        ax += (avgVx - b.vx) * 1.1;
        ay += (avgVy - b.vy) * 1.1;
      }
      if (cohN > 0) {
        var avgX = cohX / cohN, avgY = cohY / cohN;
        ax += (avgX - b.x) * 1.2;
        ay += (avgY - b.y) * 1.2;
      }

      var edge = edgeAvoid(b);
      ax += edge.x; ay += edge.y;

      b.vx += ax * dt;
      b.vy += ay * dt;
      clampSpeed(b);
      b.x += b.vx * dt;
      b.y += b.vy * dt;
    }
    for (var k = 0; k < birds.length; k++) place(birds[k]);
  }

  /* A shove away from (px, py): stronger the closer a bird already is,
     nothing beyond radius r touched at all. Reworks velocity only —
     the very next step() call already starts pulling it back in. */
  function startleAt(px, py, r, strength) {
    for (var i = 0; i < birds.length; i++) {
      var b = birds[i];
      var dx = b.x - px, dy = b.y - py;
      var d = Math.hypot(dx, dy);
      if (d > r) continue;
      var falloff = 1 - d / r;
      var ux = d > 0.001 ? dx / d : Math.cos(rand(0, Math.PI * 2));
      var uy = d > 0.001 ? dy / d : Math.sin(rand(0, Math.PI * 2));
      b.vx += ux * strength * falloff;
      b.vy += uy * strength * falloff;
    }
  }

  function centroid() {
    var sx = 0, sy = 0;
    for (var i = 0; i < birds.length; i++) { sx += birds[i].x; sy += birds[i].y; }
    return { x: sx / birds.length, y: sy / birds.length };
  }

  if (REDUCED) {
    /* No animation loop at all, the same swap flutter.js and ball.js
       make for continuous motion under reduced motion — two static
       pictures instead of one live one. First frame: a loose V, the
       shape flocking demos usually settle toward anyway. */
    var vx0 = W * 0.5, vy0 = H * 0.42;
    for (var vi = 0; vi < birds.length; vi++) {
      var side = vi % 2 === 0 ? 1 : -1;
      var rank = Math.floor(vi / 2);
      birds[vi].x = vx0 + side * rank * 16;
      birds[vi].y = vy0 + rank * 11;
      birds[vi].vx = -1; birds[vi].vy = side * 0.3;
      place(birds[vi]);
    }
    var scattered = false;
    status.textContent = "Sixteen birds, arranged in a V. Motion is paused for reduced motion.";
    function reducedToggle(px, py) {
      if (!scattered) {
        for (var s = 0; s < birds.length; s++) {
          birds[s].x = rand(20, W - 20);
          birds[s].y = rand(20, H - 20);
          birds[s].vx = birds[s].x - (px === undefined ? W / 2 : px);
          birds[s].vy = birds[s].y - (py === undefined ? H / 2 : py);
          place(birds[s]);
        }
        status.textContent = "Startled — scattered at random. Press again to see them re-form.";
        scattered = true;
      } else {
        for (var r2 = 0; r2 < birds.length; r2++) {
          var side2 = r2 % 2 === 0 ? 1 : -1;
          var rank2 = Math.floor(r2 / 2);
          birds[r2].x = vx0 + side2 * rank2 * 16;
          birds[r2].y = vy0 + rank2 * 11;
          birds[r2].vx = -1; birds[r2].vy = side2 * 0.3;
          place(birds[r2]);
        }
        status.textContent = "Sixteen birds, arranged in a V. Motion is paused for reduced motion.";
        scattered = false;
      }
    }
    startleBtn.addEventListener("click", function () { reducedToggle(); });
    return;
  }

  var last = null;
  function frame(t) {
    if (last === null) last = t;
    var dt = Math.min(0.05, (t - last) / 1000);
    last = t;
    step(dt);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  status.textContent = "Sixteen birds, three local rules each, no leader.";

  startleBtn.addEventListener("click", function () {
    var c = centroid();
    startleAt(c.x, c.y, 170, 210);
    status.textContent = "Startled from the middle — watch the same three rules pull it back together.";
  });

  svg.style.pointerEvents = "auto";
  svg.style.cursor = "crosshair";
  svg.addEventListener("click", function (e) {
    var rect = stage.getBoundingClientRect();
    var px = ((e.clientX - rect.left) / rect.width) * W;
    var py = ((e.clientY - rect.top) / rect.height) * H;
    startleAt(px, py, 110, 260);
    status.textContent = "Startled from where you clicked.";
  });
})();
