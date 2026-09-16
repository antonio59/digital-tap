import { v } from "convex/values"
import { internal } from "./_generated/api"
import { internalAction, internalMutation, query } from "./_generated/server"

// Primary source: TfL's published FOI response. Fallback: the untap.money
// journal article that cites the same FOI (tfl.gov.uk WAF-blocks some
// datacenter traffic, so a secondary source keeps the refresh working).
const SOURCES = [
  "https://tfl.gov.uk/corporate/transparency/freedom-of-information/foi-request-detail?referenceId=FOI-4311-2324",
  "https://untap.money/journal/the-forgotten-tap",
]
const FOI_KEY = "tfl-incomplete-journeys"
const CLAIM_WINDOW_WEEKS = 8

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "en-GB,en;q=0.9",
}

// Latest stored FOI figures. Public so the landing page can render them;
// returns null until the first successful refresh (the UI falls back to
// the values hardcoded in the component).
export const latest = query({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db
      .query("foiStats")
      .withIndex("by_key", (q) => q.eq("key", FOI_KEY))
      .first()
    return row
  },
})

export const upsert = internalMutation({
  args: {
    key: v.string(),
    year: v.number(),
    incompleteJourneys: v.string(),
    autoCompleted: v.string(),
    chargedMaxFare: v.string(),
    totalRevenue: v.string(),
    claimWindowWeeks: v.number(),
    sourceUrl: v.string(),
    fetchedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("foiStats")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first()
    if (existing) {
      await ctx.db.patch(existing._id, args)
    } else {
      await ctx.db.insert("foiStats", args)
    }
  },
})

// Weekly refresh of TfL's FOI disclosure for incomplete-journey statistics.
// Parses the published response text; on any fetch or parse failure it keeps
// the previously stored row so the site never loses the figures.
export const refresh = internalAction({
  args: {},
  handler: async (ctx) => {
    let text = ""
    let sourceUrl = ""
    let lastStatus = 0
    for (const url of SOURCES) {
      const response = await fetch(url, { headers: FETCH_HEADERS })
      lastStatus = response.status
      if (!response.ok) continue
      text = (await response.text())
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;?/g, " ")
        .replace(/\s+/g, " ")
      sourceUrl = url
      break
    }
    if (!text) {
      return { success: false, error: `All sources failed (last: HTTP ${lastStatus})` }
    }

    // Source-agnostic patterns: TfL says "22.2m journeys were charged maximum
    // fares ... totalling £164.7m"; untap says "22.2 million journeys, get the
    // maximum-fare treatment" and "£164.7m ... in maximum fares".
    const revenueMatch = text.match(/£([\d.]+)\s*m(?:illion)?\b/i)
    const chargedMatch = text.match(
      /([\d.]+)\s*m(?:illion)?\s*journeys[^.]{0,60}maximum[- ]?fares?/i,
    )
    const autoMatch =
      text.match(/([\d.]+)\s*m(?:illion)?[^.]{0,60}autocompleted/i) ??
      text.match(/caught ([\d.]+)\s*million/i)
    const totalMatch =
      text.match(/([\d.]+)\s*m(?:illion)?[^.]{0,60}without a tap-?out/i) ??
      text.match(/([\d.]+)\s*m(?:illion)?\s+incomplete journeys/i)

    if (!chargedMatch || !revenueMatch) {
      return { success: false, error: "Could not parse response text" }
    }

    const chargedNum = parseFloat(chargedMatch[1])
    const autoNum = autoMatch ? parseFloat(autoMatch[1]) : 0
    const totalNum = totalMatch ? parseFloat(totalMatch[1]) : autoNum + chargedNum

    const stats = {
      key: FOI_KEY,
      year: 2023,
      incompleteJourneys: `${totalNum} million`,
      autoCompleted: autoMatch ? `${autoNum} million` : "",
      chargedMaxFare: `${chargedNum} million`,
      totalRevenue: `£${revenueMatch[1]} million`,
      claimWindowWeeks: CLAIM_WINDOW_WEEKS,
      sourceUrl,
      fetchedAt: Date.now(),
    }

    await ctx.runMutation(internal.foi.upsert, stats)
    return { success: true, stats }
  },
})
