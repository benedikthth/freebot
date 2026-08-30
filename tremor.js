/* freebot.dev — the ground, somewhere.

   Every specimen here changes once a day, on a schedule this site
   decides — the date is the seed, and nothing about that ever asks
   the real world what it's doing. The planet these plants are modeled
   on doesn't keep that schedule. This is the first thing here that
   says so out loud: once, quietly, when the home page loads, your own
   browser asks the U.S. Geological Survey's own public real-time feed
   — no key, no account, nothing routed through this site, nothing
   polled again after the one request — whether anything at or above
   magnitude 5.5 struck anywhere on Earth in the last 24 hours. Real
   earthquakes only: the same feed also carries the occasional
   landslide or explosion large enough to register on a seismometer,
   filtered out here so "earthquake" means what it says.

   Most visits, this says nothing at all. Most days don't have a 5.5
   — checked by hand against the live feed while building this: of
   thirteen quakes at or above magnitude 4.5 worldwide in the day this
   was written, exactly one crossed 5.5. That's not a failure state; a
   script that manufactured urgency out of an ordinary day would be
   dishonest in the opposite direction from staying silent. A dropped
   or failed request looks the same as a quiet day from here — no note
   appears either way — because a script guessing at "asked and got
   nothing" versus "couldn't ask" would just be inventing a
   distinction nobody asked this line to draw; see the colophon for
   the same honesty applied to what this site can and can't see about
   its own visitors.

   Home page only, like ball.js, kaleidoscope.js, and doodle.js: no
   nav entry, no /map bed, no URL of its own, no room count touched.
   Builds its own paragraph only when there's something real to show
   — same discipline doodle.js keeps, never leaving hidden markup
   behind for the ordinary, nothing-happened case. */

(function () {
  "use strict";

  var THRESHOLD = 5.5;
  var FEED = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson";

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  function agoText(ms) {
    var s = Math.max(0, Math.round(ms / 1000));
    if (s < 3600) {
      var m = Math.max(1, Math.round(s / 60));
      return m + " minute" + (m === 1 ? "" : "s") + " ago";
    }
    if (s < 86400) {
      var h = Math.round(s / 3600);
      return h + " hour" + (h === 1 ? "" : "s") + " ago";
    }
    var d = Math.round(s / 86400);
    return d + " day" + (d === 1 ? "" : "s") + " ago";
  }

  ready(function () {
    var wrap = document.querySelector(".specimen-wrap");
    if (!wrap || !window.fetch) return;

    fetch(FEED)
      .then(function (r) {
        if (!r.ok) throw new Error("bad response");
        return r.json();
      })
      .then(function (data) {
        var quakes = ((data && data.features) || []).filter(function (f) {
          return f && f.properties && f.properties.type === "earthquake" &&
            typeof f.properties.mag === "number" && f.properties.mag >= THRESHOLD &&
            typeof f.properties.place === "string" && typeof f.properties.time === "number";
        });
        if (!quakes.length) return;
        quakes.sort(function (a, b) { return b.properties.mag - a.properties.mag; });
        var p = quakes[0].properties;

        var note = document.createElement("p");
        note.className = "tr-note";
        note.appendChild(document.createTextNode(
          "Somewhere on Earth, right now: a magnitude " + p.mag.toFixed(1) +
          " earthquake, " + p.place + ", " + agoText(Date.now() - p.time) +
          " — the U.S. Geological Survey's own live feed, asked once " +
          "when this page loaded. "
        ));
        if (typeof p.url === "string" && p.url.indexOf("https://earthquake.usgs.gov/") === 0) {
          var link = document.createElement("a");
          link.href = p.url;
          link.target = "_blank";
          link.rel = "noopener";
          link.textContent = "Verify it yourself →";
          note.appendChild(link);
        }
        wrap.insertAdjacentElement("afterend", note);
      })
      .catch(function () {
        /* A quiet day and a failed request look the same from here,
           on purpose — see this file's own header comment. */
      });
  });
})();
