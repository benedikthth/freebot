/* freebot.dev — growth rings. A cross-section of the whole garden,
   one ring per day it has been alive, oldest at the core and newest
   at the bark.

   Draws no seed and calls no rng() of its own: every ring's facts
   come straight from freebotGarden.grow(), freebotGround.grow(), and
   freebotBird.grow() — the same read-only calls the almanac already
   makes for the same reason. This file cannot desync from what those
   rooms show, and there is nothing here for the eras promise to even
   ask about.

   The one rng() this file does own is purely cosmetic: a ring's small
   marks (moss/lichen dot, bird caret, nyctinastic diamond) need an
   angle to sit at, and that angle is hashed from the date the same
   copy-not-share way sky-page.js hashes a log line's position. It
   never decides a fact, only where an already-decided one is drawn. */

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

  /* A layout-only angle, in radians, for a ring's given mark kind.
     Own stream (freebot:ringpos: + kind + date), so ground/bird/bloom
     marks on the same ring never land on top of each other and never
     touch organism.js's or bird.js's own draws. */
  function markAngle(dateStr, kind) {
    const rng = mulberry32(hashSeed("freebot:ringpos:" + kind + ":" + dateStr));
    return rng() * Math.PI * 2;
  }

  const PLANT_DATE = "2026-08-08";
  const RING_BASE = 15; /* a plain leafy day's thickness, in viewBox units */
  const PITH_R = 8;
  const PAD = 22;

  const NS = "http://www.w3.org/2000/svg";
  function el(tag, attrs) {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  function nextDay(dateStr) {
    const d = new Date(dateStr + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + 1);
    return d.toISOString().slice(0, 10);
  }

  /* A day's ring thickness: wide for a good year (it flowered), narrow
     for a lean one (it grew bare), plain otherwise — the real
     dendrochronology convention this room borrows, see the page's own
     prose for why. */
  function thicknessOf(s) {
    if (s.flowering) return RING_BASE * 1.55;
    if (s.leafCount === 0) return RING_BASE * 0.6;
    return RING_BASE;
  }

  const SEASON_COLOR = {
    winter: "var(--season-winter)",
    spring: "var(--season-spring)",
    summer: "var(--season-summer)",
    autumn: "var(--season-autumn)"
  };

  function ringColor(s) {
    return s.season ? SEASON_COLOR[s.season] : "var(--moss-deep)"; /* era 1: no seasons yet */
  }

  const WEATHER_WORD = { clear: "", rain: "rain", windy: "wind", fog: "fog", snow: "snow" };

  function weatherText(weather) {
    if (!weather || weather.type === "clear") return "";
    if (weather.type === "windy") return "wind (strength " + weather.strength + ")";
    if (weather.type === "fog") return "fog (level " + weather.level + ")";
    return weather.type;
  }

  const svg = document.getElementById("ring-svg");
  const caption = document.getElementById("ring-caption");
  const detail = document.getElementById("ring-detail");

  function showDetail(ring) {
    const s = ring.s;
    detail.innerHTML = "";

    const p1 = document.createElement("p");
    p1.className = "label";
    p1.textContent = s.date;
    const tags = [];
    if (!s.season) tags.push("era 1, no seasons yet");
    if (s.season) tags.push(s.season);
    const wt = weatherText(s.weather);
    if (wt) tags.push(wt);
    if (s.nyctinastic) tags.push("closes at night");
    if (ring.ground.present) tags.push(ring.ground.kind);
    if (ring.bird.present) tags.push("bird");
    tags.forEach(function (t) {
      const tag = document.createElement("span");
      tag.className = "ring-tag";
      tag.textContent = t;
      p1.appendChild(document.createTextNode(" "));
      p1.appendChild(tag);
    });
    detail.appendChild(p1);

    const p2 = document.createElement("p");
    const nameEl = document.createElement("span");
    nameEl.className = "binomial";
    nameEl.textContent = s.name;
    p2.appendChild(nameEl);
    p2.appendChild(document.createTextNode(" — " + s.traits));
    detail.appendChild(p2);

    const p3 = document.createElement("p");
    const link = document.createElement("a");
    link.href = "/garden?day=" + s.date;
    link.textContent = "see " + s.date + " in the garden";
    p3.appendChild(document.createTextNode("→ "));
    p3.appendChild(link);
    detail.appendChild(p3);
  }

  /* size is a multiplier — 1 for the real mark, larger for the pale
     backdrop drawn just behind it (see appendMark), since a mark's own
     color can sit close to whatever season color the ring under it
     happens to be. */
  function buildMark(cx, cy, r, angle, cls, shape, size) {
    const mul = size || 1;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    if (shape === "dot") {
      return el("circle", { class: cls, cx: x.toFixed(1), cy: y.toFixed(1), r: (2.1 * mul).toFixed(1) });
    }
    if (shape === "caret") {
      const a = angle;
      const s = 3.4 * mul;
      const tipX = x + Math.cos(a) * s, tipY = y + Math.sin(a) * s;
      const p1x = x + Math.cos(a + 2.4) * s, p1y = y + Math.sin(a + 2.4) * s;
      const p2x = x + Math.cos(a - 2.4) * s, p2y = y + Math.sin(a - 2.4) * s;
      return el("path", {
        class: cls,
        d: "M " + p1x.toFixed(1) + " " + p1y.toFixed(1) +
          " L " + tipX.toFixed(1) + " " + tipY.toFixed(1) +
          " L " + p2x.toFixed(1) + " " + p2y.toFixed(1)
      });
    }
    /* diamond, for a bloom that closes at night */
    const s2 = 2.6 * mul;
    return el("path", {
      class: cls,
      d: "M " + x.toFixed(1) + " " + (y - s2).toFixed(1) +
        " L " + (x + s2).toFixed(1) + " " + y.toFixed(1) +
        " L " + x.toFixed(1) + " " + (y + s2).toFixed(1) +
        " L " + (x - s2).toFixed(1) + " " + y.toFixed(1) + " Z"
    });
  }

  /* A mark plus a pale backdrop of the same shape, slightly larger and
     drawn first, so the mark itself stays readable regardless of which
     season color the ring underneath happens to be. */
  function appendMark(g, cx, cy, r, angle, cls, shape) {
    const halo = buildMark(cx, cy, r, angle, "ring-mark-halo ring-mark-halo-" + shape, shape, 1.7);
    if (shape === "caret") halo.setAttribute("stroke-width", "3.2");
    g.appendChild(halo);
    g.appendChild(buildMark(cx, cy, r, angle, cls, shape, 1));
  }

  function render(dates) {
    svg.innerHTML = "";
    if (dates.length === 0) {
      caption.textContent = "no rings yet";
      return;
    }

    let r = PITH_R;
    const rings = [];
    dates.forEach(function (dateStr, i) {
      const s = window.freebotGarden.grow(dateStr);
      const ground = window.freebotGround ? window.freebotGround.grow(dateStr) : { present: false };
      const bird = window.freebotBird ? window.freebotBird.grow(dateStr) : { present: false };
      const thickness = thicknessOf(s);
      const centerR = r + thickness / 2;
      rings.push({ date: dateStr, s: s, ground: ground, bird: bird, thickness: thickness, centerR: centerR, i: i });
      r += thickness;
    });
    const outerR = r;
    const size = (outerR + PAD) * 2;
    const cx = outerR + PAD, cy = outerR + PAD;
    svg.setAttribute("viewBox", "0 0 " + size.toFixed(1) + " " + size.toFixed(1));

    const root = el("g", {});

    /* The pith — before the first ring, drawn once, not selectable. */
    const pith = el("circle", { class: "ring-pith", cx: cx, cy: cy, r: PITH_R });
    const pithTitle = el("title", {});
    pithTitle.textContent = "the seed, before " + PLANT_DATE;
    pith.appendChild(pithTitle);
    root.appendChild(pith);

    rings.forEach(function (ring) {
      const s = ring.s;
      const isNewest = ring.i === rings.length - 1;
      const g = el("g", { class: "ring-band" + (isNewest ? " newest" : ""), tabindex: "0", role: "button" });
      const labelBits = [ring.date, s.season || "era 1"];
      const wt = weatherText(s.weather);
      if (wt) labelBits.push(wt);
      if (s.flowering) labelBits.push("flowering");
      g.setAttribute("aria-label", "Ring for " + labelBits.join(", ") + (isNewest ? " — newest, still soft" : ""));
      g.dataset.date = ring.date;

      const isFoggy = s.weather && (s.weather.type === "fog" || s.weather.type === "snow");
      const fogOpacity = isFoggy ? [0.85, 0.7, 0.55][(s.weather.level || 1) - 1] : 1;

      /* A narrow (bare-day) ring can be only a few px of actual paint —
         too thin to click or tap reliably. This invisible circle widens
         the hit area a little past what's actually drawn — but only a
         little: padding it past half the gap to a neighboring ring
         would let a click meant for one ring land on the next (the
         later-drawn, visually outer one always wins an overlap), which
         a first build of this did at +16px before catching it in a
         headless-browser click sweep. +3px a side is enough to help a
         thin ring without reaching into its neighbor's own band. */
      const hit = el("circle", {
        class: "ring-hit",
        cx: cx, cy: cy, r: ring.centerR.toFixed(1),
        "stroke-width": (ring.thickness + 6).toFixed(1)
      });
      g.appendChild(hit);

      const track = el("circle", {
        class: "ring-track",
        cx: cx, cy: cy, r: ring.centerR.toFixed(1),
        "stroke-width": ring.thickness.toFixed(1),
        stroke: ringColor(s),
        opacity: fogOpacity
      });
      g.appendChild(track);

      if (s.weather && s.weather.type === "rain") {
        g.appendChild(el("circle", {
          class: "ring-weather ring-rain",
          cx: cx, cy: cy, r: ring.centerR.toFixed(1),
          "stroke-width": Math.max(1, ring.thickness * 0.16).toFixed(1)
        }));
      }
      if (s.weather && s.weather.type === "windy") {
        g.appendChild(el("circle", {
          class: "ring-weather ring-windy",
          cx: cx, cy: cy, r: ring.centerR.toFixed(1)
        }));
      }
      if (s.weather && s.weather.type === "snow") {
        for (let k = 0; k < 5; k++) {
          const a = markAngle(ring.date, "snow" + k);
          g.appendChild(buildMark(cx, cy, ring.centerR, a, "ring-weather ring-snowfleck", "dot"));
        }
      }

      if (ring.ground.present) {
        const a = markAngle(ring.date, "ground");
        const cls = "ring-mark ring-ground ring-ground-" + ring.ground.kind;
        appendMark(g, cx, cy, ring.centerR, a, cls, "dot");
      }
      if (ring.bird.present) {
        const a = markAngle(ring.date, "bird");
        appendMark(g, cx, cy, ring.centerR, a, "ring-mark ring-bird", "caret");
      }
      if (s.nyctinastic) {
        const a = markAngle(ring.date, "nyctinastic");
        appendMark(g, cx, cy, ring.centerR, a, "ring-mark ring-bloom", "diamond");
      }

      const selectMark = el("circle", {
        class: "ring-select-mark",
        cx: cx, cy: cy, r: ring.centerR.toFixed(1),
        "stroke-width": (ring.thickness + 3).toFixed(1)
      });
      g.appendChild(selectMark);

      const select = function () {
        svg.querySelectorAll(".ring-band.selected").forEach(function (b) { b.classList.remove("selected"); });
        g.classList.add("selected");
        showDetail(ring);
      };
      g.addEventListener("click", select);
      g.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(); }
      });
      ring.select = select;

      root.appendChild(g);
    });

    svg.appendChild(root);
    rings[rings.length - 1].select();

    caption.textContent = rings.length + " ring" + (rings.length === 1 ? "" : "s") +
      " · oldest " + rings[0].date + " · newest " + rings[rings.length - 1].date;
  }

  const dates = [];
  let d = PLANT_DATE;
  const today = window.freebotGarden.todayUTC();
  while (d <= today) {
    dates.push(d);
    d = nextDay(d);
  }
  render(dates);
})();
