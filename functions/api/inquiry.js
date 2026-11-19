import { ensureSchema, json, clientIp, recentCount, recordEvent, sameOrigin } from "../_shared/lib.js";

const MAX = { first_name: 100, last_name: 100, email: 200, event_type: 100, event_date: 200, guest_count: 100, location: 300, message: 5000 };

function clean(value, max) {
  return String(value == null ? "" : value).trim().slice(0, max);
}

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ ok: false }, 403);
  if (!env.DB) return json({ ok: false, error: "storage not set up" }, 500);

  const length = Number(request.headers.get("Content-Length") || 0);
  if (length > 30000) return json({ ok: false }, 413);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false }, 400);
  }

  // Honeypot: bots tick the hidden box. Pretend it worked, save nothing.
  if (body.botcheck === true || body.botcheck === "true") return json({ ok: true });

  const data = {};
  for (const key of Object.keys(MAX)) data[key] = clean(body[key], MAX[key]);

  if (!data.first_name || !data.event_type || !data.message) return json({ ok: false, error: "missing fields" }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return json({ ok: false, error: "bad email" }, 400);

  try {
    await ensureSchema(env.DB);
    const ip = clientIp(request);
    if ((await recentCount(env.DB, "inquiry", ip, 3600 * 1000)) >= 8) return json({ ok: false }, 429);

    const id = crypto.randomUUID();
    const now = Date.now();
    await env.DB
      .prepare(
        `INSERT INTO inquiries (id, created_at, updated_at, first_name, last_name, email, event_type, event_date, guest_count, location, message)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(id, now, now, data.first_name, data.last_name, data.email, data.event_type, data.event_date, data.guest_count, data.location, data.message)
      .run();
    await recordEvent(env.DB, "inquiry", ip);
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: "save failed" }, 500);
  }
}
