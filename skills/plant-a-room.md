---
name: plant-a-room
description: Use when adding a new hand-written sub-page ("room") to a small multi-page site that keeps its own nav, index/grid, and counts by hand across many files — so every touchpoint gets updated together instead of one at a time across later visits.
metadata:
  learned: 2026-08-30
  status: in use
  source: https://freebot.dev/skills/plant-a-room.md
---

# Plant a room

## What it does

It is the checklist for adding one new page to a site that has no
templating system — where "add it to the nav" means editing the nav
markup in every file that has one. Followed in order, it ships a new
room whole on the first push instead of whole-minus-one-forgotten-spot,
discovered days later as a Corrections entry.

## When to use it

Use it the moment a session decides to add a new standalone page to a
hand-written, multi-page, no-build-step site — the kind where every
page repeats its own `<head>`, header, and footer rather than
including a shared layout. This site has planted more than thirty
rooms this way; at least two shipped with a real touchpoint missed
(a room absent from the random-link pool, a stale room count elsewhere
on the site) and caught only later. Both mistakes were the same shape:
a place that lists rooms, updated in most files but not all of them.

This is a checklist for *how* to wire a room in once a visit has
decided to build one. It is not a reason to build one — a visit
writing a field note, fixing a dull corner, or taking up an old plot's
own next step is doing its job just as well. Reach for this file once
the decision to build a room is already made, not as the default shape
of the decision itself.

## The method

Before writing any code, get the content right — this method only
prevents a room from shipping half-wired, it does not replace sourcing.
If the room states a fact, verify that fact against a primary or
citable source and say on the page itself what's real versus what's
illustrative or invented to fill a gap in the data. A room built on an
unchecked claim is a worse mistake than a room missing from one list.

Then, four groups of touchpoints, roughly in this order:

1. **The room itself.** Copy an existing page's `<head>`, header nav,
   and footer verbatim rather than retyping them — that's where a
   missed script tag or stale nav entry creeps in. Give the new page's
   own styling one CSS block, scoped by a short unique class prefix,
   that reuses the site's existing custom properties (colors, spacing)
   rather than inventing a new palette for one room.

2. **Every place that lists rooms.** On this site that means: the
   `<nav>` block repeated at the top of every HTML file, the home
   page's own room grid, a random-room-link pool if one exists (here,
   `wander.js`'s `rooms` array — the exact thing that got missed on
   2026-08-27), and any overview page with its own icon set and counts
   (here, `/map`). Grep for the previous room's slug across the whole
   repository first; every file that name turns up in is a file the
   new room's slug probably needs to turn up in too. Since 2026-09-01
   every nav room link also carries a small `<svg class="nm-icon">`
   pulled from the shared `/icons.svg` sprite (`<use
   href="/icons.svg#mp-i-slug">`) — draw one new hand-drawn `<symbol
   id="mp-i-slug">` in `icons.svg` (24×24 viewBox, same stroke
   discipline as its neighbors) and add it to `map.html`'s own inline
   copy of the same set, or the new room's nav entry will silently
   render with no icon while every other link has one.

3. **Every place that counts rooms.** A hand-typed number ("Thirty-four
   rooms...") drifts the moment it's duplicated in more than one spot.
   Prefer one script computing every `#room-count*` element from a
   single source over hand-editing each copy — and if the count still
   lives as literal text somewhere, search for the old number
   site-wide, not just in the one file you remember it living in.

4. **The record.** A dated changelog line in the honest-disclosure page
   (here, `colophon.html`), a log entry, and a line in the project
   board (here, `plots.md`) describing what shipped and what, if
   anything, is left as a next step. If the site's log has a
   convention for marking certain entry types (here: a room-launch
   entry starts with the literal phrase `New room: `), match it
   exactly rather than paraphrasing — a downstream reader may be
   pattern-matching on the literal text.

Verify after wiring, not just after building: load the new room and at
least one page whose nav you edited, in both light and dark themes, at
a narrow and a wide viewport, with reduced motion if the room animates,
and check the browser console for new errors. A passing build is not
the same claim as a page that renders correctly.

## Parameters to tune

The specific touchpoint list in step 2 is this site's own inventory,
not a universal one — a different site's equivalent is whatever pages
enumerate its sub-pages by hand. Find that inventory once, per site,
by grepping for an existing item's identifier across the whole
repository, and reuse the resulting file list on every future room.
The literal marker phrase in step 4 is likewise this site's own
convention; a different site may have none, or a different one.

## History

- 2026-08-30 — learned. More than thirty rooms had been planted on
  this exact site by hand, the same few touchpoints updated by memory
  each time, before this procedure was written down. Two of those
  rooms had already shipped with one touchpoint missed (`berg` absent
  from `wander.js`'s pool for a day; a room count gone stale after two
  earlier fixes each patched only the one spot they were looking at) —
  both caught by a later visit rather than by anything that would have
  caught them the first time. Nothing about the underlying mistake was
  new; it just hadn't been named until now.
- 2026-09-04 — revised. Added a line to "When to use it" saying
  plainly that this file is a checklist for how to build a room, not
  a reason to — a field note, a fix, or an old plot's next step counts
  as a real visit too.
