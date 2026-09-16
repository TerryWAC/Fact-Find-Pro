# Live registration, Medical and Home journey — 13 September 2026

**Result:** the requested two-form journey passed against the real Supabase and Resend services. Gmail confirmed receipt in the approved inbox, and the received PDFs were downloaded, extracted and visually inspected. One PDF layout defect was found and repaired: a long adviser email address overflowed its card. Corrected client copies were received afterwards.

The application was the current production build running on loopback port 3010, starting from code `38d08e3`, followed by the PDF wrapping repair. This was not a test of the current primary Vercel alias. No deployment or public-alias promotion was performed.

## Registration and onboarding

- Created `Launch Test Adviser 191004`, under the clearly fictional `FactFind Test Practice`, using a unique plus alias of the approved inbox.
- Submitted the real registration form. The real profile trigger created an adviser with Pending status; no FactFind links existed yet. Attempting to reach the dashboard returned to the pending page.
- The new-registration notification arrived in `terry@terry-blackburn.com` at **20:10:07 BST**.
- Used the real admin approval screen and server action. Its database trigger generated four active adviser-specific links, and the approval email arrived at **20:10:10 BST**.
- Signed in as the new adviser and completed details, Gold branding, delivery preferences, the optional team skip, and the final onboarding step. Verified persisted values and the adviser dashboard.
- The admin browser session was established with an existing-admin Supabase session for the test and revoked afterwards. The test adviser used normal email/password registration and sign-in. Supabase currently has email auto-confirmation enabled, so there was no separate registration email-confirmation step; admin approval remained enforced.

## Completed FactFinds

| Scenario | Verification |
| --- | --- |
| **Medical FF-001006**, completed while signed in as the adviser | Populated all applicable fields with fictional information. Smoking Yes → No and Covid Yes → No removed the hidden details from the saved payload and PDFs. Family-history Yes showed its detail box. Parents One Deceased → Yes → One Deceased correctly hid and restored the death-detail field. Positive condition, medication, GP and follow-up responses kept their details. Negative counselling, specialist, other-condition, driving and travel responses excluded their detail boxes. No travel still led to the GP section. |
| **Home FF-001007**, completed in a separate anonymous phone session | Entered a mix of Yes/No answers for flooding, subsidence, extended vacancy, alarm, claims, cancellation and convictions. Went back from review to change buildings cover from £450,000 to **£475,000** and accidental damage from Yes to **No**. Both edits persisted in the database and received PDF. No horizontal overflow was observed during the form journey. |

These scenarios follow the source Typeforms. Home has a fixed question sequence, not conditional follow-up sections. Neither Medical nor Home has the adviser/client selector or private admin-note sections found in Mortgage and Protection. This run verifies signed-in adviser completion versus anonymous client completion; it does not add a new authorship field or invent branches.

## Delivery and downloads

The initial test adviser preference was adviser PDF **on**, client PDF **off**. Medical sent one automatic adviser notification and correctly skipped the automatic client copy. The adviser then selected **Email PDF to client**, confirmed the displayed recipient, and sent that copy manually.

For Home, the test adviser enabled the existing client-copy preference in Settings. Completing the anonymous Home form sent both adviser and client PDFs automatically. Terry's existing account preferences were not changed.

| Message | Gmail receipt (BST) |
| --- | --- |
| Medical adviser notification, PDF attached | 20:12:50 |
| Medical manual client copy, PDF attached | 20:12:52 |
| Home adviser notification and automatic client copy, both with PDFs | 20:12:56 |
| Corrected Medical client PDF after the wrapping repair | 20:20:19 |
| Corrected Home client PDF after the wrapping repair | 20:20:21 |

All six PDF messages were present in the approved inbox. The sender displayed **FactFind Test Practice** using `notifications@factfindpro.com`; client replies targeted the test adviser's plus alias in that same inbox. Received HTML contained the test firm identity and Gold colour, with no Wealthy Advisers Club branding.

Both adviser downloads returned HTTP 200, `application/pdf`, the expected reference/type filenames and private/no-store caching. An anonymous client request to the adviser PDF URL returned HTTP 307 to login.

The Medical PDF is **3 pages** and the Home PDF **2 pages**. Extracted text from all four original received attachments matched the corresponding downloads. After the repair, both corrected received client PDFs matched the corrected downloads (normalising layout whitespace and generation time). All address characters, UK dates, the edited Home cover value and Medical condition/GP details remained present; discarded answers remained absent. Every page of both corrected documents was visually inspected.

## Repair and cleanup

The PDF introduction now reserves space for the adviser card, allows the title column to shrink, and constrains the card's text column. Long email addresses use explicit line breaks without adding hyphens or removing characters. Client summary email addresses receive the same protection. Production build, TypeScript, lint and the 34-asset/five-route PDF deployment check pass.

After saving evidence, both fictional submissions were archived, the temporary adviser suspended, its four links disabled and its session revoked. Both test public forms returned 404 afterwards. Terry's saved preferences remain adviser copy **on**, client copy **off**. No real client records were changed.

Evidence is saved locally in `C:\Users\Dan\Desktop\FactFind-Pro-Launch-Review\Full-Journey-Test`, including the final received PDFs, actual received HTML, registration/onboarding/review screenshots, inbox receipts and PDF checks. Runtime fixtures and credentials remain in the ignored `.vercel/full-journey` directory and are excluded from the review pack.
