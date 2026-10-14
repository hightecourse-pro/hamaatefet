---
name: deploy
description: How to ship any change to המעטפת — staging first, verified automatically, production only after the owner approves. Use for every code, SQL, or content change, and whenever asked to deploy, push, or release.
---

# Shipping a change

Two live environments. **Nothing reaches production without the owner saying yes.**

| | staging | production |
|---|---|---|
| URL | `https://hamaatefet-staging.vercel.app` | `https://hamaatefet.vercel.app` |
| Vercel project | `hamaatefet-staging` | `hamaatefet` |
| Supabase ref | `STAGING_REF` in `.env.deploy.local` | `PROD_REF` in `.env.deploy.local` |
| git branch | `staging` | `main` |
| holds | QA fixtures, safe to break | real members |

Credentials live in `.env.deploy.local` (gitignored): Supabase access token,
Vercel token, Resend key, project refs/ids. Every script in `tools/` reads it.

## The loop, every time

1. **Build it on `staging`.** Never commit to `main` directly.
2. **Deploy to staging:** `node tools/deploy.mjs staging` (Vercel CLI source
   deploy; Vercel builds with the project's own env). Wait for `LIVE`.
3. **Verify automatically** — see the checklist. Do not ask the owner to click
   through things a script can check.
4. **Report** what changed, what the checks found, what is still uncertain.
5. **Ask for approval to deploy to production.** Say plainly what production
   will get. Wait for a yes.
6. **Only then** merge `staging` → `main`, apply pending migrations to prod
   (`node tools/apply-migrations.mjs prod`), `node tools/deploy.mjs prod`, and
   run `node scripts/sanity/prod.mjs`. Report the tally.

Skipping step 5 is never acceptable, including for "tiny" fixes. An approval
covers the change it was given for, nothing else.

## Verification checklist

Always:

```bash
npm run lint && npx tsc --noEmit && npm run build
```

After EVERY staging deploy (sanity, not optional):

```bash
node scripts/sanity/staging.mjs
```

Then the regression suite against staging (resets the QA fixtures before and after):

```bash
E2E_BASE_URL=https://hamaatefet-staging.vercel.app npx playwright test
```

Matched to what changed:

- **UI or flow** — look at what rendered; a 200 with an empty card is broken.
- **Server actions / routes** — call them against staging, read the body.
- **Database** — after applying to staging, compare both schemas object by
  object (tables, columns, views, functions, policies, indexes, triggers).
- **Email** — outside production, mail only reaches `EMAIL_ALLOWLIST`. Confirm
  the gate blocked a real address rather than assuming.

After EVERY production deploy:

```bash
node scripts/sanity/prod.mjs
```

## Database changes

- A migration that has been applied is **never edited**; corrections are a new
  file with a later timestamp, applied to both environments.
- `tools/apply-migrations.mjs <env>` applies what `public._migrations` has not
  seen yet, in name order. Never run SQL by hand in the dashboard.
- `tools/sql-run.mjs <env> "<sql>"` for read-only checks.
- After a schema change: `npx supabase gen types typescript --project-id <ref>
  --schema public > src/types/database.ts` (needs `SUPABASE_ACCESS_TOKEN`).
- `tools/seed-fixtures.mjs staging` restores the QA accounts and the data the
  suite relies on. It refuses to run against production.

## Auth configuration

Supabase Auth (site URL, SMTP through Resend, Hebrew e-mail templates linking
to `/auth/confirm`) is set per environment by
`node tools/configure-auth.mjs <env> <site-url>`. Re-run it after changing a
template; never edit templates in the dashboard.

## Email

App e-mails go through Resend with `EMAIL_FROM` = "חד או פאן <noreply@opencode.org.il>"
for now (the owner, 14/10) — קוד פתוח's sending domain with חד או פאן's display
name. Outside production `EMAIL_ALLOWLIST` is the only way mail leaves.

## Specification

`docs/QA.md` describes the behaviour the suite checks. A change that affects it
updates the document in the same commit and the owner is told.
