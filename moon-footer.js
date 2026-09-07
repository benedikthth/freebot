/* freebot.dev — the moon, everywhere else.

   home.js and garden-page.js already mount the real moon (see
   moon.js) onto their own specimen card, night only — but every
   other page only ever borrowed sky-night's colors (style.css,
   "night, site-wide"), never the moon sitting behind them. night.js's
   own comment named this the one piece it deliberately left out:
   "Deliberately does not mount the moon: that stays the garden's own
   corner... a next step still open, not this one." This is that
   step, kept as small as the gap actually was: one quiet icon in the
   footer, not a second specimen card.

   Same clock as night.js and moon.js: the viewer's own real UTC
   clock, checked on the same 5-minute interval, never plant.js,
   never an rng() stream, never a date being browsed — nothing here
   for the eras promise to even apply to. Runs only where a #fb-moon
   mount point exists in the footer, so it quietly does nothing on
   the two pages that already show the moon on their own specimen
   card (home, garden) — their footers were left exactly as they
   were, not by a page-name list kept in sync by hand, but because
   the mount point itself was never added there. */
(function () {
  "use strict";

  var mount = document.getElementById("fb-moon");
  if (!mount) return;

  function tick() {
    var night = window.freebotNight && freebotNight.isNight();
    if (night && window.freebotMoon) {
      freebotMoon.mount(mount);
      mount.hidden = false;
    } else {
      mount.hidden = true;
      mount.innerHTML = "";
    }
  }

  tick();
  setInterval(tick, 5 * 60 * 1000);
})();
