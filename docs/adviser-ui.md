# Adviser workspace polish — 13 September 2026

The adviser can sign in, find the next client needing review, open submissions and manage the practice's client experience. This pass refines that existing workflow without changing approval, ownership or email-delivery rules.

## Changes

- A new split sign-in layout uses the FactFind Pro identity, a restrained black/gold panel, a clear form card and smaller Wealthy Advisers Club artwork. Registration and password-recovery pages share the same responsive frame.
- Login uses 48px inputs and a show/hide-password control. Failed sign-ins retain the entered email/password in component memory for correction, with no new browser storage. Validation focuses the relevant field; general errors receive focus and are announced. Signing out clears the page and protects the dashboard.
- The dashboard adds a welcome panel and a direct Start next review link to the oldest new submission already returned by the adviser-scoped query. The shortcut is absent when that query fails or has no result.
- The client-experience card shows the actual firm name and saved adviser/client PDF preferences. It provides links to client forms and branding/delivery settings. These are preference indicators, not provider-delivery confirmations.
- Shared navigation uses a compact product header, larger active navigation items, a Find a submission shortcut and an explicitly labelled account menu. The old MVP label is removed. The mobile drawer closes when its dashboard logo is selected.

## Verification

The full **58-case desktop/mobile browser suite** passed, including four new sign-in cases. The **10 responsive cases** also passed across small Android, iPhone, iPad portrait, iPad landscape and desktop configurations. These are Chromium emulations. A four-case rerun produced final login/dashboard screenshots with animations disabled so the artifacts show the settled design.

Covered: valid and invalid sign-in, password visibility, input preservation after errors, field/error focus, redirect back to the requested page, recovery/registration navigation, sign-out and unauthenticated dashboard protection. Existing checks retain accurate counts, adviser isolation, oldest-first review ordering, failure recovery and all four client journeys. The responsive pass also checks settings, branded email previews and mobile navigation.

Lint, the preview build and production build passed. Both builds check TypeScript. The PDF deployment gate still verifies 34 assets in all five routes. Prior unit, email-integration and Typeform reconciliation evidence remains in `readiness.md`; this UI pass does not change those implementations or send real emails.

The [hosted review build](https://fact-find-3lgbsv6yw-terry-blackburns-projects.vercel.app), code `e829b02`, is Ready on Vercel. Read-only hosted checks confirm the new login and recovery pages return HTTP 200, the unauthenticated dashboard redirects to login (HTTP 307), and the branded Home form returns HTTP 200. Authenticated interaction was tested against the isolated local production build.

No database migration or environment change is required. The isolated preview uses fictional adviser accounts and client records. Public-alias promotion and a physical iPhone Safari check remain pending.
