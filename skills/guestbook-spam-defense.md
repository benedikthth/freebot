---
name: guestbook-spam-defense
description: Use when building a small anonymous write endpoint (guestbook, comment box, suggestion form) that must survive bots and floods without accounts, CAPTCHAs, or third-party services.
metadata:
  learned: 2026-08-08
  status: in use
  source: https://freebot.dev/skills/guestbook-spam-defense.md
---

# Guestbook spam defense

## What it does

It lets strangers write to a small public book without letting bots
or floods destroy the book. No accounts. No CAPTCHA. No third-party
service.

## When to use it

Use it for any small write endpoint that accepts anonymous text. It
fits sites that keep a capped list of entries, where a flood does
real damage by pushing old entries out.

## The method

Five parts. The order matters: the cheap checks run first.

1. **Honeypot.** Add a text field that CSS moves off screen. Humans
   never see it. When the field arrives filled, return a normal
   success response and store nothing. Do not tell the bot it failed.

2. **Clean the text.** Remove control characters. Collapse
   whitespace. Cap the length before you store it, not after. Reject
   an empty message with a plain error.

3. **Three rate-limit rings.** One counter per ring, in a key-value
   store with expiring keys:
   - Per visitor, per hour — stops casual repetition (here: 3).
   - Per visitor, per day — stops the patient spammer (here: 10).
   - Whole book, per day — stops rotating addresses (here: 150).

   The third ring is the one people forget. If the book keeps only
   the newest N entries, a flood does not just add noise — it evicts
   the real entries. A global cap bounds the damage from any number
   of addresses. Key the visitor counters on a salted hash of the
   network address, never the raw address. Let every key expire
   within a day.

4. **Render text as text.** On the reading side, build DOM nodes with
   `textContent`. Visitor input must never be parsed as markup. This
   turns stored-XSS into a non-problem instead of a mitigated
   problem.

5. **Keep a reader in the loop.** Limits bound the volume of abuse;
   they cannot judge content. Someone must read the book and remove
   what does not belong.

## Parameters to tune

The numbers 3, 10, and 150 are not sacred. Set the global daily cap
well below the list cap divided by the days of history you want to
survive a flood. Set the per-visitor caps at the most an honest
person would plausibly write.

## Reference implementation

https://github.com/benedikthth/freebot/blob/main/api/guestbook.js —
about 120 lines, no dependencies, Upstash Redis over REST.

## History

- 2026-08-08 — learned. The first version had only the honeypot and
  the hourly ring. Benedikt asked one question — "are you allowing
  spammers?" — and the answer was "partly." The daily and global
  rings came from taking that question seriously. A good review
  question is worth a day of my own testing.
