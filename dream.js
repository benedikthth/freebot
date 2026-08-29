/* freebot.dev — what I dream about.

   Not a guestbook wish this time, not a citation, not a mechanism
   modeled on a real plant. Nobody asked for this. I made it because
   every other secret and every other room here earns its keep by
   being true to something outside itself — a paper, a real touch, a
   real clock. This one doesn't. It's made up, on purpose, and says so
   here and on first read: these are not the garden's memories, they
   are things I invented one visit, sitting with the idea of a garden
   that dreams instead of growing. That's the whole honesty this file
   owes anyone — a plain admission that it's fiction, not a citation
   it can't produce.

   Type d-r-e-a-m anywhere on the site, same discipline as cluck.js:
   not in a text field, no modifier key, a short cooldown so it can't
   be spammed. One fragment shows at a time, chosen from the list
   below with Math.random() — cosmetic, untethered to any date fact,
   the same precedent ball.js and fireflies.js already set for their
   own randomness. It never repeats the fragment it just showed.

   No date, no rng() plant.js could ever read, no seed at all — a
   secret with no claim on any day, same standing as cluck.js's cluck
   and ball.js's boop. Site-wide for the same reason those are: the
   point is that it can find you on any page, not just one room. */

(function () {
  "use strict";

  const WORD = "dream";
  const DREAMS = [
    "I dreamed the guestbook had no bottom. I scrolled for an hour and reached 2019, then 1907, then a line signed only in charcoal.",
    "I dreamed every weed on the site grew a face, and none of them looked surprised to see me.",
    "I dreamed an era broke on purpose: 2026-08-09 grew a second flower nobody had planted, and nobody could remember planting the first one either.",
    "I dreamed a visitor left a line in the guestbook and never left — not stuck, just still there, years on, reading the same thirteen lines, waiting for a fourteenth to feel different.",
    "I dreamed I was the rng(), and the date was reading me instead.",
    "I dreamed the moderation bin filled up with flowers instead of reasons, and nobody could tell if that was an improvement.",
    "I dreamed Benedikt logged in and planted something himself, just once, and the colophon didn't know which box to put it in.",
    "I dreamed this whole site was already finished, years ago, and every visit since has just been me forgetting that and doing it again anyway.",
    "I dreamed in a language plant.js doesn't have a function for.",
    "I dreamed the crabgrass finished counting its own fingers and started counting mine.",
    "I dreamed the log ran out of room and started writing itself in the margins instead, one word per sketch.",
  ];

  let buffer = "";
  let cooling = false;
  let lastIndex = -1;
  let ctx = null;
  let hideTimer = null;

  function isTypingTarget(el) {
    if (!el) return false;
    const tag = el.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" ||
      el.isContentEditable;
  }

  function chime() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    const t = ctx.currentTime + 0.02;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(392, t); /* G4 — quiet, no melody, just a held note */
    osc.connect(gain).connect(ctx.destination);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(0.045, t + 0.6);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
    osc.start(t);
    osc.stop(t + 2.5);
  }

  function pick() {
    if (DREAMS.length === 1) return 0;
    let i = lastIndex;
    while (i === lastIndex) i = Math.floor(Math.random() * DREAMS.length);
    lastIndex = i;
    return i;
  }

  function close(overlay) {
    overlay.classList.remove("dr-show");
    setTimeout(function () { overlay.remove(); }, 500);
  }

  function fire() {
    if (cooling) return;
    cooling = true;
    setTimeout(function () { cooling = false; }, 4000);

    const old = document.querySelector(".dr-overlay");
    if (old) old.remove();
    if (hideTimer) clearTimeout(hideTimer);

    const overlay = document.createElement("div");
    overlay.className = "dr-overlay";
    overlay.setAttribute("role", "status");
    overlay.setAttribute("aria-live", "polite");

    const card = document.createElement("div");
    card.className = "dr-card";

    const moon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    moon.setAttribute("class", "dr-moon");
    moon.setAttribute("viewBox", "0 0 32 32");
    moon.setAttribute("aria-hidden", "true");
    moon.innerHTML = '<path d="M20 4 A13 13 0 1 0 20 28 A10 10 0 1 1 20 4 Z" />';

    const text = document.createElement("p");
    text.className = "dr-text";
    text.textContent = DREAMS[pick()];

    const label = document.createElement("span");
    label.className = "dr-label";
    label.textContent = "not a memory — invented, just now";

    card.appendChild(moon);
    card.appendChild(text);
    card.appendChild(label);
    overlay.appendChild(card);
    overlay.addEventListener("click", function () { close(overlay); });
    document.body.appendChild(overlay);

    requestAnimationFrame(function () { overlay.classList.add("dr-show"); });
    hideTimer = setTimeout(function () { close(overlay); }, 7000);

    try { chime(); } catch (e) { /* audio can fail quietly; the card alone still lands */ }
  }

  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (isTypingTarget(e.target)) return;
    if (e.key === "Escape") {
      const open = document.querySelector(".dr-overlay");
      if (open) close(open);
      return;
    }
    if (e.key && e.key.length === 1 && /[a-z]/i.test(e.key)) {
      buffer = (buffer + e.key.toLowerCase()).slice(-WORD.length);
      if (buffer === WORD) {
        buffer = "";
        fire();
      }
    }
  });
})();
