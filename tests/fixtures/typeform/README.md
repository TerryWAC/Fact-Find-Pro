# Published Typeform reference definitions

These snapshots were read from the `form` JSON embedded in the four existing published Typeform pages on **13 September 2026**. They contain the source ID, title, fields (including child groups, refs, choices, validations and help text) and jump logic. Branding image attachments, account settings, analytics configuration and other page assets were omitted. They contain no submitted answers or credentials.

| Form | Published source | Original questions | Source required questions | Answered gate combinations |
| --- | --- | ---: | ---: | ---: |
| Mortgage | [AE8RkxUT](https://form.typeform.com/to/AE8RkxUT) | 219 | 13 | 768 |
| Protection | [a4Gp3Csc](https://form.typeform.com/to/a4Gp3Csc) | 104 | 1 | 16 |
| Medical | [xrjNX2Gg](https://form.typeform.com/to/xrjNX2Gg) | 47 | 1 | 49,152 |
| Home | [R3CNRtla](https://form.typeform.com/to/R3CNRtla) | 30 | 1 | 1 |
| **Total** | | **400** | **16** | **49,937** |

`sources.json` records the capture date, public URLs and SHA-256 hashes of these snapshots. Medical has one additional email question in the app, and Mortgage has 24 additional loans and credit-card questions (below), for 425 app questions overall.

`future-perfect-mortgage.json` is separate from the four standard forms: it is the definition of "Tom Hunt - Mortgage" (`qd0zpSvg`) read on 11 November 2026, questions and jump logic only, no responses. It feeds `scripts/build-mortgage-future-perfect.mjs`, which produces that adviser's bespoke question set (see `docs/future-perfect-mortgage-variant.md`). It is not part of the 400-question comparison.

## Repeat the comparison

Run `npm run verify:typeforms`. This needs installed development dependencies, but no Typeform token or network access. CI runs it too. The verifier independently walks the source jumps and compares the resulting question set with the application's actual `isStepVisible` and `isFieldVisible` functions. It also checks question inventory, refs, groups, labels, choices, help text and required flags.

The comparison enumerates answered gate choices. It does not claim exhaustive parity for blank answers or Typeform's browser implementation. Existing routing and server-validation unit/browser tests separately cover blank gates, stale hidden answers and removal of those answers from submissions. In particular, the source Mortgage fallback can loop when mortgage purpose is unanswered; the app does not reproduce that loop.

These are a fixed reference, not a live sync. When the business edits a Typeform, retrieve its new full definition, review the changes, then deliberately update the matching snapshot and `sources.json` hash. Use `npm run import:typeform` and `npm run verify:typeform` with the complete definition as described in the main README. Never regenerate the source snapshots from the app schema or widen the deviation list merely to make a failure pass.

## Existing platform differences retained

The user's completion-rule decision is to use the existing Typeforms. All source required flags are preserved; other source questions remain optional. The existing platform requires the client's name and email for submission identity and delivery, including an added Medical email field. No extra mandatory routing or follow-up questions were introduced in this pass. A blank answer means not provided, not No.

**Mortgage loans and credit cards (owner request, 11 November 2026).** The Version 1 per-adviser Mortgage forms were created from a later template than the published master `AE8RkxUT`, and that template asks "Do you have any loans?" (loan 1–4 company name, monthly payment and outstanding balance, plus an additional-loans box) and "Do you have a credit card(s) or store card(s)?" (card 1–3 name, outstanding balance and repayments) between the monthly expenses and the CCJ question. Advisers expected them in Version 2, so the importer adds them to the standard Mortgage schema for every adviser with the template's wording and help text, as optional questions with `source: factfind-pro:<id>`. The verifier accepts exactly these ids as additions. Two deliberate differences from the template: its jump rules were slips (Yes skipped the loan details and No skipped the card question) and are not reproduced, so Yes shows the details and No moves on; and "balamce" is spelled "balance". The master snapshot itself is unchanged and remains the comparison reference.

The import has these documented corrections, enforced by `KNOWN_DEVIATIONS` in the verifier:

- Mortgage and Protection: internal admin notes are adviser-only. The original forms failed to skip those notes for clients. Client PDFs separately exclude all internal sections.
- Mortgage: CCJ=No no longer skips the bankruptcy question; bankruptcy details depend on bankruptcy=Yes.
- Mortgage: background buy-to-let questions are available for both purchase and remortgage. The count appears for BTL=Yes, and only the requested 1–3 property blocks appear. The source purchase jump skipped all BTL questions, while its remortgage route displayed all three property blocks.
- Protection: Applicant 2 sick pay follows the joint-case answer. The source displayed it for single applicants too.
- Medical: GP information remains reachable when overseas travel=No. The source jump skipped the GP group.
- Medical: parent-death details appear only for No or One Deceased. The source always displayed them.

Label repairs name the Applicant 1 employment dropdown, distinguish property tenure from building type, remove redundant outline numbers and fold consent choices into their labels. Introductory adviser copy is replaced with the owning adviser's branding. These are reported by the verifier.

Email routing belongs to the application: saved submissions belong to the adviser resolved from the link, and automatic client/adviser copies follow that adviser's existing delivery preferences. Selecting Adviser while completing a form does not override those preferences.
