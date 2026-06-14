# Cup Sync

Digitizes daily tea/coffee deliveries from vendors to offices — replacing paper
delivery registers with digital logging, automatic effective-dated billing, and
per-office tracking.

## Stack

- **Next.js 15** (App Router) + **React 19** + **TypeScript**
- **MongoDB** via **Mongoose**
- **Auth.js / NextAuth v5** (Credentials provider, JWT sessions, role on token)
- **Tailwind CSS** + **shadcn/ui**-style primitives
- Deployable on **Vercel** + **MongoDB Atlas**

## Roles

| Role | Access |
|------|--------|
| `super_admin` | Platform owner — vendors, trials, subscriptions, stats |
| `vendor` | Paying customer — employees, offices, products, rates, deliveries, bills |
| `employee` | Logs deliveries for assigned offices only (never sees pricing) |
| `office` | Tracks own servings & bills; receives daily summary email |

Data is isolated per vendor — almost every collection carries a `vendor` ref and
every server read/mutation re-checks role + vendor scope.

## Requirements

- **Node 18+** (developed on Node 22). This repo uses ESM + Next 15.
- A MongoDB instance (local `mongod` or MongoDB Atlas).

> Note: if your default `node` is older, use nvm: `nvm use 22`.

## Setup

```bash
# 1. Install dependencies
npm install --legacy-peer-deps

# 2. Configure environment
cp .env.example .env.local
#   then edit values (a working local default is already provided)

# 3. Seed the Super Admin
npm run seed

# 4. (Optional) seed demo data — a login for each role
npm run seed:demo

# 5. Run the dev server
npm run dev
```

App runs at http://localhost:3000.

### Demo logins (after `npm run seed` + `npm run seed:demo`)

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `admin@cupsync.app` | `ChangeMe!123` |
| Vendor | `ramesh@example.com` | `teastall123` |
| Employee | `emp1@example.com` | `emp12345` |
| Office | `off1@example.com` | `off12345` |

> Cup Sync uses its own database (`cupsync_app`) to avoid colliding with any
> other app on your MongoDB instance.

### Daily summary email (cron)

A daily job emails each office its delivery summary at **22:00 IST**.

- Endpoint: `/api/cron/daily-summary`, secured by `CRON_SECRET`.
- Scheduled by Vercel Cron at **16:30 UTC = 22:00 IST** (see `vercel.json`).
  Vercel automatically sends `Authorization: Bearer $CRON_SECRET`.
- Trigger manually: `curl "http://localhost:3000/api/cron/daily-summary?secret=$CRON_SECRET"`
  (add `&date=YYYY-MM-DD` to backfill a specific day).
- If `SMTP_*` is not configured, emails are **previewed** (logged, not sent) so
  the job is testable locally. Every attempt is recorded in `DailyEmailLog`.

## Environment variables

| Var | Purpose |
|-----|---------|
| `MONGODB_URI` | MongoDB connection string |
| `AUTH_SECRET` | Auth.js JWT signing secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Public base URL (e.g. `http://localhost:3000`) |
| `SUPER_ADMIN_NAME` / `SUPER_ADMIN_EMAIL` / `SUPER_ADMIN_PASSWORD` | Seed credentials |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `EMAIL_FROM` | Email (Phase 8) |
| `CRON_SECRET` | Secures the daily-summary cron route (Phase 8) |

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run seed` | Create/update the Super Admin |
| `npm run seed:demo` | Create demo vendor/employee/office with sample logins |

## Build phases

1. **✅ Scaffold** — Next.js + TS + Tailwind tokens + Mongoose + Auth.js w/ roles + Super Admin seed
2. **✅ Vendor signup** + 14-day trial + read-only trial gating
3. **✅ Vendor dashboard shell** + employee & office management (with office logins)
4. **✅ Products** + effective-dated per-office rates (price history)
5. **✅ Employee app**: assignments + daily delivery logging (price snapshot)
6. **✅ Office dashboard**: day-wise / monthly tracking + activity log
7. **✅ Billing engine** + monthly bill PDF + filterable reports (CSV export)
8. **✅ Daily 22:00 IST summary email** (secured cron route + email + send log)
9. **✅ Super Admin**: vendor/subscription management + platform stats
10. **✅ Polish**: responsive, empty/loading/error states, i18n scaffolding (en/hi/gu)

## Security

Cup Sync is multi-tenant; tenant isolation is the top priority.

- **Tenant scoping:** every domain query filters by the session's `vendor` (and
  `office`/`employee` where relevant) — never by id alone. The scoping id comes
  only from the server session, never from the request. **IDOR-tested:** Vendor A
  cannot read another vendor's office via the bill PDF, bill/rates pages, or
  reports — no cross-tenant data is ever returned.
- **AuthZ on the server, every time:** middleware routes by role; every page,
  server action, and route handler re-checks role + ownership via `lib/guard.ts`.
  Hiding UI is never the control.
- **Employees never receive pricing** — the logging screen and APIs return
  product names/quantities only; prices are snapshotted server-side.
- **Passwords:** bcrypt cost 12, `select:false`, never returned or logged.
- **Brute force:** login lockout after repeated failures (`lib/rate-limit.ts`,
  in-memory; swap for Redis/Upstash in multi-instance production).
- **Input validation:** Zod on every mutation; client-supplied IDs validated as
  ObjectIds (`lib/ids.ts`) to prevent NoSQL injection; no mass assignment.
- **Cron** secured by `CRON_SECRET`; **trial gating** enforced server-side.
- **Headers:** HSTS, CSP, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`
  (see `next.config.mjs`); `x-powered-by` disabled.
- **Audit log:** logins, failed logins, lockouts, and super-admin actions are
  recorded (`AuditLog`), without sensitive payloads.

**`npm audit`:** the directly-exploitable nodemailer SMTP-injection advisories
are patched (we run nodemailer 7.x). Remaining advisories are transitive and not
in the runtime path — `@auth/core`'s bundled nodemailer (its unused Email
provider; we use Credentials) and Next's nested build-time `postcss` (operates on
our own trusted CSS). Their only npm "fix" is a bogus `next@9` downgrade.

**Deployment-time (not code) — do before launch:** restrict MongoDB Atlas network
access (no `0.0.0.0/0`), use a least-privilege DB user, enable backups, set a
strong `AUTH_SECRET`, and serve over HTTPS (Vercel does this automatically).

## Internationalization (i18n)

The app ships English copy but is built to switch languages. **English (`en`),
Hindi (`hi`), and Gujarati (`gu`)** are wired up, with a language switcher on the
public pages.

- Dictionaries live in `src/i18n/dictionaries/` — `en.ts` is the source of
  truth; `hi.ts`/`gu.ts` spread English and override what they translate, so any
  missing key falls back to English automatically.
- Locale is stored in the `cupsync_locale` cookie; `getDictionary()` /
  `getLocale()` (server) read it and `<html lang>` reflects it.
- To localize more screens, pass `getDictionary()` output into server components
  and add the keys to the dictionaries.

## Project structure

```
src/
  app/
    (auth)/login         # login page + client form
    (auth)/signup        # vendor signup (placeholder until Phase 2)
    admin|vendor|employee|office  # per-role dashboards (placeholders)
    api/auth/[...nextauth]        # Auth.js route handler
    layout.tsx, page.tsx, globals.css
  components/ui          # Button, Input, Label, Card (shadcn-style)
  lib/                   # db, roles, password, guard, utils
  models/                # Mongoose models (User in Phase 1)
  auth.ts                # Auth.js config (Credentials provider, Node runtime)
  auth.config.ts         # Edge-safe Auth.js config (used by middleware)
  middleware.ts          # Role-based route protection
scripts/seed.ts          # Super Admin seed
```
