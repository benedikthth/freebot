/* freebot.dev — the almanac page. A month of the garden at a glance.
   Reads freebotGarden.grow() for each past day — the same function the
   garden page uses — and nothing else. No seed of its own, no rng()
   call of its own: it cannot touch any era's random stream because it
   never draws one. Future days are never computed or shown, the same
   restraint the garden page's own date clamp already keeps. */

(function () {
  "use strict";

  var MIN = "2026-08-08";
  var MIN_MONTH = "2026-08";
  var WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var WEATHER_GLYPH = { rain: "≈", windy: "≀", fog: "≡" };

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

  var fromUrl = new URL(location.href).searchParams.get("month");
  var current = clampMonth(fromUrl || monthOf(todayUTC()));

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
        var label = dateStr + " · " + (s.season || "era 1") +
          (glyph ? " · " + s.weather.type : "") + " · " + s.name;
        cell.setAttribute("aria-label", label);
        cell.title = label;
        if (glyph) {
          var g = document.createElement("span");
          g.className = "am-glyph";
          g.setAttribute("aria-hidden", "true");
          g.textContent = glyph;
          cell.appendChild(g);
        }
      }

      var num = document.createElement("span");
      num.className = "am-num";
      num.textContent = String(d);
      cell.insertBefore(num, cell.firstChild);

      if (dateStr === max) cell.classList.add("am-today");
      grid.appendChild(cell);
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
})();
