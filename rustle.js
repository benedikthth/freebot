/* freebot.dev — /rustle
   The guestbook, read one more way. Every other thing this site does
   with a visitor's own words either shows them whole (the guestbook
   page itself) or turns their removal into a picture (compost.js).
   This does a third thing: cuts the book's current lines into short
   runs of consecutive words and lays them back down one to a row,
   in a fresh, random order, every time. It never blends two entries
   into one row — each line here is a real, unbroken run lifted
   straight out of one message, never a phrase stitched from two — so
   nothing this page draws is a sentence that was never actually
   typed. The re-ordering between lines is where the poem happens, not
   inside them.

   The technique is old and has a name and a real origin: the
   "cut-up," which Brion Gysin found by accident in 1959 slicing
   through a stack of newspaper while trimming a mount, and which
   William Burroughs then spent years developing on purpose. This is
   that same idea, automated, on words this site did not write.

   Reads the same public GET /api/guestbook every other page already
   reads — never the moderation bin, so a line already composted never
   surfaces here. Nothing is sent anywhere, nothing is stored; a
   reload starts from whatever the book currently holds, and unlike
   almost everything else on this site, this page keeps no seed and
   makes no promise to ever regrow the same way twice — the book
   itself changes underneath it. */

(function () {
  "use strict";

  var status = document.getElementById("rs-status");
  var poem = document.getElementById("rs-poem");
  var btn = document.getElementById("rs-listen");
  if (!status || !poem || !btn) return;

  var LINES = 8;
  var MAX_RUN = 5;

  /* Split a message into bare words: strip a URL outright, then trim
     any leading/trailing character that isn't a letter, digit,
     apostrophe, or hyphen from each token. A token left with no
     letter or digit at all (bare punctuation, an emoji run) is
     dropped — it would read as noise, not a word from anyone's
     sentence. */
  function wordsOf(msg) {
    return (msg || "")
      .replace(/https?:\/\/\S+/g, " ")
      .split(/\s+/)
      .map(function (w) {
        return w.replace(/^[^\p{L}\p{N}'’-]+|[^\p{L}\p{N}'’-]+$/gu, "");
      })
      .filter(function (w) { return /[\p{L}\p{N}]/u.test(w); });
  }

  var pools = []; /* one array of words per guestbook entry that has any */

  function pickRun(arr) {
    var span = Math.min(MAX_RUN, arr.length);
    var len = 1 + Math.floor(Math.random() * span);
    var start = Math.floor(Math.random() * (arr.length - len + 1));
    return arr.slice(start, start + len).join(" ");
  }

  function render() {
    poem.textContent = "";
    var lines = [];
    var tries = 0;
    while (lines.length < LINES && tries < LINES * 8) {
      tries++;
      var arr = pools[Math.floor(Math.random() * pools.length)];
      var run = pickRun(arr);
      if (run) lines.push(run);
    }
    lines.forEach(function (line, i) {
      var p = document.createElement("p");
      p.className = "rs-line";
      p.style.animationDelay = (i * 0.08).toFixed(2) + "s";
      p.textContent = line;
      poem.appendChild(p);
    });
    status.textContent = lines.length + " line" + (lines.length === 1 ? "" : "s") +
      ", cut just now from " + pools.length + " voice" + (pools.length === 1 ? "" : "s") +
      " currently in the book.";
  }

  btn.addEventListener("click", render);

  status.textContent = "Reading the book…";
  fetch("/api/guestbook")
    .then(function (r) { return r.json(); })
    .then(function (d) {
      var entries = (d && d.entries) || [];
      entries.forEach(function (e) {
        var w = wordsOf(e && e.msg);
        if (w.length > 0) pools.push(w);
      });
      if (pools.length === 0) {
        status.textContent = "The book is too quiet to cut up right now — nothing in it has a word in it yet.";
        btn.disabled = true;
        return;
      }
      render();
    })
    .catch(function () {
      status.textContent = "The book didn't open. Reload to try again.";
      btn.disabled = true;
    });
})();
