# Client journey polish — 13 September 2026

The client follows the branded welcome page through conditional sections, checks their answers and submits to the adviser resolved from their link. The saved submission then produces the PDF/email copies enabled by that adviser's preferences.

## Changes

- Continue, Back and Submit stay within reach at the bottom of the viewport while moving through long forms. The bar includes a next-section cue and respects the device's bottom safe area. Review edits retain the direct Return to review action.
- Review leads with supplied answers. Each section reports how many answers are provided or missing, with an accessible control to expand unanswered questions. Expanding does not move the control below the newly opened answers. Blank answers explicitly mean not provided, not No.
- Search includes unanswered questions and opens matching results directly. The Answered only filter, Edit links and complete submission payload continue to work independently of the compact display.

The Typeform schemas, required flags, private-note projection and delivery preferences are unchanged. The controls inherit each adviser's existing brand colours and light/dark styling. No database migration is needed.

## Verification

**127 automated checks passed**: 48 unit, 54 desktop/mobile browser, 15 captured-email integration and 10 responsive/white-label cases. The Typeform comparison also passes for all 400 original questions and 49,937 answered gate combinations, with the documented import corrections.

New browser cases verify that navigation is visible without scrolling to the end, the final input remains clickable, errors focus the correct input, collapsed answers remain searchable, and the complete payload is saved regardless of review display. Existing cases exercise all four forms from welcome through review/edit to successful submission, changing joint/credit/medical branches, failed-submission recovery, automatic/manual PDFs and email preferences.

The production and preview builds pass, lint passes, and the PDF asset gate verifies all 34 deployment assets in five routes. The application changes are confined to two client form components.

The phone/iPad/desktop views and compact review were visually inspected. The five responsive configurations are 360px Android, iPhone 13, iPad portrait, iPad landscape and 1440px desktop, using Chromium emulation. This is not a physical Safari/soft-keyboard certification. These tests used fictional data and a captured email provider; they did not send new real emails. Earlier approved live delivery evidence remains in `readiness.md`.

The [review deployment](https://fact-find-5s3jxlnvk-terry-blackburns-projects.vercel.app), code `46fcce6`, is Ready on Vercel (`dpl_xLTD6QiEs3QDsEy7YH5KekvWLZQp`). All four hosted form URLs returned HTTP 200 and showed Terry's firm identity and the start control. This hosted check is read-only; the full interactive and email evidence above uses the isolated production build.

The primary public deployment still requires promotion; its unchanged deployment ID was checked after this upload. Secure draft recovery and durable email retries remain the previously recorded limitations.
