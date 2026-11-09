# Claude backend uygulama raporu

Oturum: 0edc6f40-5918-459a-a1b7-6ace1b353209

The backend is implemented and all 225 backend tests pass, including 24 new ones. Nothing was deployed, committed, or run against a live system.

One thing to clean up: I couldn't delete the `node_modules` symlink I made in `native-android/backend/` because `rm` was denied. Git sees it as untracked because the `node_modules/` ignore rule only matches folders. Please run `rm native-android/backend/node_modules` before staging, or leave it there to run the tests.

## Files (all under `native-android/backend/`)
- `supabase/migrations/20261024172439_energy_premium.sql` (filled in, same name)
- `supabase/functions/_shared/http.js` and `_shared/revenuecat.js`: shared helpers (timeouts, size limits, no redirects, safe error codes, RevenueCat lookup)
- `supabase/functions/admob-ssv/`, `premium-sync/`, `revenuecat-webhook/`: each has `handler.js` (works in Node) and `index.ts` (Deno)
- `supabase/config.toml`: `verify_jwt = false` for the three new functions
- `tests/energy.test.mjs` (12 tests, PGlite) and `tests/monetization-handlers.test.mjs` (12 tests, using real P-256 signatures)
- `tests/backend.test.mjs`: the existing security-inventory test now expects 37 tables instead of 33, and checks search path and grants on the 11 new functions. I changed no learning/outbox contracts and no content RLS.

## API contract for Codex (differences in bold)
- **`get_energy_state()`** returns `{day, balance, adCredits, adCap:3, premium, premiumUntil, resetsAt, enabled, unlockedStoryIds}`.
  - **`enabled` is new.** It is the server kill switch and is **off by default** (`private.energy_settings.enabled`). An operator must turn it on with SQL.
  - Times use the format `YYYY-MM-DDTHH:MM:SS.mmmZ`, which `Instant.parse` reads.
- **`unlock_story(id)`** returns the state plus `allowed` and `reason`.
  - **New reason `'disabled'`** (always `allowed:true`, nothing spent) when the kill switch is off.
  - Check order: already unlocked → disabled → premium → energy → exhausted. Exhausted returns `allowed:false`, not an error.
  - A story that isn't published, or is archived, raises `story_unavailable` (P0002), even if it was unlocked before.
- **`begin_ad_reward()`** returns `{nonce}`.
  - Errors (SQLSTATE 55000, told apart by message): `energy_disabled`, `premium_active`, `ad_limit_reached`.
  - When paid plus open tickets reach 3, it hands back the newest open nonce instead of a new one. A user who starts a second ad while one callback is still pending can therefore lose that reward; Android should show "pending verification" and avoid starting another ad then.
- `credit_ad_reward` and `set_premium_entitlement` can only be called by the server (service role). `set_premium_entitlement` ignores timestamps equal to or older than the stored one, and refuses deleted or anonymous accounts.
- **`POST /functions/v1/premium-sync`**: send the user's bearer token and an empty body (up to 64 bytes). It returns the `get_energy_state` JSON. Errors: 401 `sign_in_required`, 403 if an `Origin` header is present, 503 `premium_unavailable`.
- A nonce is only credited on the UTC day it was issued, so an ad watched just before midnight and confirmed by Google after it earns nothing.

## Settings to configure (names only)
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (provided by Supabase)
- `ADMOB_REWARDED_AD_UNIT_IDS`: comma-separated; either the numeric unit ID or the full `ca-app-pub-…/123` form works
- `ADMOB_REWARD_ITEM` (default `energy`) and `ADMOB_REWARD_AMOUNT` (default `1`). The AdMob unit's reward settings must match these.
- `REVENUECAT_SECRET_API_KEY`, `REVENUECAT_APP_ID`, `REVENUECAT_WEBHOOK_AUTHORIZATION` (the full header value, e.g. `Bearer …`)
- `REVENUECAT_ALLOW_SANDBOX=true` only on test backends

On Android, call `setUserId(<supabase uuid>)` and `setCustomData(<nonce>)` in the AdMob server-side verification options. In RevenueCat, use the Supabase UUID as the user ID before any purchase.

## Limitations
- **Ad callbacks:** they are sent to the server-only `credit_ad_reward` RPC; the signature check runs locally only. Bad signatures or invalid fields get a 400. Valid callbacks the database refuses get a 200, so Google stops retrying. Outages get a 503.
- **Google signing keys:** they are fetched from the fixed gstatic URL and cached for 6 hours, not stored in the code. I didn't download the real keys because live requests were off-limits.
- **RevenueCat lookups:**
  - Premium is granted only for a Play Store or promotional subscription that isn't refunded and isn't sandbox (unless allowed).
  - The account must be the RevenueCat customer itself, or its anonymous pre-login ID.
  - Expiry is the entitlement's expiry or grace-period expiry, whichever is later.
  - A missing expiry (lifetime) grants nothing.
  - RevenueCat's v1 subscriber data has no app ID, so app matching only happens on webhooks (`app_id`).
- **Webhooks:** they ignore the event's expiry and aliases and look the account up again.
  - TEST events, events from another app, and sandbox events (unless allowed) get a 200 and do nothing.
  - For transfers, both accounts are looked up. If the source account can't be read, its premium is removed and a 503 asks RevenueCat to retry.
  - At most 6 accounts per event; lookups use an 8s timeout and 3 attempts.
- **Old reading progress:** the migration gives permanent access once for stories with existing progress. Readers who start new stories after deploy but before the switch is turned on get nothing automatically. An operator can run `select private.backfill_legacy_story_unlocks();` again right before enabling.
- **Not tested:** real Deno runtime, two connections racing at once (PGlite has one connection; the per-user lock is the safeguard), and live Google, RevenueCat or Supabase calls.
- **Account deletion:** it removes all four new tables but does not cancel any store subscription.