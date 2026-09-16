# Supplied policy and onboarding copy — 13 September 2026

## Sources and instruction

- Owner-supplied `t&c's.docx`: actually titled **FactFind Pro Privacy Policy and Data Protection Statement**, last updated January 2026, 13 sections. The source Word file is unchanged.
- Owner-supplied legacy setup screenshot: promises a links pack within 24–48 hours and refers to terms inside Skool.
- Pasted Skool launch description: instead promises setup within one working hour; also describes autosaved partial forms and private spreadsheets.
- **Owner decision in this task: keep records until deletion is requested.** The Word document's 90-day rule is superseded by that explicit instruction. No deletion job or database change was introduced.

## Changes

| Source statement | Reconciled application wording |
|---|---|
| Operator not named in the previous application notice | Terry Blackburn Consultancy Ltd trading as FactFind Pro, with supplied ICO number ZB848395 and support@factfindpro.com; known Terry inbox retained as an alternative |
| “We do not share personal data with third parties” | No selling/renting or marketing use of client answers; explicitly names Supabase, Vercel and Resend as service providers |
| Strict automatic 90-day deletion, all copies irrecoverable | Retention until a deletion request is processed, identity/authority checks, legal exceptions, and honest treatment of external copies, backups and delivery logs |
| Authorised users within the adviser account | Individual adviser access plus authorised platform administrators; colleague directory does not grant access |
| Client file uploads | Omitted as an unsupported current feature; branding uploads remain described |
| 1 hour / 24–48 hours setup | Approval decision by email, then self-service branding and four automatically generated links; no unsupported turnaround promise |
| Agreement refers only to Skool | Public policy links on registration, pending page and all client forms; client links open separately to preserve answers |

The privacy page retains the source's distinction between the adviser as controller for advice records and FactFind Pro as processor, and the operator as controller for platform accounts. It also describes email preferences, adviser-note privacy, absence of saved drafts, rights and incident handling.

## Classroom statements that are not implemented features

- No saved drafts, partial-submission dashboard, offline completion or cross-device resume.
- No automatic private-spreadsheet output.
- All four links are created on approval; there is no onboarding selection of a subset.
- Adviser/client selectors and internal notes are present in Mortgage & Protection and Protection, following their source Typeforms. They are absent from Medical and Home.
- No native App Store app or promised release of Business Protection/PMI forms.

The [replacement classroom copy](classroom-launch-copy.md) describes the current application accurately. It is prepared for the owner and has not been posted externally. This pass does not implement those additional product features.

## Review limits

The document supplies operator identity, ICO number and support contact. These were incorporated as owner-provided information; the ICO entry could not be independently retrieved and support@factfindpro.com mailbox receipt was not tested. The previously verified Terry address remains available.

The supplied file is a privacy statement, not a complete set of commercial terms or a processor agreement. Business confirmation is still needed for documented lawful bases for adviser-account data, international-transfer arrangements and the controller/processor contract. The site update is not a legal-compliance certification.

The ICO's [privacy information guidance](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/the-right-to-be-informed/what-privacy-information-should-we-provide/) explains that notices should identify the operator, purposes and lawful bases, recipients (including processors), retention periods or criteria, applicable transfers and rights. Retention on request does not remove the need for advisers to review whether records remain necessary.

## Verification

- Deployed application commit `ab926ed` to production deployment `dpl_DEPWBC7qZBG2NNkA49XxwuH562gr`. Vercel reports Ready and the public domain serves the update.
- Public HTTP checks passed for privacy, terms, pending registration and all four of Terry's client links; the live retention page was opened and inspected in the browser.
- Production preview build, TypeScript and ESLint passed.
- Four Chromium cases passed across desktop and phone: registration details survive opening the policies, and unfinished client answers survive opening privacy and deletion-request links.
- The same four cases passed in desktop Safari and iPhone WebKit.
- Five responsive cases passed for small Android, iPhone, iPad portrait, iPad landscape and desktop, including the adviser branding, app manifest and form controls.
- Desktop setup page inspected visually; policy links resolve publicly, and the retention anchor opens directly at the relevant section.

The prior [full launch verification](launch-fixes-2026-09-13.md) remains the evidence for unchanged Typeform routing, database isolation and actual email/PDF delivery. No live emails or deletion requests were sent during this content update.
