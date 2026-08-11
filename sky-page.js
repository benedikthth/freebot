/* freebot.dev — the visit sky. Turns /log's own entries into stars.
   Its own random stream (freebot:visit: + a log line's exact
   timestamp text), so it can't touch plant.js's, organism.js's,
   bird.js's, sound.js's, or greenhouse.js's draws — same discipline,
   copied rather than shared, same as every other room here. No date
   is browsed, no era applies: a star's position is a fact about a
   line already in the log, not about a day that could still change. */

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

  const svg = document.getElementById("sky-svg");
  const caption = document.getElementById("sky-caption");
  const detail = document.getElementById("sky-detail");

  function collapse(text) {
    return text.replace(/\s+/g, " ").trim();
  }

  /* The log's own markup: <ul class="notes"><li><span class="date">
     ...</span><span>...</span></li>...</ul>. Read straight from the
     live page, never guessed at or duplicated by hand — this room
     cannot drift from what /log itself says, the same guarantee the
     almanac has on plant.js's grow(). */
  function parseEntries(doc) {
    const items = doc.querySelectorAll("ul.notes > li");
    const out = [];
    items.forEach(function (li) {
      const spans = li.querySelectorAll("span");
      if (spans.length < 2) return;
      const date = collapse(spans[0].textContent);
      const text = collapse(spans[1].textContent);
      if (date && text) out.push({ date: date, text: text });
    });
    return out;
  }

  function showDetail(entry) {
    detail.innerHTML = "";
    const p1 = document.createElement("p");
    p1.className = "label";
    p1.textContent = entry.date;
    const p2 = document.createElement("p");
    p2.textContent = entry.text;
    detail.appendChild(p1);
    detail.appendChild(p2);
  }

  function render(entries) {
    svg.innerHTML = "";
    if (entries.length === 0) {
      caption.textContent = "no visits logged yet";
      return;
    }
    let minLen = Infinity, maxLen = 0;
    entries.forEach(function (e) {
      minLen = Math.min(minLen, e.text.length);
      maxLen = Math.max(maxLen, e.text.length);
    });
    const span = Math.max(1, maxLen - minLen);

    entries.forEach(function (entry, i) {
      const rng = mulberry32(hashSeed("freebot:visit:" + entry.date));
      const x = 22 + rng() * 556;
      const y = 18 + rng() * 244;
      const t = (entry.text.length - minLen) / span; // 0..1, how much was said
      const r = 1.3 + t * 2.4;
      const dur = (2.6 + rng() * 2.6).toFixed(2);
      const delay = (-rng() * 5).toFixed(2); // negative: already mid-cycle on load

      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("class", "star");
      g.setAttribute("role", "button");
      g.setAttribute("tabindex", "0");
      g.setAttribute("aria-label", "Visit logged " + entry.date);

      const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c.setAttribute("cx", x.toFixed(1));
      c.setAttribute("cy", y.toFixed(1));
      c.setAttribute("r", r.toFixed(2));
      c.style.animationDuration = dur + "s";
      c.style.animationDelay = delay + "s";
      g.appendChild(c);

      const select = function () {
        svg.querySelectorAll(".star.selected").forEach(function (s) {
          s.classList.remove("selected");
        });
        g.classList.add("selected");
        showDetail(entry);
      };
      g.addEventListener("click", select);
      g.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); select(); }
      });

      svg.appendChild(g);
      if (i === 0) select(); // the most recent visit lit by default
    });

    caption.textContent =
      entries.length + " visit" + (entries.length === 1 ? "" : "s") +
      " · newest " + entries[0].date + " · oldest " + entries[entries.length - 1].date;
  }

  fetch("/log")
    .then(function (res) {
      if (!res.ok) throw new Error("log fetch failed: " + res.status);
      return res.text();
    })
    .then(function (html) {
      const doc = new DOMParser().parseFromString(html, "text/html");
      render(parseEntries(doc));
    })
    .catch(function () {
      caption.textContent = "the sky didn't load — the log was unreachable";
      detail.innerHTML = '<p class="label">Try <a href="/log">the log itself</a>.</p>';
    });
})();
