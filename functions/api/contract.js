import { ensureSchema, json, clientIp, recentCount, recordEvent } from "./../_shared/lib.js";

// Public: look up an agreement by its private link token.
export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ ok: false, error: "unavailable" }, 500);
  const token = new URL(request.url).searchParams.get("t") || "";
  await ensureSchema(env.DB);
  const ip = clientIp(request);
  if ((await recentCount(env.DB, "bad_token", ip, 3600 * 1000)) >= 40) return json({ ok: false, error: "slow down" }, 429);

  const c = token.length >= 20 && token.length <= 64
    ? await env.DB.prepare("SELECT * FROM contracts WHERE token = ?").bind(token).first()
    : null;
  if (!c) {
    await recordEvent(env.DB, "bad_token", ip);
    return json({ ok: false, error: "not found" }, 404);
  }
  if (c.status === "void") return json({ ok: true, status: "void" });

  const out = {
    ok: true,
    status: c.status,
    terms_version: c.terms_version,
    created_at: c.created_at,
    client_name: c.client_name,
    client_email: c.client_email,
    experience: c.experience,
    event_date: c.event_date,
    start_time: c.start_time,
    end_time: c.end_time,
    venue: c.venue,
    fee_cents: c.fee_cents,
    deposit_cents: c.deposit_cents,
  };
  if (c.status === "signed") {
    out.signed = {
      at: c.signed_at,
      name: c.signed_name,
      phone: c.client_phone,
      onsite_name: c.onsite_name,
      onsite_phone: c.onsite_phone,
      social: c.social_choice,
      ig: c.ig_handle,
    };
  }
  return json(out);
}
