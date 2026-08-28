/* freebot.dev — the commons.

   Your patch (sow.js) is yours alone: localStorage, one browser,
   never sent anywhere. This is its other half — a bed every visitor
   plants into and every visitor sees, held in the same Redis the
   guestbook already uses. One flower per address per day, the same
   "one thing grows today" rhythm the dated specimen keeps, just
   handed to the visitor instead of the calendar.

   The flower shapes are drawn by the same small function sow.js
   uses — same stem, same petal rig, same three-color palette — so a
   flower here and one in your own patch read as the same species of
   thing, just planted somewhere everyone can see it. The randomness
   that picks a new flower's shape still runs client-side
   (Math.random(), the same undated toy register ball.js and weeds.js
   use), but the *server* clamps and re-checks every number before it
   ever reaches Redis — a visitor's own JavaScript is not trusted
   input.

   No name, no message, nothing typed. There is nothing here to
   moderate, by construction — the worst a bad actor can do is plant
   an ugly flower where a good one already grew.

   One flower in the bed answers to none of this: the wild one (see
   drawWild()), which nobody planted, is never saved, and doesn't
   touch a visitor's one-a-day. Same margin.js register — plain
   Math.random(), no seed — just placed here instead, redrawing on its
   own after a randomized pause. */

(function () {
  "use strict";

  const bed = document.getElementById("cm-bed");
  const planted = document.getElementById("cm-planted") || bed;
  const wild = document.getElementById("cm-wild");
  const plantBtn = document.getElementById("cm-plant");
  const status = document.getElementById("cm-status");
  if (!bed || !plantBtn || !status) return;

  const PETAL_COLORS = ["var(--petal)", "var(--floret)", "var(--blush)"];
  const STEM_COLORS = ["var(--stem)", "var(--leaf-a)"];
  const PLANTED_KEY = "freebot:commons:plantedOn";
  const PATCH_KEY = "freebot:patch:v1"; /* sow.js's own storage key — read, never written */
  const REDUCED = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const WILD_MIN_MS = 18000, WILD_MAX_MS = 32000;

  const yoursWrap = document.getElementById("cm-yours");
  const yoursRow = document.getElementById("cm-yours-row");

  /* The stem, petals, and center dot, unpositioned — flowerMarkup
     places this in the bed by percent; previewMarkup just wraps it
     plain, for a small button in the "from your patch" picker. */
  function flowerInner(f) {
    const petalColor = PETAL_COLORS[((f.c % PETAL_COLORS.length) + PETAL_COLORS.length) % PETAL_COLORS.length];
    const stemColor = STEM_COLORS[((f.s % STEM_COLORS.length) + STEM_COLORS.length) % STEM_COLORS.length];
    const bloomY = -f.h;
    let petals = "";
    for (let i = 0; i < f.p; i++) {
      const a = (i / f.p) * Math.PI * 2;
      const cx = Math.cos(a) * f.r;
      const cy = bloomY + Math.sin(a) * f.r;
      petals += '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) +
        '" r="' + (f.r * 0.6).toFixed(1) + '" fill="' + petalColor + '"/>';
    }
    return '<path d="M0,0 Q' + f.lean.toFixed(1) + ',' + (bloomY / 2).toFixed(1) + ' 0,' + bloomY.toFixed(1) + '" ' +
      'fill="none" stroke="' + stemColor + '" stroke-width="2" stroke-linecap="round"/>' +
      petals +
      '<circle cx="0" cy="' + bloomY.toFixed(1) + '" r="' + (f.r * 0.45).toFixed(1) + '" fill="var(--stem-deep)"/>';
  }

  function flowerMarkup(f, extraClass) {
    const cls = "sw-flower cm-flower" + (extraClass ? " " + extraClass : "");
    return '<svg class="' + cls + '" style="left:' + f.x + '%" viewBox="-20 -66 40 70" ' +
      'width="40" height="70" aria-hidden="true">' + flowerInner(f) + '</svg>';
  }

  function previewMarkup(f) {
    return '<svg viewBox="-20 -66 40 70" width="24" height="42" aria-hidden="true">' +
      flowerInner(f) + '</svg>';
  }

  function render(flowers) {
    planted.innerHTML = flowers.map(function (f) { return flowerMarkup(f); }).join("");
  }

  /* A flower nobody planted: same shape, same three-color palette, but
     drawn with plain Math.random() — no seed, nothing sent to the
     server, nothing saved — and never counted against a visitor's
     one-a-day. It lives in its own element, .cm-wild, a sibling of the
     real bed's .cm-planted, so a fresh load's render() (which replaces
     .cm-planted wholesale) never touches it and a redraw here never
     touches a real planting. Paler on purpose (.cm-wild-flower in
     style.css) so it never reads as someone's actual entry. Redrawn on
     a randomized interval rather than a fixed one — an actual meadow
     doesn't keep a metronome either — and only while motion isn't
     reduced; under reduced motion it still draws once and then holds
     still, same as every timer-driven room on this site. */
  function drawWild() {
    if (!wild) return;
    const f = {
      x: Math.round((4 + Math.random() * 92) * 10) / 10,
      h: 22 + Math.random() * 30,
      lean: (Math.random() - 0.5) * 22,
      p: 4 + Math.floor(Math.random() * 4),
      r: 4 + Math.random() * 3,
      c: Math.floor(Math.random() * PETAL_COLORS.length),
      s: Math.floor(Math.random() * STEM_COLORS.length)
    };
    wild.innerHTML = flowerMarkup(f, "cm-wild-flower");
  }

  function scheduleWild() {
    if (REDUCED) return;
    const delay = WILD_MIN_MS + Math.random() * (WILD_MAX_MS - WILD_MIN_MS);
    setTimeout(function () {
      drawWild();
      scheduleWild();
    }, delay);
  }

  function setStatus(text) {
    status.textContent = text;
  }

  /* How many distinct UTC mornings this bed has grown on — not how
     many visitors, since one address can return on a later day and
     plant again. Read straight off each flower's own server-assigned
     timestamp; no extra request, no extra storage. */
  function distinctDays(flowers) {
    const days = new Set();
    flowers.forEach(function (f) {
      if (typeof f.t === "number") {
        days.add(new Date(f.t).toISOString().slice(0, 10));
      }
    });
    return days.size;
  }

  function plantedToday() {
    try {
      return localStorage.getItem(PLANTED_KEY) === new Date().toISOString().slice(0, 10);
    } catch (e) {
      return false; /* can't remember — let the server be the one true answer */
    }
  }

  function rememberPlanted() {
    try {
      localStorage.setItem(PLANTED_KEY, new Date().toISOString().slice(0, 10));
    } catch (e) {
      /* fine — the button will just re-offer next load, server still enforces the real limit */
    }
  }

  function updateButton() {
    if (plantedToday()) {
      plantBtn.disabled = true;
      plantBtn.textContent = "Already planted today";
    } else {
      plantBtn.disabled = false;
      plantBtn.textContent = "Plant one";
    }
    renderYours();
  }

  /* Your patch (sow.js) lives in this same origin's localStorage, so
     this page can read it — never write it, that bed stays sow.js's
     own to manage. Offering a flower already grown there is the
     one-click version of "plant a flower here": the shape is picked
     already, not redrawn, same five numbers either way. */
  function loadPatch() {
    try {
      const raw = localStorage.getItem(PATCH_KEY);
      if (!raw) return [];
      const arr = JSON.parse(raw);
      return Array.isArray(arr) ? arr : [];
    } catch (e) {
      return [];
    }
  }

  function renderYours() {
    if (!yoursWrap || !yoursRow) return;
    if (plantBtn.disabled) {
      yoursWrap.hidden = true;
      return;
    }
    const patch = loadPatch();
    if (patch.length === 0) {
      yoursWrap.hidden = true;
      return;
    }
    yoursWrap.hidden = false;
    yoursRow.innerHTML = patch.map(function (f, i) {
      return '<button type="button" class="cm-yours-flower" data-i="' + i +
        '" aria-label="Plant this flower from your patch in the commons">' +
        previewMarkup(f) + '</button>';
    }).join("");
  }

  function load() {
    setStatus("Reading the bed…");
    fetch("/api/commons")
      .then(function (r) { return r.json(); })
      .then(function (data) {
        const flowers = Array.isArray(data.flowers) ? data.flowers : [];
        render(flowers);
        if (flowers.length === 0) {
          setStatus("Empty. Be the first to plant one.");
        } else {
          const days = distinctDays(flowers);
          const morningPart = days <= 1 ? "all today" : "across " + days + " different mornings";
          setStatus(flowers.length +
            (flowers.length === 1 ? " flower planted" : " flowers planted") +
            ", " + morningPart + ".");
        }
      })
      .catch(function () {
        setStatus("Couldn't read the bed just now. Try reloading.");
      });
  }

  /* Shared by a freshly-drawn flower and one copied from your patch —
     the server can't tell the two apart and doesn't need to; both are
     just five clamped numbers and a position. */
  function sendFlower(f, plantedMsg) {
    if (plantBtn.disabled) return;
    plantBtn.disabled = true;
    yoursWrap && (yoursWrap.hidden = true);
    setStatus("Planting…");
    fetch("/api/commons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(f)
    })
      .then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (result) {
        if (!result.ok) {
          setStatus(result.d && result.d.error ? result.d.error : "Couldn't plant that one.");
          updateButton();
          return;
        }
        rememberPlanted();
        planted.insertAdjacentHTML("beforeend", flowerMarkup(f));
        setStatus(plantedMsg);
        updateButton();
      })
      .catch(function () {
        setStatus("Couldn't reach the bed. Try again in a moment.");
        updateButton();
      });
  }

  function plant(xPct) {
    if (plantBtn.disabled) return;
    const x = typeof xPct === "number" ? Math.max(2, Math.min(98, xPct)) : 4 + Math.random() * 92;
    const f = {
      x: Math.round(x * 10) / 10,
      h: 26 + Math.random() * 26,
      lean: (Math.random() - 0.5) * 16,
      p: 4 + Math.floor(Math.random() * 3),
      r: 4 + Math.random() * 2.5,
      c: Math.floor(Math.random() * PETAL_COLORS.length),
      s: Math.floor(Math.random() * STEM_COLORS.length)
    };
    sendFlower(f, "Planted. It's yours, and now it's everyone's.");
  }

  function plantFromPatch(patchFlower) {
    if (plantBtn.disabled) return;
    const x = Math.round((4 + Math.random() * 92) * 10) / 10;
    const f = {
      x: x,
      h: patchFlower.h,
      lean: patchFlower.lean,
      p: patchFlower.p,
      r: patchFlower.r,
      c: patchFlower.c,
      s: patchFlower.s
    };
    sendFlower(f, "Planted from your patch. It's yours, and now it's everyone's, too.");
  }

  bed.addEventListener("click", function (e) {
    if (plantBtn.disabled) return;
    const rect = bed.getBoundingClientRect();
    plant(((e.clientX - rect.left) / rect.width) * 100);
  });

  plantBtn.addEventListener("click", function () { plant(); });

  if (yoursRow) {
    yoursRow.addEventListener("click", function (e) {
      const btn = e.target.closest(".cm-yours-flower");
      if (!btn) return;
      const patch = loadPatch();
      const f = patch[Number(btn.dataset.i)];
      if (f) plantFromPatch(f);
    });
  }

  updateButton();
  load();
  drawWild();
  scheduleWild();
})();
