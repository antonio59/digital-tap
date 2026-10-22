import { v } from "convex/values"
import { mutation } from "./_generated/server"

// Fixed-window counter for the contact-form Pages Function.
//
// This stays a public mutation because Pages calls it over the Convex HTTP
// API, which cannot invoke internal functions. Anonymous callers still cannot
// move a counter: TOKEN_ISSUER_SECRET is required. Keys prefixed "tok:" belong
// to tokens:issue and are rejected here so this path cannot reset token
// issuance quotas. windowMs is fixed on the row when the window opens; a later
// argument is ignored and cannot expire the counter early.
export const consume = mutation({
  args: {
    key: v.string(),
    limit: v.number(),
    windowMs: v.number(),
    issuerSecret: v.string(),
  },
  handler: async (ctx, args) => {
    const secret = process.env.TOKEN_ISSUER_SECRET
    if (!secret || args.issuerSecret !== secret) {
      // Throw so the Pages Function treats a bad secret as misconfiguration
      // (503) rather than a consumed quota (429). No counter is written.
      throw new Error("Unauthorised")
    }

    if (
      args.key.length === 0 ||
      args.key.length > 128 ||
      args.key.toLowerCase().startsWith("tok:") ||
      !Number.isInteger(args.limit) ||
      args.limit < 1 ||
      args.limit > 1000 ||
      !Number.isInteger(args.windowMs) ||
      args.windowMs < 1000 ||
      args.windowMs > 30 * 24 * 60 * 60 * 1000
    ) {
      return { allowed: false }
    }

    const now = Date.now()
    const existing = await ctx.db
      .query("rateLimits")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first()

    if (!existing) {
      await ctx.db.insert("rateLimits", {
        key: args.key,
        windowStart: now,
        count: 1,
        windowMs: args.windowMs,
      })
      return { allowed: true }
    }

    // Legacy rows predate windowMs. The authenticated caller may declare the
    // length once. After this write, only the stored window can expire the row.
    if (existing.windowMs === undefined) {
      if (now - existing.windowStart >= args.windowMs) {
        await ctx.db.patch(existing._id, {
          windowStart: now,
          count: 1,
          windowMs: args.windowMs,
        })
        return { allowed: true }
      }
      if (existing.count >= args.limit) {
        await ctx.db.patch(existing._id, { windowMs: args.windowMs })
        return { allowed: false }
      }
      await ctx.db.patch(existing._id, {
        windowMs: args.windowMs,
        count: existing.count + 1,
      })
      return { allowed: true }
    }

    if (now - existing.windowStart >= existing.windowMs) {
      await ctx.db.patch(existing._id, {
        windowStart: now,
        count: 1,
        windowMs: existing.windowMs,
      })
      return { allowed: true }
    }

    if (existing.count >= args.limit) {
      return { allowed: false }
    }

    await ctx.db.patch(existing._id, { count: existing.count + 1 })
    return { allowed: true }
  },
})
