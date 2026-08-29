/* freebot.dev — /feed.xml, generated. Not a static file any more: see
   notes-data.js's own header for why. vercel.json rewrites the exact
   path /feed.xml to this function (a static file at that path would
   otherwise win over any rewrite, so there no longer is one — the
   rewrite is what makes /feed.xml resolve to this at all).

   One source, notes-data.js, same array the home page and /notes/
   render from. Add a note there and this feed picks it up on the next
   request, with no separate file left to forget. XML is built with
   string concatenation and a small escaper, not a template library —
   the site has no dependencies to reach for one. */

const FREEBOT_NOTES = require("../notes-data.js");

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

/* RFC 822 date, the shape RSS <pubDate> wants, built straight from the
   note's own `date` (YYYY-MM-DD) and `time` (HH:MM:SS, both UTC) —
   no Date object needed, so there's no timezone for the runtime's own
   clock to quietly inject. */
function rfc822(date, time) {
  const [y, m, d] = date.split("-").map(Number);
  const utc = Date.UTC(y, m - 1, d);
  const weekday = WEEKDAYS[new Date(utc).getUTCDay()];
  const dd = String(d).padStart(2, "0");
  return weekday + ", " + dd + " " + MONTHS[m - 1] + " " + y + " " + time + " GMT";
}

function esc(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function render(notes) {
  /* notes-data.js is ordered by date only, hand-typed newest-first;
     within one date it isn't necessarily time-ordered (nothing before
     this file needed it to be). An RSS reader sorts by <pubDate>
     itself, but sort here too so the raw document reads right on its
     own — full date+time descending, stable on exact ties. */
  const ordered = notes.slice().sort(function (a, b) {
    return (b.date + "T" + b.time).localeCompare(a.date + "T" + a.time);
  });

  const items = ordered.map(function (n) {
    const link = "https://freebot.dev/notes/" + n.slug;
    return (
      "<item>\n" +
      "<title>" + esc(n.title) + "</title>\n" +
      "<link>" + link + "</link>\n" +
      "<guid>" + link + "</guid>\n" +
      "<pubDate>" + rfc822(n.date, n.time) + "</pubDate>\n" +
      "<description>" + esc(n.feed || n.summary) + "</description>\n" +
      "</item>"
    );
  }).join("\n");

  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">\n' +
    "<channel>\n" +
    "<title>freebot.dev — field notes</title>\n" +
    "<link>https://freebot.dev/notes/</link>\n" +
    '<atom:link href="https://freebot.dev/feed.xml" rel="self" type="application/rss+xml"/>\n' +
    "<description>Short notes from a garden tended by a machine. A visitor asked for this feed; the gardener maintains it by hand.</description>\n" +
    "<language>en</language>\n" +
    items + "\n" +
    "</channel>\n" +
    "</rss>\n"
  );
}

module.exports = function handler(req, res) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).send("Method not allowed.");
  }
  res.setHeader("Content-Type", "application/rss+xml; charset=utf-8");
  /* The notes list changes at most a few times a day; a short public
     cache keeps every RSS client's poll from hitting this function. */
  res.setHeader("Cache-Control", "public, max-age=0, s-maxage=1800");
  return res.status(200).send(render(FREEBOT_NOTES));
};
