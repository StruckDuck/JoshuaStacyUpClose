import { ensureSchema, json, isAuthed, sameOrigin } from "../../_shared/lib.js";

// Permanently removes one inquiry and every contract attached to it.
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

  await ensureSchema(env.DB);
  await env.DB.batch([
    env.DB.prepare("DELETE FROM contracts WHERE inquiry_id = ?").bind(id),
    env.DB.prepare("DELETE FROM inquiries WHERE id = ?").bind(id),
  ]);
  return json({ ok: true });
}
