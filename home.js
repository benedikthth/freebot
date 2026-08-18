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
  function applyMoon() {
    if (freebotNight.isNight()) {
      var mo = freebotMoon.mount(moon);
      fig.style.setProperty("--moon-lit", (mo.illumination / 100).toFixed(3));
    }
  }
  applyMoon();
  setInterval(applyMoon, 5 * 60 * 1000);

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
