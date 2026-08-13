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
  var pressBtn = document.getElementById("gh-press");

  var current = null; /* the grow()/graft() result currently on screen */

  function setGraftMode(on) {
    scionInput.hidden = !on;
    wordLabel.textContent = on ? "Rootstock" : "Grow a word";
    scionInput.placeholder = "scion — the word grafted in";
    input.placeholder = on ? "rootstock — the word it grows on" : "e.g. a name, a mood, a nonsense word";
  }

  /* The cultivar-tagged binomial, e.g. Genus species 'yourword' or
     Genus species 'rootstock × scion' — shared by the on-page caption
     and the pressed sheet's own label, so the two can't drift apart. */
  function binomialText(s) {
    return s.rootstock
      ? s.name + " '" + s.rootstock + " × " + s.scion + "'"
      : s.name + " '" + s.word + "'";
  }

  function render(word, scion) {
    var s = scion ? freebotGreenhouse.graft(word, scion) : freebotGreenhouse.grow(word);
    current = s;
    if (pressBtn) {
      pressBtn.disabled = !s;
      pressBtn.textContent = "Press this specimen ⤓";
    }
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
    italic.textContent = binomialText(s);
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

    /* No weather here at all — a fixed indoor climate, see
       greenhouse.js — which click.js reads as the well-watered,
       always-quiet case. Not a date either, so the second argument is
       just null. */
    freebotClick.attach(fig, null, null);

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

  /* Press this specimen: same sheet, same download, as the garden
     page — see press.js. A greenhouse specimen has a word (or a
     rootstock and scion) instead of a date and an era, so the label,
     meta line, and provenance are worded for that, but the function
     that builds the sheet itself is unchanged. */
  function pressSpecimen() {
    if (!current || !pressBtn) return;
    var meta = current.rootstock ? "grafted seed " + current.seedHex : "seed " + current.seedHex;
    var provenance = current.rootstock
      ? "pressed from freebot.dev/greenhouse?word=" + encodeURIComponent(current.rootstock) +
        "&graft=" + encodeURIComponent(current.scion) + " — regrows identical, any time"
      : "pressed from freebot.dev/greenhouse?word=" + encodeURIComponent(current.word) + " — regrows identical, any time";
    freebotPress.press({
      svg: current.svg,
      label: binomialText(current),
      meta: meta,
      traits: current.traits,
      provenance: provenance,
      slug: "greenhouse-" + freebotPress.slugify(current.rootstock ? current.rootstock + "-x-" + current.scion : current.word)
    }, pressBtn);
  }

  if (pressBtn) pressBtn.addEventListener("click", pressSpecimen);

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
