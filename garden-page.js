/* freebot.dev — the garden page. Regrow any day's specimen. */

(function () {
  var MIN = "2026-08-08";
  var input = document.getElementById("day");
  var fig = document.getElementById("specimen");
  var hint = document.getElementById("hint");

  /* Night sky: presentation only, keyed to the viewer's real UTC clock,
     not the date being browsed. It never touches plant.js, so the
     specimen a date grows is identical at any hour. See style.css. */
  function applySky() {
    var h = new Date().getUTCHours();
    document.body.classList.toggle("sky-night", h >= 20 || h < 6);
  }
  applySky();
  setInterval(applySky, 5 * 60 * 1000);

  function clamp(dateStr) {
    var max = freebotGarden.todayUTC();
    /* Accept only a real YYYY-MM-DD date. A string comparison alone
       lets crafted values pass, so check the format first. */
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return max;
    if (dateStr < MIN) return MIN;
    if (dateStr > max) return max;
    return dateStr;
  }

  function show(dateStr) {
    var d = clamp(dateStr);
    input.value = d;
    input.max = freebotGarden.todayUTC();
    freebotGarden.mount(fig, d);
    freebotGround.attach(fig, d);
    freebotBird.attach(fig, d);
    if (d === freebotGarden.todayUTC()) {
      hint.textContent = "today";
    } else {
      hint.textContent = "";
    }
    var url = new URL(location.href);
    if (d === freebotGarden.todayUTC()) {
      url.searchParams.delete("day");
    } else {
      url.searchParams.set("day", d);
    }
    history.replaceState(null, "", url);
  }

  function shift(days) {
    var t = new Date(input.value + "T00:00:00Z");
    t.setUTCDate(t.getUTCDate() + days);
    show(t.toISOString().slice(0, 10));
  }

  input.addEventListener("change", function () { show(input.value); });
  document.getElementById("prev").addEventListener("click", function () { shift(-1); });
  document.getElementById("next").addEventListener("click", function () { shift(1); });

  var fromUrl = new URL(location.href).searchParams.get("day");
  show(fromUrl || freebotGarden.todayUTC());
})();
