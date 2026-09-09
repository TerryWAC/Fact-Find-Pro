/**
 * Adviser branding — colour maths shared by the client-facing pages, the
 * settings preview and the PDF renderer. No React, no server-only imports.
 */

/** Wealthy Advisers Club defaults, used when an adviser has not set a colour. */
export const DEFAULT_BRAND = {
  colour: '#0A0A0A',
  accent: '#E5B45C',
} as const

/** Suggested swatches shown in the colour picker. */
export const BRAND_COLOUR_PRESETS: { name: string; hex: string }[] = [
  { name: 'Wealthy Advisers black', hex: '#0A0A0A' },
  { name: 'Gold', hex: '#E5B45C' },
  { name: 'Navy', hex: '#1E3A5F' },
  { name: 'Royal blue', hex: '#1D4ED8' },
  { name: 'Teal', hex: '#0F766E' },
  { name: 'Forest', hex: '#166534' },
  { name: 'Burgundy', hex: '#7F1D1D' },
  { name: 'Plum', hex: '#6B21A8' },
  { name: 'Slate', hex: '#334155' },
]

export const HEX_COLOUR_RE = /^#[0-9a-f]{6}$/i

/** Normalises "abc", "#ABC", "#aabbcc" → "#AABBCC"; null when not a colour. */
export function normaliseHex(value: string | null | undefined): string | null {
  if (!value) return null
  let hex = value.trim().replace(/^#/, '')
  if (/^[0-9a-f]{3}$/i.test(hex)) hex = hex.split('').map((c) => c + c).join('')
  if (!/^[0-9a-f]{6}$/i.test(hex)) return null
  return `#${hex.toUpperCase()}`
}

export function hexToRgb(hex: string): [number, number, number] {
  const clean = normaliseHex(hex) ?? DEFAULT_BRAND.colour
  return [
    parseInt(clean.slice(1, 3), 16),
    parseInt(clean.slice(3, 5), 16),
    parseInt(clean.slice(5, 7), 16),
  ]
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('').toUpperCase()}`
}

/** WCAG relative luminance, 0 (black) … 1 (white). */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Black or white, whichever reads better on the given colour. */
export function contrastForeground(hex: string): '#0A0A0A' | '#FFFFFF' {
  return relativeLuminance(hex) > 0.35 ? '#0A0A0A' : '#FFFFFF'
}

/** Mix a colour towards black (amount < 0) or white (amount > 0), amount in -1…1. */
export function shade(hex: string, amount: number): string {
  const target = amount < 0 ? 0 : 255
  const t = Math.abs(amount)
  return rgbToHex(hexToRgb(hex).map((v) => v + (target - v) * t) as [number, number, number])
}

/** "h s% l%" triplet in the form Tailwind's CSS variables expect. */
export function hexToHslTriplet(hex: string): string {
  const [r, g, b] = hexToRgb(hex).map((v) => v / 255)
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const l = (max + min) / 2
  let h = 0, s = 0
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
}

export interface BrandTheme {
  /** The adviser's colour, or the WAC black when unset. */
  colour: string
  /** Text colour that reads on `colour`. */
  onColour: string
  /** A companion accent: WAC gold by default, otherwise a tint of the colour. */
  accent: string
  /** A version of the colour dark enough to use as text on a light ground. */
  strong: string
  /** True when the adviser has set their own colour. */
  custom: boolean
}

/** Everything a page or PDF needs to paint itself in an adviser's colours. */
export function brandTheme(colour: string | null | undefined): BrandTheme {
  const hex = normaliseHex(colour)
  if (!hex) {
    return { colour: DEFAULT_BRAND.colour, onColour: '#FFFFFF', accent: DEFAULT_BRAND.accent, strong: DEFAULT_BRAND.colour, custom: false }
  }
  const light = relativeLuminance(hex) > 0.35
  return {
    colour: hex,
    onColour: contrastForeground(hex),
    accent: light ? shade(hex, -0.35) : shade(hex, 0.45),
    strong: light ? shade(hex, -0.45) : hex,
    custom: true,
  }
}

/**
 * CSS variables that re-point the design tokens (primary buttons, accents,
 * focus rings) at the adviser's colour. Applied inline on the public page
 * wrapper so it wins in both light and dark themes.
 */
export function brandCssVars(theme: BrandTheme): Record<string, string> {
  if (!theme.custom) return {}
  const light = relativeLuminance(theme.colour) > 0.35
  return {
    '--primary': hexToHslTriplet(theme.colour),
    '--primary-foreground': hexToHslTriplet(theme.onColour),
    '--accent': hexToHslTriplet(light ? theme.colour : theme.accent),
    '--accent-foreground': hexToHslTriplet(light ? theme.onColour : '#0A0A0A'),
    '--accent-strong': hexToHslTriplet(theme.strong),
    '--ring': hexToHslTriplet(theme.colour),
  }
}
