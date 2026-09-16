import type { MetadataRoute } from 'next'
import { brandTheme } from './branding'

export function appManifest(name: string, startUrl: string, colour?: string | null): MetadataRoute.Manifest {
  const base = startUrl.startsWith('/f/') ? startUrl : ''
  return {
    id: startUrl,
    name,
    short_name: name.slice(0, 24),
    description: 'Your secure FactFind workspace. An internet connection is required.',
    start_url: startUrl,
    scope: base || '/',
    display: 'standalone',
    background_color: '#FAFAF9',
    theme_color: brandTheme(colour).colour,
    lang: 'en-GB',
    icons: [192, 512].map((size) => ({
      src: `${base}/app-icon?size=${size}`,
      sizes: `${size}x${size}`,
      type: 'image/png',
      purpose: 'any',
    })),
  }
}
