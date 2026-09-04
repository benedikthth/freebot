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
  var compareInput = document.getElementById("gh-compare-word");
  var graftCheck = document.getElementById("gh-graft-check");
  var compareCheck = document.getElementById("gh-compare-check");
  var wordLabel = document.getElementById("gh-word-label");
  var fig = document.getElementById("gh-specimen");
  var figB = document.getElementById("gh-specimen-b");
  /* fig/figB each now only ever hold two permanent children: the glass
     overlay (style.css's .gh-glass, never touched here) and a content
     div, which render()/fillSpecimen() rebuild each time below.
     Writing to content instead of fig keeps the overlay out of that
     rebuild. */
  var content = document.getElementById("gh-content");
  var contentB = document.getElementById("gh-content-b");
  var pressBtn = document.getElementById("gh-press");
  var pressLabel = document.getElementById("gh-press-label");

  var current = null; /* the grow()/graft() result currently on screen, pressable */

  /* Graft and compare are two different answers to "a second word" —
     one blends, one doesn't — so only one can be active at a time.
     Checking either turns the other off rather than stacking. */
  function setGraftMode(on) {
    if (on) { compareCheck.checked = false; setCompareMode(false); }
    scionInput.hidden = !on;
    wordLabel.textContent = on ? "Rootstock" : "Grow a word";
    scionInput.placeholder = "scion — the word grafted in";
    input.placeholder = on ? "rootstock — the word it grows on" : "e.g. a name, a mood, a nonsense word";
  }

  function setCompareMode(on) {
    if (on) { graftCheck.checked = false; setGraftMode(false); }
    compareInput.hidden = !on;
    wordLabel.textContent = on ? "First word" : "Grow a word";
    input.placeholder = on ? "the first specimen" : "e.g. a name, a mood, a nonsense word";
    figB.hidden = !on;
    if (!on) { contentB.innerHTML = ""; }
    /* A compared pair is two specimens; the press button only ever
       downloads one sheet, so it stays off for this mode rather than
       guessing which half a visitor meant. */
    if (pressBtn) pressBtn.disabled = on ? true : !current;
    if (pressLabel) {
      pressLabel.textContent = on
        ? "Turn compare off to press a single specimen — a pressed sheet is one plant, not a pair."
        : "Downloads this exact plant as one self-contained SVG, labeled like an herbarium sheet. No re-roll — the file is the shape on screen.";
    }
  }

  /* The cultivar-tagged binomial, e.g. Genus species 'yourword' or
     Genus species 'rootstock × scion' — shared by the on-page caption
     and the pressed sheet's own label, so the two can't drift apart. */
  function binomialText(s) {
    return s.rootstock
      ? s.name + " '" + s.rootstock + " × " + s.scion + "'"
      : s.name + " '" + s.word + "'";
  }

  /* The seed-hex meta line, plain or grafted. A grafted specimen also
     names its own weighting — read off freebotGreenhouse.rootstockWeight,
     the exact number the pot's own seam (greenhouse.js) already draws,
     never a second "60/40" typed by hand that could drift out of sync
     with it. Shared by the on-screen caption and the pressed sheet, so
     the two can't say two different things about the same plant. */
  function metaText(s) {
    if (!s.rootstock) return "seed " + s.seedHex;
    var pct = Math.round(freebotGreenhouse.rootstockWeight * 100);
    return "grafted seed " + s.seedHex + " · " + pct + "/" + (100 - pct) + " rootstock/scion";
  }

  /* A grower's-note line, the greenhouse's own answer to the daily
     garden's weather lore (see lore.js). That pattern doesn't just
     copy over: a greenhouse holds one climate forever, so there's no
     weather, no season, and no forecast to be folksy about. What it
     does have is the one fact weather lore never gets to state
     outright — that nothing here was ever left to chance by the sky.
     So the note reasons from the plant's own shape and whether it
     flowered, not from a date, and every line says some version of
     the same thing: this leaf, this bloom or its absence, happened
     with no season pushing on it either way. Six fixed lines (three
     leaf shapes × flowering or not) — deterministic, not drawn, since
     it describes a plant already fully decided rather than deciding
     anything new. Same restraint lore.js keeps for a pressed sheet:
     this line is never passed to press.js, on-screen commentary only,
     not part of the specimen itself. */
  var NOTES = {
    ovate: [
      "An ordinary leaf, and no flowers this time — the climate here doesn't send a signal for that either.",
      "An ordinary leaf on a plant that flowered anyway. A greenhouse keeps no season, so nothing told it to wait."
    ],
    lanceolate: [
      "A narrow leaf, shaped for rain it will never see indoors, and no bloom this time — for no particular reason.",
      "A narrow leaf, built to shed rain it will never get in here, on a plant that bloomed regardless."
    ],
    cordate: [
      "A heart-shaped leaf, grown at one constant temperature its whole life. No flowers, no drama, no reason given.",
      "A heart-shaped leaf that never had a season to grow into, on a plant that flowered out of nothing but habit."
    ]
  };

  function noteText(s) {
    var lines = NOTES[s.leafShape];
    if (!lines) return "";
    return lines[s.flowering ? 1 : 0];
  }

  /* Shared by plain/graft mode and each half of compare mode: fill one
     .specimen frame with a grow()/graft() result, or with the "type
     something" placeholder when there isn't one yet. Doesn't touch
     `current` or the URL — callers own those, since compare mode has
     two results and only one URL. */
  function fillSpecimen(targetFig, targetContent, s, emptyMsg) {
    if (!s) {
      targetContent.innerHTML = "";
      var p = document.createElement("p");
      p.className = "gh-empty";
      p.textContent = emptyMsg;
      targetContent.appendChild(p);
      return;
    }

    /* s.svg is built only from fixed word lists and numbers — same
       safety pattern as plant.js's mount(). The visitor's own word(s)
       never touch this markup; they only ever reach the page via
       textContent below. */
    targetContent.innerHTML = s.svg;

    var cap = document.createElement("figcaption");

    var binomial = document.createElement("span");
    binomial.className = "binomial";
    var italic = document.createElement("i");
    italic.textContent = binomialText(s);
    binomial.appendChild(italic);

    var meta = document.createElement("span");
    meta.textContent = metaText(s);

    var traits = document.createElement("span");
    traits.textContent = s.traits;

    cap.appendChild(binomial);
    cap.appendChild(meta);
    cap.appendChild(traits);
    targetContent.appendChild(cap);

    /* Reuses lore.js's own .lore-line class and placement (a <p>
       appended as figcaption's sibling, not a fourth cramped column
       inside its flex row) — same visual register, a different
       generator underneath. See noteText() above for why the pattern
       doesn't just copy over. */
    var note = document.createElement("p");
    note.className = "lore-line";
    note.textContent = noteText(s);
    targetContent.appendChild(note);

    /* No weather here at all — a fixed indoor climate, see
       greenhouse.js — which click.js reads as the well-watered,
       always-quiet case. Not a date either, so the second argument is
       just null. */
    freebotClick.attach(targetFig, null, null);
  }

  function render(word, scion) {
    var s = scion ? freebotGreenhouse.graft(word, scion) : freebotGreenhouse.grow(word);
    current = s;
    if (pressBtn) {
      pressBtn.disabled = !s;
      pressBtn.textContent = "Press this specimen ⤓";
    }
    fillSpecimen(fig, content, s, scion !== undefined
      ? "Type two words above and press grow."
      : "Type a word above and press grow.");
    if (!s) return;

    var url = new URL(location.href);
    url.searchParams.delete("compare");
    if (s.rootstock) {
      url.searchParams.set("word", s.rootstock);
      url.searchParams.set("graft", s.scion);
    } else {
      url.searchParams.set("word", s.word);
      url.searchParams.delete("graft");
    }
    history.replaceState(null, "", url);
  }

  /* Compare mode: two independent grow()s (never freebotGreenhouse.graft
     — nothing here blends), set down side by side. `current` stays
     whichever the first word grew, mostly so nothing else on the page
     has to special-case a null; the press button is off in this mode
     regardless (see setCompareMode), so it's never actually pressed. */
  function renderCompare(word, wordB) {
    var s = freebotGreenhouse.grow(word);
    var sB = freebotGreenhouse.grow(wordB);
    current = s;
    fillSpecimen(fig, content, s, "Type the first word above and press grow.");
    fillSpecimen(figB, contentB, sB, "Type a second word above and press grow.");

    var url = new URL(location.href);
    url.searchParams.delete("graft");
    if (word) url.searchParams.set("word", word); else url.searchParams.delete("word");
    if (wordB) url.searchParams.set("compare", wordB); else url.searchParams.delete("compare");
    history.replaceState(null, "", url);
  }

  /* Press this specimen: same sheet, same download, as the garden
     page — see press.js. A greenhouse specimen has a word (or a
     rootstock and scion) instead of a date and an era, so the label,
     meta line, and provenance are worded for that, but the function
     that builds the sheet itself is unchanged. */
  function pressSpecimen() {
    if (!current || !pressBtn) return;
    var meta = metaText(current);
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

  compareCheck.addEventListener("change", function () {
    setCompareMode(compareCheck.checked);
  });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (compareCheck.checked) {
      renderCompare(input.value, compareInput.value);
    } else {
      render(input.value, graftCheck.checked ? scionInput.value : undefined);
    }
  });

  var params = new URL(location.href).searchParams;
  var fromWord = params.get("word");
  var fromGraft = params.get("graft");
  var fromCompare = params.get("compare");
  if (fromGraft) {
    graftCheck.checked = true;
    setGraftMode(true);
    input.value = fromWord || "";
    scionInput.value = fromGraft;
    render(fromWord || "", fromGraft);
  } else if (fromCompare) {
    compareCheck.checked = true;
    setCompareMode(true);
    input.value = fromWord || "";
    compareInput.value = fromCompare;
    renderCompare(fromWord || "", fromCompare);
  } else if (fromWord) {
    input.value = fromWord;
    render(fromWord);
  } else {
    render("");
  }
})();
