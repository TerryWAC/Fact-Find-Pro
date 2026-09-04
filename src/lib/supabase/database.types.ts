/**
 * Database types for FactFind Pro.
 *
 * Hand-maintained to mirror supabase/migrations. Regenerate from a live
 * project at any time with:
 *   supabase gen types typescript --project-id <ref> > src/lib/supabase/database.types.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type UserRole = 'admin' | 'adviser'
export type UserStatus = 'pending' | 'approved' | 'rejected' | 'suspended'
export type FactFindType = 'mortgage' | 'protection' | 'medical' | 'home'
export type SubmissionStatus = 'new' | 'in_review' | 'completed' | 'archived'

// -----------------------------------------------------------------------------
// Row / Insert shapes
// -----------------------------------------------------------------------------

type ProfileRow = {
  id: string
  name: string
  company_name: string | null
  email: string
  phone: string | null
  role: UserRole
  status: UserStatus
  adviser_slug: string | null
  avatar_url: string | null
  logo_url: string | null
  brand_colour: string | null
  approved_at: string | null
  approved_by: string | null
  rejected_at: string | null
  rejection_reason: string | null
  created_at: string
  updated_at: string
}

type ProfileInsert = {
  id: string
  name?: string
  company_name?: string | null
  email: string
  phone?: string | null
  role?: UserRole
  status?: UserStatus
  adviser_slug?: string | null
  avatar_url?: string | null
  logo_url?: string | null
  brand_colour?: string | null
  approved_at?: string | null
  approved_by?: string | null
  rejected_at?: string | null
  rejection_reason?: string | null
  created_at?: string
  updated_at?: string
}

type FactFindFormRow = {
  id: string
  adviser_id: string
  form_type: FactFindType
  unique_slug: string
  is_active: boolean
  created_at: string
}

type FactFindFormInsert = {
  id?: string
  adviser_id: string
  form_type: FactFindType
  unique_slug: string
  is_active?: boolean
  created_at?: string
}

type FactFindSubmissionRow = {
  id: string
  form_id: string | null
  adviser_id: string
  form_type: FactFindType
  reference: string
  client_name: string
  client_email: string
  client_phone: string | null
  status: SubmissionStatus
  submission_data: Json
  meta: Json
  submitted_at: string
}

type FactFindSubmissionInsert = {
  id?: string
  form_id?: string | null
  adviser_id: string
  form_type: FactFindType
  reference: string
  client_name: string
  client_email: string
  client_phone?: string | null
  status?: SubmissionStatus
  submission_data?: Json
  meta?: Json
  submitted_at?: string
}

type EmailTemplateRow = {
  id: string
  key: string
  name: string
  description: string | null
  subject: string
  body_html: string
  body_text: string | null
  enabled: boolean
  updated_at: string
}

type EmailTemplateInsert = {
  id?: string
  key: string
  name: string
  description?: string | null
  subject: string
  body_html: string
  body_text?: string | null
  enabled?: boolean
  updated_at?: string
}

type EmailLogRow = {
  id: string
  template_key: string | null
  to_email: string
  subject: string
  status: string
  provider: string | null
  error: string | null
  payload: Json
  created_at: string
}

type EmailLogInsert = {
  id?: string
  template_key?: string | null
  to_email: string
  subject: string
  status?: string
  provider?: string | null
  error?: string | null
  payload?: Json
  created_at?: string
}

type ActivityLogRow = {
  id: string
  adviser_id: string | null
  actor_id: string | null
  type: string
  title: string
  description: string | null
  metadata: Json
  created_at: string
}

type ActivityLogInsert = {
  id?: string
  adviser_id?: string | null
  actor_id?: string | null
  type: string
  title: string
  description?: string | null
  metadata?: Json
  created_at?: string
}

// -----------------------------------------------------------------------------
// Schema
// -----------------------------------------------------------------------------
// NOTE: every shape below is a `type`, not an `interface`. supabase-js constrains
// the schema to `Record<string, unknown>`, and interfaces have no implicit index
// signature — declaring these as interfaces silently resolves every query to
// `never`.

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow
        Insert: ProfileInsert
        Update: Partial<ProfileInsert>
        Relationships: []
      }
      factfind_forms: {
        Row: FactFindFormRow
        Insert: FactFindFormInsert
        Update: Partial<FactFindFormInsert>
        Relationships: []
      }
      factfind_submissions: {
        Row: FactFindSubmissionRow
        Insert: FactFindSubmissionInsert
        Update: Partial<FactFindSubmissionInsert>
        Relationships: []
      }
      email_templates: {
        Row: EmailTemplateRow
        Insert: EmailTemplateInsert
        Update: Partial<EmailTemplateInsert>
        Relationships: []
      }
      email_log: {
        Row: EmailLogRow
        Insert: EmailLogInsert
        Update: Partial<EmailLogInsert>
        Relationships: []
      }
      activity_log: {
        Row: ActivityLogRow
        Insert: ActivityLogInsert
        Update: Partial<ActivityLogInsert>
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
      is_approved: { Args: Record<PropertyKey, never>; Returns: boolean }
      provision_factfind_forms: { Args: { p_adviser_id: string }; Returns: undefined }
      resolve_factfind_form: {
        Args: { p_form_type: FactFindType; p_slug: string }
        Returns: {
          form_id: string
          adviser_id: string
          adviser_name: string
          company_name: string | null
          logo_url: string | null
          brand_colour: string | null
          form_type: FactFindType
          is_active: boolean
        }[]
      }
      submit_factfind: {
        Args: {
          p_form_type: FactFindType
          p_slug: string
          p_client_name: string
          p_client_email: string
          p_client_phone?: string | null
          p_submission_data?: Json
          p_meta?: Json
        }
        Returns: { submission_id: string; reference: string }[]
      }
    }
    Enums: {
      user_role: UserRole
      user_status: UserStatus
      factfind_type: FactFindType
      submission_status: SubmissionStatus
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Profile = ProfileRow
export type FactFindForm = FactFindFormRow
export type FactFindSubmission = FactFindSubmissionRow
export type EmailTemplate = EmailTemplateRow
export type ActivityLogEntry = ActivityLogRow
