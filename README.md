# Digital Tap

Citizen campaign site and click-through prototype for a **touchless DLR tap-in / tap-out** concept. Built for TfL and the public to understand the idea. It is **not** an official TfL product and does not process real journeys or payments.

Stack: **Next.js** (static export), **Convex**, **Tailwind**, **Resend** (REST API). Hosted on **Cloudflare Pages**, with Pages Functions in `functions/` for the admin login, stats API, contact form and the Umami analytics proxy.

## Features

- Campaign landing page, vote, and comments
- DLR journey and pink-reader interchange demo
- Live TfL FOI statistics on the landing page — a weekly Convex cron (`convex/foi.ts`) re-parses the incomplete-journey FOI disclosures (FOI-4311-2324 annual + FOI-4349-2324 contactless device split) with hardcoded fallbacks
- Evidence data pack for the TfL submission: `docs/data-pack.md`
- Contact form (Resend)
- Admin stats (password-protected, server-side)

## Getting started

Prerequisites: Node.js 22+, pnpm 11+.

```bash
pnpm install
cp .env.example .env.local
```

Fill in Convex, Resend, and admin values. Then:

```bash
pnpm dev
```

## Cloudflare Pages

Local Next.js stays `pnpm dev`. Preview the exported site plus Pages Functions locally:

```bash
pnpm preview
```

Deploy:

```bash
pnpm deploy
```

`wrangler.jsonc` points Pages at the `out/` export. Set the secrets and env vars on the Pages project (not committed):

```bash
npx wrangler pages secret put RESEND_API_KEY
npx wrangler pages secret put CONTACT_TO_EMAIL
npx wrangler pages secret put ADMIN_PASSWORD
npx wrangler pages secret put SESSION_SECRET        # recommended: random, unrelated to ADMIN_PASSWORD
npx wrangler pages secret put TOKEN_ISSUER_SECRET   # required for voting/comments
```

`NEXT_PUBLIC_CONVEX_URL` is needed both at build time (client bundle) and as a Pages env var for the stats Function — set it under **Pages → Settings → Environment variables**. For `wrangler pages dev`, copy values into `.dev.vars` (gitignored).

Two env vars also live on the **Convex deployment** (set via `npx convex env set NAME=value` or the dashboard → Settings → Environment Variables):

- `TOKEN_ISSUER_SECRET` — must match the Pages secret; gates token issuance
- `ADMIN_PASSWORD` — enables admin-gated Convex mutations (comment deletion, GDPR erasure via `lifecycle:eraseUser`)

## Agent tooling

Agent skills live in `.agents/skills/` and are symlinked into `.devin/skills/` and `.claude/skills/` (`security-audit`, `typesafe-ai`). Managed via `npx skills`; see `skills-lock.json`.

## Versioning and releases

The app version lives solely in `package.json` (`"version"`). `next.config.mjs` exposes it to the client as `NEXT_PUBLIC_APP_VERSION`, and the site footer links it to `CHANGELOG.md`.

To cut a release:

1. Bump `"version"` in `package.json` (minor for new features, patch for fixes).
2. Add a plain-English `## [x.y.z] - YYYY-MM-DD` entry under `## Release notes` in the `header` of `cliff.toml` (newest first). Do **not** hand-edit `CHANGELOG.md` — the changelog workflow regenerates it from `cliff.toml` on every push to `main`.
3. Merge to `main`. No manual git tags are needed.

## License

MIT © Antonio Smith
