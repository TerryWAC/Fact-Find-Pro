# FactFind Pro readiness — 14 September 2026

The application is live at [fact-find-pro.vercel.app](https://fact-find-pro.vercel.app/login). Start with the current [launch and transfer guide](transfer-and-launch.md). The [13 September launch check](final-launch-check-2026-09-13.md) records the earlier full browser/email audit; it is not a fresh count of every current-release test. The [repair report](launch-fixes-2026-09-13.md) contains approved live inbox evidence. The [original audit](full-launch-audit-2026-09-13.md) describes defects before the fixes.

## Current release

- Latest deployed application: `d820045`, adding individual question cards and accessible question motion to the guided onboarding, adviser practice/contact fields and prepared imports.
- Vercel deployment: `dpl_8zTh4228WMxKPBMdwmafmBvssjWS`, Ready and serving the public domain. Later documentation changes are identified by the transfer manifest.
- Supabase migration `20260913211513_restrict_factfind_writes_to_validated_server.sql` is applied. No user SQL step remains.
- The server validates Typeform answers before writing. Direct anonymous/authenticated write RPC calls are denied; link ownership, inactive-link checks and record isolation remain enforced.
- Admin search, unavailable-data states, notification outcomes and retry, registration-document links, colleague-directory descriptions, login hydration and PDF heading pagination are repaired.

The [question-motion check](question-motion-2026-09-14.md) records the latest pass: all four forms completed in the isolated browser environment, 59 unit tests and the 400-question Typeform comparison passed, and phone/tablet/desktop plus reduced-motion checks passed. The new cards were also verified on Terry's live Home form. No external email was sent. This presentation update does not replace the earlier full email/PDF audit or close the outstanding activation and recovery items below.

## Current handover checks

Authenticated reads of all six onboarding pages, Settings, the dashboard, guide and admin users passed again on 14 September. The live database regression passed with its fictional fixtures rolled back. Every public data table retains RLS. All 135 prepared advisers, 540 inactive forms and 264 private inspection images remain in place; the email log stayed at 30 entries. Typeform comparison and 23 import tests passed again, and the production dependency audit reported zero vulnerabilities.

New source packaging tests verify clean-release export, hashes, refusal to overwrite, exclusion of tracked private files, and secret detection without printing values. The combined setup generator now includes all 11 migrations, reads/writes UTF-8 explicitly and has a CI consistency check. The README and CI cover the current branch. Legacy direct account-reset/demo-seed SQL performs no writes; current source no longer contains the legacy seed passwords. Historical Git/patch files still require a separate credential audit before sharing.

The live **Confirm email** setting was found disabled and enabled during this pass. No signup, recovery or invitation was triggered to test it; the app's confirmation branch and callback support were inspected. A separately authorised live signup/confirmation test remains outstanding under the current no-email instruction. Existing users, passwords and adviser delivery preferences were not changed.

The source transfer rehearsal and remaining owner items are recorded in [the handover guide](transfer-and-launch.md). In particular, existing-adviser activation and a full Auth/database/Storage recovery rehearsal are not complete.

## Earlier full-suite verification (13 September)

| Check | Result |
|---|---|
| Original Typeform comparison | 400 questions; 49,937 answered gate combinations accounted for, with documented import corrections |
| Unit cases | 53 passed |
| Chromium desktop/mobile cases | 72 passed in the final launch check |
| WebKit desktop/iPhone cases | 70 passed across the full run and targeted keyboard-focus reruns |
| Captured email integration | 22 passed again after the final PDF change |
| Responsive checks | 15 passed across phone, tablet and desktop sizes |
| Build, types, lint, PDF tracing | Passed; 34 PDF assets across five routes |
| Production dependency audit | Zero reported vulnerabilities at test time |
| Detailed PDF checks | Eight PDFs, 713 answer entries; six additional internal-note privacy copies; no overlap, margin overflow or orphan headings |
| Real database tests | Passed before and after migration; test fixtures rolled back |
| Public-site journey | Registration, pending gate, admin approval, comma search, onboarding, dashboard, adviser Medical and anonymous Home completion passed |
| Real emails | Medical FF-001019 and Home FF-001020 PDFs received in Gmail; corrected copies received and matched hosted downloads |
| Password recovery | Received link, fictional-account password change, new login and used-link rejection passed |

Terry's own password and delivery preferences were not changed. Both local and hosted fictional advisers were suspended, their links disabled and submissions archived; test sessions were revoked.

## Launch scope and follow-up

The platform supports individual adviser accounts and their dashboards. Clients use public forms and optional PDF copies. Mortgage and Protection retain Typeform adviser/client selectors and private notes; Medical and Home do not gain selectors absent from their source forms. Adviser delivery preferences remain in force.

The supplied January privacy statement has been reconciled with the current service. The owner chose retention until deletion is requested; there is no automatic 90-day deletion. Operator details, service providers and deletion-request information are documented in the [policy and onboarding review](supplied-policy-review-2026-09-13.md), alongside [replacement classroom copy](classroom-launch-copy.md). Review the outstanding account-data lawful bases, international-transfer arrangements and processor agreement before treating these as approved launch documents. This is technical verification, not legal certification.

There is no shared firm dashboard, client dashboard, secure draft resume, offline completion, durable email queue or implemented CRM/webhook delivery. The home-screen web app is not a native App Store app. Physical iPhone/iPad keyboards, first-use cross-device recovery, load testing and independent penetration testing remain unverified. Supabase leaked-password protection is now enabled: the advisory cleared and a live breached-password signup was rejected without creating an account.

GitHub synchronization remains separate: the integration previously rejected writes with 403. Local commits are available for an authorised push; use the clean source transfer pack for handover rather than historical patches containing legacy credentials.

## Repeat checks

Run `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run verify:typeforms`, `npm run build` and `npm run check:pdf-assets`. Run `npm run test:e2e`, `npm run test:email-flow`, `npm run test:responsive` and `npm run test:webkit` sequentially; they share port 3008. Install the browser with `npx playwright install webkit` if needed. Routine suites use fictional fixtures and captured mail; live recipient tests are separate.

Existing deployments must receive the compatible validated server action and a server key before the write-RPC restriction. Do not roll back to a public-key submission writer after applying this migration.

Earlier work: [form audit](all-form-audit.md), [logic audit](logic-audit.md), [client journey](journey-polish.md), [white labelling](white-label-readiness.md), [adviser UI](adviser-ui.md), [login examples](design/README.md).
