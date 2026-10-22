import { v } from "convex/values"
import { mutation } from "./_generated/server"

// Admin session rows keyed by the jti inside the signed admin_session cookie.
// Logout sets revoked; admin endpoints call check and reject the cookie when
// the row is missing, revoked, or past expiresAt. Gated by ADMIN_PASSWORD,
// which the Pages Functions hold server-side.
const JTI = /^[0-9a-f]{32}$/
// Login issues a 12h cookie. Allow an hour of clock skew and nothing longer,
// so a caller who knows the admin password cannot register a year-long jti.
const MAX_TTL_MS = 13 * 60 * 60 * 1000

function authorised(adminToken: string): boolean {
  const secret = process.env.ADMIN_PASSWORD
  return !!secret && adminToken === secret
}

export const register = mutation({
  args: {
    jti: v.string(),
    expiresAt: v.number(),
    adminToken: v.string(),
  },
  handler: async (ctx, args) => {
    if (!authorised(args.adminToken)) {
      return { success: false, error: "Unauthorised" }
    }

    const now = Date.now()
    if (
      !JTI.test(args.jti) ||
      !Number.isSafeInteger(args.expiresAt) ||
      args.expiresAt <= now ||
      args.expiresAt > now + MAX_TTL_MS
    ) {
      return { success: false, error: "Invalid request" }
    }

    const existing = await ctx.db
      .query("adminSessions")
      .withIndex("by_jti", (q) => q.eq("jti", args.jti))
      .first()
    // Refuse to resurrect a revoked or live jti. Login always mints a new one.
    if (existing) {
      return { success: false, error: "Invalid request" }
    }

    await ctx.db.insert("adminSessions", {
      jti: args.jti,
      expiresAt: args.expiresAt,
      revoked: false,
    })
    return { success: true }
  },
})

export const revoke = mutation({
  args: {
    jti: v.string(),
    adminToken: v.string(),
  },
  handler: async (ctx, args) => {
    if (!authorised(args.adminToken)) {
      return { success: false, error: "Unauthorised" }
    }
    if (!JTI.test(args.jti)) {
      return { success: false, error: "Invalid request" }
    }

    const row = await ctx.db
      .query("adminSessions")
      .withIndex("by_jti", (q) => q.eq("jti", args.jti))
      .first()
    if (row && !row.revoked) {
      await ctx.db.patch(row._id, { revoked: true })
    }
    return { success: true }
  },
})

// Mutation rather than query so the read is not served from a cached query
// result after revoke, and so Date.now() is allowed.
export const check = mutation({
  args: {
    jti: v.string(),
    adminToken: v.string(),
  },
  handler: async (ctx, args) => {
    if (!authorised(args.adminToken) || !JTI.test(args.jti)) {
      return { active: false }
    }

    const row = await ctx.db
      .query("adminSessions")
      .withIndex("by_jti", (q) => q.eq("jti", args.jti))
      .first()
    const active = !!row && !row.revoked && row.expiresAt > Date.now()
    return { active }
  },
})
