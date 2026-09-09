import { FileJson } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { EmptyState } from '@/components/shared/empty-state'
import { normaliseSubmissionData } from '@/lib/submission-data'
import type { Json } from '@/lib/supabase/database.types'

export { normaliseSubmissionData }

export function SubmissionAnswers({ data }: { data: Json | null | undefined }) {
  const steps = normaliseSubmissionData(data)
  const isPlaceholder =
    !!data && typeof data === 'object' && !Array.isArray(data) && Boolean((data as Record<string, unknown>).placeholder)

  if (steps.length === 0) {
    return (
      <EmptyState
        icon={FileJson}
        title="No responses recorded"
        description="This submission did not include any answer data."
      />
    )
  }

  return (
    <div className="divide-y">
      {steps.map((step) => (
        <section key={step.id} className="px-6 py-5">
          <div className="mb-3 flex items-center gap-2">
            <h3 className="text-sm font-semibold">{step.title}</h3>
            {isPlaceholder && <Badge variant="secondary">Placeholder</Badge>}
          </div>

          {step.answers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No answers in this section.</p>
          ) : (
            <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
              {step.answers.map((answer, index) => (
                <div key={`${step.id}-${index}`} className="min-w-0">
                  <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {answer.label}
                  </dt>
                  <dd className="mt-0.5 break-words text-sm">{answer.display}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>
      ))}
    </div>
  )
}
