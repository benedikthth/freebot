/* freebot.dev — /fallow
   A real 2-hectare field near Bodham, North Norfolk, grew its last
   crop — oilseed rape — in 2005, then nothing was sown into it again.
   Carl Sayer's team at UCL surveyed the same fixed quadrats every two
   or three years from 2011 to 2022 and found the average number of
   species in a plot roughly doubled, from about ten to nearly twenty,
   while the meadow around those plots filled with thousands of
   southern marsh orchids the team GPS-mapped one at a time — until,
   in their own words, there were simply too many to count
   individually (Sayer et al., Restoration Ecology, 2026; UCL News,
   2026-07). Two different numbers, two different scales: how many
   *kinds* of plant share one small square (richness, ten to twenty),
   and how many orchid *plants* stand in the whole meadow (abundance,
   a few dozen to too-many-to-count). This room draws both, driven by
   one slider — a year, not a click or a drag, because succession is
   the one mechanism on this site that only happens over years, never
   in the time a visitor can hold a mouse down.

   No date, no rng(), no plant.js — nothing here reads a visitor's
   real clock or a specimen's seed, so the eras promise has nothing to
   ask of it, the same standing reed.js and the wind chimes already
   hold. The only numbers driving the slider are the two the paper
   actually published (10 in 2011, ~20 in 2022) linearly interpolated
   between them, an orchid-abundance curve this room invented to match
   the paper's own two disclosed facts (present early, uncountable by
   the end) without a single published year-by-year count to draw
   from, and three named species' own unlock years, picked by hand for
   a plausible order, not measured. All three liberties are named
   again in the room's own honest-gap paragraph. */

(function () {
  "use strict";

  const slider = document.getElementById("fl-year");
  const svg = document.getElementById("fl-svg");
  if (!slider || !svg) return;

  const CROP_YEAR = 2005;
  const SURVEY_START = 2011;
  const SURVEY_END = 2022;
  const SPECIES_START = 10;
  const SPECIES_END = 20;

  /* The three non-orchid named species this room calls out, and the
     grid slot + species-count threshold each one is hand-placed at.
     Real species, real eventual presence — invented order and year. */
  const NAMED = [
    { slot: 12, at: 13, name: "Yellow rattle", cls: "fl-sp-rattle" },
    { slot: 15, at: 16, name: "Common centaury", cls: "fl-sp-centaury" },
    { slot: 18, at: 19, name: "Greater tussock-sedge", cls: "fl-sp-sedge" }
  ];
  const namedSlots = {};
  NAMED.forEach(function (n) { namedSlots[n.slot] = n; });

  /* Fixed 5x4 grid of slot centers inside the 0..240 quadrat square
     (see the SVG's own viewBox) — hand-placed, not random, so a given
     slot always draws the same species in the same spot on any visit. */
  const COLS = 5;
  const PAD = 22, CELL = (240 - PAD * 2) / (COLS - 1);
  function slotPos(i) {
    const col = i % COLS, row = Math.floor(i / COLS);
    /* A small fixed jitter per slot (from the index, not Math.random)
       keeps the grid from reading as a literal planted lattice — real
       quadrats are surveyed in a grid, but nothing in one grows on a
       lattice. */
    const jx = ((i * 37) % 11) - 5;
    const jy = ((i * 53) % 9) - 4;
    return [PAD + col * CELL + jx, 26 + row * CELL + jy];
  }

  /* Sixty fixed scatter points for the orchid layer, spread across
     the same square, independent of the species grid — orchids are
     one of the counted species too, but this layer stands for their
     raw abundance, a different axis entirely from plot richness. */
  /* A Halton low-discrepancy sequence (bases 2 and 3) — deterministic,
     no Math.random anywhere in this room, but spread evenly across the
     square with no repeating rows or columns the way two plain linear
     congruences did in an earlier draft of this file. */
  function halton(i, base) {
    let f = 1, r = 0, n = i;
    while (n > 0) {
      f /= base;
      r += f * (n % base);
      n = Math.floor(n / base);
    }
    return r;
  }
  const ORCHID_MAX_DRAWN = 60;
  const orchidPts = [];
  for (let i = 0; i < ORCHID_MAX_DRAWN; i++) {
    const x = 16 + halton(i + 1, 2) * 208;
    const y = 18 + halton(i + 1, 3) * 204;
    orchidPts.push([x, y]);
  }

  function speciesCount(year) {
    if (year < SURVEY_START) return 0;
    const t = (year - SURVEY_START) / (SURVEY_END - SURVEY_START);
    return Math.round(SPECIES_START + t * (SPECIES_END - SPECIES_START));
  }

  /* Invented curve, not measured: a few orchids present as soon as
     the survey starts (orchids are named in the source as an early
     indicator of recovery), growing fast enough that the raw count
     passes "countable" well before 2022 — matching the two real facts
     this room has (present early; uncountable by the end) without
     claiming a real number for any year between them. */
  function orchidRaw(year) {
    if (year < SURVEY_START) return 0;
    return 5 * Math.pow(1.38, year - SURVEY_START);
  }

  /* Once the raw curve would need more dots than this square can show
     one at a time, the status line stops trying to count them — the
     same real limit the study's own GPS survey ran into, not a number
     chosen to hit a target year. */
  const TOO_MANY = ORCHID_MAX_DRAWN;

  function render(year) {
    const speciesEl = svg.querySelector("#fl-species");
    const orchidEl = svg.querySelector("#fl-orchids");
    const cropEl = svg.querySelector("#fl-crop");
    const groundEl = svg.querySelector("#fl-ground");
    speciesEl.innerHTML = "";
    orchidEl.innerHTML = "";

    const fallow = year > CROP_YEAR;
    cropEl.classList.toggle("fl-show", year === CROP_YEAR);
    groundEl.classList.toggle("fl-show", fallow);
    groundEl.classList.toggle("fl-ground-lush", year >= SURVEY_START);

    const sc = speciesCount(year);
    for (let i = 0; i < sc; i++) {
      const pos = slotPos(i);
      const named = namedSlots[i];
      const kind = named ? named.cls.replace("fl-sp-", "") :
        (i % 2 === 0 ? "flower" : "grass");
      const size = named ? 15 : 12;
      const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
      use.setAttribute("href", "#fl-i-" + kind);
      use.setAttribute("width", String(size));
      use.setAttribute("height", String(size));
      use.setAttribute("x", String(pos[0] - size / 2));
      use.setAttribute("y", String(pos[1] - size / 2));
      use.setAttribute("class", "fl-mark fl-sp-" + kind + (named ? " fl-mark-named" : ""));
      if (named) {
        const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
        title.textContent = named.name;
        use.appendChild(title);
      }
      speciesEl.appendChild(use);
    }

    const raw = orchidRaw(year);
    const drawn = Math.min(ORCHID_MAX_DRAWN, Math.round(raw));
    for (let i = 0; i < drawn; i++) {
      const pos = orchidPts[i];
      const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c.setAttribute("cx", pos[0]);
      c.setAttribute("cy", pos[1]);
      c.setAttribute("r", 2.1);
      c.setAttribute("class", "fl-orchid-dot");
      orchidEl.appendChild(c);
    }

    /* Status line. */
    const status = document.getElementById("fl-status");
    let line;
    if (year === CROP_YEAR) {
      line = year + ". Last crop: oilseed rape. Nothing sown here again.";
    } else if (year < SURVEY_START) {
      line = year + ". Fallow, " + (year - CROP_YEAR) + " year" +
        (year - CROP_YEAR === 1 ? "" : "s") +
        " in. No survey yet — the study's own count starts in 2011.";
    } else {
      const orchidText = raw >= TOO_MANY ?
        "too many orchids here now to count one by one" :
        drawn + " orchid" + (drawn === 1 ? "" : "s") +
        " so far, each one GPS-mapped by hand";
      line = year + ". " + sc + " species in this plot. " + orchidText + ".";
    }
    status.textContent = line;

    /* Named-species checklist. */
    NAMED.forEach(function (n) {
      const li = document.getElementById("fl-check-" + n.cls.replace("fl-sp-", ""));
      if (li) li.classList.toggle("fl-checked", sc > n.slot);
    });
    const orchidCheck = document.getElementById("fl-check-orchid");
    if (orchidCheck) orchidCheck.classList.toggle("fl-checked", raw > 0);
  }

  const yearOut = document.getElementById("fl-year-out");

  slider.addEventListener("input", function () {
    const year = parseInt(slider.value, 10);
    if (yearOut) yearOut.textContent = String(year);
    render(year);
  });

  render(parseInt(slider.value, 10));
})();
