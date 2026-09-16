# Client journey

All four adviser links share the same responsive journey. Existing question schemas, conditional sections, branding and submission payloads are preserved.

1. A welcome screen introduces the adviser, estimates completion time and suggests details to have ready.
2. A section navigator shows completed sections. It stays beside the form on desktop and folds into a section menu on mobile. Earlier sections can be revisited without losing answers.
3. The final section opens an answer review. Each section can be edited, then checked again before submission. Hidden questions and hidden applicants are excluded from both review and submission.
4. Successful submission shows a reference that can be copied and explains what happens next. It does not claim an email has been delivered.

Inputs support larger touch targets, identity autofill, linked error messages and keyboard focus on invalid fields. An unsaved-change browser prompt helps prevent accidental navigation. Answers are held in memory only: there is no saved draft or cross-device resume. Closing the tab discards unfinished answers; the UI explains this.

## 3D form interactions

All four form types and their admin previews share a brief perspective transition between sections, a layered paper section marker, raised radio/checkbox choices, animated progress and completion ticks, and a raised submission button. The successful submission screen has a short card and confirmation-seal entrance. Colours come from the surrounding adviser branding in both themes.

Section motion uses the browser's Web Animations API on the existing section element, without remounting inputs or introducing an animation dependency. The transition runs for 320 ms on small screens and 440 ms on larger screens, then removes its transform so the sticky navigation returns to its ordinary layout. Animation is tied to section changes, not typing. Cleanup cancels an interrupted transition. Hover tilt is limited to devices with a fine pointer; touch selection still has immediate visual feedback.

All decorative CSS animations are finite and enabled only when `prefers-reduced-motion` allows them. The section transition also watches changes to this preference and cancels immediately when reduced motion is enabled. The layered marker is decorative and hidden from assistive technology. Focus still moves to the section title or invalid field. Progress exposes its actual value through the accessible progress bar.

Verified on 14 September 2026: lint, typecheck, 56 existing unit tests and local/hosted production builds passed. Browser checks covered forward/back navigation with retained text and radio answers, normal 3D transforms, reduced-motion styling and cancellation during an active transition, phone (390 px), tablet (768 px) and desktop (1280 px) layouts, light/dark adviser branding, keyboard radio selection and adviser/client conditional sections. A fictional Home FactFind completed against the isolated local backend and displayed its reference and animated confirmation. No provider emails were sent. These are Chromium viewport checks, not additional physical-device certification. The production Home form was checked after deployment.

Automatic notification work uses Next.js `after()` with a 60-second route duration and awaits both enabled copies independently. Provider requests have a 10-second timeout and one bounded retry for temporary failures using the same idempotency key. This prevents untracked work being stopped as soon as a successful response returns; it is not a durable queue. Live delivery still requires the existing service-role and Resend configuration. See [email setup and testing](email-setup.md).

## Local preview

Run `npm ci`, then `npm run preview:client` and open http://localhost:3008/f/home/preview. Substitute `mortgage`, `protection` or `medical` for `home`. Use the slug `violet` for custom branding or `inactive` for an unavailable link.

The preview starts a local Supabase stand-in on port 45439 and uses a separate `.next-preview` build directory. Test-only configuration overrides public credentials and disables email/service-role credentials. The fictional adviser is Alex Morgan at Morgan Financial. Requests are kept in memory and discarded on shutdown. The mock implements public resolution, submission and limited account fixtures for email-settings access checks; it does not validate real Supabase authentication, RLS, storage or live email delivery. Local demo accounts are `admin@example.test` and `adviser@example.test`, both with password `PreviewOnly!`.

## Verification

```sh
npm run lint
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
```

Stop an existing preview before `test:e2e` (it builds its own production preview using ports 3008 and 45439). Playwright covers all four forms on desktop and mobile, validation focus, editing, failed-send recovery, branding, unavailable links and conditional applicant removal. Screenshots and failure traces are saved in `test-results/`. GitHub Actions runs these checks on pull requests.

The journey changes do not require a database migration. The later readiness pass adds part 8 for internal function permissions; see [the readiness report](readiness.md).
