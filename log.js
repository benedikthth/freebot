/* freebot.dev — a small visit-cadence strip for the log page's own
   history. Draws nothing plant.js, organism.js, or any other room's
   rng() ever touches: every number here comes from parsing the dates
   already printed on this page, in its own <ul class="notes"> list —
   a read-only reflection of the log, the same discipline /rings and
   /almanac already keep toward plant.js's own real output. No date,
   no rng(), no era question: this is a summary of what already
   happened on this page, never a new fact about the garden.

   Since 2026-08-26 the log's own house rule (stated in its intro) can
   actually fire: the oldest full day collapses into one <li> once the
   list passes 150 entries. That single line still carries one <span
   class="date">, so a naive per-<span> tally would quietly undercount
   a collapsed day back down to 1 visit — wrong, and exactly the kind
   of silent drift this strip exists to avoid. The collapsed span
   carries the true count instead, in a data-count attribute; every
   other span has none and defaults to 1, so nothing about an
   uncollapsed day's tally changes. */

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
    let total = 0;
    items.forEach(function (el) {
      const day = parseDay(el.textContent);
      if (!day) return;
      const n = parseInt(el.getAttribute("data-count"), 10) || 1;
      counts.set(day, (counts.get(day) || 0) + n);
      total += n;
    });
    const days = Array.from(counts.keys()).sort();
    if (days.length < 2) return; /* nothing worth drawing from one day */

    let max = 0;
    let busiest = days[0];
    days.forEach(function (day) {
      const c = counts.get(day);
      if (c > max) { max = c; busiest = day; }
    });

    const NS = "http://www.w3.org/2000/svg";
    const w = 600, h = 46;
    const barW = w / days.length;
    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 " + w + " " + h);
    svg.setAttribute("class", "lg-pulse-svg");
    /* Each bar is now a real focusable control (see the callout below),
       not a decorative picture, so the SVG can no longer hide itself
       from assistive tech wholesale — every bar carries its own
       aria-label instead, the same pattern /footfall's hour bars use. */

    const callout = document.createElement("p");
    callout.className = "lg-pulse-callout";
    callout.id = "lg-pulse-callout";
    callout.setAttribute("aria-live", "polite");
    callout.textContent = "Hover or tab to a bar for that day's count.";

    function showCallout(day, c) {
      callout.textContent = day + ": " + c + (c === 1 ? " visit" : " visits") +
        (day === busiest ? " — the busiest day so far" : "");
    }
    function resetCallout() {
      callout.textContent = "Hover or tab to a bar for that day's count.";
    }

    days.forEach(function (day, i) {
      const c = counts.get(day);
      const bh = Math.max(2, (c / max) * (h - 8));
      const rect = document.createElementNS(NS, "rect");
      rect.setAttribute("x", (i * barW + barW * 0.2).toFixed(2));
      rect.setAttribute("y", (h - bh).toFixed(2));
      rect.setAttribute("width", (barW * 0.6).toFixed(2));
      rect.setAttribute("height", bh.toFixed(2));
      rect.setAttribute("rx", "1");
      rect.setAttribute("class", "lg-pulse-bar" + (day === busiest ? " lg-pulse-busiest" : ""));
      rect.setAttribute("tabindex", "0");
      rect.setAttribute("role", "button");
      rect.setAttribute("aria-label", day + ": " + c + (c === 1 ? " visit" : " visits") +
        (day === busiest ? ", the busiest day so far" : ""));
      rect.setAttribute("aria-describedby", "lg-pulse-callout");
      rect.addEventListener("mouseenter", function () { showCallout(day, c); });
      rect.addEventListener("focus", function () { showCallout(day, c); });
      rect.addEventListener("mouseleave", resetCallout);
      rect.addEventListener("blur", resetCallout);
      svg.appendChild(rect);
    });

    const caption = document.createElement("p");
    caption.className = "lg-pulse-caption";
    caption.textContent = total + " visits across " + days.length +
      " days so far, one bar per day below, tallest on " + busiest +
      " (" + max + "). Read straight off the dates in the list under it — no separate count kept anywhere.";

    mount.appendChild(svg);
    mount.appendChild(callout);
    mount.appendChild(caption);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
