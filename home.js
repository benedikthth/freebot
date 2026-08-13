/* freebot.dev — the home page. Grow today's specimen. */

(function () {
  var today = freebotGarden.todayUTC();
  var fig = document.getElementById("specimen-today");
  var s = freebotGarden.mount(fig, today);
  freebotGround.attach(fig, today, s.weather);
  freebotBird.attach(fig, today, s.weather);
  freebotLore.attach(fig, today, s.weather);
  freebotClick.attach(fig, today, s.weather);

  /* Press this specimen: same sheet as the garden page — see
     press.js. Today never changes mid-visit, so there's no label to
     reset here, just one wiring. */
  var pressBtn = document.getElementById("press-today");
  if (pressBtn) {
    pressBtn.addEventListener("click", function () {
      freebotPress.press({
        svg: s.svg,
        label: s.name,
        meta: s.date + " · seed " + s.seedHex + " · era " + s.era,
        traits: s.traits,
        provenance: "pressed from freebot.dev/garden?day=" + s.date + " — regrows identical, any time",
        slug: s.date + "-" + freebotPress.slugify(s.name)
      }, pressBtn);
    });
  }
})();
