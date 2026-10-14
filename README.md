# המעטפת – מבית חד או פאן

A members-only community site for women (Hebrew, RTL): sign-up with team approval,
the forum, המיליונרית hosting evenings, and the monthly חוגגות חודש טוב parties,
plus an admin area for the team. Built from the designs in
`../hamaatefet-claude-code/hamaatefet/design/`.

## Stack

- Next.js 16 (App Router, server actions, `proxy.ts`), React 19, Tailwind 4 for
  utilities + design tokens in `src/app/globals.css`.
- Supabase: Postgres + RLS, Auth (custom SMTP through Resend, Hebrew templates),
  Storage (`forum-images`, private, signed URLs).
- `@hebcal/core` for the Hebrew calendar (current month, date labels).
- Playwright E2E (`e2e/`), sanity scripts (`scripts/sanity/`), ops scripts (`tools/`).

## Local development

```bash
npm install
# .env.local points at the staging Supabase project (see .env.example)
npm run dev
```

Test accounts (staging only) are in `e2e/fixtures.json`; `node tools/seed-fixtures.mjs staging`
puts them in their canonical state.

## Layout

```
src/app/(auth)/      login · signup · forgot-password · reset-password · welcome · pending · terms
src/app/auth/        confirm (e-mail links land here) · signout
src/app/(app)/       home · forum · millionaire · birthday · profile  (active members)
src/app/(admin)/     admin: members · forum · millionaire · birthday · events (+ CSV exports)
src/app/api/         health · cron/birthday-reminders
src/lib/             auth (session + gating) · hebrew · events · email · supabase clients
supabase/migrations  schema, RLS, seed of known content
tools/               deploy · apply-migrations · sql-run · set-env · configure-auth · seed-fixtures
```

## Member states

`pending` (signed up, awaiting the team) → `active` (approved) ⇄ `paused`.
Admins are the addresses in `public.admin_emails`; a sign-up with one of them is
active + admin immediately. A member whose details are incomplete (invited by
the team) completes them at `/welcome` on first entry.

## Shipping

See `.claude/skills/deploy/SKILL.md`: staging first, verified by scripts,
production only on the owner's explicit approval. `DEPLOY.md` has the one-time setup.
