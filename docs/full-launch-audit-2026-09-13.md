# FactFind Pro — full test and issue report
**13 September 2026 · completed at approximately 21:32 BST**

**Release decision: hold public launch until the validation bypass and registration-document gap are resolved.** The ordinary individual-adviser journey works in the tested build. Additional adversarial and failure checks found defects that the existing green test suite does not cover. Shared firm access is not implemented.

This audit reports findings; it does not apply application fixes, change delivery preferences for existing advisers, or promote a deployment.

## Scope and environments

The story tested was registration → pending approval → admin approval → adviser onboarding → branded client links → conditional form completion → saved answers → adviser dashboard → protected PDF → automatic and manual emails.

- Source: branch `codex/client-journey-polish`, HEAD `8137b00`; application code `0c6ee57`.
- Fresh local production build on port 3010 connected to real FactFind Pro V2 Supabase and Resend.
- Isolated production preview on port 3008 used fictional database fixtures and captured mail for repeatable browser/error tests.
- Review deployment: [current candidate](https://fact-find-h1wt5uygz-terry-blackburns-projects.vercel.app/login), `dpl_ANrxgDeWNFUfDC2nj1ggcRDdqHmZ`, Ready.
- The main [public site](https://fact-find-pro.vercel.app) still serves `dpl_3ozrzimhNDDJKUD59ThcPBfuVuyy` from 9 September. The latest improvements have not been promoted there.

## Confirmed defects

| ID | Priority | Finding and evidence | Recommended correction |
|---|---|---|---|
| F01 | **P1 — before launch** | **Anonymous database submissions bypass application validation.** Executing the exposed `submit_factfind` RPC as `anon` accepted a Medical submission whose entire answer payload was `{}`: no form answers or consent. A fictional fixture was used and the transaction rolled back. The normal Next.js action validates answers, but that action is not the only reachable write path. Direct RPC writes also bypass its email scheduling. | Make every accepted write pass authoritative schema/consent validation. Either restrict the write RPC to a validated server boundary, or enforce equivalent checks at the database boundary. Preserve active-link ownership checks and add regression coverage for direct calls. Ensure every accepted write enters the notification process. |
| F02 | **P1 — before launch** | **Signup requires agreement to documents users cannot open.** The checkbox names terms of use and a privacy policy, but there are no corresponding links in the signup page. Browser reproduction confirmed zero matching document links. | Supply and link the actual approved documents before requiring agreement. This is a product finding, not an assessment of the legal wording. |
| F03 | P2 | **Team setup promises access it does not create.** Adding a fictional colleague succeeded, but only a `team_members` row with `linked_profile_id = null` was created. No account/profile was created. The screen says each colleague gets client links and shared delivery settings, and says team management is in Settings. The implementation is a roster captured in onboarding. | For individual-adviser launch, correct/remove these promises. For shared firm launch, implement invitations, account linking and explicit firm permissions before claiming team access. |
| F04 | P2 | **Admin company searches fail on commas.** A real fictional company named `FactFind Audit, 201441` appeared when searching `FactFind Audit`, but the exact company search returned PostgREST `PGRST100` and the UI displayed “No users found”. | Quote/escape the filter values using the approach already used by submission searches; display query failures distinctly. |
| F05 | P2 | **Admin database failures look like an empty platform.** Injecting a submission-read failure changed a known total of 14 to 0 and displayed “No submissions yet”. Adviser dashboard error handling already behaves more honestly. | Preserve unavailable/error states for admin statistics, registrations and activity, with retry controls. |
| F06 | P2 | **Approval claims successful notification even when mail fails.** The actual approval action was executed with stubbed external services. Failed Resend, disabled-template and log-only results all returned “Adviser approved and notified.” No real failure email was sent for this reproduction. | Inspect the mail result and distinguish “approved” from “email accepted”, “email disabled”, and “email failed”; offer an appropriate retry. |

P1 means resolve before unrestricted public launch. P2 means a confirmed functional or misleading-UI defect to correct; shared-team launch specifically depends on F03.

### Source locations

- F01: [public write RPC](C:/Users/Dan/Desktop/Fact-Find-Pro/supabase/setup.sql:460), [validated web action](C:/Users/Dan/Desktop/Fact-Find-Pro/src/app/f/actions.ts:38), [notification scheduling](C:/Users/Dan/Desktop/Fact-Find-Pro/src/app/f/actions.ts:90). Reproduction: `rpc-validation-repro.sql` in the evidence pack.
- F02: [signup agreement](C:/Users/Dan/Desktop/Fact-Find-Pro/src/app/(auth)/signup/signup-form.tsx:133).
- F03: [team promises](C:/Users/Dan/Desktop/Fact-Find-Pro/src/components/onboarding/team-step.tsx:55), [roster-only database design](C:/Users/Dan/Desktop/Fact-Find-Pro/supabase/setup.sql:845).
- F04: [unquoted admin search](C:/Users/Dan/Desktop/Fact-Find-Pro/src/app/(dashboard)/admin/users/page.tsx:45).
- F05: [admin counts default to zero](C:/Users/Dan/Desktop/Fact-Find-Pro/src/lib/queries.ts:68), [recent results default to empty](C:/Users/Dan/Desktop/Fact-Find-Pro/src/app/(dashboard)/admin/page.tsx:38).
- F06: [ignored email outcomes](C:/Users/Dan/Desktop/Fact-Find-Pro/src/app/(dashboard)/admin/actions.ts:71).

## Verification results

| Check | Result |
|---|---|
| Production build, TypeScript and lint | Passed. |
| Production dependency audit | Zero reported vulnerabilities from `npm audit --omit=dev` at audit time. |
| PDF deployment files | 34 assets present across all five PDF-producing routes. |
| Unit tests | 51 passed. |
| Desktop/mobile browser suite | 58 passed, using Chromium. |
| Captured-mail integration suite | 19 passed, including full completion of all four forms and provider failure/retry cases. |
| Responsive/white-label suite | 15 passed across small Android, iPhone-size, iPad portrait/landscape and desktop configurations, all using Chromium. |
| Existing suite total | **143 passed**. This does not include the additional defect reproductions above. |
| Typeform comparison | 400 source questions accounted for; **49,937 answered gate combinations** passed against the imports with their documented corrections. |
| Real database access test | Passed in a rollback transaction: pending registration, four links on approval, public form resolution, adviser ownership, anonymous read denial, role-escalation denial and inactive-link rejection. |
| Fresh live registration | Passed: UI signup → pending/no links → admin approval → four links → ordinary email/password sign-in → onboarding → own dashboard. |
| Additional live adviser checks | Workflow status changes persisted after reload. All four admin sections redirected the adviser to their own dashboard. |
| Review deployment smoke checks | Login and all four real adviser form pages returned 200 with the expected branding/start control; unauthenticated dashboard returned 307. |

The admin comma-search reproduction is explicitly marked as an expected failure in its test script. Its runner reports a successful reproduction; this does **not** mean that search functionality passed.

### Conditional logic

- **Mortgage:** adviser completion, joint applicants, second income/sick pay, dependants, CCJ/bankruptcy combinations, purchase/remortgage and buy-to-let counts; changed gates remove hidden stale answers. Adviser-only notes are excluded from client copies.
- **Protection:** client and adviser paths, joint/single applicant gates and internal-note privacy.
- **Medical:** smoking/Covid Yes→No changes remove discarded details; family/deceased-parent, condition and medication details follow the imported rules. No travel still reaches GP questions under the documented correction.
- **Home:** all questions completed; review edits persist. This source form has a fixed sequence, not extra conditional follow-up sections.
- Medical and Home do not contain the adviser/client selector or internal-note sections present in Mortgage/Protection. Signed-in adviser completion and anonymous client completion were tested; these do not introduce an additional authorship field.

## Real emails and PDF evidence

Fresh fictional adviser `Launch Test Adviser 201441` completed Medical **FF-001010** and Home **FF-001011**.

| Message | Received in Gmail, BST |
|---|---|
| Admin registration notification | 21:14:44 |
| Adviser approval email | 21:14:47 |
| Medical automatic adviser email with PDF | 21:14:59 |
| Medical manual client PDF | 21:15:01 |
| Home automatic adviser and client PDFs | 21:15:05 |

Medical started with adviser copy **on**, client copy **off**. The automatic client email was correctly skipped, and the adviser sent it manually. Client copy was then enabled for the fictional adviser before Home completion; both automatic emails arrived.

All four PDF attachments were downloaded from the actual received messages. Their extracted content matches the corresponding protected downloads after ignoring the generated-at minute. Medical is three pages, Home two. The firm name is correct; client replies target the test adviser's email. Discarded answers stay absent and the edited Home cover value remains £475,000.

Separately, all **eight detailed captured PDFs** passed answer-preservation, page-number, branding, text-overlap, margin and orphan-heading checks: 713 answer entries across client/adviser versions. **Six additional automatic/manual PDF copies** passed internal-note privacy checks. Representative rendered pages were visually inspected.

## Authentication and environment boundaries

- Both recovery requests reached the approved inbox through the configured SMTP provider.
- **Public-site recovery passed through the received link to the “Choose a new password” screen** at `fact-find-pro.vercel.app/reset-password`.
- The first request, initiated on localhost:3010, fell back to the team deployment address and reached Vercel authentication instead. The callback allowlist/site configuration needs to include the exact test origin for that local workflow. This is not evidence that the public-site recovery link is broken.
- No password was changed in this audit. Final password submission, subsequent login with the new password, link replay and cross-device recovery remain unverified.
- The pulled current Vercel production environment has an empty `NEXT_PUBLIC_APP_URL`; the running public deployment still generated a correct public callback. Confirm the canonical URL explicitly for the next release rather than inferring its built value from current settings.
- Supabase's security advisor reports leaked-password protection disabled. Review and enable it if supported by the project plan: [Supabase password security](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
- The advisor also flags four public security-definer helpers. Public form resolution/submission are intentional capabilities; the validation defect in F01 is a concrete issue. The warnings alone do not establish access to other advisers' records.

## Remaining product and reliability limits

- **No shared firm dashboard or client dashboard.** Adviser accounts are individual; clients use public forms and optional PDF email copies.
- **No durable email queue.** Submission notification work runs after the response with bounded provider retries. A prolonged provider outage or interrupted runtime can leave a saved submission without its requested email; logs and manual client resend do not provide automatic eventual delivery.
- **No secure draft resume or offline completion.** Unfinished answers live in the current tab; a warning on leaving does not recover a closed/lost tab.
- The detailed delivery controls label CRM/Zapier as coming soon, but the welcome checklist still suggests direct CRM delivery. The webhook integration is not implemented.
- Physical iPhone/iPad Safari, WebKit and Firefox were not exercised. Device dimensions were emulated in Chromium; this does not prove native browser or soft-keyboard behaviour.
- Load/concurrency testing, independent penetration testing, disaster recovery, destructive account removal and every optional administrative transition are outside this run.
- Current review protection/public-domain promotion and GitHub synchronization still need to be resolved as part of release.

## Cleanup and next steps

Both fictional submissions were archived; the temporary adviser was suspended, its four links disabled, and its sessions revoked. The temporary team row was removed. Both tested inactive form URLs returned 404. Transactional database fixtures were rolled back. Terry's delivery settings remain adviser PDF **on**, client PDF **off**. No real client records were changed.

1. Close F01 and link the actual registration documents.
2. Correct F03–F06 and add their reproductions to permanent regression coverage.
3. Choose whether launch is individual-adviser only or includes shared firm access.
4. Verify release URLs, password changes and physical Safari; rerun affected checks after fixes.
5. Promote the corrected, verified build to the primary public domain.

[Open the evidence pack](C:/Users/Dan/Desktop/FactFind-Pro-Launch-Review/Full-Audit-13-Sep-2026/Report.md). It includes screenshots, logs, SQL reproduction, PDF checks and received PDFs. Credentials, session cookies, recovery links and environment values are excluded.
