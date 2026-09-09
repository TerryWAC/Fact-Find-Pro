'use client'

import { useState } from 'react'
import { CheckCircle2, Clock, Lock } from 'lucide-react'
import { FactFindForm } from '@/components/forms/factfind-form'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { submitFactFind } from '@/app/f/actions'
import { BRAND } from '@/lib/constants'
import type { FormSchema } from '@/lib/forms/types'
import type { FactFindType } from '@/lib/supabase/database.types'

interface FactFindClientProps {
  schema: FormSchema
  formType: FactFindType
  slug: string
  adviserName: string
  companyName: string | null
  adviserPhotoUrl?: string | null
}

export function FactFindClient({
  schema,
  formType,
  slug,
  adviserName,
  companyName,
  adviserPhotoUrl,
}: FactFindClientProps) {
  const [reference, setReference] = useState<string | null>(null)

  if (reference) {
    return (
      <div className="mx-auto w-full max-w-2xl animate-fade-in">
        <Card className="p-8 text-center sm:p-12">
          <span className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-accent/20 text-accent-strong dark:text-accent">
            <CheckCircle2 className="h-7 w-7" />
          </span>
          <h1 className="text-2xl font-semibold tracking-tight">
            {schema.successTitle ?? 'Thank you — your FactFind has been submitted'}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            {schema.successMessage ??
              'Your adviser has received your details and will be in touch shortly.'}
          </p>

          <div className="mt-8 inline-flex flex-col items-center gap-1 rounded-lg border bg-muted/40 px-6 py-4">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Your reference
            </span>
            <span className="font-mono text-lg font-semibold">{reference}</span>
          </div>

          <p className="mt-8 text-sm text-muted-foreground">
            Submitted to <span className="font-medium text-foreground">{adviserName}</span>
            {companyName ? ` at ${companyName}` : ''}.
          </p>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8">
      {/* Form header + branding area */}
      <header className="space-y-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="default">{schema.title}</Badge>
          {schema.placeholder && <Badge variant="secondary">Preview</Badge>}
          {schema.estimatedMinutes && (
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              About {schema.estimatedMinutes} minutes
            </Badge>
          )}
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">{schema.title}</h1>
          {schema.subtitle && (
            <p className="text-sm leading-relaxed text-muted-foreground">{schema.subtitle}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-xl border bg-card p-4 text-sm">
          {adviserPhotoUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- adviser-supplied image
            <img src={adviserPhotoUrl} alt="" className="h-12 w-12 shrink-0 rounded-full border object-cover" data-testid="adviser-photo" />
          )}
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Your adviser</p>
            <p className="mt-0.5 font-medium">{adviserName}</p>
          </div>
          {companyName && (
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Practice</p>
              <p className="mt-0.5 font-medium">{companyName}</p>
            </div>
          )}
          <div className="ml-auto flex items-center gap-1.5 text-xs text-muted-foreground">
            <Lock className="h-3.5 w-3.5" />
            Powered by {BRAND.product}
          </div>
        </div>

        {schema.intro && <p className="text-sm leading-relaxed text-muted-foreground">{schema.intro}</p>}
      </header>

      <FactFindForm
        schema={schema}
        slug={slug}
        formType={formType}
        onSubmitAction={submitFactFind}
        onComplete={setReference}
      />
    </div>
  )
}
