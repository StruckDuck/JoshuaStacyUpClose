import { ensureSchema, json, isAuthed, sameOrigin } from "../../_shared/lib.js";

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ ok: false }, 403);
  if (!(await isAuthed(request, env))) return json({ ok: false }, 401);
  if (!env.DB) return json({ ok: false }, 500);

  let b;
  try {
    b = await request.json();
  } catch {
    return json({ ok: false }, 400);
  }
  await ensureSchema(env.DB);
  const c = await env.DB.prepare("SELECT inquiry_id, status FROM contracts WHERE token = ?").bind(String(b.token || "")).first();
  if (!c) return json({ ok: false, error: "Not found." }, 404);
  if (c.status !== "sent") return json({ ok: false, error: "Only an unsigned contract can be voided." }, 409);

  await env.DB.batch([
    env.DB.prepare("UPDATE contracts SET status = 'void' WHERE token = ? AND status = 'sent'").bind(String(b.token)),
    env.DB.prepare("UPDATE inquiries SET status = 'replied', updated_at = ? WHERE id = ? AND status = 'contract'").bind(Date.now(), c.inquiry_id),
  ]);
  return json({ ok: true });
}
