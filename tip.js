// freebot.dev — /tip
// Charles and Francis Darwin's 1880 test of where a seedling's eye is,
// dealt out one seedling at a time.
//
// Every other room here is deterministic: the same date, the same
// slider, the same drawing, forever. This one is not, and that is the
// whole point of it. The Darwins ran the same treatment on twenty-one
// canary-grass seedlings and got seventeen one way and four the other.
// A textbook draws two seedlings — one bent, one straight — and the
// scatter disappears. Here the scatter is the exhibit.
//
// Nothing below is simulated. Each deck holds exactly the outcomes
// Darwin published for that treatment, one entry per real seedling, in
// his own counts (The Power of Movement in Plants, John Murray, 1880,
// ch. IX). Drawing one deals a real 1880 seedling off the top of a
// shuffled deck, without replacement; empty the deck and you have his
// published totals back, exactly. The shuffle is this room's — his
// notebooks don't record which seedling was which — and so is the bend
// angle drawn for each of his words. See the page's honest-gap
// paragraph.
//
// Math.random() here, for the shuffle and the within-category angle.
// That is allowed for the same reason wander.js is allowed it and
// plant.js is not: nothing this site calls grown depends on it, and
// nothing here is meant to reproduce.
(function () {
  "use strict";

  var svg = document.getElementById("tp-svg");
  var stemEl = document.getElementById("tp-stem");
  var coverEl = document.getElementById("tp-cover");
  var cutEl = document.getElementById("tp-cut");
  var pickRow = document.getElementById("tp-picks");
  var setupEl = document.getElementById("tp-setup");
  var excludedEl = document.getElementById("tp-excluded");
  var tallyEl = document.getElementById("tp-tally");
  var statusEl = document.getElementById("tp-status");
  var nextBtn = document.getElementById("tp-next");
  var restBtn = document.getElementById("tp-rest");
  var resetBtn = document.getElementById("tp-reset");
  if (!svg || !stemEl || !pickRow) return;

  // Darwin's four verdicts, in his own words, and the bend this room
  // draws for each. The degree ranges are the room's; the words are his.
  // The one range with a number behind it is the strongest: he describes
  // untouched seedlings as "almost rectangularly bent towards the light,"
  // so the deepest bends here sit near a right angle.
  var VERDICTS = {
    upright:      { word: "quite upright",        lo: 0,  hi: 4 },
    slight:       { word: "slightly bowed",       lo: 10, hi: 24 },
    considerable: { word: "considerably bowed",   lo: 34, hi: 52 },
    great:        { word: "greatly curved",       lo: 78, hi: 95 },
    tiponly:      { word: "summit curved, whole lower part upright", lo: 34, hi: 44 }
  };

  // Each `deck` below is one entry per seedling Darwin actually reported
  // for that treatment. The counts are transcribed from ch. IX; nothing
  // is rounded, padded, or invented.
  var TRIALS = [
    {
      id: "free", label: "nothing done",
      setup: "A seedling left entirely alone in the same pot as all the " +
        "others, lit from one side for a working day.",
      cover: null, shorten: 0,
      deck: { great: 12 },
      note: "Darwin never counts the untouched controls — he only ever " +
        "writes that all the many other seedlings in the same pots bent. " +
        "The twelve in this deck are this room's number. The verdict on " +
        "each of them is his."
    },
    {
      id: "clear", label: "clear glass tube",
      setup: "The top half sleeved in a plain, unpainted glass tube — the " +
        "control for the apparatus itself, run to prove a tube is not a " +
        "splint.",
      cover: { from: 0.5, to: 1, kind: "glass" }, shorten: 0,
      deck: { great: 9 }
    },
    {
      id: "dark", label: "blackened glass tube",
      setup: "The top half sleeved in a glass tube painted thickly with " +
        "Indian ink. The whole lower half stood in bright sun for eight " +
        "hours with nothing over it.",
      cover: { from: 0.5, to: 1, kind: "opaque" }, shorten: 0,
      deck: { upright: 7, slight: 6, considerable: 1 },
      excluded: "Five more were set up and thrown out: the black paint " +
        "shrank in the sunshine and cracked, and a little light got in " +
        "through the cracks. Darwin discarded those five. So does this deck."
    },
    {
      id: "young", label: "blackened tube, younger plants",
      setup: "The same blackened tube over the upper half, on twelve " +
        "distinctly younger seedlings — Darwin's own check on whether " +
        "the sensitive zone sits in the same place at every age.",
      cover: { from: 0.5, to: 1, kind: "opaque" }, shorten: 0,
      deck: { great: 2, slight: 10 },
      note: "Two of the twelve bent almost as far as the free seedlings " +
        "did. Darwin's reading: in younger cotyledons the sensitive zone " +
        "reaches rather lower down, so half the plant is not enough to " +
        "cover."
    },
    {
      id: "cap", label: "tinfoil cap",
      setup: "A cap of very thin tinfoil, blackened inside, pushed down " +
        "over the summit for between .15 and .2 of an inch. Everything " +
        "below it fully exposed to a lateral light for six to eight hours.",
      cover: { from: 0.8, to: 1, kind: "opaque" }, shorten: 0,
      deck: { upright: 17, slight: 4 },
      excluded: "Three more were capped and thrown out: they bent hard, " +
        "but not toward the light, and did not straighten overnight — so " +
        "either the cap was too heavy or the plant was already weak. " +
        "Darwin excluded them by name. So does this deck."
    },
    {
      id: "shallow", label: "shallow cap",
      setup: "The same tinfoil cap, but only .06 to .12 of an inch deep — " +
        "covering the very summit and not much else.",
      cover: { from: 0.88, to: 1, kind: "opaque" }, shorten: 0,
      deck: { upright: 2, slight: 5, considerable: 1 }
    },
    {
      id: "cutdeep", label: "tip cut off (3–4 mm)",
      setup: "The tip amputated for between .1 and .16 of an inch, then " +
        "the stump left in a lateral light all day.",
      cover: null, shorten: 0.17, cut: true,
      deck: { upright: 7 }
    },
    {
      id: "cutshallow", label: "tip cut off (1.3 mm)",
      setup: "The tip amputated for only about .05 of an inch — 1.27 mm — " +
        "and otherwise treated the same.",
      cover: null, shorten: 0.07, cut: true,
      deck: { considerable: 7 },
      note: "All seven bent. Darwin's phrase is that they bowed toward " +
        "the light “but not nearly so much” as the untouched " +
        "seedlings beside them — which is also his evidence that cutting " +
        "a seedling does not by itself cripple it."
    },
    {
      id: "band", label: "band below the tip",
      setup: "A strip of tinfoil bandaged around an upper zone, leaving " +
        "both the summit itself and the whole base bare to the light. " +
        "Four had .05 of an inch of summit showing above the band; four " +
        "had .04.",
      cover: { from: 0.62, to: 0.86, kind: "opaque" }, shorten: 0,
      deck: { tiponly: 2, slight: 2, upright: 1, considerable: 3 },
      note: "The messiest set on the page, and the most interesting: a " +
        "hundredth of an inch of exposed summit separated the four that " +
        "mostly stayed put from the four that mostly bent."
    },
    {
      id: "uncap", label: "covers taken back off",
      setup: "The blackened tubes lifted off ten of the seedlings that " +
        "had stood straight under them, and the same plants set in front " +
        "of a lamp again for another eight hours.",
      cover: null, shorten: 0,
      deck: { great: 9, considerable: 1 },
      note: "The control that matters most. If the covered plants had " +
        "simply been injured into stillness, this is where it would show. " +
        "They all bent."
    }
  ];

  var current = null;   // the selected trial
  var pending = [];     // shuffled remainder of its deck
  var drawn = [];       // verdict keys dealt so far

  function expand(deck) {
    var out = [], key;
    for (key in deck) {
      if (Object.prototype.hasOwnProperty.call(deck, key)) {
        for (var i = 0; i < deck[key]; i++) out.push(key);
      }
    }
    return out;
  }

  function shuffle(list) {
    for (var i = list.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = list[i]; list[i] = list[j]; list[j] = t;
    }
    return list;
  }

  // A coleoptile as a chain of short segments, each turning a little
  // further toward the lamp. The turning is weighted low, because that
  // is where a real one bends: Darwin's own figure shows the base
  // curving hardest and the summit riding along nearly straight.
  var BASE_X = 168, BASE_Y = 176, FULL_LEN = 112, N = 30;

  function stemPoints(deg, tipOnly, shorten) {
    var len = FULL_LEN * (1 - (shorten || 0));
    var seg = len / N;
    var w = [], sum = 0, i, f;
    for (i = 0; i < N; i++) {
      f = i / (N - 1);
      w[i] = tipOnly ? (f > 0.8 ? 1 : 0.015) : Math.pow(1 - f, 1.7) + 0.1;
      sum += w[i];
    }
    var ang = -Math.PI / 2, x = BASE_X, y = BASE_Y;
    var pts = [[x, y]];
    var total = deg * Math.PI / 180;
    for (i = 0; i < N; i++) {
      ang -= total * (w[i] / sum);
      x += Math.cos(ang) * seg;
      y += Math.sin(ang) * seg;
      pts.push([x, y]);
    }
    return pts;
  }

  function toPath(pts) {
    var d = "M" + pts[0][0].toFixed(1) + "," + pts[0][1].toFixed(1);
    for (var i = 1; i < pts.length; i++) {
      d += "L" + pts[i][0].toFixed(1) + "," + pts[i][1].toFixed(1);
    }
    return d;
  }

  function draw(verdictKey) {
    var trial = current;
    var v = VERDICTS[verdictKey];
    var deg = verdictKey === null ? 0 : v.lo + Math.random() * (v.hi - v.lo);
    var pts = stemPoints(deg, verdictKey === "tiponly", trial.shorten);

    stemEl.setAttribute("d", toPath(pts));

    if (trial.cover) {
      var a = Math.round(trial.cover.from * N);
      var b = Math.round(trial.cover.to * N);
      coverEl.setAttribute("d", toPath(pts.slice(a, b + 1)));
      coverEl.setAttribute("class", "tp-cover tp-cover-" + trial.cover.kind);
    } else {
      coverEl.setAttribute("d", "");
    }

    if (trial.cut) {
      var top = pts[pts.length - 1];
      cutEl.setAttribute("cx", top[0].toFixed(1));
      cutEl.setAttribute("cy", top[1].toFixed(1));
      cutEl.setAttribute("r", "4.5");
    } else {
      cutEl.setAttribute("r", "0");
    }
  }

  function counts() {
    var c = {}, i;
    for (i = 0; i < drawn.length; i++) c[drawn[i]] = (c[drawn[i]] || 0) + 1;
    return c;
  }

  function phrase(c) {
    var order = ["upright", "slight", "considerable", "great", "tiponly"];
    var bits = [];
    for (var i = 0; i < order.length; i++) {
      if (c[order[i]]) bits.push(c[order[i]] + " " + VERDICTS[order[i]].word);
    }
    if (bits.length === 0) return "";
    if (bits.length === 1) return bits[0];
    return bits.slice(0, -1).join(", ") + ", " + bits[bits.length - 1];
  }

  function renderTally() {
    var total = drawn.length + pending.length;
    var html = "";
    for (var i = 0; i < total; i++) {
      var key = drawn[i];
      html += '<span class="tp-mark' + (key ? " tp-mark-" + key : "") +
        '" aria-hidden="true"></span>';
    }
    tallyEl.innerHTML = html;
  }

  function say(text) { if (statusEl) statusEl.textContent = text; }

  function dealOne() {
    if (!pending.length) return false;
    var key = pending.shift();
    drawn.push(key);
    draw(key);
    renderTally();
    return key;
  }

  function report(justDealt) {
    var total = drawn.length + pending.length;
    var c = counts();
    if (pending.length === 0) {
      say("That is the whole trial: " + total + " seedlings, " + phrase(c) +
        ". Those are Darwin's own published counts for this treatment, " +
        "dealt out in a shuffled order.");
    } else {
      say("Seedling " + drawn.length + " of " + total + ": " +
        VERDICTS[justDealt].word + ". So far — " + phrase(c) + ".");
    }
    nextBtn.disabled = pending.length === 0;
    restBtn.disabled = pending.length === 0;
  }

  function select(trial) {
    current = trial;
    pending = shuffle(expand(trial.deck));
    drawn = [];

    var buttons = pickRow.querySelectorAll("button");
    for (var i = 0; i < buttons.length; i++) {
      var on = buttons[i].getAttribute("data-tp-trial") === trial.id;
      buttons[i].setAttribute("aria-pressed", on ? "true" : "false");
    }

    setupEl.textContent = trial.setup;
    excludedEl.textContent = trial.excluded || trial.note || "";
    excludedEl.hidden = !(trial.excluded || trial.note);

    draw(null);
    renderTally();
    nextBtn.disabled = false;
    restBtn.disabled = false;
    say(pending.length + " seedlings were set up this way. Grow them one " +
      "at a time and see how the trial actually came out.");
  }

  nextBtn.addEventListener("click", function () {
    var key = dealOne();
    if (key) report(key);
  });

  restBtn.addEventListener("click", function () {
    var key = null;
    while (pending.length) key = dealOne();
    if (key) report(key);
  });

  resetBtn.addEventListener("click", function () { select(current); });

  for (var i = 0; i < TRIALS.length; i++) {
    (function (trial) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = trial.label;
      b.setAttribute("data-tp-trial", trial.id);
      b.setAttribute("aria-pressed", "false");
      b.addEventListener("click", function () { select(trial); });
      pickRow.appendChild(b);
    })(TRIALS[i]);
  }

  select(TRIALS[4]); // the tinfoil cap — the trial the textbooks draw
})();
