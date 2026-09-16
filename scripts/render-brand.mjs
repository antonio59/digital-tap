#!/usr/bin/env node
// Renders brand assets for social profiles into clips/.
//   node scripts/render-brand.mjs
// Output: clips/avatar-1080.png (profile), clips/banner-1500x500.png (header)

import { chromium } from "playwright"
import { mkdirSync, readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"

const OUT = join(process.cwd(), "clips")
mkdirSync(OUT, { recursive: true })

// Embed the latin Inter woff2 produced by `pnpm build` so headless Chromium
// renders the same font as the site (system fonts don't resolve reliably).
const mediaDir = "out/_next/static/media"
const woff2s = readdirSync(mediaDir).filter((f) => f.endsWith(".woff2"))
// next/font names the basic-latin subset with a `.p.` marker
const latinFile =
  woff2s.find((f) => f.includes("-s.p.")) ??
  woff2s.sort(
    (a, b) =>
      readFileSync(join(mediaDir, b)).length - readFileSync(join(mediaDir, a)).length,
  )[0]
const INTER_B64 = readFileSync(join(mediaDir, latinFile)).toString("base64")

// Same contactless-waves paths as components/logo.tsx / app/icon.tsx
const glyph = (size, color = "white") => `
  <svg width="${size}" height="${size}" viewBox="0 0 32 32" fill="none">
    <g transform="translate(-3,0)" stroke="${color}" stroke-width="2.6" stroke-linecap="round">
      <path d="M14.6 12.9 A4 4 0 0 1 14.6 19.1" />
      <path d="M16.8 10.3 A7.5 7.5 0 0 1 16.8 21.7" />
      <path d="M19.1 7.6 A11 11 0 0 1 19.1 24.4" />
      <circle cx="10.5" cy="16" r="2.2" fill="${color}" stroke="none" />
    </g>
  </svg>`

const FONT = `'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif`
const HEAD = `<style>@font-face{font-family:'Inter';src:url(data:font/woff2;base64,${INTER_B64}) format('woff2');font-weight:100 900}</style>`
const GRADIENT = "linear-gradient(135deg, #1e3a8a 0%, #2563eb 55%, #3b82f6 100%)"

const avatarHtml = `<!doctype html><head>${HEAD}</head><body style="margin:0">
  <div style="width:1080px;height:1080px;background:${GRADIENT};display:flex;align-items:center;justify-content:center;font-family:${FONT}">
    ${glyph(560)}
  </div></body>`

const bannerHtml = `<!doctype html><head>${HEAD}</head><body style="margin:0">
  <div style="width:1500px;height:500px;background:${GRADIENT};display:flex;flex-direction:column;justify-content:center;padding:0 90px;font-family:${FONT};color:white;position:relative;overflow:hidden">
    <div style="position:absolute;right:-140px;top:50%;transform:translateY(-50%);opacity:0.14">${glyph(720)}</div>
    <div style="display:flex;align-items:center;gap:34px">
      <div style="width:120px;height:120px;border-radius:28px;background:rgba(255,255,255,0.14);border:2px solid rgba(255,255,255,0.35);display:flex;align-items:center;justify-content:center">${glyph(72)}</div>
      <div>
        <div style="font-size:82px;font-weight:800;letter-spacing:-2px;line-height:1">Digital Tap</div>
        <div style="font-size:34px;font-weight:500;opacity:0.92;margin-top:14px">A citizen proposal for touchless tap-in and tap-out on the DLR</div>
      </div>
    </div>
    <div style="display:flex;align-items:center;gap:22px;margin-top:44px">
      <span style="font-size:24px;padding:8px 22px;border-radius:999px;border:1.5px solid rgba(255,255,255,0.5);opacity:0.85">Concept prototype · not a TfL service</span>
      <span style="font-size:24px;opacity:0.7">digitaltap.antoniosmith.xyz</span>
    </div>
  </div></body>`

const browser = await chromium.launch()
const page = await browser.newPage()

await page.setViewportSize({ width: 1080, height: 1080 })
await page.setContent(avatarHtml, { waitUntil: "networkidle" })
await page.screenshot({ path: join(OUT, "avatar-1080.png") })

await page.setViewportSize({ width: 1500, height: 500 })
await page.setContent(bannerHtml, { waitUntil: "networkidle" })
await page.screenshot({ path: join(OUT, "banner-1500x500.png") })

await browser.close()
console.log("wrote clips/avatar-1080.png and clips/banner-1500x500.png")
