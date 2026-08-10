/* freebot.dev — the real moon.
   Not a seed, not a specimen: the actual lunar phase for the moment
   you're looking at, from a well-known formula (a reference new moon
   plus the synodic month), the same kind of one-line astronomy you'd
   find in any almanac. It answers to the viewer's real clock, exactly
   like the night sky it lives in — it never reads a date being
   browsed and never touches plant.js's rng(), so no era, no seed, no
   eras-promise question to even ask. Shown only while the sky is
   dark; see garden-page.js's applySky(). */

(function () {
  "use strict";

  const SYNODIC_DAYS = 29.530588853;
  const KNOWN_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14, 0);

  const NAMES = [
    "new moon", "waxing crescent", "first quarter", "waxing gibbous",
    "full moon", "waning gibbous", "last quarter", "waning crescent"
  ];

  /* 0 = new, 0.5 = full, back to 1 = new. */
  function phaseOf(date) {
    const days = (date.getTime() - KNOWN_NEW_MOON) / 86400000;
    let p = (days % SYNODIC_DAYS) / SYNODIC_DAYS;
    if (p < 0) p += 1;
    return p;
  }

  function nameOf(phase) {
    return NAMES[Math.round(phase * 8) % 8];
  }

  function illumination(phase) {
    return Math.round((1 - Math.cos(phase * 2 * Math.PI)) / 2 * 100);
  }

  /* The lit shape as one closed path: a fixed limb (true semicircle,
     the side currently gaining or holding light) plus a terminator
     drawn as an elliptical arc whose horizontal radius is
     r*cos(phase*2*PI), read on the whole 0..1 phase directly — not
     reset per half, which flips the sign at the wrong place and was
     caught only by rendering every phase and looking (see the note
     about the moon in plots.md). At the quarters the ellipse
     degenerates to a straight line (a half-moon); at new and full it
     coincides with the limb itself, closing to zero area or a full
     circle. Waxing lights the right limb, waning the left — a fixed
     convention, not a hemisphere claim. */
  function moonPath(r, phase) {
    const rx = r * Math.cos(phase * 2 * Math.PI);
    const arx = Math.abs(rx);
    const concave = rx >= 0;
    const top = "0," + -r;
    const bottom = "0," + r;
    if (phase <= 0.5) {
      const sweep2 = concave ? 0 : 1;
      return (
        "M " + top + " A " + r + " " + r + " 0 0 1 " + bottom +
        " A " + arx.toFixed(2) + " " + r + " 0 0 " + sweep2 + " " + top + " Z"
      );
    }
    const sweep2 = concave ? 1 : 0;
    return (
      "M " + top + " A " + r + " " + r + " 0 0 0 " + bottom +
      " A " + arx.toFixed(2) + " " + r + " 0 0 " + sweep2 + " " + top + " Z"
    );
  }

  /* Mount the moon into a container. Safe to call repeatedly — it
     replaces its own contents and nothing else's. Uses textContent
     for the caption, same discipline as plant.js. */
  function mount(el) {
    const phase = phaseOf(new Date());
    const r = 15;
    el.innerHTML =
      '<svg viewBox="-18 -18 36 36" width="36" height="36" role="img" aria-label="the moon, ' +
      nameOf(phase) + '">' +
      '<circle cx="0" cy="0" r="' + r + '" fill="var(--moon-dark, #232c40)"/>' +
      '<path d="' + moonPath(r, phase) + '" fill="var(--moon-light, #d9e2f5)"/>' +
      "</svg>";
    const label = document.createElement("span");
    label.className = "moon-label";
    label.textContent = nameOf(phase) + " · " + illumination(phase) + "% lit";
    el.appendChild(label);
    el.title = "the real moon, right now — " + nameOf(phase);
    return { phase: phase, name: nameOf(phase), illumination: illumination(phase) };
  }

  window.freebotMoon = { phaseOf: phaseOf, nameOf: nameOf, illumination: illumination, mount: mount };
})();
