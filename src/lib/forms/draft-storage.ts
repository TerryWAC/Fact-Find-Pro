import type { FormValues } from './types'

/**
 * Unfinished answers, kept in the client's own browser (localStorage) so they
 * can close the tab and carry on later. Nothing leaves the device until the
 * form is submitted; the draft is removed on submission, on "Start again", or
 * when it is older than DRAFT_TTL_DAYS.
 */
export interface FormDraft {
  /** Schema version the answers were given against; a changed form starts fresh. */
  version: string
  values: FormValues
  activeStepId: string
  completedIds: string[]
  /** ISO timestamp of the last save. */
  savedAt: string
}

export const DRAFT_TTL_DAYS = 30
const PREFIX = 'factfind-draft:v1:'

export function draftKey(formType: string, slug: string): string {
  return `${PREFIX}${formType}:${slug}`
}

function storage(): Storage | null {
  try {
    if (typeof window === 'undefined') return null
    return window.localStorage
  } catch {
    return null
  }
}

/** Answers that differ from "nothing entered" — an untouched form is not a draft. */
export function answeredValues(values: FormValues): FormValues {
  const out: FormValues = {}
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === null || value === '' || value === false) continue
    if (Array.isArray(value) && value.length === 0) continue
    out[key] = value
  }
  return out
}

export function loadDraft(key: string, version: string): FormDraft | null {
  const store = storage()
  if (!store) return null
  try {
    const raw = store.getItem(key)
    if (!raw) return null
    const draft = JSON.parse(raw) as Partial<FormDraft>
    if (!draft || typeof draft !== 'object' || draft.version !== version) {
      store.removeItem(key)
      return null
    }
    const savedAt = new Date(draft.savedAt ?? '')
    if (Number.isNaN(savedAt.getTime()) || Date.now() - savedAt.getTime() > DRAFT_TTL_DAYS * 86_400_000) {
      store.removeItem(key)
      return null
    }
    const values = answeredValues((draft.values ?? {}) as FormValues)
    if (Object.keys(values).length === 0) {
      store.removeItem(key)
      return null
    }
    return {
      version,
      values,
      activeStepId: typeof draft.activeStepId === 'string' ? draft.activeStepId : '',
      completedIds: Array.isArray(draft.completedIds) ? draft.completedIds.filter((id) => typeof id === 'string') : [],
      savedAt: savedAt.toISOString(),
    }
  } catch {
    return null
  }
}

export function saveDraft(key: string, draft: Omit<FormDraft, 'savedAt'>): void {
  const store = storage()
  if (!store) return
  try {
    const values = answeredValues(draft.values)
    if (Object.keys(values).length === 0) {
      store.removeItem(key)
      return
    }
    store.setItem(key, JSON.stringify({ ...draft, values, savedAt: new Date().toISOString() } satisfies FormDraft))
  } catch {
    // Storage full or blocked — the form still works, it just will not resume.
  }
}

export function clearDraft(key: string): void {
  try {
    storage()?.removeItem(key)
  } catch {
    // ignore
  }
}
