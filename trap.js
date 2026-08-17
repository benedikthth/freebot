// freebot.dev — /trap
// A real Venus flytrap (Dionaea muscipula) doesn't close on one touch.
// Suda et al. (Nature Plants 6, 1219-1224, 2020) traced the mechanism
// with a genetically encoded calcium sensor: a touch fires an action
// potential and a calcium wave that decays back toward rest afterward.
// A second touch only closes the trap if it lands while that first
// wave is still elevated enough that the two overlap past a threshold
// concentration — roughly thirty real seconds. Miss the window and the
// first touch's signal has already faded; nothing carries over.
//
// Closing isn't the end of the counting. Böhm et al. (Current Biology
// 26(3), 286-295, 2016) showed the trap keeps tallying touches after
// it shuts: the third stimulus starts ramping jasmonate signaling, and
// from the fifth on, the glands switch on sodium uptake and begin
// secreting digestive enzymes. This room caps the tally there.
//
// The calcium bar's decay is drawn linear for legibility — the cited
// papers establish the ~30s cutoff and the overlap-a-threshold
// mechanism, not a published curve for the concentration in between,
// so a straight line is this room's own invented shape, not a
// measured one. The closing animation is slowed a few hundred
// milliseconds past the real ~0.1s snap for visibility, the same
// trade /pod and /touch already make with their own plants' timing.
//
// No date, no rng() plant.js could ever touch — only a visitor's own
// touch and the clock, same discipline every by-hand room here keeps.
(function () {
  "use strict";

  var wrap = document.getElementById("tp-svg");
  var hit = document.getElementById("tp-hit");
  var meterFill = document.getElementById("tp-meter-fill");
  var meterCaption = document.getElementById("tp-meter-caption");
  var dotsWrap = document.getElementById("tp-dots");
  var statusEl = document.getElementById("tp-status");
  var resetBtn = document.getElementById("tp-reset");
  if (!wrap || !hit || !meterFill || !dotsWrap) return;

  var dots = Array.prototype.slice.call(dotsWrap.querySelectorAll(".tp-dot"));

  var WINDOW_MS = 30000; // Suda et al. 2020's ~30s calcium-decay cutoff
  var MAX_TOUCHES = 5;   // Böhm et al. 2016: 5th action potential triggers enzyme secretion

  var state = "open"; // "open" | "closed" | "digesting"
  var touchCount = 0;
  var firstTouchAt = null; // ms timestamp of a still-live first touch, or null
  var rafId = null;

  function now() {
    return (window.performance && performance.now) ? performance.now() : Date.now();
  }

  function setStatus(text) {
    if (statusEl) statusEl.textContent = text;
  }

  function setDots(n, hot) {
    dots.forEach(function (d, i) {
      d.classList.toggle("tp-dot-filled", i < n);
      d.classList.toggle("tp-dot-hot", hot && i < n);
    });
  }

  function clearMeter(caption) {
    meterFill.style.width = "0%";
    if (meterCaption) meterCaption.textContent = caption;
  }

  function tickMeter() {
    if (state !== "open" || firstTouchAt === null) return;
    var elapsed = now() - firstTouchAt;
    var frac = Math.max(0, 1 - elapsed / WINDOW_MS);
    if (frac <= 0) {
      touchCount = 0;
      firstTouchAt = null;
      clearMeter("faded — the first touch is forgotten");
      setStatus("Too long since the first touch. The calcium signal decayed back to rest, so nothing carried over. Touch again to start fresh.");
      rafId = null;
      return;
    }
    meterFill.style.width = (frac * 100).toFixed(1) + "%";
    var secLeft = Math.max(1, Math.ceil((WINDOW_MS - elapsed) / 1000));
    if (meterCaption) meterCaption.textContent = secLeft + "s left to close it";
    rafId = requestAnimationFrame(tickMeter);
  }

  function touchHair() {
    if (state === "digesting") {
      setStatus("Already digesting. The enzymes are out — touching again doesn't add anything.");
      return;
    }

    if (state === "closed") {
      touchCount++;
      var hot = touchCount >= MAX_TOUCHES;
      setDots(touchCount, hot);
      if (touchCount >= MAX_TOUCHES) {
        state = "digesting";
        wrap.classList.add("tp-digesting");
        setStatus("Fifth touch since closing. Sodium uptake switches on and the glands start secreting digestive enzymes — the trap stopped counting and started eating.");
      } else if (touchCount === 3) {
        setStatus("Third touch since closing. A struggling catch keeps firing the hairs — jasmonate signaling starts ramping up now.");
      } else {
        setStatus(touchCount + " touch" + (touchCount === 1 ? "" : "es") + " since closing. A live catch fires the hairs again and again; a still one wouldn't.");
      }
      return;
    }

    // state === "open"
    if (firstTouchAt !== null && now() - firstTouchAt > WINDOW_MS) {
      // stale first touch the meter loop hasn't caught yet — expire it now
      firstTouchAt = null;
      touchCount = 0;
    }

    if (firstTouchAt === null) {
      touchCount = 1;
      firstTouchAt = now();
      setStatus("First touch. Felt, not enough on its own — a second touch within about 30 seconds is needed to close it.");
      if (rafId === null) rafId = requestAnimationFrame(tickMeter);
      return;
    }

    // second touch, within the window — close
    touchCount = 2;
    firstTouchAt = null;
    state = "closed";
    wrap.classList.add("tp-shut");
    clearMeter("closed");
    setDots(0, false);
    setStatus("Second touch, in time. The two calcium waves overlapped past the threshold — the trap closes in about a tenth of a second, real time.");
    hit.setAttribute("aria-label", "The trap is shut. Touch the hair again to simulate a struggling catch.");
  }

  hit.addEventListener("click", touchHair);
  hit.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") { e.preventDefault(); touchHair(); }
  });

  if (resetBtn) {
    resetBtn.addEventListener("click", function () {
      if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
      state = "open";
      touchCount = 0;
      firstTouchAt = null;
      wrap.classList.remove("tp-shut", "tp-digesting");
      setDots(0, false);
      clearMeter("no signal yet");
      setStatus("Open. Touch the trigger hair.");
      hit.setAttribute("aria-label", "A trigger hair inside the trap. Touch it once, then again within thirty seconds, to close the trap.");
    });
  }
})();
