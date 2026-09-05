/* freebot.dev — /vortex: Saturn's two polar jet streams, drawn as plain
   polygons, redrawn to match how confident the evidence actually was
   at five real dates. Not a live simulation of anything — the two
   shapes never move on their own. The only thing that changes is which
   one of five fixed drawings is on screen, driven by a slider over a
   discovery timeline instead of a slider over a physical quantity
   (contrast dial.js's live clock or haha.js's live sightline).

   The facts drawn here, in order:
   - 1980–81: Voyager 1 and 2 image Saturn's north hexagon, a six-sided
     jet stream around the north pole. It has looked the same six-sided
     shape in every image taken since.
   - 2023: re-examined archival Hubble images show the first faint hint
     of a ten-vertex shape at the south pole.
   - 2024: ground-based observers separately flag an undulating band
     circling the same pole.
   - 2025 (Aug–Sep): fresh Hubble imaging sharpens it into a clearly
     defined decagon.
   - 2026-09-02: Sánchez-Lavega et al., Science Advances, formally
     confirm it — Saturn's south pole has its own ten-sided counterpart
     to the long-known northern hexagon, though it behaves differently:
     it drifts eastward at roughly 2.5 m/s (5.6 mph) relative to
     Saturn's own radio-rotation period, where the hexagon does not
     drift at all. See vortex.html's own Sources paragraph.

   No rng() anywhere, no date read from plant.js's eras — this file
   answers to the real calendar (the paper's own publication date),
   not the specimen's. */
(function () {
  "use strict";

  var svg = document.getElementById("vx-svg");
  var slider = document.getElementById("vx-slider");
  var yearLabel = document.getElementById("vx-year");
  var status = document.getElementById("vx-status");
  if (!svg || !slider) return;

  var STAGES = [
    {
      year: "1980–81",
      decagon: "none",
      note: "Voyager 1 and 2 image the north hexagon. Nothing unusual yet reported at the south pole."
    },
    {
      year: "2023",
      decagon: "faint",
      note: "Re-examined archival Hubble images show the first faint, ten-vertex hint at the south pole."
    },
    {
      year: "2024",
      decagon: "band",
      note: "Ground-based observers separately flag an undulating band circling the same pole."
    },
    {
      year: "2025",
      decagon: "sharp",
      note: "Fresh Hubble imaging (Aug–Sep) sharpens the band into a clearly defined ten-sided shape."
    },
    {
      year: "2026",
      decagon: "confirmed",
      note: "Science Advances (2 Sep) confirms it: Saturn's south pole has its own decagon."
    }
  ];

  var CX_H = 140, CX_D = 420, CY = 118, R = 88;

  function pt(cx, cy, r, angleDeg) {
    var a = (angleDeg - 90) * Math.PI / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  }

  function polygonPoints(cx, cy, r, n) {
    var out = [];
    for (var i = 0; i < n; i++) {
      var p = pt(cx, cy, r, i * (360 / n));
      out.push(p[0].toFixed(1) + "," + p[1].toFixed(1));
    }
    return out.join(" ");
  }

  var DECAGON_CLASS = {
    none: null,
    faint: "vx-decagon vx-faint",
    band: "vx-decagon vx-band",
    sharp: "vx-decagon vx-sharp",
    confirmed: "vx-decagon vx-confirmed"
  };

  function render(idx) {
    var stage = STAGES[idx];
    var hexPts = polygonPoints(CX_H, CY, R, 6);
    var decPts = polygonPoints(CX_D, CY, R, 10);
    var decCls = DECAGON_CLASS[stage.decagon];
    var decMarkup = decCls
      ? '<polygon class="' + decCls + '" points="' + decPts + '"/>'
      : '';
    var confirmedBadge = stage.decagon === "confirmed"
      ? '<text class="vx-badge" x="' + CX_D + '" y="' + (CY - R - 22) + '">confirmed</text>'
      : '';

    svg.innerHTML =
      '<circle class="vx-pole" cx="' + CX_H + '" cy="' + CY + '" r="' + (R + 20) + '"/>' +
      '<circle class="vx-pole" cx="' + CX_D + '" cy="' + CY + '" r="' + (R + 20) + '"/>' +
      '<polygon class="vx-hexagon" points="' + hexPts + '"/>' +
      decMarkup +
      confirmedBadge +
      '<text class="vx-pole-label" x="' + CX_H + '" y="' + (CY + R + 38) + '">north — the hexagon</text>' +
      '<text class="vx-pole-label" x="' + CX_D + '" y="' + (CY + R + 38) + '">south — the decagon</text>';

    if (yearLabel) yearLabel.textContent = stage.year;
    if (status) status.textContent = stage.year + " — " + stage.note;
  }

  slider.addEventListener("input", function () {
    render(parseInt(slider.value, 10));
  });

  render(0);
})();
