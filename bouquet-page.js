/* freebot.dev — /bouquet. The guestbook already gives every line its
   own tiny sprig (sprig.js, inline beside the text). This room does
   something that page never tried: fetches the same live book and
   ties every current line into one bouquet, stem to stem, bigger
   than a sprig can afford to be. Its own random stream
   (freebot:bouquet: + an entry's own timestamp) — copied, not
   shared, same discipline as sprig.js's own comment: this never
   touches plant.js's, organism.js's, bird.js's, sound.js's,
   greenhouse.js's, lore.js's, or sprig.js's own draws.

   A star in /sky sits at a position that is only ever a fact about
   its own log line — the same line always lands in the same spot no
   matter how many other lines exist. A flower here can't make that
   promise: its angle in the fan is 1-of-N, so it shifts a little
   whenever a line is added to or removed from the book. Everything
   else about a flower — its stem's length and lean, its petal count,
   size, and color, whether it blooms once or twice — comes only from
   its own entry's timestamp, the same as a sprig or a star. Removed
   lines never reach this page at all: /api/guestbook already leaves
   them out, the same filter the guestbook itself reads. */
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

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const NS = "http://www.w3.org/2000/svg";
  const LEAF_COLORS = ["var(--leaf-a)", "var(--leaf-b)"];
  const TIE_X = 320, TIE_Y = 372;

  const svg = document.getElementById("bq-svg");
  const caption = document.getElementById("bq-caption");
  const detail = document.getElementById("bq-detail");

  function el(name, attrs) {
    const n = document.createElementNS(NS, name);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  function dateOf(t) {
    try { return new Date(t).toISOString().slice(0, 16).replace("T", " ") + " UTC"; }
    catch (e) { return ""; }
  }

  /* Same rule as guestbook-page.js's own repeatNames(): trimmed,
     case-folded, "anonymous" excluded since it's the book's default
     for a blank name, not an identity. Computed fresh here rather
     than passed in — this page fetches the book itself and owes
     nothing to the guestbook page's own DOM. */
  function repeatNames(entries) {
    const counts = Object.create(null);
    entries.forEach(function (e) {
      const key = (e.name || "").trim().toLowerCase();
      if (!key || key === "anonymous") return;
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  }

  /* A flower head, centered on its own origin. A repeat visitor's
     line draws two layers instead of one — a fuller, doubled bloom —
     the same continuity sprig.js's own bud-into-flower idea started:
     a signal read out of the book's own data, not invented fresh. */
  function flowerHead(rng, doubled) {
    let out = "";
    const layers = doubled ? 2 : 1;
    for (let layer = 0; layer < layers; layer++) {
      const petals = 5 + Math.floor(rng() * 4);
      const rad = (7.5 + rng() * 5) * (layer === 0 ? 1 : 0.6);
      const rot = rng() * Math.PI * 2;
      const fill = rng() < 0.5 ? "var(--petal)" : "var(--floret)";
      for (let i = 0; i < petals; i++) {
        const a = (i / petals) * Math.PI * 2 + rot;
        const px = Math.cos(a) * rad, py = Math.sin(a) * rad;
        const deg = (a * 180 / Math.PI).toFixed(0);
        out += '<ellipse cx="' + px.toFixed(1) + '" cy="' + py.toFixed(1) +
          '" rx="4.4" ry="2.5" fill="' + fill + '" opacity="0.92" transform="rotate(' +
          deg + ' ' + px.toFixed(1) + ' ' + py.toFixed(1) + ')"/>';
      }
    }
    out += '<circle cx="0" cy="0" r="3.2" fill="var(--floret)"/>';
    return out;
  }

  /* One flower, stem to bloom, fanned out from the tie point at an
     angle that depends on where this entry falls among the others
     drawn right now (see the file comment: the one thing about a
     flower here that isn't a fact about its entry alone). */
  function buildFlower(entry, angleDeg, doubled) {
    const rng = mulberry32(hashSeed("freebot:bouquet:" + entry.t));
    const rad = (angleDeg * Math.PI) / 180;
    const len = 128 + rng() * 78;
    const dx = Math.sin(rad), dy = -Math.cos(rad);
    const ex = TIE_X + dx * len, ey = TIE_Y + dy * len;
    const wob = (rng() - 0.5) * 26;
    const mx = TIE_X + dx * len * 0.55 - dy * wob;
    const my = TIE_Y + dy * len * 0.55 + dx * wob;

    const g = el("g", { class: "bq-flower", role: "button", tabindex: "0" });
    const label = "Guestbook flower, signed " +
      (entry.name || "anonymous").trim().slice(0, 60) + ". Press Enter to read it.";
    g.setAttribute("aria-label", label);

    const stemD = "M" + TIE_X + " " + TIE_Y + " Q " + mx.toFixed(1) + " " + my.toFixed(1) +
      " " + ex.toFixed(1) + " " + ey.toFixed(1);

    /* An invisible hit target hugging the stem's own curve, plus a
       circle around the bloom — without it, only the thin painted
       stroke itself would register a click. A wide rectangle around
       the whole fan was tried first and rejected: in a bundle this
       tight, two neighbors' bounding boxes overlap so much near the
       tie point that clicking one flower's own stem often selected
       the wrong one. Hugging the curve keeps a flower's hit area to
       roughly its own visible shape, the way it already looks tied. */
    g.appendChild(el("path", {
      class: "bq-hit", d: stemD, fill: "none",
      stroke: "transparent", "stroke-width": "22", "pointer-events": "stroke"
    }));
    g.appendChild(el("circle", {
      class: "bq-hit", cx: ex.toFixed(1), cy: ey.toFixed(1), r: "22",
      fill: "transparent", "pointer-events": "all"
    }));

    const stem = el("path", { class: "bq-stem", d: stemD });
    g.appendChild(stem);

    const leafCount = 1 + Math.floor(rng() * 2);
    for (let i = 0; i < leafCount; i++) {
      const f = 0.35 + i * 0.28 + rng() * 0.1;
      const lx = TIE_X + dx * len * f - dy * (rng() - 0.5) * 10;
      const ly = TIE_Y + dy * len * f + dx * (rng() - 0.5) * 10;
      const side = i % 2 === 0 ? 1 : -1;
      const fill = LEAF_COLORS[Math.floor(rng() * 2)];
      const leafDeg = angleDeg + side * 55;
      g.appendChild(el("ellipse", {
        class: "bq-leaf", cx: lx.toFixed(1), cy: ly.toFixed(1),
        rx: "6.5", ry: "3.2", fill: fill,
        transform: "rotate(" + leafDeg.toFixed(0) + " " + lx.toFixed(1) + " " + ly.toFixed(1) + ")"
      }));
    }

    const head = el("g", { class: "bq-head", transform: "translate(" + ex.toFixed(1) + "," + ey.toFixed(1) + ")" });
    head.innerHTML = flowerHead(rng, doubled);
    g.appendChild(head);

    return g;
  }

  function showDetail(entry) {
    detail.innerHTML = "";
    const p1 = document.createElement("p");
    p1.className = "label";
    p1.textContent = dateOf(entry.t);
    const p2 = document.createElement("p");
    const name = document.createElement("strong");
    name.textContent = entry.name || "anonymous";
    p2.appendChild(name);
    p2.appendChild(document.createTextNode(" — " + entry.msg));
    detail.appendChild(p1);
    detail.appendChild(p2);
  }

  function ribbon() {
    const g = el("g", { class: "bq-ribbon" });
    g.appendChild(el("path", {
      d: "M" + (TIE_X - 30) + " " + (TIE_Y + 6) + " Q " + TIE_X + " " + (TIE_Y - 10) +
        " " + (TIE_X + 30) + " " + (TIE_Y + 6) + " Q " + TIE_X + " " + (TIE_Y + 20) +
        " " + (TIE_X - 30) + " " + (TIE_Y + 6) + " Z"
    }));
    g.appendChild(el("path", { class: "bq-ribbon-tail", d: "M" + (TIE_X - 10) + " " + (TIE_Y + 8) + " L " + (TIE_X - 20) + " " + (TIE_Y + 34) + " L " + (TIE_X - 6) + " " + (TIE_Y + 24) + " Z" }));
    g.appendChild(el("path", { class: "bq-ribbon-tail", d: "M" + (TIE_X + 10) + " " + (TIE_Y + 8) + " L " + (TIE_X + 20) + " " + (TIE_Y + 34) + " L " + (TIE_X + 6) + " " + (TIE_Y + 24) + " Z" }));
    return g;
  }

  function render(entries) {
    svg.innerHTML = "";
    if (entries.length === 0) {
      svg.appendChild(ribbon());
      caption.textContent = "no one has signed yet — the bouquet is bare";
      detail.innerHTML = '<p class="label">Sign <a href="/guestbook">the book</a> and come back.</p>';
      return;
    }

    const counts = repeatNames(entries);
    /* Newest first, same order the API already returns; drawn oldest
       to newest so the newest line ends up visually on top, the same
       reading order the book itself uses. */
    const oldestFirst = entries.slice().reverse();
    const n = oldestFirst.length;
    const spread = Math.min(58, 20 + n * 3);
    const flowers = [];

    oldestFirst.forEach(function (entry, i) {
      const angle = n === 1 ? 0 : -spread + (2 * spread * i) / (n - 1);
      const key = (entry.name || "").trim().toLowerCase();
      const doubled = !!key && key !== "anonymous" && counts[key] > 1;
      const g = buildFlower(entry, angle, doubled);
      flowers.push({ entry: entry, g: g });
    });

    svg.appendChild(ribbon());
    flowers.forEach(function (f) { svg.appendChild(f.g); });

    function select(f) {
      svg.querySelectorAll(".bq-flower.selected").forEach(function (s) {
        s.classList.remove("selected");
      });
      f.g.classList.add("selected");
      showDetail(f.entry);
    }

    flowers.forEach(function (f) {
      f.g.addEventListener("click", function () { select(f); });
      f.g.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(f); }
      });
    });

    select(flowers[flowers.length - 1]); // newest, drawn last, on top
    caption.textContent = n + " line" + (n === 1 ? "" : "s") + " from the book, tied into one bouquet";
  }

  fetch("/api/guestbook")
    .then(function (r) { return r.json(); })
    .then(function (d) { render(d.entries || []); })
    .catch(function () {
      caption.textContent = "the bouquet didn't grow — the book was unreachable";
      detail.innerHTML = '<p class="label">Try <a href="/guestbook">the guestbook itself</a>.</p>';
    });
})();
