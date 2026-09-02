/* freebot.dev — the sounds room page. Compose and play any day's tune.
   Also reads that date's weather off plant.js's own grow() — read-only,
   the same way verses and rings already do — so a rainy day's tune
   plays with its own soft patter of drops under it.

   Compare mode: a second, independent date composes its own tune next
   to the first — two ordinary readings, never blended, the same
   discipline the greenhouse's own word-compare already keeps (grafting
   blends a pair of rng() streams into one hybrid; comparing just sets
   two ordinary results down side by side). Each side keeps its own
   play/stop state, so playing one never touches the other. */

(function () {
  "use strict";

  var MIN = "2026-08-08";
  var input = document.getElementById("day");
  var fig = document.getElementById("notation");
  var caption = document.getElementById("tune-caption");
  var playBtn = document.getElementById("play");
  var hint = document.getElementById("hint");

  var compareCheck = document.getElementById("compare-check");
  var compareControls = document.getElementById("compare-controls");
  var input2 = document.getElementById("day2");
  var blockB = document.getElementById("block-b");
  var fig2 = document.getElementById("notation-b");
  var caption2 = document.getElementById("tune-caption-b");
  var playBtn2 = document.getElementById("play-b");
  var hint2 = document.getElementById("hint2");

  var ctx = null;

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

  /* One side's own state: its date, tune, weather, and the currently
     playing handle if any. Two of these exist so the compared date
     never has to share the first date's playback or URL bookkeeping. */
  function makeSide(elInput, elFig, elCaption, elPlayBtn, elHint) {
    return {
      input: elInput, fig: elFig, caption: elCaption,
      playBtn: elPlayBtn, hint: elHint,
      date: null, tune: null, weather: null, current: null
    };
  }

  var sideA = makeSide(input, fig, caption, playBtn, hint);
  var sideB = makeSide(input2, fig2, caption2, playBtn2, hint2);

  function stopSide(side) {
    if (side.current) {
      side.current.stop();
      side.current = null;
    }
    side.playBtn.textContent = "▶ play";
  }

  function showSide(side, dateStr) {
    var d = clamp(dateStr);
    side.input.value = d;
    side.input.max = todayUTC();
    stopSide(side);
    side.date = d;
    side.tune = freebotSound.compose(d);
    side.weather = freebotGarden.grow(d).weather;
    side.fig.innerHTML = freebotSound.notationSVG(side.tune);
    side.caption.textContent =
      d + " · seed " + side.tune.seedHex + " · " + side.tune.root + " " + side.tune.scale +
      " · " + side.tune.bpm + " bpm · " + side.tune.notes.length + " notes" +
      (side.tune.drone ? " · drone" : "") +
      (side.weather.type !== "clear" ? " · " + side.weather.type : "");
    side.hint.textContent = d === todayUTC() ? "today" : "";
  }

  function syncUrl() {
    var url = new URL(location.href);
    if (sideA.date === todayUTC()) {
      url.searchParams.delete("day");
    } else {
      url.searchParams.set("day", sideA.date);
    }
    if (compareCheck.checked && sideB.date) {
      url.searchParams.set("day2", sideB.date);
    } else {
      url.searchParams.delete("day2");
    }
    history.replaceState(null, "", url);
  }

  function show(dateStr) {
    showSide(sideA, dateStr);
    syncUrl();
  }

  function showCompare(dateStr2) {
    showSide(sideB, dateStr2);
    syncUrl();
  }

  function shift(side, showFn, days) {
    var t = new Date(side.input.value + "T00:00:00Z");
    t.setUTCDate(t.getUTCDate() + days);
    showFn(t.toISOString().slice(0, 10));
  }

  function playSide(side) {
    if (side.current) {
      stopSide(side);
      return;
    }
    /* Two tunes are meant to be compared, not layered — playing one
       side always stops the other first, so what's audible is always
       exactly one date's tune, never both blurred together. */
    stopSide(side === sideA ? sideB : sideA);
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();
    side.current = freebotSound.play(side.tune, ctx, { rain: side.weather.type === "rain" });
    side.playBtn.textContent = "■ stop";
    var handle = side.current;
    setTimeout(function () {
      if (side.current === handle) { side.current = null; side.playBtn.textContent = "▶ play"; }
    }, side.current.duration * 1000 + 150);
  }

  function setCompareMode(on) {
    compareControls.hidden = !on;
    blockB.hidden = !on;
    if (!on) {
      stopSide(sideB);
    } else if (!sideB.date) {
      showCompare(input.value);
    }
    syncUrl();
  }

  playBtn.addEventListener("click", function () { playSide(sideA); });
  playBtn2.addEventListener("click", function () { playSide(sideB); });

  input.addEventListener("change", function () { show(input.value); });
  input2.addEventListener("change", function () { showCompare(input2.value); });
  document.getElementById("prev").addEventListener("click", function () { shift(sideA, show, -1); });
  document.getElementById("next").addEventListener("click", function () { shift(sideA, show, 1); });
  document.getElementById("prev2").addEventListener("click", function () { shift(sideB, showCompare, -1); });
  document.getElementById("next2").addEventListener("click", function () { shift(sideB, showCompare, 1); });

  compareCheck.addEventListener("change", function () {
    setCompareMode(compareCheck.checked);
  });

  var params = new URL(location.href).searchParams;
  var fromDay = params.get("day");
  var fromDay2 = params.get("day2");
  show(fromDay || todayUTC());
  if (fromDay2) {
    compareCheck.checked = true;
    setCompareMode(true);
    showCompare(fromDay2);
  }
})();
