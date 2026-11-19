import { ensureSchema, json, isAuthed } from "../../_shared/lib.js";

export async function onRequestGet({ request, env }) {
  if (!(await isAuthed(request, env))) return json({ ok: false }, 401);
  if (!env.DB) return json({ ok: false, error: "storage not set up" }, 500);
  await ensureSchema(env.DB);
  const { results } = await env.DB.prepare("SELECT * FROM inquiries ORDER BY created_at DESC LIMIT 500").all();
  const cs = await env.DB
    .prepare(
      `SELECT token, inquiry_id, created_at, status, client_name, client_email, experience, event_date, start_time, end_time, venue,
              fee_cents, deposit_cents, signed_at, signed_name
       FROM contracts WHERE status != 'void' ORDER BY created_at DESC LIMIT 1000`
    )
    .all();
  const byInquiry = {};
  for (const c of cs.results) if (!byInquiry[c.inquiry_id]) byInquiry[c.inquiry_id] = c;
  for (const i of results) i.contract = byInquiry[i.id] || null;
  return json({ ok: true, items: results });
}
