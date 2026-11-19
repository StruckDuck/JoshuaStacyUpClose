import { ensureSchema, json, isAuthed } from "../../_shared/lib.js";

export async function onRequestGet({ request, env }) {
  if (!(await isAuthed(request, env))) return json({ ok: false }, 401);
  if (!env.DB) return json({ ok: false, error: "storage not set up" }, 500);
  await ensureSchema(env.DB);
  const { results } = await env.DB.prepare("SELECT * FROM inquiries ORDER BY created_at DESC LIMIT 500").all();
  return json({ ok: true, items: results });
}
