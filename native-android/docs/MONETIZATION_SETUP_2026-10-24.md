# Monetization status — 25 October 2026

Implementation is in [draft PR #179](https://github.com/yurkenn/english-tales/pull/179), branch `codex/energy-premium`, integrated with master e89d75f. The original checkout and parallel work were preserved. This is the current status; older candidate evidence remains in the evidence directory as history.

## Available now

- **56 / 2.4.0-sandbox is available to internal testers**, verified in Play Console on 25 October at 12:22 TRT. [Install through Google Play](https://play.google.com/apps/internaltest/4701713728242169635).
- Energy and Premium screens are **enabled** in this signed sandbox build; service is staging `jukyylozahikjhtokayw`. Three daily new-story passes, permanent energy unlocks, free translation/review and server-authoritative rewards/subscriptions are implemented. No energy packs.
- Staging energy switch is enabled. Migration and three Edge Functions are deployed. RLS blocks direct client writes to all four new tables. Seven service settings were supplied through authenticated CLI. Credentials stay in ignored local files.
- Existing single-owner internal tester list is selected; the old 26-person list remains unselected. That same owner list was selected for Google Play license testing and saved. Google applies license tester configuration developer-wide; no new email addresses were added.
- Test ads only, telemetry disabled, Firebase initialization removed from this QA variant, and a persistent test notice is visible. Account sessions already namespace tokens by service URL. Reauthentication against the test project may be needed. The sandbox bundle must never be promoted to production.
- Production Play 52 / 2.3.1 and production backend were not changed. The production release flag remains off pending actual purchase/SSV acceptance and store setup.

## Validation

- Local final enabled sandbox: signed APK/AAB build and sandbox lint passed. **6 API36 device tests, zero failures/errors/skips**; actual standalone launch screenshot also verified. [Candidate evidence](release-evidence/2026-10-24-monetization/sandbox-56.json).
- Current source 0bfa294: all checks green on CI 40180493316. Downloaded reports: **383 app-device + 3 startup + 3 service checks, zero failures/errors/skips**. JVM HTML and lint counts are in [CI evidence](release-evidence/2026-10-24-monetization/ci-40180493316.json). Local 148 JVM and 240 backend tests passed after master integration.
- Actual Claude CLI architecture review, backend implementation, independent final review and ten-language localization drafts are preserved in CLAUDE_MONETIZATION reports. All 29 strings are present across 12 UI languages; localization key/format checks passed. Native-speaker and RTL visual acceptance remain open.
- Non-debug instrumented tests needed a direct clock API bootstrap to retain the target's desugared clock surface in the test APK. Final tests passed; this test-runtime fix does not alter quota behavior.

## RevenueCat and Google Play

- Existing RevenueCat project `3344db47`, Play app `app894ba988f6`; `premium` entitlement has only Play monthly/yearly. Default `energy_premium_v1` offering has monthly and annual packages. Old default offering is reversibly inactive; historical products, entitlements and purchases were preserved.
- Sandbox-only webhook `whintgr450a31118f` targets staging and the existing Play app. Owner explicitly approved the shared authorization configuration. RevenueCat Send Test Event returned **HTTP 200 / ignored**. This proves authenticated delivery, not a purchase lifecycle.
- Publishing the enabled Billing-capable internal build unlocked the Play catalog. Existing `monthly:monthly-base` and `yearly:yearly-base` each have one active base plan. No replacement products are needed.
- [Approved 19-country price plan](REGIONAL_PRICING_2026-10-25.md). Monthly edits are being prepared in Play but have **not yet been committed with Save changes**. Annual edits have not started. Do not report the target prices as live until saved and re-read. Existing subscribers' legacy price cohorts must not be migrated as part of this change.

## Remaining work

1. Save and re-read both base plans' approved 19-country prices. Chrome native control currently needs a short pause in human browser activity; the pause request is pending. Existing old prices remain effective until the plan is saved.
2. Configure a real AdMob rewarded unit and SSV endpoint. Sandbox currently permits the Google sample unit only; test callback acceptance is still open.
3. Through the registered Play license test account verify buy, cancel, pending, restore, expiry/refund, account switching and server-verified entitlement. Verify an actual signed Google callback grants exactly one reward.
4. Hosting source/build for updated privacy, deletion and subscription terms is ready; subscription terms currently return 404 publicly. Firebase CLI authentication requires local reauthentication before deployment.
5. Native-language/RTL acceptance, Play privacy disclosures, production backend deployment/config, legacy cutoff/backfill and staged production release remain separate gates. Owner has authorized completing the setup; these are not routine approval stops.

## Limits and rollback

Public story APIs remain public: this is an app-enforced access model. Guest quota is durable on the device but can reset on reinstall. A release with no cached policy and an unavailable policy endpoint defaults to disabled. Existing account unlocks and unexpired cached premium reads work offline; uncached server operations require connection. Premium-created progress does not become a permanent free unlock.

Supabase advisor output includes intentional SECURITY DEFINER RPC and deny-all table observations plus a pre-existing leaked-password-protection warning. There is no zero-advisory claim. Server kill switch can disable new restrictions while retaining purchase/unlock history. Candidates 53 (disabled, predates current fixes), cancelled 54 and failed 55 are historical; only 56 was published to internal testers.
