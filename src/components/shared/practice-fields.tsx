import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FieldError } from './field-error'
import type { PracticeDetails } from '@/lib/practice'

export function PracticeFields({
  values,
  errors,
}: {
  values: PracticeDetails & { fca_number?: string | null }
  errors?: Record<string, string>
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-base font-semibold">
          Your practice and the people you help
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Optional details for your client pages. Add business information you
          want clients to see. Your FCA reference is retained in your account.
        </p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        {[
          {
            name: 'job_title',
            label: 'Your role',
            placeholder: 'Mortgage & Protection Adviser',
          },
          {
            name: 'business_location',
            label: 'Where you work',
            placeholder: 'Manchester and clients across the UK',
          },
          {
            name: 'website',
            label: 'Business website',
            placeholder: 'yourfirm.co.uk',
            type: 'url',
            help: 'We add https:// if needed. This is a link, not an import of your website.',
          },
          {
            name: 'contact_email',
            label: 'Client contact email',
            placeholder: 'hello@yourfirm.co.uk',
            type: 'email',
            help: 'Shown on client forms and used for client PDF email replies. Leave blank to keep your account email as the reply address.',
          },
          {
            name: 'fca_number',
            label: 'FCA reference number',
            placeholder: '123456',
            help: 'Your reference is not a verification or endorsement by FactFind Pro.',
          },
        ].map((field) => (
          <div key={field.name} className="space-y-2">
            <Label htmlFor={field.name}>{field.label}</Label>
            <Input
              id={field.name}
              name={field.name}
              type={field.type ?? 'text'}
              defaultValue={values[field.name as keyof typeof values] ?? ''}
              placeholder={field.placeholder}
              aria-invalid={Boolean(errors?.[field.name])}
              aria-describedby={`${field.name}-help ${field.name}-error`}
            />
            <p
              id={`${field.name}-help`}
              className="text-xs leading-relaxed text-muted-foreground"
            >
              {field.help}
            </p>
            <div id={`${field.name}-error`}>
              <FieldError message={errors?.[field.name]} />
            </div>
          </div>
        ))}
      </div>
      {[
        {
          name: 'services',
          label: 'What do you help with?',
          placeholder:
            'For example: mortgages, remortgages, life cover and income protection.',
        },
        {
          name: 'client_focus',
          label: 'Who do you help?',
          placeholder:
            'For example: first-time buyers, growing families and self-employed clients.',
        },
      ].map((field) => (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name}>{field.label}</Label>
          <Textarea
            id={field.name}
            name={field.name}
            defaultValue={
              values[field.name as 'services' | 'client_focus'] ?? ''
            }
            placeholder={field.placeholder}
            rows={3}
            maxLength={600}
            aria-invalid={Boolean(errors?.[field.name])}
            aria-describedby={`${field.name}-help ${field.name}-error`}
          />
          <p
            id={`${field.name}-help`}
            className="text-xs text-muted-foreground"
          >
            Up to 600 characters. Describe your practice without including
            client records.
          </p>
          <div id={`${field.name}-error`}>
            <FieldError message={errors?.[field.name]} />
          </div>
        </div>
      ))}
    </div>
  )
}
