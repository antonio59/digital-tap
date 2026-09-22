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
// FOI-4349-2324: contactless-only breakdown (bank card vs mobile) for the 13
// months Jan 2023–Feb 2024. Publishes absolute figures rather than "Xm"
// shorthand, so it gets its own fetch and parser.
const DEVICE_SOURCE =
  "https://tfl.gov.uk/corporate/transparency/freedom-of-information/foi-request-detail?referenceId=FOI-4349-2324"
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
    devicePeriod: v.optional(v.string()),
    deviceIncompleteJourneys: v.optional(v.string()),
    deviceTotalCharged: v.optional(v.string()),
    deviceMobileCharged: v.optional(v.string()),
    deviceAverageCharge: v.optional(v.string()),
    deviceSourceUrl: v.optional(v.string()),
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

const parseCount = (raw: string) => parseFloat(raw.replace(/,/g, ""))
const toMillions = (n: number) => `${(n / 1e6).toFixed(1)} million`
const toPoundMillions = (raw: string) => `£${(parseCount(raw) / 1e6).toFixed(1)} million`

// Fetches each URL in order and returns the first OK response as plain text
// (tags stripped, whitespace collapsed). Returns "" when every source fails.
async function fetchPageText(urls: string[]): Promise<{ text: string; url: string; status: number }> {
  let lastStatus = 0
  for (const url of urls) {
    const response = await fetch(url, { headers: FETCH_HEADERS })
    lastStatus = response.status
    if (!response.ok) continue
    const text = (await response.text())
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;?/g, " ")
      .replace(/\s+/g, " ")
    return { text, url, status: lastStatus }
  }
  return { text: "", url: "", status: lastStatus }
}

// FOI-4349-2324 reports absolute figures ("15,197,885 ... £231,495,328.55")
// split by bank card vs mobile for the 13 months to 28 Feb 2024.
function parseDeviceStats(text: string) {
  const bankMatch = text.match(/([\d,]+)\s*un-started or unfinished journeys using a bank card/i)
  const mobileMatch = text.match(/([\d,]+)\s*un-started or unfinished journeys using a mobile phone/i)
  const totalMatch = text.match(/total charge for these journeys is £([\d,]+(?:\.\d+)?)/i)
  const mobileChargeMatch = text.match(/£([\d,]+(?:\.\d+)?)\s*on phone/i)
  const avgMatch = text.match(/average charge of £([\d.]+)/i)
  const periodMatch = text.match(/information is from (\d{1,2} \w+ \d{4}) to (\d{1,2} \w+ \d{4})/i)

  if (!bankMatch || !mobileMatch || !totalMatch) return undefined

  return {
    devicePeriod: periodMatch ? `${periodMatch[1]} to ${periodMatch[2]}` : "January 2023 to February 2024",
    deviceIncompleteJourneys: toMillions(parseCount(bankMatch[1]) + parseCount(mobileMatch[1])),
    deviceTotalCharged: toPoundMillions(totalMatch[1]),
    deviceMobileCharged: mobileChargeMatch ? toPoundMillions(mobileChargeMatch[1]) : "",
    deviceAverageCharge: avgMatch ? `£${avgMatch[1]}` : "",
    deviceSourceUrl: DEVICE_SOURCE,
  }
}

// Weekly refresh of TfL's FOI disclosure for incomplete-journey statistics.
// Parses the published response text; on any fetch or parse failure it keeps
// the previously stored row so the site never loses the figures.
export const refresh = internalAction({
  args: {},
  handler: async (ctx) => {
    const annual = await fetchPageText(SOURCES)
    if (!annual.text) {
      return { success: false, error: `All sources failed (last: HTTP ${annual.status})` }
    }
    const text = annual.text
    const sourceUrl = annual.url

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

    // Device split is opportunistic: a failure must not block the annual update.
    const devicePage = await fetchPageText([DEVICE_SOURCE])
    const device = devicePage.text ? parseDeviceStats(devicePage.text) : undefined

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
      ...(device ?? {}),
    }

    await ctx.runMutation(internal.foi.upsert, stats)
    return { success: true, stats }
  },
})
