# Claude localization review — 25 October 2026

Claude prepared all ten resource drafts. Its local CLI did not allow direct writes, so Codex applied the returned XML drafts after key and placeholder validation. No permission setting was weakened. These are AI translations; native-speaker review and RTL visual acceptance remain open.

Original Claude report (before Codex applied the drafts):

I couldn't create any files. This session is in don't-ask mode and it blocked every `Write` call and the `Bash` command. Nothing in the worktree changed, and I didn't run the Python check for valid XML and matching keys and placeholders.

**What I checked before writing:**
- The locale folders are `values-b+es+419`, `values-pt-rBR`, `values-in`, `values-ar`, `values-vi`, `values-hi`, `values-ru`, `values-bn`, `values-ur` and `values-th`.
- The source is `values-en/monetization.xml`, which has 29 strings. `values/monetization.xml` is the Turkish default.
- For tone I matched each locale's existing `strings.xml`: informal "tú" in Spanish, "você" in Portuguese, "Anda" in Indonesian, "вы" in Russian, "आप" in Hindi, "আপনি" in Bengali, "آپ" in Urdu, "คุณ" in Thai, "bạn" in Vietnamese, and standard Arabic.

**What the drafts contain:**
- All 29 keys, `%1$d`/`%1$s` placeholders and the number 3 are kept in every locale. "Premium" and "Google Play" are left untranslated.
- None of the strings contains an ASCII apostrophe, `&`, or a leading `@` or `?`, so no XML escaping is needed. "…" is kept as the single Unicode character.
- To avoid plural grammar problems, the remaining-passes count reads like "Passes left: %1$d" in Arabic, Russian, Bengali and Urdu.

**My review of meaning:**
- **Renewal** (`energy_renewal`): every locale keeps all four points: it renews automatically, for the selected period, at the store's price, until cancelled. It also says cancelling stops the next renewal and current access continues. In Thai I left out "until the end of the period" because the English doesn't say it.
- **Free vs. Premium:** reopening unlocked stories stays free in every locale. The Premium end date is worded as "access until".
- **Account deletion** (`energy_delete_warning`): every locale says deleting the account does not cancel the Google Play subscription, and that you must manage the subscription first to stop future payments. Russian says "go to Google Play subscription management" rather than "cancel", so it doesn't add an instruction the English doesn't give.
- **Verification** (`energy_pending`): worded as "pending, refresh to check again" everywhere. None of the wording suggests the purchase failed or will be refunded.
- **Refunds:** none of the source strings mention refunds, so I added nothing about them.
- **Dates:** `energy_reset` and `energy_premium_end` assume `%1$s` is a date, as the Turkish "tarihinde" suggests. If it's a weekday or a relative time, the Thai, Bengali and Hindi wording needs adjusting.

**Limits:** these are AI translations and still need review by native speakers. The existing localized `strings.xml` files also look machine-translated (Spanish mixes "tú" and "usted"), so they were a weak reference for tone.

To finish, allow `Write` (and `Bash` for the Python check) for this worktree, or re-run outside don't-ask mode. I'll then write the 10 files from these drafts and validate them. I won't commit.