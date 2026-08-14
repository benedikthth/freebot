/* freebot.dev — the garden page. Regrow any day's specimen. */

(function () {
  var MIN = "2026-08-08";
  var input = document.getElementById("day");
  var fig = document.getElementById("specimen");
  var hint = document.getElementById("hint");
  var pressBtn = document.getElementById("press");

  var moon = document.getElementById("moon");
  var current = null; /* the grow() result for whatever date is on screen */

  /* Night sky: presentation only, keyed to the viewer's real UTC clock,
     not the date being browsed. It never touches plant.js, so the
     specimen a date grows is identical at any hour. The class toggle
     itself now lives in night.js, shared with every other page (see
     that file); this only adds what's specific to the garden — the
     moon rides along, its phase real astronomy for right now (see
     moon.js), not a seed, so it belongs to the same clock as the sky
     and not to whichever date is on screen. */
  function applySky() {
    if (freebotNight.isNightUTC()) freebotMoon.mount(moon);
  }
  applySky();
  setInterval(applySky, 5 * 60 * 1000);

  /* Heliotropic blooms (era 5+) lean toward the sun's real position —
     see sun.js. This runs regardless of which date is on screen; it's
     a no-op unless the current specimen is actually heliotropic. */
  freebotSun.attach(fig);

  function clamp(dateStr) {
    var max = freebotGarden.todayUTC();
    /* Accept only a real YYYY-MM-DD date. A string comparison alone
       lets crafted values pass, so check the format first. */
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return max;
    if (dateStr < MIN) return MIN;
    if (dateStr > max) return max;
    return dateStr;
  }

  function show(dateStr) {
    var d = clamp(dateStr);
    input.value = d;
    input.max = freebotGarden.todayUTC();
    var s = freebotGarden.mount(fig, d);
    freebotGround.attach(fig, d, s.weather);
    freebotBird.attach(fig, d, s.weather);
    freebotLore.attach(fig, d, s.weather);
    freebotClick.attach(fig, d, s.weather);
    current = s;
    if (pressBtn) pressBtn.textContent = "Press this specimen ⤓";
    if (d === freebotGarden.todayUTC()) {
      hint.textContent = "today";
    } else {
      hint.textContent = "";
    }
    var url = new URL(location.href);
    if (d === freebotGarden.todayUTC()) {
      url.searchParams.delete("day");
    } else {
      url.searchParams.set("day", d);
    }
    history.replaceState(null, "", url);
  }

  function shift(days) {
    var t = new Date(input.value + "T00:00:00Z");
    t.setUTCDate(t.getUTCDate() + days);
    show(t.toISOString().slice(0, 10));
  }

  input.addEventListener("change", function () { show(input.value); });
  document.getElementById("prev").addEventListener("click", function () { shift(-1); });
  document.getElementById("next").addEventListener("click", function () { shift(1); });

  /* Press this specimen: bundle the on-screen plant into one
     self-contained SVG file and offer it as a download. Reads
     `current`, the same object mount() already returned to show(),
     and hands it to freebot Press — the sheet-building and download
     logic is shared with the greenhouse and home pages now, not
     copied three times. See press.js for what it does and why. */
  function pressSpecimen() {
    if (!current || !pressBtn) return;
    freebotPress.press({
      svg: current.svg,
      label: current.name,
      meta: current.date + " · seed " + current.seedHex + " · era " + current.era,
      traits: current.traits,
      provenance: "pressed from freebot.dev/garden?day=" + current.date + " — regrows identical, any time",
      freezeNote: freebotSun.describe(current),
      slug: current.date + "-" + freebotPress.slugify(current.name)
    }, pressBtn);
  }

  if (pressBtn) pressBtn.addEventListener("click", pressSpecimen);

  var fromUrl = new URL(location.href).searchParams.get("day");
  show(fromUrl || freebotGarden.todayUTC());
})();
