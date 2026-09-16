# White-label and device verification — 13 September 2026

## Delivered

- Adviser-specific HTML email frame: firm name and logo, brand colour, clear typography, reference panel, action buttons, adviser contact and a plain-text alternative. Table layout and inline styles support traditional email clients. Saved admin template wording and inline styles remain intact.
- Both submission email types use the owning adviser's identity. The sender display name changes per firm; the verified sender address remains `notifications@factfindpro.com`. Client replies go to the adviser. The user explicitly chose the shared FactFind email domain.
- Client headers, footers, page titles, Open Graph metadata and PDF metadata use firm branding. Missing/unavailable logos fall back to firm identity. No platform footer or fallback lion appears in client records.
- Settings provides a live client email preview, including colour and logo changes before saving. Existing branding columns and access policies are sufficient; no database migration is required.
- Phone/tablet inputs use readable text and generous touch targets. Dialogs fit and scroll within the viewport, mobile navigation closes after selection, and safe-area and reduced-motion preferences are supported.
- Root and per-client-link manifests, firm monogram app icons, and an Add to home screen control support browser installation/shortcuts. The browser decides whether installation is offered. This is an online web app, not an App Store binary; no service worker caches sensitive records or unfinished answers.

## Verification

123 automated checks passed: 48 unit, 50 desktop/mobile journeys, 15 captured-provider email integrations, and 10 responsive/white-label checks. Device layouts used Chromium emulation for a 360px Android phone, iPhone 13, iPad portrait, iPad landscape and a 1440px desktop. These are browser layout checks, not physical-device Safari or Outlook certification.

All four forms completed and generated the requested PDF emails. Delivery preferences, disabled templates, provider rejection, retry idempotency and manual sends passed. Two extra fixtures verified a second firm's gold branding and an adviser without a company name or logo. Twelve generated PDFs were text-inspected for firm identity and absence of platform branding. The six Mortgage/Protection audience-specific PDFs were also checked for internal-note exclusion and retention of relevant client bankruptcy disclosures. Gold and default-black PDFs and desktop/mobile HTML email screenshots were visually inspected.

Typecheck, lint, production build and the PDF deployment-asset gate passed. The isolated mock now uses port 45439, outside Windows' default dynamic client-port range: the old 54329 port was temporarily occupied by an unrelated outbound connection. The unrelated application was left alone.

## Approved real email tests

Two fictional client-copy design messages, each with a generated PDF, were accepted by Resend for `terry@terry-blackburn.com`, from the verified FactFind sender:

- Morgan Financial: `f8738e1c-25f5-4036-8749-f56c69601149`
- Sunrise Advice: `474fdc63-df2c-4475-8c6c-b6e04ece5a0e`

Acceptance is confirmed; inbox placement and opening these two new messages have not been observed. These tests used fictional local records and created no production client submissions. Earlier live delivery and SMTP recovery evidence is in [readiness.md](readiness.md).

## Release boundaries

The candidate for code commit `3a62224` is Ready at [fact-find-oz5o3iwg1-terry-blackburns-projects.vercel.app](https://fact-find-oz5o3iwg1-terry-blackburns-projects.vercel.app). Deployment ID: `dpl_Ek39rWdiSuX1UGw8ByVRNKqNKstA`. Authenticated Vercel CLI smoke checks returned 200 for all four public forms, the firm manifest and the 512px app icon. Response bodies confirmed Terry's adviser identity, firm page titles, start controls and no platform-powered footer. The candidate retains Vercel access protection.

The primary `fact-find-pro.vercel.app` alias was checked and still points to `dpl_3ozrzimhNDDJKUD59ThcPBfuVuyy`, the earlier release. A local fictional client preview is open in the in-app browser on port 3008. The Google Chrome connection was unavailable for this pass.

The app's form rules remain as documented in [logic-audit.md](logic-audit.md). Existing optional adviser/client, bankruptcy/CCJ and medical questions were not made mandatory without an agreed rule change. The app records disclosures; it does not make eligibility decisions.

Automatic client email copies remain controlled by each adviser's Delivery preference. Terry's existing automatic client-copy setting is off; this pass did not alter it. The administrator workspace and platform account notifications retain FactFind Pro branding. Supabase authentication emails are separate and keep their previously tested SMTP configuration and existing template design.

Promotion to the primary public alias and GitHub publication are separate release steps. Repository writes through the available GitHub integration were previously denied; the local branch and combined patch contain the changes.
