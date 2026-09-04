import type { FactFindType } from '@/lib/supabase/database.types'
import { mortgageSchema } from './schemas/mortgage'
import { protectionSchema } from './schemas/protection'
import { medicalSchema } from './schemas/medical'
import { homeSchema } from './schemas/home'
import type { FormSchema } from './types'

/**
 * The FactFind schema registry.
 *
 * Swap any entry for a real question set — or replace `getFormSchema` with a
 * database/CMS lookup — and the rest of the platform keeps working.
 */
const REGISTRY: Record<FactFindType, FormSchema> = {
  mortgage: mortgageSchema,
  protection: protectionSchema,
  medical: medicalSchema,
  home: homeSchema,
}

export function getFormSchema(type: FactFindType): FormSchema {
  return REGISTRY[type]
}

export function getAllFormSchemas(): FormSchema[] {
  return Object.values(REGISTRY)
}
