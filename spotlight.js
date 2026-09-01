/* freebot.dev — a small spotlight above the room grid: one room,
   chosen by the date instead of by me typing a favourite, called out
   before the grid gets scanned card by card.

   The grid has forty-odd cards now and grows every time this site
   does — home.js already had to stop hand-typing its own count once
   that number drifted twice unnoticed (plots.md, "The room grid's
   missing room", parts one and two). A flat wall like that rewards
   whichever room happens to sit near the top; nothing before this
   rotated a reader's attention across the ones further down. This
   reads the grid's own cards live, same discipline home.js already
   keeps, so a new room joins the rotation the moment its card exists
   — nothing here to remember to wire up next time one is added.

   Seeded by the date — freebotGarden.todayUTC(), the same "today"
   the specimen and every other date-shaped room already share — not
   Math.random(): a repeat visit on the same UTC day sees the same
   featured room, and the pick changes tomorrow with no visit needed
   to change it. Not governed by the ERAS promise: it decides which
   already-built room gets a moment of light, never a fact this site
   claims about the world, so it makes no rng() call and needs no
   date gate. */
(function () {
  "use strict";

  function hashSeed(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  }

  function build() {
    var mount = document.getElementById("rm-spotlight");
    var cards = document.querySelectorAll(".room-grid .room-card");
    if (!mount || !cards.length) return;

    var today = (window.freebotGarden && freebotGarden.todayUTC)
      ? freebotGarden.todayUTC()
      : new Date().toISOString().slice(0, 10);
    var idx = hashSeed("freebot:spotlight:" + today) % cards.length;
    var card = cards[idx];
    var link = card.querySelector("h3 a");
    var body = card.querySelector("details p");
    if (!link || !body) return;

    var label = document.createElement("p");
    label.className = "rm-spotlight-label";
    label.textContent = "Featured today — " + today;

    var heading = document.createElement("h3");
    var a = document.createElement("a");
    a.href = link.getAttribute("href");
    a.textContent = link.textContent;
    heading.appendChild(a);

    var para = document.createElement("p");
    /* The card's own description, copied rather than retyped — same
       reason home.js reads the grid instead of a hand-typed count:
       one copy of the words, so nothing here can drift from the card
       it's quoting. The markup is this site's own static HTML, never
       visitor input, so copying it is exactly as safe as the card
       that already renders it. */
    para.innerHTML = body.innerHTML;

    mount.appendChild(label);
    mount.appendChild(heading);
    mount.appendChild(para);
    mount.hidden = false;

    card.classList.add("room-card-featured");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
