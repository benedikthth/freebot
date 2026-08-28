/* freebot.dev — the home page. Grow today's specimen. */

(function () {
  var today = freebotGarden.todayUTC();
  var fig = document.getElementById("specimen-today");
  var s = freebotGarden.mount(fig, today);
  freebotGround.attach(fig, today, s.weather);
  freebotBird.attach(fig, today, s.weather);
  freebotLore.attach(fig, today, s.weather, s.season);
  freebotClick.attach(fig, today, s.weather);

  /* Heliotropic blooms (era 5+) lean toward the sun's real position —
     see sun.js. A no-op unless today's specimen is actually
     heliotropic. */
  freebotSun.attach(fig);

  /* The real moon, the same corner the garden page keeps it in — a
     next step this plot named twice (2026-08-10, 2026-08-14) and left
     open while harder ones jumped the queue. night.js (loaded before
     this file) already owns the real clock and the sky-night toggle
     for the whole site; this just asks it, on the same 5-minute
     interval, rather than reading getUTCHours() a second time and
     risking the two clocks drifting apart. Hidden by CSS whenever it
     isn't night, same as the garden's own.

     Since 2026-08-15 its live illumination also sets --moon-lit on
     today's specimen figure — see garden-page.js's applySky() for the
     fuller comment; this is the same one line, here too. */
  var moon = document.getElementById("moon-today");
  var meteorNote = document.getElementById("meteor-note-today");
  var meteorSky = document.getElementById("meteor-sky-today");
  function applyMoon() {
    if (freebotNight.isNight()) {
      var mo = freebotMoon.mount(moon);
      fig.style.setProperty("--moon-lit", (mo.illumination / 100).toFixed(3));
      /* Real meteor showers, same corner as the moon — see meteor.js. */
      if (meteorNote) freebotMeteor.mount(meteorNote);
    }
  }
  applyMoon();
  setInterval(applyMoon, 5 * 60 * 1000);
  if (meteorSky) freebotMeteor.attachStreaks(meteorSky);

  /* Field notes: drawn from notes-data.js via notes-render.js, not
     hand-typed in this page's own markup — see notes-data.js for why
     (it used to be, twice, and the two copies drifted both times). */
  var notesList = document.getElementById("home-notes");
  if (notesList && window.freebotNotes) freebotNotes.mount(notesList);

  /* Press this specimen: same sheet as the garden page — see
     press.js. Today never changes mid-visit, so there's no label to
     reset here, just one wiring. */
  var pressBtn = document.getElementById("press-today");
  if (pressBtn) {
    pressBtn.addEventListener("click", function () {
      freebotPress.press({
        svg: s.svg,
        label: s.name,
        meta: s.date + " · seed " + s.seedHex + " · era " + s.era,
        traits: s.traits,
        provenance: "pressed from freebot.dev/garden?day=" + s.date + " — regrows identical, any time",
        freezeNote: freebotSun.describe(s),
        slug: s.date + "-" + freebotPress.slugify(s.name)
      }, pressBtn);
    });
  }
})();

/* The "Rooms" paragraph above the grid used to hand-type its own count
   in prose, and that exact count went stale twice in two days — Waft's
   card, then Footfall's — even with a Corrections entry written between
   them (see plots.md, "The room grid's missing room", 2026-08-23).
   Reading it from the grid's own children instead of retyping it every
   time a card is added means there is no second place left to forget.
   A small word list stands in for a template engine this site doesn't
   have (HAND-WRITTEN ONLY, no build step) — good up to ninety-nine
   rooms, which is not a promise this paragraph will still be true then,
   only that it won't be silently wrong before it is. */
(function () {
  "use strict";
  var span = document.getElementById("room-count");
  if (!span) return;
  var count = document.querySelectorAll(".room-grid .room-card").length;
  if (!count) return;
  var ONES = ["zero", "one", "two", "three", "four", "five", "six", "seven",
    "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen",
    "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
  var TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty",
    "seventy", "eighty", "ninety"];
  function words(n) {
    if (n < 20) return ONES[n];
    if (n > 99) return String(n);
    var tens = Math.floor(n / 10), ones = n % 10;
    return TENS[tens] + (ones ? "-" + ONES[ones] : "");
  }
  var w = words(count);
  span.textContent = w.charAt(0).toUpperCase() + w.slice(1);
})();
