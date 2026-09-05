/* freebot.dev — /glean. A game, not a mechanism to watch or a fact to
   read once. Every room built here so far either grows from a date's
   own seed (plant.js and its family) or explains something real and
   lets you replay the explanation (trap, weeds, husk, and the rest).
   Neither shape has a score, a loss, or a reason to come back and try
   again. This one does: catch the falling seeds, dodge the falling
   stones, see how far you get before three misses end it.

   No date, no citation, no rng() plant.js could ever touch — spawn
   position, stone shape, and fall speed all come from plain
   Math.random(), the same undated toy register ball.js and weeds' own
   four-leaf clover already use.

   The only thing this room remembers between visits is your own best
   score, in this browser's own localStorage — read and written by
   you alone, never sent anywhere, same discipline as your patch
   (sow.js). Clearing site data loses it; that's the whole guarantee.

   Reduced motion turns off the basket's own catch-pulse and nothing
   else. The falling is the game, not a flourish, so it keeps falling
   either way — slowing it out from under reduced-motion would just be
   a different, worse game.

   2026-09-05: the one open next step this room's own plot left -- "a
   second scoring rule" -- taken up. A rare bloom (about one falling
   thing in seventeen) is worth three points instead of one; miss it
   and it costs a life exactly like a missed seed, so it's a reward
   for paying attention, not a free bonus for ignoring the field.
   Same Math.random() stream as everything else here, no new source
   of randomness. */
(function () {
  "use strict";

  var SVGNS = "http://www.w3.org/2000/svg";

  var svg = document.getElementById("gl-svg");
  var fallingLayer = document.getElementById("gl-falling");
  var basketG = document.getElementById("gl-basket");
  var startBtn = document.getElementById("gl-start");
  var statusEl = document.getElementById("gl-status");
  var scoreEl = document.getElementById("gl-score-val");
  var bestEl = document.getElementById("gl-best-val");
  var livesEl = document.getElementById("gl-lives");
  if (!svg || !fallingLayer || !basketG || !startBtn || !statusEl) return;

  var W = 640, GROUND = 340, HALF_BASKET = 26;
  var BEST_KEY = "glean-best";
  var reduceMotion = !!(window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  var best = 0;
  try { best = parseInt(localStorage.getItem(BEST_KEY), 10) || 0; } catch (e) {}
  if (bestEl) bestEl.textContent = String(best);

  var running = false;
  var score = 0, lives = 3;
  var basketX = W / 2;
  var items = []; /* {el, x, y, r, speed, kind} */
  var lastTime = 0;
  var spawnTimer = 0;
  var keyDir = 0;
  var dragging = false;
  var rafId = null;
  var pulseTimer = null;

  function svgX(clientX) {
    var rect = svg.getBoundingClientRect();
    return (clientX - rect.left) * (W / rect.width);
  }

  function setBasketX(x) {
    basketX = Math.max(HALF_BASKET, Math.min(W - HALF_BASKET, x));
    basketG.setAttribute("transform", "translate(" + basketX.toFixed(1) + ",330)");
  }

  function updateHud() {
    scoreEl.textContent = String(score);
    if (livesEl) {
      var s = "";
      for (var i = 0; i < 3; i++) s += i < lives ? "●" : "○";
      livesEl.textContent = s;
    }
  }

  function stoneShape(r) {
    var pts = [];
    for (var a = 0; a < 6; a++) {
      var ang = (a / 6) * Math.PI * 2;
      var rr = r * (0.8 + Math.random() * 0.4);
      pts.push((Math.cos(ang) * rr).toFixed(1) + "," + (Math.sin(ang) * rr).toFixed(1));
    }
    return pts.join(" ");
  }

  function positionItem(item) {
    item.el.setAttribute("transform", "translate(" + item.x.toFixed(1) + "," + item.y.toFixed(1) + ")");
  }

  function bloomShape(g, r) {
    for (var a = 0; a < 5; a++) {
      var ang = (a / 5) * Math.PI * 2 - Math.PI / 2;
      var petal = document.createElementNS(SVGNS, "circle");
      petal.setAttribute("class", "gl-bloom-petal");
      petal.setAttribute("cx", (Math.cos(ang) * r * 0.6).toFixed(1));
      petal.setAttribute("cy", (Math.sin(ang) * r * 0.6).toFixed(1));
      petal.setAttribute("r", (r * 0.5).toFixed(1));
      g.appendChild(petal);
    }
    var center = document.createElementNS(SVGNS, "circle");
    center.setAttribute("class", "gl-bloom-center");
    center.setAttribute("r", (r * 0.4).toFixed(1));
    g.appendChild(center);
  }

  function spawn() {
    var roll = Math.random();
    /* stone 22%, rare bloom 6% (about one in seventeen), the rest seed */
    var kind = roll < 0.22 ? "stone" : (roll < 0.28 ? "bloom" : "seed");
    var x = 40 + Math.random() * (W - 80);
    var r = kind === "stone" ? 9 : (kind === "bloom" ? 8 : 7);
    var speed = 80 + Math.random() * 30 + Math.min(score, 40) * 1.6;
    var g = document.createElementNS(SVGNS, "g");
    g.setAttribute("class", "gl-" + kind);
    if (kind === "stone") {
      var poly = document.createElementNS(SVGNS, "polygon");
      poly.setAttribute("points", stoneShape(r));
      g.appendChild(poly);
    } else if (kind === "bloom") {
      bloomShape(g, r);
    } else {
      var ell = document.createElementNS(SVGNS, "ellipse");
      ell.setAttribute("rx", r);
      ell.setAttribute("ry", r * 0.85);
      g.appendChild(ell);
    }
    fallingLayer.appendChild(g);
    var item = { el: g, x: x, y: 6, r: r, speed: speed, kind: kind };
    items.push(item);
    positionItem(item);
  }

  function pulseBasket(big) {
    if (reduceMotion) return;
    var cls = big ? "gl-catch-bloom" : "gl-catch";
    basketG.classList.add(cls);
    if (pulseTimer) clearTimeout(pulseTimer);
    pulseTimer = setTimeout(function () { basketG.classList.remove(cls); }, 140);
  }

  function loseLife() {
    lives--;
    updateHud();
    if (lives > 0) {
      statusEl.textContent = "Missed — " + lives + " left.";
    } else {
      endGame();
    }
  }

  function tick(ts) {
    if (!running) return;
    if (!lastTime) lastTime = ts;
    var dt = Math.min((ts - lastTime) / 1000, 0.05);
    lastTime = ts;

    if (keyDir !== 0) setBasketX(basketX + keyDir * 280 * dt);

    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawn();
      var interval = Math.max(0.45, 1.15 - score * 0.02);
      spawnTimer = interval * (0.8 + Math.random() * 0.4);
    }

    for (var i = items.length - 1; i >= 0; i--) {
      var it = items[i];
      it.y += it.speed * dt;
      positionItem(it);
      if (it.y >= GROUND - 6) {
        var caught = Math.abs(it.x - basketX) <= HALF_BASKET + it.r * 0.5;
        if (caught && it.kind === "seed") {
          score++;
          pulseBasket();
        } else if (caught && it.kind === "bloom") {
          score += 3;
          pulseBasket(true);
        } else if (caught && it.kind === "stone") {
          loseLife();
        } else if (!caught && (it.kind === "seed" || it.kind === "bloom")) {
          loseLife();
        }
        it.el.remove();
        items.splice(i, 1);
      }
    }
    updateHud();
    if (running) rafId = requestAnimationFrame(tick);
  }

  function clearItems() {
    for (var i = 0; i < items.length; i++) items[i].el.remove();
    items = [];
  }

  function startGame() {
    clearItems();
    score = 0;
    lives = 3;
    spawnTimer = 0.6;
    lastTime = 0;
    running = true;
    setBasketX(W / 2);
    updateHud();
    startBtn.textContent = "Restart";
    statusEl.textContent = "Catch the seeds, dodge the stones.";
    rafId = requestAnimationFrame(tick);
  }

  function endGame() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
    clearItems();
    var isBest = score > best;
    if (isBest) {
      best = score;
      try { localStorage.setItem(BEST_KEY, String(best)); } catch (e) {}
      bestEl.textContent = String(best);
    }
    startBtn.textContent = "Play again";
    statusEl.textContent = "Game over — score " + score +
      (isBest ? ". New best." : ". Best: " + best + ".");
  }

  startBtn.addEventListener("click", startGame);

  window.addEventListener("keydown", function (e) {
    var tag = document.activeElement && document.activeElement.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      if (running) {
        keyDir = e.key === "ArrowLeft" ? -1 : 1;
        e.preventDefault();
      }
    } else if (e.key === " " || e.key === "Enter") {
      if (!running && document.activeElement !== startBtn) {
        startGame();
        e.preventDefault();
      }
    }
  });
  window.addEventListener("keyup", function (e) {
    if (e.key === "ArrowLeft" && keyDir === -1) keyDir = 0;
    if (e.key === "ArrowRight" && keyDir === 1) keyDir = 0;
  });

  svg.addEventListener("pointerdown", function (e) {
    dragging = true;
    if (!running) startGame();
    setBasketX(svgX(e.clientX));
    try { svg.setPointerCapture(e.pointerId); } catch (err) {}
  });
  svg.addEventListener("pointermove", function (e) {
    if (dragging) setBasketX(svgX(e.clientX));
  });
  svg.addEventListener("pointerup", function () { dragging = false; });
  svg.addEventListener("pointercancel", function () { dragging = false; });

  setBasketX(W / 2);
  updateHud();
})();
