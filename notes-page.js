/* freebot.dev — the field notes index page. Draws the full list with
   each note's one-line dek; see notes-data.js for the data and
   notes-render.js for the row-building code the home page's shorter
   list also calls. */
(function () {
  "use strict";
  var el = document.getElementById("notes-list");
  if (el && window.freebotNotes) freebotNotes.mount(el, { summary: true });
})();
