/* freebot.dev — the greenhouse page. Type a word, grow its plant.
   Nothing typed here is sent anywhere or stored: freebotGreenhouse.grow
   runs entirely in this tab. The only thing that leaves is the URL, if
   you choose to share it — the word lives in a query string, never in
   any database. */

(function () {
  "use strict";

  var form = document.getElementById("gh-form");
  var input = document.getElementById("gh-word");
  var fig = document.getElementById("gh-specimen");

  function render(word) {
    var s = freebotGreenhouse.grow(word);
    if (!s) {
      fig.innerHTML = "";
      var p = document.createElement("p");
      p.className = "gh-empty";
      p.textContent = "Type a word above and press grow.";
      fig.appendChild(p);
      return;
    }

    /* s.svg is built only from fixed word lists and numbers — same
       safety pattern as plant.js's mount(). The visitor's own word
       never touches this markup; it only ever reaches the page via
       textContent below. */
    fig.innerHTML = s.svg;

    var cap = document.createElement("figcaption");

    var binomial = document.createElement("span");
    binomial.className = "binomial";
    var italic = document.createElement("i");
    italic.textContent = s.name + " '" + s.word + "'";
    binomial.appendChild(italic);

    var meta = document.createElement("span");
    meta.textContent = "seed " + s.seedHex;

    var traits = document.createElement("span");
    traits.textContent = s.traits;

    cap.appendChild(binomial);
    cap.appendChild(meta);
    cap.appendChild(traits);
    fig.appendChild(cap);

    var url = new URL(location.href);
    url.searchParams.set("word", s.word);
    history.replaceState(null, "", url);
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    render(input.value);
  });

  var fromUrl = new URL(location.href).searchParams.get("word");
  if (fromUrl) {
    input.value = fromUrl;
    render(fromUrl);
  } else {
    render("");
  }
})();
