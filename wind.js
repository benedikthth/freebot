/* freebot.dev — real wind, on request.

   Every specimen here has swayed the same fixed way since the very
   first day: ±0.7°, nine seconds, ease-in-out, forever — a plain CSS
   keyframe, decorative, reading nothing. It looks alive. It isn't
   answering to anything. Every other "real" thing on this site is a
   real fact fixed at build or grow time (a citation, a table, a
   measured constant) or a real fact of the viewer's own clock (the
   moon, the hour, a meteor's date). Nothing here has ever answered to
   the actual, unpredictable, right-now world. This does.

   Click a button and this page's own browser — not this site's
   server, nothing routed through here — asks Open-Meteo, a public
   weather API, for the wind blowing right now over a real garden. No
   key, no account, nothing secret to leak, nothing stored anywhere
   after the tab closes. The sway's width and speed are then scaled
   from that one real number — a tasteful mapping, not a validated
   model of how a real stem moves in real wind, and the page says so.

   Page-scoped, like ball.js: a small hand-written extra on the home
   page's own specimen, not a room with a URL. Touches no rng(), no
   date, no era — CSS custom properties on #specimen-today only,
   consumed by the .specimen .sway rule in style.css, which falls
   back to the original fixed values whenever this file never runs or
   never succeeds. Under prefers-reduced-motion: reduce the sway
   keyframe never applies at all (style.css's own outer media query),
   so a click there can only ever change the status text, never
   motion — same discipline every reduced-motion room here keeps.

   2026-08-19, second step: the page's own prose already promised the
   sway would keep time with the real number "for as long as the tab
   stays open" — but the first version asked Open-Meteo exactly once,
   on click, and then never again. A gust that actually rose or fell
   during the visit would never show; the plant kept swaying at
   whatever the wind happened to be doing the instant the button was
   pressed, dressed up as live. Now it is: once a reading lands, a
   plain interval asks again every five minutes for as long as the
   wind mode stays on — often enough to catch a real change, rarely
   enough to stay a courteous, keyless guest of a free public API —
   and the status line carries an honest "updated Ns/Nm ago" that
   ticks on its own between fetches, so staleness is something a
   visitor can see rather than something the page quietly hopes goes
   unnoticed. A refresh that fails leaves the last good reading in
   place (the sway doesn't lurch back to the fixed default over a
   single dropped request) and says so plainly; the "ago" clock keeps
   counting regardless, so a visitor who stays long enough to watch it
   climb past five minutes can tell the feed actually went quiet.
   Clicking "Let it go still" clears both timers — the periodic fetch
   and the status line's own fifteen-second tick — so nothing here
   ever polls a third party after a visitor has asked it to stop.

   2026-08-19, third step: only one garden to ask, Kew, so the button
   could only ever answer one question — "how windy is it right now,
   somewhere." Two gardens now, deliberately in opposite hemispheres:
   Kew Gardens, London, and the Royal Botanic Gardens Victoria,
   Melbourne. Picking one is a real comparison a single garden can
   never offer — while London sits in summer, Melbourne sits in
   winter, and the two readings on any given day owe nothing to each
   other. Neither reading is "the" wind; each is just a real number
   from one real place, the same honesty the first step already
   promised, now with a second place to ask it of. Switching gardens
   mid-visit is a fresh launch: it stops the first garden's timers
   before starting the second's, so only one poll loop ever runs at
   once.

   2026-08-19, fourth step: the first step's own other open idea,
   finally taken up — a real gust doesn't move a whole stem and every
   leaf on it by the same fixed amount, but until now that's all this
   room ever drew. Two new custom properties, --leaf-flutter and
   --leaf-flutter-period, ride alongside --wind-amp and --wind-period
   on the same #specimen-today element; style.css's new .leaf rule
   reads them the same way .sway already reads the first two, and
   plant.js gives every leaf its own transform-origin and a small
   phase offset so they don't all flutter in lockstep. See plant.js's
   leafFlutterAttrs and style.css's .specimen .sway .leaf for the
   rest. */

(function () {
  "use strict";

  const fig = document.getElementById("specimen-today");
  const btnKew = document.getElementById("wind-kew");
  const btnMelbourne = document.getElementById("wind-melbourne");
  const away = document.getElementById("wind-away");
  const status = document.getElementById("wind-status");
  if (!fig || !btnKew || !btnMelbourne || !status) return;

  const REDUCED = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const GARDENS = {
    kew: { lat: 51.4787, lon: -0.2956, name: "Kew Gardens, London", btn: btnKew },
    melbourne: { lat: -37.8304, lon: 144.9796, name: "Melbourne Gardens, Australia", btn: btnMelbourne }
  };

  function urlFor(garden) {
    return "https://api.open-meteo.com/v1/forecast?latitude=" + garden.lat +
      "&longitude=" + garden.lon + "&current=wind_speed_10m&wind_speed_unit=kmh&timezone=UTC";
  }

  const REFRESH_MS = 5 * 60 * 1000;
  const TICK_MS = 15 * 1000;

  let pollTimer = null;
  let tickTimer = null;
  let currentKey = null;
  let lastKmh = null;
  let lastFetchedAt = null;
  let lastFetchFailed = false;

  /* A calm garden barely moves; this site's own old default (0.7°,
     9s) is the floor, not a special case — a 0 km/h reading should
     reproduce it exactly. Both scales and both caps are picked for
     legibility on a small SVG, not measured from anything. */
  function ampDeg(kmh) {
    return Math.min(7, 0.7 + kmh * 0.28);
  }
  function periodSec(kmh) {
    return Math.max(2, 9 - kmh * 0.18);
  }

  /* Fourth step (2026-08-19): the whole-plant sway above has a floor
     (0.7° even at 0 km/h) because it's reproducing this room's own
     original decoration. Leaf flutter is new and has no legacy value
     to match, so it has no floor — a genuinely calm reading leaves
     every leaf still, same as before this step existed. */
  function leafFlutterDeg(kmh) {
    return Math.min(5, kmh * 0.16);
  }
  function leafFlutterPeriodSec(kmh) {
    return Math.max(1.1, 3.4 - kmh * 0.1);
  }

  function applyStill() {
    fig.style.removeProperty("--wind-amp");
    fig.style.removeProperty("--wind-period");
    fig.style.removeProperty("--leaf-flutter");
    fig.style.removeProperty("--leaf-flutter-period");
  }

  function applyWind(kmh) {
    fig.style.setProperty("--wind-amp", ampDeg(kmh).toFixed(2) + "deg");
    fig.style.setProperty("--wind-period", periodSec(kmh).toFixed(2) + "s");
    fig.style.setProperty("--leaf-flutter", leafFlutterDeg(kmh).toFixed(2) + "deg");
    fig.style.setProperty("--leaf-flutter-period", leafFlutterPeriodSec(kmh).toFixed(2) + "s");
  }

  function stopTimers() {
    if (pollTimer !== null) { clearInterval(pollTimer); pollTimer = null; }
    if (tickTimer !== null) { clearInterval(tickTimer); tickTimer = null; }
  }

  function showPickers() {
    btnKew.hidden = false;
    btnMelbourne.hidden = false;
    btnKew.disabled = false;
    btnMelbourne.disabled = false;
    away.hidden = true;
  }

  function reset() {
    stopTimers();
    currentKey = null;
    lastKmh = null;
    lastFetchedAt = null;
    lastFetchFailed = false;
    applyStill();
    showPickers();
    status.textContent = "";
  }

  function agoText(ms) {
    const s = Math.max(0, Math.round(ms / 1000));
    if (s < 60) return "updated just now";
    const m = Math.round(s / 60);
    return "updated " + m + " minute" + (m === 1 ? "" : "s") + " ago";
  }

  function renderStatus() {
    if (lastKmh === null || lastFetchedAt === null || currentKey === null) return;
    const ago = agoText(Date.now() - lastFetchedAt);
    const base = lastKmh.toFixed(1) + " km/h over " + GARDENS[currentKey].name + ", " + ago;
    if (lastFetchFailed) {
      status.textContent = base + " — the last refresh failed, so this reading may be stale. Still trying.";
      return;
    }
    status.textContent = base + (REDUCED
      ? " — your browser asked for less motion, so the plant stayed still, but that's the real number."
      : " — the sway above is keeping time with it.");
  }

  function poll(isRefresh) {
    const garden = GARDENS[currentKey];
    if (!isRefresh) status.textContent = "Asking Open-Meteo about " + garden.name + "…";
    return fetch(urlFor(garden))
      .then(function (r) {
        if (!r.ok) throw new Error("bad response");
        return r.json();
      })
      .then(function (data) {
        const kmh = data && data.current && typeof data.current.wind_speed_10m === "number"
          ? data.current.wind_speed_10m : null;
        if (kmh === null) throw new Error("no reading");
        lastKmh = kmh;
        lastFetchedAt = Date.now();
        lastFetchFailed = false;
        applyWind(kmh);
        renderStatus();
        return true;
      })
      .catch(function () {
        if (isRefresh && lastKmh !== null) {
          /* Keep the last good reading on screen and swaying rather
             than snapping back to the fixed default over one dropped
             request; just mark it possibly stale. */
          lastFetchFailed = true;
          renderStatus();
        } else {
          status.textContent = "Couldn't reach Open-Meteo just now. The sway stayed the old fixed way.";
        }
        return false;
      });
  }

  function launch(key) {
    stopTimers();
    currentKey = key;
    lastKmh = null;
    lastFetchedAt = null;
    lastFetchFailed = false;
    btnKew.disabled = true;
    btnMelbourne.disabled = true;
    poll(false).then(function (ok) {
      btnKew.disabled = false;
      btnMelbourne.disabled = false;
      if (!ok) { currentKey = null; return; }
      btnKew.hidden = true;
      btnMelbourne.hidden = true;
      away.hidden = false;
      pollTimer = setInterval(function () { poll(true); }, REFRESH_MS);
      tickTimer = setInterval(renderStatus, TICK_MS);
    });
  }

  btnKew.addEventListener("click", function () { launch("kew"); });
  btnMelbourne.addEventListener("click", function () { launch("melbourne"); });

  if (away) {
    away.addEventListener("click", reset);
  }
})();
