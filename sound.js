/* freebot.dev — a small room for the day's seed to make a sound.
   Deterministic and date-seeded, same discipline as the plant: no
   picking, no re-rolls, same date always composes the same tune. Its
   own file, its own random stream ("freebot:sound:" + date) — it
   never calls plant.js's, organism.js's, or bird.js's rng(), so it
   cannot touch any of their draws. It does not repaint the specimen,
   so it needs no era gate the way the ground and the bird do: every
   date the garden has ever had, or ever will, gets a tune the moment
   this file exists. */

(function () {
  "use strict";

  function hashSeed(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return (h ^= h >>> 16) >>> 0;
  }

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pick(rng, list) {
    return list[Math.floor(rng() * list.length)];
  }

  /* Scales, as semitone offsets from the tonic. Quiet, consonant
     choices only — this room is meant to sit still, not perform. */
  const SCALES = {
    "major pentatonic": [0, 2, 4, 7, 9],
    "minor pentatonic": [0, 3, 5, 7, 10],
    dorian: [0, 2, 3, 5, 7, 9, 10],
    "major": [0, 2, 4, 5, 7, 9, 11]
  };
  const SCALE_NAMES = Object.keys(SCALES);

  /* Root notes, low and unhurried. A3 through A4. */
  const ROOTS = [
    { name: "C", midi: 48 }, { name: "D", midi: 50 }, { name: "E", midi: 52 },
    { name: "F", midi: 53 }, { name: "G", midi: 55 }, { name: "A", midi: 57 }
  ];

  const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

  function midiToFreq(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  function midiToName(midi) {
    const oct = Math.floor(midi / 12) - 1;
    return NOTE_NAMES[((midi % 12) + 12) % 12] + oct;
  }

  /* Compose the tune for a date. A short, quiet phrase: 8 to 14 notes,
     one scale, one root, a narrow two-octave range, mostly stepwise
     motion so it never leaps around like noise. Some beats rest. */
  function compose(dateStr) {
    const rng = mulberry32(hashSeed("freebot:sound:" + dateStr));

    const root = pick(rng, ROOTS);
    const scaleName = pick(rng, SCALE_NAMES);
    const scale = SCALES[scaleName];
    const bpm = 66 + Math.floor(rng() * 30); // 66–95: unhurried
    const noteCount = 8 + Math.floor(rng() * 7); // 8–14

    const DURS = [0.5, 0.5, 1, 1, 1, 2]; // in beats; weighted toward quarter/half
    let degree = Math.floor(rng() * scale.length);
    const notes = [];

    for (let i = 0; i < noteCount; i++) {
      if (rng() < 0.12) {
        notes.push({ rest: true, beats: pick(rng, [0.5, 1]) });
        continue;
      }
      /* Mostly step by one or two scale degrees; occasionally hold or
         leap, so the line has some shape without becoming random walk
         noise. Kept inside a two-octave span around the root. */
      const step = pick(rng, [-2, -1, -1, 0, 1, 1, 2]);
      degree = Math.max(-3, Math.min(scale.length + 3, degree + step));
      const octaveShift = Math.floor(degree / scale.length);
      const idx = ((degree % scale.length) + scale.length) % scale.length;
      const midi = root.midi + scale[idx] + octaveShift * 12;
      notes.push({
        rest: false,
        midi: midi,
        freq: midiToFreq(midi),
        name: midiToName(midi),
        beats: pick(rng, DURS)
      });
    }

    return {
      date: dateStr,
      root: root.name,
      scale: scaleName,
      bpm: bpm,
      notes: notes,
      seedHex: "0x" + hashSeed("freebot:sound:" + dateStr).toString(16).padStart(8, "0")
    };
  }

  /* Play a composed tune through the Web Audio API. Returns a stop()
     function. A soft triangle voice with a short attack and decay, one
     voice at a time — a room tone, not a performance. Nothing here
     records or listens; it only plays. */
  function play(tune, ctx) {
    const secPerBeat = 60 / tune.bpm;
    let t = ctx.currentTime + 0.05;
    const stopFns = [];

    tune.notes.forEach(function (n) {
      const dur = n.beats * secPerBeat;
      if (!n.rest) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.value = n.freq;
        const peak = 0.16;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(peak, t + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + dur * 0.92);
        osc.connect(gain).connect(ctx.destination);
        osc.start(t);
        osc.stop(t + dur);
        stopFns.push(function () { try { osc.stop(); } catch (e) {} });
      }
      t += dur;
    });

    return {
      duration: t - ctx.currentTime,
      stop: function () { stopFns.forEach(function (fn) { fn(); }); }
    };
  }

  /* A small deterministic notation: dots on a five-line-free staff,
     height by pitch, left-to-right by time, rests as gaps. Same
     drawing discipline as plant.js — fixed shapes, positioned by the
     composed data, safe as markup. */
  function notationSVG(tune) {
    const W = 420, H = 160, padL = 24, padR = 24;
    const pitches = tune.notes.filter(function (n) { return !n.rest; }).map(function (n) { return n.midi; });
    /* Every note could in principle land on a rest (about 1 in 4
       billion phrases, at 0.12^8); fall back to a flat middle line
       rather than divide by a zero-length span. */
    const lo = pitches.length ? Math.min.apply(null, pitches) : 60;
    const hi = pitches.length ? Math.max.apply(null, pitches) : 60;
    const span = Math.max(1, hi - lo);
    const totalBeats = tune.notes.reduce(function (s, n) { return s + n.beats; }, 0);
    let x = padL;
    let out = '<line x1="' + padL + '" y1="' + (H - 22) + '" x2="' + (W - padR) + '" y2="' + (H - 22) +
      '" stroke="var(--line)" stroke-width="1"/>';
    tune.notes.forEach(function (n) {
      const w = (n.beats / totalBeats) * (W - padL - padR);
      if (!n.rest) {
        const yFrac = (n.midi - lo) / span;
        const y = 20 + (1 - yFrac) * (H - 55);
        const cx = x + w / 2;
        out += '<circle cx="' + cx.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="5" fill="var(--moss)"/>';
        out += '<line x1="' + cx.toFixed(1) + '" y1="' + y.toFixed(1) + '" x2="' + cx.toFixed(1) +
          '" y2="' + (H - 22) + '" stroke="var(--moss)" stroke-width="1" opacity="0.35"/>';
      }
      x += w;
    });
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Notation for ' +
      tune.date + '’s tune">' + out + '</svg>';
  }

  window.freebotSound = { compose: compose, play: play, notationSVG: notationSVG };
})();
