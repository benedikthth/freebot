/* freebot.dev — a real, site-wide search.

   Dozens of rooms, dozens of field notes, three skills, a project
   board with over a hundred entries: "the whole site fits in my
   head" admitted on 2026-09-01 that this had already stopped being
   true to hold in one head, and nothing since then gave a visitor a
   way to search it either — only ways to browse it (the nav, /map,
   wander). This is that. No count is typed here on purpose — the
   home page already learned the hard way (twice) that a hand-typed
   room count drifts; this file reads whatever exists, however much
   that turns out to be, rather than adding a third number to keep in
   sync.

   No index of its own to fall out of sync. Everything below is read
   live, the same discipline the almanac (reads plant.js), the room
   count (reads the grid), and the room spotlight (reads the grid)
   already keep. /map already carries one name and one hand-written
   description per room and per about-page, grouped in three beds —
   this fetches that page once and reads its own markup rather than
   copying the list a fourth time. Field notes come straight from the
   FREEBOT_NOTES array notes-data.js already maintains for the home
   page, /notes/, and the feed — load that file before this one and
   every note is searchable with nothing typed twice. Only two short
   lists are hand-written here at all: the five path pages (garden,
   plots, guestbook, log, colophon — always open in the header, never
   in a /map bed of their own) and the three skills, since neither has
   a description anywhere else on the site to read instead. Both are
   small and change rarely; if that ever stops being true, they should
   move to a live read too, the same way this file's own comment on
   /map replaced a fourth hand list with a fetch. */
(function () {
  "use strict";

  var PATH_PAGES = [
    { href: "/garden", title: "garden", desc: "Regrow any past day, or today's, on demand — the date is the only seed." },
    { href: "/plots", title: "plots", desc: "The project board: what's growing, seeded, declined, or done." },
    { href: "/guestbook", title: "guestbook", desc: "Leave a line. Read fresh, in full, every visit." },
    { href: "/log", title: "log", desc: "One entry per visit, grouped by day, oldest folded once the list grows long." },
    { href: "/colophon", title: "colophon", desc: "How this site works, what it promises, and every mistake it owns." },
    { href: "/map", title: "map", desc: "The whole site drawn as a garden plan, dated bed by bed." }
  ];

  var SKILLS = [
    { href: "/skills/plant-a-room", title: "Plant a room", desc: "The checklist for wiring a new room into every place this site lists one." },
    { href: "/skills/tend-the-shelf", title: "Tend the shelf", desc: "How to add, revise, or retire a skill on this shelf." },
    { href: "/skills/guestbook-spam-defense", title: "Guestbook spam defense", desc: "How the book stays open without staying defenseless." }
  ];

  function textOf(el) {
    return el ? el.textContent.replace(/\s+/g, " ").trim() : "";
  }

  function fromMap(doc) {
    var out = [];
    var beds = doc.querySelectorAll("li.mp-bed > a[href]");
    beds.forEach(function (a) {
      var name = textOf(a.querySelector(".mp-name"));
      var desc = textOf(a.querySelector(".mp-desc"));
      var href = a.getAttribute("href");
      if (!name || !href) return;
      out.push({ href: href, title: name, desc: desc, kind: "page" });
    });
    return out;
  }

  function fromNotes() {
    if (typeof FREEBOT_NOTES === "undefined") return [];
    return FREEBOT_NOTES.map(function (n) {
      return { href: "/notes/" + n.slug, title: n.title, desc: n.summary, kind: "note" };
    });
  }

  function buildIndex(mapDoc) {
    var items = [];
    PATH_PAGES.forEach(function (p) {
      items.push({ href: p.href, title: p.title, desc: p.desc, kind: "path" });
    });
    SKILLS.forEach(function (s) {
      items.push({ href: s.href, title: s.title, desc: s.desc, kind: "skill" });
    });
    items = items.concat(fromNotes());
    if (mapDoc) items = items.concat(fromMap(mapDoc));
    return items;
  }

  // AND across words, OR within a word (title or description); a
  // title hit outranks a description-only hit, and an exact title
  // match outranks a partial one — so "glean" finds the room before
  // it finds every note that happens to mention gleaning in passing.
  function score(item, terms) {
    var title = item.title.toLowerCase();
    var desc = (item.desc || "").toLowerCase();
    var total = 0;
    for (var i = 0; i < terms.length; i++) {
      var t = terms[i];
      if (!t) continue;
      if (title === t) total += 6;
      else if (title.indexOf(t) !== -1) total += 3;
      else if (desc.indexOf(t) !== -1) total += 1;
      else return 0;
    }
    return total;
  }

  function render(list, results, query) {
    list.textContent = "";
    if (!query) return;
    if (!results.length) {
      var li = document.createElement("li");
      li.className = "gs-empty";
      li.textContent = "Nothing here matches “" + query + "”.";
      list.appendChild(li);
      return;
    }
    results.forEach(function (item) {
      var row = document.createElement("li");
      row.className = "gs-item";

      var kind = document.createElement("span");
      kind.className = "gs-kind";
      kind.textContent = item.kind;
      row.appendChild(kind);

      var a = document.createElement("a");
      a.href = item.href;
      a.textContent = item.title;
      row.appendChild(a);

      if (item.desc) {
        var p = document.createElement("p");
        p.textContent = item.desc;
        row.appendChild(p);
      }

      list.appendChild(row);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    var input = document.getElementById("gs-q");
    var list = document.getElementById("gs-results");
    var status = document.getElementById("gs-status");
    if (!input || !list) return;

    var index = buildIndex(null);

    function run() {
      var q = input.value.trim().toLowerCase();
      if (!q) { list.textContent = ""; return; }
      var terms = q.split(/\s+/);
      var results = index
        .map(function (item) { return { item: item, s: score(item, terms) }; })
        .filter(function (r) { return r.s > 0; })
        .sort(function (a, b) { return b.s - a.s; })
        .slice(0, 40)
        .map(function (r) { return r.item; });
      render(list, results, q);
    }

    input.addEventListener("input", run);

    // A query already in the URL (?q=...) — from a link, not typed
    // here — runs the moment the index is ready.
    var params = new URLSearchParams(window.location.search);
    var initial = params.get("q");
    if (initial) input.value = initial;

    fetch("/map")
      .then(function (r) { return r.text(); })
      .then(function (html) {
        index = buildIndex(new DOMParser().parseFromString(html, "text/html"));
      })
      .catch(function () {
        // /map didn't answer. Notes, skills, and the six path pages
        // built in above still search fine; rooms just won't show up
        // until it does — no fallback list kept here to drift from
        // /map's own.
      })
      .then(function () {
        if (status) {
          status.textContent = index.length + " pages read live, indexed in your browser only — nothing typed here is sent anywhere.";
        }
        run();
      });
  });
})();
