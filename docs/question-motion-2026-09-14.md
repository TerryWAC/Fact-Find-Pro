# Question motion and Typeform fidelity — 14 September 2026

The client forms now give each question a numbered card, a clear required/optional cue and an adviser-coloured focus border. Questions arrive with a short depth transition when they enter the viewport, including newly revealed follow-ups. Related questions stay together in their original sections.

Motion lasts 280ms on narrow screens or 380ms on larger screens, with at most 90ms of staggering. There are no loops, forced delays, automatic advancement or new animation dependencies. Inputs keep their React identity and answers when other questions appear. Questions remain visible if animation APIs are unavailable; reduced-motion users get fully visible, stationary cards.

A fast-click test found that cancelling an animation on pointer-down could move a checkbox before pointer-up. The hook now pauses through the tap and settles after the click. Keyboard interaction, leaving the question and cancelled touch gestures also settle it. It cleans up observers, listeners and animations on navigation.

## Terry's question sets

The owner confirmed: **keep the wording and existing routing corrections**. No schema, question wording, choices, help text, required flag, delivery preference or saved-answer format changed in this update.

The offline comparison against the published Typeform snapshots captured on 13 September passes:

| Form | Original questions | Answered gate combinations |
| --- | ---: | ---: |
| Mortgage | 219 | 768 |
| Protection | 104 | 16 |
| Medical | 47 | 49,152 |
| Home | 30 | 1 |
| Total | 400 | 49,937 |

All source questions, choices, help text and required flags are accounted for. The app also retains the required Medical email field and the existing identity requirements. This is comparison with the saved originals, not a new live Typeform sync.

The documented import repairs remain: readable employment/tenure labels, folded consent labels, removed outline prefixes, owning-adviser introductions, private adviser notes, independent bankruptcy questions, conditional BTL property blocks, joint-only Applicant 2 sick pay, reachable GP information and conditional parent-death details. See [the source notes](../tests/fixtures/typeform/README.md) and [logic audit](logic-audit.md). A blank optional answer continues to mean not provided, not No.

## Verification on this update

- Lint, TypeScript checking, the production build, 59 unit tests and the Typeform comparison passed. All 34 PDF deployment assets are present across the five PDF routes.
- Through the browser, fictional Home, Medical, Mortgage and Protection cases each reached the completion page. The isolated backend recorded exactly those four submissions. No external email was sent.
- Home: missing-answer focus, typing, Back/Continue retention, review and editing passed.
- Medical: smoking/drug follow-ups changed independently; removed smoking and parent-death details were absent from review and the saved payload; GP information stayed reachable after No to overseas travel; the still-applicable follow-up was retained.
- Mortgage: adviser sections and notes were available; joint-to-single removed Applicant 2; CCJ=No retained bankruptcy=Yes details; purchase-to-remortgage removed purchase answers; reducing three BTLs to one removed the other property blocks. Saved payload inspection confirmed stale markers and Applicant 2 answers were absent.
- Protection: joint-to-single removed Applicant 2 details and sick-pay fields. Client review excluded Adviser Details and Admin Notes. Four repeated desktop consent edit/check cycles passed after the tap fix; three more passed at 320px.
- Layout checks at 320px, 390px, 768px and 1440px found no horizontal overflow. Both themes were inspected. Phone text inputs retained 48px height; Tab moved from first to last name. Browser-computed styles confirmed actual question transforms during normal arrival, and opacity 1 / transform none under reduced-motion emulation.

The full prior email/PDF and WebKit suites were not rerun for this presentation change. The current pass used Chromium through the browser-control tool, not physical iPhones/iPads. Existing account activation, backup/restore and authorised confirmation-email verification items remain in [the launch guide](transfer-and-launch.md); this update does not close them.

## Published release

Application commit `d820045` is deployed as `dpl_8zTh4228WMxKPBMdwmafmBvssjWS`, Ready and aliased to [fact-find-pro.vercel.app](https://fact-find-pro.vercel.app). All four Terry form URLs returned 200 with the expected adviser and welcome control; anonymous dashboard/admin requests redirected to login. Terry's live Home form displayed the eight new first-section question cards without overflow or browser errors. That hosted check entered no client answers and submitted nothing.
