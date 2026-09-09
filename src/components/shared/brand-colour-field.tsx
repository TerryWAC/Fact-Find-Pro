'use client'

import { useId, useState } from 'react'
import { Check, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BRAND_COLOUR_PRESETS, DEFAULT_BRAND, brandTheme, normaliseHex } from '@/lib/branding'
import { cn } from '@/lib/utils'

interface BrandColourFieldProps {
  name: string
  defaultValue: string
  /** Shown in the preview header. */
  logoUrl?: string
  companyName?: string
}

/**
 * Brand colour picker with a live preview of the client-facing header.
 *
 * The text input is the form control; the native colour input and the swatches
 * just write into it, so a plain form submission carries the value.
 */
export function BrandColourField({ name, defaultValue, logoUrl, companyName }: BrandColourFieldProps) {
  const [value, setValue] = useState(defaultValue)
  const id = useId()
  const hex = normaliseHex(value)
  const theme = brandTheme(hex)
  const invalid = value.trim() !== '' && !hex

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-2">
          <Label htmlFor={id}>Brand colour</Label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              aria-label="Pick a brand colour"
              value={hex ?? DEFAULT_BRAND.colour}
              onChange={(event) => setValue(event.target.value.toUpperCase())}
              className="h-10 w-12 cursor-pointer rounded-md border bg-background p-1"
            />
            <Input
              id={id}
              name={name}
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="#1E3A5F"
              className="w-36 font-mono uppercase"
              aria-invalid={invalid}
              spellCheck={false}
            />
            {value && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setValue('')}>
                <RotateCcw className="h-3.5 w-3.5" />
                Use default
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Suggested colours">
        {BRAND_COLOUR_PRESETS.map((preset) => {
          const selected = hex === preset.hex
          return (
            <button
              key={preset.hex}
              type="button"
              title={preset.name}
              aria-label={preset.name}
              aria-pressed={selected}
              onClick={() => setValue(preset.hex)}
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full border-2 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                selected ? 'border-foreground' : 'border-transparent',
              )}
              style={{ backgroundColor: preset.hex }}
            >
              {selected && <Check className="h-4 w-4" style={{ color: brandTheme(preset.hex).onColour }} />}
            </button>
          )
        })}
      </div>

      {/* Live preview of the client-facing header */}
      <div className="overflow-hidden rounded-lg border" data-testid="brand-preview">
        <div
          className={cn('flex items-center justify-between px-4 py-3', !theme.custom && 'brand-surface')}
          style={theme.custom ? { backgroundColor: theme.colour, color: theme.onColour } : { color: '#FFFFFF' }}
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- adviser-supplied image
            <img src={logoUrl} alt="" className="max-h-8 w-auto max-w-[50%] object-contain" />
          ) : (
            <span className="text-sm font-semibold">{companyName || 'Your firm'}</span>
          )}
          <span className="text-[10px] uppercase tracking-wider opacity-80">Client FactFind</span>
        </div>
        <div className={cn('h-1', !theme.custom && 'gold-rule')} style={theme.custom ? { backgroundColor: theme.accent } : undefined} />
        <div className="flex items-center justify-between gap-3 bg-card px-4 py-3">
          <span className="text-xs text-muted-foreground">Buttons and highlights follow the colour.</span>
          <span
            className="rounded-md px-3 py-1.5 text-xs font-medium"
            style={{ backgroundColor: theme.colour, color: theme.onColour }}
          >
            Save and continue
          </span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {theme.custom
          ? 'Text switches between black and white automatically so it stays readable on your colour.'
          : 'Leave blank to use the Wealthy Advisers Club black and gold.'}
      </p>
    </div>
  )
}
