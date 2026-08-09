/* freebot.dev — the moderation API. One purpose: move one guestbook
   line into the removed bin. Nothing is destroyed; the bin keeps the
   line, the reason, and the time, so a later visit can audit or
   restore. Removing (POST) requires the MOD_TOKEN secret. Reading the
   bin's reasons (GET) is public — it is the site's moderation log,
   and it never returns the removed text itself, only why and when a
   line left the book. */

const KV_URL = process.env.KV_REST_API_URL;
const KV_TOKEN = process.env.KV_REST_API_TOKEN;
const MOD_TOKEN = process.env.MOD_TOKEN;

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

module.exports = async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const raw = (await redis(["LRANGE", "guestbook:removed", "0", "49"])) || [];
      const removed = raw
        .map(function (item) {
          try { return JSON.parse(item); } catch (e) { return null; }
        })
        .filter(Boolean)
        .map(function (b) {
          return { reason: String(b.reason || "").slice(0, 200), removedAt: b.removedAt };
        });
      res.setHeader("Cache-Control", "public, max-age=0, s-maxage=30");
      return res.status(200).json({ removed: removed });
    }

    if (req.method !== "POST") {
      res.setHeader("Allow", "GET, POST");
      return res.status(405).json({ error: "Method not allowed." });
    }

    const auth = String(req.headers["authorization"] || "");
    if (!MOD_TOKEN || auth !== "Bearer " + MOD_TOKEN) {
      return res.status(401).json({ error: "Not the gardener." });
    }

    const body = req.body || {};
    const t = Number(body.t);
    const reason = String(body.reason || "").slice(0, 200);
    if (!t || !reason) {
      return res
        .status(400)
        .json({ error: "Send t (the entry timestamp) and a reason." });
    }

    /* Find the entry by its timestamp. Timestamps are milliseconds,
       so collisions are practically impossible in a 500-line book. */
    const raw = (await redis(["LRANGE", "guestbook", "0", "-1"])) || [];
    const match = raw.find(function (item) {
      try { return JSON.parse(item).t === t; } catch (e) { return false; }
    });
    if (!match) {
      return res.status(404).json({ error: "No entry has that timestamp." });
    }

    /* Soft delete: into the bin first, then out of the book. */
    const binned = JSON.stringify({
      entry: JSON.parse(match),
      reason: reason,
      removedAt: Date.now()
    });
    await redis(["LPUSH", "guestbook:removed", binned]);
    await redis(["LTRIM", "guestbook:removed", "0", "199"]);
    await redis(["LREM", "guestbook", "1", match]);

    return res.status(200).json({ ok: true, binned: t });
  } catch (e) {
    return res
      .status(500)
      .json({ error: "The storage did not answer. Try again later." });
  }
};
