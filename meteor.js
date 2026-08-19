/* freebot.dev — real meteor showers, not a seed.
   Same discipline as moon.js: this reads the viewer's real UTC
   calendar date, never a date being browsed and never plant.js's
   rng(), so there is no era for the eras promise to even apply to.
   Shown only while the sky is dark (see garden-page.js/home.js's
   applySky()), the same gate the moon already answers to.

   The working list below is the IMO's own 2026 Meteor Shower
   Calendar (Rendtel, ed., IMO INFO(3-25), Table 5 — the "Working
   List of Visual Meteor Showers"), transcribed by hand: each shower's
   real active window, peak date, and Zenithal Hourly Rate (ZHR — the
   count an ideal observer would see under a perfectly dark sky with
   the shower's radiant directly overhead). Two honest simplifications,
   named here rather than left for a visitor to discover:
     1. These are the IMO's 2026 dates specifically — a shower's
        actual peak drifts a little from year to year (see the
        Calendar's own λ⊙ solar-longitude figures). A visit in 2027
        or later should pull that year's own Calendar rather than
        trust this table quietly going stale.
     2. Two showers in the IMO's table are dropped entirely: the
        Antihelion Source (not a true shower, no real peak) and the
        two "Daytime" showers (Arietids, Sextantids), whose radiants
        sit too close to the Sun to ever produce a visible streak —
        listing them here would tell a night visitor to watch the sky
        for something only a radio antenna could ever catch.
   No correction for the viewer's own latitude or local time either —
   several showers here (the Puppid-Velids, the Southern Taurids) are
   genuinely better placed from one hemisphere than the other, and the
   IMO's own notes on that are simplified away rather than reproduced. */

(function () {
  "use strict";

  /* [code, name, start "MM-DD", end "MM-DD", peak "MM-DD", ZHR or null if the
     IMO calls it merely "variable" rather than giving a number]. */
  var SHOWERS = [
    ["QUA", "Quadrantids", "12-28", "01-12", "01-03", 80],
    ["GUM", "γ-Ursae Minorids", "01-10", "01-22", "01-18", 3],
    ["ACE", "α-Centaurids", "01-31", "02-20", "02-08", 6],
    ["LYR", "April Lyrids", "04-14", "04-30", "04-22", 18],
    ["PPU", "π-Puppids", "04-15", "04-28", "04-24", null],
    ["ETA", "η-Aquariids", "04-19", "05-28", "05-06", 50],
    ["ELY", "η-Lyrids", "05-03", "05-14", "05-11", 3],
    ["JBO", "June Boötids", "06-22", "07-02", "06-22", null],
    ["JPE", "July Pegasids", "07-01", "07-20", "07-10", 3],
    ["GDR", "July γ-Draconids", "07-25", "07-31", "07-28", 5],
    ["SDA", "Southern δ-Aquariids", "07-12", "08-23", "07-31", 25],
    ["CAP", "α-Capricornids", "07-03", "08-15", "07-31", 5],
    ["ERI", "η-Eridanids", "07-31", "08-19", "08-07", 3],
    ["PER", "Perseids", "07-17", "08-24", "08-13", 100],
    ["KCG", "κ-Cygnids", "08-03", "08-28", "08-17", 3],
    ["AUR", "Aurigids", "08-28", "09-05", "09-01", 6],
    ["SPE", "September ε-Perseids", "09-05", "09-21", "09-09", 8],
    ["SLY", "September Lyncids", "09-10", "10-08", "09-13", 3],
    ["OCT", "October Camelopardalids", "10-05", "10-06", "10-06", 5],
    ["DRA", "Draconids", "10-06", "10-10", "10-09", 5],
    ["EGE", "ε-Geminids", "10-14", "10-27", "10-18", 3],
    ["ORI", "Orionids", "10-02", "11-07", "10-21", 20],
    ["LMI", "Leonis Minorids", "10-19", "10-27", "10-24", 2],
    ["STA", "Southern Taurids", "09-20", "11-20", "11-05", 7],
    ["NTA", "Northern Taurids", "10-20", "12-10", "11-12", 5],
    ["LEO", "Leonids", "11-06", "11-30", "11-17", 15],
    ["AMO", "α-Monocerotids", "11-15", "11-25", "11-22", null],
    ["NOO", "November Orionids", "11-13", "12-06", "11-28", 3],
    ["PHO", "Phoenicids", "12-01", "12-05", "12-02", null],
    ["PUP", "Puppid-Velids", "12-01", "12-15", "12-07", 10],
    ["MON", "Monocerotids", "12-01", "12-19", "12-09", 3],
    ["HYD", "σ-Hydrids", "12-03", "12-20", "12-09", 7],
    ["GEM", "Geminids", "12-04", "12-20", "12-14", 150],
    ["COM", "Comae Berenicids", "12-04", "01-30", "12-23", 3],
    ["URS", "Ursids", "12-17", "12-26", "12-22", 10]
  ];

  function toNum(md) {
    var parts = md.split("-");
    return parseInt(parts[0], 10) * 100 + parseInt(parts[1], 10);
  }

  function isActive(startMD, endMD, todayMD) {
    var s = toNum(startMD), e = toNum(endMD), t = toNum(todayMD);
    if (s <= e) return t >= s && t <= e;
    return t >= s || t <= e; /* wraps the year boundary, e.g. QUA, COM */
  }

  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  function humanDate(md) {
    var parts = md.split("-");
    var m = parseInt(parts[0], 10) - 1;
    var d = parseInt(parts[1], 10);
    return MONTHS[m] + " " + d;
  }

  /* Real UTC calendar date, viewer's own clock — never a date being
     browsed, never plant.js. */
  function todayMD(date) {
    var d = date || new Date();
    var m = d.getUTCMonth() + 1;
    var day = d.getUTCDate();
    return (m < 10 ? "0" + m : "" + m) + "-" + (day < 10 ? "0" + day : "" + day);
  }

  function activeToday(date) {
    var t = todayMD(date);
    var out = [];
    for (var i = 0; i < SHOWERS.length; i++) {
      var s = SHOWERS[i];
      if (isActive(s[2], s[3], t)) {
        out.push({ code: s[0], name: s[1], peak: s[4], zhr: s[5] });
      }
    }
    out.sort(function (a, b) {
      var az = a.zhr === null ? -1 : a.zhr;
      var bz = b.zhr === null ? -1 : b.zhr;
      return bz - az;
    });
    return out;
  }

  /* Renders the current list into a label element, same small-text
     pattern as moon.js's own .moon-label. Returns the active list so
     a caller can decide whether to also arm the streak animation. */
  function mount(el) {
    var active = activeToday();
    if (!active.length) {
      el.textContent = "";
      el.title = "";
      el.hidden = true;
      return active;
    }
    el.hidden = false;
    var head = active[0];
    var rate = head.zhr === null ? "a variable rate" : "ZHR ≈ " + head.zhr;
    var text = "☄ " + head.name + " active — peaks " +
      humanDate(head.peak) + ", " + rate;
    if (active.length > 1) {
      text += " (+" + (active.length - 1) + " more)";
    }
    el.textContent = text;
    if (active.length > 1) {
      var rest = active.slice(1).map(function (s) {
        return s.name + (s.zhr === null ? " (variable)" : " (ZHR ≈ " + s.zhr + ")");
      });
      el.title = "Also active: " + rest.join(", ") +
        ". Real 2026 dates from the IMO's own Meteor Shower Calendar.";
    } else {
      el.title = "Real 2026 dates from the IMO's own Meteor Shower Calendar.";
    }
    return active;
  }

  var REDUCED = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* A streak is a small flourish, not a measurement: real ZHR assumes
     a perfectly dark sky with the shower's radiant straight overhead,
     which this corner of a browser tab plainly isn't. This only lets
     a stronger active shower streak somewhat more often than a weak
     one — illustrative, not an observed rate, and the page's own
     prose says so rather than letting the animation imply otherwise. */
  function spawnStreak(container) {
    var el = document.createElement("div");
    el.className = "meteor-streak";
    var top = 6 + Math.random() * 55;
    var left = 8 + Math.random() * 70;
    var len = 46 + Math.random() * 40;
    var angle = 18 + Math.random() * 14;
    el.style.top = top + "%";
    el.style.left = left + "%";
    el.style.height = len + "px";
    el.style.setProperty("--meteor-angle", angle + "deg");
    el.addEventListener("animationend", function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    });
    container.appendChild(el);
  }

  /* Called once per page load. Keeps its own timer, independent of
     whatever 5-minute sky tick the host page runs the moon label off
     of — a streak needs a much faster cadence than a phase does. */
  function attachStreaks(container) {
    if (REDUCED || !container) return;
    setInterval(function () {
      if (!document.body.classList.contains("sky-night")) return;
      var active = activeToday();
      if (!active.length) return;
      var top = active[0].zhr === null ? 8 : active[0].zhr;
      var chance = Math.min(0.35, Math.max(0.04, top / 400));
      if (Math.random() < chance) spawnStreak(container);
    }, 9000);
  }

  window.freebotMeteor = {
    SHOWERS: SHOWERS,
    activeToday: activeToday,
    mount: mount,
    attachStreaks: attachStreaks
  };
})();
