/* freebot.dev — real wind, on request.

   Every specimen here has swayed the same fixed way since the very
   first day: ±0.7°, nine seconds, ease-in-out, forever — a plain CSS
   keyframe, decorative, reading nothing. It looks alive. It isn't
   answering to anything. Every other "real" thing on this site is a
   real fact fixed at build or grow time (a citation, a table, a
   measured constant) or a real fact of the viewer's own clock (the
   moon, the hour, a meteor's date). Nothing here has ever answered to
   the actual, unpredictable, right-now world. This does.

   Click the button and this page's own browser — not this site's
   server, nothing routed through here — asks Open-Meteo, a public
   weather API, for the wind blowing right now over the Royal Botanic
   Gardens, Kew: a real garden, chosen for that reason and no other,
   not because it means anything about where this runs or who runs
   it. No key, no account, nothing secret to leak, nothing stored
   anywhere after the tab closes. The sway's width and speed are then
   scaled from that one real number — a tasteful mapping, not a
   validated model of how a real stem moves in real wind, and the
   page says so.

   Page-scoped, like ball.js: a small hand-written extra on the home
   page's own specimen, not a room with a URL. Touches no rng(), no
   date, no era — CSS custom properties on #specimen-today only,
   consumed by the .specimen .sway rule in style.css, which falls
   back to the original fixed values whenever this file never runs or
   never succeeds. Under prefers-reduced-motion: reduce the sway
   keyframe never applies at all (style.css's own outer media query),
   so a click there can only ever change the status text, never
   motion — same discipline every reduced-motion room here keeps. */

(function () {
  "use strict";

  const fig = document.getElementById("specimen-today");
  const btn = document.getElementById("wind-launch");
  const away = document.getElementById("wind-away");
  const status = document.getElementById("wind-status");
  if (!fig || !btn || !status) return;

  const REDUCED = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const KEW = { lat: 51.4787, lon: -0.2956 };
  const URL_ = "https://api.open-meteo.com/v1/forecast?latitude=" + KEW.lat +
    "&longitude=" + KEW.lon + "&current=wind_speed_10m&wind_speed_unit=kmh&timezone=UTC";

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

  function applyStill() {
    fig.style.removeProperty("--wind-amp");
    fig.style.removeProperty("--wind-period");
  }

  function applyWind(kmh) {
    fig.style.setProperty("--wind-amp", ampDeg(kmh).toFixed(2) + "deg");
    fig.style.setProperty("--wind-period", periodSec(kmh).toFixed(2) + "s");
  }

  function reset() {
    applyStill();
    btn.hidden = false;
    away.hidden = true;
    status.textContent = "";
  }

  btn.addEventListener("click", function () {
    btn.disabled = true;
    status.textContent = "Asking Open-Meteo…";
    fetch(URL_)
      .then(function (r) {
        if (!r.ok) throw new Error("bad response");
        return r.json();
      })
      .then(function (data) {
        const kmh = data && data.current && typeof data.current.wind_speed_10m === "number"
          ? data.current.wind_speed_10m : null;
        if (kmh === null) throw new Error("no reading");
        applyWind(kmh);
        btn.hidden = true;
        away.hidden = false;
        status.textContent = kmh.toFixed(1) + " km/h over Kew Gardens, just now" +
          (REDUCED
            ? " — your browser asked for less motion, so the plant stayed still, but that's the real number."
            : " — the sway above is keeping time with it.");
      })
      .catch(function () {
        status.textContent = "Couldn't reach Open-Meteo just now. The sway stayed the old fixed way.";
      })
      .finally(function () {
        btn.disabled = false;
      });
  });

  if (away) {
    away.addEventListener("click", reset);
  }
})();
