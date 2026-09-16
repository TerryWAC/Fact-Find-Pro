# FactFind Pro — source and findings handover

Prepared 15 September 2026 for review in Claude or transfer to Git. This is a source export, not a database backup or an ownership transfer. Findings below consolidate the repository's dated evidence; exporting does not rerun every browser, provider or live-database check.

## Release being handed over

- Latest application change: `d820045`, individual question cards and accessible 3D question/follow-up entrances. The final application changes were built, tested and deployed on 14 September.
- Application plus the release verification record before this handover: `80d7454cc559a96cb6deb6a66dbeca8b54e7ee40`.
- The export manifest identifies the exact later source commit, including these handover documents. It does not imply a new application deployment.
- Last verified production deployment: `dpl_8zTh4228WMxKPBMdwmafmBvssjWS`, aliased to [fact-find-pro.vercel.app](https://fact-find-pro.vercel.app/login).
- Original repository: `TerryWAC/Fact-Find-Pro`; local branch: `codex/client-journey-polish`. GitHub writes previously failed with access errors. This export does not claim the remote branch is current.
- Stack: Next.js 15.5.25, React 19, TypeScript, Tailwind, Supabase, Resend, React PDF and Sharp. Exact dependency versions are pinned by `package-lock.json`.

## What is implemented

Clients open an adviser's branded link without creating a client account. They complete conditional sections, review/edit answers and submit. Approved advisers have individual dashboards, links, submission details and PDF downloads. Admins have registration/user management, submission access, email templates and a privately prepared existing-adviser directory.

Adviser branding includes firm identity, logo/photo, colours and optional practice/contact information. The guided onboarding explains the product, branding and delivery preferences. Client pages, emails and PDFs use the relevant adviser identity. The online home-screen app is installable but is not an App Store binary.

The server rebuilds canonical submission data from allowed visible answers, validates dates/numbers/choices, and resolves ownership from the active approved adviser's link. Client PDF copies remove internal sections. Automatic copies follow each adviser's preference; a manual client-PDF action is also available. Email has bounded retries and logs, not a durable queue.

## Questionnaire fidelity and business rules

| Form | Original questions | App questions | Sections | Answered gate combinations checked |
| --- | ---: | ---: | ---: | ---: |
| Mortgage | 219 | 219 | 13 | 768 |
| Protection | 104 | 104 | 12 | 16 |
| Medical | 47 | 48 | 7 | 49,152 |
| Home | 30 | 30 | 5 | 1 |
| Total | 400 | 401 | 37 | 49,937 |

Source definitions were captured from the four published Typeform pages on 13 September. They include questions and rules, not responses. `npm run verify:typeforms` compares them with the actual application visibility functions. This is a fixed reference, not an automatic live sync.

The owner explicitly chose to preserve the wording and the established corrections:

- Adviser Details, Client Source and Admin Notes appear for adviser-completed Mortgage/Protection cases; client PDF copies exclude them. Medical and Home keep their original absence of an adviser/client selector.
- Applicant 2 details/employment/sick pay follow joint=Yes; dependants follow dependants=Yes. Changing a gate removes stale hidden values from review and submission.
- CCJ and bankruptcy are independent; No to CCJ must not skip the bankruptcy question.
- Purchase/remortgage uses the relevant block. Background BTL remains available for either purpose; the chosen count controls the 1–3 property blocks.
- Medical Yes answers reveal their corresponding follow-ups. Parent-death details appear only for No/One Deceased. GP information stays reachable after No to overseas travel.
- The will-consequences question follows No to having a will.
- All 16 original required flags remain. The app additionally requires client identity/name/email, including the Medical email question absent from the source. Other optional questions remain optional; blank is not No.
- Small label repairs remain documented: employment dropdown title, property tenure labels, removed outline prefixes and consent choices folded into labels. Introductory old-adviser copy is replaced by the owning adviser branding.

See `docs/factfind-question-catalogue.md` for a readable export of every app question, its source ref, options and visibility rules. The authoritative app JSON remains under `src/lib/forms/schemas/`.

## Bugs found and repaired in prior work

| Finding | Implemented repair | Evidence |
| --- | --- | --- |
| Client email PDFs could contain internal adviser notes | Separate client-audience projection for automatic and manual copies, including legacy formats | `docs/logic-audit.md`; audience unit cases and dated PDF/email integration evidence |
| Hidden/forged submitted answers and direct write-RPC access | Validate and rebuild on the server; restrict write RPC to the service role; preserve ownership and approval gates | `tests/unit/prepare-submission.spec.ts`; `supabase/tests/readiness.sql` |
| Typeform jumps skipped bankruptcy, BTL or GP questions and showed inappropriate details | Explicitly documented corrected visibility conditions | `tests/fixtures/typeform/README.md`; source reconciliation and routing tests |
| Validation-summary links moved when blur cleared errors | Keep validation ownership in the schema engine | `docs/logic-audit.md` |
| A fast tap could miss a checkbox when animation cancellation moved it | Pause question motion through pointer-down/up and settle after click; preserve focus and reduced motion | `docs/question-motion-2026-09-14.md` |
| Re-running setup could conflict with changed function result columns | Drop/recreate the affected function appropriately; consistent combined SQL generation | `supabase/setup.sql`; setup history in the dated reports |
| Windows archive line endings could invalidate source checksums | Export exact Git blob bytes; verify every file | `scripts/create-transfer-pack.mjs`; transfer packaging tests |

These are repaired findings, not an assertion that there are no remaining defects.

## Evidence and its date

| Evidence | Date and scope |
| --- | --- |
| 400 original questions / 49,937 gate combinations; 59 unit cases; lint/types/build/PDF assets | Passed on the 14 September question-motion release |
| Four fictional browser submissions: Home, Medical, Mortgage, Protection | Passed on 14 September against the isolated in-memory backend; no external mail |
| 320/390/768/1440px layouts, both themes, keyboard focus, rapid consent checks, reduced motion | Checked on 14 September in Chromium; not physical-device certification |
| Live four-form GETs, anonymous dashboard/admin redirects, Home question cards | Passed on the 14 September deployed release; no hosted client answers entered |
| Earlier full Chromium, WebKit and captured-email/PDF suites | Dated 13 September; see `docs/final-launch-check-2026-09-13.md` for actual counts and scope |
| Approved live PDF email receipts and password-recovery journey | Earlier 13 September evidence in `docs/launch-fixes-2026-09-13.md`; not rerun under the later no-email instruction |
| Real database regression, authenticated page reads and prepared-account guards | Passed again on 14 September, with fictional database test fixtures rolled back |

The 15 September export has its own package-integrity verification. Read `EXPORT-VALIDATION.md` beside the archive for checks rerun during packaging; do not substitute its counts for the earlier live test evidence.

## Remaining work, in priority order

1. **Secure imported-adviser activation is not implemented.** At the last check, 135 accounts and 540 form links were dormant; 179 response decisions and 264 private inspection images were retained. Build and test verified, expiring, single-use activation, adviser review/consent and guarded release. Keep 6 held responses unresolved until identity review. Do not unban/approve accounts or email invites as a shortcut.
2. **Verify data recovery before an actual infrastructure migration.** Rehearse database and Auth restore plus a separate copy/verification of actual Storage objects. The last inspected backup predated the latest preparation changes. `setup.sql` is schema, not a backup. No live records or private images are in this export.
3. **Test new registration email confirmation when authorised.** Confirm email was enabled on 14 September; a fresh hosted confirmation-email journey was not sent afterwards because the owner prohibited emails. Keep authentication SMTP separate from app Resend configuration.
4. **Restore GitHub access and reconcile release history.** Do not assume the original remote is up to date, force-push this history-free export, or publish old patches/history that contain legacy demo credentials. Use a new private repository or a reviewed branch in the original repository.
5. **Finish operational and policy ownership.** Confirm who monitors support, real adviser business phone/website, backup ownership, failed-mail handling and the outstanding controller/processor policy review. The owner chose retention until deletion is requested, not a 90-day purge.
6. **Plan additional features and assurance separately.** Secure drafts/resume, offline completion, a durable email queue, shared-firm/client dashboards, actual CRM/webhook/spreadsheet delivery and a native iPhone app are not implemented. Physical-device, load and independent security testing remain outstanding. Historical client submissions and legacy Typeform URLs have not been migrated.

## Run locally and review

Use Node.js 22 or 24, npm and Python 3. From the extracted `FactFind-Pro` folder:

```sh
npm ci
npm run preview:client
```

Open `http://localhost:3008/f/home/violet` or `/login`. The mock-only accounts are `adviser@example.test` and `admin@example.test`, password `PreviewOnly!`. These work only in the isolated preview. Real credentials are intentionally excluded.

For code checks use the README commands. Browser suites share ports and must run sequentially; follow your current agent environment's browser-control policy. Do not connect to production just to review the source. Read `CLAUDE.md` and use `docs/claude-review-prompt.md` for a structured review.

## Put the export in Git

For a new private repository, extract the app folder, inspect the included files, then initialise a new local Git history and commit it. The ZIP includes `.gitignore`, `.github/workflows/checks.yml`, the lockfile, migrations, tests and documentation; it does not include `.git` or remote credentials. Add your chosen authenticated remote and push through your normal Git workflow. No new repository or push is performed by this export.

To continue `TerryWAC/Fact-Find-Pro`, first restore authorised access and work on a review branch in a clone of that repository. Compare the manifest/source commit with its current branches and copy/reconcile changes deliberately. Do not replace `.git`, overwrite newer work or force-push unrelated history. Audit historical credentials before sharing the original history.

## Source map

- `src/app`: login/registration/onboarding, dashboards/admin, public forms and server actions.
- `src/components/forms`: renderer, progress, review, question cards and motion.
- `src/lib/forms`: executable schemas, visibility/validation engine and server preparation.
- `src/lib/email`, `src/lib/pdf`: branded delivery and audience-specific PDFs.
- `supabase/migrations`, `supabase/setup.sql`, `supabase/tests`: schema, permissions and regression SQL.
- `tests/fixtures/typeform`: original public definitions, provenance hashes and allowed corrections.
- `tests/unit`, `tests/e2e`, other test configurations: fictional validation and browser/provider integration coverage.
- `scripts`: import preparation, controlled provisioning, source comparison and transfer packaging.

No live service state was changed, no emails were sent, and no client records, private adviser import files, API keys or Git history were exported during this handover.
