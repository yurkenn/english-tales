# Claude backend düzeltmeleri ve Android incelemesi

Oturum: ea1d585e-846f-47f6-a1e8-030340b262d3

# Backend fixes and Android monetization review

All four backend fixes are in, and **`npm test` passes 229 of 229** (up from 225). I edited the existing migration `20261024172439_energy_premium.sql` in place and added no new migration. I changed only three backend files: that migration, `tests/energy.test.mjs` and `tests/backend.test.mjs`. I made no Android or docs edits, no live calls and no deploy. The learning and content contracts are unchanged.

Codex was editing the Android files while I reviewed them. The review below covers the latest versions I read, which already call `cancel_ad_reward`, `get_energy_policy` and `pendingAdRewards`.

## Contract changes for Codex
- **`begin_ad_reward()`** still returns `{nonce}`, and each nonce is now promised to only one ad. Possible errors (all SQLSTATE 55000):
  - `pending_reward`: today's credits plus open tickets have reached 3, and at least one ticket is still open. This is new.
  - `ad_limit_reached`: all 3 of today's credits are used.
  - `energy_disabled` and `premium_active`, as before.
- **New `cancel_ad_reward(p_nonce uuid)`** returns `{cancelled: boolean}`. Only signed-in users can call it.
  - It deletes only your own ticket that hasn't been credited.
  - Someone else's ticket, an unknown nonce, a null nonce or a credited ticket all return `cancelled:false`, so it can't be used to check whether a ticket exists.
  - Never call it after the ad SDK reported a reward: that ad's callback would then be refused.
- **New `get_energy_policy()`** returns only `{enabled}`. Guests (anon) and signed-in users can call it. It reads no account data and grants nothing on the private settings table.
- **`get_energy_state()` and `unlock_story()`** return the same fields as before, plus a new **`pendingAdRewards`** (0–3): the number of open tickets that haven't expired.
- **Midnight:** a verified ad callback now counts on the UTC day it arrives, not the day the ticket was issued. Only tickets more than 1 hour old are refused (`expired`). The callback timestamp and signature checks are unchanged.
  - This is safe because today's credits plus open tickets never exceed 3. At midnight credits drop to 0 and open tickets can only decrease, so every open ticket always has room. No credit needs to be held back for later.
  - Limits still hold: at most 3 ad credits a day and a balance of at most 6. The `limit_reached` check is kept but can't be hit through the RPCs.
- **Replays:** a credited ticket can no longer be changed (a trigger blocks updates). A repeated callback after midnight returns `already_credited`.
- **Kill switch off:** opening a story is never limited (`reason:'disabled'`), even for a reader who has used all their energy.

## New tests
- One nonce per ad, `pending_reward` at the cap, and expired tickets freeing a slot.
- Midnight: a ticket from 23:xx pays once on the new day and still holds one of that day's 3 slots. A replay is acknowledged, not paid twice. Both caps stay at 3/6.
- Cancel: only the owner can cancel, a cancelled nonce can never be credited, and credited tickets can't be changed or cancelled. Anon calls are denied.
- Policy: guests and signed-in users get exactly `{enabled}`, and the private table is not readable.
- Permission list for the 7 energy functions (anon, authenticated and service role), plus a check that no private energy function can be called by clients.
- `backend.test.mjs`: the function count goes from 68 to 70. `get_energy_policy` is asserted to be the only energy function guests can call.

## Android review: high priority
1. **Premium reading can still become permanent access.** In `EnergyRepository.kt:56-63` with `TalesApp.kt:65`, an account's "legacy" list is filled the first time its energy file is read, from the stories it has progress in.
   - On a reinstall, a new device, or after cleared data, that progress includes stories read during premium. It then counts as permanently unlocked through `cached()`, line 82, and the check at `open()`, line 99.
   - **Fix:** for signed-in accounts, ignore the local legacy list; the server's `story_unlocks` legacy rows already cover it. For guests, fill it only once per device, gated on a marker from before the feature existed.
2. **A watched ad can lose its reward when the activity is destroyed.** `NativeCompletionAds.kt:46` calls `cancelReward` on destroy, which reports `finish(false)`. `MonetizationViewModel.kt:132` then calls `cancelReward(nonce)`, and the server later refuses the real callback as `unknown_ticket`.
   - **Fix:** report three outcomes: NOT_SHOWN (load failed, show failed, or a precondition failed), DISMISSED_NO_REWARD and INTERRUPTED. Cancel only on the first two; on INTERRUPTED, poll instead.
3. **The new error codes aren't handled.**
   - `MonetizationViewModel.kt:127` shows a generic error for every `beginReward` failure. Map `pending_reward` to the pending state and start polling; map `ad_limit_reached` to a refresh.
   - The checks at `MonetizationViewModel.kt:121` and `EnergyUi.kt:92` only look at `adCredits<3`. They should use `adCredits + pendingAdRewards < 3`.
4. **One `pending` flag is used for both ads and purchases.** `refresh()`, line 56, and `pollReward`, line 146, overwrite the purchase-pending flag set in `billing()`, line 105, on every resume. And when it's set, the refresh button in `EnergyUi` calls `refresh()` instead of `verifyPremium()`. Split it into `adPending` and `purchasePending`.
5. **A pending purchase shows as an error.** In `PremiumBilling.kt:43`, RevenueCat's `PaymentPendingError` comes back with `userCancelled=false`, so it's thrown as `billing_purchase`. Treat it as purchase-pending and check again with `syncPremium` on resume, with backoff.
6. **A new account shows 0 energy offline.** `EnergyRepository.kt:80` returns `EnergyState(0,0,…)` for an account with no cached server state, so the screen says "0 energy", and if the refresh fails it stays that way. Return `null` (unknown) and show an offline/retry state instead. Also, a cache whose `resetsAt` has passed should not show yesterday's balance.

## Android review: medium priority
7. **A network wait on every story open.** `authorize`, `MonetizationViewModel.kt:69`, calls `policy()`, which makes a network request, before the cached-unlock check. Offline, even an already-unlocked story waits for the network timeout. Check cached unlocks first, and use the cached policy value with a background refresh.
8. **The kill switch is assumed off when it's unknown.** `policy()` falls back to `false` (`EnergyRepository.kt:125`) on first run when the server can't be reached, so a guest offline has no limits. That may be an acceptable product choice, but it should be stated. Also, `authorize`, line 74, sets `policyEnabled=false` on any failure, which hides the paywall after a temporary error. Keep the previous value instead.
9. **Ad tickets are reserved before an ad is available.** `reward()` reserves a nonce before checking that the ad SDK can show one (`rewardEnergy`'s early-exit checks at `NativeCompletionAds.kt:119`). Check readiness first. The cancel at line 132 also runs after `busy=false`, so a quick second tap can hit `pending_reward`.
10. **Reward polling is short and can log a false verification.** `pollReward` gives up after 8×1.5 s, and `pendingAdRewards==0` (line 147) also fires `REWARD_VERIFY` when a ticket expired or was cancelled. Use backoff over about 2 minutes and log the verification only when `adCredits` or `balance` actually went up.
11. **Account isolation looks correct.** `bind` advances a generation counter and every result is checked against it. Each owner has its own file, deleted in `DeletedAccountCleanup`. The policy value cached in the guest file is global with no user data, so that's fine. `premiumReads` only works while premium is still valid, so it can't become permanent access.

One leftover from the first round: the `native-android/backend/node_modules` symlink is still untracked. Delete it before staging.