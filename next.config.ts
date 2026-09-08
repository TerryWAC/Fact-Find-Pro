import fs from 'node:fs'
import path from 'node:path'
import type { NextConfig } from 'next'

/**
 * Brand banner (lion + wordmark). Any file in public/brand named
 * wealthy-advisers-club.{png,jpg,jpeg,webp} — in any letter case — is picked up
 * on the next build. Checked here, at build time, because public/ is served by
 * the CDN and is not on the server's filesystem at runtime on Vercel.
 */
function findBrandBanner(): string | undefined {
  const dir = path.join(process.cwd(), 'public', 'brand')
  if (!fs.existsSync(dir)) return undefined
  const match = fs
    .readdirSync(dir)
    .find((name) => /^(wealthy-advisers-club|onboarding-banner)\.(png|jpe?g|webp)$/i.test(name))
  return match ? `/brand/${match}` : undefined
}
const brandBanner = findBrandBanner()

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_BRAND_BANNER: brandBanner ?? '',
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
