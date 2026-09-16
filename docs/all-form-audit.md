# All four FactFinds: completion and presentation audit

13 September 2026. This pass builds on the [live registration, Medical and Home test](live-registration-journey.md), which confirmed receipt in the approved Gmail inbox.

## Improvements

- Monetary answers retain pence: £1,250.75 stays £1,250.75 in review, saved submission displays and PDFs. Existing typed records also use their original amount instead of their old rounded display. Whole-pound values remain compact.
- Yes/No answers have consistent capitalisation; unanswered questions remain distinct. Binary choices fit side by side on phones, including Typeform questions represented as radio fields. Choices retain a minimum 48px height and visible keyboard focus.
- PDF answers containing long email addresses use a full-width row and safe line breaks, avoiding overlap with the next column. Long question labels also get a full-width row.
- Continuation pages have space below the repeated brand header. Section titles stay with following content; long answers can still cross pages. Follow-up labels retain clear space after their preceding answer.

No question schema, branch, required flag, adviser delivery preference or database migration changed.

## Logic and completion coverage

| Form | Detailed completion and existing branch checks |
| --- | --- |
| Mortgage | Adviser completion; both applicants; second income and sick pay; dependants; no will; CCJ No with bankruptcy Yes; purchase and three buy-to-let properties. Existing browser checks switch purchase/remortgage, CCJ/bankruptcy, BTL counts and joint/single, verifying hidden stale answers are excluded. Private adviser details, client source and admin notes are removed from client PDFs. |
| Protection | Client completion with joint applicants, second income and sick pay, dependants and no will. Separate adviser completion tests retain internal notes only in adviser PDFs, for automatic and manual sends. The unit routing matrix covers blank and changed gates. |
| Medical | Mixed positive and negative lifestyle, family and health answers, a deceased parent, medication and follow-up details; negative travel still reaches GP information. Existing browser checks change Yes to No and verify that hidden answers disappear. All 14 conditional follow-ups are tested independently. |
| Home | All 30 questions completed, with mixed flooding, subsidence, vacancy, security and claims answers. Review/edit/save and anonymous completion are tested. The source Typeform has a fixed sequence, with no conditional follow-up sections. |

The source comparison passes for **400 original Typeform questions and 49,937 answered gate combinations**, retaining the documented import corrections. Medical has the previously added platform email question. Medical and Home do not have the adviser/client selector or internal-note sections present in Mortgage and Protection.

## Verification

**143 automated cases passed:** 51 unit, 58 desktop/mobile browser, 19 captured-email integration, and 15 responsive/branding cases. The final PDF changes were followed by a fresh 19-case email run and six PDF-download/access checks. The final binary-choice refinement passed across all five responsive configurations.

The email tests execute the real Next submission action, PDF renderer and email code with an isolated database and captured provider. They check both requested recipients, each preference combination, both preferences off, disabled templates, provider rejection, bounded retries, failed submissions and manual client sends. They do not claim new live inbox delivery; the earlier live receipts are documented separately.

Production and preview builds, TypeScript, lint and the PDF deployment asset check pass (34 assets in five routes).

### PDF content checks

| Detailed fixture | Client PDF | Adviser PDF | Answer entries checked |
| --- | --- | --- | --- |
| Mortgage | 8 pages | 8 pages | 187 client / 200 adviser |
| Protection | 5 pages | 5 pages | 94 / 94 |
| Medical | 3 pages | 3 pages | 39 / 39 |
| Home | 2 pages | 2 pages | 30 / 30 |

All **713 answer entries** remain present, including long notes, long email addresses, dates and monetary decimals. Page numbering and firm metadata are checked, with no text outside the page margins, overlapping words or orphaned section headings. Six additional Mortgage/Protection automatic/manual PDFs pass explicit private-note and bankruptcy checks. Rendered pages were visually reviewed for the email overlap, page transitions and readability.

Run `npm run test:email-flow`, then `python tests/verify-pdf-content.py` to repeat the PDF checks. The optional Python check requires `pypdf` and `pdfplumber`. Add `--render-dir test-results/pdf-pages` to render review images with Poppler's `pdftoppm`. Results are written to `test-results/pdf-content.json`.

### Devices and launch boundary

Responsive coverage uses Chromium at 360px Android, iPhone 13, iPad portrait, iPad landscape and desktop sizes. Login, branding/email preview, navigation and binary controls were checked; the core browser suite covers complete journeys at desktop and phone sizes. A physical iPhone/Safari/soft-keyboard check remains outstanding.

The main public domain has not been promoted by this audit. Secure draft recovery, offline completion and a durable email retry queue remain outside the implemented scope. The current app can be added to the home screen; it is not a native App Store app.

## Hosted review

The [updated review build](https://fact-find-h1wt5uygz-terry-blackburns-projects.vercel.app/login), code `0c6ee57`, is Ready on Vercel (`dpl_ANrxgDeWNFUfDC2nj1ggcRDdqHmZ`). All four hosted adviser form URLs and the new Signature login returned HTTP 200 with the expected page content; the unauthenticated dashboard returned HTTP 307. These are read-only hosted checks; the detailed completion/email tests above use the isolated production build.

The primary `fact-find-pro.vercel.app` alias still resolves to `dpl_3ozrzimhNDDJKUD59ThcPBfuVuyy`, verified after uploading this review. GitHub syncing remains subject to the previously observed integration permission failure. The combined patch is saved separately on the Desktop.
