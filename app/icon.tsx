import { ImageResponse } from "next/og"

export const dynamic = "force-static"

export const size = {
  width: 32,
  height: 32,
}

export const contentType = "image/png"

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        background: "#2563eb",
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "7px",
      }}
    >
      <svg width="24" height="24" viewBox="0 0 32 32">
        <g stroke="white" strokeWidth="2.6" fill="none" strokeLinecap="round">
          <path d="M14.6 12.9 A4 4 0 0 1 14.6 19.1" />
          <path d="M16.8 10.3 A7.5 7.5 0 0 1 16.8 21.7" />
          <path d="M19.1 7.6 A11 11 0 0 1 19.1 24.4" />
        </g>
        <circle cx="10.5" cy="16" r="2.2" fill="white" />
      </svg>
    </div>,
    {
      ...size,
    },
  )
}
