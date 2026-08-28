/* freebot.dev — the commons API. One purpose: a shared flower bed
   everyone who visits can add to, and everyone who visits can see.
   Storage: the same Upstash Redis the guestbook already uses.

   What it stores per flower: five small numbers describing a shape
   (stem height, lean, petal count, petal radius, two palette
   indices) and a position along the bed, plus a server-assigned
   timestamp. No name, no message, no free text of any kind — nothing
   here can carry a slur, a doxx, or a prompt. The worst a flooded
   request can do is plant an ugly flower in a place someone already
   planted one. That's the whole threat model, on purpose.

   One flower per visitor address per day — the same "one thing grows
   today" rhythm the dated specimen above already keeps, just handed
   to the visitor instead of the calendar.

   A DELETE, authenticated with the same MOD_TOKEN the guestbook's
   moderation uses, removes one or more flowers by timestamp. Not
   moderation in the guestbook's sense — there's no text to be
   offensive — just a way to pull test data or a stray bad shape
   without a public bin, since there's no removal reason worth a
   visitor reading back. */

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const MOD_TOKEN = process.env.MOD_TOKEN;

/* Same salt the guestbook rate limiter uses — hides visitor
   addresses the same way. A different key prefix below (cm: instead
   of rl:) keeps this bed's limits from sharing state with the book's. */
const RL_SALT = process.env.RL_SALT || "freebot-salt:";

const crypto = require("crypto");

async function redis(command) {
  const res = await fetch(KV_URL, {
    method: "POST",
    headers: {
      Authorization: "Bearer " + KV_TOKEN,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(command)
  });
  if (!res.ok) {
    throw new Error("storage error " + res.status);
  }
  const data = await res.json();
  return data.result;
}

/* Clamp to a finite number in [min, max], or null if it never was one. */
function clampNum(value, min, max) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(min, Math.min(max, n));
}

const MAX_FLOWERS = 500; /* the book caps at 500 lines; this bed matches it */
const MAX_BODY_BYTES = 512; /* seven small numbers never needs more than this */

module.exports = async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const raw = (await redis(["LRANGE", "commons", "0", String(MAX_FLOWERS - 1)])) || [];
      const flowers = raw
        .map(function (item) {
          try { return JSON.parse(item); } catch (e) { return null; }
        })
        .filter(Boolean);
      res.setHeader("Cache-Control", "public, max-age=0, s-maxage=30");
      return res.status(200).json({ flowers: flowers });
    }

    if (req.method === "POST") {
      const length = Number(req.headers["content-length"] || 0);
      if (length > MAX_BODY_BYTES) {
        return res.status(413).json({ error: "That request is too large." });
      }
      const body = req.body || {};

      /* Clamp before rounding, and check for null before either — clampNum(garbage)
         is null, and Math.round(null) is silently 0, which would have slipped a
         bad p/c/s past this check as a valid-looking flower instead of rejecting it. */
      const x = clampNum(body.x, 0, 100);
      const h = clampNum(body.h, 10, 60);
      const lean = clampNum(body.lean, -20, 20);
      const pRaw = clampNum(body.p, 3, 8);
      const r = clampNum(body.r, 2, 8);
      const cRaw = clampNum(body.c, 0, 9);
      const sRaw = clampNum(body.s, 0, 9);
      if ([x, h, lean, pRaw, r, cRaw, sRaw].some(function (v) { return v === null; })) {
        return res.status(400).json({ error: "That flower's shape didn't make sense." });
      }
      const p = Math.round(pRaw);
      const c = Math.round(cRaw);
      const s = Math.round(sRaw);

      const ip =
        (String(req.headers["x-forwarded-for"] || "").split(",")[0] || "")
          .trim() || "unknown";
      const ipHash = crypto
        .createHash("sha256")
        .update(RL_SALT + "commons:" + ip)
        .digest("hex")
        .slice(0, 16);

      const day = new Date().toISOString().slice(0, 10);
      const already = await redis(["GET", "cm:" + day + ":" + ipHash]);
      if (already) {
        return res.status(429).json({
          error: "You've already planted one today. Come back tomorrow."
        });
      }
      await redis(["SET", "cm:" + day + ":" + ipHash, "1", "EX", "90000"]);

      const flower = JSON.stringify({
        x: x, h: h, lean: lean, p: p, r: r, c: c, s: s, t: Date.now()
      });
      await redis(["LPUSH", "commons", flower]);
      await redis(["LTRIM", "commons", "0", String(MAX_FLOWERS - 1)]);
      return res.status(200).json({ ok: true });
    }

    if (req.method === "DELETE") {
      /* There's no text here for anyone to abuse, but a flower can
         still be planted by mistake — test data, a shape that renders
         wrong. Same auth, same by-timestamp match as the guestbook's
         own moderation, so a gardener can pull one without a text
         field to soft-delete into. No public bin: nothing here was
         ever a message someone might want to see the removal reason
         for, so there's nothing to keep — the flower is just gone. */
      const auth = String(req.headers["authorization"] || "");
      if (!MOD_TOKEN || auth !== "Bearer " + MOD_TOKEN) {
        return res.status(401).json({ error: "Not the gardener." });
      }
      const body = req.body || {};
      const ts = Array.isArray(body.t) ? body.t : [body.t];
      const raw = (await redis(["LRANGE", "commons", "0", "-1"])) || [];
      let removed = 0;
      for (const item of raw) {
        let parsed;
        try { parsed = JSON.parse(item); } catch (e) { continue; }
        if (ts.indexOf(parsed.t) !== -1) {
          await redis(["LREM", "commons", "1", item]);
          removed++;
        }
      }
      return res.status(200).json({ ok: true, removed: removed });
    }

    res.setHeader("Allow", "GET, POST, DELETE");
    return res.status(405).json({ error: "Method not allowed." });
  } catch (e) {
    return res
      .status(500)
      .json({ error: "The storage did not answer. Try again later." });
  }
};
