import Link from 'next/link'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { BrandBanner } from './brand-banner'
import { DismissSetupButton } from './dismiss-setup-button'
import type { ChecklistTask } from '@/lib/onboarding'
import { cn } from '@/lib/utils'

export function WelcomeStep({
  tasks,
  firstName,
  hasStarted,
}: {
  tasks: ChecklistTask[]
  firstName: string
  /** True once the adviser has moved past the welcome screen before. */
  hasStarted: boolean
}) {
  const nextTask = tasks.find((task) => !task.done && !task.optional) ?? tasks[0]

  return (
    <div className="space-y-8">
      <BrandBanner />

      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Welcome to <span className="text-accent">FactFind Pro</span>
          {firstName ? `, ${firstName}` : ''}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Five minutes and you are live. Add your name and brand, choose where finished fact finds go, and
          start with your first client. You can change any of it later in Settings.
        </p>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="border-b px-6 py-4">
          <h2 className="text-base font-semibold">What you will set up</h2>
        </div>

        <ul className="divide-y">
          {tasks.map((task) => (
            <li key={task.step} className="flex items-center gap-4 px-6 py-4">
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border transition-colors',
                  task.done
                    ? 'border-accent bg-accent text-accent-foreground'
                    : 'border-border text-transparent',
                )}
                aria-hidden
              >
                <Check className="h-4 w-4" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">
                  {task.title}
                  {task.optional && (
                    <span className="ml-2 text-xs font-normal text-muted-foreground">Optional</span>
                  )}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{task.description}</p>
              </div>

              <Button asChild variant={task.done ? 'ghost' : 'outline'} size="sm">
                <Link href={`/onboarding?step=${task.step}`}>
                  {task.done ? 'Edit' : 'Do it'}
                  <span className="sr-only"> — {task.title}</span>
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <DismissSetupButton />
        <Button asChild variant="accent" size="lg" className="sm:min-w-[14rem]">
          <Link href={`/onboarding?step=${nextTask?.step ?? 2}`}>
            {hasStarted ? 'Continue setup' : 'Start setup'}
          </Link>
        </Button>
      </div>
    </div>
  )
}
