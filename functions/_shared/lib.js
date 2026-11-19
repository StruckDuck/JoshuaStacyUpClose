// Shared helpers for the site's server functions.

export const STATUSES = ["new", "replied", "contract", "signed", "booked", "passed"];
export const EXPERIENCES = { hangout: "The Rounds", station: "The Station", show: "The Show" };
export const TERMS_VERSION = "v1";

export function newToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(24));
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function validDate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + "T12:00:00Z");
  return !isNaN(d) && d.toISOString().slice(0, 10) === s;
}
export function validTime(s) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(s);
}

const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS inquiries (
    id TEXT PRIMARY KEY,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL,
    event_type TEXT NOT NULL,
    event_date TEXT NOT NULL DEFAULT '',
    guest_count TEXT NOT NULL DEFAULT '',
    location TEXT NOT NULL DEFAULT '',
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'new',
    notes TEXT NOT NULL DEFAULT ''
  )`,
  `CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    kind TEXT NOT NULL,
    ip TEXT NOT NULL,
    ts INTEGER NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_events ON events(kind, ip, ts)`,
  `CREATE TABLE IF NOT EXISTS contracts (
    token TEXT PRIMARY KEY,
    inquiry_id TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'sent',
    terms_version TEXT NOT NULL,
    client_name TEXT NOT NULL,
    client_email TEXT NOT NULL,
    experience TEXT NOT NULL,
    event_date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    venue TEXT NOT NULL,
    fee_cents INTEGER NOT NULL,
    deposit_cents INTEGER NOT NULL,
    signed_at INTEGER,
    signed_name TEXT,
    signed_ip TEXT,
    signed_ua TEXT,
    client_phone TEXT,
    onsite_name TEXT,
    onsite_phone TEXT,
    social_choice TEXT,
    ig_handle TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS idx_contracts_inquiry ON contracts(inquiry_id)`,
];

export async function ensureSchema(db) {
  await db.batch(SCHEMA.map((s) => db.prepare(s)));
}

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...extraHeaders },
  });
}

export function clientIp(request) {
  return request.headers.get("CF-Connecting-IP") || "unknown";
}

// Count recent events of a kind for this IP.
export async function recentCount(db, kind, ip, windowMs) {
  const since = Date.now() - windowMs;
  const row = await db
    .prepare("SELECT COUNT(*) AS n FROM events WHERE kind = ? AND ip = ? AND ts > ?")
    .bind(kind, ip, since)
    .first();
  return row ? row.n : 0;
}

export async function recordEvent(db, kind, ip) {
  const now = Date.now();
  await db.prepare("INSERT INTO events (kind, ip, ts) VALUES (?, ?, ?)").bind(kind, ip, now).run();
  // Keep the table small: drop anything older than a day.
  await db.prepare("DELETE FROM events WHERE ts < ?").bind(now - 24 * 3600 * 1000).run();
}

// ---------- Session cookie (signed with the admin passphrase) ----------

const enc = new TextEncoder();

function toHex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmacHex(secret, message) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return toHex(await crypto.subtle.sign("HMAC", key, enc.encode(message)));
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function passphraseMatches(given, expected) {
  // Compare hashes so the comparison does not depend on length.
  const a = toHex(await crypto.subtle.digest("SHA-256", enc.encode(String(given))));
  const b = toHex(await crypto.subtle.digest("SHA-256", enc.encode(String(expected))));
  return safeEqual(a, b);
}

const COOKIE = "jsuc_session";
const SESSION_DAYS = 180;

export async function makeSessionCookie(passphrase) {
  const exp = Date.now() + SESSION_DAYS * 24 * 3600 * 1000;
  const sig = await hmacHex(passphrase, "session:" + exp);
  const value = exp + "." + sig;
  return `${COOKIE}=${value}; Path=/; Max-Age=${SESSION_DAYS * 24 * 3600}; HttpOnly; Secure; SameSite=Strict`;
}

export function clearSessionCookie() {
  return `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;
}

function readCookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  for (const part of header.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return rest.join("=");
  }
  return "";
}

export async function isAuthed(request, env) {
  if (!env.ADMIN_PASSPHRASE) return false;
  const value = readCookie(request, COOKIE);
  const dot = value.indexOf(".");
  if (dot < 1) return false;
  const exp = value.slice(0, dot);
  const sig = value.slice(dot + 1);
  if (!/^\d+$/.test(exp) || Number(exp) < Date.now()) return false;
  const expected = await hmacHex(env.ADMIN_PASSPHRASE, "session:" + exp);
  return safeEqual(sig, expected);
}

export function sameOrigin(request) {
  const origin = request.headers.get("Origin");
  if (!origin) return true; // non-browser or same-site navigation; cookies are SameSite=Strict
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}
