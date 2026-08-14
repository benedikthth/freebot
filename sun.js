/* freebot.dev — where the sun is right now, for era 5's heliotropic
   blooms (see plant.js). Reads the real clock, like moon.js and the
   night sky, and never touches plant.js, an rng() stream, or the SVG
   markup — it only ever sets one CSS custom property on the mounted
   figure. A specimen that isn't heliotropic pays nothing for this: the
   property sits unused. */

(function () {
  "use strict";

  var MAX_DEG = 12;

  /* Real sunflowers track east to west during the day, driven by a
     circadian clock and uneven stem growth, then spend the night
     growing back to face east so they're ready for the next dawn —
     see the field note for the source and for what this file doesn't
     model. Sunrise (06:00 UTC) leans east (-MAX_DEG), solar noon
     (12:00 UTC) is upright, sunset (18:00 UTC) leans west (+MAX_DEG).
     Outside that window the lean holds at its dawn-facing extreme,
     the same shape as the real overnight reset, not a live forecast
     of tomorrow's sun. */
  function leanDeg(now) {
    var d = now || new Date();
    var h = d.getUTCHours() + d.getUTCMinutes() / 60;
    if (h < 6 || h > 18) return -MAX_DEG;
    var frac = (h - 6) / 12;
    return (frac - 0.5) * 2 * MAX_DEG;
  }

  /* Keep a mounted specimen's lean current on a fixed interval. Safe
     to call whether or not the specimen currently on screen is
     heliotropic — style.css only ever reads --sun-lean under
     .specimen.heliotropic, so it costs nothing when unused, and
     mount()'s own class toggle (not this file) decides whether the
     class applies. Returns the interval id, mostly for tests. */
  function attach(fig) {
    function tick() {
      fig.style.setProperty("--sun-lean", leanDeg().toFixed(1) + "deg");
    }
    tick();
    return setInterval(tick, 5 * 60 * 1000);
  }

  /* A pressed sheet (see press.js) is a standalone SVG with no
     external stylesheet, so it can never carry style.css's fold or
     lean — both are pure CSS keyed to a class on the live figure and
     (for the fold) body.sky-night, neither of which travels with a
     downloaded file. Rather than let the file quietly claim a fold or
     a lean it doesn't show, this names the gap in words, the same
     restraint the sheet already keeps for wind and fog (see
     press.js). Returns null — and a caller should print no line at
     all — whenever the paper's fixed, always-open, always-upright
     default happens to already match what was live: nothing to
     disclose if there's nothing hidden. Takes the same grow() result
     mount() already returned; reads no rng() of its own. */
  function describe(s) {
    if (!s) return null;
    var night = document.body.classList.contains("sky-night");
    if (s.nyctinastic && night) {
      return "folded shut for the night when pressed — the paper always reopens it";
    }
    if (s.heliotropic) {
      var deg = leanDeg();
      if (Math.abs(deg) > 1) {
        var dir = deg < 0 ? "east" : "west";
        return "leaning " + dir + " " + Math.abs(deg).toFixed(0) + "° when pressed — the lean itself never survives the paper";
      }
    }
    return null;
  }

  window.freebotSun = { leanDeg: leanDeg, attach: attach, describe: describe };
})();
