import { v } from "convex/values"
import { internalMutation, mutation, type MutationCtx } from "./_generated/server"
import type { Id } from "./_generated/dataModel"

async function deleteBlob(
  ctx: MutationCtx,
  storageId: Id<"_storage"> | undefined,
  removed: Set<string>,
) {
  if (!storageId || removed.has(storageId)) return
  removed.add(storageId)
  await ctx.storage.delete(storageId)
}

// GDPR/UK-DPA erasure path promised in app/privacy/page.tsx. The identifier
// the person sends is their anonymous client id (`ldt_user_id`). Votes and
// comments also keep the token id in userId, so match either field. Comment
// images and not-yet-attached upload blobs are deleted with the rows.
export const eraseUser = mutation({
  args: {
    userId: v.string(),
    adminToken: v.string(),
  },
  handler: async (ctx, args) => {
    const secret = process.env.ADMIN_PASSWORD
    if (!secret || args.adminToken !== secret) {
      return { success: false, error: "Unauthorised" }
    }
    if (args.userId.length === 0 || args.userId.length > 256) {
      return { success: false, error: "Invalid request" }
    }

    let deleted = 0
    const id = args.userId
    const removedBlobs = new Set<string>()

    for (const row of await collectVotes(ctx, id)) {
      await ctx.db.delete(row._id)
      deleted++
    }

    for (const row of await collectComments(ctx, id)) {
      await deleteBlob(ctx, row.imageStorageId, removedBlobs)
      await ctx.db.delete(row._id)
      deleted++
    }

    const uploads = await ctx.db
      .query("pendingUploads")
      .withIndex("by_client", (q) => q.eq("clientId", id))
      .collect()
    for (const row of uploads) {
      await deleteBlob(ctx, row.storageId, removedBlobs)
      await ctx.db.delete(row._id)
      deleted++
    }

    const analytics = await ctx.db
      .query("analytics")
      .withIndex("by_user", (q) => q.eq("userId", id))
      .collect()
    for (const row of analytics) {
      await ctx.db.delete(row._id)
      deleted++
    }

    return { success: true, deleted }
  },
})

async function collectVotes(ctx: MutationCtx, id: string) {
  const byUser = await ctx.db
    .query("votes")
    .withIndex("by_user", (q) => q.eq("userId", id))
    .collect()
  const byClient = await ctx.db
    .query("votes")
    .withIndex("by_client", (q) => q.eq("clientId", id))
    .collect()
  const seen = new Set<Id<"votes">>()
  const rows = []
  for (const row of [...byUser, ...byClient]) {
    if (seen.has(row._id)) continue
    seen.add(row._id)
    rows.push(row)
  }
  return rows
}

async function collectComments(ctx: MutationCtx, id: string) {
  const byUser = await ctx.db
    .query("comments")
    .withIndex("by_user", (q) => q.eq("userId", id))
    .collect()
  const byClient = await ctx.db
    .query("comments")
    .withIndex("by_client", (q) => q.eq("clientId", id))
    .collect()
  const seen = new Set<Id<"comments">>()
  const rows = []
  for (const row of [...byUser, ...byClient]) {
    if (seen.has(row._id)) continue
    seen.add(row._id)
    rows.push(row)
  }
  return rows
}

const PENDING_UPLOAD_TTL_MS = 24 * 60 * 60 * 1000

// Sweeps pendingUploads older than the TTL: deletes the blob if the client
// completed the upload, then removes the intent row. This is the reclamation
// path for blobs minted but never attached to a comment.
export const cleanupPendingUploads = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff = Date.now() - PENDING_UPLOAD_TTL_MS
    const stale = await ctx.db
      .query("pendingUploads")
      .collect()

    let removed = 0
    for (const row of stale) {
      if (row._creationTime > cutoff) continue
      if (row.storageId) {
        await ctx.storage.delete(row.storageId)
      }
      await ctx.db.delete(row._id)
      removed++
    }
    return { removed }
  },
})
