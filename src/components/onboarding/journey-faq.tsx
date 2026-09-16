import { ChevronDown } from 'lucide-react'

const QUESTIONS = [
  [
    'Does my client need an account?',
    'No. Your client opens the FactFind link, fills it in and reviews their answers before submitting. Your adviser dashboard requires your own sign-in.',
  ],
  [
    'Can I complete it during a client meeting?',
    'Yes. Open the appropriate form and complete it with your client. Mortgage and Protection include an Adviser mode for internal sections and notes. These internal answers stay out of the client PDF copy.',
  ],
  [
    'Are unfinished answers saved?',
    'Answers are held in the open browser tab until submission. There is no saved draft or cross-device resume. Keep the tab open and finish the form before closing it.',
  ],
  [
    'What happens after a client submits?',
    'The client sees a confirmation and reference. Their record appears in your Submissions area. Review it, download the PDF and update its review status. Automatic PDF emails follow your saved delivery preferences.',
  ],
  [
    'Who can see the client records?',
    'Your adviser workspace shows your own submissions. Authorised platform administrators can access records for account and submission support. Adding a colleague to the team directory does not create an account or grant access.',
  ],
  [
    'Can I use this on my phone or iPad?',
    'Yes. Use the browser on your phone, tablet or computer. Add to home screen creates a shortcut; it does not provide offline access or save unfinished answers.',
  ],
] as const

export function JourneyFaq() {
  return (
    <section aria-labelledby="journey-questions">
      <p className="onboarding-eyebrow">Before your first client</p>
      <h2
        id="journey-questions"
        className="mb-5 mt-2 text-2xl font-semibold tracking-tight"
      >
        A few useful things to know.
      </h2>
      <div className="divide-y overflow-hidden rounded-2xl border bg-card">
        {QUESTIONS.map(([question, answer]) => (
          <details key={question} className="group">
            <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-6 [&::-webkit-details-marker]:hidden">
              {question}
              <ChevronDown
                className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                aria-hidden
              />
            </summary>
            <p className="max-w-3xl px-5 pb-6 text-sm leading-7 text-muted-foreground sm:px-6">
              {answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  )
}
