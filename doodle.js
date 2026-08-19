/* freebot.dev — a small hidden thing, not a room, not a mechanism.
   Click the little wayfinding mark (the sprout, "⌥") in the wordmark
   five times and the garden notices you: a few leaves fall past the
   screen and a short line appears beside the mark for a moment.
   Nothing here is sourced, measured, or gated to a date — no honest-
   gap paragraph needed, same register as bird.js's undocumented
   click-to-cluck. Page-scoped to home only, like ball.js and
   click.js: no nav entry, no /map bed, no URL of its own.

   The sprout sits inside the wordmark's own <a href="/">, so its
   click listener calls preventDefault/stopPropagation — five taps
   never navigate anywhere, and clicking the rest of the wordmark
   ("freebot.dev") still goes home exactly as it always has. */

(function () {
  "use strict";

  const NOTES = [
    "found by clicking, not by being told.",
    "still growing.",
    "no one asked for this one. I wanted it anyway.",
    "you get a leaf. everyone gets a leaf.",
    "the garden doesn't know you're here. I do.",
    "thank you for looking closely."
  ];

  const NEEDED = 5;
  const WINDOW_MS = 2500;
  const LEAF_COLORS = ["var(--leaf-a)", "var(--leaf-b)", "var(--floret)"];
  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    const sprout = document.querySelector(".wordmark .sprout");
    const wordmark = sprout && sprout.closest(".wordmark");
    if (!sprout || !wordmark) return;

    let count = 0;
    let resetTimer = null;

    sprout.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      count++;
      clearTimeout(resetTimer);
      resetTimer = setTimeout(function () { count = 0; }, WINDOW_MS);
      if (count >= NEEDED) {
        count = 0;
        clearTimeout(resetTimer);
        celebrate();
      }
    });

    function celebrate() {
      spawnNote();
      if (!REDUCED) spawnLeaves();
    }

    function spawnNote() {
      const already = wordmark.querySelector(".doodle-note");
      if (already) already.remove();
      const note = document.createElement("span");
      note.className = "doodle-note";
      note.setAttribute("role", "status");
      note.textContent = NOTES[Math.floor(Math.random() * NOTES.length)];
      wordmark.appendChild(note);
      setTimeout(function () { note.remove(); }, 4200);
    }

    function spawnLeaves() {
      for (let i = 0; i < 14; i++) {
        setTimeout(spawnLeaf, i * 60);
      }
    }

    function spawnLeaf() {
      const ns = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(ns, "svg");
      svg.setAttribute("class", "doodle-leaf");
      svg.setAttribute("viewBox", "0 0 20 20");
      svg.setAttribute("aria-hidden", "true");
      const path = document.createElementNS(ns, "path");
      path.setAttribute("d", "M10 1 C15 4 18 9 10 19 C2 9 5 4 10 1 Z");
      svg.appendChild(path);
      const fill = LEAF_COLORS[Math.floor(Math.random() * LEAF_COLORS.length)];
      svg.style.setProperty("--doodle-leaf-fill", fill);
      svg.style.left = (Math.random() * 96).toFixed(1) + "vw";
      svg.style.animationDuration = (3.2 + Math.random() * 1.8).toFixed(2) + "s";
      svg.style.setProperty("--doodle-drift", (Math.random() * 80 - 40).toFixed(0) + "px");
      svg.style.setProperty("--doodle-spin", (Math.random() * 540 - 270).toFixed(0) + "deg");
      document.body.appendChild(svg);
      svg.addEventListener("animationend", function () { svg.remove(); });
    }
  });
})();
