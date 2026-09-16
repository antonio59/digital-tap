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
// FOI disclosure page; the constants below are the fallback until the first
// successful refresh lands.
const FALLBACK = {
  totalRevenue: "£164.7 million",
  chargedMaxFare: "22.2 million",
  claimWindowWeeks: 8,
  year: 2023,
}

export default function SocialFeed() {
  const foi = useQuery(api.foi.latest)
  const stats = foi ?? FALLBACK

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
