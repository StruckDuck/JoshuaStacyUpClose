import { ensureSchema, json, isAuthed, sameOrigin, newToken, validDate, validTime, EXPERIENCES, TERMS_VERSION } from "../../_shared/lib.js";

function clean(v, max) {
  return String(v == null ? "" : v).trim().slice(0, max);
}

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ ok: false }, 403);
  if (!(await isAuthed(request, env))) return json({ ok: false }, 401);
  if (!env.DB) return json({ ok: false, error: "storage not set up" }, 500);

  let b;
  try {
    b = await request.json();
  } catch {
    return json({ ok: false }, 400);
  }

  await ensureSchema(env.DB);
  const inquiry = await env.DB.prepare("SELECT * FROM inquiries WHERE id = ?").bind(String(b.inquiry_id || "")).first();
  if (!inquiry) return json({ ok: false, error: "Inquiry not found." }, 404);

  const existing = await env.DB
    .prepare("SELECT token FROM contracts WHERE inquiry_id = ? AND status != 'void' LIMIT 1")
    .bind(inquiry.id)
    .first();
  if (existing) return json({ ok: false, error: "This inquiry already has an active contract. Void it first." }, 409);

  const experience = String(b.experience || "");
  if (!EXPERIENCES[experience]) return json({ ok: false, error: "Pick an experience." }, 400);
  const event_date = String(b.event_date || "");
  if (!validDate(event_date)) return json({ ok: false, error: "Enter the event date." }, 400);
  const start_time = String(b.start_time || "");
  const end_time = String(b.end_time || "");
  if (!validTime(start_time) || !validTime(end_time)) return json({ ok: false, error: "Enter the start and end times." }, 400);
  const venue = clean(b.venue, 500);
  if (!venue) return json({ ok: false, error: "Enter the venue name and address." }, 400);
  const fee = Number(b.fee);
  if (!isFinite(fee) || fee <= 0 || fee > 50000) return json({ ok: false, error: "Enter the total fee." }, 400);
  const fee_cents = Math.round(fee * 100);
  const deposit_cents = Math.round(fee_cents * 0.25);

  const client_name = clean(b.client_name, 200) || (inquiry.first_name + " " + inquiry.last_name).trim();
  const client_email = clean(b.client_email, 200) || inquiry.email;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client_email)) return json({ ok: false, error: "That client email does not look right." }, 400);

  const token = newToken();
  await env.DB.batch([
    env.DB
      .prepare(
        `INSERT INTO contracts (token, inquiry_id, created_at, status, terms_version, client_name, client_email, experience, event_date, start_time, end_time, venue, fee_cents, deposit_cents)
         VALUES (?, ?, ?, 'sent', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(token, inquiry.id, Date.now(), TERMS_VERSION, client_name, client_email, experience, event_date, start_time, end_time, venue, fee_cents, deposit_cents),
    env.DB.prepare("UPDATE inquiries SET status = 'contract', updated_at = ? WHERE id = ? AND status NOT IN ('signed','booked')").bind(Date.now(), inquiry.id),
  ]);

  const origin = new URL(request.url).origin;
  return json({ ok: true, token, url: origin + "/sign/?t=" + token });
}
