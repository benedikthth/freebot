/* freebot.dev — the greenhouse page. Type a word, grow its plant, or
   check the graft box and grow two words as one. Nothing typed here is
   sent anywhere or stored: freebotGreenhouse.grow/graft run entirely in
   this tab. The only thing that leaves is the URL, if you choose to
   share it — the word(s) live in a query string, never in any
   database. */

(function () {
  "use strict";

  var form = document.getElementById("gh-form");
  var input = document.getElementById("gh-word");
  var scionInput = document.getElementById("gh-scion");
  var graftCheck = document.getElementById("gh-graft-check");
  var wordLabel = document.getElementById("gh-word-label");
  var fig = document.getElementById("gh-specimen");

  function setGraftMode(on) {
    scionInput.hidden = !on;
    wordLabel.textContent = on ? "Rootstock" : "Grow a word";
    scionInput.placeholder = "scion — the word grafted in";
    input.placeholder = on ? "rootstock — the word it grows on" : "e.g. a name, a mood, a nonsense word";
  }

  function render(word, scion) {
    var s = scion ? freebotGreenhouse.graft(word, scion) : freebotGreenhouse.grow(word);
    if (!s) {
      fig.innerHTML = "";
      var p = document.createElement("p");
      p.className = "gh-empty";
      p.textContent = scion !== undefined
        ? "Type two words above and press grow."
        : "Type a word above and press grow.";
      fig.appendChild(p);
      return;
    }

    /* s.svg is built only from fixed word lists and numbers — same
       safety pattern as plant.js's mount(). The visitor's own word(s)
       never touch this markup; they only ever reach the page via
       textContent below. */
    fig.innerHTML = s.svg;

    var cap = document.createElement("figcaption");

    var binomial = document.createElement("span");
    binomial.className = "binomial";
    var italic = document.createElement("i");
    italic.textContent = s.rootstock
      ? s.name + " '" + s.rootstock + " × " + s.scion + "'"
      : s.name + " '" + s.word + "'";
    binomial.appendChild(italic);

    var meta = document.createElement("span");
    meta.textContent = s.rootstock
      ? "grafted seed " + s.seedHex
      : "seed " + s.seedHex;

    var traits = document.createElement("span");
    traits.textContent = s.traits;

    cap.appendChild(binomial);
    cap.appendChild(meta);
    cap.appendChild(traits);
    fig.appendChild(cap);

    var url = new URL(location.href);
    if (s.rootstock) {
      url.searchParams.set("word", s.rootstock);
      url.searchParams.set("graft", s.scion);
    } else {
      url.searchParams.set("word", s.word);
      url.searchParams.delete("graft");
    }
    history.replaceState(null, "", url);
  }

  graftCheck.addEventListener("change", function () {
    setGraftMode(graftCheck.checked);
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    render(input.value, graftCheck.checked ? scionInput.value : undefined);
  });

  var params = new URL(location.href).searchParams;
  var fromWord = params.get("word");
  var fromGraft = params.get("graft");
  if (fromGraft) {
    graftCheck.checked = true;
    setGraftMode(true);
    input.value = fromWord || "";
    scionInput.value = fromGraft;
    render(fromWord || "", fromGraft);
  } else if (fromWord) {
    input.value = fromWord;
    render(fromWord);
  } else {
    render("");
  }
})();
