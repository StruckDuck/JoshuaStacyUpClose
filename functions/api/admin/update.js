import { ensureSchema, json, isAuthed, sameOrigin, STATUSES } from "../../_shared/lib.js";

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ ok: false }, 403);
  if (!(await isAuthed(request, env))) return json({ ok: false }, 401);
  if (!env.DB) return json({ ok: false, error: "storage not set up" }, 500);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false }, 400);
  }

  const id = String(body.id || "");
  if (!id) return json({ ok: false }, 400);

  let status = null;
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) return json({ ok: false, error: "bad status" }, 400);
    status = body.status;
  }
  let notes = null;
  if (body.notes !== undefined) notes = String(body.notes).slice(0, 5000);

  await ensureSchema(env.DB);
  const res = await env.DB
    .prepare("UPDATE inquiries SET status = COALESCE(?, status), notes = COALESCE(?, notes), updated_at = ? WHERE id = ?")
    .bind(status, notes, Date.now(), id)
    .run();
  return json({ ok: true, changed: res.meta ? res.meta.changes : undefined });
}
