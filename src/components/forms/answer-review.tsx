'use client'

import { useState } from 'react'
import { CheckCheck, ChevronDown, Pencil, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { displayValue, isFieldVisible } from '@/lib/forms/engine'
import { isPresentational, type FormField, type FormStep, type FormValues } from '@/lib/forms/types'

function ReviewAnswers({ fields, values }: { fields: FormField[]; values: FormValues }) {
  return (
    <dl className="divide-y px-5">
      {fields.map((field) => {
        const answer = displayValue(field, values[field.id])
        return (
          <div key={field.id} className="grid gap-1.5 py-4 text-sm sm:grid-cols-2 sm:gap-6">
            <dt className="break-words leading-relaxed text-muted-foreground">{field.label}</dt>
            <dd className="whitespace-pre-wrap break-words font-medium leading-relaxed">
              {answer === '—' ? <span className="font-normal text-muted-foreground">Not provided</span> : answer}
            </dd>
          </div>
        )
      })}
    </dl>
  )
}

export function AnswerReview({
  steps,
  values,
  onEdit,
  disabled,
}: {
  steps: FormStep[]
  values: FormValues
  onEdit: (index: number) => void
  disabled: boolean
}) {
  const [query, setQuery] = useState('')
  const [answeredOnly, setAnsweredOnly] = useState(false)
  const [expandedUnanswered, setExpandedUnanswered] = useState<Record<string, boolean>>({})
  const search = query.trim().toLocaleLowerCase('en-GB')
  const sections = steps.map((step, index) => ({
    step, index,
    fields: step.fields.filter((field) => !isPresentational(field) && isFieldVisible(field, values)),
  }))
  const answered = sections.reduce((count, section) => count + section.fields.filter((field) => displayValue(field, values[field.id]) !== '—').length, 0)
  const total = sections.reduce((count, section) => count + section.fields.length, 0)
  const shown = sections.map((section) => ({
    ...section,
    fields: section.fields.filter((field) => {
      const answer = displayValue(field, values[field.id])
      return (!answeredOnly || answer !== '—') && (!search || `${section.step.title} ${field.label} ${answer}`.toLocaleLowerCase('en-GB').includes(search))
    }),
  })).filter((section) => section.fields.length > 0)
  const shownCount = shown.reduce((count, section) => count + section.fields.length, 0)

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span className="rounded-lg bg-accent/15 p-2 text-accent-strong dark:text-accent"><CheckCheck aria-hidden="true" className="h-5 w-5" /></span>
          <div>
            <p className="text-sm font-semibold">Your FactFind, at a glance</p>
            <p className="mt-1 text-sm text-muted-foreground">{answered} answers across {steps.length} sections. Check anything you’d like to change before sending.</p>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">Questions you left blank are grouped below each section. Not provided does not mean No.</p>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input type="search" aria-label="Search your answers" placeholder="Find a question or answer…" value={query} onChange={(event) => setQuery(event.target.value)} disabled={disabled} className="pl-9" onKeyDown={(event) => { if (event.key === 'Enter') event.preventDefault() }} />
          </div>
          <Button type="button" variant={answeredOnly ? 'secondary' : 'outline'} aria-pressed={answeredOnly} disabled={disabled} onClick={() => setAnsweredOnly((value) => !value)}>Answered only</Button>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
          <p role="status">{search || answeredOnly ? `Showing ${shownCount} ${shownCount === 1 ? 'question' : 'questions'}` : `${answered} answered · ${total - answered} not provided`}</p>
          {(query || answeredOnly) && <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => { setQuery(''); setAnsweredOnly(false) }}>Clear filters</Button>}
        </div>
        {(query || answeredOnly) && <p className="mt-1 text-xs text-muted-foreground">Your full FactFind is included when you send. These filters only change the view.</p>}
      </div>
      {shown.length === 0 && <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">No answers match this search. Clear the filters to see your full FactFind.</p>}
      {shown.map(({ step, index, fields }) => {
        const provided = fields.filter((field) => displayValue(field, values[field.id]) !== '—')
        const unanswered = fields.filter((field) => displayValue(field, values[field.id]) === '—')
        const showUnanswered = Boolean(search) || Boolean(expandedUnanswered[step.id])
        return (
        <section
          key={step.id}
          aria-labelledby={`review-${step.id}`}
          className="overflow-hidden rounded-xl border"
        >
          <div className="flex items-center justify-between gap-3 bg-muted/50 px-5 py-3">
            <div className="min-w-0">
              <h3 id={`review-${step.id}`} className="text-sm font-semibold">{step.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{provided.length} answered{unanswered.length > 0 ? ` · ${unanswered.length} not provided` : ''}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onEdit(index)}
              disabled={disabled}
              aria-label={`Edit ${step.title}`}
            >
              <Pencil aria-hidden="true" /> Edit
            </Button>
          </div>
          <ReviewAnswers fields={search ? fields : provided} values={values} />
          {!search && unanswered.length > 0 && (
            <button
              type="button"
              aria-expanded={showUnanswered}
              aria-controls={`review-${step.id}-unanswered`}
              aria-label={`${showUnanswered ? 'Hide' : 'Show'} unanswered questions in ${step.title}`}
              disabled={disabled}
              onClick={() => setExpandedUnanswered((previous) => ({ ...previous, [step.id]: !showUnanswered }))}
              className="flex min-h-12 w-full items-center justify-between gap-3 border-t px-5 py-3 text-left text-xs text-muted-foreground transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:cursor-default"
            >
              <span>{showUnanswered ? 'Hide unanswered questions' : `${unanswered.length} ${unanswered.length === 1 ? 'question' : 'questions'} not provided · Show`}</span>
              <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${showUnanswered ? 'rotate-180' : ''}`} aria-hidden="true" />
            </button>
          )}
          {!search && (
            <div id={`review-${step.id}-unanswered`} hidden={!showUnanswered}>
              {showUnanswered && <ReviewAnswers fields={unanswered} values={values} />}
            </div>
          )}
        </section>
        )
      })}
    </div>
  )
}
