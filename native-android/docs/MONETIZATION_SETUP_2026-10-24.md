# Monetization status — 25 October 2026

Implementation is in [draft PR #179](https://github.com/yurkenn/english-tales/pull/179), branch `codex/energy-premium`, integrated with master e89d75f. The original checkout and parallel work were preserved. This is the current status; older candidate evidence remains in the evidence directory as history.

## Available now

- **56 / 2.4.0-sandbox is available to internal testers**, verified in Play Console on 25 October at 12:22 TRT. [Install through Google Play](https://play.google.com/apps/internaltest/4701713728242169635).
- Energy and Premium screens are **enabled** in this signed sandbox build; service is staging `jukyylozahikjhtokayw`. Three daily new-story passes, permanent energy unlocks, free translation/review and server-authoritative rewards/subscriptions are implemented. No energy packs.
- Staging energy switch is enabled. Migration and three Edge Functions are deployed. RLS blocks direct client writes to all four new tables. Seven service settings were supplied through authenticated CLI. Credentials stay in ignored local files.
- Existing owner internal tester list is selected; the old 26-person list remains unselected. With explicit owner approval on 25 October, the emulator Google account was added to the same list (now two users). That list is selected for both internal access and Google Play license testing; saved counts and selections were re-read. Google applies license tester configuration developer-wide. Email addresses are omitted from repository evidence.
- Test ads only, telemetry disabled, Firebase initialization removed from this QA variant, and a persistent test notice is visible. Account sessions already namespace tokens by service URL. Reauthentication against the test project may be needed. The sandbox bundle must never be promoted to production.
- Production binary 52 / 2.3.1 and production backend were not changed. Play subscription prices were updated store-wide for new subscribers in the approved 19 countries. The production release flag remains off pending actual purchase/SSV acceptance and store setup.

## 26 October sandbox purchase acceptance

Root cause of missing Premium was RevenueCat **Sandbox testing access = Allowed App User IDs only with an empty list**. Purchases were correctly recorded but did not grant sandbox entitlements. Added only the current test account's app-user ID, keeping restricted access. The saved list has one item after reload. [RevenueCat policy](https://www.revenuecat.com/docs/projects/sandbox-access).

Verified Play sandbox annual purchase at TRY 699.99, six accelerated renewals and expiry; all nine annual lifecycle webhook requests returned HTTP 200. Then verified a monthly sandbox purchase at TRY 99.99. After the access-list fix, RevenueCat returned `premium` for `monthly:monthly-base`, the normal v5 webhook returned HTTP 200, staging stored an active expiry, and a cold app launch visibly showed **Premium · Sınırsız okuma**. [Purchase evidence](release-evidence/2026-10-24-monetization/play-yearly-sandbox-2026-10-26.json). On 26 October the owner restored after the monthly test subscription had expired at 00:56 TRT. The provider and freshly checked server retained the same past expiry; the app correctly showed 3 free passes. [Expired-restore evidence](release-evidence/2026-10-24-monetization/restore-expired-2026-10-26.json). Active-subscription restore, account-switch, pending/refund and watched-ad SSV acceptance remain separate checks.

A proposed product-mapping reconciliation was briefly deployed to staging v4 while investigating, then fully reverted before fixing the actual configuration. Both v5 functions use the original entitlement-only logic. No fallback remains in source or deployment. Claude's independent review identified the cross-app/API-contract risks of that proposal, reinforcing the decision to preserve provider authorization. [Review outcome](CLAUDE_MONETIZATION_SANDBOX_REVIEW_2026-10-26.md). Production binary/backend were not changed.

## Validation

- Local final enabled sandbox: signed APK/AAB build and sandbox lint passed. **6 API36 device tests, zero failures/errors/skips**; actual standalone launch screenshot also verified. [Candidate evidence](release-evidence/2026-10-24-monetization/sandbox-56.json).
- Current source 0bfa294: all checks green on CI 40180493316. Downloaded reports: **383 app-device + 3 startup + 3 service checks, zero failures/errors/skips**. JVM HTML and lint counts are in [CI evidence](release-evidence/2026-10-24-monetization/ci-40180493316.json). Local 148 JVM and 240 backend tests passed after master integration.
- Actual Claude CLI architecture review, backend implementation, independent final review and ten-language localization drafts are preserved in CLAUDE_MONETIZATION reports. All 29 strings are present across 12 UI languages; localization key/format checks passed. Native-speaker and RTL visual acceptance remain open.
- Non-debug instrumented tests needed a direct clock API bootstrap to retain the target's desugared clock surface in the test APK. Final tests passed; this test-runtime fix does not alter quota behavior.

## RevenueCat and Google Play

- Existing RevenueCat project `3344db47`, Play app `app894ba988f6`; `premium` entitlement has only Play monthly/yearly. Default `energy_premium_v1` offering has monthly and annual packages. Old default offering is reversibly inactive; historical products, entitlements and purchases were preserved.
- Sandbox-only webhook `whintgr450a31118f` targets staging and the existing Play app. Owner explicitly approved the shared authorization configuration. RevenueCat Send Test Event returned **HTTP 200 / ignored**. This proves authenticated delivery, not a purchase lifecycle.
- Publishing the enabled Billing-capable internal build unlocked the Play catalog. Existing `monthly:monthly-base` and `yearly:yearly-base` each have one active base plan. No replacement products are needed.
- [Approved 19-country price plan](REGIONAL_PRICING_2026-10-25.md): **38/38 monthly/annual prices saved and re-read after page reload**. Existing subscribers retain their legacy price; no cohort migration was started. Country availability and other-country prices were preserved.
- Privacy, deletion and subscription terms deployed to the existing `englishtales-app` Hosting site. All three public endpoints returned **HTTP 200 and exact source bytes**. [Hosting evidence](release-evidence/2026-10-24-monetization/hosting-verified.json). Firebase reauthentication completed without printing credentials.


## AdMob verification

Existing rewarded unit `ca-app-pub-6012481599277383/6069329647` now has reward `1 energy` and the staging SSV callback. Both settings were saved and re-read after reload. Google console verification succeeded: its signed test callback credited exactly one energy; replay returned `reward_acknowledged` and the wallet remained at one credit. A synthetic staging-only fixture was removed after verification; no real account was used. [SSV evidence](release-evidence/2026-10-24-monetization/admob-ssv-verified.json).

The console always uses numeric test unit `1234567890`; staging explicitly permits that unit alongside the real rewarded unit and Google sample unit. These test IDs must not enter production configuration. Sandbox 56 still uses sample ads; a watched-ad SDK flow is not yet accepted.

## Remaining work

1. Verify a watched rewarded ad on a registered test device using the real unit. An emulator-only, signed-sandbox operator probe is prepared and compiled; [runbook](REWARDED_SSV_DEVICE_PROBE_2026-10-26.md). It has not been executed. The unit/SSV configuration and Google console signed callback are accepted; sandbox 56 still uses Google sample ads.
2. Follow the [device acceptance steps](MONETIZATION_DEVICE_ACCEPTANCE_2026-10-25.md). Through the registered Play license test account verify buy, cancel, pending, restore, expiry/refund, account switching and server-verified entitlement. Verify the watched-ad callback grants exactly one reward; the console signed-callback and replay checks already passed.
3. Native-language/RTL acceptance, Play privacy disclosures, production backend deployment/config, legacy cutoff/backfill and staged production binary release remain separate gates. Owner has authorized completing setup; routine implementation does not require another approval.


## Limits and rollback

Public story APIs remain public: this is an app-enforced access model. Guest quota is durable on the device but can reset on reinstall. A release with no cached policy and an unavailable policy endpoint defaults to disabled. Existing account unlocks and unexpired cached premium reads work offline; uncached server operations require connection. Premium-created progress does not become a permanent free unlock.

Supabase advisor output includes intentional SECURITY DEFINER RPC and deny-all table observations plus a pre-existing leaked-password-protection warning. There is no zero-advisory claim. Server kill switch can disable new restrictions while retaining purchase/unlock history. Candidates 53 (disabled, predates current fixes), cancelled 54 and failed 55 are historical; only 56 was published to internal testers.
