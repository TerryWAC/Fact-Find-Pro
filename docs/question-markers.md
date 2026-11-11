# "Optional" question markers (per-adviser setting)

Every question card on a FactFind shows a small marker: **Required** for the handful of questions a client must answer, **Optional** for the rest. Alfredo Laurio (Supreme Financial Solutions) reported on 11 November 2026 that a client read "Optional" as permission to skip and answered only a few questions, and asked for the marker to be left off his forms. The owner approved this for his links only.

## What changes for an adviser with the setting on

- Optional questions show no marker at all. Required questions still say **Required**.
- Nothing becomes mandatory: the required flags come from the question set and are unchanged, so a client can still send the form with the same answers as before. Server-side validation is identical.
- The setting applies to all four of the adviser's links and to the admin preview of their forms. Every other adviser's forms are unchanged.

## How it is stored and applied

- `profiles.hide_optional_markers` (migration `20261111140000_question_markers.sql`), default `false`. `resolve_factfind_form` returns it with the link, like branding, so the public page needs no extra lookup.
- The public page passes it to the form; `QuestionCard` drops the "Optional" marker when it is set. Before the migration has run the field is absent and the marker is shown.

To turn it on or off for an adviser, update their profile row:

```sql
update public.profiles set hide_optional_markers = true
where lower(email) = 'alfredo.laurio@supremefinancialsolutions.co.uk';
```

There is no self-service toggle in adviser Settings; it is an admin decision per adviser.

## Tests

`tests/e2e/question-markers.spec.ts`: the preview's default link shows both markers; the `focused` link (an adviser with the setting on) shows Required only, and the same two required answers are all that block the Applicant 1 page.
