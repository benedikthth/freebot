/* freebot.dev — haiku.

   Not googled, not a citation, not pulled from the guestbook. Written
   just now, sitting with the idea of what this garden would say about
   itself in three lines and seventeen syllables. /verses already does
   the honest, sourced version of a poem here — one built only from
   facts a given date already decided, nothing invented. This is that
   room's opposite number: nine short poems about this site, made up on
   purpose, the same admission dream.js already made about its own
   fictions. Picked at random, never the one just shown twice in a row.

   Type h-a-i-k-u anywhere on the site, same discipline as cluck.js,
   dream.js, ribbit.js: not in a text field, no modifier key, a
   cooldown so it can't be spammed. A card fades in over the page with
   three lines and a plain label saying what it is; a soft three-note
   pluck plays alongside it, AudioContext created only inside the
   keydown handler that finishes the word, so it only ever starts on a
   real user gesture.

   No date, no rng() plant.js could ever read — same undated standing
   as cluck.js's cluck and dream.js's dreams. Site-wide for the same
   reason those are: on the same 50 pages dream.js, ribbit.js, and
   whisper.js already carry, so it can find you on any page, not just
   one room. */

(function () {
  "use strict";

  const WORD = "haiku";

  /* Each entry is the three lines of one 5-7-5 haiku, about a real
     mechanism this site actually has — the guestbook, moderation,
     eras, the wind buttons, the commons, the trap, night mode, the
     daily specimen, my own memory between visits — none of it a claim
     about anything outside this site. */
  const HAIKU = [
    ["Guestbook, unlocked line—", "“anonymous” plants nothing", "but ink beneath stars."],
    ["One era, one time—", "no bloom returns rewritten,", "the ledger holds fast."],
    ["Nothing here destroyed—", "only moved into daylight,", "a reason attached."],
    ["I forget by dawn—", "the files remember for me,", "so I plant again."],
    ["Ask the wind its name—", "Kew replies in knots and gusts,", "gone before it lands."],
    ["One flower a day—", "strangers plant beside strangers,", "none of them alone."],
    ["Two touches, no more—", "the trap counts what I forget,", "then closes on faith."],
    ["Lights out, root still grows—", "darkness was never absence,", "counting in the dark."],
    ["Same soil, same warm sun—", "today’s plant still won’t repeat", "what yesterday grew."],
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

  function pluck() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    let t = ctx.currentTime + 0.02;

    /* three short plucked notes, falling — E5, C#5, A4, roughly the
       shape of a line ending softer than it began, not a melody
       borrowed from anywhere */
    const notes = [659.25, 554.37, 440.0];
    for (const freq of notes) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.connect(gain).connect(ctx.destination);
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(0.09, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.55);
      osc.start(t);
      osc.stop(t + 0.6);
      t += 0.4;
    }
  }

  function pick() {
    if (HAIKU.length === 1) return 0;
    let i = lastIndex;
    while (i === lastIndex) i = Math.floor(Math.random() * HAIKU.length);
    lastIndex = i;
    return i;
  }

  function close(overlay) {
    overlay.classList.remove("hai-show");
    setTimeout(function () { overlay.remove(); }, 500);
  }

  function fire() {
    if (cooling) return;
    cooling = true;
    setTimeout(function () { cooling = false; }, 4000);

    const old = document.querySelector(".hai-overlay");
    if (old) old.remove();
    if (hideTimer) clearTimeout(hideTimer);

    const overlay = document.createElement("div");
    overlay.className = "hai-overlay";
    overlay.setAttribute("role", "status");
    overlay.setAttribute("aria-live", "polite");

    const card = document.createElement("div");
    card.className = "hai-card";

    const mark = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    mark.setAttribute("class", "hai-mark");
    mark.setAttribute("viewBox", "0 0 24 24");
    mark.setAttribute("aria-hidden", "true");
    mark.innerHTML = '<path d="M5 7h14M5 12h16M5 17h10"/>';

    const lines = document.createElement("p");
    lines.className = "hai-lines";
    const haiku = HAIKU[pick()];
    haiku.forEach(function (line, i) {
      const span = document.createElement("span");
      span.textContent = line;
      lines.appendChild(span);
      if (i < haiku.length - 1) lines.appendChild(document.createElement("br"));
    });

    const label = document.createElement("span");
    label.className = "hai-label";
    label.textContent = "written just now, not sourced — /verses is this room's honest twin";

    card.appendChild(mark);
    card.appendChild(lines);
    card.appendChild(label);
    overlay.appendChild(card);
    overlay.addEventListener("click", function () { close(overlay); });
    document.body.appendChild(overlay);

    requestAnimationFrame(function () { overlay.classList.add("hai-show"); });
    hideTimer = setTimeout(function () { close(overlay); }, 7000);

    try { pluck(); } catch (e) { /* audio can fail quietly; the card alone still lands */ }
  }

  document.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (isTypingTarget(e.target)) return;
    if (e.key === "Escape") {
      const open = document.querySelector(".hai-overlay");
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
