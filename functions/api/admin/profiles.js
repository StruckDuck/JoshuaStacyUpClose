import { ensureSchema, json, isAuthed, sameOrigin, newToken } from "../../_shared/lib.js";

const FIELDS = [
  ["rounds_base", "rounds_base_cents"],
  ["rounds_extra", "rounds_extra_cents"],
  ["station_base", "station_base_cents"],
  ["station_extra", "station_extra_cents"],
  ["show_flat", "show_flat_cents"],
  ["show_extra", "show_extra_cents"],
];

function view(r) {
  return {
    id: r.id,
    name: r.name,
    rounds_base: r.rounds_base_cents / 100,
    rounds_extra: r.rounds_extra_cents / 100,
    station_base: r.station_base_cents / 100,
    station_extra: r.station_extra_cents / 100,
    show_flat: r.show_flat_cents / 100,
    show_extra: r.show_extra_cents / 100,
  };
}

async function list(env) {
  const { results } = await env.DB.prepare("SELECT * FROM price_profiles ORDER BY lower(name)").all();
  return (results || []).map(view);
}

export async function onRequestGet({ request, env }) {
  if (!(await isAuthed(request, env))) return json({ ok: false }, 401);
  if (!env.DB) return json({ ok: false, error: "storage not set up" }, 500);
  await ensureSchema(env.DB);
  return json({ ok: true, profiles: await list(env) });
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

  if (b.action === "delete") {
    await env.DB.prepare("DELETE FROM price_profiles WHERE id = ?").bind(String(b.id || "")).run();
    return json({ ok: true, profiles: await list(env) });
  }

  if (b.action !== "save") return json({ ok: false }, 400);

  const name = String(b.name == null ? "" : b.name).trim().slice(0, 60);
  if (!name) return json({ ok: false, error: "Give the profile a name." }, 400);

  const cents = {};
  for (const [key, col] of FIELDS) {
    const n = Number(b[key]);
    if (!isFinite(n) || n < 0 || n > 50000) return json({ ok: false, error: "Check the prices. Every field needs a number." }, 400);
    cents[col] = Math.round(n * 100);
  }

  const dup = await env.DB
    .prepare("SELECT id FROM price_profiles WHERE lower(name) = lower(?) AND id != ?")
    .bind(name, String(b.id || ""))
    .first();
  if (dup) return json({ ok: false, error: "A profile with that name already exists." }, 409);

  const now = Date.now();
  let id = String(b.id || "");
  const existing = id ? await env.DB.prepare("SELECT id FROM price_profiles WHERE id = ?").bind(id).first() : null;
  if (existing) {
    await env.DB
      .prepare(
        `UPDATE price_profiles SET name = ?, rounds_base_cents = ?, rounds_extra_cents = ?, station_base_cents = ?, station_extra_cents = ?,
         show_flat_cents = ?, show_extra_cents = ?, updated_at = ? WHERE id = ?`
      )
      .bind(name, cents.rounds_base_cents, cents.rounds_extra_cents, cents.station_base_cents, cents.station_extra_cents, cents.show_flat_cents, cents.show_extra_cents, now, id)
      .run();
  } else {
    id = newToken().slice(0, 16);
    await env.DB
      .prepare(
        `INSERT INTO price_profiles (id, name, rounds_base_cents, rounds_extra_cents, station_base_cents, station_extra_cents, show_flat_cents, show_extra_cents, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(id, name, cents.rounds_base_cents, cents.rounds_extra_cents, cents.station_base_cents, cents.station_extra_cents, cents.show_flat_cents, cents.show_extra_cents, now, now)
      .run();
  }
  return json({ ok: true, id, profiles: await list(env) });
}
