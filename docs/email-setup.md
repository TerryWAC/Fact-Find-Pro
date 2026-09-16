# Resend setup and testing

The Resend key belongs in the server environment. Do not add it to a client component, a `NEXT_PUBLIC_` variable, or the repository. The admin interface displays configuration status without receiving the key.

## Configure

Set these in the ignored `.env.local` file for local development, or in the matching Vercel project's environment variables for deployment:

```dotenv
RESEND_API_KEY=
EMAIL_FROM="FactFind Pro <notifications@your-verified-domain.co.uk>"
EMAIL_REPLY_TO=your-support-address@your-verified-domain.co.uk
EMAIL_TEST_TO=your-approved-test-inbox@example.com
```

Use a key permitted to send from your sender domain. Verify that domain in Resend. The fallback `onboarding@resend.dev` sender is for limited testing, not client delivery. Restart local development after changing configuration; Vercel needs a deployment with the updated environment.

Automatic submission notifications also require the existing Supabase service-role key. Manual PDF copies use the signed-in user's authorized submission access. Adviser and client automatic copies now each honour their saved delivery preference.

## Test without sending

```sh
npm run email:test
npm run test:unit
```

The first command generates a sample HTML email and a valid PDF under `test-results/email-preview/`, without contacting Resend. It contains no client records. The unit tests cover configuration, request shape, attachments, transient failure retries, permanent failures, escaped template variables and branding. Browser tests use fake local credentials and never use a real mail key.

## Send one real test

```sh
npm run email:test -- --send --to your-approved-test-inbox@example.com
```

Alternatively set `EMAIL_TEST_TO` in `.env.local` and run `npm run email:test -- --send`. This is an explicit external send: use only the inbox you intend to test. The script reports Resend's message ID. Open the message and sample PDF in that inbox to verify delivery. Resend's `delivered@resend.dev` address can simulate delivery without sending to a real inbox; it still uses your sending quota.

In the application, an approved admin can open **Email templates → Email connection → Send test email**. The destination is fixed to that admin's authenticated email address. The key is never entered or returned through the page, and the test button is disabled until it is configured. The test is recorded in `email_log`.

## Delivery behaviour

- No key: metadata is logged only. Messages are not queued for later sending.
- Key configured: Resend must return a message ID before the application reports acceptance. Acceptance does not prove inbox delivery; no delivery webhook is implemented here.
- Temporary errors: one bounded retry uses the identical payload and idempotency key. Each request has a 10-second timeout. Permanent authentication and validation errors are not retried. A new manual send or a new CLI invocation is a new logical request.
- Logs include request and provider message IDs and attachment filenames; server logs do not print client email bodies or PDFs. Provider errors shown in the UI do not expose raw upstream responses.
- Client-copy email headers use the adviser's colour and company name. The existing branded submission PDF is attached, and replies go to the adviser.

No database migration is required. The existing `email_log` status `sent` is retained for compatibility and displayed as **Accepted**.

References: [Resend sending API](https://resend.com/docs/api-reference/emails/send-email), [idempotency](https://resend.com/docs/dashboard/emails/idempotency-keys), [test addresses](https://resend.com/docs/dashboard/emails/send-test-emails).
