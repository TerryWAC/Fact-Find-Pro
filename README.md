# FactFind Pro

Client fact-finding SaaS for UK mortgage &amp; protection advisers, under the **Wealthy Advisers Club** brand.

Advisers register, wait for admin approval, then receive four unique client-facing FactFind links
(Mortgage, Protection, Medical, Home). Every client submission is bound to the adviser whose link was used,
and advisers can only ever see their own.

> **Scope of this build.** This is the complete platform: authentication, approval workflow, roles, CRM,
> dashboards, database architecture, email infrastructure and a JSON-driven form engine. The FactFind
> **question sets are deliberately placeholders** — see [Adding real questions](#adding-real-questions).

---

## Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router, Server Actions, React 19) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 3 + shadcn/ui (Radix primitives) |
| Database / Auth / Storage | Supabase (Postgres, GoTrue, Storage) |
| Forms | React Hook Form + Zod |
| Email | Resend (optional) with a log-only fallback |
| Hosting | Vercel |

Brand palette: **black `#0A0A0A` · gold `#E5B45C` · white**, with full light and dark modes
(`next-themes`, system-aware, toggle in the top bar).

---

## Quick start

```bash
git clone <this-repo> && cd factfind-pro
npm install
cp .env.example .env.local     # fill in your Supabase keys

# Option A — local Supabase (recommended)
npx supabase start             # Postgres + Auth + Studio + Inbucket
npx supabase db reset          # applies migrations + seeds demo data

# Option B — hosted Supabase
npx supabase link --project-ref <your-ref>
npx supabase db push
# then paste supabase/seed.sql into the SQL editor

npm run dev                    # http://localhost:3000
```

### Demo accounts

Seeded by `supabase/seed.sql`.

| Email | Password | Role | Status |
| --- | --- | --- | --- |
| `terry@terry-blackburn.com` | `Terry@098!` | Admin | Approved |
| `admin@wealthyadvisorsclub.co.uk` | `FactFind2025!` | Admin | Approved |
| `james@hartleyfinancial.co.uk` | `FactFind2025!` | Adviser | Approved (7 submissions) |
| `sarah@meridianmortgages.co.uk` | `FactFind2025!` | Adviser | Approved (4 submissions) |
| `daniel@reidprotection.co.uk` | `FactFind2025!` | Adviser | **Pending** — approve to see the flow |
| `priya@shahwealth.co.uk` | `FactFind2025!` | Adviser | **Pending** |

An admin sees both the adviser workspace *and* the admin area, and gets their own four FactFind links —
so one admin login exercises the whole platform.

Sign in as an admin, approve Daniel, and his four FactFind links are provisioned automatically.

> ⚠️ These are development credentials in a committed file. Never seed them into production, and change
> the password after first sign-in (Settings → Password).

### SQL files, and when to run each

| File | When | Notes |
| --- | --- | --- |
| `supabase/setup.sql` | **First — always** | Whole schema in one paste: tables, RLS, triggers, RPCs, storage, email templates. Re-runnable. |
| `supabase/create-test-user.sql` | **Second** | Creates your admin login. Re-runnable — resets the password if the account exists. |

| `supabase/approve-user.sql` | When needed | Approves one account by email, provisions its links and confirms the address. Edit the email at the top. Re-runnable. |
| `supabase/seed.sql` | Optional, dev only | Demo advisers and submissions. Contains plaintext demo passwords, so never run it on production. |
| `supabase/migrations/*.sql` | CLI users | What `supabase db push` applies. `setup.sql` is these three concatenated. |

Both dashboard files use `/* ... */` block comments and contain no `--` sequence anywhere. SQL line
comments start with a double hyphen, which some editors and renderers turn into an en dash or silently
shorten when text is pasted — the comment then parses as SQL and the whole script fails on line 1.

### Adding a login to an existing database

To create (or reset) a single admin account without wiping data — useful on a project that is already
deployed — run `supabase/create-test-user.sql` in the Supabase SQL editor:

```bash
psql "$DATABASE_URL" -f supabase/create-test-user.sql
```

It is safe to re-run: an existing account has its password reset and its role re-applied, and an account
that already has FactFind links keeps its slug so links you have shared keep working. Edit the variables
at the top of the file to provision a different account.

---

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Anon / publishable key — all queries run under RLS |
| `SUPABASE_SERVICE_ROLE_KEY` | Recommended | Admin recipient lookup, email logging, adviser submission alerts. **Server-only.** |

**Using a platform integration instead?** The Vercel ↔ Supabase integration injects its own variable
names, so the app accepts these aliases and uses whichever it finds first:

| Setting | Names accepted (in order) |
| --- | --- |
| URL | `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_URL`, `SUPABASE_NEXT_PUBLIC_SUPABASE_URL` |
| Anon key | `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_PUBLISHABLE_KEY`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`, `SUPABASE_NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| Service key | `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SERVICE_KEY`, `SUPABASE_SECRET_KEY` |

Authentication is handled entirely server-side, so the app needs **no** `NEXT_PUBLIC_` Supabase variable —
the non-public names are read at runtime and work without a rebuild. You still need a deployment carrying
this version of the code.
| `NEXT_PUBLIC_APP_URL` | Recommended | Absolute base URL used to build client links and email links |
| `RESEND_API_KEY` | Optional | Enables real email delivery. Without it, emails are logged instead |
| `EMAIL_FROM` / `EMAIL_REPLY_TO` | Optional | Sender identity |
| `ADMIN_NOTIFICATION_EMAIL` | Optional | Comma-separated admin inbox for new registrations. Falls back to approved admin profiles |
| `NEXT_PUBLIC_SUPPORT_EMAIL` | Optional | Support address shown in the UI |

The app is fully functional without a mail provider: every notification is written to the server log **and**
the `email_log` table, visible at **Admin → Email Templates**.

---

## Architecture

```
src/
├── app/
│   ├── (auth)/                 Login, signup, forgot/reset password, pending approval
│   ├── (onboarding)/           Six-step setup wizard shown on first sign-in
│   ├── (dashboard)/            Authenticated shell (sidebar + topbar)
│   │   ├── dashboard/          Adviser dashboard — stats, recent activity, quick links
│   │   ├── links/              My FactFind Links (copy / open)
│   │   ├── submissions/[id]/   Submissions list + detail
│   │   ├── settings/           Profile, password, branding roadmap
│   │   └── admin/              Admin dashboard, user approvals, all submissions, email templates
│   ├── f/[type]/[slug]/        PUBLIC client-facing FactFind pages
│   └── auth/callback/          Supabase auth code exchange
├── components/
│   ├── ui/                     shadcn primitives
│   ├── layout/                 Sidebar, topbar, nav config
│   ├── forms/                  Form engine renderer (field renderer, step indicator)
│   ├── onboarding/             Setup wizard steps, progress bar, image picker
│   ├── submissions/            Table, filters, detail, answers renderer
│   ├── admin/                  Users table, filters, reject dialog
│   └── shared/                 Logo, stat cards, pagination, copy button, theme toggle
├── lib/
│   ├── supabase/               Browser / server / service-role clients + typed schema
│   ├── forms/                  Form engine: types, schemas, registry, runtime
│   ├── email/                  Templates, renderer, provider-agnostic sender
│   ├── auth.ts                 Session + role guards
│   ├── queries.ts              Dashboard aggregations
│   ├── submissions.ts          Search / filter / paginate
│   └── validations.ts          Zod schemas
├── middleware.ts               Session refresh + route gating
└── supabase/
    ├── migrations/             Schema, RLS, triggers, RPCs, email templates, storage
    ├── seed.sql                Demo users + submissions
    └── config.toml             Local Supabase config
```

### Database

| Table | Purpose |
| --- | --- |
| `profiles` | Application users (1:1 with `auth.users`). Holds `role`, `status`, `adviser_slug` |
| `factfind_forms` | One row per adviser per FactFind type — the four unique links |
| `factfind_submissions` | Client submissions, always bound to an adviser |
| `email_templates` | Configurable notification copy, editable without a deploy |
| `email_log` | Delivery audit trail (and the outbox when no provider is configured) |
| `activity_log` | Powers the "Recent activity" panels |
| `team_members` | Team roster captured during onboarding (not sign-ins — see `linked_profile_id`) |
| `admin_allowlist` | Emails that become approved admins automatically at signup — bootstraps the first admin |

Key database behaviour:

- **`on_auth_user_created`** → mirrors a new signup into `profiles` with `status = 'pending'` and a unique
  `adviser_slug` — unless the email is in `admin_allowlist`, in which case it is created as an approved
  admin with its four links provisioned immediately.
- **`on_profile_status_change`** → when status flips to `approved`, provisions the four `factfind_forms`
  rows automatically.
- **`resolve_factfind_form(type, slug)`** and **`submit_factfind(...)`** are `SECURITY DEFINER` functions
  granted to `anon`. Public FactFind pages go through these, so the tables themselves stay private and the
  browser never gets to name an adviser.

### Onboarding

An approved adviser lands on a six-step setup wizard the first time they sign in: welcome checklist, their
details, logo and headshot, where completed fact finds should go, their team, then their live client links.

- Every step can be skipped, and the welcome screen has an explicit escape to the dashboard — setup is
  never a trap.
- Progress is stored in `profiles.onboarding_step`, so closing the tab resumes where they left off.
- `profiles.onboarding_completed_at` gates the redirect; once set, the wizard stops appearing. Advisers can
  re-open it from **Settings → Re-run setup**.
- Image uploads go through a server action into the `branding` storage bucket, scoped to the adviser's own
  folder — no browser Supabase client, so no public keys are needed at build time.
- Replace the welcome banner by dropping artwork at `public/brand/onboarding-banner.png`; without it a
  typographic Wealthy Advisers Club lockup is rendered.

### Security model

- **RLS on every table.** Advisers read only rows where `adviser_id = auth.uid()`; admins read everything
  via a `SECURITY DEFINER` `is_admin()` helper (which avoids policy recursion on `profiles`).
- **Advisers cannot escalate.** The `profiles_update_own` policy pins `role` and `status` to their current
  values, so an adviser can edit their name but never approve themselves.
- **No public INSERT policy** on `factfind_submissions`. Submissions arrive exclusively through
  `submit_factfind()`, which resolves the owning adviser from the slug server-side. A client cannot post a
  submission onto someone else's account.
- **Middleware gating.** `getUser()` (not `getSession()`) revalidates the token on every request;
  unapproved users are held on `/pending`, non-admins are kept out of `/admin`.
- **Service-role key is server-only** and used solely for notification lookups and email logging.

---

## The form engine

FactFinds are pure data. A form is a `FormSchema`:

```ts
{
  type: 'mortgage',
  version: '1.0.0',
  title: 'Mortgage FactFind',
  steps: [
    {
      id: 'about-you',
      title: 'About you',
      fields: [
        { id: 'client_name',  type: 'text',  label: 'Full name', required: true, identity: 'client_name' },
        { id: 'client_email', type: 'email', label: 'Email',     required: true, identity: 'client_email' },
        { id: 'employment',   type: 'select', label: 'Employment status',
          options: [{ value: 'employed', label: 'Employed' }, { value: 'self', label: 'Self-employed' }] },
        { id: 'trading_years', type: 'number', label: 'Years trading', required: true,
          visibleWhen: { field: 'employment', operator: 'eq', value: 'self' } }
      ]
    }
  ]
}
```

Supported field types: `text`, `email`, `tel`, `number`, `currency`, `percent`, `date`, `textarea`,
`select`, `radio`, `checkbox`, `checkbox-group`, `yesno`, plus the presentational `heading`, `paragraph`
and `divider`.

The engine gives you, for free:

- Multi-step navigation with a progress bar and step indicator
- Per-step Zod validation generated from the schema (`stepValidationSchema`)
- Conditional fields via `visibleWhen` (`eq`, `neq`, `in`, `not_in`, `gt`, `lt`, `truthy`, `falsy`)
- A normalised `submission_data` payload with both a grouped, display-ready view and a flat answers map
- Automatic client-identity extraction through the `identity` marker

### Importing from Typeform

All four FactFinds are imported from the Wealthy Advisers Club Typeform templates, branching included, by
`scripts/import-typeform.mjs`:

| Form | Steps | Questions | Branching |
|---|---|---|---|
| Mortgage | 13 | 219 | adviser-only sections, joint case, dependants, CCJ, bankruptcy, purchase/remortgage, buy-to-let, will |
| Protection | 12 | 104 | adviser-only sections, joint case, dependants, will |
| Medical | 7 | 48 | "Yes → details" follow-ups on 14 health questions, parents deceased |
| Home | 5 | 30 | none |

```bash
# Full definition from the Create API (the UI export is lossy — it drops group contents and refs)
curl -s https://api.typeform.com/forms/<FORM_ID> -H "Authorization: Bearer <TOKEN>" > export.json
npm run import:typeform -- export.json medical      # writes src/lib/forms/schemas/medical.json
npm run verify:typeform -- export.json src/lib/forms/schemas/medical.json
```

The converter splits the form into steps (at "Section N:" headers, bare header statements, or — for a
template with no statements, like Medical — its Typeform question groups), turns groups into sub-headed
blocks, upgrades free-text fields to date / currency / number / email / tel where the title makes it
unambiguous (every upgrade is printed), marks the client's name, email and phone as the client identity, and
applies the branching as step- and field-level `visibleWhen` rules. "Yes → details, No → skip" rules are
translated mechanically; template-wide rules (adviser-only sections, joint case…) are declared per template
in the script's `LOGIC` map as intent, which also lets authoring slips in the source be left out rather than
reproduced. Medical has no email question in Typeform, so the converter adds one — the platform needs it to
deliver the submission — and reports it as an addition.

`verify:typeform` then proves the import is complete. It matches every Typeform question, group and note to
a schema field or step by ref (nothing missing, nothing invented beyond the declared additions), checks every
choice list label for label, checks required flags and help text, and simulates **every combination of
answers** to the fields the jump rules depend on through both Typeform's rules and the schema's visibility,
failing on any difference that is not in its documented-deviation list (and failing if a documented deviation
is never observed, so the list cannot go stale). Run it after every re-import; it exits non-zero on problems.

Conditions compose: `{ all: [...] }` / `{ any: [...] }`, and a whole step can carry `visibleWhen` (e.g. the
Applicant 2 section on a joint application). Skipped steps never appear in the progress bar or the payload.

To hand-write a question set instead, replace the schema file with a literal `FormSchema`, keep one field
marked `identity: 'client_name'` and one `identity: 'client_email'`, and set `placeholder: false`.

---

## Deployment — Vercel + Supabase

### 1. Supabase

1. Create a project at [supabase.com](https://supabase.com) and note the project ref.
2. Apply the schema:
   ```bash
   npx supabase link --project-ref <your-ref>
   npx supabase db push
   ```
   **No CLI?** Open the Supabase dashboard → **SQL Editor** → New query, paste the whole of
   [`supabase/setup.sql`](supabase/setup.sql) and run it. That single file is the three migrations
   concatenated in order, and it is safe to run more than once.
3. **Auth → URL Configuration**
   - Site URL: `https://your-domain.com`
   - Redirect URLs: `https://your-domain.com/auth/callback`
4. **Auth → Providers → Email**: enable email confirmations for production.
5. **Project Settings → API**: copy the project URL, `anon` key and `service_role` key.
6. **Your first admin is automatic.** `terry@terry-blackburn.com` is on the admin allowlist, so signing up
   through the app with that address creates an approved admin straight away — no one has to approve it. To
   allowlist another address:
   ```sql
   insert into public.admin_allowlist (email) values ('someone@yourfirm.co.uk');
   ```
   If email confirmation is switched on in Supabase Auth, the confirmation link still has to be clicked
   before the first sign-in.

### 2. Vercel

1. Import the repository at [vercel.com/new](https://vercel.com/new). Next.js is detected automatically.
2. Add the environment variables from the table above (Production, Preview and Development).
   Set `NEXT_PUBLIC_APP_URL` to your final domain.
3. Deploy. Build command `npm run build`, output handled by the Next.js adapter — no extra configuration.
4. After attaching a custom domain, update `NEXT_PUBLIC_APP_URL` and the Supabase redirect URLs to match,
   then redeploy so client links carry the right host.

### 3. Email (optional)

1. Create a [Resend](https://resend.com) API key and verify your sending domain.
2. Set `RESEND_API_KEY`, `EMAIL_FROM` and `ADMIN_NOTIFICATION_EMAIL` in Vercel.

Without these, notifications still fire — they're recorded in `email_log` and the server log instead of
being delivered.

### Troubleshooting

**"Something went wrong" straight after signing in.** Missing Supabase environment variables. The login
page renders without touching Supabase, so the failure only appears when you submit. Two usual causes:

- The variables are not set for the environment being served (check Production *and* Preview).
- They were added *after* the last build. `NEXT_PUBLIC_*` values are inlined when the app is **built**, so
  they stay undefined until a new deployment runs. The non-public aliases above avoid this, since they are
  read at runtime.

The login screen now detects this and names the missing variables instead of failing silently.

**Signing in bounces you back to the login page.** The account has no readable `profiles` row — either the
migrations were never applied, or RLS is blocking the user from reading their own row. The exact reason is
written to the server log, prefixed `[factfind]`.

### Post-deploy checklist

- [ ] Sign up as a test adviser → you land on `/pending` and cannot reach `/dashboard`
- [ ] The admin inbox receives (or `email_log` records) the registration alert
- [ ] Approve the adviser → four links appear on **My FactFind Links**
- [ ] Open a public link in a private window, submit → it appears under that adviser's submissions only
- [ ] A second adviser cannot see the first adviser's submissions

---

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:start` | Start local Supabase |
| `npm run db:reset` | Re-apply migrations and reseed |
| `npm run db:push` | Push migrations to the linked project |
| `npm run db:types` | Regenerate `database.types.ts` from the local database |

> **Typing note.** Everything in `src/lib/supabase/database.types.ts` is declared with `type`, never
> `interface`. supabase-js constrains the schema to `Record<string, unknown>`, and interfaces have no
> implicit index signature — using one silently resolves every query result to `never`.

---

## Roadmap

Deliberately stubbed, with the structure already in place:

- Protection, Medical and Home question sets (Mortgage is imported; run the converter on the other three)
- PDF / CSV export (the **Export** button currently copies the submission JSON)
- Adviser logo upload and custom branding (`branding` storage bucket and `profiles.logo_url` exist)
- In-app email template editing (templates are already database-backed and rendered dynamically)
- Client document uploads (`submission-uploads` bucket is provisioned and locked down)

---

© Wealthy Advisers Club. All rights reserved.
