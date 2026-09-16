# Adviser onboarding and product guide

Approved advisers without a completed setup are directed to `/onboarding` after sign-in. Existing advisers can reopen setup at `/onboarding?step=1` or use **How it works** in the dashboard navigation. Imported advisers remain pending and inactive; this guide does not activate accounts or send invitations.

The welcome page introduces the workflow before collecting settings. A five-chapter interactive tour covers branding, four reusable client links, conditional questions, submission review and PDF delivery. The Mortgage illustration can switch between client/adviser completion and single/joint applicants. It is a demonstration using component state, not a real form submission. The email illustration displays the adviser's saved preferences.

The existing six setup steps are retained:

1. Welcome, interactive tour and saved account checklist.
2. Practice and adviser contact details.
3. Logo, photo and colour, with the existing live brand preview.
4. Automatic adviser/client PDF email preferences and a plain-language summary. Saving setup sends no email; automatic delivery happens on a real completed FactFind according to those preferences.
5. Optional colleague directory. Directory entries do not grant accounts or submission access.
6. Saved delivery choices and four link cards. Only active links can be copied or opened. Missing/inactive links are explicitly labelled and are not represented as live.

Resume uses the stored onboarding step instead of inferring it from checklist ticks. In particular, default email settings do not cause the delivery step to be skipped. Completing setup does not mean a link was shared, and the checklist no longer claims that it does.

The reusable guide includes explanations of client access, adviser-only notes, PDF email preferences, record access, and phone/iPad use. It explicitly describes the lack of persistent unfinished drafts and cross-device resume.

## Verification

Checked with the isolated local mock; no live signup, client submission or email was sent:

- First-time approved adviser signs in and reaches the welcome page.
- Empty name is rejected; valid fictional details and a teal brand colour save successfully.
- Delivery validation retains checkbox choices. Saving adviser copy on/client copy off preserves those values on the final checklist, dashboard and reusable guide.
- Team can be skipped. Four active links appear, Mortgage copy produces the expected URL, and Finish opens the adviser dashboard.
- All five tour chapters, Next/Previous/Replay, arrow-key tabs, Medical selector, and client/adviser + single/joint examples work. Next/Previous retain focus on the selected chapter after the panel changes.
- Phone (390px), tablet (768px) and desktop (1280px) layouts inspected, including light and dark themes; no horizontal page overflow observed.
- Reduced motion removes the tour animation. Normal motion is one finite 420ms entrance, with no autoplay.
- Typecheck, ESLint, production build and the 56 existing unit tests passed. These include form routing, adviser-only answer removal, branded email rendering and submission validation.

No database migration was required for the original welcome tour above.

Production deployment `dpl_HSkbg8hXmykxzXxdkufYQ44TP6Hn` was verified on 14 September 2026. Authenticated requests to all six setup pages, the dashboard and guide returned 200 with the expected content. Anonymous access to onboarding and the guide redirected to sign-in. The final checklist matched the owner's saved delivery preferences. All 135 imported advisers remained pending, with 540 inactive reserved forms; the email log remained at 30 entries before and after these checks.

## Practice details and contact guidance — 14 September 2026

Setup step 2 and Settings now share optional fields for the adviser's role, business website, location, client contact email, services and the clients they help. The existing FCA reference can also be edited in Settings; it is not published on the public form and is not an endorsement or verification. Website addresses without a scheme are normalised to HTTPS. Invalid URLs retain the rest of the form's entries so the adviser can correct them.

The client introduction, form and completion card display the published business contact links. Services, client focus and location are available in an expandable practice description. The profile's sign-in email is not exposed by the public resolver: only an explicitly supplied client contact email appears there. Sample mobile numbers in Ofcom's 07700 900000–900999 range are suppressed from call links. The owner's existing number is in that range; a real business number and website still need to be supplied. Existing stored values have not been overwritten.

The business website is a link only. No website crawl, content import, AI assistant or automatic knowledge ingestion is implemented. Descriptions are adviser-authored text, escaped during rendering.

Automatic and manual client PDF copies use a valid client contact email for replies, falling back to the account email. The client PDF contact uses the same reply address. Existing delivery preferences and adviser-only note redaction remain in place. No live emails were sent for this change; reply-address selection, URL validation and input limits are covered by unit tests.

The admin user list includes expandable practice details. Onboarding and **How it works** explain the responsibilities of advisers, clients and colleagues, plus when to contact the adviser or platform support. Support links use the existing configured support address and the alternate contact from the supplied policy. Mailbox monitoring and response times have not been verified or promised. The platform website link uses the configured app URL.

Migration `20260914003747_adviser_practice_contact.sql` adds three nullable profile fields and extends the public resolver. It was applied successfully to the existing Supabase project and included as Part 11 in `supabase/setup.sql`. The resolver keeps an empty search path, explicit public fields, approved-adviser/active-form checks, and an explicit exclusion for pending imports. Supabase's security-definer advisories are expected for this deliberately public, restricted resolver and the existing permission helpers; RLS remains enabled.

Verification: 59 unit tests and ESLint pass; production compilation and type validation pass. In the isolated browser preview, invalid website validation retained entries, a bare-domain website saved correctly, Settings edits appeared on the client form, and the admin panel displayed the same saved details. Phone, tablet and desktop widths had no horizontal document overflow. Light and dark layouts were inspected. No signup, invitation or real client submission was performed.

Production authenticated reads of all six onboarding pages, Settings, the dashboard, the guide and admin users returned 200 with the new fields/help content. Anonymous access to setup and the guide still redirected to sign-in. All four active owner forms resolve; 135 imported advisers and 540 reserved forms remain pending/inactive. The email log stayed at 30 entries. The scoped Vercel error-log scan returned no entries.
