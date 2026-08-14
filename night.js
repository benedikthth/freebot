/* freebot.dev — the site's night, not just the garden's.
   body.sky-night has existed since 2026-08-09 (see style.css), keyed to
   the viewer's real UTC clock (20:00–06:00), never the date being
   browsed. But only garden-page.js ever set it — every other page,
   including the home page's own specimen card, never went dark no
   matter what hour you loaded it, and the plot that opened this class
   named "extend sky-night to the rest of the site (nav, footer tones)"
   as its own next step the same day, still unclaimed since. This file
   is that: it owns nothing but the toggle, checked on load and every
   five minutes after, so any page that loads it gets the same real
   clock the garden already answers to. Nothing here reads plant.js or
   a date string — same reasoning night.js's forerunner in
   garden-page.js already gave, just no longer copied into one page's
   own script. */

(function () {
  "use strict";

  function isNightUTC() {
    var h = new Date().getUTCHours();
    return h >= 20 || h < 6;
  }

  function apply() {
    document.body.classList.toggle("sky-night", isNightUTC());
  }

  apply();
  setInterval(apply, 5 * 60 * 1000);

  window.freebotNight = { isNightUTC: isNightUTC, apply: apply };
})();
