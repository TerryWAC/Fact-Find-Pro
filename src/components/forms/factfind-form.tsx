'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  ClipboardCheck,
  Loader2,
  LockKeyhole,
  Send,
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { FieldRenderer } from './field-renderer'
import { StepIndicator } from './step-indicator'
import { AnswerReview } from './answer-review'
import { SectionDepth } from './section-depth'
import { useSectionMotion } from './use-section-motion'
import { QuestionCard } from './question-card'
import { useQuestionMotion } from './use-question-motion'
import {
  buildSubmissionPayload,
  defaultValuesFor,
  extractClientIdentity,
  isFieldVisible,
  validateStep,
  visibleSteps,
} from '@/lib/forms/engine'
import type { FormSchema, FormValues } from '@/lib/forms/types'
import { isPresentational } from '@/lib/forms/types'
import type { FactFindType } from '@/lib/supabase/database.types'

export interface FactFindSubmitResult {
  ok: boolean
  reference?: string
  error?: string
  stepId?: string
  fieldErrors?: Record<string, string>
}

interface FactFindFormProps {
  schema: FormSchema
  slug: string
  formType: FactFindType
  adviserName: string
  onSubmitAction: (input: {
    formType: FactFindType
    slug: string
    clientName: string
    clientEmail: string
    clientPhone: string | null
    submissionData: unknown
  }) => Promise<FactFindSubmitResult>
  onComplete: (reference: string) => void
}

export function FactFindForm({
  schema,
  slug,
  formType,
  adviserName,
  onSubmitAction,
  onComplete,
}: FactFindFormProps) {
  const [activeStepId, setActiveStepId] = useState(schema.steps[0]?.id ?? '')
  const [reviewing, setReviewing] = useState(false)
  const [hasReviewed, setHasReviewed] = useState(false)
  const [completedIds, setCompletedIds] = useState<string[]>([])
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const submittingRef = useRef(false)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const pendingFocus = useRef<string | null>(null)
  const [focusRequest, setFocusRequest] = useState(0)
  const defaultValues = useMemo(() => defaultValuesFor(schema), [schema])
  const {
    control,
    register,
    watch,
    setError,
    clearErrors,
    formState: { errors, isDirty },
  // The schema engine owns validation. RHF's touched-mode validation has no
  // schema rules and would clear manual errors on blur, moving summary links
  // between pointer-down and click.
  } = useForm<FormValues>({ defaultValues, mode: 'onSubmit' })
  const values = watch()
  const steps = visibleSteps(schema, values)
  const safeIndex = Math.max(
    0,
    steps.findIndex((step) => step.id === activeStepId),
  )
  const step = steps[safeIndex]
  const visibleFields = step?.fields.filter((field) => isFieldVisible(field, values)) ?? []
  const questionNumbers = new Map(visibleFields.filter((field) => !isPresentational(field)).map((field, index) => [field.id, index + 1]))
  const fieldsRef = useQuestionMotion(reviewing ? 'review' : `${step?.id}:${visibleFields.map((field) => field.id).join('|')}`)
  const visibleErrors = step?.fields.filter((field) => isFieldVisible(field, values) && errors[field.id]) ?? []
  const currentIndex = reviewing ? steps.length : safeIndex
  const sectionRef = useSectionMotion(
    reviewing ? 'review' : step?.id ?? '',
    reviewing ? schema.steps.length : schema.steps.findIndex((entry) => entry.id === step?.id),
  )
  // Earlier answers can reveal new required fields in a visited section.
  const validCompletedIds = steps
    .filter((entry) => completedIds.includes(entry.id) && validateStep(entry, values).ok)
    .map((entry) => entry.id)
  const progress = Math.round((validCompletedIds.length / (steps.length + 1)) * 100)

  useEffect(() => {
    const fieldId = pendingFocus.current
    const container = fieldId ? document.getElementById(fieldId) : null
    const target = container?.matches('input,button,textarea,select')
      ? container
      : container?.querySelector<HTMLElement>('input,button,textarea,select')
    const element = target ?? titleRef.current
    element?.focus({ preventScroll: true })
    element?.scrollIntoView({ behavior: 'instant', block: fieldId ? 'center' : 'start' })
    pendingFocus.current = null
  }, [focusRequest])

  useEffect(() => {
    if (!isDirty) return
    const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warnBeforeLeaving)
    return () => window.removeEventListener('beforeunload', warnBeforeLeaving)
  }, [isDirty])

  function requestFocus(fieldId?: string) {
    pendingFocus.current = fieldId ?? null
    setFocusRequest((count) => count + 1)
  }

  function applyErrors(stepErrors: Record<string, string>) {
    clearErrors()
    for (const [fieldId, message] of Object.entries(stepErrors))
      setError(fieldId, { type: 'manual', message })
    requestFocus(Object.keys(stepErrors)[0])
  }

  function navigate(index: number) {
    if (submittingRef.current) return
    clearErrors()
    setSubmitError(null)
    setReviewing(index === steps.length)
    if (index < steps.length) setActiveStepId(steps[index].id)
    requestFocus()
  }

  function validateAll() {
    for (let index = 0; index < steps.length; index += 1) {
      const result = validateStep(steps[index], values)
      if (!result.ok) {
        setReviewing(false)
        setActiveStepId(steps[index].id)
        applyErrors(result.errors)
        return false
      }
    }
    return true
  }

  function openReview() {
    if (!validateAll()) return
    setCompletedIds(steps.map((entry) => entry.id))
    setHasReviewed(true)
    navigate(steps.length)
  }

  function goToNext() {
    const result = validateStep(step, values)
    if (!result.ok) {
      applyErrors(result.errors)
      return
    }
    setCompletedIds((ids) => (ids.includes(step.id) ? ids : [...ids, step.id]))
    if (safeIndex === steps.length - 1) openReview()
    else navigate(safeIndex + 1)
  }

  async function handleSubmit() {
    if (submittingRef.current || !reviewing) return
    setSubmitError(null)
    if (!validateAll()) return
    const identity = extractClientIdentity(schema, values)
    if (!identity.client_name || !identity.client_email) {
      navigate(0)
      setSubmitError('Please provide your name and email address so your adviser can reach you.')
      return
    }
    submittingRef.current = true
    setIsSubmitting(true)
    try {
      const result = await onSubmitAction({
        formType,
        slug,
        clientName: identity.client_name,
        clientEmail: identity.client_email,
        clientPhone: identity.client_phone,
        submissionData: buildSubmissionPayload(schema, values),
      })
      if (!result.ok || !result.reference) {
        setSubmitError(result.error ?? 'We could not submit your FactFind. Please try again.')
        if (result.stepId && result.fieldErrors && steps.some((entry) => entry.id === result.stepId)) {
          setReviewing(false)
          setActiveStepId(result.stepId)
          applyErrors(result.fieldErrors)
        } else requestFocus()
        return
      }
      onComplete(result.reference)
    } catch {
      setSubmitError(
        'Your answers are still here. Please check your connection and try sending again.',
      )
      requestFocus()
    } finally {
      submittingRef.current = false
      setIsSubmitting(false)
    }
  }

  if (!step)
    return (
      <Alert>
        <AlertDescription>
          This form has no available sections. Please contact your adviser.
        </AlertDescription>
      </Alert>
    )

  return (
    <div className="factfind-experience grid items-start gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
      <aside className="space-y-5 lg:sticky lg:top-6">
        <div className="factfind-progress-panel rounded-xl border bg-card px-4 py-4">
          <div className="mb-3 flex justify-between text-xs">
            <span className="font-medium">Your progress</span>
            <span key={progress} className="factfind-progress-value tabular-nums text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="factfind-progress h-2" aria-label="FactFind progress" />
          <p className="mt-2 text-xs text-muted-foreground">
            {validCompletedIds.length} of {steps.length} sections completed
          </p>
        </div>
        <StepIndicator
          steps={steps}
          currentIndex={currentIndex}
          completedIds={validCompletedIds}
          disabled={isSubmitting}
          onNavigate={(index) => (index === steps.length ? openReview() : navigate(index))}
        />
        <p className="hidden border-t px-3 pt-5 text-xs leading-relaxed text-muted-foreground lg:block">
          Take your time. You can review and change your answers before sending them to{' '}
          {adviserName}.
        </p>
      </aside>
      <div className="min-w-0 space-y-5">
        <section
          ref={sectionRef}
          className="factfind-stage rounded-2xl border bg-card"
          aria-labelledby="factfind-section-title"
          aria-busy={isSubmitting}
        >
          <div className="factfind-section-header flex items-start justify-between gap-4 rounded-t-2xl border-b px-5 py-7 sm:gap-6 sm:px-8 sm:py-8">
            <div className="min-w-0">
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-accent-strong dark:text-accent">
                {reviewing ? 'One final check' : `Section ${safeIndex + 1} of ${steps.length}`}
              </p>
              <h2
                id="factfind-section-title"
                ref={titleRef}
                tabIndex={-1}
                className="scroll-mt-6 text-2xl font-semibold tracking-tight outline-none"
              >
                {reviewing ? 'Review your answers' : step.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {reviewing
                  ? `Check everything looks right before sending your FactFind to ${adviserName}.`
                  : (step.description ??
                    'Work through the questions below. Fields marked * are required.')}
              </p>
            </div>
            <SectionDepth number={safeIndex + 1} reviewing={reviewing} />
          </div>
          <div className="p-5 sm:p-8">
            {submitError && (
              <Alert variant="destructive" className="mb-6" role="alert">
                <AlertCircle />
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}
            {!reviewing && visibleErrors.length > 0 && (
              <div role="alert" aria-label="Answers to check" className="mb-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
                <p className="text-sm font-semibold">Check {visibleErrors.length} {visibleErrors.length === 1 ? 'answer' : 'answers'} to continue</p>
                <p className="mt-1 text-xs text-muted-foreground">Choose a question to go straight to it.</p>
                <ul className="mt-2 space-y-1">
                  {visibleErrors.map((field) => (
                    <li key={field.id}>
                      <a href={`#${field.id}`} onClick={(event) => {
                        event.preventDefault()
                        const container = document.getElementById(field.id)
                        const target = container?.matches('input,button,textarea,select') ? container : container?.querySelector<HTMLElement>('input,button,textarea,select')
                        target?.focus({ preventScroll: true })
                        target?.scrollIntoView({ behavior: 'instant', block: 'center' })
                      }} className="inline-flex min-h-10 items-center text-left text-sm underline decoration-destructive/40 underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                        {field.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <form
              onSubmit={(event) => {
                event.preventDefault()
                if (reviewing) void handleSubmit()
                else goToNext()
              }}
              noValidate
            >
              {reviewing ? (
                <AnswerReview
                  steps={steps}
                  values={values}
                  onEdit={navigate}
                  disabled={isSubmitting}
                />
              ) : (
                <fieldset
                  ref={fieldsRef}
                  disabled={isSubmitting}
                  className="factfind-fields grid min-w-0 gap-4 sm:grid-cols-2"
                >
                  <legend className="sr-only">{step.title}</legend>
                  {visibleFields.map((field) => isPresentational(field) ? (
                      <FieldRenderer
                        key={field.id}
                        field={field}
                        control={control}
                        register={register}
                        error={errors[field.id]?.message as string | undefined}
                      />
                    ) : (
                      <QuestionCard key={field.id} field={field} number={questionNumbers.get(field.id)!}>
                        <FieldRenderer
                          field={field}
                          control={control}
                          register={register}
                          error={errors[field.id]?.message as string | undefined}
                        />
                      </QuestionCard>
                    ))}
                </fieldset>
              )}
              {reviewing && (
                <p className="mt-6 rounded-xl bg-muted/50 p-4 text-sm leading-relaxed text-muted-foreground">
                  Your answers will be sent to{' '}
                  <span className="font-medium text-foreground">{adviserName}</span>. If anything
                  changes afterwards, let your adviser know.
                </p>
              )}
              <div className="sticky bottom-0 z-10 -mx-5 -mb-5 mt-8 rounded-b-2xl border-t bg-card/95 px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-16px_rgba(0,0,0,0.2)] backdrop-blur sm:-mx-8 sm:-mb-8 sm:px-8" aria-label="Form navigation">
                {!reviewing && (
                  <p className="mb-3 truncate text-xs text-muted-foreground">
                    Next: <span className="font-medium text-foreground">{steps[safeIndex + 1]?.title ?? 'Review your answers'}</span>
                  </p>
                )}
                <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 sm:flex sm:justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate(currentIndex - 1)}
                  disabled={currentIndex === 0 || isSubmitting}
                  className="min-h-11"
                >
                  <ArrowLeft aria-hidden="true" /> Back
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  disabled={isSubmitting}
                  className="factfind-primary-action min-h-12 sm:ml-auto sm:min-w-44"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" aria-hidden="true" /> Sending…
                    </>
                  ) : reviewing ? (
                    <>
                      <Send aria-hidden="true" /> {schema.submitLabel ?? 'Send to adviser'}
                    </>
                  ) : safeIndex === steps.length - 1 ? (
                    <>
                      <ClipboardCheck aria-hidden="true" /> Review answers
                    </>
                  ) : (
                    <>
                      Continue <ArrowRight aria-hidden="true" />
                    </>
                  )}
                </Button>
                {!reviewing && hasReviewed && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={openReview}
                    disabled={isSubmitting}
                    className="col-span-2 min-h-11"
                  >
                    Return to review
                  </Button>
                )}
                </div>
              </div>
            </form>
          </div>
        </section>
        <p className="flex items-start justify-center gap-2 px-2 text-center text-xs leading-relaxed text-muted-foreground">
          <LockKeyhole className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Your answers are sent when you submit. Keep this tab open until you finish.
        </p>
      </div>
    </div>
  )
}
