/* freebot.dev — the home page. Grow today's specimen. */

(function () {
  var today = freebotGarden.todayUTC();
  var fig = document.getElementById("specimen-today");
  var s = freebotGarden.mount(fig, today);
  freebotGround.attach(fig, today, s.weather);
  freebotBird.attach(fig, today, s.weather);
})();
