import type { Env } from "./env"
import { convexMutation } from "./convex"

const SESSION_PAYLOAD = "dlr-digital-tap:admin-session:v2"
const SESSION_TTL_MS = 12 * 60 * 60 * 1000
export const SESSION_MAX_AGE_SECONDS = SESSION_TTL_MS / 1000
const encoder = new TextEncoder()

// SESSION_SECRET is a dedicated high-entropy HMAC key. It is required.
// ADMIN_PASSWORD is not a fallback, so a captured cookie is not an offline
// oracle for the interactive password.
function sessionSecret(env: Env): string | undefined {
  return env.SESSION_SECRET || undefined
}

async function hmacHex(key: string, message: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  )
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(message))
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("")
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value))
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("")
}

/** Constant-time compare of equal-length strings. */
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

export async function verifyAdminPassword(env: Env, candidate: string | undefined): Promise<boolean> {
  if (!env.ADMIN_PASSWORD || !candidate) return false
  // Hash both sides first so safeCompare never leaks the password length.
  const [a, b] = await Promise.all([sha256Hex(candidate), sha256Hex(env.ADMIN_PASSWORD)])
  return safeCompare(a, b)
}

export type SessionClaims = { expMs: number; jti: string }

function randomJti(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("")
}

/** Signed cookie payload: "<expiryMs>.<jti>.<HMAC>".
 *  Does not check server-side revocation — authorization must use
 *  verifySessionToken, which also requires the jti to still be active. */
export async function readSessionToken(
  env: Env,
  token: string | undefined,
): Promise<SessionClaims | null> {
  const secret = sessionSecret(env)
  if (!secret || !token) return null
  const parts = token.split(".")
  if (parts.length !== 3) return null
  const [exp, jti, sig] = parts
  if (!/^\d{10,16}$/.test(exp) || !/^[0-9a-f]{32}$/.test(jti) || !/^[0-9a-f]{64}$/.test(sig)) {
    return null
  }
  const expMs = Number(exp)
  if (!Number.isSafeInteger(expMs)) return null
  const expected = await hmacHex(secret, `${SESSION_PAYLOAD}:${exp}:${jti}`)
  if (!safeCompare(sig, expected)) return null
  return { expMs, jti }
}

export async function createSessionToken(
  env: Env,
): Promise<{ token: string; jti: string; expiresAt: number }> {
  const secret = sessionSecret(env)
  if (!secret) {
    throw new Error("SESSION_SECRET is not configured")
  }
  const expiresAt = Date.now() + SESSION_TTL_MS
  const exp = expiresAt.toString()
  const jti = randomJti()
  const sig = await hmacHex(secret, `${SESSION_PAYLOAD}:${exp}:${jti}`)
  return { token: `${exp}.${jti}.${sig}`, jti, expiresAt }
}

async function sessionIsActive(env: Env, jti: string): Promise<boolean> {
  if (!env.NEXT_PUBLIC_CONVEX_URL || !env.ADMIN_PASSWORD) return false
  try {
    const result = await convexMutation<{ active: boolean }>(
      env.NEXT_PUBLIC_CONVEX_URL,
      "adminSessions:check",
      { jti, adminToken: env.ADMIN_PASSWORD },
    )
    return result.active === true
  } catch {
    console.error("Admin session check failed")
    return false
  }
}

/** Authorization check for admin endpoints: signature, expiry, and a live jti. */
export async function verifySessionToken(env: Env, token: string | undefined): Promise<boolean> {
  const claims = await readSessionToken(env, token)
  if (!claims || claims.expMs < Date.now()) return false
  return sessionIsActive(env, claims.jti)
}

export async function registerAdminSession(env: Env, jti: string, expiresAt: number): Promise<boolean> {
  if (!env.NEXT_PUBLIC_CONVEX_URL || !env.ADMIN_PASSWORD) return false
  try {
    const result = await convexMutation<{ success: boolean }>(
      env.NEXT_PUBLIC_CONVEX_URL,
      "adminSessions:register",
      { jti, expiresAt, adminToken: env.ADMIN_PASSWORD },
    )
    return result.success === true
  } catch {
    console.error("Admin session registration failed")
    return false
  }
}

export async function revokeAdminSession(env: Env, jti: string): Promise<boolean> {
  if (!env.NEXT_PUBLIC_CONVEX_URL || !env.ADMIN_PASSWORD) return false
  try {
    const result = await convexMutation<{ success: boolean }>(
      env.NEXT_PUBLIC_CONVEX_URL,
      "adminSessions:revoke",
      { jti, adminToken: env.ADMIN_PASSWORD },
    )
    return result.success === true
  } catch {
    console.error("Admin session revocation failed")
    return false
  }
}

export function getCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get("Cookie")
  if (!header) return undefined
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=")
    if (k === name) return v.join("=")
  }
  return undefined
}
