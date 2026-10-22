import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

export default defineSchema({
  votes: defineTable({
    userId: v.string(),
    // Anonymous browser id (ldt_user_id), used for erasure. Optional so rows
    // written before this field existed still validate; new writes always set it.
    clientId: v.optional(v.string()),
    feedback: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_client", ["clientId"]),

  comments: defineTable({
    userId: v.string(),
    clientId: v.optional(v.string()),
    name: v.string(),
    comment: v.string(),
    imageUrl: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
  })
    .index("by_user", ["userId"])
    .index("by_client", ["clientId"]),

  analytics: defineTable({
    eventType: v.string(),
    page: v.string(),
    userId: v.optional(v.string()),
    metadata: v.optional(v.any()),
  })
    .index("by_event_type", ["eventType"])
    .index("by_page", ["page"])
    .index("by_user", ["userId"]),

  // Single-use action tokens minted by the /api/voter-token Pages Function.
  // Issuance is rate-limited per source IP; a token must be presented (and is
  // consumed) by votes.submit, comments.submit and comments.generateUploadUrl.
  voterTokens: defineTable({
    used: v.boolean(),
  }),

  // Fixed-window rate-limit counters. Keys are namespaced SHA-256 hashes
  // (e.g. "tok:<sha256(ip)>", "contact:<sha256(ip)>"). windowMs is fixed when
  // the window opens so a later caller cannot shrink it and reset the counter.
  rateLimits: defineTable({
    key: v.string(),
    windowStart: v.number(),
    count: v.number(),
    windowMs: v.optional(v.number()),
  })
    .index("by_key", ["key"]),

  // Upload intents registered by generateUploadUrl. The storageId is recorded
  // by confirmUpload so orphaned blobs can be swept by the lifecycle cron and
  // so comments.submit can prove blob provenance.
  pendingUploads: defineTable({
    tokenId: v.id("voterTokens"),
    storageId: v.optional(v.id("_storage")),
    // Same anonymous browser id as the comment, so erasure can delete a blob
    // that was uploaded but not yet attached.
    clientId: v.optional(v.string()),
  })
    .index("by_token", ["tokenId"])
    .index("by_client", ["clientId"]),

  // Server-side admin sessions. The cookie carries a signed jti; logout sets
  // revoked so a copied cookie stops working before expiresAt.
  adminSessions: defineTable({
    jti: v.string(),
    expiresAt: v.number(),
    revoked: v.boolean(),
  })
    .index("by_jti", ["jti"]),

  // Latest figures pulled from TfL's FOI disclosure page by the weekly cron.
  // One row per dataset key; the site renders these with a hardcoded fallback.
  foiStats: defineTable({
    key: v.string(),
    year: v.number(),
    incompleteJourneys: v.string(),
    autoCompleted: v.string(),
    chargedMaxFare: v.string(),
    totalRevenue: v.string(),
    claimWindowWeeks: v.number(),
    sourceUrl: v.string(),
    fetchedAt: v.number(),
    // FOI-4349-2324: bank-card + mobile incomplete journeys, 25 Jan 2023 to
    // 28 Feb 2024. Optional so pre-existing rows stay valid.
    devicePeriod: v.optional(v.string()),
    deviceIncompleteJourneys: v.optional(v.string()),
    deviceTotalCharged: v.optional(v.string()),
    deviceMobileCharged: v.optional(v.string()),
    deviceAverageCharge: v.optional(v.string()),
    deviceSourceUrl: v.optional(v.string()),
  })
    .index("by_key", ["key"]),
})
