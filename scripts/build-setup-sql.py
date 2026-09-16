"""
Builds supabase/setup.sql: every migration in order, rewritten so the file
contains no `--` sequence (see pastesafe.py), under one explanatory header.

    python3 scripts/build-setup-sql.py
"""
import pathlib, re, sys
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from pastesafe import convert  # noqa: E402

ROOT = pathlib.Path(__file__).resolve().parents[1]
MIGRATIONS = ROOT / 'supabase' / 'migrations'
OUT = ROOT / 'supabase' / 'setup.sql'

TITLES = {
    '20250101000000_init.sql': 'Schema, RLS, triggers and public RPCs',
    '20250101000001_email_templates.sql': 'Default notification email templates',
    '20250101000002_storage.sql': 'Storage buckets and their policies',
    '20250101000003_onboarding.sql': 'Onboarding fields and the team roster',
    '20250101000004_admin_allowlist.sql': 'Admin allowlist (auto-approves the first admin)',
    '20250101000005_branding.sql': 'Adviser branding (colour check, adviser photo on public links)',
    '20250101000006_client_copy.sql': 'PDF copy to the client (preference and email template)',
    '20260912191541_harden_internal_functions.sql': 'Internal function access and fixed search paths',
    '20260913211513_restrict_factfind_writes_to_validated_server.sql': 'Require validated server writes for completed FactFinds',
    '20260913232741_stage_existing_advisers.sql': 'Private existing-adviser directory and reserved FactFind accounts',
    '20260914003747_adviser_practice_contact.sql': 'Adviser practice details and public business contacts',
}

HEADER = """/*
   ==========================================================================
   FactFind Pro  complete database setup
   Wealthy Advisers Club
   ==========================================================================

   HOW TO RUN
     Supabase dashboard -> SQL Editor -> New query -> paste this whole file
     -> Run. Takes a few seconds. Safe to run more than once.

   WHAT IT CREATES
     Tables      profiles, factfind_forms, factfind_submissions,
                 email_templates, email_log, activity_log, team_members,
                 admin_allowlist, adviser_imports
     Security    Row Level Security on every table, so an adviser can only
                 read their own submissions and only admins see everything
     Automation  a signup creates a pending profile; approving an adviser
                 provisions their four unique client FactFind links
     First admin terry@terry-blackburn.com is on the admin allowlist and is
                 approved automatically at signup (and approved now if the
                 account already exists). Add more with:
                 insert into public.admin_allowlist (email) values ('...');
     Public API  resolve_factfind_form() reads active adviser branding
     Submission  submit_factfind() is server-only; the app validates answers
                 against the Typeform-derived schemas before writing
     Onboarding  firm details, delivery preferences and the team roster the
                 six-step setup wizard writes to
     Branding    logo, photo and brand colour per adviser, used on client
                 pages and PDFs
     Client copy optional PDF copy emailed to the client on submission
     Storage     branding and submission-upload buckets

   AFTERWARDS
     Configure SUPABASE_SECRET_KEY on the server. Submissions require the
     validated server action; direct anonymous database writes are denied.
     Register through the app and verify your email. The named allowlisted
     operator is approved automatically; other advisers require approval.
     Use npm run preview:client for fictional local accounts and captured
     data. The legacy seed and direct password-reset helpers are disabled.

   NOTE ON COMMENTS
     This file deliberately uses block comments only. Some editors mangle the
     double-hyphen used for SQL line comments when text is pasted, which makes
     a comment parse as SQL and fail.

   This file is the files in supabase/migrations concatenated in order.
   If you use the Supabase CLI, prefer `supabase db push`.
   ==========================================================================
*/
"""

files = sorted(p for p in MIGRATIONS.iterdir() if p.suffix == '.sql')
missing = [p.name for p in files if p.name not in TITLES]
if missing:
    sys.exit(f'add a title for: {missing}')

parts = [HEADER]
for i, p in enumerate(files, 1):
    parts.append(f'\n/* {"=" * 23} PART {i} of {len(files)}  {TITLES[p.name]} {"=" * 23} */\n\n')
    parts.append(convert(p.read_text(encoding='utf-8')).rstrip() + '\n')
text = ''.join(parts)
assert '--' not in text, 'a double hyphen survived'
if '--check' in sys.argv:
    if not OUT.exists() or OUT.read_text(encoding='utf-8') != text:
        sys.exit('supabase/setup.sql is stale. Run python scripts/build-setup-sql.py')
    print(f'supabase/setup.sql matches all {len(files)} migrations')
else:
    OUT.write_text(text, encoding='utf-8', newline='\n')
    print(f'{OUT.relative_to(ROOT)}: {len(files)} migrations, {len(text.splitlines())} lines')

