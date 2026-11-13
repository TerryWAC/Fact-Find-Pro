'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'

export type BrandImageKind = 'logo' | 'headshot'

interface BrandImageDialogProps {
  open: boolean
  kind: BrandImageKind
  adviserName: string
  pending: boolean
  onCancel: () => void
  onConfirm: (file: File) => void
}

/** Admin upload of an adviser's logo or photo, with a preview before it is published. */
export function BrandImageDialog({ open, kind, adviserName, pending, onCancel, onConfirm }: BrandImageDialogProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const noun = kind === 'logo' ? 'logo' : 'photo'

  useEffect(() => {
    if (open) setFile(null)
  }, [open])

  useEffect(() => {
    if (!file) { setPreview(null); return }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  return (
    <Dialog open={open} onOpenChange={(next) => !next && !pending && onCancel()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Replace {adviserName}’s {noun}</DialogTitle>
          <DialogDescription>
            The new {noun} appears on their client FactFind pages, emails and PDFs as soon as it is saved. PNG, JPG, WEBP or SVG, up to 2MB.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Label htmlFor="brand-image-file">New {noun}</Label>
          <input
            ref={inputRef}
            id="brand-image-file"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="block w-full text-sm file:mr-3 file:rounded-md file:border file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            disabled={pending}
          />
          {preview && (
            <div className="flex h-32 items-center justify-center rounded-xl border bg-muted/20 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element -- local preview of the chosen file */}
              <img src={preview} alt={`Preview of the new ${noun}`} className="max-h-full max-w-full object-contain" data-testid="brand-image-preview" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={() => file && onConfirm(file)} disabled={pending || !file}>
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Save {noun}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
