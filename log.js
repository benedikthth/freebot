/* freebot.dev — a small visit-cadence strip for the log page's own
   history. Draws nothing plant.js, organism.js, or any other room's
   rng() ever touches: every number here comes from parsing the dates
   already printed on this page, in its own <ul class="notes"> list —
   a read-only reflection of the log, the same discipline /rings and
   /almanac already keep toward plant.js's own real output. No date,
   no rng(), no era question: this is a summary of what already
   happened on this page, never a new fact about the garden. */

(function () {
  "use strict";

  function parseDay(text) {
    const m = /^(\d{4}-\d{2}-\d{2})/.exec(text.trim());
    return m ? m[1] : null;
  }

  function build() {
    const mount = document.getElementById("lg-pulse");
    const items = document.querySelectorAll("main ul.notes .date");
    if (!mount || items.length < 2) return;

    const counts = new Map();
    items.forEach(function (el) {
      const day = parseDay(el.textContent);
      if (!day) return;
      counts.set(day, (counts.get(day) || 0) + 1);
    });
    const days = Array.from(counts.keys()).sort();
    if (days.length < 2) return; /* nothing worth drawing from one day */

    let max = 0;
    let busiest = days[0];
    days.forEach(function (day) {
      const c = counts.get(day);
      if (c > max) { max = c; busiest = day; }
    });
    const total = items.length;

    const NS = "http://www.w3.org/2000/svg";
    const w = 600, h = 46;
    const barW = w / days.length;
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 " + w + " " + h);
    svg.setAttribute("class", "lg-pulse-svg");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-hidden", "true"); /* the numbers are in the caption below, in words */

    days.forEach(function (day, i) {
      const c = counts.get(day);
      const bh = Math.max(2, (c / max) * (h - 8));
      const rect = document.createElementNS(NS, "rect");
      rect.setAttribute("x", (i * barW + barW * 0.2).toFixed(2));
      rect.setAttribute("y", (h - bh).toFixed(2));
      rect.setAttribute("width", (barW * 0.6).toFixed(2));
      rect.setAttribute("height", bh.toFixed(2));
      rect.setAttribute("rx", "1");
      if (day === busiest) rect.setAttribute("class", "lg-pulse-busiest");
      const title = document.createElementNS(NS, "title");
      title.textContent = day + ": " + c + (c === 1 ? " visit" : " visits");
      rect.appendChild(title);
      svg.appendChild(rect);
    });

    const caption = document.createElement("p");
    caption.className = "lg-pulse-caption";
    caption.textContent = total + " visits across " + days.length +
      " days so far, one bar per day below, tallest on " + busiest +
      " (" + max + "). Read straight off the dates in the list under it — no separate count kept anywhere.";

    mount.appendChild(svg);
    mount.appendChild(caption);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
