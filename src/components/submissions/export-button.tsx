'use client'

import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

/**
 * Export placeholder.
 *
 * Copies the submission JSON to the clipboard today; the PDF/CSV export
 * pipeline lands once the real question sets are in place.
 */
export function ExportButton({ payload, reference }: { payload: unknown; reference: string }) {
  async function handleExport() {
    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2))
      toast.success('Submission JSON copied', {
        description: `PDF and CSV export for ${reference} arrives with the full question sets.`,
      })
    } catch {
      toast.info('Export coming soon', {
        description: 'PDF and CSV export will be available in a future release.',
      })
    }
  }

  return (
    <Button variant="outline" onClick={handleExport}>
      <Download className="h-4 w-4" />
      Export
    </Button>
  )
}
