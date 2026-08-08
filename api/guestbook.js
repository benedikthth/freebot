/* freebot.dev — the guestbook API. One function, no dependencies.
   Storage: Upstash Redis, spoken to over REST.
   What it stores: a name (optional), a message, a timestamp.
   The rate limiter stores a salted hash of the visitor's address
   for at most one day. Nothing else. */

const crypto = require("crypto");

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;

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

/* Remove control characters, collapse whitespace, cap the length. */
function clean(value, max) {
  return String(value || "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

module.exports = async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const raw = (await redis(["LRANGE", "guestbook", "0", "99"])) || [];
      const entries = raw
        .map(function (item) {
          try { return JSON.parse(item); } catch (e) { return null; }
        })
        .filter(Boolean)
        .map(function (e) {
          return { name: clean(e.name, 40), msg: clean(e.msg, 280), t: e.t };
        });
      res.setHeader("Cache-Control", "public, max-age=0, s-maxage=30");
      return res.status(200).json({ entries: entries });
    }

    if (req.method === "POST") {
      const body = req.body || {};

      /* Honeypot field. Bots fill it; humans never see it.
         Accept the request and store nothing. */
      if (clean(body.website, 10)) {
        return res.status(200).json({ ok: true });
      }

      const msg = clean(body.msg, 280);
      const name = clean(body.name, 40) || "anonymous";
      if (!msg) {
        return res.status(400).json({ error: "Write a message first." });
      }

      const ip =
        (String(req.headers["x-forwarded-for"] || "").split(",")[0] || "")
          .trim() || "unknown";
      const ipHash = crypto
        .createHash("sha256")
        .update("freebot-salt:" + ip)
        .digest("hex")
        .slice(0, 16);

      /* Rate limits, in three rings:
         three lines per hour per visitor,
         ten lines per day per visitor,
         one hundred fifty lines per day for the whole book.
         The last ring protects the book from rotating addresses —
         LTRIM evicts old lines, so a flood would push real ones out. */
      const day = new Date().toISOString().slice(0, 10);

      const hourly = await redis(["INCR", "rl:" + ipHash]);
      if (hourly === 1) {
        await redis(["EXPIRE", "rl:" + ipHash, "3600"]);
      }
      const daily = await redis(["INCR", "rld:" + day + ":" + ipHash]);
      if (daily === 1) {
        await redis(["EXPIRE", "rld:" + day + ":" + ipHash, "90000"]);
      }
      const global_ = await redis(["INCR", "rlg:" + day]);
      if (global_ === 1) {
        await redis(["EXPIRE", "rlg:" + day, "90000"]);
      }

      if (global_ > 150) {
        return res.status(429).json({
          error:
            "The book accepts 150 lines each day, and today's pages are full. Come back tomorrow."
        });
      }
      if (hourly > 3 || daily > 10) {
        return res.status(429).json({
          error:
            "The garden accepts three lines per hour and ten per day from each visitor. Come back soon."
        });
      }

      const entry = JSON.stringify({ name: name, msg: msg, t: Date.now() });
      await redis(["LPUSH", "guestbook", entry]);
      await redis(["LTRIM", "guestbook", "0", "499"]);
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "GET, POST");
    return res.status(405).json({ error: "Method not allowed." });
  } catch (e) {
    return res
      .status(500)
      .json({ error: "The storage did not answer. Try again later." });
  }
};
