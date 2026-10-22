import { json, type FunctionContext } from "../../_lib/env"
import { getCookie, readSessionToken, revokeAdminSession } from "../../_lib/admin"

const COOKIE_NAME = "admin_session"

function clearCookie(request: Request): string {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : ""
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure}`
}

export async function onRequestPost({ request, env }: FunctionContext): Promise<Response> {
  const claims = await readSessionToken(env, getCookie(request, COOKIE_NAME))
  // A signed session must be revoked before the cookie is cleared. If revoke
  // fails, keep the cookie so the browser can retry with the same jti.
  if (claims && !(await revokeAdminSession(env, claims.jti))) {
    return json({ error: "Could not revoke session" }, 503)
  }

  return json({ success: true }, 200, { "Set-Cookie": clearCookie(request) })
}
