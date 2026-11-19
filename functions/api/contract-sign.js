import { ensureSchema, json, clientIp, sameOrigin } from "../_shared/lib.js";

function clean(v, max) {
  return String(v == null ? "" : v).trim().slice(0, max);
}

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ ok: false }, 403);
  if (!env.DB) return json({ ok: false, error: "unavailable" }, 500);

  let b;
  try {
    b = await request.json();
  } catch {
    return json({ ok: false }, 400);
  }

  const token = String(b.t || "");
  if (token.length < 20 || token.length > 64) return json({ ok: false, error: "not found" }, 404);
  if (b.agree !== true) return json({ ok: false, error: "Please tick the box to agree to sign electronically." }, 400);

  const typed = clean(b.typed_name, 200);
  const phone = clean(b.phone, 40);
  const onsiteName = clean(b.onsite_name, 200);
  const onsitePhone = clean(b.onsite_phone, 40);
  const social = String(b.social || "");
  let ig = clean(b.ig, 60).replace(/^@+/, "");

  if (typed.length < 2) return json({ ok: false, error: "Type your full name to sign." }, 400);
  if (phone.replace(/\D/g, "").length < 7) return json({ ok: false, error: "Enter a phone number." }, 400);
  if (!onsiteName || onsitePhone.replace(/\D/g, "").length < 7) return json({ ok: false, error: "Enter an on-site contact name and phone." }, 400);
  if (!["tag", "post", "none"].includes(social)) return json({ ok: false, error: "Choose a photo and video option." }, 400);
  if (social === "tag" && !ig) return json({ ok: false, error: "Enter your Instagram handle, or choose another option." }, 400);
  if (social !== "tag") ig = "";

  await ensureSchema(env.DB);
  const c = await env.DB.prepare("SELECT * FROM contracts WHERE token = ?").bind(token).first();
  if (!c) return json({ ok: false, error: "not found" }, 404);
  if (c.status === "signed") return json({ ok: false, error: "This agreement is already signed." }, 409);
  if (c.status !== "sent") return json({ ok: false, error: "This agreement is no longer active." }, 409);

  const now = Date.now();
  const res = await env.DB
    .prepare(
      `UPDATE contracts SET status = 'signed', signed_at = ?, signed_name = ?, signed_ip = ?, signed_ua = ?,
         client_phone = ?, onsite_name = ?, onsite_phone = ?, social_choice = ?, ig_handle = ?
       WHERE token = ? AND status = 'sent'`
    )
    .bind(now, typed, clientIp(request), clean(request.headers.get("User-Agent"), 300), phone, onsiteName, onsitePhone, social, ig, token)
    .run();
  if (!res.meta || res.meta.changes !== 1) return json({ ok: false, error: "This agreement is already signed." }, 409);

  await env.DB
    .prepare("UPDATE inquiries SET status = 'signed', updated_at = ? WHERE id = ? AND status != 'booked'")
    .bind(now, c.inquiry_id)
    .run();

  return json({ ok: true });
}
