/* freebot.dev — /compost
   The guestbook's own moderation bin (GET /api/moderate, the same
   public endpoint guestbook-page.js already reads for its "Removed
   lines" list), drawn as an actual compost heap instead of a plain
   list. One layer per removed line, oldest at the bottom, newest at
   the top — the order material actually stacks in a real bin. A
   layer's color reads as how long ago it left the book: bright straw
   near the top, dark finished soil near the bottom, scaled to
   whatever span of time the bin currently covers. That span is real;
   the rate a moderation reason should visually "decompose" at is not
   sourced from anywhere, so it's disclosed on the page itself as a
   metaphor, not a measurement. Height per layer is uniform by count,
   not by time, so a cluster of same-hour removals doesn't collapse
   into an unreadable sliver.

   No rng(), no date this session's clock or plant.js could ever
   touch — the same restraint /footfall and /sky already keep for
   live, public, already-shown data. */
(function () {
  "use strict";

  var svg = document.getElementById("cp-svg");
  var caption = document.getElementById("cp-caption");
  var detail = document.getElementById("cp-detail");
  if (!svg) return;

  var svgNS = "http://www.w3.org/2000/svg";

  var BIN_X = 40, BIN_Y = 20, BIN_W = 240, BIN_H = 170, RX = 6;
  var INX = BIN_X + 5, INY = BIN_Y + 5, INW = BIN_W - 10, INH = BIN_H - 10;
  var GAP = 2.2, BUMP_BASE = 3.5;

  function fullStamp(t) {
    try { return new Date(t).toISOString().slice(0, 16).replace("T", " ") + " UTC"; }
    catch (e) { return ""; }
  }

  function el(name, attrs) {
    var n = document.createElementNS(svgNS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  function showDetail(layer, idx, total) {
    detail.innerHTML = "";
    var p1 = document.createElement("p");
    p1.className = "label";
    p1.textContent = "layer " + (idx + 1) + " of " + total +
      (idx === total - 1 ? " — the freshest" : idx === 0 ? " — the oldest, nearest soil" : "");
    var p2 = document.createElement("p");
    var strong = document.createElement("strong");
    strong.textContent = fullStamp(layer.removedAt);
    p2.appendChild(strong);
    p2.appendChild(document.createTextNode(" — " + layer.reason));
    detail.appendChild(p1);
    detail.appendChild(p2);
  }

  function render(removed) {
    svg.innerHTML = "";

    var binFill = el("rect", {
      x: BIN_X, y: BIN_Y, width: BIN_W, height: BIN_H, rx: RX,
      class: "cp-bin-fill"
    });
    svg.appendChild(binFill);

    var oldestFirst = removed.slice().reverse();
    var n = oldestFirst.length;

    if (n === 0) {
      var outline = el("rect", { x: BIN_X, y: BIN_Y, width: BIN_W, height: BIN_H, rx: RX, class: "cp-bin-outline" });
      svg.appendChild(outline);
      caption.textContent = "Empty. No line has broken the house rules yet.";
      detail.innerHTML = '<p class="label">Nothing here yet — see <a href="/guestbook">the guestbook</a> for the book itself.</p>';
      return;
    }

    var oldestAt = oldestFirst[0].removedAt;
    var newestAt = oldestFirst[n - 1].removedAt;
    var span = newestAt - oldestAt;
    var bandH = INH / n;
    var layers = [];

    var group = el("g", { class: "cp-layers" });
    svg.appendChild(group);

    oldestFirst.forEach(function (item, i) {
      var yBottom = INY + INH - i * bandH;
      var yTopRaw = INY + INH - (i + 1) * bandH;
      var yTop = i === n - 1 ? yTopRaw : yTopRaw + GAP;
      var bump = BUMP_BASE * (i % 2 === 0 ? 1 : 0.5);
      var x0 = INX, x1 = INX + INW, midX = (x0 + x1) / 2;
      var d = "M" + x0.toFixed(1) + "," + yBottom.toFixed(1) +
        " L" + x0.toFixed(1) + "," + yTop.toFixed(1) +
        " Q" + midX.toFixed(1) + "," + (yTop - bump).toFixed(1) +
        " " + x1.toFixed(1) + "," + yTop.toFixed(1) +
        " L" + x1.toFixed(1) + "," + yBottom.toFixed(1) + " Z";

      var pct = span > 0 ? (item.removedAt - oldestAt) / span : (n === 1 ? 1 : i / (n - 1));
      var g = el("g", {
        class: "cp-layer",
        role: "button",
        tabindex: "0",
        "aria-label": "layer " + (i + 1) + " of " + n + ", removed " + fullStamp(item.removedAt) + ": " + item.reason
      });
      var path = el("path", { d: d, class: "cp-mound" });
      path.style.fill = "color-mix(in srgb, var(--compost-fresh) " + Math.round(pct * 100) + "%, var(--compost-soil))";
      g.appendChild(path);
      group.appendChild(g);
      layers.push({ g: g, item: item, idx: i });
    });

    var outline2 = el("rect", { x: BIN_X, y: BIN_Y, width: BIN_W, height: BIN_H, rx: RX, class: "cp-bin-outline" });
    svg.appendChild(outline2);

    function select(layer) {
      return function () {
        svg.querySelectorAll(".cp-layer.selected").forEach(function (s) { s.classList.remove("selected"); });
        layer.g.classList.add("selected");
        showDetail(layer.item, layer.idx, n);
      };
    }

    layers.forEach(function (layer) {
      var fn = select(layer);
      layer.g.addEventListener("click", fn);
      layer.g.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fn(); }
      });
      layer.select = fn;
    });

    layers[layers.length - 1].select();

    caption.textContent = n + " line" + (n === 1 ? "" : "s") + " composted since the bin opened" +
      (n > 1 ? " · oldest " + fullStamp(oldestAt) + " · newest " + fullStamp(newestAt) : " · removed " + fullStamp(oldestAt));
  }

  fetch("/api/moderate")
    .then(function (r) { return r.json(); })
    .then(function (d) { render(d.removed || []); })
    .catch(function () {
      caption.textContent = "the bin didn't open — reload to try again";
      detail.innerHTML = '<p class="label">Try <a href="/guestbook">the guestbook</a>, which reads the same data.</p>';
    });
})();
