'use client'

import { useRef, useState, useTransition } from 'react'
import { Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { uploadBrandImageAction } from '@/app/(onboarding)/onboarding/actions'
import { cn } from '@/lib/utils'

interface ImagePickerProps {
  kind: 'logo' | 'headshot'
  label: string
  name: string
  defaultValue: string
  /** Headshots preview as a circle, logos as a rounded square. */
  shape?: 'square' | 'circle'
}

/**
 * Upload an image or paste a URL.
 *
 * Uploads go through a server action rather than a browser Supabase client, so
 * no public keys need to be inlined at build time.
 */
export function ImagePicker({ kind, label, name, defaultValue, shape = 'square' }: ImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState(defaultValue)
  const [pending, startTransition] = useTransition()

  function handleFile(file: File | undefined) {
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    startTransition(async () => {
      const result = await uploadBrandImageAction(kind, formData)
      if (!result.ok || !result.url) {
        toast.error(result.error ?? 'Could not upload that image')
        return
      }
      setValue(result.url)
      toast.success('Image uploaded')
    })
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium">{label}</p>

      <div className="flex flex-wrap items-start gap-4">
        <div
          className={cn(
            'flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden border bg-muted/40 text-[11px] text-muted-foreground',
            shape === 'circle' ? 'rounded-full' : 'rounded-lg',
          )}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element -- user-supplied URL of unknown origin and size
            <img src={value} alt="" className="h-full w-full object-cover" />
          ) : (
            'None yet'
          )}
        </div>

        <div className="min-w-[16rem] flex-1 space-y-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="sr-only"
            onChange={(event) => handleFile(event.target.files?.[0])}
          />

          <Button type="button" variant="secondary" onClick={() => inputRef.current?.click()} disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {pending ? 'Uploading…' : 'Upload image'}
          </Button>

          <Input
            name={name}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="or paste an image URL"
            aria-label={`${label} URL`}
          />
        </div>
      </div>
    </div>
  )
}
