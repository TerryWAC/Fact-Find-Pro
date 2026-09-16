# Form logic audit — updated 13 September 2026

The initial 12 September pass checked the schemas, server action, rendered forms and PDFs against the documented import intent. On 13 September, the four published Typeform pages were retrieved and their complete question definitions and jump rules independently reconciled with the application. The [saved source snapshots](../tests/fixtures/typeform/README.md) now account for all 400 original questions and 49,937 answered gate combinations, with only the documented platform corrections. This is verification of the captured rules, not a guarantee against every possible production failure.

| Rule | Verified behaviour |
| --- | --- |
| Adviser/client | Mortgage and Protection show Adviser Details, Client Source and Admin Notes only when `who_completing=adviser`. These are new form-entry sections, not access to another user's saved records. Submission ownership is resolved from the link on the server, not from the typed adviser name. Earlier real-database tests confirmed adviser isolation. |
| Joint applications | Applicant 2 details, employment and sick pay appear only for joint cases. Switching to a single application excludes those answers from review and the saved payload. |
| Dependants | Dependant details appear only when the answer is Yes. Hidden required dates do not block submission. |
| Bankruptcy/CCJ | The questions are independent. CCJ=No does not skip bankruptcy. Each Yes answer shows its own details; changing it to No removes those details from the submission. |
| Mortgage purpose and properties | Purchase/remortgage selects the relevant block. Background buy-to-let questions remain available for either purpose; property blocks follow the selected count of 1–3. |
| Medical | All 14 Yes/No follow-up gates are checked individually. Parent-death details appear for No or One Deceased. GP information remains reachable even when the overseas-travel answer is No. |
| Will | The consequences question appears when the client says they do not have a will. |
| Server submission | The web action validates visible answers against the current schema and rebuilds labels, sections and identity. Unknown field IDs, hidden answers and forged display text do not enter its saved payload. Dates and numbers reject impossible values. |
| Client email privacy | Both automatic and manual client PDFs exclude Adviser Details, Client Source and Admin Notes, including legacy flat answer maps. Adviser PDFs retain them. A mortgage client's own bankruptcy details remain present in their copy. |

## Defect found and repaired

The earlier automatic client-copy handler reused the adviser PDF. An adviser-completed submission could therefore include internal notes in the client email. The shared manual-send renderer had the same issue. Client-copy sends now explicitly render the client audience and cannot accept an adviser PDF buffer from their caller.

Five unit cases cover the projection, both affected form types, legacy formats, unchanged client answers and preservation of the original submission. Two additional captured-email browser cases complete Mortgage and Protection as an adviser and exercise automatic and manual sends. Text extraction from all six generated PDFs confirmed that the three private markers appear only in the adviser copies; client identity remains in all copies and the bankruptcy marker remains in every Mortgage copy. These tests use fictional data and do not contact real recipients.

The browser rerun also exposed a validation-summary focus issue: React Hook Form's touched-mode validation cleared manually assigned errors on blur, moving summary links during a click. Validation now remains with the schema engine until the client continues or submits.

## Completion policy confirmed

The imported forms currently make the adviser/client choice, bankruptcy and CCJ answers, medical Yes/No answers and most follow-up details optional. A blank answer is shown as not provided; it is not a declaration of No. Conditional branching working correctly does not guarantee that these details were supplied.

The user chose to use the logic from the existing Typeforms. All 16 source required flags are preserved; the platform's existing required client name/email fields remain. No additional mandatory routing or follow-up questions were added. Medical retains its added email field. Automatic client and adviser copies continue to use each adviser's existing delivery preferences, including for adviser-completed submissions.

`npm run verify:typeforms` now compares the saved sources with the real application visibility functions and runs in CI. It checks question inventory, choices, required flags and routing. The existing corrections are retained: private internal notes, independent bankruptcy questions, conditional BTL property blocks, joint-only Applicant 2 sick pay, reachable GP details and conditional parent-death details. See the snapshot notes for the full differences. Blank-answer behaviour and hidden-payload pruning are covered separately by the unit and browser routing tests.

The software collects answers for adviser review; it does not make underwriting or eligibility decisions based on bankruptcy or medical conditions.
