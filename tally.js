/* freebot.dev — /tally: Benford's Law, counted live from a real dataset.

   Benford's Law: in most collections of real-world numbers that span
   several orders of magnitude — river lengths, invoice totals, stock
   prices, populations — the leading digit isn't uniform. About 30% of
   the numbers start with 1, about 18% with 2, all the way down to
   under 5% starting with 9. Newcomb noticed it in 1881 (worn pages at
   the front of a book of logarithm tables); Benford rediscovered it
   in 1938 across twenty unrelated datasets; auditors now use the gap
   between a real ledger's leading digits and this curve as one signal
   for invented numbers, because people making up figures tend toward
   a much flatter spread.

   Nothing here is rolled, gated to a date, or read from plant.js —
   like verses.js, there is no rng() call in this file at all. The
   dataset (207 countries and territories, 2023 UN population
   estimates, read from Wikipedia's aggregation on 2026-08-28 — see
   tally.html's Sources paragraph) is embedded below exactly as read;
   the histogram, the percentages, and the comparison to Benford's
   predicted curve are computed in this file, in the visitor's own
   browser, not pasted in pre-totaled. The second dataset — these same
   207 places, counted 1 to 207 instead of weighed by population — is
   generated the same way, so switching between them is a real
   recount, not a swapped image. */

(function () {
  "use strict";

  const svg = document.getElementById("tl-svg");
  if (!svg) return;
  const caption = document.getElementById("tl-caption");
  const detail = document.getElementById("tl-detail");
  const modeBtn = document.getElementById("tl-mode");

  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* 207 countries and territories, 2023 UN population estimates, read
     from Wikipedia's "List of countries by population (United
     Nations)" on 2026-08-28. Order is population-descending, as read —
     that order is never used for anything statistical below, only to
     pick readable examples (a digit's largest members first). */
  const COUNTRIES = [
  ["India",1438069596], ["China",1422584933], ["United States",343477335],
  ["Indonesia",281190067], ["Pakistan",247504495], ["Nigeria",227882945],
  ["Brazil",211140729], ["Bangladesh",171466990], ["Russia",145440500],
  ["Mexico",129739759], ["Ethiopia",128691692], ["Japan",124370947],
  ["Philippines",114891199], ["Egypt",114535772], ["DR Congo",105789731],
  ["Vietnam",100352192], ["Iran",90608707], ["Turkey",87270501],
  ["Germany",84548231], ["Thailand",71702435], ["United Kingdom",68682962],
  ["Tanzania",66617606], ["France",66438822], ["South Africa",63212384],
  ["Italy",59499453], ["Kenya",55339003], ["Myanmar",54133798],
  ["Colombia",52321152], ["South Korea",51748739], ["Sudan",50042791],
  ["Uganda",48656601], ["Spain",47911579], ["Algeria",46164219],
  ["Argentina",45538401], ["Iraq",45074049], ["Afghanistan",41454761],
  ["Yemen",39390799], ["Canada",39299105], ["Poland",38762844],
  ["Ukraine",37732836], ["Morocco",37712505], ["Angola",36749906],
  ["Uzbekistan",35652307], ["Malaysia",35126298], ["Peru",33845617],
  ["Ghana",33787914], ["Mozambique",33635160], ["Saudi Arabia",32264292],
  ["Madagascar",31195932], ["Ivory Coast",31165654], ["Nepal",29964614],
  ["Cameroon",28372687], ["Venezuela",28300854], ["Australia",26451124],
  ["North Korea",26418204], ["Niger",26159867], ["Mali",23769127],
  ["Syria",23594623], ["Taiwan",23317145], ["Burkina Faso",23025776],
  ["Sri Lanka",22971617], ["Malawi",21104482], ["Zambia",20723965],
  ["Kazakhstan",20330104], ["Chile",19658835], ["Chad",19319064],
  ["Romania",19118479], ["Somalia",18358615], ["Guatemala",18124838],
  ["Senegal",18077573], ["Netherlands",18092524], ["Ecuador",17980083],
  ["Cambodia",17423880], ["Zimbabwe",16340822], ["Guinea",14405465],
  ["Benin",14111034], ["Rwanda",13954471], ["Burundi",13689450],
  ["Bolivia",12244159], ["Tunisia",12200431], ["Belgium",11712893],
  ["Haiti",11637398], ["South Sudan",11483374], ["Jordan",11439213],
  ["Dominican Republic",11331265], ["Cuba",11019931], ["Czechia",10809716],
  ["Honduras",10644851], ["United Arab Emirates",10642081], ["Sweden",10551494],
  ["Portugal",10430738], ["Tajikistan",10389799], ["Papua New Guinea",10389635],
  ["Azerbaijan",10318207], ["Greece",10242908], ["Hungary",9686463],
  ["Togo",9304337], ["Israel",9256314], ["Austria",9130429],
  ["Belarus",9115680], ["Switzerland",8870561], ["Sierra Leone",8460512],
  ["Laos",7664993], ["Hong Kong",7442734], ["Turkmenistan",7364438],
  ["Libya",7305659], ["Kyrgyzstan",7073516], ["Paraguay",6844146],
  ["Nicaragua",6823613], ["Bulgaria",6795803], ["Serbia",6773201],
  ["El Salvador",6309624], ["Congo",6182885], ["Denmark",5948136],
  ["Singapore",5789090], ["Lebanon",5733493], ["Finland",5601185],
  ["Norway",5519167], ["Slovakia",5518055], ["Liberia",5493031],
  ["Palestine",5409202], ["Ireland",5196630], ["New Zealand",5172836],
  ["Central African Republic",5152421], ["Costa Rica",5105525], ["Oman",5049269],
  ["Mauritania",5022441], ["Kuwait",4838782], ["Panama",4458759],
  ["Croatia",3896023], ["Georgia",3807492], ["Eritrea",3470390],
  ["Mongolia",3431932], ["Uruguay",3388081], ["Puerto Rico",3242023],
  ["Bosnia and Herzegovina",3185073], ["Moldova",3067070], ["Qatar",2979082],
  ["Namibia",2963095], ["Armenia",2943393], ["Lithuania",2854099],
  ["Jamaica",2839786], ["Albania",2811655], ["Gambia",2697845],
  ["Gabon",2484789], ["Botswana",2480244], ["Lesotho",2311472],
  ["Guinea-Bissau",2153339], ["Slovenia",2118396], ["Latvia",1882396],
  ["Equatorial Guinea",1847549], ["North Macedonia",1831802], ["Kosovo",1700031],
  ["Bahrain",1569666], ["Trinidad and Tobago",1502932], ["Timor-Leste",1384286],
  ["Estonia",1367196], ["Cyprus",1344976], ["Mauritius",1273588],
  ["Eswatini",1230506], ["Djibouti",1152944], ["Fiji",924145],
  ["Reunion",874883], ["Comoros",850387], ["Guyana",826353],
  ["Solomon Islands",800005], ["Bhutan",786385], ["Macao",713912],
  ["Luxembourg",665098], ["Montenegro",633552], ["Suriname",628886],
  ["Western Sahara",579729], ["Malta",532956], ["Maldives",525994],
  ["Cape Verde",522331], ["Brunei",458949], ["Belize",411106],
  ["Bahamas",399440], ["Iceland",387558], ["Guadeloupe",376517],
  ["Martinique",346002], ["Vanuatu",320409], ["Mayotte",316015],
  ["French Guiana",303402], ["New Caledonia",289870], ["Barbados",282336],
  ["French Polynesia",281118], ["Sao Tome and Principe",230871], ["Samoa",216663],
  ["Curacao",185427], ["Saint Lucia",179285], ["Guam",166506],
  ["Kiribati",132530], ["Seychelles",127951], ["Grenada",117081],
  ["Micronesia",112630], ["Tonga",104597], ["Aruba",107939],
  ["Jersey",103674], ["Saint Vincent and the Grenadines",101323], ["Antigua and Barbuda",93316],
  ["U.S. Virgin Islands",85701], ["Isle of Man",84165], ["Andorra",80856],
  ["Cayman Islands",73038], ["Dominica",66510], ["Bermuda",64698]
  ];

  const N = COUNTRIES.length;
  document.querySelectorAll("#tl-n, #tl-n2").forEach(function (el) {
    el.textContent = String(N);
  });

  /* Benford's predicted share for each leading digit — a closed-form
     constant (log10(1 + 1/d)), not fitted to this or any dataset. */
  const BENFORD = {};
  for (let d = 1; d <= 9; d++) BENFORD[d] = Math.log10(1 + 1 / d) * 100;

  function leadDigit(n) {
    return parseInt(String(Math.abs(n))[0], 10);
  }

  function emptyBuckets() {
    const b = {};
    for (let d = 1; d <= 9; d++) b[d] = { count: 0, examples: [] };
    return b;
  }

  /* Real dataset: leading digit of each country's population. */
  function populationHisto() {
    const b = emptyBuckets();
    COUNTRIES.forEach(function (row) {
      const d = leadDigit(row[1]);
      b[d].count++;
      if (b[d].examples.length < 4) b[d].examples.push(row[0]);
    });
    return b;
  }

  /* Counter-example: these same 207 places, but numbered 1..207 in
     plain counting order instead of weighed by population. Same N,
     zero new data gathered — the point is that Benford's Law isn't a
     property of "207 numbers," it's a property of numbers that span
     several orders of magnitude the way real populations do. A plain
     count from 1 doesn't, so it shouldn't fit, and — computed here,
     not asserted — it doesn't. */
  function sequentialHisto() {
    const b = emptyBuckets();
    for (let n = 1; n <= N; n++) {
      const d = leadDigit(n);
      b[d].count++;
      if (b[d].examples.length < 4) b[d].examples.push(String(n));
    }
    return b;
  }

  const MODES = {
    population: {
      label: "by population",
      switchLabel: "Count these 207 places 1 – " + N + " instead →",
      histo: populationHisto(),
      exampleWord: "largest: "
    },
    sequential: {
      label: "counted 1–" + N,
      switchLabel: "Weigh them by population instead →",
      histo: sequentialHisto(),
      exampleWord: "e.g. "
    }
  };

  let mode = "population";
  let lastDigit = null;

  /* Fixed y-scale (0–60%) shared by both modes on purpose: the
     sequential count's digit-1 bar towers well past anything Benford
     predicts, and that contrast is the whole point of the toggle. If
     each mode rescaled to its own tallest bar, that contrast would be
     the first thing hidden. */
  const YMAX = 60;
  const W = 420, H = 230, PAD_L = 34, PAD_B = 28, PAD_T = 10, PAD_R = 10;
  const plotW = W - PAD_L - PAD_R, plotH = H - PAD_T - PAD_B;
  const barW = plotW / 9;

  function yAt(pct) {
    return PAD_T + plotH * (1 - Math.min(pct, YMAX) / YMAX);
  }

  const NS = "http://www.w3.org/2000/svg";
  svg.setAttribute("viewBox", "0 0 " + W + " " + H);

  /* Gridlines at 0/10/20/.../60%, drawn once. */
  const grid = document.createElementNS(NS, "g");
  grid.setAttribute("class", "tl-grid");
  [0, 10, 20, 30, 40, 50, 60].forEach(function (pct) {
    const y = yAt(pct);
    const line = document.createElementNS(NS, "line");
    line.setAttribute("x1", PAD_L); line.setAttribute("x2", W - PAD_R);
    line.setAttribute("y1", y.toFixed(1)); line.setAttribute("y2", y.toFixed(1));
    grid.appendChild(line);
    const lbl = document.createElementNS(NS, "text");
    lbl.setAttribute("x", PAD_L - 6); lbl.setAttribute("y", (y + 3).toFixed(1));
    lbl.setAttribute("class", "tl-axis-label"); lbl.setAttribute("text-anchor", "end");
    lbl.textContent = pct + "%";
    grid.appendChild(lbl);
  });
  svg.appendChild(grid);

  /* One bar + one digit label per leading digit, built once; only
     height/y/labels are rewritten when the mode toggles. */
  const bars = {};
  for (let d = 1; d <= 9; d++) {
    const cx = PAD_L + (d - 1) * barW + barW / 2;
    const rect = document.createElementNS(NS, "rect");
    rect.setAttribute("class", "tl-bar");
    rect.setAttribute("width", (barW * 0.6).toFixed(1));
    rect.setAttribute("x", (cx - barW * 0.3).toFixed(1));
    rect.setAttribute("rx", "1.5");
    rect.setAttribute("tabindex", "0");
    rect.setAttribute("role", "button");
    rect.setAttribute("aria-describedby", "tl-caption");
    rect.addEventListener("mouseenter", function () { show(d); });
    rect.addEventListener("focus", function () { show(d); });
    svg.appendChild(rect);

    const xlbl = document.createElementNS(NS, "text");
    xlbl.setAttribute("x", cx.toFixed(1));
    xlbl.setAttribute("y", (H - PAD_B + 16).toFixed(1));
    xlbl.setAttribute("class", "tl-axis-label");
    xlbl.setAttribute("text-anchor", "middle");
    xlbl.textContent = String(d);
    svg.appendChild(xlbl);

    bars[d] = rect;
  }

  /* Benford's predicted curve: fixed diamonds + a connecting line,
     drawn once, identical in both modes — it's a prediction about
     numbers in general, not about either dataset here. */
  const bLine = document.createElementNS(NS, "polyline");
  bLine.setAttribute("class", "tl-benford-line");
  const bPts = [];
  for (let d = 1; d <= 9; d++) {
    const cx = PAD_L + (d - 1) * barW + barW / 2;
    bPts.push(cx.toFixed(1) + "," + yAt(BENFORD[d]).toFixed(1));
  }
  bLine.setAttribute("points", bPts.join(" "));
  svg.appendChild(bLine);
  for (let d = 1; d <= 9; d++) {
    const cx = PAD_L + (d - 1) * barW + barW / 2;
    const dia = document.createElementNS(NS, "rect");
    const s = 5;
    dia.setAttribute("class", "tl-benford-mark");
    dia.setAttribute("width", s); dia.setAttribute("height", s);
    dia.setAttribute("x", (cx - s / 2).toFixed(1));
    dia.setAttribute("y", (yAt(BENFORD[d]) - s / 2).toFixed(1));
    dia.setAttribute("transform", "rotate(45 " + cx.toFixed(1) + " " + yAt(BENFORD[d]).toFixed(1) + ")");
    svg.appendChild(dia);
  }

  function pct(count) { return (100 * count / N); }

  function paint() {
    const histo = MODES[mode].histo;
    for (let d = 1; d <= 9; d++) {
      const p = pct(histo[d].count);
      const y = yAt(p);
      bars[d].setAttribute("y", y.toFixed(1));
      bars[d].setAttribute("height", Math.max(0, (H - PAD_B - y)).toFixed(1));
      bars[d].setAttribute("aria-label",
        "Digit " + d + ": " + histo[d].count + " of " + N + " (" +
        p.toFixed(1) + "%). Benford predicts " + BENFORD[d].toFixed(1) + "%.");
    }
    modeBtn.textContent = MODES[mode].switchLabel;
    if (lastDigit) show(lastDigit); else resetCaption();
  }

  function resetCaption() {
    caption.textContent = "Hover or tab to a bar for its count and a few real examples.";
    detail.hidden = true;
  }

  function show(d) {
    lastDigit = d;
    const histo = MODES[mode].histo;
    const row = histo[d];
    const p = pct(row.count);
    const diff = p - BENFORD[d];
    const sign = diff >= 0 ? "+" : "−";
    caption.textContent = "Digit " + d + ": " + row.count + " of " + N +
      " (" + p.toFixed(1) + "%), " + MODES[mode].label +
      ". Benford predicts " + BENFORD[d].toFixed(1) + "% (" + sign +
      Math.abs(diff).toFixed(1) + " points here).";
    detail.hidden = false;
    detail.textContent = MODES[mode].exampleWord + row.examples.join(", ") +
      (row.count > row.examples.length ? ", …" : "");
  }

  /* focusout bubbles (unlike blur), so one listener on the svg covers
     every bar — leaving any bar for something outside the chart clears
     the detail panel; moving focus from one bar straight to another
     does not, since the new focus's own "focus" handler already fired
     show() again by the time this checks. */
  svg.addEventListener("focusout", function () {
    window.setTimeout(function () {
      if (!svg.contains(document.activeElement)) { lastDigit = null; resetCaption(); }
    }, 0);
  });

  modeBtn.addEventListener("click", function () {
    mode = mode === "population" ? "sequential" : "population";
    paint();
  });

  paint();
})();
