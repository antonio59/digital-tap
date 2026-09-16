export const OG_ALT = "Digital Tap — a citizen proposal for touchless DLR travel"
export const OG_SIZE = { width: 1200, height: 630 }

export function OgCard() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "72px",
        background: "linear-gradient(135deg, #1e3a8a 0%, #2563eb 55%, #3b82f6 100%)",
        color: "white",
      }}
    >
      <div style={{ display: "flex", alignItems: "center" }}>
        {/* contactless-waves mark */}
        <div
          style={{
            width: 96,
            height: 96,
            borderRadius: 22,
            background: "rgba(255,255,255,0.14)",
            border: "2px solid rgba(255,255,255,0.35)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginRight: 28,
          }}
        >
          <svg width="56" height="56" viewBox="0 0 32 32">
            <g stroke="white" strokeWidth="2.4" fill="none" strokeLinecap="round">
              <path d="M14.6 12.9 A4 4 0 0 1 14.6 19.1" />
              <path d="M16.8 10.3 A7.5 7.5 0 0 1 16.8 21.7" />
              <path d="M19.1 7.6 A11 11 0 0 1 19.1 24.4" />
            </g>
            <circle cx="10.5" cy="16" r="2" fill="white" />
          </svg>
        </div>
        <div style={{ fontSize: 34, fontWeight: 600, letterSpacing: "-0.5px", opacity: 0.9 }}>
          digitaltap.antoniosmith.xyz
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ fontSize: 84, fontWeight: 800, letterSpacing: "-2px", lineHeight: 1.05 }}>
          Digital Tap
        </div>
        <div style={{ fontSize: 36, fontWeight: 500, opacity: 0.92, marginTop: 16, maxWidth: 900 }}>
          A citizen proposal for touchless tap-in and tap-out on the DLR
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", fontSize: 24, opacity: 0.75 }}>
        <div
          style={{
            padding: "8px 20px",
            borderRadius: 999,
            border: "1.5px solid rgba(255,255,255,0.5)",
          }}
        >
          Concept prototype — not a TfL service
        </div>
      </div>
    </div>
  )
}
