import { test, expect } from '@playwright/test'
import { contrastForeground, relativeLuminance } from '../../src/lib/branding'
import { appManifest } from '../../src/lib/app-manifest'

test('brand foreground chooses the stronger contrast, including medium brightness colours', () => {
  for (const colour of ['#FFFFFF', '#000000', '#777777', '#FF0000', '#DD00CC', '#00AABB', '#E5B45C']) {
    const chosen = contrastForeground(colour)
    const ratio = (a: string, b: string) => (Math.max(relativeLuminance(a), relativeLuminance(b)) + .05) / (Math.min(relativeLuminance(a), relativeLuminance(b)) + .05)
    expect(ratio(colour, chosen)).toBeGreaterThanOrEqual(Math.min(ratio(colour, '#FFFFFF'), ratio(colour, '#0A0A0A')))
    expect(ratio(colour, chosen)).toBeGreaterThan(4.4)
  }
})

test('each firm app has its own identity and its start URL lies inside its scope', () => {
  const manifest = appManifest('Morgan Financial', '/f/home/morgan', '#6D28D9')
  expect(manifest.name).toBe('Morgan Financial')
  expect(manifest.theme_color).toBe('#6D28D9')
  expect(manifest.start_url?.startsWith(manifest.scope!)).toBe(true)
  expect(manifest.icons).toHaveLength(2)
  expect(manifest.icons?.every((icon) => icon.src.startsWith('/f/home/morgan/'))).toBe(true)
})
