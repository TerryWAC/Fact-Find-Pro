# Existing advisers: private preparation and admin directory

The owner confirmed that existing adviser names and pictures are held in a Typeform signup. Nothing is to be sent to advisers yet.

## Recommended activation journey

Prepare a reviewed list from the **adviser signup** form, matching people by their existing email address. Prefill the name, company, job title, contact details, photo and logo where available. Exclude test entries and resolve duplicate or shared email addresses explicitly. A name or a photo alone is not an account identity.

After the owner approves a concrete invitation batch, each adviser should receive an individual activation link. They choose their own password, check the prefilled information, accept current terms and privacy information, and confirm their delivery preferences. The dashboard then gives them their four new form links. Never manufacture consent, share passwords, silently replace an existing account, or infer permission to email client PDFs from membership of the old service.

The activation journey is proposed, not yet implemented. The current auth callback supports a PKCE code exchange; invitation links need their own verified implementation and testing before invitations are sent. The local preparation tools do not create accounts. A separate restricted provisioning tool now creates dormant accounts, reserves inactive forms and transfers inspection images to private admin storage.

Historical client fact finds and legacy Typeform links are a separate migration decision. Adviser profile import does not transfer client submissions, redirect old Typeform URLs or grant access to an entire shared Drive folder.

## Local review tool

`scripts/prepare-adviser-import.mjs` accepts a CSV export or a Typeform Responses API JSON object containing `items`. It has no network, Supabase or email operations. CSV headings, or Typeform field IDs/refs, must be mapped explicitly. Multiple name fields may be joined using an array. Unsupported destination fields are rejected, including role, approval, delivery preferences, password and consent.

Example mapping (replace source headings or refs with the actual signup fields):

```json
{
  "name": ["First name", "Last name"],
  "email": "Email address",
  "company_name": "Company name",
  "avatar_url": "Upload your photo",
  "logo_url": "Upload your logo"
}
```

Run from the repository, keeping input and outputs under ignored `.vercel/adviser-import/`. Create this parent directory first; the output batch folder must not already exist.

```powershell
node scripts/prepare-adviser-import.mjs .vercel/adviser-import/signup.csv .vercel/adviser-import/mapping.json .vercel/adviser-import/review-001
```

An optional fourth argument points to a JSON array of existing account emails for collision checks. Without it, the report explicitly says existing accounts have not been checked. The HTML review and JSON records contain personal information: keep them local and out of Git, public directories and deployments. HTML does not load external pictures, scripts or fonts.

The tool keeps all duplicate rows for manual review rather than picking the newest submission or merging different people. It flags incomplete API responses, missing/invalid emails, likely test entries, invalid colours and invalid image URL schemes. Missing photos are optional follow-up items. An exported image URL is only a source reference: it may require authenticated Typeform access or expire, so copy and verify permitted images in adviser-owned storage before using them in public branding. The preview does not verify image contents or ownership.

Typeform pagination must be completed before preparing the final batch. An API page with `total_items` greater than the supplied `items` is reported as incomplete. With concatenated exports, the operator is responsible for checking completeness and avoiding repeated source responses.

Source documentation: [Typeform response retrieval](https://www.typeform.com/developers/responses/reference/retrieve-responses/) and [response file downloads](https://www.typeform.com/developers/responses/reference/get-a-file-from-a-response/).

## Source located and exported

Validation: `npm run test:adviser-import` covers 23 cases, including quoted CSVs, duplicate emails, incomplete API and CSV responses, source mapping, account collisions, PDF photo references, untrusted HTML, audited batch decisions, different emails for one name/company, website and phone normalisation, refused overwrites, and a provisioning transport that blocks mail and activation endpoints.

The signup is [Adviser Onboarding](https://admin.typeform.com/form/tldwHmoM/results#responses), in **Fact Find Pro Templates**, under the existing Typeform account signed in as `terry@bespokenewcastle.co.uk`. The separate `terry@terry-blackburn.com` account only showed “My new form”.

All 179 source responses were exported locally on 13 September 2026: 177 completed and 2 partial. There are 176 non-empty email values, 151 distinct email addresses, and 9 duplicate-email groups covering 34 rows (25 repeated rows beyond the first occurrence). These totals include test records; they are not a count of approved advisers. The review flags 28 possible test entries and 3 missing/invalid emails. No existing-account email collisions were found against the five current app accounts.

The source has 167 photo-file references and 174 logo-file references. Six photo references have PDF filenames. These are source-file counts, not verified headshots: some responses use a logo in the photo field. Inspection of the selected batch is recorded below. Source images still need adviser confirmation before use in public branding. The signup has no brand-colour or email-delivery-preference questions; do not invent either preference during import.

The original CSV, explicit field mapping, current-account email snapshot and private review outputs are in ignored `.vercel/adviser-import/`. No source personal data is committed. Typeform sent the requesting owner its routine export-download email during the earlier discovery step. The owner subsequently instructed that no emails should go out: do not request another Typeform bulk export or trigger live mail/invitation/recovery tests during this preparation.

## Reviewed local batch: 14 September 2026

All 179 source responses are accounted for in `batch-001/batch.json`:

| Decision | Source responses |
| --- | ---: |
| Proposed profile prefills | 135 |
| Held for identity/owner review | 6 |
| Excluded test/internal entries | 33 |
| Excluded blank name and email | 1 |
| Explicitly superseded duplicates | 4 |
| Total | 179 |

The held records include two advisers with the same name, company and phone but different email addresses (four responses), one community-manager record and one apparent placeholder entry. Do not merge those email identities or create two accounts for the same adviser automatically. The four superseded duplicates have matching emails and firms and compatible names; the reviewed newer response is referenced explicitly by source ID. Every original response remains in the audit.

Sixty single-domain website values now have an HTTPS prefix. Eight ambiguous, unavailable or overlong website values remain blank in the optional prefill, with their original text retained for confirmation. All 135 phone fields had Typeform's leading CSV text apostrophe removed. No brand colours, delivery preferences, roles, approvals, passwords or consent values were fabricated.

The 135 proposals have 265 supplied asset references. All 265 files were downloaded with individual read-only GET requests to their exact Typeform source URLs, without another export or an email. SHA-256 integrity checks passed. There are 264 viewable local previews: 252 regular images, ten one-page PDF uploads, one logo extracted from a Word document and one large image decoded after inspecting its dimensions. One supposed logo contains HTML and must not be published as an image. Three optional photos and two optional logos were absent.

All proposed profiles and their previews were visually inspected. The private report flags logos supplied as portraits, placeholder images, business cards and other follow-up items. Decoding or visually reviewing a source image does not independently verify the pictured person's identity or image ownership. The original uploads remain unchanged; inspection previews are not published branding assets.

The current source review is `review-003/`; the explicit decision manifest is `decisions-001.json`. `batch-001/review.html` is a self-contained private gallery with embedded PNG previews, no scripts, no external image loads and no mail links. It includes the six held responses, every proposed profile and the exclusion audit. `asset-inspection.json` and `visual-review.json` retain technical checks and visual follow-up notes. These files remain excluded from both Git and Vercel uploads.

## Reproduce an audited batch

`scripts/stage-adviser-batch.mjs` consumes the exact original review, a decision per source ID, an existing-account email snapshot and a new output folder. It has no network, authentication, database or email operations.

```powershell
node scripts/stage-adviser-batch.mjs .vercel/adviser-import/review-003/review.json .vercel/adviser-import/decisions-001.json .vercel/adviser-import/existing-emails.json .vercel/adviser-import/new-batch-folder
```

The decision file contains `review_sha256` (SHA-256 of the exact review file bytes) and `records`, each with `source_id`, `action` and an explicit `reason`. Actions are `include`, `hold`, `exclude_test`, `exclude_invalid` and `supersede`. A superseded response also names `superseded_by`, which must refer to an included response with the same email. Changed source files, missing/repeated decisions, invalid included profiles and current-account collisions stop staging. Image source URLs are kept separately from the profile prefill so authenticated or incompatible source files cannot become public branding URLs by accident.

## Provisioned privately: 14 September 2026

The owner requested premade FactFinds and visibility in the admin panel. All **179 source responses** are now in `adviser_imports`. The **135 selected advisers** have unconfirmed, banned authentication accounts, pending profiles and **540 inactive FactFinds**: Mortgage, Protection, Medical and Home for each adviser. No password was supplied or shared and no invitation was sent. Existing accounts were checked again before creation and were not overwritten.

Admin navigation includes **Existing advisers** at `/admin/imports`. It has search, status filters, pagination and a full CSV download, plus a detail page for each response. Selected advisers have four reserved links and four interactive admin previews using the current Typeform-derived form schemas. Preview submission is disabled. Held, excluded and superseded responses remain visible with their decision reasons; they have no accounts. Superseded responses link to the selected record.

The private `adviser-imports` storage bucket contains **264 decoded PNG inspection images**, accessible through short-lived signed URLs generated only after admin authentication and database policy checks. Profile branding remains unpublished. Local originals, signed URLs, source records and provisioning receipts are excluded from Git and deployment uploads.

The migration `20260913232741_stage_existing_advisers.sql` adds admin-only row access and two database guards. While `profiles.import_pending` is true, the profile cannot be approved, made an admin or marked as onboarded, and its forms cannot be activated. Ordinary authenticated users cannot clear that flag. Existing approval, rejection and welcome-email actions exclude these profiles. Dormant authentication accounts also remain banned until a separately implemented activation flow releases them.

The provisioning command requires an explicit project ID and the exact reviewed batch:

```powershell
node --env-file=.env.local scripts/provision-adviser-batch.mjs .vercel/adviser-import/batch-001 --project=pnxujzatlhudbsplftxp
```

It verifies original asset hashes, checks live account collisions, restricts network requests to the intended Supabase project and an explicit endpoint/method allowlist, and records progress in `provisioning-receipt.json`. Account creation is restricted to unconfirmed, banned users with the batch marker and no supplied password. Invitation, signup, recovery, OTP, email and unrelated mutation endpoints are blocked. Resume is allowed only for matching dormant accounts from the exact batch. Do not change `batch.json` after provisioning: its digest identifies the prepared accounts.

Live verification confirmed all 135 accounts remain dormant, every adviser has exactly four inactive form types, none of the 540 links resolves publicly, and all 264 images are in private storage. Database role tests confirmed advisers cannot read the directory or assets, clear the preparation flag, approve the prepared accounts or activate their links. The email log remained at **30 before and after** provisioning. Unit tests cover directory status accuracy and CSV formula-injection protection.

The directory is deployed at [Admin > Existing advisers](https://fact-find-pro.vercel.app/admin/imports). Authenticated live HTTP checks passed for the directory, filtering, pagination, adviser details, existing admin screens and all four preview routes. The live CSV contains 179 rows and 540 reserved links and sends private/no-store headers. Anonymous requests to the directory, detail, export and preview routes redirect to login. A fictional Home preview was completed in the browser and correctly blocked submission, leaving the mock submission count at zero. Mobile directory and detail layouts were checked at 390 px. Lint, typecheck, 23 provisioning/import tests, 56 unit tests and local/hosted production builds passed. Verification sent no email.

**Preparation is complete; activation is not released.** Remaining work before invitations is to confirm current membership and held email identities, implement/test secure individual activation and transfer adviser-confirmed branding into public adviser storage. Current terms and delivery preferences must be confirmed during activation. Historical client submissions and the 793 legacy Typeform forms have not been migrated or fully reconciled.
