# Launch audit fixes — 13 September 2026

Application commits: `9fc12d6` and PDF follow-up `30cd57b`. The repaired application is live at [fact-find-pro.vercel.app](https://fact-find-pro.vercel.app/login). This report follows the [original audit](full-launch-audit-2026-09-13.md); that earlier document remains a record of the defects before this repair.

## Changes

| Finding | Resolution |
|---|---|
| F01 — direct public submissions bypass validation | The Next server action validates against the trusted Typeform-derived schema before using the server key. Migration `20260913211513` removes `PUBLIC`, `anon` and `authenticated` execution of the write RPC. The RPC retains link ownership and active-adviser checks. The public resolver remains available. |
| F02 — inaccessible registration documents | Signup links to readable Terms of Use and Privacy Notice pages in separate tabs, preserving entered registration details. These are newly prepared platform-specific documents, not legally approved wording; the business must review them. The existing club policy expressly excludes financial/sensitive information and is unsuitable for these forms. |
| F03 — misleading team promises | Onboarding and Settings describe a colleague directory. Entries do not create logins, shared records or client links. Each adviser registers and receives approval separately. Uploading a colleague photo no longer overwrites the adviser's own photo. |
| F04 — comma searches | Admin searches quote PostgREST values, preserve literal punctuation and recover stale pagination. Query failures display retry states. |
| F05 — false empty admin dashboard | Failed totals show unavailable values rather than zero; failed registrations, submissions and activity show explicit retry controls. |
| F06 — false approval-email success | Approval/rejection distinguish provider acceptance, failed delivery attempts, disabled templates and log-only mode. Approved advisers have a separate approval-email retry action. |

Additional fixes: mobile approval/rejection controls now have accessible names; onboarding reports failed completion writes; password recovery remains reachable before onboarding is complete; controlled login fields wait for hydration so early typing cannot disappear. A regression test deliberately delays JavaScript to exercise the login timing problem found in WebKit.

The final visual inspection found a Medical PDF heading at the bottom of a page without its answers. PDF sections now keep their heading with the first complete answer row; very long answers can still span pages. The exact failing sample and all eight detailed PDFs were rechecked after this repair, preserving all body content.

## Typeform fidelity

No form-schema files were changed. All **400 original questions** and **49,937 answered gate combinations** remain accounted for against the checked-in published Typeform exports and their documented import corrections.

- Mortgage/Protection: client/adviser completion, joint/single applicant gates, second-applicant income and sick pay, adviser-note visibility, and client-copy note exclusion.
- Mortgage: property routes, dependants, CCJ/bankruptcy combinations and removal of hidden answers after changes.
- Medical: smoking/Covid reversals, family/deceased-parent details, condition/medication branches and the documented GP-route correction.
- Home: the source has a fixed sequence. It has not been given invented conditional follow-up questions.
- Medical/Home do not have the adviser/client selector or internal-note sections found in the other two source forms. A signed-in adviser can still complete them for a client.

## Verification

- TypeScript, ESLint and production build passed; 34 PDF assets verified across five producing routes.
- Production dependency audit reported zero vulnerabilities at the time of this run.
- 53 unit cases passed.
- Chromium core suite: 68 existing/new cases covered, with affected admin/login cases rerun after fixes; two additional delayed-hydration cases pass.
- 22 captured-email cases passed, including all four detailed forms, preference combinations, provider failure/retry, disabled mail, manual sends and separate client/adviser PDF audiences.
- 15 responsive cases passed at small Android, iPhone, iPad portrait/landscape and desktop dimensions.
- **70 WebKit desktop/iPhone cases passed**, comprising the 68 successful cases from the full run and two corrected keyboard-focus cases rerun successfully. The corresponding Chromium review cases also passed.
- The database permission change and ownership regression script passed together inside a rollback transaction before release, then passed again after applying the migration to production.
- Real HTTP RPC requests using both anonymous and authenticated credentials now return permission error `42501`; the service role retains execution permission.
- After the PDF repair, all 22 email cases passed again. Eight detailed PDFs preserve all 713 answer entries with no overlaps, margin overflow or orphan headings; six automatic/manual copies retain the correct internal-note privacy.

WebKit exposed an incorrect test assumption that clicking a button always focuses it. The review test now activates the disclosure with the keyboard and checks that its focus remains, matching the intended accessibility behaviour.

## Real service evidence

Fresh local production tests used real Supabase and Resend. A fictional adviser registered, remained pending without links, received admin approval, completed onboarding and reached their own dashboard. Medical **FF-001015** was completed by that signed-in adviser; Home **FF-001016** was completed anonymously at phone dimensions.

Medical automatic adviser mail, manual client mail, and both automatic Home copies reached the approved Gmail inbox with the expected firm branding and PDF filenames. Medical started with client automatic copy off; the manual send was explicit. Home used client copy on for the fictional account only. PDF sizes were 26,517 bytes for Medical and 22,170 bytes for Home. These are inbox receipts, not just provider acceptance logs.

The local-test account was suspended, all four links disabled, both submissions archived and sessions revoked. Its two public forms returned 404. Terry's real preferences remain adviser PDF on and automatic client PDF off.

## Release status

The initial repair `9fc12d6` was promoted before applying migration `20260913211513_restrict_factfind_writes_to_validated_server.sql`. Vercel then deployed PDF follow-up `30cd57b` as [the final release](https://fact-find-l2zytarrd-terry-blackburns-projects.vercel.app), deployment `dpl_9vkJzCavxCMMXNMZpeDWmNc5Wrff`, Ready and aliased to **https://fact-find-pro.vercel.app**. No manual SQL step is left for the user.

The public-site test registered a new fictional adviser through signup. The run resumed that pending account after the initial five-second assertion expired during registration. It verified the pending sign-in message, blocked dashboard access and absence of links, then found the company using a comma-containing search, approved the adviser, completed onboarding and reached the dashboard. Medical **FF-001019** and Home **FF-001020** saved through the newly restricted server path; both protected downloads passed, and an anonymous PDF request redirected to login.

All four requested public-site PDF messages reached Gmail. Downloaded client attachments matched the protected downloads, ignoring the generated-at minute: Medical three pages, Home two. The later PDF-only fix passed the exact same content comparison and removed the orphaned heading. Corrected hosted copies were downloaded and resent through the admin interface without reactivating the test adviser. The revised Medical and Home client emails arrived at 22:31:02 and 22:31:08 BST, respectively; both received attachments match their corrected hosted downloads and have no orphaned headings.

Public-site password recovery passed using this fictional account: the actual emailed link opened `/reset-password`, changing the test password succeeded, a fresh login reached the dashboard, and replaying the used link in a new browser was rejected. Terry's password was not changed. First-use cross-device recovery remains outside this test.

Both hosted submissions are archived; the fictional adviser is suspended, all four links are disabled and its sessions were revoked. Real adviser delivery preferences remain unchanged. Temporary admin test sessions were revoked separately.

Production `NEXT_PUBLIC_APP_URL` was explicitly set to `https://fact-find-pro.vercel.app`. Vercel stores it and the service credentials as sensitive variables, so downloaded environment files omit their values; an empty downloaded value is not evidence of an empty deployed secret.

Deploy the compatible server action before applying the permission migration. Rolling back to an older public-key writer after the migration would prevent submissions. Do not undo the restriction as an ordinary rollback: retain the validated write boundary.

## Product boundaries and business follow-up

- Review the new terms/privacy wording, operator identity, lawful-basis information and retention arrangements before relying on these documents for unrestricted launch. This work is not a legal-compliance certification.
- This is an individual-adviser platform. There is no shared firm or client dashboard; clients receive their form and optional emailed PDF.
- Notifications run after the response with bounded retries, not a durable queue. Extended provider/runtime failures still need operational follow-up. Provider acceptance is not a delivery guarantee.
- Draft resume, offline completion and CRM/webhook delivery are not implemented. The app can be installed as a home-screen web app; it is not an App Store native iPhone app.
- Physical iPhone/iPad keyboards, Firefox, load testing and independent penetration testing are outside this run.
- Supabase previously reported leaked-password protection disabled; enabling it depends on project support/configuration and remains an account setting to review.
- GitHub synchronization is separate from the Vercel release. The installed GitHub integration previously returned 403 for writes; the local commits and combined patch are the source handoff.

## Repeatable checks

Run `npm run test:unit`, `npm run verify:typeforms`, `npm run build`, `npm run check:pdf-assets`, and `npm run test:e2e`. Then run `npm run test:email-flow`, `npm run test:responsive` and `npm run test:webkit` sequentially because they share preview port 3008. Install WebKit with `npx playwright install webkit` first if needed. These suites use isolated fictional data/captured mail; real recipient tests remain explicitly separate.

