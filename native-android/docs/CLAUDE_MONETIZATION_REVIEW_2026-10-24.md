# Claude bağımsız mimari incelemesi

24 Ekim 2026; read-only Claude Code oturumu: f130fa57-b8d9-4f34-86d9-317919679279

Bu çıktı öneridir. Nihai ürün sözleşmesi MONETIZATION_PLAN_2026-10-24.md belgesindedir. Özellikle premium açılışlarının kalıcı ücretsiz erişime dönüşmesi önerisi kabul edilmedi; CI ve eski yayın iddiaları bu inceleme ile doğrulanmış sayılmaz.

# Energy, rewarded ads and premium: implementation plan

This was a read-only review. I didn't edit, build or run anything, and I didn't open any credential, env or signing files.

## Decisions you need to make first

1. **This reverses an earlier product decision.** `native-android/docs/QUALITY_ROADMAP.md:207` (17 Oct) says the only revenue is completion ads, with no subscription or premium. `ROADMAP_2026_Q4.md:106` defers premium as well. Both docs need updating when we start.
2. **Energy is an entitlement ledger, not a lock on the content.** Anyone can read published stories, sentences and translations with the public key (`202610100001_content.sql:161-181`, `20261016090000_translation_tables.sql:39-45`). Six stories also ship inside the app in `catalog/v1.json`. Truly locking content would mean changing those access rules, which would break guest reading, offline downloads, the content backup and restore tools, and story links. **Recommendation:** keep content public for now. The server is the authority on unlocks, ad credits and premium; the app enforces the gate. Content locking can be a separate phase later.
3. **Guests have no server identity.** Anonymous sign-ins are off (`backend/supabase/config.toml:28`), and guest data lives only in the local database (`english_tales.db`). **Recommendation:** guests get a local-only energy ledger (3 per day, UTC). There are no rewarded ads or purchases for guests: show "sign in to earn more energy or go premium". Turning on anonymous auth would ripple through `GuestTransfer.kt` and `DeletedAccountCleanup.kt`, which is too much risk for this change.
4. **What "permanently unlocked" means.** **Recommendation:** a story counts as unlocked if the server has an unlock for it **or** the local database already has any progress on it. That covers today's users (no backfill race), guest transfer (progress comes across) and offline reopen. The cost is that a tampered client could fake progress, but content is public anyway, so that's acceptable.
5. **Unlocks are keyed by `story_id`, not revision.** When a story gets a new revision, users shouldn't pay again. `stories.id` is `text` (`content.sql:33`).
6. **Premium unlocks after premium ends.** **Recommendation:** record an unlock (`source='premium'`) for every story opened while premium, so access survives a lapse. That's generous, and simpler. The alternative is to treat premium-only opens as temporary.
7. **Opening a new story while offline.** **Recommendation:** a signed-in user needs a connection to unlock a new story (one server RPC). Reopening needs no connection. A charge-offline-and-queue approach can be denied later by the server, which leaves the app in an inconsistent state.
8. **The daily reset is UTC midnight.** That doesn't match the study-day and streak logic, which uses the learner's time zone (`LearningPolicy.dayKey`). For example, a Turkish learner gets new energy at 03:00 local time. The UI should show the reset time.
9. **Account deletion and active subscriptions.** Deleting the Supabase account (`delete-account/handler.js`) doesn't cancel a Play subscription. We need a warning in the delete dialog and on the web delete page. Optionally the handler can also delete the RevenueCat customer.

## Backend

### New migration: `backend/supabase/migrations/20261025100000_energy_premium.sql`

It follows the pattern of `20261021140000_quest_chests.sql`: `security definer`, `set search_path=''`, `auth.uid()` only, an advisory lock per user, `revoke all` then grant to authenticated users, and private helpers.

**Tables**

| Table | Contents |
|---|---|
| `public.story_unlocks` | `user_id` (cascades on account delete), `story_id` (references `stories`), `source` (`energy` / `premium` / `grandfathered`), `unlocked_at`. Primary key `(user_id, story_id)`. Row-level security: users can read their own rows; nobody can write directly. |
| `private.energy_days` | `user_id`, `day date`, `spent int` (≥0), `ad_credits int` (between 0 and 3). Primary key `(user_id, day)`. |
| `private.ad_reward_grants` | `nonce uuid` (primary key), `user_id`, `day`, `issued_at`, `transaction_id text unique null`, `credited_at`. |
| `private.entitlements` | `user_id` (primary key), `premium_until timestamptz`, `product_id`, `store`, `rc_updated_at`. |
| `private.revenuecat_events` | `event_id` (primary key), `received_at`. Used for idempotency. |

**Functions**

- **`private.energy_state(p_user, p_now)`** returns `{day, free:3, spent, adCredits, adCap:3, balance, premium, premiumUntil, resetsAt}`. Taking `p_now` as a parameter lets tests cover the UTC boundary.
- **`public.get_energy_state()`** returns that state plus `unlockedStoryIds`.
- **`public.unlock_story(p_story_id text)`** checks, in order:
  1. The caller is signed in.
  2. The story is published and not archived (same check as the `story_read` policy).
  3. An existing unlock returns success with no charge.
  4. Premium (`premium_until > now()`) inserts a `premium` unlock.
  5. Otherwise, if the balance is above 0, it adds 1 to `spent` and inserts the unlock. If not, it raises `energy_exhausted` (`55000`).

  It's idempotent per `(user, story)`, so no request id is needed.
- **`public.begin_ad_reward()`** refuses for premium users or when `ad_credits` has already hit 3. It issues a nonce (limit about 5 open nonces per day to prevent farming) and returns it.
- **`private.credit_ad_reward(p_nonce, p_transaction_id, p_user)`** is callable only by the server-only service role. It checks that the nonce belongs to `p_user`, is unused and is less than about 1 hour old. Then it adds 1 to `ad_credits`, capped at 3 for the nonce's day. A duplicate `transaction_id` changes nothing.
- **`private.set_entitlement(...)`** is service-role only.
- **One-time backfill** inserts `grandfathered` unlocks from `public.user_story_progress`. This must stay a one-time migration step, not a trigger: progress events come from the client, so a trigger would let a client unlock anything.

**Keep energy out of `get_learning_snapshot`.** The strict decoder in `LearningCloudSnapshot.kt` checks schema version and limits, and changing that contract is risky.

### Edge Functions

Add a block for each in `config.toml` with `verify_jwt=false`, because the callers are Google and RevenueCat, not app users. Each function checks its own caller.

**`functions/admob-ssv/`** (same handler/index split as `delete-account`)
- Server-side verification is a **GET** request. The function:
  - verifies the ECDSA `signature` / `key_id` against Google's published verifier keys (cached, refreshed when it sees an unknown `key_id`)
  - checks `ad_unit` against the configured rewarded unit
  - checks `reward_amount==1` and that `timestamp` is fresh
  - reads the nonce from `custom_data` and the Supabase user id from `user_id`
  - calls `credit_ad_reward`
- It always answers 200 once verification has passed, so Google doesn't retry forever.
- **Risk:** the URL is public, so the signature check is the only real defence. Without it, anyone can mint energy.

**`functions/revenuecat-webhook/`**
- Compares the `Authorization` header to a shared secret in constant time.
- Deduplicates on `event.id`.
- **Doesn't trust the event body.** It re-fetches the customer from RevenueCat's REST API with the server secret key and calls `set_entitlement`. `app_user_id` must be the Supabase UUID; anonymous RevenueCat ids (`$RCAnonymousID`) are ignored.

### Backend tests

All run in PGlite, in the style of `tests/quest-chests.test.mjs` and `tests/account-deletion.test.mjs`.

- **`tests/energy.test.mjs`**:
  - 3 opens per day, the 4th is rejected
  - reset at 23:59:59 → 00:00:00 UTC
  - reopen is free
  - archived or unknown story is rejected
  - a non-signed-in caller is rejected
  - **owner isolation**: user B can't read A's unlocks, A's unlock doesn't count for B, and B can't consume A's nonce
  - ad credits cap at 3, a replayed `transaction_id` changes nothing, a stale or foreign nonce is rejected
  - premium is unlimited and leaves unlocks that survive a lapse
  - the backfill works
  - deleting the account removes everything
  - authenticated users can't call `private.*` directly
- **`tests/admob-ssv.test.mjs`**: a test ECDSA key, then tampered query, wrong unit, stale timestamp, unknown key id (refetch), replay.
- **`tests/revenuecat-webhook.test.mjs`**: bad secret, duplicate event, body says "active" but the REST lookup says expired, the trust-the-REST-lookup path, and an anonymous id.
- **`backend/tests/backend.test.mjs`**: add the new functions to the grant and privilege checks.

## Android

### The gate: one entry point, re-checked inside the reader

The reader is opened from four places in `ui/TalesApp.kt`:

- onboarding's recommended story (`:178`)
- MainTabs `onRead` / continue reading (`:186`)
- StoryDetail `onRead` and `onListen` (`:197`)

Story links (`:114`) go to the detail screen, which is fine. `LearningWidget.kt` doesn't open stories.

- Replace those navigations with a single `openReader(storyId, listen, revision)`. It calls `EnergyRepository.ensureUnlocked` and then navigates; if the user is out of energy, it shows an `EnergyGateSheet` (watch an ad / go premium / sign in).
- **Also guard inside the `reader/{storyId}` route (`:202`).** Restoring the back stack, process death or a future deep link would otherwise skip the check. Put the check before `content.download` and before `startReading` / `beginSession` (`:207`, `:215`), so no session gets recorded for a story that wasn't unlocked.
- The `reading-result` screen, practice, saved words, translations and review stay ungated, which keeps translations and review free.
- `retainedRevision`: reopening a pinned older revision counts as a reopen.

### New files

- **`data/Energy.kt`**:
  - a pure `EnergyPolicy` (gate decision, UTC day, local guest ledger)
  - `EnergyRepository`, which calls the RPCs over the existing authenticated HTTP path used by `QuestChests.kt` / `LeagueViewModel.kt`, with owner and scope checks so a slow response can't land on another account (same idea as the `syncEpoch` guard in `LearningViewModel`)
- **`ui/EnergyUi.kt`**: energy pill and gate sheet. Strings go in `values/` first, which is fine because missing translations are only a lint warning (`build.gradle.kts:162`).
- **`ads/RewardedEnergyAds.kt`**: the next-gen SDK `RewardedAd` (`ads-mobile-sdk:1.5.0`, `build.gradle.kts:179`). It calls `begin_ad_reward`, then sets server-side verification options with `userId=uid` and `customData=nonce`. After the reward it **polls `get_energy_state`**; the reward callback on its own grants nothing. It goes through the existing UMP consent flow in `NativeCompletionAds.kt`.
- **`billing/Premium.kt`**: RevenueCat `purchases` SDK. Configure it with the public SDK key from a config file (that key isn't secret). Call `logIn(uid)` when the account changes and `logOut` on sign-out or delete. Purchases require a signed-in account. The device's own entitlement is display-only; the server decides what's unlocked.

### Changes to existing files

**`data/LearningDatabase.kt` (`:130`, version 10 → 11)**
- Add an `energy_cache` table for this owner: day, balance, premium-until, last-fetched time.
- Add a `local_unlocks` table for the guest ledger and as an offline mirror of server unlocks.
- Export schema 11.
- Each owner already has a separate database file, so isolation comes for free.
- Don't add these to guest transfer capture (see decision 4).

**`app/build.gradle.kts:46-54`**
- Add `REWARDED_UNIT_ID` and a RevenueCat key to `config/ads.properties` or a new `config/billing.properties`.
- Debug builds use Google's sample rewarded unit.
- **Risk:** `:52` currently rejects the old rewarded unit id `…/6069329647` on purpose. Create a fresh rewarded unit with server-side verification turned on rather than reusing that one.
- The `performance` build type sets billing and ads off.

**Premium removes ads**
- When premium is active, `LocalCompletionAds` becomes `CompletionAds.None` (see `CompletionAds.kt`, `TalesApp.kt:92`).
- `AdPolicy.kt` itself doesn't change; its interstitial caps are separate from rewarded ads.

**`LearningViewModel` / `TalesApp`**
- Refresh the energy state on resume, alongside the existing content refresh.
- Clear the energy cache on owner switch.

**`AccountScreen.kt`, `web/delete-account.html`, `web/privacy.html`**
- Subscription warning on delete, and a disclosure of the purchase data shared with RevenueCat.

### Android tests

- **JVM**: `test/.../data/EnergyPolicyTest.kt` (UTC boundary, progress counts as unlocked, premium, guest ledger) and extend `AdPolicyTest.kt` so premium means no interstitial reservation.
- **Device**:
  - `LearningStoreTest` for the 10→11 migration with existing progress
  - `AccountSwitchTest` for an energy response arriving after an account switch, which must be discarded
  - `GuestTransferTest` to confirm transferred progress means the stories are unlocked
  - a reader-route guard test that opens `reader/x` directly with no unlock
- **Ad probe**: extend `src/adProbe` with the sample rewarded unit.
- CI doesn't run `connectedDebugAndroidTest`, so the device tests need a manual run.

## Phases (each a separate PR)

1. Migration, backend tests and docs. No app change.
2. Android energy gate (server for signed-in users, local for guests) plus the Room migration.
3. Rewarded verification: Edge Function, AdMob unit, app flow.
4. RevenueCat: products, webhook, paywall, delete and privacy changes.
5. Play Console work: subscription products, Data safety (purchases), ads declaration, testers on the internal track.

## Other risks

- The UTC reset is confusing for users who aren't on UTC, so show the countdown.
- AdMob and RevenueCat dashboard setup (callback URL, webhook secret, products) lives outside the repo and can't be verified from source. Add it to `PRODUCTION_SETUP.md`.
- A RevenueCat `logIn` that is late or missing can attach a purchase to the wrong id. Block the purchase button until `logIn(uid)` has completed for the current owner.
- **Existing users:** decide whether the six bundled stories start unlocked for everyone, so first-run offline still works. I recommend yes.
- Release setup is already pending: two items in memory (the GitHub release secrets for Q2.4, and removing the DE/FR/es-ES Play listings) should be finished before this ships.