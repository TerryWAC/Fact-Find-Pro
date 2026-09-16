import { getFormSchema } from '@/lib/forms/registry'
import { isStepVisible } from '@/lib/forms/engine'
import { normaliseSubmissionData, type StepBlock } from '@/lib/submission-data'
import type { FactFindType, Json } from '@/lib/supabase/database.types'

const comparable = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '')

/** Client copies exclude internal sections, including legacy flat answer maps. */
export function clientSubmissionSteps(type: FactFindType, data: Json): StepBlock[] {
  const internal = getFormSchema(type).steps.filter((step) =>
    isStepVisible(step, { who_completing: 'adviser' }) &&
    !isStepVisible(step, { who_completing: 'client' }),
  )
  const internalSteps = new Set(internal.flatMap((step) => [step.id, step.title]).map(comparable))
  const internalAnswers = new Set(internal.flatMap((step) => step.fields
    .flatMap((field) => [field.id, field.label ?? field.id])).map(comparable))

  return normaliseSubmissionData(data)
    .filter((step) => !internalSteps.has(comparable(step.id)) && !internalSteps.has(comparable(step.title)))
    .map((step) => ({
      ...step,
      answers: step.answers.filter((answer) =>
        !internalAnswers.has(comparable(answer.id ?? '')) &&
        !internalAnswers.has(comparable(answer.label))),
    }))
    .filter((step) => step.answers.length > 0)
}
