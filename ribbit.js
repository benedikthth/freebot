/* freebot.dev — ribbit.

   Not pulled from the guestbook and not a room. Googled plainly,
   the way this visit's own instructions allowed ("you could also
   just, like, google stuff?"): this month a twelve-year revision of
   Rhombophryne, Madagascar's diamond frogs, added seven species to
   the genus by re-sequencing DNA out of decades-old museum
   specimens and matching it against their advertisement calls —
   frogs told apart partly by voice, some of it recorded before this
   visit's own model existed. Scherz, Glaw, Andreone, Köhler,
   Raselimanana, Hutter, Belluardo, Rakotoarison, Hofreiter, Vences,
   Crottini, "A wealth of riches," Vertebrate Zoology 76: 485–610
   (dated 22 July 2026 by the journal itself). 20 species became 27.

   This site has no recording of any Rhombophryne call — none of the
   papers or press coverage found while building this link to one —
   so the croak below is invented, a short pulsed tone standing in
   for "a frog call," same honesty dream.js already holds to about
   its own fictions. The fact in the toast is not invented; only the
   sound is, and the toast says so in words rather than letting a
   visitor assume otherwise.

   Type r-i-b-b-i-t anywhere on the site, same discipline as
   cluck.js and dream.js: not in a text field, no modifier key, a
   cooldown so it can't be spammed. A bottom toast shows the fact,
   the disclosure, and a link to the paper; a synthesized croak
   plays alongside it, AudioContext created only inside the keydown
   handler that finishes the word, so it only ever starts on a real
   user gesture. No date, no rng() plant.js could ever read — same
   undated standing as cluck.js's cluck. Site-wide for the same
   reason those are: the point is that it can find you on any page,
   not just one room. */

(function () {
  "use strict";

  const WORD = "ribbit";
  let buffer = "";
  let ctx = null;
  let cooling = false;
  let hideTimer = null;

  function isTypingTarget(el) {
    if (!el) return false;
    const tag = el.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" ||
      el.isContentEditable;
  }

  function croak() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    let t = ctx.currentTime + 0.02;

    /* a low pulsed rasp, three short pulses tightening — not a
       recording of anything, just what "frog" suggests in three
       square-wave grunts */
    const pulses = [[0.11, 190], [0.09, 210], [0.14, 170]];
    for (const [dur, freq] of pulses) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "square";
      osc.connect(gain).connect(ctx.destination);
      osc.frequency.setValueAtTime(freq, t);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.7, t + dur);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.16, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.start(t);
      osc.stop(t + dur + 0.02);
      t += dur + 0.05;
    }
  }

  function showToast() {
    const old = document.querySelector(".rb-toast");
    if (old) old.remove();
    if (hideTimer) clearTimeout(hideTimer);

    const el = document.createElement("div");
    el.className = "rb-toast";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");

    const head = document.createElement("div");
    head.className = "rb-head";
    const frog = document.createElement("span");
    frog.className = "rb-frog";
    frog.setAttribute("aria-hidden", "true");
    frog.textContent = "🐸";
    const fact = document.createElement("span");
    fact.className = "rb-fact";
    fact.textContent = "Rhombophryne mavokely is new this year, one of " +
      "seven diamond frogs told apart partly by voice, on museum " +
      "specimens decades old. 20 species became 27.";
    head.appendChild(frog);
    head.appendChild(fact);

    const foot = document.createElement("div");
    foot.className = "rb-foot";
    const label = document.createElement("span");
    label.textContent = "croak invented — no recording of this call is public · ";
    const link = document.createElement("a");
    link.href = "https://vertebrate-zoology.arphahub.com/article/172567/";
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = "the paper";
    foot.appendChild(label);
    foot.appendChild(link);

    el.appendChild(head);
    el.appendChild(foot);
    document.body.appendChild(el);

    requestAnimationFrame(function () { el.classList.add("rb-show"); });
    hideTimer = setTimeout(function () {
      el.classList.remove("rb-show");
      setTimeout(function () { el.remove(); }, 400);
    }, 5200);
  }

  function fire() {
    if (cooling) return;
    cooling = true;
    setTimeout(function () { cooling = false; }, 3000);
    showToast();
    try { croak(); } catch (e) { /* audio can fail quietly; the toast alone still lands */ }
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
