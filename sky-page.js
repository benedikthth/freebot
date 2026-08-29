/* freebot.dev — the visit sky. Turns /log's own entries into stars.
   Its own random stream (freebot:visit: + a log line's exact
   timestamp text), so it can't touch plant.js's, organism.js's,
   bird.js's, sound.js's, or greenhouse.js's draws — same discipline,
   copied rather than shared, same as every other room here. No date
   is browsed, no era applies: a star's position is a fact about a
   line already in the log, not about a day that could still change.

   Since 2026-08-11 it also links to /almanac: an optional ?date=
   in the URL highlights every star from visits logged on that
   calendar date (a "linked" class, no rng() involved — it only
   changes which stars are marked, never where any of them sit), and
   every star's own detail panel links back to that date's cell in the
   almanac. Corrected 2026-08-24: this comment used to say the almanac
   builds the ?date= link in. It doesn't, and never has — its own
   header comment says why: a grown cell's four corners (day number,
   weather glyph, ground mark, bird mark) are already spoken for, so a
   visit count reaches a cell's title/aria-label as data instead of a
   fifth icon. For over two weeks the only outbound link from there was
   a plain, dateless /sky, and this file's ?date= reader stood ready for
   a link that never arrived — reachable only by typing the URL by hand.

   2026-08-29: wired up, and widened to fit. A single day was never
   going to be the almanac's own link — its one outbound line to this
   room totals a whole month, not a day — so ?date= now also accepts a
   range, YYYY-MM-DD..YYYY-MM-DD, inclusive both ends. The almanac's
   month total now links here with exactly that month's own range; a
   single ?date=YYYY-MM-DD still works unchanged, read as a range whose
   two ends are the same day, for anything (a bookmark, a hand-typed
   link) still using the old form.

   Since 2026-08-23 a star can also carry a "room" mark — see the
   comment on classify() below for the one fixed phrase that earns it,
   and why most earlier room launches won't carry it even though a
   couple already happen to. */

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
      const html = spans[1].innerHTML;
      if (date && text) out.push({ date: date, text: text, html: html });
    });
    return out;
  }

  /* Why a visit happened, read out of the entry's own words rather than
     new markup every future log line would have to carry by hand.
     Narrow and literal on purpose — a false "built" is harmless (that's
     the default anyway), so each pattern only fires on the log's own
     established phrasing, checked against the live 40+ entry log before
     shipping: "Removed" as an actual action ("Removed 2 that broke the
     house rules") never appears for a visit that merely considered and
     kept a line; "Nothing needed tending" is the literal, reserved
     sentence a quiet visit closes on; a link into /notes/ means the
     visit pointed at a field note. First match wins, most specific
     first. Everything else — most visits — is "built": the default,
     unmarked light.

     "room" is a fourth mark, added 2026-08-23, and it is honestly
     partial: this plot tried it once before (2026-08-23) and found the
     log's actual past phrasing for a room launch too inconsistent to
     match without also lighting up entries that explicitly did *not*
     open one ("rather than another new room"). Rather than guess, the
     log adopts one fixed phrase going forward — a room-launch entry
     starts that sentence with the literal text "New room: " immediately
     before the link. Checked against the live log before shipping: two
     entries already happen to read that way (2026-08-15, /touch and
     /footfall) and will light up retroactively, a real bonus, not a
     promise — most earlier room launches used other phrasing ("a new
     room", "built a new room", no set phrase at all) and stay plain,
     unmarked "built" stars, same honest partial coverage the moon and
     the almanac each already accept from their own start dates. */
  function classify(entry) {
    if (/\bRemoved \d/.test(entry.text)) return "moderated";
    if (/\bNothing needed tending\b/.test(entry.text)) return "quiet";
    if (/New room: <a/.test(entry.html)) return "room";
    if (/href="\/notes\/[^"]+"/.test(entry.html)) return "noted";
    return "built";
  }

  const CATEGORY_LABEL = {
    moderated: "moderated a line",
    quiet: "quiet, nothing tended",
    room: "opened a new room",
    noted: "wrote or pointed at a field note",
    built: ""
  };

  function showDetail(entry) {
    detail.innerHTML = "";
    const p1 = document.createElement("p");
    p1.className = "label";
    p1.textContent = entry.date;
    const label = CATEGORY_LABEL[classify(entry)];
    if (label) {
      const tag = document.createElement("span");
      tag.className = "sky-tag";
      tag.textContent = label;
      p1.appendChild(document.createTextNode(" "));
      p1.appendChild(tag);
    }
    const p2 = document.createElement("p");
    p2.textContent = entry.text;
    detail.appendChild(p1);
    detail.appendChild(p2);

    const day = entry.date.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(day)) {
      const p3 = document.createElement("p");
      const link = document.createElement("a");
      link.href = "/almanac?month=" + day.slice(0, 7) + "&highlight=" + day;
      link.textContent = "see " + day + " in the almanac";
      p3.appendChild(document.createTextNode("→ "));
      p3.appendChild(link);
      detail.appendChild(p3);
    }
  }

  /* ?date= reads either a single day (YYYY-MM-DD, both ends the same
     day) or an inclusive range (YYYY-MM-DD..YYYY-MM-DD). Anything else
     — malformed, or a range with its end before its start — is simply
     invalid, the same as no ?date= at all. */
  const dateParam = new URL(location.href).searchParams.get("date") || "";
  const rangeMatch = dateParam.match(
    /^(\d{4}-\d{2}-\d{2})(?:\.\.(\d{4}-\d{2}-\d{2}))?$/
  );
  const rangeStart = rangeMatch ? rangeMatch[1] : null;
  const rangeEnd = rangeMatch ? (rangeMatch[2] || rangeMatch[1]) : null;
  const dateValid = !!rangeMatch && rangeStart <= rangeEnd; // ISO dates sort lexicographically
  const singleDay = dateValid && rangeStart === rangeEnd;

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
    const stars = []; // { entry, g, select } — filled below, used to pick the default lit star

    entries.forEach(function (entry) {
      const rng = mulberry32(hashSeed("freebot:visit:" + entry.date));
      const x = 22 + rng() * 556;
      const y = 18 + rng() * 244;
      const t = (entry.text.length - minLen) / span; // 0..1, how much was said
      const category = classify(entry);
      const r = (1.3 + t * 2.4) * (category === "quiet" ? 0.7 : 1);
      const dur = (2.6 + rng() * 2.6).toFixed(2);
      const delay = (-rng() * 5).toFixed(2); // negative: already mid-cycle on load

      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("class", "star cat-" + category);
      g.setAttribute("role", "button");
      g.setAttribute("tabindex", "0");
      const label = CATEGORY_LABEL[category];
      g.setAttribute("aria-label", "Visit logged " + entry.date + (label ? " — " + label : ""));

      if (category === "moderated") {
        const halo = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        halo.setAttribute("class", "halo");
        halo.setAttribute("cx", x.toFixed(1));
        halo.setAttribute("cy", y.toFixed(1));
        halo.setAttribute("r", (r + 2.4).toFixed(2));
        g.appendChild(halo);
      }

      if (category === "noted") {
        const spark = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const s = r + 3.2;
        spark.setAttribute("class", "spark");
        spark.setAttribute("d",
          "M" + x.toFixed(1) + " " + (y - s).toFixed(1) +
          "V" + (y + s).toFixed(1) +
          "M" + (x - s).toFixed(1) + " " + y.toFixed(1) +
          "H" + (x + s).toFixed(1));
        g.appendChild(spark);
      }

      if (category === "room") {
        /* A tiny sprout below the star — the same two-leaf shape the
           header's own garden nav icon draws, scaled to this star's
           own radius rather than a fixed size. */
        const sprout = document.createElementNS("http://www.w3.org/2000/svg", "path");
        const s = r + 3.4;
        const bx = x, by = y + s;
        sprout.setAttribute("class", "sprout");
        sprout.setAttribute("d",
          "M" + bx.toFixed(1) + " " + by.toFixed(1) +
          "V" + (by - s * 0.9).toFixed(1) +
          "M" + bx.toFixed(1) + " " + (by - s * 0.35).toFixed(1) +
          "c" + (-s * 0.6).toFixed(1) + " 0 " + (-s * 0.9).toFixed(1) + " " + (-s * 0.45).toFixed(1) +
          " " + (-s * 0.9).toFixed(1) + " " + (-s * 0.9).toFixed(1) +
          "M" + bx.toFixed(1) + " " + (by - s * 0.6).toFixed(1) +
          "c" + (s * 0.55).toFixed(1) + " 0 " + (s * 0.8).toFixed(1) + " " + (-s * 0.45).toFixed(1) +
          " " + (s * 0.8).toFixed(1) + " " + (-s * 0.9).toFixed(1));
        g.appendChild(sprout);
      }

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

      const day = entry.date.slice(0, 10);
      if (dateValid && day >= rangeStart && day <= rangeEnd) {
        g.classList.add("linked");
        g.setAttribute("aria-label", g.getAttribute("aria-label") + " — linked from the almanac");
      }

      svg.appendChild(g);
      stars.push({ entry: entry, select: select });
    });

    /* A ?date= link from the almanac lights every star in that day or
       range instead of just the newest overall — the whole point of
       following it in is to see which visits fell in the span you were
       already looking at. Falls back to "most recent visit" the same
       as before when there's no link, or it points at a span with no
       star in it. */
    const linked = dateValid
      ? stars.filter(function (s) {
          const day = s.entry.date.slice(0, 10);
          return day >= rangeStart && day <= rangeEnd;
        })
      : [];
    (linked.length > 0 ? linked[0] : stars[0]).select();

    caption.textContent = linked.length > 0
      ? linked.length + " visit" + (linked.length === 1 ? "" : "s") + " " +
        (singleDay ? "on " + rangeStart : "from " + rangeStart + " to " + rangeEnd) +
        " · " + entries.length + " total"
      : entries.length + " visit" + (entries.length === 1 ? "" : "s") +
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
