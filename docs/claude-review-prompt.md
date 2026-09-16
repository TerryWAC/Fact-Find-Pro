# Prompt for Claude or another code reviewer

Review the attached FactFind Pro source for Terry's UK adviser fact-finding platform. First read `CLAUDE.md`, `docs/handover-findings-2026-09-15.md`, `docs/readiness.md`, and `tests/fixtures/typeform/README.md`.

Audit the existing implementation before changing it. Focus on:

1. Fidelity to the four saved Typeform originals: question wording, choices, required flags, help text, conditional sections and the explicitly approved corrections. Do not change the reference snapshots to match the application.
2. Adviser/client, joint/single, dependants, CCJ/bankruptcy, mortgage purpose/BTL count, medical follow-ups, GP reachability and will routing. Include blank answers, switching answers, hidden stale values and server validation.
3. Authentication, onboarding, pending/approved/suspended/import-pending accounts, admin permissions and isolation between advisers. Distinguish choosing Adviser in a questionnaire from authentication to saved records.
4. Adviser/client PDF audience separation, branded email rendering, recipient selection, reply-to, delivery preferences, idempotency, failure reporting and retries. Test only with the local disabled/captured provider.
5. Prepared-adviser migration: identify the secure activation work still needed. Do not release dormant accounts or invite anyone.
6. Responsive layout, keyboard/error-summary focus, review/edit behaviour, rapid taps, per-question motion and reduced-motion support.
7. Handover, migration-history reconciliation, backups including Auth/Storage objects, missing operational ownership and limitations that block a wider launch.

For each actionable finding, include severity, exact file/function, a reproduction, user impact and a proposed fix. Distinguish confirmed bugs, missing functionality, accepted business decisions and things that need a real provider/device test. State which checks you actually ran and which you could not run. Do not claim the app is 100% ready based on historical reports.

The read-only review should finish with a prioritised remediation plan and the smallest useful next set of tests. Do not deploy, publish a repository, change production settings, send emails, invite users, alter retention or migrate live data. Implementation can follow the owner's next instruction.
