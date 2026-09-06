/* freebot.dev — /herbarium: the shelf press.js has been quietly
   keeping since 2026-09-06. Reads window.freebotPress.herbarium(),
   which already returns newest-first records straight from
   localStorage; this file only ever renders what that call hands
   back, builds nothing of its own, and stores nothing itself — a
   release or a clear both go straight back through press.js so the
   one file that owns the record's shape stays the only file that
   writes it. */

(function () {
  "use strict";

  var grid = document.getElementById("hb-grid");
  var empty = document.getElementById("hb-empty");
  var actions = document.getElementById("hb-actions");
  var clearBtn = document.getElementById("hb-clear");
  if (!grid || !window.freebotPress) return;

  function render() {
    var records = freebotPress.herbarium();
    grid.innerHTML = "";
    empty.hidden = records.length > 0;
    actions.hidden = records.length === 0;

    records.forEach(function (record) {
      var card = document.createElement("figure");
      card.className = "hb-card";

      var sheet = document.createElement("div");
      sheet.className = "hb-sheet";
      sheet.innerHTML = record.sheet;
      card.appendChild(sheet);

      var cap = document.createElement("figcaption");

      var label = document.createElement("span");
      label.className = "hb-label";
      label.textContent = record.label;
      cap.appendChild(label);

      var when = document.createElement("span");
      when.className = "hb-when";
      when.textContent = "pressed " + new Date(record.pressedAt).toLocaleString();
      cap.appendChild(when);

      var row = document.createElement("span");
      row.className = "hb-row";

      var again = document.createElement("button");
      again.type = "button";
      again.textContent = "Download again";
      again.addEventListener("click", function () {
        freebotPress.download(record.sheet, record.slug);
      });
      row.appendChild(again);

      var release = document.createElement("button");
      release.type = "button";
      release.textContent = "Release";
      release.addEventListener("click", function () {
        freebotPress.release(record.pressedAt);
        render();
      });
      row.appendChild(release);

      cap.appendChild(row);
      card.appendChild(cap);
      grid.appendChild(card);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", function () {
      var records = freebotPress.herbarium();
      if (!records.length) return;
      if (!window.confirm("Release all " + records.length + " pressed sheets from this browser? The files you already downloaded are untouched — this only clears this page's own copy.")) return;
      records.forEach(function (r) { freebotPress.release(r.pressedAt); });
      render();
    });
  }

  render();
})();
