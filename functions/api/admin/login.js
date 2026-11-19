import { ensureSchema, json, clientIp, recentCount, recordEvent, sameOrigin, passphraseMatches, makeSessionCookie } from "../../_shared/lib.js";

export async function onRequestPost({ request, env }) {
  if (!sameOrigin(request)) return json({ ok: false }, 403);
  if (!env.DB || !env.ADMIN_PASSPHRASE) return json({ ok: false, error: "not set up" }, 500);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false }, 400);
  }

  await ensureSchema(env.DB);
  const ip = clientIp(request);
  if ((await recentCount(env.DB, "login_fail", ip, 15 * 60 * 1000)) >= 8) {
    return json({ ok: false, error: "Too many tries. Wait 15 minutes." }, 429);
  }

  if (!(await passphraseMatches(body.passphrase || "", env.ADMIN_PASSPHRASE))) {
    await recordEvent(env.DB, "login_fail", ip);
    return json({ ok: false, error: "That passphrase is not right." }, 401);
  }

  return json({ ok: true }, 200, { "Set-Cookie": await makeSessionCookie(env.ADMIN_PASSPHRASE) });
}
