# Deployment

Two Vercel projects (same team as קוד פתוח), two Supabase projects in two organizations (Supabase access tokens are organization-scoped, so `.env.deploy.local` holds one token per org – see tools/deploy-helpers.mjs). Deploys go
through the Vercel CLI from this folder (`tools/deploy.mjs`), so no GitHub
integration is required; git branches `staging` / `main` track what is where.

## One-time setup (done 14/10/2026)

| | staging | production |
|---|---|---|
| Vercel | `hamaatefet-staging` → https://hamaatefet-staging.vercel.app | `hamaatefet` → https://hamaatefet.vercel.app |
| Supabase | `hamaatefet-staging` – FREE org `hamaatefet-prod` (the account's single free slot; the other is קוד פתוח's staging) | `hamaatefet-production` – Micro in the Pro org (~$10/mo; the owner's cap) |

Steps for a new environment:

1. Create the Supabase project; put its ref (and DB password) in `.env.deploy.local`
   as `STAGING_REF` / `PROD_REF`.
2. `node tools/apply-migrations.mjs <env>`
3. `node tools/configure-auth.mjs <env> <site-url>`
4. Vercel env vars (`node tools/set-env.mjs <env> KEY VALUE [--secret]`):

| Variable | Notes |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | secret, server only |
| `NEXT_PUBLIC_APP_ENV` | `staging` / `production` (fail-closed: missing = staging) |
| `NEXT_PUBLIC_SITE_URL` | the public origin; used in e-mails and auth links |
| `RESEND_API_KEY` | secret – קוד פתוח's account for now |
| `EMAIL_FROM` | `חד או פאן <noreply@opencode.org.il>` |
| `EMAIL_REPLY_TO` | optional |
| `EMAIL_ALLOWLIST` | staging only: addresses mail may reach |
| `CRON_SECRET` | secret; Vercel sends it on the daily cron |

5. `node tools/deploy.mjs <env>` and the sanity script for that env.
6. Staging only: `node tools/seed-fixtures.mjs staging`.

## Day-to-day

See `.claude/skills/deploy/SKILL.md`.
