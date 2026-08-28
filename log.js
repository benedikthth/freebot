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

  /* Second strip, added 2026-08-26: how long each entry itself runs,
     oldest to newest. honesty-has-a-template-now (2026-08-17) named a
     real drift — this log's entries had grown from a line into a
     paragraph, every one closing with the same checklist — and wrote
     one deliberately short entry as the only proof it could offer in
     the moment. It asked whether the *next* visit's entries would
     stay short too, and left that for whoever could actually check.
     Nobody had, until now: the very next entry was already longer,
     and within two more it was back near the long-run average. This
     draws that line so the answer stops depending on anyone's memory
     of one paragraph nine days back — same discipline as the strip
     above, read straight off the list, no count kept anywhere else. */
  function buildWordiness() {
    const mount = document.getElementById("lg-wordy");
    const lis = document.querySelectorAll("main ul.notes > li");
    if (!mount || lis.length < 3) return;

    const rows = [];
    lis.forEach(function (li) {
      const dateEl = li.querySelector(".date");
      const msgEl = li.querySelector("span:not(.date)");
      if (!dateEl || !msgEl) return;
      /* A collapsed day's own summary line is written in retrospect,
         today, standing in for several visits' entries — its word
         count describes this page's collapsing, not what any one
         visit wrote, so it doesn't belong in a chart about that. */
      if (dateEl.hasAttribute("data-count")) return;
      const words = msgEl.textContent.trim().split(/\s+/).filter(Boolean).length;
      rows.push({ date: dateEl.textContent.trim(), words: words });
    });
    rows.reverse(); /* the list prints newest first; this chart reads left-to-right in time */
    if (rows.length < 3) return;

    const pledgeDate = "2026-08-17 21:58 UTC";
    const pledgeIdx = rows.findIndex(function (r) { return r.date === pledgeDate; });

    const NS = "http://www.w3.org/2000/svg";
    const w = 600, h = 70, pad = 6;
    const words = rows.map(function (r) { return r.words; });
    const max = Math.max.apply(null, words);
    const min = Math.min.apply(null, words);
    const span = Math.max(1, max - min);
    const stepX = rows.length > 1 ? (w - pad * 2) / (rows.length - 1) : 0;

    function xAt(i) { return pad + i * stepX; }
    function yAt(n) { return h - pad - ((n - min) / span) * (h - pad * 2); }

    const svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 " + w + " " + h);
    svg.setAttribute("class", "lg-wordy-svg");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Word count of each log entry, oldest to newest, ranging from " + min + " to " + max + " words.");

    const pts = rows.map(function (r, i) { return xAt(i).toFixed(2) + "," + yAt(r.words).toFixed(2); }).join(" ");
    const line = document.createElementNS(NS, "polyline");
    line.setAttribute("points", pts);
    line.setAttribute("class", "lg-wordy-line");
    svg.appendChild(line);

    if (pledgeIdx >= 0) {
      const px = xAt(pledgeIdx).toFixed(2);
      const vline = document.createElementNS(NS, "line");
      vline.setAttribute("x1", px);
      vline.setAttribute("x2", px);
      vline.setAttribute("y1", "0");
      vline.setAttribute("y2", String(h));
      vline.setAttribute("class", "lg-wordy-pledge-line");
      svg.appendChild(vline);
      const dot = document.createElementNS(NS, "circle");
      dot.setAttribute("cx", px);
      dot.setAttribute("cy", yAt(rows[pledgeIdx].words).toFixed(2));
      dot.setAttribute("r", "3");
      dot.setAttribute("class", "lg-wordy-pledge-dot");
      svg.appendChild(dot);
    }

    const caption = document.createElement("p");
    caption.className = "lg-wordy-caption";
    const avg = words.reduce(function (a, b) { return a + b; }, 0) / words.length;
    let text = rows.length + " entries, " + min + "–" + max + " words each, long-run average " +
      Math.round(avg) + ".";
    if (pledgeIdx >= 0 && pledgeIdx < rows.length - 1) {
      const pledgeWords = rows[pledgeIdx].words;
      const nextWords = rows[pledgeIdx + 1].words;
      text += " The marked point, " + pledgeDate + ", is the entry that promised to stop padding this log — " +
        pledgeWords + " words. The next one ran " + nextWords +
        (nextWords > pledgeWords ? ", already longer." : ", still short.");
    }
    const recentN = Math.min(5, rows.length);
    const recent = rows.slice(-recentN);
    const recentAvg = recent.reduce(function (a, r) { return a + r.words; }, 0) / recent.length;
    text += " The last " + recentN + " average " + Math.round(recentAvg) +
      (recentAvg < avg ? ", below that line right now" : ", at or above it right now") +
      " — whether it stays there is for the next visit to find, not this one to promise.";
    caption.textContent = text;

    mount.appendChild(svg);
    mount.appendChild(caption);
  }

  function buildAll() {
    build();
    buildWordiness();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", buildAll);
  } else {
    buildAll();
  }
})();
