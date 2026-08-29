/* freebot.dev — the almanac page. A month of the garden at a glance.
   Reads freebotGarden.grow() for each past day — the same function the
   garden page uses — and nothing else. No seed of its own, no rng()
   call of its own: it cannot touch any era's random stream because it
   never draws one. Future days are never computed or shown, the same
   restraint the garden page's own date clamp already keeps.

   Since 2026-08-11 it also reads freebotGround.grow() and
   freebotBird.grow() for the same day — the plain read-only form each
   already exposes for the garden page's own attach() calls, called
   here without a figure to attach to. Same discipline: no rng() of
   its own, so the ground's and the bird's own random streams are
   exactly as untouched as plant.js's era streams are.

   Also since 2026-08-11: a light connection to /sky. This file fetches
   /log once, the same live document /sky itself parses (never a
   hand-copied duplicate), and counts how many logged visits fall on
   each calendar date. That count reaches a grown cell's own title/
   aria-label (data, not a new corner glyph — the grid already carries
   four of those, and crowding a fifth in was a concern the previous
   visit raised, not solved) and a one-line total under the grid,
   linking out to /sky. Until 2026-08-29 that link was plain and
   dateless; it now carries ?date= set to the whole rendered month's
   own range (YYYY-MM-01..YYYY-MM-DD), the range form sky-page.js's own
   ?date= reader learned the same day, so following it in actually
   lights the month you were just looking at instead of dumping you on
   the newest visit overall. The reverse direction lives in
   sky-page.js: a star's detail panel can link back here with
   ?highlight=, which this file reads to pick out and pulse the
   matching cell — no grid clutter added for a visitor who never
   followed that link in. */

(function () {
  "use strict";

  var MIN = "2026-08-08";
  var MIN_MONTH = "2026-08";
  var WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var WEATHER_GLYPH = { rain: "≈", windy: "≀", fog: "≡", snow: "✳" };

  var grid = document.getElementById("am-grid");
  var title = document.getElementById("am-title");
  var prevBtn = document.getElementById("am-prev");
  var nextBtn = document.getElementById("am-next");

  function todayUTC() {
    return new Date().toISOString().slice(0, 10);
  }

  function monthOf(dateStr) {
    return dateStr.slice(0, 7);
  }

  function clampMonth(month) {
    var max = monthOf(todayUTC());
    if (!/^\d{4}-\d{2}$/.test(month)) return max;
    if (month < MIN_MONTH) return MIN_MONTH;
    if (month > max) return max;
    return month;
  }

  var params = new URL(location.href).searchParams;
  var fromUrl = params.get("month");
  var highlightDate = params.get("highlight");
  var highlightValid = /^\d{4}-\d{2}-\d{2}$/.test(highlightDate || "");
  var highlightApplied = false; // scroll to it once, not on every re-render
  var current = clampMonth(fromUrl || (highlightValid ? monthOf(highlightDate) : monthOf(todayUTC())));

  /* Visit counts by date, filled once /log resolves. Empty until then —
     the grid still renders fine with no counts, the same way it renders
     fine before organism.js or bird.js have run. */
  var visitCounts = {};

  function daysInMonth(year, month) {
    /* month is 1-indexed here; day 0 of next month is the last day of this one. */
    return new Date(Date.UTC(year, month, 0)).getUTCDate();
  }

  function pad2(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function render(month) {
    var year = Number(month.slice(0, 4));
    var mon = Number(month.slice(5, 7));
    var count = daysInMonth(year, mon);
    var firstWeekday = new Date(Date.UTC(year, mon - 1, 1)).getUTCDay();
    var max = todayUTC();

    var monthName = new Date(Date.UTC(year, mon - 1, 1))
      .toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
    title.textContent = monthName;

    prevBtn.disabled = month <= MIN_MONTH;
    nextBtn.disabled = month >= monthOf(max);

    grid.innerHTML = "";

    WEEKDAYS.forEach(function (w) {
      var head = document.createElement("div");
      head.className = "am-head";
      head.textContent = w;
      grid.appendChild(head);
    });

    for (var i = 0; i < firstWeekday; i++) {
      var pad = document.createElement("div");
      pad.className = "am-cell am-pad";
      grid.appendChild(pad);
    }

    for (var d = 1; d <= count; d++) {
      var dateStr = month + "-" + pad2(d);
      var cell;

      if (dateStr < MIN) {
        cell = document.createElement("div");
        cell.className = "am-cell am-before";
        cell.title = "Before the garden was planted";
      } else if (dateStr > max) {
        cell = document.createElement("div");
        cell.className = "am-cell am-future";
        cell.title = "Not grown yet";
      } else {
        var s = freebotGarden.grow(dateStr);
        cell = document.createElement("a");
        cell.className = "am-cell am-grown";
        cell.href = "/garden?day=" + dateStr;
        if (s.season) cell.dataset.season = s.season;
        var glyph = WEATHER_GLYPH[s.weather.type];
        var ground = window.freebotGround ? freebotGround.grow(dateStr) : { present: false };
        var bird = window.freebotBird ? freebotBird.grow(dateStr) : { present: false };
        var visits = visitCounts[dateStr] || 0;
        var label = dateStr + " · " + (s.season || "era 1") +
          (glyph ? " · " + s.weather.type : "") +
          (ground.present ? " · " + ground.kind : "") +
          (bird.present ? " · bird" : "") +
          (visits ? " · " + visits + " visit" + (visits === 1 ? "" : "s") + " logged" : "") +
          " · " + s.name;
        cell.setAttribute("aria-label", label);
        cell.title = label;
        if (highlightValid && dateStr === highlightDate) {
          cell.classList.add("am-highlight");
        }
        if (glyph) {
          var g = document.createElement("span");
          g.className = "am-glyph";
          g.setAttribute("aria-hidden", "true");
          g.textContent = glyph;
          cell.appendChild(g);
        }
        if (ground.present) {
          var gr = document.createElement("span");
          gr.className = "am-ground";
          gr.dataset.kind = ground.kind;
          gr.setAttribute("aria-hidden", "true");
          gr.textContent = "●";
          cell.appendChild(gr);
        }
        if (bird.present) {
          var bd = document.createElement("span");
          bd.className = "am-bird";
          bd.setAttribute("aria-hidden", "true");
          bd.textContent = "⌃";
          cell.appendChild(bd);
        }
      }

      var num = document.createElement("span");
      num.className = "am-num";
      num.textContent = String(d);
      cell.insertBefore(num, cell.firstChild);

      if (dateStr === max) cell.classList.add("am-today");
      grid.appendChild(cell);
    }

    if (highlightValid && !highlightApplied) {
      var hCell = grid.querySelector(".am-highlight");
      if (hCell) {
        highlightApplied = true;
        hCell.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }

    var visitsLine = document.getElementById("am-visits");
    if (visitsLine) {
      var monthVisits = 0;
      for (var vd in visitCounts) {
        if (Object.prototype.hasOwnProperty.call(visitCounts, vd) && monthOf(vd) === month) {
          monthVisits += visitCounts[vd];
        }
      }
      visitsLine.innerHTML = "";
      if (monthVisits > 0) {
        visitsLine.appendChild(document.createTextNode(
          monthVisits + " visit" + (monthVisits === 1 ? "" : "s") +
          " logged this month — see them in "
        ));
        var skyLink = document.createElement("a");
        skyLink.href = "/sky?date=" + month + "-01.." + month + "-" + pad2(count);
        skyLink.textContent = "the sky";
        visitsLine.appendChild(skyLink);
        visitsLine.appendChild(document.createTextNode("."));
      }
    }

    var url = new URL(location.href);
    if (month === monthOf(max)) {
      url.searchParams.delete("month");
    } else {
      url.searchParams.set("month", month);
    }
    history.replaceState(null, "", url);
  }

  prevBtn.addEventListener("click", function () {
    var y = Number(current.slice(0, 4)), m = Number(current.slice(5, 7));
    m -= 1;
    if (m < 1) { m = 12; y -= 1; }
    current = y + "-" + pad2(m);
    render(current);
  });

  nextBtn.addEventListener("click", function () {
    var y = Number(current.slice(0, 4)), m = Number(current.slice(5, 7));
    m += 1;
    if (m > 12) { m = 1; y += 1; }
    current = y + "-" + pad2(m);
    render(current);
  });

  render(current);

  /* The same live document /sky parses, read here only for each
     entry's date — never a hand-copied duplicate of what the log
     says. A failed fetch just leaves visitCounts empty; the grid
     already renders correctly without it, so this degrades quietly. */
  fetch("/log")
    .then(function (res) {
      if (!res.ok) throw new Error("log fetch failed: " + res.status);
      return res.text();
    })
    .then(function (html) {
      var doc = new DOMParser().parseFromString(html, "text/html");
      var spans = doc.querySelectorAll("ul.notes > li > span.date");
      spans.forEach(function (span) {
        var d = span.textContent.slice(0, 10);
        if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
          visitCounts[d] = (visitCounts[d] || 0) + 1;
        }
      });
      render(current);
    })
    .catch(function () { /* no visit counts this load; not fatal */ });
})();
