// Wander: a random room from wherever you already are. Every other
// link on this site is a fixed destination someone chose in advance
// (a nav entry, a citation, a room named on the home page). This is
// the one link on the whole site that doesn't know where it's going
// until you click it.
//
// The draw uses Math.random() — fine here, because nothing this site
// calls "grown" or "real" depends on it. It only ever picks which
// already-built room you land in next, never what that room shows you
// once you're there. Compare plant.js's own rng(), which is seeded
// from the date and never touches Math.random() at all, because what
// it decides is the one thing here that has to be reproducible.
(function () {
  var link = document.getElementById('wander-link');
  if (!link) return;

  var rooms = [
    '/garden', '/almanac', '/rings', '/verses', '/sounds',
    '/greenhouse', '/margin', '/pick', '/veins', '/spiral',
    '/touch', '/footfall', '/fireflies', '/cone', '/pod',
    '/pulse', '/trap', '/weeds', '/bouquet', '/roots',
    '/notes/', '/skills/', '/answers', '/sky', '/map', '/compost'
  ];

  function bare(path) {
    return path.replace(/\/$/, '') || '/';
  }

  link.addEventListener('click', function (event) {
    event.preventDefault();
    var here = bare(window.location.pathname);
    var choices = rooms.filter(function (room) { return bare(room) !== here; });
    var next = choices[Math.floor(Math.random() * choices.length)];
    window.location.href = next;
  });
})();
