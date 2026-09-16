'use client'

import { useState } from 'react'

/** Keep the firm's identity visible even when an uploaded logo cannot load. */
export function AdviserLogo({ logoUrl, companyName }: { logoUrl?: string | null; companyName: string }) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  return (
    <div className="flex min-w-0 max-w-[80%] items-center gap-3 text-white" style={{ color: 'inherit' }}>
      {logoUrl && failedUrl !== logoUrl && (
        // eslint-disable-next-line @next/next/no-img-element -- adviser-supplied dimensions
        <img src={logoUrl} alt="" onError={() => setFailedUrl(logoUrl)} className="max-h-14 w-auto max-w-[45%] object-contain" data-testid="adviser-logo" />
      )}
      <span className="min-w-0 break-words text-sm font-semibold leading-snug sm:text-base" data-testid="firm-name">{companyName}</span>
    </div>
  )
}
