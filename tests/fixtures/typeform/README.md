# Published Typeform reference definitions

These snapshots were read from the `form` JSON embedded in the four existing published Typeform pages on **13 September 2026**. They contain the source ID, title, fields (including child groups, refs, choices, validations and help text) and jump logic. Branding image attachments, account settings, analytics configuration and other page assets were omitted. They contain no submitted answers or credentials.

| Form | Published source | Original questions | Source required questions | Answered gate combinations |
| --- | --- | ---: | ---: | ---: |
| Mortgage | [AE8RkxUT](https://form.typeform.com/to/AE8RkxUT) | 219 | 13 | 768 |
| Protection | [a4Gp3Csc](https://form.typeform.com/to/a4Gp3Csc) | 104 | 1 | 16 |
| Medical | [xrjNX2Gg](https://form.typeform.com/to/xrjNX2Gg) | 47 | 1 | 49,152 |
| Home | [R3CNRtla](https://form.typeform.com/to/R3CNRtla) | 30 | 1 | 1 |
| **Total** | | **400** | **16** | **49,937** |

`sources.json` records the capture date, public URLs and SHA-256 hashes of these snapshots. Medical has one additional email question in the app, for 401 app questions overall.

## Repeat the comparison

Run `npm run verify:typeforms`. This needs installed development dependencies, but no Typeform token or network access. CI runs it too. The verifier independently walks the source jumps and compares the resulting question set with the application's actual `isStepVisible` and `isFieldVisible` functions. It also checks question inventory, refs, groups, labels, choices, help text and required flags.

The comparison enumerates answered gate choices. It does not claim exhaustive parity for blank answers or Typeform's browser implementation. Existing routing and server-validation unit/browser tests separately cover blank gates, stale hidden answers and removal of those answers from submissions. In particular, the source Mortgage fallback can loop when mortgage purpose is unanswered; the app does not reproduce that loop.

These are a fixed reference, not a live sync. When the business edits a Typeform, retrieve its new full definition, review the changes, then deliberately update the matching snapshot and `sources.json` hash. Use `npm run import:typeform` and `npm run verify:typeform` with the complete definition as described in the main README. Never regenerate the source snapshots from the app schema or widen the deviation list merely to make a failure pass.

## Existing platform differences retained

The user's completion-rule decision is to use the existing Typeforms. All source required flags are preserved; other source questions remain optional. The existing platform requires the client's name and email for submission identity and delivery, including an added Medical email field. No extra mandatory routing or follow-up questions were introduced in this pass. A blank answer means not provided, not No.

The import has these documented corrections, enforced by `KNOWN_DEVIATIONS` in the verifier:

- Mortgage and Protection: internal admin notes are adviser-only. The original forms failed to skip those notes for clients. Client PDFs separately exclude all internal sections.
- Mortgage: CCJ=No no longer skips the bankruptcy question; bankruptcy details depend on bankruptcy=Yes.
- Mortgage: background buy-to-let questions are available for both purchase and remortgage. The count appears for BTL=Yes, and only the requested 1–3 property blocks appear. The source purchase jump skipped all BTL questions, while its remortgage route displayed all three property blocks.
- Protection: Applicant 2 sick pay follows the joint-case answer. The source displayed it for single applicants too.
- Medical: GP information remains reachable when overseas travel=No. The source jump skipped the GP group.
- Medical: parent-death details appear only for No or One Deceased. The source always displayed them.

Label repairs name the Applicant 1 employment dropdown, distinguish property tenure from building type, remove redundant outline numbers and fold consent choices into their labels. Introductory adviser copy is replaced with the owning adviser's branding. These are reported by the verifier.

Email routing belongs to the application: saved submissions belong to the adviser resolved from the link, and automatic client/adviser copies follow that adviser's existing delivery preferences. Selecting Adviser while completing a form does not override those preferences.
