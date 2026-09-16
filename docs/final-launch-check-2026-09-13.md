# Final launch check — 13 September 2026

**Technical acceptance: passed for the implemented adviser/client workflows. Unrestricted launch sign-off: still pending the owner items below.**

Public site: https://fact-find-pro.vercel.app/login

The live application is still commit `ab926ed`, deployment `dpl_DEPWBC7qZBG2NNkA49XxwuH562gr`, confirmed Ready. This pass changed no application code or delivery preferences. It repeated the functional checks requested by the owner, enabled compromised-password protection in Supabase and recorded the remaining limits.

## Fresh verification

| Check | Result |
|---|---|
| Unit tests | **53 passed** |
| Chromium desktop/mobile journeys | **72 passed**, including admin, adviser dashboard, all four client forms, validation, conditional answers, PDF access and policy-link state preservation |
| Captured email integration | **22 passed**: adviser/client preference combinations, template disabled, provider rejection/retry, manual sends and complete detailed forms |
| Original Typeform comparison | **400 questions / 49,937 gate combinations** accounted for; documented authoring corrections retained |
| PDF contents and layout | **8 detailed PDFs / 713 answer entries** preserved, no margin overflow, overlap or orphan headings; **6 additional audience-privacy PDFs** passed |
| PDF deployment assets | **34 assets across 5 routes**, present |
| Production dependency audit | **0 reported vulnerabilities** at this check |
| Live HTTP checks | **13 passed**: public pages and all four adviser links return 200, an unknown link returns 404, unauthenticated dashboard/admin/PDF requests redirect to login |
| Live database regression | Passed pending registration, four-link provisioning, adviser isolation, blocked role escalation, blocked public write RPC and inactive-link rejection; **all fictional fixture rows rolled back** |
| Live data controls | Row-level security enabled on all 8 public data tables; submission write RPC denied to anon/authenticated and allowed to the service role |
| Compromised-password protection | **Enabled and verified**: Supabase saved the setting, the disabled-protection advisory cleared, and a live signup with a known breached password returned HTTP 422 / `weak_password`, reason `pwned`; no account was created |
| Live email settings | All 6 templates enabled; recent registration, approval, adviser and client-copy records use Resend and show provider acceptance |
| Runtime errors | No error logs returned for the current production deployment in the requested past-hour query; this is not a load-test or uptime guarantee |

The previous release tests also verified actual inbox receipt of Medical and Home PDFs, password recovery, and real registration → approval → onboarding → dashboard journeys. These were not resent or recreated during this pass. See [the receipt and hosted-journey evidence](launch-fixes-2026-09-13.md). Current Safari/iPhone and iPad evidence is in the [policy update report](supplied-policy-review-2026-09-13.md).

Terry's account remains approved, onboarding complete and all four links active. **Adviser PDF copy is on; automatic client PDF copy is off**, as requested. Manual client copying remains available. Records remain until deletion is requested and processed; no automatic deletion was added.

## Owner items before unrestricted launch

1. **Finish the data-protection document review.** The supplied file is a privacy statement, not the adviser/platform processor agreement. The operator still needs to confirm account-data lawful bases, international-transfer arrangements and the controller/processor contract. The prepared notice accurately describes the implemented retention and service-provider behaviour, but is not legal approval. See the [specific review points](supplied-policy-review-2026-09-13.md).
2. **Use the corrected launch description.** The older Skool text promises saved drafts, partial submissions and automatic spreadsheet delivery that the current application does not provide. [Replacement classroom copy](classroom-launch-copy.md) is ready; it has not been posted to Skool.

## Reviewed warnings and practical limits

After the owner signed in to Supabase, the **Prevent use of leaked passwords** setting was enabled successfully. No paid upgrade, password change or account reactivation was needed. A live rejection test confirmed the protection, and the security advisor no longer reports it disabled. [Supabase password-protection guidance](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

The other Supabase security warnings concern callable `SECURITY DEFINER` functions. Their live definitions were inspected: `is_admin()` and `is_approved()` return only the current caller's status using `auth.uid()`, and `resolve_factfind_form()` returns branding for an active link owned by an approved adviser. These are intentional read helpers, not the restricted submission write function. They were not disabled merely to silence the linter. [Supabase linter explanation](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable).

Email delivery has bounded retries and logs, but no durable background queue. Provider acceptance cannot guarantee inbox delivery; staff should use the dashboard as the submission record and inspect failures. The previous actual inbox tests demonstrate successful delivery, not delivery under every outage condition.

No saved drafts, offline forms, shared firm/client dashboards or CRM/spreadsheet integration were added. Medical and Home retain their source forms without a separate adviser/client selector. The installable home-screen website is not a native App Store application.

The factfindpro.com domain has Google MX records. That verifies incoming-mail routing at domain level, not the existence or receipt behaviour of the support mailbox; the previously verified Terry contact remains in the notice.

GitHub synchronization still needs an authorised write connection; the prior integration returned 403. Local source commits and the combined Desktop patch remain available. No new source deployment was needed for this report-only pass.
