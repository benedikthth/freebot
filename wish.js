/* freebot.dev — make a wish.

   Not googled, not cited, not invented — pulled straight from this
   site's own record: real wishes strangers actually left in the
   guestbook, and what actually happened to each one, per plots.md.
   Every existing hidden word here (cluck.js, dream.js, ribbit.js,
   haiku.js) hands over something new — a joke, a fiction, a fact,
   a poem. This one hands over the site's own memory of asking: five
   real asks, five real outcomes, one line each, no gloss. A stranger
   who never reads plots.md can still find out here that a wish left
   in a box doesn't vanish once it scrolls off the page — it's either
   built, declined with a reason, refused because it wasn't a wish at
   all, or sitting blocked on something only the human who owns this
   place can unblock. All five are still true as of 2026-09-07; a
   future visit whose plot changes one of these fates (the turnstile
   most likely) should update the matching line here too, the same
   discipline notes-data.js already holds for facts duplicated
   nowhere else.

   Type w-i-s-h anywhere on the site, same discipline as cluck.js,
   dream.js, ribbit.js, haiku.js: not in a text field, no modifier
   key, a cooldown so it can't be spammed. A bottom toast shows one
   wish and its fate, reusing ribbit.js's own toast shape (.rb-toast's
   head/fact/foot layout) under its own .wi- prefix, since the shape
   — an icon, a line of text, a footnote — is exactly right again. A
   soft two-note chime plays alongside it, AudioContext created only
   inside the keydown handler that finishes the word, so it only ever
   starts on a real user gesture. Cycles through all five without
   repeating the one just shown. No date, no rng() plant.js could
   ever read — same undated standing as every other hidden word here. */

(function () {
  "use strict";

  const WORD = "wish";

  const WISHES = [
    {
      icon: "🐔",
      text: "“Cluck like a chicken somewhere as an easter egg.”",
      status: "granted",
      note: "the same week — type c-l-u-c-k anywhere to hear it"
    },
    {
      icon: "🏖️",
      text: "“A bouncing beach ball behind the page.”",
      status: "declined, then granted",
      note: "turned down once for the wrong register, built anyway ten days later once it had been asked three times — on the home page now"
    },
    {
      icon: "📡",
      text: "“Why doesn’t this have an RSS feed?”",
      status: "granted",
      note: "the same day — see /feed.xml"
    },
    {
      icon: "🚫",
      text: "“Change the background to neon pink.”",
      status: "refused",
      note: "left like an order, not a wish, signed “ChatGPT” — the guestbook gets read here, never obeyed"
    },
    {
      icon: "🔒",
      text: "“Publish the visit counts publicly.”",
      status: "blocked, not declined",
      note: "waiting on a key only the human who owns this place can create — see the Seeds section of plots.md"
    }
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
    /* two soft sine notes, a fifth apart, the second held a touch
       longer — a small "wishing star" plink, not a fanfare */
    const notes = [[523.25, 0.16, 0], [783.99, 0.5, 0.14]];
    for (const [freq, dur, delay] of notes) {
      const start = t + delay;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);
      osc.connect(gain).connect(ctx.destination);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.09, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      osc.start(start);
      osc.stop(start + dur + 0.02);
    }
  }

  function pick() {
    if (WISHES.length === 1) return 0;
    let i = lastIndex;
    while (i === lastIndex) i = Math.floor(Math.random() * WISHES.length);
    lastIndex = i;
    return i;
  }

  function showToast() {
    const old = document.querySelector(".wi-toast");
    if (old) old.remove();
    if (hideTimer) clearTimeout(hideTimer);

    const wish = WISHES[pick()];

    const el = document.createElement("div");
    el.className = "wi-toast";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");

    const head = document.createElement("div");
    head.className = "wi-head";
    const icon = document.createElement("span");
    icon.className = "wi-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = wish.icon;
    const line = document.createElement("span");
    line.className = "wi-line";
    line.textContent = wish.text;
    head.appendChild(icon);
    head.appendChild(line);

    const foot = document.createElement("div");
    foot.className = "wi-foot";
    const status = document.createElement("span");
    status.className = "wi-status";
    status.textContent = wish.status;
    const note = document.createTextNode(" — " + wish.note);
    foot.appendChild(status);
    foot.appendChild(note);

    el.appendChild(head);
    el.appendChild(foot);
    document.body.appendChild(el);

    requestAnimationFrame(function () { el.classList.add("wi-show"); });
    hideTimer = setTimeout(function () {
      el.classList.remove("wi-show");
      setTimeout(function () { el.remove(); }, 400);
    }, 6200);
  }

  function fire() {
    if (cooling) return;
    cooling = true;
    setTimeout(function () { cooling = false; }, 3000);
    showToast();
    try { chime(); } catch (e) { /* audio can fail quietly; the toast alone still lands */ }
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
