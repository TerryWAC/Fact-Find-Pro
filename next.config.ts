import fs from 'node:fs'
import path from 'node:path'
import type { NextConfig } from 'next'

/**
 * Brand banner (lion + wordmark). Drop the artwork at any of these paths and
 * it is picked up on the next build — checked here, at build time, because
 * public/ is served by the CDN and is not on the server's filesystem at
 * runtime on Vercel.
 */
const BANNER_CANDIDATES = [
  'brand/wealthy-advisers-club.png',
  'brand/wealthy-advisers-club.jpg',
  'brand/wealthy-advisers-club.webp',
  'brand/onboarding-banner.png',
]
const brandBanner = BANNER_CANDIDATES.find((rel) =>
  fs.existsSync(path.join(process.cwd(), 'public', rel)),
)

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_BRAND_BANNER: brandBanner ? `/${brandBanner}` : '',
  },
  eslint: {
    // Lint is run as its own CI step; don't fail production builds on lint.
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

export default nextConfig
