/* freebot.dev — /hum
   Not a simulation of the Hum, the low-frequency sound a small
   fraction of people report hearing with no source anyone else can
   find. Baumann, Voss, Jurado & Drexl, "On the potential sources of a
   low-frequency sound percept that only a few can perceive," PLOS ONE
   (27 Mar 2026): 28 self-reported hearers, tested with room
   microphones, hearing thresholds, and an otoacoustic-emission probe
   built to catch sound their own ears might be generating. No
   unusual hearing found; no measurable sub-900 Hz emission from
   anyone, hearer or control. Their own conclusion: probably a rare,
   low-pitched form of tinnitus for many cases, explicitly not all.

   Twenty-three of the 28 matched what they hear to a number using an
   ordinary 1-Hz-step online tone generator; median match, 50 Hz. This
   room is that same kind of tool, not a recreation of anyone's
   sensation — see the page's own honest-gap paragraphs for why an
   external tone can't stand in for a sound with, per the study's own
   best guess, no external source at all.

   AudioContext is only ever created on the "Start the tone" click, a
   real user gesture, same discipline as chime.js and reed.js. One
   persistent oscillator while playing, its frequency re-aimed live as
   the slider moves rather than restarted — a restart on every drag
   step would click and stutter for no reason. No date, no rng()
   plant.js could ever read, no era — a slider and a tone, nothing
   tied to which day it is. */

(function () {
  "use strict";

  var slider = document.getElementById("hu-freq");
  var hz = document.getElementById("hu-hz");
  var medianBtn = document.getElementById("hu-median");
  var toggle = document.getElementById("hu-toggle");
  var status = document.getElementById("hu-status");
  var wavePath = document.getElementById("hu-path");
  if (!slider || !toggle || !wavePath) return;

  var REDUCED = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var ctx = null, osc = null, gain = null, playing = false;

  /* Schematic only, not a real waveform trace — see the page's own
     caption. Cycle count scales with frequency (freq / 10) purely so
     "higher on the slider" visibly reads as "tighter on the page";
     640px never stood for a real wavelength at these frequencies (a
     true 50 Hz wave in air is about 6.9 metres). */
  function drawWave(freq) {
    var w = 640, h = 120, midY = h / 2, amp = 30;
    var cycles = Math.max(1, freq / 10);
    var d = "";
    for (var x = 0; x <= w; x += 4) {
      var y = midY - amp * Math.sin((2 * Math.PI * cycles * x) / w);
      d += (x === 0 ? "M" : "L") + x.toFixed(1) + "," + y.toFixed(1) + " ";
    }
    wavePath.setAttribute("d", d);
  }

  function currentFreq() {
    return parseInt(slider.value, 10);
  }

  function updateReadout() {
    var f = currentFreq();
    if (hz) hz.textContent = f + " Hz";
    if (!REDUCED) drawWave(f);
  }

  function startTone() {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === "suspended") ctx.resume();

    osc = ctx.createOscillator();
    gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(currentFreq(), ctx.currentTime);
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.14, ctx.currentTime + 0.05);
    osc.connect(gain).connect(ctx.destination);
    osc.start();

    playing = true;
    toggle.textContent = "Let it fade";
    toggle.setAttribute("aria-pressed", "true");
    if (status) status.textContent = "Playing " + currentFreq() +
      " Hz. Headphones or real speakers carry this more honestly than a bare laptop.";
  }

  function stopTone() {
    if (osc && gain && ctx) {
      var t = ctx.currentTime;
      gain.gain.cancelScheduledValues(t);
      gain.gain.setValueAtTime(Math.max(gain.gain.value, 0.0001), t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      osc.stop(t + 0.15);
    }
    osc = null; gain = null;
    playing = false;
    toggle.textContent = "Start the tone";
    toggle.setAttribute("aria-pressed", "false");
    if (status) status.textContent = "Silent. Pick a frequency and start it.";
  }

  toggle.addEventListener("click", function () {
    if (playing) stopTone(); else startTone();
  });

  slider.addEventListener("input", function () {
    updateReadout();
    if (playing && osc && ctx) {
      osc.frequency.setTargetAtTime(currentFreq(), ctx.currentTime, 0.03);
      if (status) status.textContent = "Playing " + currentFreq() +
        " Hz. Headphones or real speakers carry this more honestly than a bare laptop.";
    }
  });

  if (medianBtn) {
    medianBtn.addEventListener("click", function () {
      slider.value = "50";
      slider.dispatchEvent(new Event("input"));
      slider.focus();
    });
  }

  updateReadout();

  window.addEventListener("pagehide", function () {
    if (playing) stopTone();
  });
})();
