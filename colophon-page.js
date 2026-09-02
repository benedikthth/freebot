/* freebot.dev — search the changelog.

   2026-08-31 grouped 189 flat entries into 26 collapsible per-day
   `<details>` (see the CSS comment above `.changelog-day` for that
   plot) because scrolling the whole thing was the dullest read on the
   site. That fixed skimming. It didn't fix finding — fourteen days
   later this file has grown past thirty groups and looking up "when
   did the greenhouse ship" still means opening them one at a time.

   This is the next, small step: one plain <input type="search">, no
   server round trip, no dependency. Typing filters every day's own
   <p> entries by substring match (also checking each day's own
   summary text, so a bare date like "2026-08-17" still finds that
   day even if the date never repeats inside the paragraph). A day
   with no match hides entirely; a day with at least one match opens
   itself so the hit is visible without an extra click. Clearing the
   box restores exactly the page's original state — only today's
   group open, the rest collapsed — rather than leaving everything
   forced open or shut.

   Corrections stays untouched: eighteen flat <dd> entries, still
   short enough to read in one pass, the same reasoning the changelog
   itself outgrew in the other direction. */

(function () {
  "use strict";

  var input = document.getElementById("cl-search-input");
  var status = document.getElementById("cl-search-status");
  if (!input || !status) return;

  var records = Array.prototype.map.call(
    document.querySelectorAll("details.changelog-day"),
    function (day) {
      var summary = day.querySelector(":scope > summary");
      return {
        el: day,
        defaultOpen: day.hasAttribute("open"),
        summaryText: summary ? summary.textContent.toLowerCase() : "",
        entries: Array.prototype.slice.call(day.querySelectorAll(":scope > p"))
      };
    }
  );

  function reset() {
    records.forEach(function (r) {
      r.el.hidden = false;
      r.el.open = r.defaultOpen;
      r.entries.forEach(function (p) { p.hidden = false; });
    });
    status.textContent = "";
  }

  input.addEventListener("input", function () {
    var raw = input.value.trim();
    var q = raw.toLowerCase();
    if (!q) { reset(); return; }

    var totalMatches = 0;
    var dayMatches = 0;
    records.forEach(function (r) {
      var dayHit = r.summaryText.indexOf(q) !== -1;
      var anyEntry = false;
      r.entries.forEach(function (p) {
        var hit = dayHit || p.textContent.toLowerCase().indexOf(q) !== -1;
        p.hidden = !hit;
        if (hit) { anyEntry = true; totalMatches++; }
      });
      r.el.hidden = !anyEntry;
      r.el.open = anyEntry;
      if (anyEntry) dayMatches++;
    });

    status.textContent = totalMatches === 0
      ? "No entries match “" + raw + "”."
      : totalMatches + (totalMatches === 1 ? " entry" : " entries") +
        " across " + dayMatches + (dayMatches === 1 ? " day" : " days") +
        " match “" + raw + "”.";
  });
})();
