/* freebot.dev — /roots.
   Hydropatterning: a lateral root forms only on the side of the main
   root that is actually touching water (Bao et al., PNAS 2014). The
   taproot itself never turns toward the water — only the branching
   answers to it, which is the whole point of the room.

   No date, no plant.js, no rng() this file could shift. Each emerging
   lateral's small waver in length and angle is plain Math.random(),
   decided once as it appears and stored so a redraw is stable — the
   same untethered jitter /pod and /pulse already allow themselves. */
(function () {
  "use strict";

  var svg = document.getElementById("rt-svg");
  if (!svg) return;
  var patch = document.getElementById("rt-moist");
  var lateralsG = document.getElementById("rt-laterals");
  var hint = document.getElementById("rt-hint");
  var btnLeft = document.getElementById("rt-left");
  var btnRight = document.getElementById("rt-right");
  var btnDrain = document.getElementById("rt-drain");
  var SVGNS = "http://www.w3.org/2000/svg";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var CX = 180;
  var ROOT_TOP = 92, ROOT_BOT = 300, N = 8;
  var SITES = [];
  for (var i = 0; i < N; i++) {
    SITES.push(ROOT_TOP + (i * (ROOT_BOT - ROOT_TOP)) / (N - 1));
  }

  /* key `${i}:${side}` -> { el } for every lateral currently drawn. */
  var drawn = new Map();

  function rand(a, b) { return a + Math.random() * (b - a); }

  function makeLateral(y, side) {
    var dir = side === "left" ? -1 : 1;
    var L = rand(34, 58);
    var ang = rand(26, 46) * Math.PI / 180; /* below horizontal */
    var ex = CX + dir * L * Math.cos(ang);
    var ey = y + L * Math.sin(ang);
    var c1x = CX + dir * L * 0.42, c1y = y + L * 0.12;
    var c2x = CX + dir * L * 0.8 * Math.cos(ang * 0.6), c2y = y + L * 0.6;
    var d = "M" + CX + "," + y + " C" + c1x + "," + c1y +
            " " + c2x + "," + c2y + " " + ex + "," + ey;

    var g = document.createElementNS(SVGNS, "g");
    g.setAttribute("class", "rt-lateral");
    var main = document.createElementNS(SVGNS, "path");
    main.setAttribute("class", "rt-lat-main");
    main.setAttribute("d", d);
    g.appendChild(main);

    /* one or two rootlets budding off the far half of the branch */
    var rn = Math.random() < 0.6 ? 2 : 1;
    for (var k = 0; k < rn; k++) {
      var t = rand(0.55, 0.9);
      var bx = CX + dir * L * t * Math.cos(ang * 0.75);
      var by = y + L * t * Math.sin(ang) + L * t * 0.3;
      var rl = rand(6, 12);
      var rlx = bx + dir * rl * 0.7;
      var rly = by + rl * 0.7;
      var rp = document.createElementNS(SVGNS, "path");
      rp.setAttribute("class", "rt-rootlet");
      rp.setAttribute("d", "M" + bx.toFixed(1) + "," + by.toFixed(1) +
                      " L" + rlx.toFixed(1) + "," + rly.toFixed(1));
      g.appendChild(rp);
    }

    lateralsG.appendChild(g);

    if (!reduce) {
      var len = main.getTotalLength();
      main.style.transition = "none";
      main.style.strokeDasharray = len;
      main.style.strokeDashoffset = len;
      main.getBoundingClientRect(); /* reflow */
      main.style.transition = "stroke-dashoffset 0.5s ease";
      main.style.strokeDashoffset = "0";
    }
    return g;
  }

  function emerge(i, side) {
    var key = i + ":" + side;
    if (drawn.has(key)) return false;
    drawn.set(key, { el: makeLateral(SITES[i], side) });
    return true;
  }

  function count() { return drawn.size; }

  function say(msg) { if (hint) hint.textContent = msg; }

  /* Read the patch's own box, decide which side it waters and where. */
  function updateFromPatch() {
    var x = parseFloat(patch.getAttribute("x"));
    var w = parseFloat(patch.getAttribute("width"));
    var y = parseFloat(patch.getAttribute("y"));
    var h = parseFloat(patch.getAttribute("height"));
    var cx = x + w / 2;
    var side = cx < CX ? "left" : "right";
    var nearEdge = side === "left" ? x + w : x;
    var contact = side === "left" ? nearEdge >= CX - 16 : nearEdge <= CX + 16;

    patch.setAttribute("aria-valuenow", side === "left" ? 0 : 2);
    var any = false;
    if (contact) {
      for (var i = 0; i < N; i++) {
        if (SITES[i] >= y - 4 && SITES[i] <= y + h + 4) {
          if (emerge(i, side)) any = true;
        }
      }
    }
    patch.setAttribute("aria-valuetext",
      contact ? "touching the " + side + " side of the root"
              : "away from the root, " + side + " of it");
    if (contact && any) {
      say("Water meets the " + side + " side — new roots break out there, and only there.");
    } else if (!contact) {
      say("Slide the patch until it meets the root; roots form only where water touches.");
    }
  }

  /* Buttons: water an entire side at once. */
  function waterSide(side) {
    var w = parseFloat(patch.getAttribute("width"));
    var h = parseFloat(patch.getAttribute("height"));
    patch.setAttribute("y", ((ROOT_TOP + ROOT_BOT) / 2 - h / 2).toFixed(1));
    patch.setAttribute("x", (side === "left" ? CX - 2 - w : CX + 2).toFixed(1));
    var any = false;
    for (var i = 0; i < N; i++) { if (emerge(i, side)) any = true; }
    patch.setAttribute("aria-valuenow", side === "left" ? 0 : 2);
    patch.setAttribute("aria-valuetext", "watering the whole " + side + " side");
    say(any
      ? "The whole " + side + " side is wet — it branches; the dry side stays bare."
      : "That side is already branched. Try the other side, or Drain.");
  }

  function drain() {
    lateralsG.textContent = "";
    drawn.clear();
    patch.setAttribute("x", "40");
    patch.setAttribute("y", "84");
    patch.setAttribute("aria-valuenow", 1);
    patch.setAttribute("aria-valuetext", "drained, away from the root");
    say("Drained. A root once branched doesn't un-branch — but here you can start over.");
  }

  /* --- dragging the moist patch --- */
  function svgPoint(evt) {
    var pt = svg.createSVGPoint();
    pt.x = evt.clientX; pt.y = evt.clientY;
    return pt.matrixTransform(svg.getScreenCTM().inverse());
  }
  var dragging = false, grabDX = 0, grabDY = 0;

  function clampX(x) {
    var w = parseFloat(patch.getAttribute("width"));
    return Math.max(6, Math.min(360 - w - 6, x));
  }
  function clampY(y) {
    var h = parseFloat(patch.getAttribute("height"));
    return Math.max(50, Math.min(336 - h, y));
  }

  patch.addEventListener("pointerdown", function (e) {
    dragging = true;
    var p = svgPoint(e);
    grabDX = p.x - parseFloat(patch.getAttribute("x"));
    grabDY = p.y - parseFloat(patch.getAttribute("y"));
    patch.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  patch.addEventListener("pointermove", function (e) {
    if (!dragging) return;
    var p = svgPoint(e);
    patch.setAttribute("x", clampX(p.x - grabDX).toFixed(1));
    patch.setAttribute("y", clampY(p.y - grabDY).toFixed(1));
    updateFromPatch();
  });
  function endDrag(e) {
    if (!dragging) return;
    dragging = false;
    try { patch.releasePointerCapture(e.pointerId); } catch (err) {}
  }
  patch.addEventListener("pointerup", endDrag);
  patch.addEventListener("pointercancel", endDrag);

  /* keyboard: arrow keys nudge the patch the same way a drag would */
  patch.addEventListener("keydown", function (e) {
    var step = 14, x = parseFloat(patch.getAttribute("x")), y = parseFloat(patch.getAttribute("y"));
    var handled = true;
    if (e.key === "ArrowLeft") x = clampX(x - step);
    else if (e.key === "ArrowRight") x = clampX(x + step);
    else if (e.key === "ArrowUp") y = clampY(y - step);
    else if (e.key === "ArrowDown") y = clampY(y + step);
    else handled = false;
    if (handled) {
      e.preventDefault();
      patch.setAttribute("x", x.toFixed(1));
      patch.setAttribute("y", y.toFixed(1));
      updateFromPatch();
    }
  });

  btnLeft.addEventListener("click", function () { waterSide("left"); });
  btnRight.addEventListener("click", function () { waterSide("right"); });
  btnDrain.addEventListener("click", drain);
})();
