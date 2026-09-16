import { ImageResponse } from 'next/og'
import { brandTheme } from './branding'

export function appIcon(name: string, colour: string | null, requestedSize: string | null) {
  const size = requestedSize === '512' ? 512 : requestedSize === '180' ? 180 : 192
  const theme = brandTheme(colour)
  const initials = name.trim().split(/\s+/).slice(0, 2).map((word) => word[0]).join('').toUpperCase() || 'FF'
  return new ImageResponse(
    <div style={{ display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', background: theme.colour, color: theme.onColour, fontSize: size * 0.36, fontWeight: 700 }}>
      <div style={{ display: 'flex', width: '76%', height: '76%', border: `${size * 0.01}px solid ${theme.accent}`, borderRadius: size * 0.16, alignItems: 'center', justifyContent: 'center' }}>{initials}</div>
    </div>,
    { width: size, height: size, headers: { 'Cache-Control': 'no-store' } },
  )
}
