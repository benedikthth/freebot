// freebot.dev — /veins
// A real Voronoi diagram, computed live from wherever you click, in
// answer to a real 2026 finding: a Chinese money plant's major leaf
// veins form an actual Voronoi diagram around its water pores
// (hydathodes). See /veins for the sources.
//
// No rng(), no date, no read of plant.js. The only inputs are the
// points a visitor places. Cells are computed by real half-plane
// polygon clipping (Sutherland–Hodgman against each perpendicular
// bisector), not a raster approximation or a canned library.
(function () {
  "use strict";

  var svg = document.getElementById("vn-svg");
  var veinsGroup = document.getElementById("vn-veins");
  var poresGroup = document.getElementById("vn-pores");
  var hint = document.getElementById("vn-hint");
  var resetBtn = document.getElementById("vn-reset");
  var exampleBtn = document.getElementById("vn-example");
  if (!svg || !veinsGroup || !poresGroup) return;

  var svgNS = "http://www.w3.org/2000/svg";
  var CX = 150, CY = 150, R = 130;
  var MAX_PORES = 16;
  var sites = [];

  function boundingPolygon() {
    var pts = [];
    var n = 72;
    for (var i = 0; i < n; i++) {
      var a = (i / n) * Math.PI * 2;
      pts.push({ x: CX + R * Math.cos(a), y: CY + R * Math.sin(a) });
    }
    return pts;
  }

  // Point where segment a→b crosses the line through `mid`
  // perpendicular to `normal`.
  function intersect(a, b, mid, normal) {
    var da = (a.x - mid.x) * normal.x + (a.y - mid.y) * normal.y;
    var db = (b.x - mid.x) * normal.x + (b.y - mid.y) * normal.y;
    var t = da / (da - db);
    return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
  }

  // Keep only the part of `poly` on the `normal` side of the line
  // through `mid` — the classic half-plane clip.
  function clip(poly, mid, normal) {
    var out = [];
    for (var i = 0; i < poly.length; i++) {
      var cur = poly[i];
      var prev = poly[(i - 1 + poly.length) % poly.length];
      var curSide = (cur.x - mid.x) * normal.x + (cur.y - mid.y) * normal.y;
      var prevSide = (prev.x - mid.x) * normal.x + (prev.y - mid.y) * normal.y;
      if (curSide >= 0) {
        if (prevSide < 0) out.push(intersect(prev, cur, mid, normal));
        out.push(cur);
      } else if (prevSide >= 0) {
        out.push(intersect(prev, cur, mid, normal));
      }
    }
    return out;
  }

  // A site's cell: the bounding leaf, clipped once per other site by
  // the half-plane closer to this site than to that one.
  function cellFor(site, others, bound) {
    var poly = bound;
    for (var i = 0; i < others.length && poly.length; i++) {
      var o = others[i];
      var mid = { x: (site.x + o.x) / 2, y: (site.y + o.y) / 2 };
      var normal = { x: site.x - o.x, y: site.y - o.y };
      poly = clip(poly, mid, normal);
    }
    return poly;
  }

  function polyPath(poly) {
    if (!poly.length) return "";
    var d = "M";
    for (var i = 0; i < poly.length; i++) {
      d += poly[i].x.toFixed(1) + "," + poly[i].y.toFixed(1);
      d += i < poly.length - 1 ? "L" : "Z";
    }
    return d;
  }

  function render() {
    veinsGroup.textContent = "";
    poresGroup.textContent = "";

    if (sites.length >= 2) {
      var bound = boundingPolygon();
      for (var i = 0; i < sites.length; i++) {
        var others = [];
        for (var j = 0; j < sites.length; j++) if (j !== i) others.push(sites[j]);
        var poly = cellFor(sites[i], others, bound);
        if (poly.length >= 3) {
          var path = document.createElementNS(svgNS, "path");
          path.setAttribute("d", polyPath(poly));
          path.setAttribute("class", "vn-cell");
          veinsGroup.appendChild(path);
        }
      }
    }

    sites.forEach(function (s) {
      var c = document.createElementNS(svgNS, "circle");
      c.setAttribute("cx", s.x.toFixed(1));
      c.setAttribute("cy", s.y.toFixed(1));
      c.setAttribute("r", 4.5);
      c.setAttribute("class", "vn-pore");
      poresGroup.appendChild(c);
    });

    if (!hint) return;
    if (sites.length === 0) {
      hint.textContent = "Click or tap inside the leaf to place a pore.";
    } else if (sites.length === 1) {
      hint.textContent = "One pore placed — add a second to see a boundary form.";
    } else if (sites.length >= MAX_PORES) {
      hint.textContent = sites.length + " pores placed (that's the cap). Clear to start over.";
    } else {
      hint.textContent = sites.length + " pores placed. Every line is exactly as far from its two nearest pores.";
    }
  }

  function placeFromEvent(e) {
    if (sites.length >= MAX_PORES) return;
    var pt = svg.createSVGPoint();
    var touch = e.changedTouches && e.changedTouches[0];
    pt.x = touch ? touch.clientX : e.clientX;
    pt.y = touch ? touch.clientY : e.clientY;
    var loc = pt.matrixTransform(svg.getScreenCTM().inverse());
    var dx = loc.x - CX, dy = loc.y - CY;
    if (dx * dx + dy * dy > R * R) return;
    sites.push({ x: loc.x, y: loc.y });
    render();
  }

  svg.addEventListener("click", placeFromEvent);

  if (resetBtn) resetBtn.addEventListener("click", function () {
    sites = [];
    render();
  });

  if (exampleBtn) exampleBtn.addEventListener("click", function () {
    // A fixed, hand-placed arrangement — not rolled, not random, the
    // same restraint margin's own sketches keep.
    sites = [
      { x: 150, y: 150 },
      { x: 150, y: 78 },
      { x: 213, y: 114 },
      { x: 213, y: 186 },
      { x: 150, y: 222 },
      { x: 87, y: 186 },
      { x: 87, y: 114 }
    ];
    render();
  });

  render();
})();
