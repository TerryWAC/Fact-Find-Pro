# FactFind Pro

Branded Mortgage, Protection, Medical and Home fact finds for UK advisers. Clients use their adviser's link without an account; approved advisers review submissions in their dashboard and download PDFs. Admins manage registrations, templates and the privately prepared existing-adviser directory.

Start with [Launch and transfer](docs/transfer-and-launch.md) for the current release, ownership handover and the limits on existing-adviser activation. [Readiness](docs/readiness.md) links to the evidence and known limitations.

For a Claude or Git handover, read [the consolidated findings](docs/handover-findings-2026-09-15.md), [review prompt](docs/claude-review-prompt.md) and [complete question catalogue](docs/factfind-question-catalogue.md). `CLAUDE.md` records the owner's decisions for the next maintainer.

## Run a safe local demonstration

Prerequisites: Node.js 22 or 24, npm and Git. Python 3 is used to rebuild the combined SQL file and verify transfer packages.

```sh
npm ci
npm run preview:client
```

Open `http://localhost:3008/login` or `http://localhost:3008/f/home/violet`.

The isolated preview uses fictional accounts `adviser@example.test` and `admin@example.test`, with the mock-only password `PreviewOnly!`. It keeps data in memory, uses a local Supabase substitute on port 45439, and disables real provider keys. No production credentials or hosted database are required. Restarting clears the mock data. Never use the explicitly separate `--live-email-test` mode without an approved recipient and permission to send.

## Develop against a dedicated Supabase project

1. Copy `.env.example` to ignored `.env.local` and enter the development project's keys. Keep the Resend key blank unless a live test is specifically authorised.
2. Apply `supabase/setup.sql` to a **new development project**, or use the timestamped migrations through the Supabase CLI after checking its migration history.
3. Configure the Auth site URL and callback allowlist for the development origin; enable email verification for hosted use.
4. Run `npm run dev` and open `http://localhost:3000`.

Use the app's registration and approval process. The allowlist migration names the current operator as bootstrap admin; review that identity before installing this code for a different operator. The legacy `create-test-user.sql` and `seed.sql` now perform no account/password writes. Never reset or seed a hosted production project to prepare a handover.

For the existing production project, keep the current database and storage. `setup.sql` creates schema and policies; it is **not a backup of accounts, submissions, images or settings**. Check remote migration history before running `supabase db push`: some older migrations were originally applied through the SQL editor.

## Configuration

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Public project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser/public Data API key |
| `SUPABASE_SECRET_KEY` or `SUPABASE_SERVICE_ROLE_KEY` | Server-only validated submission writes, delivery and admin operations |
| `NEXT_PUBLIC_APP_URL` | Canonical app origin used in client and email links |
| `RESEND_API_KEY`, `EMAIL_FROM` | App email provider and verified sending identity |
| `EMAIL_REPLY_TO` | Optional platform reply address |
| `ADMIN_NOTIFICATION_EMAIL` | Optional registration-alert recipients; defaults to approved admins |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Displayed support contact |

Supabase authentication SMTP is configured separately from app email. Preserve its sender, SMTP credentials, templates, redirect URLs and security settings during transfer. Never put server keys in `NEXT_PUBLIC_*` variables or in the archive. [Email setup](docs/email-setup.md) describes the delivery paths.

## Validate a release

```sh
npm run lint
npm run typecheck
npm run test:unit
npm run test:adviser-import
npm run test:transfer
npm run verify:typeforms
python scripts/build-setup-sql.py --check
npm run build
npm run check:pdf-assets
npm audit --omit=dev --audit-level=high
```

The browser suites use an isolated mock and captured mail. Run them sequentially because they share ports 3008 and 45439: `test:e2e`, `test:email-flow`, `test:responsive`, `test:webkit`. Install the required Playwright browsers on the CI/development machine. Use the current browser-control policy when running tests through an agent.

GitHub Actions covers pull requests, main/master, the current `codex/**` branches and the legacy development branch. The workflow can also be started manually. A local pass is not evidence that GitHub Actions ran; the repository still needs an authorised push.

After changing a migration, regenerate the combined SQL with `python scripts/build-setup-sql.py`. CI checks it against all 11 migration files.

## Prepare a source handover

Commit the intended release and ensure the working tree is clean, then:

```sh
npm run pack:transfer -- /absolute/path/to/new-release-folder
python scripts/verify-transfer-pack.py /absolute/path/to/new-release-folder --extract /absolute/path/to/new-checkout-folder
```

The output includes a source ZIP, a commit/file/checksum manifest and a start guide. It excludes Git history, ignored credentials, private import records and hosted data. Packaging refuses tracked private files and detects configured secrets and common private-key patterns; this is not an independent security audit. Keep private export/backup material separate and grant access only to the agreed recipient.

## Product scope

The Typeform-derived logic, documented source corrections, adviser-only note handling and delivery preferences remain in force. Medical and Home retain their original lack of an adviser/client selector. Branded contact details and practice descriptions are adviser-authored; entering a website does not crawl or import its content.

The installable home-screen web app works online. Persistent drafts, cross-device resume, offline completion, shared-firm/client dashboards, CRM/spreadsheet delivery and an App Store binary are not implemented. Email has retries and logs, but no durable delivery queue. The dashboard is the submission record.

Existing-adviser preparation is complete; activation is not released. Historical client submissions and legacy Typeform URLs have not been migrated. See [Existing advisers](docs/existing-adviser-migration.md).

## Code map

- `src/app`: authentication, adviser/admin pages, public forms and server actions.
- `src/lib/forms`: schemas, conditional logic and validated submission preparation.
- `src/lib/email`, `src/lib/pdf`: branded delivery, PDF generation and audience privacy.
- `supabase/migrations`: schema, row policies, server-only writes and import guards.
- `scripts`: Typeform verification, offline import preparation and release tooling.
- `tests`: fictional fixtures, unit, integration, browser and database regression tests.

Further detail: [Logic audit](docs/logic-audit.md), [Onboarding](docs/adviser-onboarding.md), [Policy review](docs/supplied-policy-review-2026-09-13.md).
