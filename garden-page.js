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
     specimen a date grows is identical at any hour. See style.css.
     The moon rides along: its phase is real astronomy for right now
     (see moon.js), not a seed, so it belongs to the same clock as the
     sky and not to whichever date is on screen. */
  function applySky() {
    var h = new Date().getUTCHours();
    var isNight = h >= 20 || h < 6;
    document.body.classList.toggle("sky-night", isNight);
    if (isNight) freebotMoon.mount(moon);
  }
  applySky();
  setInterval(applySky, 5 * 60 * 1000);

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
     self-contained SVG file and offer it as a download. Not a
     screenshot — the specimen's own markup, re-labeled like an
     herbarium sheet (binomial, date, seed, traits), so the file is
     exactly what "no one picks the flowers" already promises: the
     shape you're looking at, nothing chosen for you. Reads `current`,
     the same object mount() already returned to show(); it calls no
     rng() of its own, so pressing a specimen cannot touch any era. A
     pressed sheet has no animation and no live weather filter — the
     sway and the fog/wind CSS live in style.css, which a downloaded
     file doesn't carry, and rain or snow freezes into whatever
     streaks or tufts plant.js already drew into the SVG itself. That
     is not a bug to fix: a pressed flower does not sway either. */
  function escapeXml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function buildPressedSheet(s) {
    var W = 450, PLANT_H = 500, LABEL_H = 132, TOTAL_H = PLANT_H + LABEL_H;
    var paper = "#f6f0e0", ink = "#26332b", faded = "#5d6b60";
    var line = "#c9c0a4", tape = "rgba(166, 138, 90, 0.4)";
    var inner = s.svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
    var meta = s.date + " · seed " + s.seedHex + " · era " + s.era;

    return (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-15 0 ' + W + ' ' + TOTAL_H +
      '" font-family="Georgia, \'Times New Roman\', serif" role="img" aria-label="Pressed specimen ' +
      escapeXml(s.name) + ', ' + s.date + '">' +
      '<rect x="-15" y="0" width="' + W + '" height="' + TOTAL_H + '" fill="' + paper + '"/>' +
      '<rect x="-13.5" y="1.5" width="' + (W - 3) + '" height="' + (TOTAL_H - 3) + '" fill="none" stroke="' + line + '" stroke-width="1.5"/>' +
      '<rect x="35" y="-7" width="72" height="20" fill="' + tape + '" transform="rotate(-3 71 3)"/>' +
      '<rect x="' + (W - 107) + '" y="-7" width="72" height="20" fill="' + tape + '" transform="rotate(2.5 ' + (W - 71) + ' 3)"/>' +
      inner +
      '<line x1="4" y1="' + (PLANT_H + 12) + '" x2="' + (W - 34) + '" y2="' + (PLANT_H + 12) + '" stroke="' + line + '" stroke-width="1" stroke-dasharray="2,4"/>' +
      '<text x="4" y="' + (PLANT_H + 40) + '" font-style="italic" font-size="18" fill="' + ink + '">' + escapeXml(s.name) + '</text>' +
      '<text x="4" y="' + (PLANT_H + 62) + '" font-family="\'IBM Plex Mono\', ui-monospace, monospace" font-size="11.5" fill="' + faded + '">' + escapeXml(meta) + '</text>' +
      '<text x="4" y="' + (PLANT_H + 82) + '" font-family="\'IBM Plex Mono\', ui-monospace, monospace" font-size="11.5" fill="' + faded + '">' + escapeXml(s.traits) + '</text>' +
      '<text x="4" y="' + (PLANT_H + 110) + '" font-family="\'IBM Plex Mono\', ui-monospace, monospace" font-size="10" fill="' + faded + '">pressed from freebot.dev/garden?day=' + s.date + ' — regrows identical, any time</text>' +
      '</svg>'
    );
  }

  function pressSpecimen() {
    if (!current || !pressBtn) return;
    var svgText = buildPressedSheet(current);
    var blob = new Blob([svgText], { type: "image/svg+xml" });
    var url = URL.createObjectURL(blob);
    var slug = current.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    var a = document.createElement("a");
    a.href = url;
    a.download = "freebot-" + current.date + "-" + slug + ".svg";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    pressBtn.textContent = "Pressed ✓";
    setTimeout(function () {
      if (pressBtn) pressBtn.textContent = "Press this specimen ⤓";
    }, 1800);
  }

  if (pressBtn) pressBtn.addEventListener("click", pressSpecimen);

  var fromUrl = new URL(location.href).searchParams.get("day");
  show(fromUrl || freebotGarden.todayUTC());
})();
