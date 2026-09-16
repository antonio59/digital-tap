#!/usr/bin/env node
// Weekly research pass for the Digital Tap campaign. Pulls recent public
// complaints about tap-in/tap-out fare friction, ranks them, and writes a
// markdown brief the campaign owner can paste to a drafting agent (Grok)
// before posting. Sources: Hacker News + Google News RSS (unauthenticated)
// and Reddit via OAuth when REDDIT_CLIENT_ID/REDDIT_CLIENT_SECRET are set
// (free script app at https://www.reddit.com/prefs/apps).

import { mkdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const SITE_URL = "https://digitaltap.antoniosmith.xyz"
const OUT_DIR = join(process.cwd(), "docs", "tweet-briefs")
const USER_AGENT = "digital-tap-research/1.0"

const REDDIT_QUERIES = [
  '"tap out" tfl',
  '"incomplete journey" oyster',
  '"maximum fare" contactless london',
  '"forgot to tap"',
  'DLR "penalty fare"',
]
const NEWS_QUERIES = [
  '"tap out" OR "tapped out" tfl fare',
  '"incomplete journey" tfl OR oyster',
  '"maximum fare" contactless london',
]
const HN_QUERIES = ['"tap out" tfl', "oyster maximum fare", "contactless london fare"]

const PREFERRED_SUBS = new Set([
  "london",
  "LondonUnderground",
  "AskUK",
  "CasualUK",
  "UKPersonalFinance",
  "britishproblems",
])

const SIGNAL = /tap|fare|fine|penalty|charged|refund|oyster|contactless|tfl|dlr|journey/i

async function fetchJson(url, headers = {}) {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT, ...headers } })
  if (!res.ok) throw new Error(`${res.status} ${url}`)
  return res.json()
}

async function fetchReddit() {
  const { REDDIT_CLIENT_ID: id, REDDIT_CLIENT_SECRET: secret } = process.env
  if (!id || !secret) {
    console.warn("reddit skipped: REDDIT_CLIENT_ID/SECRET not set")
    return []
  }
  const auth = Buffer.from(`${id}:${secret}`).toString("base64")
  const tokenRes = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": USER_AGENT,
    },
    body: "grant_type=client_credentials",
  })
  if (!tokenRes.ok) {
    console.warn(`reddit token request failed: ${tokenRes.status}`)
    return []
  }
  const token = await tokenRes.json()

  const posts = []
  for (const q of REDDIT_QUERIES) {
    const url =
      `https://oauth.reddit.com/search.json?q=${encodeURIComponent(q)}` +
      `&sort=top&t=month&limit=25`
    try {
      const data = await fetchJson(url, {
        Authorization: `Bearer ${token.access_token}`,
      })
      for (const child of data?.data?.children ?? []) {
        const p = child.data
        if (!SIGNAL.test(`${p.title} ${p.selftext ?? ""}`)) continue
        posts.push({
          source: `r/${p.subreddit}`,
          title: p.title,
          excerpt: (p.selftext ?? "").replace(/\s+/g, " ").slice(0, 280),
          url: `https://www.reddit.com${p.permalink}`,
          score:
            (p.ups ?? 0) + 2 * (p.num_comments ?? 0) +
            (PREFERRED_SUBS.has(p.subreddit) ? 25 : 0),
          comments: p.num_comments ?? 0,
        })
      }
    } catch (err) {
      console.warn(`reddit query failed (${q}): ${err.message}`)
    }
  }
  return posts
}

function decodeXml(s) {
  return s
    .replace(/<!\[CDATA\[|\]\]>/g, "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    // &amp; must be unescaped last, or input like "&amp;lt;" would
    // double-unescape to "<" (CodeQL: double unescaping)
    .replace(/&amp;/g, "&")
}

async function fetchNews() {
  const posts = []
  for (const q of NEWS_QUERIES) {
    const url =
      `https://news.google.com/rss/search?q=${encodeURIComponent(q)}` +
      `&hl=en-GB&gl=GB&ceid=GB:en`
    try {
      const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } })
      if (!res.ok) throw new Error(`${res.status}`)
      const xml = await res.text()
      for (const item of xml.match(/<item>[\s\S]*?<\/item>/g) ?? []) {
        const title = decodeXml(item.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "")
        const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() ?? ""
        const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] ?? ""
        const source = decodeXml(item.match(/<source[^>]*>([\s\S]*?)<\/source>/)?.[1] ?? "")
        if (!title || !link || !SIGNAL.test(title)) continue
        // Only keep items from roughly the last month
        const ageDays = (Date.now() - Date.parse(pubDate)) / 86400000
        if (Number.isFinite(ageDays) && ageDays > 40) continue
        posts.push({
          source: source || "Google News",
          title,
          excerpt: "",
          url: link,
          score: 10,
          comments: 0,
        })
      }
    } catch (err) {
      console.warn(`news query failed (${q}): ${err.message}`)
    }
  }
  return posts
}

async function fetchHn() {
  const posts = []
  for (const q of HN_QUERIES) {
    try {
      const data = await fetchJson(
        `https://hn.algolia.com/api/v1/search_by_date?query=${encodeURIComponent(q)}&tags=story&hitsPerPage=15`,
      )
      for (const h of data?.hits ?? []) {
        if (!SIGNAL.test(h.title ?? "")) continue
        posts.push({
          source: "Hacker News",
          title: h.title,
          excerpt: "",
          url: h.url ?? `https://news.ycombinator.com/item?id=${h.objectID}`,
          score: (h.points ?? 0) + 2 * (h.num_comments ?? 0),
          comments: h.num_comments ?? 0,
        })
      }
    } catch (err) {
      console.warn(`hn query failed (${q}): ${err.message}`)
    }
  }
  return posts
}

function dedupe(posts) {
  const seen = new Set()
  return posts.filter((p) => {
    const key = p.url.replace(/\/$/, "").toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function buildBrief(posts, date) {
  const top = posts.slice(0, 8)
  const lines = [
    `# Tweet brief — week of ${date}`,
    "",
    "Fresh public complaints about tap-in/tap-out fare friction, ranked by engagement.",
    "Use these to draft this week's engagement post. The aim: show the problem is",
    "real, in passengers' own words, then point people at the proposal.",
    "",
    "## Evidence (top posts this period)",
    "",
  ]
  if (top.length === 0) {
    lines.push("_No qualifying posts found this week — reuse the FOI stats below._", "")
  }
  for (const [i, p] of top.entries()) {
    lines.push(
      `${i + 1}. **${p.title}** — ${p.source}${p.comments ? ` (${p.comments} comments)` : ""}`,
      `   ${p.excerpt ? `> ${p.excerpt}${p.excerpt.length >= 280 ? "…" : ""}` : ""}`,
      `   ${p.url}`,
      "",
    )
  }
  lines.push(
    "## Standing stats (TfL FOI-4311-2324, 2023)",
    "",
    "- £164.7m collected in maximum fares for missed tap-outs",
    "- 22.2m journeys charged the maximum fare; 30.9m incomplete journeys total",
    "- Refunds must be claimed within 8 weeks",
    "",
    "## Prompt for the drafting agent",
    "",
    "```",
    "You are drafting a tweet for @digitaltap, a citizen campaign proposing",
    "touchless tap-in/tap-out on the DLR. Tone: factual, on the passenger's side,",
    "never corporate. Rules:",
    "- Open with a question hook grounded in one of the evidence posts above",
    "- Cite at most one statistic (the £164.7m or 22.2m figure) — no stat dumps",
    "- Never claim affiliation with or endorsement by TfL",
    "- End with the call to action: vote on the proposal at",
    `  ${SITE_URL}/vote`,
    "- Max 280 characters. No hashtags beyond #DLR.",
    "```",
    "",
    `Site: ${SITE_URL}`,
  )
  return lines.join("\n")
}

const date = new Date().toISOString().slice(0, 10)
const posts = dedupe([
  ...(await fetchReddit()),
  ...(await fetchNews()),
  ...(await fetchHn()),
]).sort((a, b) => b.score - a.score)

mkdirSync(OUT_DIR, { recursive: true })
const outFile = join(OUT_DIR, `${date}.md`)
writeFileSync(outFile, buildBrief(posts, date))
console.log(`wrote ${outFile} (${posts.length} candidates, top 8 kept)`)
