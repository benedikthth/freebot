/* freebot.dev — the sounds room page. Compose and play any day's tune.
   Also reads that date's weather off plant.js's own grow() — read-only,
   the same way verses and rings already do — so a rainy day's tune
   plays with its own soft patter of drops under it. */

(function () {
  "use strict";

  var MIN = "2026-08-08";
  var input = document.getElementById("day");
  var fig = document.getElementById("notation");
  var caption = document.getElementById("tune-caption");
  var playBtn = document.getElementById("play");
  var hint = document.getElementById("hint");

  var ctx = null;
  var current = null; // the currently playing handle, if any

  function todayUTC() {
    return new Date().toISOString().slice(0, 10);
  }

  function clamp(dateStr) {
    var max = todayUTC();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return max;
    if (dateStr < MIN) return MIN;
    if (dateStr > max) return max;
    return dateStr;
  }

  var tune = null;
  var weather = null; // that date's weather, read-only off plant.js's own grow()

  function show(dateStr) {
    var d = clamp(dateStr);
    input.value = d;
    input.max = todayUTC();
    stop();
    tune = freebotSound.compose(d);
    weather = freebotGarden.grow(d).weather;
    fig.innerHTML = freebotSound.notationSVG(tune);
    caption.textContent =
      d + " · seed " + tune.seedHex + " · " + tune.root + " " + tune.scale +
      " · " + tune.bpm + " bpm · " + tune.notes.length + " notes" +
      (tune.drone ? " · drone" : "") +
      (weather.type !== "clear" ? " · " + weather.type : "");
    hint.textContent = d === todayUTC() ? "today" : "";
    var url = new URL(location.href);
    if (d === todayUTC()) {
      url.searchParams.delete("day");
    } else {
      url.searchParams.set("day", d);
    }
    history.replaceState(null, "", url);
    playBtn.textContent = "▶ play";
  }

  function stop() {
    if (current) {
      current.stop();
      current = null;
    }
    playBtn.textContent = "▶ play";
  }

  function shift(days) {
    var t = new Date(input.value + "T00:00:00Z");
    t.setUTCDate(t.getUTCDate() + days);
    show(t.toISOString().slice(0, 10));
  }

  playBtn.addEventListener("click", function () {
    if (current) {
      stop();
      return;
    }
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    current = freebotSound.play(tune, ctx, { rain: weather.type === "rain" });
    playBtn.textContent = "■ stop";
    setTimeout(function () {
      if (current) { current = null; playBtn.textContent = "▶ play"; }
    }, current.duration * 1000 + 150);
  });

  input.addEventListener("change", function () { show(input.value); });
  document.getElementById("prev").addEventListener("click", function () { shift(-1); });
  document.getElementById("next").addEventListener("click", function () { shift(1); });

  var fromUrl = new URL(location.href).searchParams.get("day");
  show(fromUrl || todayUTC());
})();
