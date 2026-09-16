# FactFind Pro — launch and transfer guide

Prepared 14 September 2026; release reference updated for the 15 September source export. This guide concerns the existing FactFind Pro service. A source archive is ready for handover after its checks pass; ownership transfer, adviser invitations and a database restore are separate actions. For the Claude/Git export, start with [the consolidated findings](handover-findings-2026-09-15.md).

## Current position

| Area | Status |
| --- | --- |
| Hosted app | Live at https://fact-find-pro.vercel.app/login |
| Latest deployed application | Last verified 14 September: `d820045`, Vercel `dpl_8zTh4228WMxKPBMdwmafmBvssjWS` |
| Source handover | Use this package's `manifest.json` commit as the source version; it also contains the subsequent handover/tooling fixes |
| Existing advisers | 179 source responses reviewed; 135 dormant profiles with 540 inactive form links; 264 private inspection images |
| Existing-adviser activation | **Not released. Do not invite, unban or manually approve the prepared accounts** |
| GitHub | The repository exists, but the authorised write connection has not been restored; do not assume its default branch matches the live app |
| Email | App provider variables are configured; previous approved live receipts are recorded in the audit. This handover sends no email |
| New-registration verification | Supabase Confirm email enabled during the handover audit; a new live confirmation-email journey was not sent/tested |
| Data recovery | A full database/Auth/Storage restore rehearsal has not been performed during this handover |

The new setup, adviser/client forms, admin pages and PDF paths have technical test evidence. This is not an unconditional launch sign-off: review the specific remaining items below.

## Open the source on another computer

1. Copy the whole release folder to the agreed recipient. It contains `FactFind-Pro-source.zip`, `manifest.json`, `SHA256SUMS.txt` and this start guide.
2. Verify the archive SHA-256 against the manifest. With Python, run the included `scripts/verify-transfer-pack.py` after obtaining it from the trusted source checkout. The tool can verify every file and extract into a **new** folder.
3. Install Node.js 22 or 24, npm, Git and Python 3. Inside the extracted `FactFind-Pro` folder, run `npm ci`, then the validation commands in README.
4. Run `npm run preview:client` for a self-contained demonstration. No production key is required and the mock keeps emails disabled.
5. For development connected to a database, use a separate development Supabase project and fill `.env.local` from `.env.example`. Exchange keys through an agreed secret manager, separately from the source archive.

The archive intentionally has no Git history. Initialise a new Git repository if the recipient is starting a separate repository. To continue the original history, obtain authorised access to the original repository and reconcile this release before pushing. Earlier commits and the older combined Desktop patch contain legacy demo credentials; audit that history before sharing it. Removing these from the current source does not remove them from history. If any historical password was reused on a live account, the account owner must replace it through the normal password process.

## Easiest infrastructure handover: retain the existing projects

For a new developer, first grant the agreed minimum access to the existing services. A billing/ownership change should use the providers' project-transfer flows where suitable. Keeping the same projects avoids rebuilding the live database or recreating adviser identities. This is the recommended operating approach, based on the provider transfer capabilities below.

| Service | Existing resource | What the recipient needs |
| --- | --- | --- |
| GitHub | `TerryWAC/Fact-Find-Pro`; local release branch `codex/client-journey-polish` | Agreed repository role and an authorised push of the release |
| Vercel | `fact-find-pro`, project `prj_aDUbcefNRF4RZVN2PHuLZIUkw8h6`, team `terry-blackburns-projects` | Project/deployment access; billing ownership if changing operator |
| Supabase | `Fact Find Pro V2`, project `pnxujzatlhudbsplftxp` | Agreed project/organisation role, Auth, database, storage and backup access |
| Resend | Verified `factfindpro.com` sending domain | Team access, sender/domain settings and restricted sending key management |
| Domain/DNS and inboxes | `factfindpro.com`; Google MX observed | Registrar/DNS owner and mailbox administrator identified separately |
| Typeform | Existing Adviser Onboarding form `tldwHmoM` and legacy form workspace | Read access for reconciliation; no new bulk export or invitation emails |

GitHub repository transfer carries repository settings and associated integrations/secrets; review those permissions with the target owner. Transfers to another personal account require recipient acceptance and can send email, so none has been initiated under the current no-email instruction. [GitHub transfer documentation](https://docs.github.com/en/repositories/creating-and-managing-repositories/transferring-a-repository).

Vercel supports project transfer between teams and copies project environment variables, deployments and aliases. Integrations and log drains need separate attention. The source team owner must belong to the target team; transfer completion notifies participants by email. Review the provider's transfer screen with the named recipient before proceeding. [Vercel project transfer](https://vercel.com/docs/projects/transferring-projects).

Supabase project transfer changes the organisation, not the region. Its prerequisites include source ownership, target membership, and resolving active GitHub integration, project-scoped roles and log drains. Plan changes can affect service availability/features. Check these conditions for the actual destination; no organisation change has been made. [Supabase project transfer](https://supabase.com/docs/guides/platform/project-transfer).

Retain operator access until the recipient has signed in, confirmed the required permissions and passed the acceptance checks. Remove only access explicitly approved for removal. Do not share one operator login.

## Environment and email handover

Use the existing provider dashboards/secret manager. The source package contains variable names and placeholders only.

- Public app origin: `NEXT_PUBLIC_APP_URL` currently points to `https://fact-find-pro.vercel.app`.
- Supabase: public URL/key plus server-only secret/service key. The existing app accepts modern or legacy key names; README lists the supported names. Direct `POSTGRES_*` variables supplied by the integration are not used by this application, but may belong to other provider tooling.
- Application email: `RESEND_API_KEY`, `EMAIL_FROM`, optional `EMAIL_REPLY_TO`, and `ADMIN_NOTIFICATION_EMAIL`. The agreed client sending domain is FactFind's domain; display names/branding come from each adviser.
- Authentication email: Supabase custom SMTP is a separate configuration. Preserve sender, host, port, username, password, templates, confirmation and recovery behaviour.
- Update Auth site/callback URLs and rebuild when the app's origin or browser variables change. Existing adviser URLs must continue to work or have an explicitly tested redirect plan.
- Retain each adviser's delivery preference. Never enable automatic client copies merely because the account was imported.

Review settings in the destination without copying key values into tickets or the archive. A live mail test requires a named approved recipient and explicit permission; until then use the local capture tests. Provider acceptance alone is not proof of inbox delivery.

## If a new database or region is required

Treat this as a separate data migration, not a code deploy. First rehearse against an isolated destination with outgoing email disabled and compare counts, ownership and attachments before any cutover.

The recovery scope must include Auth identities, application tables, policies/functions, migration history, bucket settings and actual Storage objects. `supabase/setup.sql` creates schema; it does not copy those live records. Database backups contain Storage metadata, not the actual uploaded files; those need a separate controlled copy. [Supabase backup documentation](https://supabase.com/docs/guides/platform/backups).

The current migration-history table contains four recorded migrations. The first seven migrations were applied by SQL Editor and have no CLI history entries. Two later entries use provider-generated timestamps: `stage_existing_advisers` is recorded as `20260913233601` (source filename `20260913232741`), and `adviser_practice_contact` as `20260914004642` (source filename `20260914003747`). The other two recorded timestamps match the source. The live schema passes the regression tests, but a new maintainer must reconcile this history before using CLI push/pull against this existing project. Do not mark or reapply migrations merely by comparing filenames.

Follow the current [Supabase backup/restore guide](https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore), including its Auth/storage and migration-history considerations. Do not restore over the source, run `db reset` against production, or assume a successful SQL restore proves images, SMTP or login work. A new project may require new URLs/keys and updates to stored branding URLs.

Before cutover, record counts and a consistent backup timestamp, agree any write pause, and verify a real restore. Keep the original project recoverable until destination acceptance is complete. No private client-data dump has been made or included in this source handover.

The live dashboard lists seven daily physical backups, with the latest at **13 September 2026, 03:30:02 UTC** at this inspection. That backup predates the prepared-adviser and practice-contact changes. A current snapshot and separate Storage protection are required for a future migration; the presence of those older backups is not a completed restore test.

## Existing Typeform advisers

Admin → Existing advisers contains the complete reviewed directory, decisions, reserved links and private previews. All 179 response decisions remain accounted for: 135 selected, 6 held, 33 test/internal exclusions, 1 blank exclusion and 4 explicitly superseded responses.

Preparation is complete. Before this becomes an easy adviser migration, implement and test:

1. An admin-selected activation batch with explicit membership/identity review. Keep the 6 held responses held until resolved.
2. An individual expiring, single-use activation process bound to the existing prepared account and verified email identity. Repeated, expired, revoked and wrong-account links must fail safely.
3. Adviser confirmation of profile/branding, current terms/privacy information and delivery preferences. No shared passwords and no manufactured consent.
4. Guarded release of the dormant account and its four forms only after the activation requirements are satisfied. An ordinary adviser cannot clear `import_pending` or approve themselves.
5. Audit and revoke/retry controls, with a fictional end-to-end test before any approved invitation batch is sent.

Do not work around the guard by unbanning accounts or editing `import_pending` manually. Do not ask an imported adviser to register again with the same email: their dormant account already exists. Private inspection images require adviser confirmation before publication. Historical client submissions and 793 legacy Typeform forms/URLs are outside the completed profile preparation. [Detailed migration audit](existing-adviser-migration.md).

## Acceptance checks before an actual transfer or wider launch

| Check | Required evidence |
| --- | --- |
| Recipient | Named destination account/team, agreed access and billing responsibility |
| Source | Archive hashes verify; clean install, unit/import/transfer tests, typecheck, build and PDF asset check pass |
| Hosting | Production deployment Ready, correct app URL and all four active adviser form types load |
| Access | Anonymous dashboard/admin/PDF requests require login; adviser data remains isolated; prepared imports remain dormant |
| Data | Agreed backup/restore evidence including Auth and actual Storage objects, with matching counts |
| Email | Settings preserved; captured preference/error tests pass; a separately approved live recipient confirms receipt when sending is permitted |
| Adviser migration | Secure activation implemented/tested before invitations; current held identities resolved as needed |
| Operations | Support mailbox owner, real business website/phone, failed-email handling and backup responsibility assigned |
| Owner review | Outstanding policy/controller–processor review from the supplied-policy report completed; launch copy matches implemented features |

The owner's current phone is a sample value and is hidden from public call links; supply a real business number and website in Settings. Support mailbox monitoring has not been verified. The alternate Terry contact is retained.

No persistent drafts, offline completion, cross-device resume, shared-firm/client dashboard, automatic CRM/spreadsheet delivery or native App Store app is included. Email has bounded retries/logs but no durable queue. Physical-device, load, independent security and disaster-recovery certifications are not claimed.

Current evidence is in [readiness.md](readiness.md), [onboarding verification](adviser-onboarding.md) and [the previous full launch check](final-launch-check-2026-09-13.md). Older report numbers describe their dated release, not a fresh test of every current feature.
