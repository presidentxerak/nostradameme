# Nostradameme

> The oracle never lies. Probably.

A binary prediction market game where users bet YES or NO on daily prophecies
about crypto asset prices. The experience is a dark oracle chamber with a
live character, a tug-of-war pool visualization, a live feed of bets,
dramatic reveals, and shareable prophecy cards.

Built with Next.js 15 (App Router), TypeScript strict mode, Tailwind,
Framer Motion, Supabase, Privy, xrpl.js, Transak, and @vercel/og.

---

## Local setup

### Prerequisites

- Node 20+
- pnpm or npm
- Supabase project (URL + anon + service role keys)
- Privy app (ID + secret)
- Transak account (staging or production API key)
- CoinGecko API key (optional; free tier works for dev)
- Vercel account (for deployment + cron jobs)

### Install and run

```bash
cp .env.example .env.local
npm install
npm run dev
```

Then apply database migrations against your Supabase instance:

```bash
# Using the Supabase SQL editor or psql against DATABASE_URL
psql "$DATABASE_URL" -f db/migrations/0001_extensions.sql
psql "$DATABASE_URL" -f db/migrations/0002_enums.sql
psql "$DATABASE_URL" -f db/migrations/0003_core_tables.sql
psql "$DATABASE_URL" -f db/migrations/0004_market_tables.sql
psql "$DATABASE_URL" -f db/migrations/0005_position_tables.sql
psql "$DATABASE_URL" -f db/migrations/0006_deposit_tables.sql
psql "$DATABASE_URL" -f db/migrations/0007_payout_tables.sql
psql "$DATABASE_URL" -f db/migrations/0008_leaderboard_tables.sql
psql "$DATABASE_URL" -f db/migrations/0009_admin_tables.sql
psql "$DATABASE_URL" -f db/migrations/0010_rls.sql
psql "$DATABASE_URL" -f db/migrations/0011_indexes.sql
psql "$DATABASE_URL" -f db/migrations/0012_views.sql
psql "$DATABASE_URL" -f db/seeds/dev_seed.sql
```

Open http://localhost:3000 to see the oracle chamber.

---

## Environment variables

All variables are validated through `lib/config/env.ts` with Zod.
Never reference `process.env` anywhere else in the codebase.

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_APP_URL` | Your public URL (used in share cards). |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client Supabase. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only Supabase. |
| `DATABASE_URL` | Direct Postgres connection for migrations. |
| `NEXT_PUBLIC_PRIVY_APP_ID` / `PRIVY_APP_SECRET` | Privy embedded accounts. |
| `NEXT_PUBLIC_TRANSAK_API_KEY` / `TRANSAK_SECRET_KEY` / `TRANSAK_ENV` | Transak widget. |
| `XRPL_TREASURY_SEED` / `XRPL_TREASURY_ADDRESS` | Server-only treasury keys. |
| `COINGECKO_API_KEY` / `COINGECKO_BASE_URL` | Price proxy. |
| `APP_MODE` | `play_money` or `real_money`. |
| `REAL_MONEY_ENABLED` | Master switch for real funds. |
| `BLOCKED_COUNTRIES` | Comma-separated ISO codes (default `FR`). |
| `CRON_SECRET` | Bearer token used by Vercel cron calls. |
| `FEATURE_ENABLE_PAYOUTS` | When false, on-chain payouts are skipped. |
| `FEATURE_ENABLE_ONRAMP` | When false, Add Funds is disabled. |
| `RESEND_API_KEY` | Optional, for notification emails. |

---

## XRPL treasury configuration

The treasury wallet is server-side only (`lib/treasury/xrpl.ts` starts with
`import "server-only"`). It is configured from `XRPL_TREASURY_SEED` and is
used to fund outgoing RLUSD payouts.

**Important:** never commit the seed. Store it in Vercel project
environment variables as a secret. In play-money mode
(`FEATURE_ENABLE_PAYOUTS=false`) the treasury is not touched.

To rotate the seed:

1. Generate a new XRPL account (off-line).
2. Fund it with enough XRP for the reserve plus a small operational buffer.
3. Acquire RLUSD from the issuer `rMxCKbEDwqr76QuheSUMdEGf4B9xJ8m5De`.
4. Update `XRPL_TREASURY_SEED` and `XRPL_TREASURY_ADDRESS` in Vercel.
5. Redeploy.

---

## Privy setup

1. Create a Privy app at https://dashboard.privy.io.
2. Enable the XRPL embedded wallet option.
3. Restrict login methods to `email`, `google`, and `apple`.
4. Copy the App ID and App Secret into environment variables.
5. Add your production domain to the allowed origins list.

After sign-in, the client calls `POST /api/auth/sync` which creates the
corresponding `profiles` row if needed.

---

## Transak setup

1. Create a Transak account and apply for an API key.
2. Start in `staging` mode by setting `TRANSAK_ENV=staging`.
3. Whitelist `nostradameme.com` for the widget.
4. Configure the webhook URL to `https://<your-domain>/api/webhooks/transak`.
5. Transak sends RLUSD to the treasury with the `partnerOrderId` set to
   your `deposit_intents.id`. The deposit matcher uses this memo to credit
   the correct user automatically.

The `+ Add Funds` button is only shown when `FEATURE_ENABLE_ONRAMP=true`.

---

## Supabase setup

1. Create a new Supabase project.
2. Run the migrations listed above (in numeric order).
3. Enable Row Level Security (the 0010 migration already does this).
4. Enable Realtime for the tables `positions`, `markets`, and
   `internal_wallet_ledger` in the Supabase dashboard under
   `Database → Replication`.
5. Copy the URL, anon key, and service role key into environment variables.

---

## Deposit detection

Deposit detection runs via Vercel cron every 2 minutes:

```
/api/cron/check-deposits
```

The cron handler (`lib/treasury/reconciliation.ts`):

1. Fetches recent incoming RLUSD payments to the treasury.
2. Loads all `deposit_intents` with `status = 'pending'`.
3. Calls `matchDeposit` which tries memo first, then amount + time window.
4. Updates the intent to `confirmed` and writes a `+amount` entry to
   `internal_wallet_ledger`, incrementing the user's balance.
5. Advances `app_settings.last_checked_ledger_index`.

Unmatched payments are logged but never silently discarded.

---

## Leaderboard cron

Leaderboard snapshots live in `leaderboard_snapshots` and are updated
by `/api/cron/update-leaderboard` (every hour). The cron:

- Computes an all-time ranking from `profiles`.
- Computes weekly + daily rankings from `payouts` since the period start.
- Replaces the existing snapshot rows for that `(period, period_start)`.

`/api/cron/update-oracle-titles` runs every 15 minutes and updates
`profiles.oracle_title` whenever win rate or total predictions changes the
computed title tier (see `lib/oracle/titles.ts`).

---

## Web Push notifications (free, browser + mobile PWA)

Players can opt in to receive a notification 15 minutes before each new
prophecy opens. The notification is delivered via the browser's native
Web Push API — no third-party service required, fully free at any scale.

### Generate VAPID keys (one-time)

```bash
npx web-push generate-vapid-keys
```

Add the output to your environment variables in Vercel:

```
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<public key>
VAPID_PRIVATE_KEY=<private key>
VAPID_SUBJECT=mailto:hello@nostradameme.com
```

### How it works

1. User opens Settings → toggles "Enable push notifications"
2. Browser asks permission → user accepts → subscription stored in
   `push_subscriptions` table (one row per device)
3. Cron `/api/cron/notify-upcoming-markets` runs every 5 minutes
4. When a slot opens within 15 minutes, the cron sends a push to every
   user with `notify_on_new_market = true` and a stored subscription
5. Email (Resend) is sent as fallback to opted-in users without a
   push subscription

### Costs

- Web Push: **0€** forever, unlimited
- Email (Resend free tier): **0€** up to 3 000 emails/month
- After: $20/month for 50 000 emails

---

## Feature flags

- `FEATURE_ENABLE_PAYOUTS=false` → payouts credit internal balances only.
- `FEATURE_ENABLE_ONRAMP=false` → the Add Funds button is disabled.
- `REAL_MONEY_ENABLED=false` + `APP_MODE=play_money` → completely isolated
  from the real treasury.

Start in play-money mode until you are fully operational.

---

## Testing

```bash
npm run test       # vitest unit + integration
npm run test:e2e   # playwright
npm run typecheck  # tsc --noEmit
```

---

## Responsible play

This is a prediction game. Play responsibly.
