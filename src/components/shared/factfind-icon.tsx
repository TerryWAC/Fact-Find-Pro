import { Building2, Home, Shield, Stethoscope, type LucideIcon } from 'lucide-react'
import type { FactFindType } from '@/lib/supabase/database.types'

const ICONS: Record<FactFindType, LucideIcon> = {
  mortgage: Building2,
  protection: Shield,
  medical: Stethoscope,
  home: Home,
}

export function factFindIcon(type: FactFindType): LucideIcon {
  return ICONS[type]
}
