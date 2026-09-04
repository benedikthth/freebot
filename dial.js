/* freebot.dev — /dial: a horizontal sundial, computed live from the
   real clock, not animated at a fixed hour.

   One formula draws the whole face. For a gnomon tilted off the plate
   at an angle equal to the site's own latitude and aimed at the
   celestial pole, the shadow's angle from the noon line is:

     tan(A) = sin(latitude) x tan(H)

   where H is the hour angle — 15 degrees per hour of apparent solar
   time, either side of local noon. See dial.html's own Sources
   paragraph (schoolphysics.co.uk) for where this comes from; it's
   quoted there, not derived here.

   The one fact worth sitting with: nothing about a specimen's
   *date* appears in that formula at all. The sun's height in the
   sky changes all year (that's what a shadow's length would tell
   you) but its *direction* at a given clock time and latitude
   doesn't — which is the real, unglamorous reason one set of hour
   lines, cut once, keeps correct time in January and July both. No
   rng(), no era, no plant.js anywhere in this file — same promise
   night.js already makes for the same reason: there is nothing here
   for the eras clause to even apply to.

   Two real places, not invented ones: the same Kew Gardens, London
   and Melbourne Gardens, Australia coordinates wind.js already asks
   Open-Meteo about, on the home page. Opposite hemispheres, on
   purpose — the sign of sin(latitude) flips between them, which is
   the whole reason Melbourne's dial reads as Kew's held up to a
   mirror instead of needing a second formula. */
(function () {
  "use strict";

  var svg = document.getElementById("sd-svg");
  var sideSvg = document.getElementById("sd-side-svg");
  if (!svg || !sideSvg) return;

  var btnKew = document.getElementById("sd-kew");
  var btnMelbourne = document.getElementById("sd-melbourne");
  var status = document.getElementById("sd-status");
  var formula = document.getElementById("sd-formula");
  if (!btnKew || !btnMelbourne || !status) return;

  /* Same two gardens, same two numbers, as wind.js — duplicated
     rather than imported, since this site has no module system to
     import them through (HAND-WRITTEN ONLY). */
  var GARDENS = {
    kew: { key: "kew", lat: 51.4787, lon: -0.2956, name: "Kew Gardens, London", btn: btnKew },
    melbourne: { key: "melbourne", lat: -37.8304, lon: 144.9796, name: "Melbourne Gardens, Australia", btn: btnMelbourne }
  };

  var current = GARDENS.kew;

  var CX = 180, CY = 180, R = 148;
  var HOURS = [-6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6]; // hours either side of solar noon

  function deg2rad(d) { return d * Math.PI / 180; }
  function rad2deg(r) { return r * 180 / Math.PI; }

  /* The one formula, exact for a style parallel to Earth's own axis.
     Math.tan(±90°) never reaches true infinity in floating point, so
     this needs no special-casing at the 6am/6pm edge — it just lands
     within a fraction of a degree of the true 90°. */
  function dialAngleDeg(latDeg, haDeg) {
    var t = Math.sin(deg2rad(latDeg)) * Math.tan(deg2rad(haDeg));
    return rad2deg(Math.atan(t));
  }

  /* Apparent solar time at a longitude, from the real UTC clock —
     the equation of time isn't applied (see the Honest gap
     paragraph), so this is "sundial time", not "that place's actual
     clock time". */
  function solarHours(now, lonDeg) {
    var utc = now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600;
    var t = utc + lonDeg / 15;
    return ((t % 24) + 24) % 24;
  }

  function pt(thetaDeg, radius) {
    var r = deg2rad(thetaDeg);
    return [CX + radius * Math.sin(r), CY - radius * Math.cos(r)];
  }

  function hourLabel(n) {
    var h = ((12 + n) % 12 + 12) % 12;
    return h === 0 ? 12 : h;
  }

  function renderFace(garden) {
    var lines = "";
    for (var i = 0; i < HOURS.length; i++) {
      var n = HOURS[i];
      var theta = dialAngleDeg(garden.lat, 15 * n);
      var outer = pt(theta, R);
      var labelPt = pt(theta, R + 15);
      var cls = n === 0 ? "sd-hour-line sd-noon-line" : "sd-hour-line";
      lines += '<line class="' + cls + '" x1="' + CX + '" y1="' + CY +
        '" x2="' + outer[0].toFixed(1) + '" y2="' + outer[1].toFixed(1) + '"/>';
      lines += '<text class="sd-hour-label" x="' + labelPt[0].toFixed(1) +
        '" y="' + labelPt[1].toFixed(1) + '">' + hourLabel(n) + '</text>';
    }

    /* The gnomon, seen from directly above: a real triangular blade
       foreshortens to a straight edge along the noon line when
       viewed from this angle, so this short thicker segment is the
       true top-down shape, not a simplified stand-in for one (see
       sd-side-svg for the actual triangle, in profile). */
    var gnomonTip = pt(0, 34);

    var now = new Date();
    var sHours = solarHours(now, garden.lon);
    var ha = 15 * (sHours - 12);
    var inWindow = sHours >= 6 && sHours <= 18;
    var shadowTheta = inWindow ? dialAngleDeg(garden.lat, ha) : null;
    var shadowMarkup = "";
    if (inWindow) {
      var tip = pt(shadowTheta, R - 6);
      shadowMarkup =
        '<line class="sd-shadow" x1="' + CX + '" y1="' + CY +
        '" x2="' + tip[0].toFixed(1) + '" y2="' + tip[1].toFixed(1) + '"/>' +
        '<circle class="sd-shadow-tip" cx="' + tip[0].toFixed(1) + '" cy="' + tip[1].toFixed(1) + '" r="4.5"/>';
    }

    svg.innerHTML =
      '<circle class="sd-plate" cx="' + CX + '" cy="' + CY + '" r="' + R + '"/>' +
      lines +
      shadowMarkup +
      '<line class="sd-gnomon-top" x1="' + CX + '" y1="' + CY +
      '" x2="' + gnomonTip[0].toFixed(1) + '" y2="' + gnomonTip[1].toFixed(1) + '"/>';

    var hh = Math.floor(sHours);
    var mm = Math.round((sHours - hh) * 60);
    if (mm === 60) { mm = 0; hh = (hh + 1) % 24; }
    var timeStr = (hh < 10 ? "0" : "") + hh + ":" + (mm < 10 ? "0" : "") + mm;

    if (status) {
      status.textContent = inWindow
        ? garden.name + ", " + Math.abs(garden.lat).toFixed(4) + "°" + (garden.lat >= 0 ? "N" : "S") +
          " — apparent solar time " + timeStr + ", shadow " + Math.abs(shadowTheta).toFixed(1) +
          "° " + (shadowTheta < 0 ? "left" : "right") + " of noon."
        : garden.name + " — apparent solar time " + timeStr +
          ", outside this dial's drawn 06:00–18:00 window. No shadow to show right now.";
    }
    if (formula) {
      formula.textContent =
        "tan(A) = sin(" + Math.abs(garden.lat).toFixed(2) + "°) × tan(H) — gnomon tilts " +
        Math.abs(garden.lat).toFixed(1) + "° off the plate, its own latitude";
    }

    renderSide(garden.lat);
  }

  function renderSide(latDeg) {
    var mag = Math.abs(latDeg);
    var run = 78, foot = [22, 108], far = [22 + run, 108];
    var height = run * Math.tan(deg2rad(mag));
    var apex = [22, 108 - height];
    var arcR = 26;
    var arcStart = [far[0] - arcR, far[1]];
    var arcEnd = [
      far[0] - arcR * Math.cos(deg2rad(mag)),
      far[1] - arcR * Math.sin(deg2rad(mag))
    ];
    sideSvg.innerHTML =
      '<line class="sd-side-base" x1="' + foot[0] + '" y1="' + foot[1] + '" x2="' + far[0] + '" y2="' + far[1] + '"/>' +
      '<line class="sd-side-style" x1="' + far[0] + '" y1="' + far[1] + '" x2="' + apex[0] + '" y2="' + apex[1].toFixed(1) + '"/>' +
      '<path class="sd-side-arc" d="M ' + arcStart[0].toFixed(1) + ' ' + arcStart[1] +
        ' A ' + arcR + ' ' + arcR + ' 0 0 0 ' + arcEnd[0].toFixed(1) + ' ' + arcEnd[1].toFixed(1) + '"/>' +
      '<text class="sd-side-label" x="' + (far[0] - arcR - 6) + '" y="' + (far[1] - 6) + '">' + mag.toFixed(1) + '°</text>';
  }

  function select(key) {
    current = GARDENS[key];
    btnKew.setAttribute("aria-pressed", key === "kew" ? "true" : "false");
    btnMelbourne.setAttribute("aria-pressed", key === "melbourne" ? "true" : "false");
    renderFace(current);
  }

  btnKew.addEventListener("click", function () { select("kew"); });
  btnMelbourne.addEventListener("click", function () { select("melbourne"); });

  select("kew");

  /* Real clock, real interval — same convention night.js uses for
     the same reason: this is state that changes on its own, not
     state a visitor drives. 60s is often enough to notice the
     shadow has actually moved between visits without redrawing
     needlessly; reduced motion doesn't skip the update, it only
     means the CSS transition on the line itself is instant. */
  setInterval(function () { renderFace(current); }, 60 * 1000);
})();
