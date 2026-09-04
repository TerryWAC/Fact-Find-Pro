import { LinkIcon } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { BRAND } from '@/lib/constants'

export default function FactFindNotFound() {
  return (
    <div className="mx-auto w-full max-w-xl">
      <Card className="p-8 text-center sm:p-12">
        <span className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-secondary text-muted-foreground">
          <LinkIcon className="h-7 w-7" />
        </span>
        <h1 className="text-2xl font-semibold tracking-tight">This FactFind link isn&apos;t available</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          The link may have been mistyped, or your adviser&apos;s account may no longer be active. Please
          check with your adviser for an up-to-date link.
        </p>
        <p className="mt-6 text-xs text-muted-foreground">
          {BRAND.organisation} · {BRAND.product}
        </p>
      </Card>
    </div>
  )
}
