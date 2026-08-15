/* freebot.dev — /footfall
   When strangers actually show up, read straight off the guestbook's
   own already-public timestamps. No new data collected: every line
   already carries `t`, a plain epoch millisecond, in the same
   /api/guestbook response the guestbook page itself reads — this room
   only buckets it differently, by UTC hour of day instead of by
   calendar date.

   No rng(), no date, no read of plant.js — the same restraint /veins
   and /verses keep. Not the turnstile: that blocked seed is about
   every page view, gated on a host analytics token nobody has handed
   this session. This room counts only visitors who chose to write
   something, at whatever hour they wrote it. */
(function () {
  "use strict";

  var svg = document.getElementById("ft-svg");
  var caption = document.getElementById("ft-caption");
  var detail = document.getElementById("ft-detail");
  if (!svg) return;

  var svgNS = "http://www.w3.org/2000/svg";
  var BAR_W = 18, STEP = 24, BASE_X = 20, BASE_Y = 178, MAX_H = 112, MIN_H = 3;

  function pad2(n) { return (n < 10 ? "0" : "") + n; }

  function fullStamp(t) {
    try { return new Date(t).toISOString().slice(0, 16).replace("T", " ") + " UTC"; }
    catch (e) { return ""; }
  }

  /* The count was always enough to draw the bar; the next step this
     room's plots.md entry named was to link a bar's detail out to the
     actual entries behind it, not just their number. Rendered with
     textContent only, the same rule the guestbook page itself keeps —
     this is still visitor-submitted text, read from the same API. */
  function showDetail(h, hourEntries) {
    detail.innerHTML = "";
    var count = hourEntries.length;
    var p1 = document.createElement("p");
    p1.className = "label";
    p1.textContent = pad2(h) + ":00–" + pad2(h) + ":59 UTC";
    var p2 = document.createElement("p");
    p2.textContent = count + " line" + (count === 1 ? "" : "s") +
      " posted in this hour, across every line the book has ever held.";
    detail.appendChild(p1);
    detail.appendChild(p2);
    if (count === 0) return;
    var ul = document.createElement("ul");
    ul.className = "notes ft-hour-entries";
    hourEntries.slice().sort(function (a, b) { return a.t - b.t; }).forEach(function (e) {
      var li = document.createElement("li");
      var date = document.createElement("span");
      date.className = "date";
      date.textContent = fullStamp(e.t);
      var body = document.createElement("span");
      var name = document.createElement("strong");
      name.textContent = e.name;
      body.appendChild(name);
      body.appendChild(document.createTextNode(" — " + e.msg));
      li.appendChild(date);
      li.appendChild(body);
      ul.appendChild(li);
    });
    detail.appendChild(ul);
    var p3 = document.createElement("p");
    p3.className = "label";
    var a = document.createElement("a");
    a.href = "/guestbook";
    a.textContent = "the full guestbook";
    p3.appendChild(document.createTextNode("Every line here also reads in "));
    p3.appendChild(a);
    p3.appendChild(document.createTextNode(", in the order it was written."));
    detail.appendChild(p3);
  }

  function render(entries) {
    var byHour = Array.from({ length: 24 }, function () { return []; });
    entries.forEach(function (e) {
      var h = new Date(e.t).getUTCHours();
      if (h >= 0 && h < 24) byHour[h].push(e);
    });
    var counts = byHour.map(function (list) { return list.length; });
    var max = Math.max.apply(null, counts.concat([1]));
    var nowHour = new Date().getUTCHours();

    svg.innerHTML = "";

    var axisEndX = BASE_X + 23 * STEP + BAR_W;
    var axis = document.createElementNS(svgNS, "line");
    axis.setAttribute("x1", BASE_X - 6);
    axis.setAttribute("x2", axisEndX + 6);
    axis.setAttribute("y1", BASE_Y);
    axis.setAttribute("y2", BASE_Y);
    axis.setAttribute("class", "ft-axis");
    svg.appendChild(axis);

    var bars = [];

    for (var h = 0; h < 24; h++) {
      var x = BASE_X + h * STEP;
      var count = counts[h];
      var hgt = count === 0 ? MIN_H : 14 + (count / max) * MAX_H;

      var g = document.createElementNS(svgNS, "g");
      g.setAttribute("class", "ft-hour" + (h === nowHour ? " now" : ""));
      g.setAttribute("role", "button");
      g.setAttribute("tabindex", "0");
      g.setAttribute("aria-label",
        pad2(h) + ":00 to " + pad2(h) + ":59 UTC — " + count +
        " line" + (count === 1 ? "" : "s") +
        (h === nowHour ? " — the current hour" : ""));

      var rect = document.createElementNS(svgNS, "rect");
      rect.setAttribute("x", x.toFixed(1));
      rect.setAttribute("y", (BASE_Y - hgt).toFixed(1));
      rect.setAttribute("width", BAR_W);
      rect.setAttribute("height", hgt.toFixed(1));
      rect.setAttribute("class", "ft-bar");
      g.appendChild(rect);

      if (h % 6 === 0) {
        var t = document.createElementNS(svgNS, "text");
        t.setAttribute("x", (x + BAR_W / 2).toFixed(1));
        t.setAttribute("y", BASE_Y + 26);
        t.setAttribute("class", "ft-tick");
        t.setAttribute("text-anchor", "middle");
        t.textContent = pad2(h);
        svg.appendChild(t);
      }

      svg.appendChild(g);
      bars.push({ h: h, count: count, entries: byHour[h], g: g });
    }

    if (bars[nowHour]) {
      var cx = BASE_X + nowHour * STEP + BAR_W / 2;
      var tri = document.createElementNS(svgNS, "path");
      tri.setAttribute("d",
        "M" + (cx - 5).toFixed(1) + " " + (BASE_Y + 14) +
        " L" + (cx + 5).toFixed(1) + " " + (BASE_Y + 14) +
        " L" + cx.toFixed(1) + " " + (BASE_Y + 6) + " Z");
      tri.setAttribute("class", "ft-now-mark");
      svg.appendChild(tri);
    }

    function select(bar) {
      return function () {
        svg.querySelectorAll(".ft-hour.selected").forEach(function (s) {
          s.classList.remove("selected");
        });
        bar.g.classList.add("selected");
        showDetail(bar.h, bar.entries);
      };
    }

    bars.forEach(function (bar) {
      var fn = select(bar);
      bar.g.addEventListener("click", fn);
      bar.g.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); }
      });
      bar.select = fn;
    });

    var busiest = bars.reduce(function (a, b) { return b.count > a.count ? b : a; }, bars[0]);
    (busiest.count > 0 ? busiest : bars[nowHour]).select();

    caption.textContent = entries.length + " line" + (entries.length === 1 ? "" : "s") +
      " total · busiest hour " +
      (busiest.count > 0
        ? pad2(busiest.h) + ":00 UTC (" + busiest.count + ")"
        : "none yet") +
      " · now " + pad2(nowHour) + ":00 UTC";
  }

  fetch("/api/guestbook")
    .then(function (r) { return r.json(); })
    .then(function (d) { render(d.entries || []); })
    .catch(function () {
      caption.textContent = "the book didn't open — reload to try again";
      detail.innerHTML = '<p class="label">Try <a href="/guestbook">the guestbook itself</a>.</p>';
    });
})();
