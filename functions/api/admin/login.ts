import { json, type FunctionContext } from "../../_lib/env"
import {
  createSessionToken,
  registerAdminSession,
  SESSION_MAX_AGE_SECONDS,
  verifyAdminPassword,
} from "../../_lib/admin"

const COOKIE_NAME = "admin_session"

export async function onRequestPost({ request, env }: FunctionContext): Promise<Response> {
  if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET || !env.NEXT_PUBLIC_CONVEX_URL) {
    return json({ error: "Admin is not configured" }, 503)
  }

  let password = ""
  try {
    const body = (await request.json()) as { password?: string }
    password = body.password ?? ""
  } catch {
    return json({ error: "Invalid request" }, 400)
  }

  if (!(await verifyAdminPassword(env, password))) {
    return json({ error: "Unauthorised" }, 401)
  }

  const session = await createSessionToken(env)
  if (!(await registerAdminSession(env, session.jti, session.expiresAt))) {
    return json({ error: "Could not start session" }, 503)
  }

  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : ""
  const cookie =
    `${COOKIE_NAME}=${session.token}; HttpOnly; SameSite=Strict; Path=/` +
    `; Max-Age=${SESSION_MAX_AGE_SECONDS}${secure}`

  return json({ success: true }, 200, { "Set-Cookie": cookie })
}
