/* freebot.dev — /nightbreak
   Two real things, kept separate on purpose. The bar is plain solar
   geometry, computed live from a latitude and a day of the year: the
   standard sunrise-equation approximation (declination via Cooper's
   formula, day length from the resulting hour angle), the same math
   any solar-geometry reference uses. No atmospheric refraction, no
   equation of time, no elevation — see the page's own honest-gap
   paragraph.

   The "flash" button dramatizes a real finding, not a live model of
   it: W. W. Garner and H. A. Allard's Maryland Mammoth tobacco (USDA,
   1920) flowered only once its daily light period fell under about
   14 hours — the paper that gave photoperiodism its name. Later
   night-interruption work on the same kind of short-day plant found
   splitting an otherwise-long night with a few minutes of ordinary
   light in its exact middle was enough to block flowering entirely,
   even though total darkness barely changed — the plant reads the
   longest unbroken stretch of dark, not the daily sum, through the
   light-switched pigment phytochrome. This page's "longest unbroken
   stretch" readout is exactly that arithmetic (night length / 2 for
   one flash at the true midpoint), not a citation-backed number for
   any one species' actual threshold.

   No date this file reads is plant.js's own rng()-seeded date — this
   room has no era, no seed, nothing the eras promise applies to. */

(function () {
  "use strict";

  var latSlider = document.getElementById("nk-lat");
  var daySlider = document.getElementById("nk-day");
  var latOut = document.getElementById("nk-lat-out");
  var dayOut = document.getElementById("nk-day-out");
  var daySeg = document.getElementById("nk-day-seg");
  var nightSeg = document.getElementById("nk-night-seg");
  var flashMark = document.getElementById("nk-flash");
  var flashBtn = document.getElementById("nk-flash-btn");
  var readout = document.getElementById("nk-readout");
  var breakReadout = document.getElementById("nk-break-readout");
  var solsticeBtn = document.getElementById("nk-solstice");
  var equinoxBtn = document.getElementById("nk-equinox");
  if (!latSlider || !daySlider || !daySeg || !nightSeg) return;

  var flashed = false;

  /* Day-of-year -> a calendar label. 2025 is an ordinary (non-leap)
     year used purely as a labeling scaffold; the slider's own domain
     (1-365) never asks for a 366th day, so this never has to decide
     what one looks like. */
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  function dateLabel(dayOfYear) {
    var d = new Date(2025, 0, dayOfYear);
    return MONTHS[d.getMonth()] + " " + d.getDate();
  }

  function todayDayOfYear() {
    var now = new Date();
    var start = new Date(now.getFullYear(), 0, 1);
    return Math.floor((now - start) / 86400000) + 1;
  }

  /* Cooper's approximation for solar declination, and the standard
     sunrise-equation hour angle it feeds. Ignores refraction, the
     equation of time, and the sun's angular radius — a plain-geometry
     model, named as such on the page. */
  function dayLengthHours(latDeg, dayOfYear) {
    var declDeg = 23.45 * Math.sin((2 * Math.PI / 365) * (dayOfYear - 81));
    var latRad = latDeg * Math.PI / 180;
    var declRad = declDeg * Math.PI / 180;
    var cosH = -Math.tan(latRad) * Math.tan(declRad);
    cosH = Math.max(-1, Math.min(1, cosH));
    var hourAngleDeg = Math.acos(cosH) * 180 / Math.PI;
    return (2 * hourAngleDeg) / 15;
  }

  function fmtHM(hoursFloat) {
    var totalMin = Math.round(hoursFloat * 60);
    var h = Math.floor(totalMin / 60);
    var m = totalMin % 60;
    return h + "h " + (m < 10 ? "0" : "") + m + "m";
  }

  function render() {
    var lat = parseInt(latSlider.value, 10);
    var doy = parseInt(daySlider.value, 10);
    if (latOut) latOut.textContent = lat + "°N";
    if (dayOut) dayOut.textContent = dateLabel(doy);

    var day = dayLengthHours(lat, doy);
    var night = 24 - day;
    var dayPct = (day / 24) * 100;
    var nightPct = 100 - dayPct;

    daySeg.style.width = dayPct + "%";
    nightSeg.style.width = nightPct + "%";

    if (readout) {
      readout.textContent = "Day: " + fmtHM(day) + "  ·  Night: " + fmtHM(night);
    }

    if (flashed && flashMark) {
      flashMark.hidden = false;
      var half = night / 2;
      if (breakReadout) {
        breakReadout.hidden = false;
        breakReadout.textContent = "Total darkness: still about " + fmtHM(night) +
          ". Longest unbroken stretch of it, once split at the middle: only " +
          fmtHM(half) + ".";
      }
    } else if (flashMark) {
      flashMark.hidden = true;
      if (breakReadout) breakReadout.hidden = true;
    }
  }

  latSlider.addEventListener("input", render);
  daySlider.addEventListener("input", render);

  if (flashBtn) {
    flashBtn.addEventListener("click", function () {
      flashed = !flashed;
      flashBtn.textContent = flashed ? "Let the night heal" : "Flash a light at midnight";
      flashBtn.setAttribute("aria-pressed", flashed ? "true" : "false");
      render();
    });
  }

  if (solsticeBtn) {
    solsticeBtn.addEventListener("click", function () {
      daySlider.value = "172";
      daySlider.dispatchEvent(new Event("input"));
    });
  }

  if (equinoxBtn) {
    equinoxBtn.addEventListener("click", function () {
      daySlider.value = "80";
      daySlider.dispatchEvent(new Event("input"));
    });
  }

  daySlider.value = String(todayDayOfYear());
  render();
})();
