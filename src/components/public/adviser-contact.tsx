import { Globe, Mail, MapPin, Phone } from 'lucide-react'
import {
  practiceEmail,
  practicePhone,
  practiceWebsite,
  type PracticeDetails,
} from '@/lib/practice'

export function AdviserContact({ details }: { details: PracticeDetails }) {
  const website = practiceWebsite(details.website)
  const email = practiceEmail(details.contact_email)
  const phone = practicePhone(details.contact_phone)
  const linkClass =
    'inline-flex min-h-11 max-w-full items-center gap-2 rounded text-xs font-medium underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
  return (
    <div className="mt-2 min-w-0">
      {details.job_title && (
        <p className="break-words text-xs text-muted-foreground">
          {details.job_title}
        </p>
      )}
      <div className="flex flex-wrap gap-x-5">
        {email && (
          <a className={linkClass} href={`mailto:${encodeURIComponent(email)}`}>
            <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Email your adviser
          </a>
        )}
        {phone && (
          <a className={linkClass} href={`tel:${phone}`}>
            <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Call your adviser
          </a>
        )}
        {website && (
          <a
            className={linkClass}
            href={website}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Globe className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Visit our website<span className="sr-only"> (new tab)</span>
          </a>
        )}
      </div>
      {(details.services ||
        details.client_focus ||
        details.business_location) && (
        <details className="mt-1 max-w-lg">
          <summary className="inline-flex min-h-11 cursor-pointer items-center rounded text-xs font-medium underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            About your adviser’s practice
          </summary>
          <div className="space-y-3 rounded-xl border bg-muted/30 p-4 text-xs leading-6">
            {details.services && (
              <div>
                <p className="font-semibold">How we can help</p>
                <p className="whitespace-pre-wrap break-words text-muted-foreground">
                  {details.services}
                </p>
              </div>
            )}
            {details.client_focus && (
              <div>
                <p className="font-semibold">Who we help</p>
                <p className="whitespace-pre-wrap break-words text-muted-foreground">
                  {details.client_focus}
                </p>
              </div>
            )}
            {details.business_location && (
              <p className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="mt-1 h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="min-w-0 break-words">{details.business_location}</span>
              </p>
            )}
          </div>
        </details>
      )}
    </div>
  )
}
