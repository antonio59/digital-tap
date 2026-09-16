#!/usr/bin/env node
// Renders the hero tap simulation to video clips for social media.
// Requires `out/` from `pnpm build`. Screenshots #tap-sim at stepped
// window.__simTime values (deterministic frames), then encodes with ffmpeg.
//
//   node scripts/capture-sim.mjs            # writes clips/
//
// Output: clips/tap-sim-13s.mp4 (portrait card, 3x DPI, loops cleanly)

import { chromium } from "playwright"
import { spawn, execFileSync } from "node:child_process"
import { mkdirSync, existsSync, rmSync } from "node:fs"
import { join } from "node:path"

const PORT = 8931
const FPS = 15
const LOOP_MS = 13000
const STEP = Math.round(1000 / FPS)
const FRAMES = Math.ceil(LOOP_MS / STEP)
const OUT = join(process.cwd(), "clips")
const FRAMES_DIR = join(OUT, "frames")

if (!existsSync("out/index.html")) {
  console.error("out/ not found — run `pnpm build` first")
  process.exit(1)
}

rmSync(FRAMES_DIR, { recursive: true, force: true })
mkdirSync(FRAMES_DIR, { recursive: true })

const server = spawn("python3", ["-m", "http.server", String(PORT), "-d", "out"], {
  stdio: "ignore",
})
await new Promise((r) => setTimeout(r, 800))

try {
  const browser = await chromium.launch()
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 3,
  })
  await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: "networkidle" })
  const sim = page.locator("#tap-sim")
  await sim.waitFor({ timeout: 15000 })

  for (let i = 0; i <= FRAMES; i++) {
    const t = Math.min(i * STEP, LOOP_MS - 1)
    await page.evaluate((ms) => {
      window.__simTime = ms
    }, t)
    // let the rAF loop render the forced time
    await page.waitForTimeout(120)
    await sim.screenshot({ path: join(FRAMES_DIR, `f${String(i).padStart(4, "0")}.png`) })
  }
  await browser.close()

  const clip = join(OUT, "tap-sim-13s.mp4")
  execFileSync("ffmpeg", [
    "-y",
    "-framerate", String(FPS),
    "-i", join(FRAMES_DIR, "f%04d.png"),
    "-c:v", "libx264",
    "-pix_fmt", "yuv420p",
    "-vf", "pad=ceil(iw/2)*2:ceil(ih/2)*2",
    "-movflags", "+faststart",
    clip,
  ])
  rmSync(FRAMES_DIR, { recursive: true, force: true })
  console.log(`wrote ${clip}`)
} finally {
  server.kill()
}
