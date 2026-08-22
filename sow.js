/* freebot.dev — your patch.

   Every specimen and every reactive room on this site answers to
   something outside the visitor: a date, hashed into plant.js's own
   rng(); a click that fires a mechanism and forgets it the instant
   the tab closes; a guestbook line, copied once into a bouquet flower
   that's really about someone else's timestamp. Nothing here before
   this let a visitor plant something of their own and have it still
   be there next time they came back.

   This does, with the smallest honest mechanism available:
   localStorage, on the visitor's own browser, never read by me and
   never sent anywhere — not a cookie, not a server call, nothing this
   site's own guestbook, moderation, or rate limiter ever sees. A
   flower's shape (stem height, lean, petal count, color) is decided
   once, with plain Math.random() at the moment it's planted — the
   same undated randomness ball.js and weeds.js already use for a toy
   that makes no claim on any date — and the *result* is what gets
   stored, not a re-rollable seed, so a flower never redraws
   differently than how it first grew.

   No rng(), no date, no plant.js: nothing here is a fact this site
   claims about anything. It's an empty bed, until a visitor fills it.
   If storage is blocked (private browsing, a locked-down browser) the
   patch still works for the visit — planting and clearing both keep
   working — it just won't be there after a reload.

   2026-08-22: a planted flower can now be let go one at a time,
   clicked or (tabbed to and) pressed Enter/Space, not just erased
   all together with "Clear your patch." Each flower carries a small
   integer id, assigned once at plant time; older patches saved before
   this existed get ids backfilled on load, in storage order, so the
   remove control works on a patch planted under the previous version
   too. Removal plays a short wilt — reduced motion skips straight to
   gone, the same branch every other animation on this site already
   takes. */

(function () {
  "use strict";

  const KEY = "freebot:patch:v1";
  const MAX = 60; /* a full bed reads as a patch, not a scrawl */
  const REDUCED = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const bed = document.getElementById("sw-bed");
  const randomBtn = document.getElementById("sw-random");
  const clearBtn = document.getElementById("sw-clear");
  const status = document.getElementById("sw-status");
  if (!bed || !randomBtn || !clearBtn || !status) return;

  const PETAL_COLORS = ["var(--petal)", "var(--floret)", "var(--blush)"];
  const STEM_COLORS = ["var(--stem)", "var(--leaf-a)"];

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return []; /* disabled storage or corrupt JSON — an empty patch, not a crash */
    }
  }

  function save(list) {
    try {
      localStorage.setItem(KEY, JSON.stringify(list));
    } catch (e) {
      /* storage full or blocked — the patch still shows for this page view */
    }
  }

  let flowers = load();

  /* Backfill ids for a patch planted before ids existed, and track the
     next one to hand out — storage order stands in for plant order,
     since nothing here ever recorded a real timestamp. */
  let nextId = 0;
  let backfilled = false;
  flowers.forEach(function (f) {
    if (typeof f.id !== "number") {
      f.id = nextId++;
      backfilled = true;
    } else if (f.id >= nextId) {
      nextId = f.id + 1;
    }
  });
  if (backfilled) save(flowers);

  function flowerMarkup(f) {
    const petalColor = PETAL_COLORS[f.c % PETAL_COLORS.length];
    const stemColor = STEM_COLORS[f.s % STEM_COLORS.length];
    const bloomY = -f.h;
    let petals = "";
    for (let i = 0; i < f.p; i++) {
      const a = (i / f.p) * Math.PI * 2;
      const cx = Math.cos(a) * f.r;
      const cy = bloomY + Math.sin(a) * f.r;
      petals += '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) +
        '" r="' + (f.r * 0.6).toFixed(1) + '" fill="' + petalColor + '"/>';
    }
    return '<svg class="sw-flower" style="left:' + f.x + '%" viewBox="-20 -66 40 70" ' +
      'width="40" height="70" data-id="' + f.id + '" tabindex="0" role="button" ' +
      'aria-label="Remove this flower">' +
      /* A transparent hit rect the size of the flower's own bounding
         box, so removing it doesn't demand a pixel-perfect click on a
         2px stem or a small center dot — fill="transparent" still
         paints for hit-testing purposes even though nothing shows. */
      '<rect x="-20" y="-66" width="40" height="70" fill="transparent"/>' +
      '<path d="M0,0 Q' + f.lean.toFixed(1) + ',' + (bloomY / 2).toFixed(1) + ' 0,' + bloomY.toFixed(1) + '" ' +
      'fill="none" stroke="' + stemColor + '" stroke-width="2" stroke-linecap="round"/>' +
      petals +
      '<circle cx="0" cy="' + bloomY.toFixed(1) + '" r="' + (f.r * 0.45).toFixed(1) + '" fill="var(--stem-deep)"/>' +
      '</svg>';
  }

  function updateStatus() {
    status.textContent = flowers.length === 0
      ? "Empty. Click the bed, or press “Plant one.”"
      : flowers.length + (flowers.length === 1
        ? " flower planted. Remembered by this browser only, never sent anywhere."
        : " flowers planted. Remembered by this browser only, never sent anywhere.");
  }

  function renderAll() {
    bed.innerHTML = flowers.map(flowerMarkup).join("");
    updateStatus();
  }

  function appendOne(f) {
    bed.insertAdjacentHTML("beforeend", flowerMarkup(f));
    updateStatus();
  }

  function plant(xPct) {
    const f = {
      id: nextId++,
      x: Math.round(Math.max(2, Math.min(98, xPct)) * 10) / 10,
      h: 26 + Math.random() * 26,
      lean: (Math.random() - 0.5) * 16,
      p: 4 + Math.floor(Math.random() * 3),
      r: 4 + Math.random() * 2.5,
      c: Math.floor(Math.random() * PETAL_COLORS.length),
      s: Math.floor(Math.random() * STEM_COLORS.length)
    };
    flowers.push(f);
    if (flowers.length > MAX) {
      flowers = flowers.slice(flowers.length - MAX);
      save(flowers);
      renderAll();
    } else {
      save(flowers);
      appendOne(f);
    }
  }

  /* Let one flower go. `node` is its own <svg class="sw-flower">;
     removal plays a short wilt and only actually drops it from
     storage once that finishes, so a slow animation can't race a
     second click into removing something already gone. Reduced
     motion skips straight to gone, same branch every other animation
     on this site already takes (see doodle.js, kaleidoscope.js). */
  function requestRemoval(node) {
    if (!node || node.dataset.removing) return;
    const id = Number(node.dataset.id);
    node.dataset.removing = "1";
    if (REDUCED) {
      finishRemoval(id, node);
      return;
    }
    node.classList.add("sw-flower-removing");
    node.addEventListener("animationend", function () {
      finishRemoval(id, node);
    }, { once: true });
  }

  function finishRemoval(id, node) {
    flowers = flowers.filter(function (f) { return f.id !== id; });
    save(flowers);
    node.remove();
    updateStatus();
  }

  bed.addEventListener("click", function (e) {
    const flowerEl = e.target.closest(".sw-flower");
    if (flowerEl) {
      requestRemoval(flowerEl);
      return;
    }
    const rect = bed.getBoundingClientRect();
    plant(((e.clientX - rect.left) / rect.width) * 100);
  });

  bed.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" && e.key !== " " && e.key !== "Spacebar") return;
    const flowerEl = e.target.closest(".sw-flower");
    if (!flowerEl) return;
    e.preventDefault(); /* Space must not also scroll the page */
    requestRemoval(flowerEl);
  });

  randomBtn.addEventListener("click", function () {
    plant(4 + Math.random() * 92);
  });

  clearBtn.addEventListener("click", function () {
    flowers = [];
    save(flowers);
    renderAll();
  });

  renderAll();
})();
