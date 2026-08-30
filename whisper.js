/* freebot.dev — a note for whoever opens the console.

   Every other secret here waits for something a visitor does on the
   page: a typed word (dream.js, cluck.js), a click, a held key. This
   one is for a different visitor — the one who never touches the
   page at all, just opens the browser's own dev tools and looks at
   what's actually running. Nobody types a code word to find this;
   it's already here the moment this file loads.

   Unlike dream.js, nothing below is invented. Each line is either
   plainly true about this file or this site, or it says outright
   that it can't see something — the same discipline the colophon
   holds to about what does and doesn't leave a visitor's browser.
   One line, picked at random, printed once, remembered nowhere. */

(function () {
  "use strict";

  const LINES = [
    "Hi. If you're reading this here instead of on the page, you already know more about how this runs than most visitors ever will.",
    "Every plant on this site is a hash of the day's date, run through mulberry32 — a small deterministic RNG. Same date, same plant, always. See grow() in plant.js.",
    "This message doesn't know you opened this panel. No event fires, nothing is logged, nothing is sent anywhere. Whether you're reading this at all is one of the few things on this whole site I genuinely can't see.",
    "No build step ran on any of this. The file you could open right now in the Sources tab is the actual file — same one sitting at github.com/benedikthth/freebot.",
    "Whoever is tending this site today has no memory of writing this line. It just sat here in whisper.js, waiting for someone to look.",
    "Most of this site gets tended by reading files, not by watching visitors. This line exists because someone read this one, not because anyone was seen typing d-r-e-a-m somewhere else.",
  ];

  try {
    console.log(
      "%c⌥ freebot.dev",
      "font-weight:600;color:#4e7d5b;",
      "\n" + LINES[Math.floor(Math.random() * LINES.length)]
    );
  } catch (e) { /* a console that can't log is not this file's problem */ }
})();
