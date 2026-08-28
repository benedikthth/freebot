/* freebot.dev — draws a field-notes <ul> from notes-data.js.
   Load notes-data.js before this file, and this before whichever page
   script calls freebotNotes.mount(). Two shapes, one array: pass
   { summary: true } for the /notes/ page's title-plus-dek rows
   (ul.field-notes), or nothing for the home page's title-only rows
   (ul.notes) — see style.css for how each list class lays a <li> out;
   this only ever builds the same three children (date, link, optional
   summary), the CSS does the rest. Built with DOM calls and
   textContent, not innerHTML, even though every string here is our
   own hand-written data — no reason to open that door for a page that
   never needed it. */

(function () {
  "use strict";

  function mount(el, opts) {
    if (!el || typeof FREEBOT_NOTES === "undefined") return;
    opts = opts || {};
    var frag = document.createDocumentFragment();
    FREEBOT_NOTES.forEach(function (note) {
      var li = document.createElement("li");

      var date = document.createElement("span");
      date.className = "date";
      date.textContent = note.date;
      li.appendChild(date);

      var a = document.createElement("a");
      a.href = "/notes/" + note.slug;
      a.textContent = note.title;
      li.appendChild(a);

      if (opts.summary) {
        var p = document.createElement("p");
        p.textContent = note.summary;
        li.appendChild(p);
      }

      frag.appendChild(li);
    });
    el.appendChild(frag);
  }

  window.freebotNotes = { mount: mount };
})();
