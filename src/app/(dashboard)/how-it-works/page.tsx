import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Settings } from 'lucide-react'
import { requireApprovedUser } from '@/lib/auth'
import { ProductTour } from '@/components/onboarding/product-tour'
import { JourneyFaq } from '@/components/onboarding/journey-faq'
import { HelpCentre } from '@/components/onboarding/help-centre'
import { PageHeader } from '@/components/shared/page-header'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = { title: 'How it works' }

export default async function HowItWorksPage() {
  const { profile } = await requireApprovedUser()
  return (
    <>
      <PageHeader
        title="A confident start with every client."
        description="Your guide to sharing forms, reviewing answers and choosing who receives a PDF."
        actions={
          <Button variant="outline" asChild>
            <Link href="/onboarding?step=1">
              <Settings className="h-4 w-4" aria-hidden />
              Review my setup
            </Link>
          </Button>
        }
      />
      <ProductTour
        companyName={profile.company_name || profile.name}
        adviserName={profile.name}
        brandColour={profile.brand_colour}
        adviserCopy={profile.delivery_email_copy}
        clientCopy={profile.delivery_client_copy}
      />
      <div className="flex flex-col gap-4 rounded-2xl border bg-accent/5 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">
            Ready for your first client?
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a form, copy your link and share it when you are ready.
          </p>
        </div>
        <Button asChild className="shrink-0">
          <Link href="/links">
            Open my FactFind links
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </div>
      <JourneyFaq />
      <HelpCentre />
    </>
  )
}
