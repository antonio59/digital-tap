import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { COMPLAINT_POSTS } from "@/lib/complaints"
import { ExternalLink, MessageSquare } from "lucide-react"

// Real complaints about tap-in/tap-out ticketing, surfaced from public forums
// and press coverage. Replaces the old Twitter timeline: the point of this
// block is showing that the problem is real, in passengers' own words.
export default function SocialFeed() {
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
          href="https://untap.money/journal/the-forgotten-tap"
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-lg bg-blue-50 p-4 mb-5 hover:bg-blue-100 transition-colors"
        >
          <p className="text-2xl font-extrabold text-blue-700">£164.7 million</p>
          <p className="text-sm text-blue-900 mt-1">
            charged by TfL in maximum fares for missed tap-outs in 2023 alone — 22.2 million
            journeys, most refundable only if you claim within 8 weeks.
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
