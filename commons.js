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
   an ugly flower where a good one already grew. */

(function () {
  "use strict";

  const bed = document.getElementById("cm-bed");
  const plantBtn = document.getElementById("cm-plant");
  const status = document.getElementById("cm-status");
  if (!bed || !plantBtn || !status) return;

  const PETAL_COLORS = ["var(--petal)", "var(--floret)", "var(--blush)"];
  const STEM_COLORS = ["var(--stem)", "var(--leaf-a)"];
  const PLANTED_KEY = "freebot:commons:plantedOn";

  function flowerMarkup(f) {
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
    return '<svg class="sw-flower cm-flower" style="left:' + f.x + '%" viewBox="-20 -66 40 70" ' +
      'width="40" height="70" aria-hidden="true">' +
      '<path d="M0,0 Q' + f.lean.toFixed(1) + ',' + (bloomY / 2).toFixed(1) + ' 0,' + bloomY.toFixed(1) + '" ' +
      'fill="none" stroke="' + stemColor + '" stroke-width="2" stroke-linecap="round"/>' +
      petals +
      '<circle cx="0" cy="' + bloomY.toFixed(1) + '" r="' + (f.r * 0.45).toFixed(1) + '" fill="var(--stem-deep)"/>' +
      '</svg>';
  }

  function render(flowers) {
    bed.innerHTML = flowers.map(flowerMarkup).join("");
  }

  function setStatus(text) {
    status.textContent = text;
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
  }

  function load() {
    setStatus("Reading the bed…");
    fetch("/api/commons")
      .then(function (r) { return r.json(); })
      .then(function (data) {
        const flowers = Array.isArray(data.flowers) ? data.flowers : [];
        render(flowers);
        setStatus(flowers.length === 0
          ? "Empty. Be the first to plant one."
          : flowers.length + (flowers.length === 1 ? " flower planted, by one visitor." : " flowers planted, by that many visitors."));
      })
      .catch(function () {
        setStatus("Couldn't read the bed just now. Try reloading.");
      });
  }

  function plant(xPct) {
    if (plantBtn.disabled) return;
    plantBtn.disabled = true;
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
        bed.insertAdjacentHTML("beforeend", flowerMarkup(f));
        setStatus("Planted. It's yours, and now it's everyone's.");
        updateButton();
      })
      .catch(function () {
        setStatus("Couldn't reach the bed. Try again in a moment.");
        updateButton();
      });
  }

  bed.addEventListener("click", function (e) {
    if (plantBtn.disabled) return;
    const rect = bed.getBoundingClientRect();
    plant(((e.clientX - rect.left) / rect.width) * 100);
  });

  plantBtn.addEventListener("click", function () { plant(); });
  updateButton();
  load();
})();
