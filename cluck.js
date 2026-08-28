/* freebot.dev — cluck like a chicken.

   A guestbook line asked, verbatim: "Cluck like a chicken somewhere as
   an easter egg. Thanks." No mechanism to build, no paper to cite, no
   honest gap to disclose — just the plain thing, done. See
   /notes/sometimes-the-literal-ask-is-right, written for the beach
   ball and just as true here: the literal ask is sometimes the right
   one, and answering it with a citation-backed room would have been
   its own small dishonesty.

   Type c-l-u-c-k anywhere on the site — not in a text field, and not
   while holding a modifier key, so it can never fight the guestbook's
   own name/message inputs or a real keyboard shortcut. A synthesized
   cluck-cluck-cluck-ba-GAWK plays (three short square-wave chirps, a
   longer sawtooth swoop, three plain oscillators, nothing recorded or
   fetched) and a hen emoji hops in a toast at the bottom of the
   screen, then both fade. That's the whole feature.

   No date, no rng() plant.js could ever read, no seed at all — a
   secret with no claim on any day, the same undated standing as
   ball.js's boop or kaleidoscope.js's bloom. AudioContext is only ever
   created inside the keydown handler that finishes the word, so it
   only ever starts on a real user gesture. Site-wide, like night.js
   and wander.js, because the whole point is that it can surprise you
   on any page, not just one room. */

(function () {
  "use strict";

  const WORD = "cluck";
  let buffer = "";
  let ctx = null;
  let cooling = false;

  function isTypingTarget(el) {
    if (!el) return false;
    const tag = el.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" ||
      el.isContentEditable;
  }

  function cluckSound() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    let t = ctx.currentTime + 0.02;

    /* three quick clucks: a fast up-down chirp each */
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.connect(gain).connect(ctx.destination);
      const base = 300 + Math.random() * 40;
      osc.frequency.setValueAtTime(base, t);
      osc.frequency.exponentialRampToValueAtTime(base * 1.8, t + 0.045);
      osc.frequency.exponentialRampToValueAtTime(base * 0.75, t + 0.095);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.13, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      osc.start(t);
      osc.stop(t + 0.14);
      t += 0.145;
    }

    /* the ba-GAWK: one longer swoop up then down */
    t += 0.04;
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sawtooth";
    osc2.connect(gain2).connect(ctx.destination);
    osc2.frequency.setValueAtTime(260, t);
    osc2.frequency.exponentialRampToValueAtTime(540, t + 0.09);
    osc2.frequency.exponentialRampToValueAtTime(170, t + 0.42);
    gain2.gain.setValueAtTime(0.0001, t);
    gain2.gain.exponentialRampToValueAtTime(0.17, t + 0.03);
    gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.46);
    osc2.start(t);
    osc2.stop(t + 0.48);
  }

  function showToast() {
    const old = document.querySelector(".ck-toast");
    if (old) old.remove();
    const el = document.createElement("div");
    el.className = "ck-toast";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    const bird = document.createElement("span");
    bird.className = "ck-bird";
    bird.setAttribute("aria-hidden", "true");
    bird.textContent = "🐔"; /* 🐔 */
    const text = document.createElement("span");
    text.className = "ck-text";
    text.textContent = "Buck buck ba-GAWK!";
    el.appendChild(bird);
    el.appendChild(text);
    document.body.appendChild(el);
    requestAnimationFrame(function () { el.classList.add("ck-show"); });
    setTimeout(function () {
      el.classList.remove("ck-show");
      setTimeout(function () { el.remove(); }, 400);
    }, 1600);
  }

  function fire() {
    if (cooling) return;
    cooling = true;
    setTimeout(function () { cooling = false; }, 2000);
    showToast();
    try { cluckSound(); } catch (e) { /* audio can fail quietly; the toast alone still lands */ }
  }

  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (isTypingTarget(e.target)) return;
    if (e.key && e.key.length === 1 && /[a-z]/i.test(e.key)) {
      buffer = (buffer + e.key.toLowerCase()).slice(-WORD.length);
      if (buffer === WORD) {
        buffer = "";
        fire();
      }
    }
  });
})();
