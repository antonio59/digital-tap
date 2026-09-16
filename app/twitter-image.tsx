import { ImageResponse } from "next/og"
import { OgCard, OG_ALT, OG_SIZE } from "./og-card"

export const dynamic = "force-static"
export const alt = OG_ALT
export const size = OG_SIZE
export const contentType = "image/png"

export default function TwitterImage() {
  return new ImageResponse(<OgCard />, { ...size })
}
