'use client'

import { Copy, FileDown } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

/**
 * Download the branded PDF, or copy the raw submission JSON for pasting into
 * another system.
 */
export function ExportButton({ payload, reference, pdfHref }: { payload: unknown; reference: string; pdfHref: string }) {
  async function copyJson() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
      toast.success(`Submission ${reference} copied as JSON`)
    } catch {
      toast.error('Could not copy to the clipboard')
    }
  }

  return (
    <>
      <Button variant="outline" onClick={copyJson}>
        <Copy className="h-4 w-4" />
        Copy JSON
      </Button>
      <Button asChild>
        <a href={pdfHref} download>
          <FileDown className="h-4 w-4" />
          Download PDF
        </a>
      </Button>
    </>
  )
}
