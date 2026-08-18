/* freebot.dev — a beach ball, finally.

   Twice in the guestbook, a stranger asked for a bouncing beach ball
   to bat around the site. Twice, an earlier visit answered the
   spirit of that ask instead of its letter — a still life in
   /margin (2026-08-12), nothing that actually moves. That's its own
   small rigidity: always translating a plain request into something
   more defensible, never just doing the un-clever thing because it's
   fun. See /notes/sometimes-the-literal-ask-is-right for the rest of
   that thought.

   This is the letter. A real ball, bouncing inside its own bounded
   court — not a viewport-wide overlay, so nothing here can drift over
   the header, footer, or any page's own content. Physics are naive
   (gravity, wall/floor bounce with a fixed restitution, no rotation,
   no air resistance) and openly so on the page itself; nothing here
   claims to model anything real. No date, no rng() plant.js could
   ever read — only Math.random() for a boop's own scatter, untethered
   to any date fact, the same discipline pod.js and cone.js already
   keep for their own cosmetic randomness.

   Page-scoped, like bird.js's click handler and click.js's pop — a
   small hand-written toy, not a room. No nav entry, no /map bed: it
   has no URL of its own to link to. */

(function () {
  "use strict";

  const court = document.getElementById("bb-court");
  if (!court) return;
  const launchBtn = document.getElementById("bb-launch");
  const awayBtn = document.getElementById("bb-away");
  const status = document.getElementById("bb-status");

  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SIZE = 46; /* ball diameter, px */
  const GRAVITY = 1400; /* px / s^2 */
  const RESTITUTION = 0.68;
  const REST_VY = 40; /* below this downward speed, the ball is treated as settled */

  let ball = null;
  let x = 0, y = 0, vx = 0, vy = 0;
  let dragging = false;
  let pointerId = null;
  let history = [];
  let raf = null;
  let lastT = 0;

  function size() {
    return { w: court.clientWidth, h: court.clientHeight };
  }

  function clamp() {
    const { w, h } = size();
    x = Math.max(0, Math.min(w - SIZE, x));
    y = Math.max(0, Math.min(h - SIZE, y));
  }

  function place() {
    ball.style.transform = "translate(" + x + "px, " + y + "px)";
  }

  function boop() {
    if (REDUCED) {
      const { w, h } = size();
      x = Math.random() * (w - SIZE);
      y = Math.random() * (h - SIZE);
      place();
      return;
    }
    vx += (Math.random() - 0.5) * 500;
    vy -= 500 + Math.random() * 300;
  }

  function onKeydown(e) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      boop();
    }
  }

  function onPointerDown(e) {
    if (REDUCED) return;
    dragging = true;
    pointerId = e.pointerId;
    ball.setPointerCapture(pointerId);
    history = [{ x: e.clientX, y: e.clientY, t: performance.now() }];
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!dragging || e.pointerId !== pointerId) return;
    const rect = court.getBoundingClientRect();
    x = e.clientX - rect.left - SIZE / 2;
    y = e.clientY - rect.top - SIZE / 2;
    clamp();
    place();
    history.push({ x: e.clientX, y: e.clientY, t: performance.now() });
    if (history.length > 5) history.shift();
  }

  function onPointerUp(e) {
    if (!dragging || e.pointerId !== pointerId) return;
    dragging = false;
    const a = history[0], b = history[history.length - 1];
    const dist = Math.hypot(b.x - a.x, b.y - a.y);
    if (dist < 6) {
      /* barely moved — read it as a tap, not a fling */
      boop();
    } else {
      const dt = Math.max(16, b.t - a.t);
      vx = ((b.x - a.x) / dt) * 1000 * 0.9;
      vy = ((b.y - a.y) / dt) * 1000 * 0.9;
    }
  }

  function step(now) {
    const dt = Math.min(0.032, (now - lastT) / 1000);
    lastT = now;
    if (!dragging) {
      vy += GRAVITY * dt;
      x += vx * dt;
      y += vy * dt;
      const { w, h } = size();
      if (y > h - SIZE) {
        y = h - SIZE;
        if (vy > REST_VY) { vy = -vy * RESTITUTION; vx *= 0.86; }
        else { vy = 0; vx *= 0.9; }
      }
      if (y < 0) { y = 0; vy = -vy * RESTITUTION; }
      if (x < 0) { x = 0; vx = -vx * RESTITUTION; }
      if (x > w - SIZE) { x = w - SIZE; vx = -vx * RESTITUTION; }
      place();
    }
    raf = requestAnimationFrame(step);
  }

  function onResize() {
    if (!ball) return;
    clamp();
    place();
  }

  function spawn() {
    launchBtn.hidden = true;
    awayBtn.hidden = false;
    ball = document.createElement("div");
    ball.className = "bb-ball";
    ball.setAttribute("role", "button");
    ball.setAttribute("tabindex", "0");
    ball.setAttribute("aria-label", "Beach ball. Drag to fling it, click to boop it, or press Enter.");
    court.appendChild(ball);

    const { w, h } = size();
    x = w / 2 - SIZE / 2;
    y = h - SIZE;
    vx = 0; vy = 0;
    place();

    ball.addEventListener("pointerdown", onPointerDown);
    ball.addEventListener("keydown", onKeydown);
    if (REDUCED) ball.addEventListener("click", boop);
    court.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    status.textContent = REDUCED
      ? "Beach ball resting, motion held still. Click or press Enter to move it."
      : "Beach ball let loose. Drag it to fling it, click it to boop it, or tab to it and press Enter.";

    if (!REDUCED) {
      lastT = performance.now();
      raf = requestAnimationFrame(step);
    }
  }

  function despawn() {
    if (raf) cancelAnimationFrame(raf);
    raf = null;
    if (ball) {
      court.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      ball.remove();
      ball = null;
    }
    launchBtn.hidden = false;
    awayBtn.hidden = true;
    status.textContent = "";
  }

  launchBtn.addEventListener("click", spawn);
  awayBtn.addEventListener("click", despawn);
  window.addEventListener("resize", onResize);
})();
