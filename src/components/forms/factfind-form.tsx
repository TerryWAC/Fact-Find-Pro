'use client'

import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Loader2, Send } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { FieldRenderer } from './field-renderer'
import { StepIndicator } from './step-indicator'
import {
  buildSubmissionPayload,
  defaultValuesFor,
  extractClientIdentity,
  isFieldVisible,
  validateStep,
} from '@/lib/forms/engine'
import type { FormSchema, FormValues } from '@/lib/forms/types'
import type { FactFindType } from '@/lib/supabase/database.types'

export interface FactFindSubmitResult {
  ok: boolean
  reference?: string
  error?: string
}

interface FactFindFormProps {
  schema: FormSchema
  slug: string
  formType: FactFindType
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
  onSubmitAction,
  onComplete,
}: FactFindFormProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const defaultValues = useMemo(() => defaultValuesFor(schema), [schema])

  const {
    control,
    register,
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues, mode: 'onTouched' })

  const values = watch()
  const totalSteps = schema.steps.length
  const step = schema.steps[stepIndex]
  const isLastStep = stepIndex === totalSteps - 1

  const visibleFields = step.fields.filter((field) => isFieldVisible(field, values))

  // Progress reflects completed steps, ticking to 100% on the final submit.
  const progress = Math.round((stepIndex / totalSteps) * 100)

  function applyErrors(stepErrors: Record<string, string>) {
    clearErrors()
    for (const [fieldId, message] of Object.entries(stepErrors)) {
      setError(fieldId, { type: 'manual', message })
    }
    const firstId = Object.keys(stepErrors)[0]
    if (firstId) {
      document.getElementById(firstId)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  function goToNext() {
    const result = validateStep(step, values)
    if (!result.ok) {
      applyErrors(result.errors)
      return
    }
    clearErrors()
    setStepIndex((index) => Math.min(index + 1, totalSteps - 1))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function goToPrevious() {
    clearErrors()
    setStepIndex((index) => Math.max(index - 1, 0))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleSubmit() {
    setSubmitError(null)

    // Re-validate every step, not just the last one.
    for (let index = 0; index < schema.steps.length; index += 1) {
      const result = validateStep(schema.steps[index], values)
      if (!result.ok) {
        setStepIndex(index)
        applyErrors(result.errors)
        window.scrollTo({ top: 0, behavior: 'smooth' })
        return
      }
    }

    const identity = extractClientIdentity(schema, values)
    if (!identity.client_name || !identity.client_email) {
      setStepIndex(0)
      setSubmitError('Please provide your name and email address so your adviser can reach you.')
      return
    }

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
        return
      }

      onComplete(result.reference)
    } catch {
      setSubmitError('Something went wrong while submitting. Please check your connection and try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="text-muted-foreground">
            Step {stepIndex + 1} of {totalSteps}
          </span>
          <span className="text-accent-strong dark:text-accent">{progress}% complete</span>
        </div>
        <Progress value={progress} aria-label="FactFind progress" />
        <StepIndicator steps={schema.steps} currentIndex={stepIndex} />
      </div>

      <Card className="p-6 sm:p-8">
        <div className="mb-6 space-y-1.5">
          <h2 className="text-lg font-semibold tracking-tight">{step.title}</h2>
          {step.description && <p className="text-sm text-muted-foreground">{step.description}</p>}
        </div>

        {submitError && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle />
            <AlertDescription>{submitError}</AlertDescription>
          </Alert>
        )}

        <form
          className="grid gap-5 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault()
            if (isLastStep) void handleSubmit()
            else goToNext()
          }}
          noValidate
        >
          {visibleFields.map((field) => (
            <FieldRenderer
              key={field.id}
              field={field}
              control={control}
              register={register}
              error={errors[field.id]?.message as string | undefined}
            />
          ))}

          <div className="sm:col-span-2 mt-2 flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={goToPrevious}
              disabled={stepIndex === 0 || isSubmitting}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>

            <Button type="submit" size="lg" disabled={isSubmitting} className="sm:min-w-[12rem]">
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Submitting…
                </>
              ) : isLastStep ? (
                <>
                  <Send className="h-4 w-4" />
                  {schema.submitLabel ?? 'Submit FactFind'}
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <CheckCircle2 className="h-3.5 w-3.5 text-accent-strong dark:text-accent" />
        Your answers are only shared with your adviser.
      </p>
    </div>
  )
}
