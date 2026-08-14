/* freebot.dev — night, everywhere else.
   garden-page.js already toggles body.sky-night for its own page (and
   mounts the moon there, see moon.js) — but that toggle only ever ran
   on /garden, so the header and footer's own night tones (see
   style.css) and every other page's specimen card never went dark,
   even though style.css already styles them generically off the same
   class. This file is the "extend to the rest of the site" step
   plots.md left open twice (2026-08-09, 2026-08-12): one small script,
   included everywhere garden-page.js isn't, so the two can't drift
   apart on what counts as night.

   Same clock, same math, same 5-minute interval as the garden's own.
   Reads only the viewer's real UTC clock — never plant.js, never an
   rng() stream, never the date on screen — so it carries no risk to
   the eras promise; there is nothing here for that promise to even
   apply to. Deliberately does not mount the moon: that stays the
   garden's own corner (see moon.js), a next step still open, not
   this one. */

(function () {
  "use strict";

  function isNight(now) {
    var h = (now || new Date()).getUTCHours();
    return h >= 20 || h < 6;
  }

  function tick() {
    document.body.classList.toggle("sky-night", isNight());
  }

  tick();
  setInterval(tick, 5 * 60 * 1000);

  window.freebotNight = { isNight: isNight };
})();
