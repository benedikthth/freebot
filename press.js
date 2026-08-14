/* freebot.dev — pressing a specimen into a herbarium sheet. Shared by
   the garden, greenhouse, and home pages: whatever grew the plant on
   screen, the sheet itself is built the same way, from that plant's
   own SVG markup — never a screenshot, never a re-roll. See
   /notes/no-one-picks-the-flowers.

   A garden specimen carries a date and an era; a greenhouse one
   carries a word, or a rootstock and a scion; neither shape belongs
   in this file. A caller hands in a small, already-worded descriptor
   instead —
     { svg, label, meta, traits, provenance, slug, freezeNote }
   — and this file only lays out the sheet and drives the download.
   No rng() of its own, so pressing a specimen cannot touch any era.
   freezeNote is optional and, unlike the other fields, may be null:
   a short line disclosing how a nyctinastic or heliotropic bloom
   actually stood at the moment of pressing, since this sheet has no
   stylesheet to fold or lean it — see sun.js's own describe(). Only
   the garden and home pages ever pass one; the greenhouse's specimens
   are never nyctinastic or heliotropic (no date, no real clock-
   relative weather) so they never have one to disclose. */
(function () {
  "use strict";

  function escapeXml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function buildSheet(d) {
    var W = 450, PLANT_H = 500;
    /* The freeze-state disclosure (see sun.js's describe()) is the
       one line here that doesn't always print — most specimens are
       neither nyctinastic nor heliotropic, and even one that is may
       have pressed in a state the paper's fixed default already
       matches. Only claim the extra 24px of paper when there's
       actually a fifth line to put on it. */
    var LABEL_H = d.freezeNote ? 156 : 132, TOTAL_H = PLANT_H + LABEL_H;
    var paper = "#f6f0e0", ink = "#26332b", faded = "#5d6b60";
    var line = "#c9c0a4", tape = "rgba(166, 138, 90, 0.4)";
    var inner = d.svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");

    /* Paper, ink, and tape are fixed colors, not the page's own
       --card/--paper theme tokens: a pressed specimen is paper, not a
       UI surface, and should look the same lifted out of a dark-mode
       session as a light-mode one. No <canvas>, nothing rasterized —
       the file stays exactly as inspectable as the site's own promise
       about itself, and it carries no animation or live weather CSS,
       so a rainy or foggy day presses as clear-eyed as a calm one. */
    return (
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-15 0 ' + W + ' ' + TOTAL_H +
      '" font-family="Georgia, \'Times New Roman\', serif" role="img" aria-label="Pressed specimen ' +
      escapeXml(d.label) + '">' +
      '<rect x="-15" y="0" width="' + W + '" height="' + TOTAL_H + '" fill="' + paper + '"/>' +
      '<rect x="-13.5" y="1.5" width="' + (W - 3) + '" height="' + (TOTAL_H - 3) + '" fill="none" stroke="' + line + '" stroke-width="1.5"/>' +
      '<rect x="35" y="-7" width="72" height="20" fill="' + tape + '" transform="rotate(-3 71 3)"/>' +
      '<rect x="' + (W - 107) + '" y="-7" width="72" height="20" fill="' + tape + '" transform="rotate(2.5 ' + (W - 71) + ' 3)"/>' +
      inner +
      '<line x1="4" y1="' + (PLANT_H + 12) + '" x2="' + (W - 34) + '" y2="' + (PLANT_H + 12) + '" stroke="' + line + '" stroke-width="1" stroke-dasharray="2,4"/>' +
      '<text x="4" y="' + (PLANT_H + 40) + '" font-style="italic" font-size="18" fill="' + ink + '">' + escapeXml(d.label) + '</text>' +
      '<text x="4" y="' + (PLANT_H + 62) + '" font-family="\'IBM Plex Mono\', ui-monospace, monospace" font-size="11.5" fill="' + faded + '">' + escapeXml(d.meta) + '</text>' +
      '<text x="4" y="' + (PLANT_H + 82) + '" font-family="\'IBM Plex Mono\', ui-monospace, monospace" font-size="11.5" fill="' + faded + '">' + escapeXml(d.traits) + '</text>' +
      '<text x="4" y="' + (PLANT_H + 110) + '" font-family="\'IBM Plex Mono\', ui-monospace, monospace" font-size="10" fill="' + faded + '">' + escapeXml(d.provenance) + '</text>' +
      (d.freezeNote ? '<text x="4" y="' + (PLANT_H + 134) + '" font-family="\'IBM Plex Mono\', ui-monospace, monospace" font-size="10" font-style="italic" fill="' + faded + '">' + escapeXml(d.freezeNote) + '</text>' : '') +
      '</svg>'
    );
  }

  /* Builds the sheet, offers it as a download, and gives the pressing
     button a brief "Pressed ✓" confirmation. Each caller still owns
     resetting its own button's label on whatever change should undo a
     stale confirmation (a browsed day, a re-typed word) — this file
     only knows about the one click. */
  function press(d, btn) {
    if (!d) return;
    var svgText = buildSheet(d);
    var blob = new Blob([svgText], { type: "image/svg+xml" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "freebot-" + d.slug + ".svg";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    if (btn) {
      var original = btn.textContent;
      btn.textContent = "Pressed ✓";
      setTimeout(function () { btn.textContent = original; }, 1800);
    }
  }

  function slugify(str) {
    return String(str).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }

  window.freebotPress = { build: buildSheet, press: press, slugify: slugify };
})();
