import type { FactFindType } from '@/lib/supabase/database.types'
import { mortgageSchema } from './schemas/mortgage'
import { protectionSchema } from './schemas/protection'
import { medicalSchema } from './schemas/medical'
import { homeSchema } from './schemas/home'
import { mortgageFuturePerfectSchema } from './schemas/mortgage-future-perfect'
import type { FormSchema } from './types'

/**
 * The FactFind schema registry.
 *
 * Every adviser gets the four standard question sets. A link can instead
 * carry a named variant (`factfind_forms.variant`), a bespoke question set
 * for one practice that keeps the same FactFind type everywhere else:
 * submissions, PDFs, emails and the dashboard treat it as that type.
 */
const REGISTRY: Record<FactFindType, FormSchema> = {
  mortgage: mortgageSchema,
  protection: protectionSchema,
  medical: medicalSchema,
  home: homeSchema,
}

/** Bespoke question sets, by variant name then FactFind type. */
export const FORM_VARIANTS: Record<string, Partial<Record<FactFindType, FormSchema>>> = {
  future_perfect: { mortgage: mortgageFuturePerfectSchema },
}

export const FORM_VARIANT_NAMES = Object.keys(FORM_VARIANTS)

/** The schema a link serves: its variant's, when one is set for that type, else the standard one. */
export function getFormSchema(type: FactFindType, variant?: string | null): FormSchema {
  return (variant && FORM_VARIANTS[variant]?.[type]) || REGISTRY[type]
}

export function isFormVariant(value: unknown): value is string {
  return typeof value === 'string' && Object.hasOwn(FORM_VARIANTS, value)
}

/** The four standard schemas (variants are not counted among them). */
export function getAllFormSchemas(): FormSchema[] {
  return Object.values(REGISTRY)
}

/**
 * The schema a saved submission was answered against, found through the
 * `schema_version` it recorded, so a bespoke submission is read with its own
 * question set. Falls back to the type's standard schema.
 */
export function getSchemaForSubmission(type: FactFindType, data: unknown): FormSchema {
  const version = data && typeof data === 'object' && !Array.isArray(data)
    ? (data as { schema_version?: unknown }).schema_version
    : undefined
  if (typeof version === 'string') {
    for (const variants of Object.values(FORM_VARIANTS)) {
      const candidate = variants[type]
      if (candidate && candidate.version === version) return candidate
    }
  }
  return REGISTRY[type]
}
