import { cronJobs } from "convex/server"
import { internal } from "./_generated/api"

const crons = cronJobs()

crons.interval(
  "sweep orphaned pending uploads",
  { hours: 24 },
  internal.lifecycle.cleanupPendingUploads,
)

crons.interval(
  "refresh TfL FOI statistics",
  { hours: 168 },
  internal.foi.refresh,
)

export default crons
