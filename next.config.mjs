import { readFileSync } from "node:fs"

const { version } = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8"),
)

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
  turbopack: {
    root: process.cwd(),
  },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
