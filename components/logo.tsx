// Brand lockup: contactless-waves glyph tile + "Digital Tap" wordmark.
// The glyph paths mirror app/icon.tsx and the OG card so the mark stays
// consistent across favicon, share images, and chrome.
export function TapGlyph({ size = 32 }: { size?: number }) {
  return (
    <span
      className="flex items-center justify-center rounded-lg bg-gradient-to-br from-blue-800 via-blue-600 to-blue-500 shadow-sm"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg width={size * 0.72} height={size * 0.72} viewBox="0 0 32 32" fill="none">
        <g stroke="white" strokeWidth="2.6" strokeLinecap="round">
          <path d="M14.6 12.9 A4 4 0 0 1 14.6 19.1" />
          <path d="M16.8 10.3 A7.5 7.5 0 0 1 16.8 21.7" />
          <path d="M19.1 7.6 A11 11 0 0 1 19.1 24.4" />
        </g>
        <circle cx="10.5" cy="16" r="2.2" fill="white" />
      </svg>
    </span>
  )
}

export default function Logo() {
  return (
    <span className="flex items-center gap-2.5">
      <TapGlyph />
      <span className="text-lg font-extrabold tracking-tight leading-none">
        <span className="text-gray-900">Digital</span>
        <span className="text-blue-600"> Tap</span>
      </span>
    </span>
  )
}
