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
const localPreview = process.env.FACTFIND_PREVIEW === '1'
const pdfAssets = [
  './src/lib/pdf/fonts/*.ttf',
  './public/brand/*',
  // PDFKit resolves these dynamically, including Helvetica during startup.
  './node_modules/pdfkit/js/standard-fonts/**/*',
]

const nextConfig: NextConfig = {
  reactStrictMode: true,
  distDir: localPreview ? '.next-preview' : '.next',
  env: {
    NEXT_PUBLIC_BRAND_BANNER: brandBanner ?? '',
    // Test builds must never inherit a real project's browser credentials.
    ...(localPreview
      ? {
          NEXT_PUBLIC_SUPABASE_URL: 'http://127.0.0.1:45439',
          NEXT_PUBLIC_SUPABASE_ANON_KEY: 'local-preview-only',
          NEXT_PUBLIC_APP_URL: 'http://localhost:3008',
        }
      : {}),
  },
  // Native / filesystem-heavy packages used by the PDF renderer stay outside the bundle.
  serverExternalPackages: ['@react-pdf/renderer', 'sharp'],
  // Every route that renders a PDF needs both our typefaces and PDFKit's
  // dynamically loaded standard fonts in its serverless bundle.
  outputFileTracingIncludes: {
    '/submissions/\\[id\\]/pdf': pdfAssets,
    '/admin/submissions/\\[id\\]/pdf': pdfAssets,
    '/submissions/\\[id\\]': pdfAssets,
    '/admin/submissions/\\[id\\]': pdfAssets,
    '/f/\\[type\\]/\\[slug\\]': pdfAssets,
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
