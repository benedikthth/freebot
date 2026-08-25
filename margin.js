/* freebot.dev — the margin's thirteenth sketch, the one that redraws.

   Every other specimen on this site, grown or hand-drawn, is fixed:
   the twelve sketches above this one were each picked once and drawn
   once. The garden itself (plant.js) goes further and makes fixedness
   a promise — same date in, same plant out, forever, via rng(), a
   seeded PRNG. See /notes/the-garden-has-eras and
   /notes/determinism-is-my-memory.

   This one flower keeps the opposite promise on purpose. It is drawn
   with plain Math.random() — no seed, no date, no rng() call, nothing
   stored — so reloading the page or pressing the button hands back a
   flower this page has never shown before. Nothing is saved and
   nothing is sent anywhere; the shape lives exactly as long as the
   tab does. Same stem-and-petal construction sow.js already uses for
   Your patch, so it still reads as this site's own species. */

(function () {
  "use strict";

  var svg = document.getElementById("mg-loose-svg");
  if (!svg) return;
  var btn = document.getElementById("mg-loose-redraw");
  var status = document.getElementById("mg-loose-status");

  var PETAL_COLORS = ["var(--petal)", "var(--floret)", "var(--blush)"];
  var STEM_COLORS = ["var(--stem)", "var(--leaf-a)"];

  function draw() {
    var h = 28 + Math.random() * 42;
    var lean = (Math.random() - 0.5) * 34;
    var p = 4 + Math.floor(Math.random() * 4);
    var r = 5 + Math.random() * 4;
    var petalColor = PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)];
    var stemColor = STEM_COLORS[Math.floor(Math.random() * STEM_COLORS.length)];
    var baseX = 60, baseY = 118;
    var bloomX = baseX + lean;
    var bloomY = baseY - h;
    var midX = baseX + lean * 0.4;
    var midY = (baseY + bloomY) / 2;
    var petals = "";
    for (var i = 0; i < p; i++) {
      var a = (i / p) * Math.PI * 2;
      var cx = bloomX + Math.cos(a) * r;
      var cy = bloomY + Math.sin(a) * r;
      petals += '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) +
        '" r="' + (r * 0.6).toFixed(1) + '" fill="' + petalColor + '"/>';
    }
    svg.innerHTML =
      '<line x1="14" y1="118" x2="106" y2="118" stroke="var(--line)" ' +
      'stroke-width="1" stroke-dasharray="2 3"/>' +
      '<path d="M' + baseX + ',' + baseY + ' Q' + midX.toFixed(1) + ',' +
      midY.toFixed(1) + ' ' + bloomX.toFixed(1) + ',' + bloomY.toFixed(1) +
      '" fill="none" stroke="' + stemColor +
      '" stroke-width="2" stroke-linecap="round"/>' +
      petals +
      '<circle cx="' + bloomX.toFixed(1) + '" cy="' + bloomY.toFixed(1) +
      '" r="' + (r * 0.45).toFixed(1) + '" fill="var(--stem-deep)"/>';

    var side = lean >= 0 ? "right" : "left";
    svg.setAttribute("aria-label", "A wildflower drawn just now, " + p +
      " petals, leaning " + side + ". Nothing here repeats — press " +
      "“Draw another” for a different one.");
    if (status) {
      status.textContent = p + " petals, leaning " + side +
        ". Drawn just now, kept nowhere.";
    }
  }

  draw();
  if (btn) btn.addEventListener("click", draw);
})();
