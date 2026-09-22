"use client"

import { useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { COMPLAINT_POSTS } from "@/lib/complaints"
import { ExternalLink, MessageSquare } from "lucide-react"

// Real complaints about tap-in/tap-out ticketing, surfaced from public forums
// and press coverage. Replaces the old Twitter timeline: the point of this
// block is showing that the problem is real, in passengers' own words.
// The headline figures come from a weekly Convex cron that re-parses TfL's
// FOI disclosure pages; the constants below are the fallback until the first
// successful refresh lands.
const DEVICE_FOI_URL =
  "https://tfl.gov.uk/corporate/transparency/freedom-of-information/foi-request-detail?referenceId=FOI-4349-2324"
const FALLBACK = {
  totalRevenue: "£164.7 million",
  chargedMaxFare: "22.2 million",
  claimWindowWeeks: 8,
  year: 2023,
  // FOI-4349-2324: contactless-only journeys, 25 Jan 2023 – 28 Feb 2024.
  devicePeriod: "25 January 2023 to 28 February 2024",
  deviceIncompleteJourneys: "36.3 million",
  deviceTotalCharged: "£231.5 million",
  deviceMobileCharged: "£134.0 million",
  deviceAverageCharge: "£6.39",
  deviceSourceUrl: DEVICE_FOI_URL,
}

export default function SocialFeed() {
  const foi = useQuery(api.foi.latest)
  const stats = { ...FALLBACK, ...(foi ?? {}) }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <MessageSquare className="h-5 w-5 mr-2 text-blue-500" />
          The problem, in passengers&apos; own words
        </CardTitle>
      </CardHeader>
      <CardContent>
        <a
          href={foi?.sourceUrl ?? "https://untap.money/journal/the-forgotten-tap"}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-lg bg-blue-50 p-4 mb-5 hover:bg-blue-100 transition-colors"
        >
          <p className="text-2xl font-extrabold text-blue-700">{stats.totalRevenue}</p>
          <p className="text-sm text-blue-900 mt-1">
            charged by TfL in maximum fares for missed tap-outs in {stats.year} alone:{" "}
            {stats.chargedMaxFare} journeys, most refundable only if you claim within{" "}
            {stats.claimWindowWeeks} weeks.
            <span className="ml-1 inline-flex items-center text-blue-600">
              Source <ExternalLink className="h-3 w-3 ml-1" />
            </span>
          </p>
        </a>

        {stats.deviceTotalCharged && (
          <a
            href={stats.deviceSourceUrl ?? DEVICE_FOI_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="block rounded-lg bg-indigo-50 p-4 mb-5 hover:bg-indigo-100 transition-colors"
          >
            <p className="text-xl font-extrabold text-indigo-700">{stats.deviceTotalCharged}</p>
            <p className="text-sm text-indigo-900 mt-1">
              charged for {stats.deviceIncompleteJourneys} incomplete journeys on bank cards and
              phones alone ({stats.devicePeriod}) — {stats.deviceMobileCharged} of it on phones, at
              an average {stats.deviceAverageCharge} per journey.
              <span className="ml-1 inline-flex items-center text-indigo-600">
                Source <ExternalLink className="h-3 w-3 ml-1" />
              </span>
            </p>
          </a>
        )}

        <ul className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
          {COMPLAINT_POSTS.map((post) => (
            <li key={post.url}>
              <a
                href={post.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-lg border border-gray-100 p-4 hover:border-blue-200 hover:bg-gray-50 transition-colors"
              >
                <p className="text-sm text-gray-700 italic">&ldquo;{post.quote}&rdquo;</p>
                <p className="mt-2 text-xs text-gray-500">{post.context}</p>
                <p className="mt-1 inline-flex items-center text-xs font-medium text-blue-600">
                  {post.source} <ExternalLink className="h-3 w-3 ml-1" />
                </p>
              </a>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
