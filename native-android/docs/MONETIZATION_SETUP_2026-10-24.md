# Monetization implementation and acceptance status

Updated 25 October 2026. Source branch: `codex/energy-premium` in the attached energy-premium worktree. No source commit or PR has been created yet.

## Implemented and verified

- Product contract: [detailed plan](MONETIZATION_PLAN_2026-10-24.md). Daily 3 energy, new story costs 1, permanent energy unlocks, free translation/review, opt-in rewarded +1 up to 3/day, monthly/annual unlimited Premium. No energy packs.
- Actual Claude CLI architecture review, backend implementation, and final independent review are preserved in the three CLAUDE_MONETIZATION reports. Findings around pending purchases, midnight reservations, account isolation and legacy cutoff were addressed.
- Backend: 229 tests passed, including PostgreSQL-compatible PGlite migration/RPC tests and cryptographically signed SSV fixtures. Android: 148 JVM tests, 6 targeted API36 device tests, debug builds and lint passed with zero failures/errors/skips. These are targeted device checks, not a new full regression-suite acceptance.
- Signed release candidate 53 / 2.4.0 built successfully with monetization disabled. Hash/counts: [verification.json](release-evidence/2026-10-24-monetization/verification.json). Uploaded to Play internal draft preparation; the Save as draft action was taken, but the resulting persisted draft has not yet been rechecked. Not released to testers or production.
- Hosting build succeeded; privacy, account deletion and subscription terms source prepared. Hosting deployment remains open.

## External service state

- Supabase staging `jukyylozahikjhtokayw`: migration applied, four new public tables protected with RLS and no direct client grants; three Edge Functions ACTIVE (`premium-sync`, `admob-ssv`, `revenuecat-webhook`). Seven environment settings applied through authenticated CLI. Secrets are local ignored files and must never be committed or printed.
- Staging energy policy is disabled. Unauthenticated sync/webhook and invalid SSV requests reject as expected; authenticated TEST responds 200/ignored. [HTTP evidence](release-evidence/2026-10-24-monetization/staging-http.json).
- RevenueCat existing project `3344db47`, Play app `app894ba988f6`: new `premium` entitlement associated only with Play monthly/yearly. `energy_premium_v1` offering has monthly and annual packages and is default. Old default offering made inactive reversibly; historical products, entitlements and purchases preserved.
- Owner-approved sandbox webhook created 25 October: `whintgr450a31118f`, only the existing Play app and Sandbox environment. Destination is staging `revenuecat-webhook`; shared Authorization configured after explicit owner approval. RevenueCat Send Test Event returned HTTP 200 and `{code: ignored}`. This proves authenticated delivery, not a real purchase lifecycle.
- Turkey target prices approved by owner: monthly TRY 99.99, annual TRY 699.99. Prices are **not yet verified/saved in Google Play**. Other country pricing was not changed.
- Last live Console observation 24 October: production 52 / 2.3.1 available at 100%. This report does not infer a newer live release.

## Open acceptance gates

1. Recheck persisted Play internal draft 53 and billing-enabled product catalog; configure/verify the approved Turkey prices without changing other countries unintentionally.
2. Configure a real AdMob rewarded unit and SSV endpoint. Staging currently allows the Google sample test unit only.
3. Prepare a correctly targeted internal QA build; current 53 candidate has monetization disabled and is not an enabled sandbox acceptance build.
4. Through a license test account verify buy, cancel, pending, restore, expiry/refund, account switching and server-authoritative entitlement; verify actual signed Google SSV grants exactly one reward.
5. Complete source commit, draft PR and full CI. Publish terms/privacy and confirm Play Data Safety/ad disclosures before activation.
6. Deploy production backend/config only after sandbox acceptance, set explicit legacy cutoff/backfill, then approve a staged release and monitor reading retention plus revenue.

## Limits and rollback

Public story content remains publicly readable; this is an app-enforced access model, not a server-enforced content paywall. Guests keep durable device quota, which can reset on reinstall. When the global policy has never been fetched and no cache exists, policy lookup falls back to disabled; existing content remains readable. Account-scoped cached unlocks and non-expired premium reads work offline; uncached server operations require connection.

Supabase advisor reports include intentional SECURITY DEFINER RPC and deny-all table policy observations, plus a pre-existing leaked-password-protection warning. No claim of zero security advisories is made. No production backend migration/config activation was performed. Feature and server kill switch remain off. Historical purchases and story unlock records are preserved on rollback.

## Bölgesel fiyat hazırlığı — 25 Ekim

12 arayüz dili kaynak üzerinden doğrulandı. [19 ülkelik öneri ve uygulama sınırları](REGIONAL_PRICING_2026-10-25.md) hazır. Türkiye dışındaki fiyatlar öneri; bu turda mağazada fiyat değiştirilmedi. Canlı abonelik ekranında APK yükleme yönlendirmesi hâlâ mevcut; kataloğun açılması ayrıca çözülmeli.
