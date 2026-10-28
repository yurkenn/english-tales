# Rewarded SSV device probe — 26 October 2026

Status: **compiled, not executed**. This is operator-assisted SDK-to-staging verification, distinct from the ordinary app reward screen and consent acceptance. Production code/configuration and Play internal build 56 are unchanged.

The opt-in `GoogleRewardedSsvProbe` uses the existing real rewarded unit configured for **1 energy**, with the existing staging SSV URL. It refuses physical hardware and any non-sandbox/non-staging variant before requesting an ad. Google automatically treats Android emulators as test devices ([official guidance](https://developers.google.com/admob/android/next-gen/test-ads)). The operator must see a labeled test creative; do not proceed with an unlabeled ad or click an advertiser link.

## Prepare

1. Complete any account/purchase tests first: instrumentation starts a separate test Activity and may interrupt the currently open app. Do not wipe or reinstall the target app's user data.
2. In staging `jukyylozahikjhtokayw`, create a synthetic Auth fixture user with a unique UUID and a clear test-fixture metadata marker. Do not reuse a real learner or a Premium subscriber. No email/password or real purchase is needed for this SSV-only fixture.
3. In one operator SQL transaction, set the fixture's `request.jwt.claim.sub` and call `begin_ad_reward()` to reserve a fresh nonce. Do not write ad credits directly. Record the empty starting wallet and pending ticket count.
4. Compile the isolated test APK (already passed on 26 October):

```sh
JAVA_HOME=/Library/Java/JavaVirtualMachines/zulu-17.jdk/Contents/Home \
ANDROID_HOME=/Users/oguzyurken/Library/Android/sdk \
./gradlew :app:assembleSandboxAndroidTest -PsandboxDeviceTest=true -PadDeviceTest=true \
  -PreleaseVersionCode=56 -PreleaseVersionName=2.4.0
```

## Run and verify

Install only the sandbox **androidTest APK**, preserving the existing signed target app. Run this one class with instrumentation arguments `ssvFixtureUser` and `ssvTicketNonce`; neither is an access token. The test initializes the SDK in a fresh instrumentation process, shows the rewarded creative and waits for the operator to watch and close it. No automatic advertiser clicks or close-button guessing are used.

After the SDK reward callback, independently query staging: exactly one ticket must be credited, `ad_credits` must rise by one and the callback must come from Google's signed request to `admob-ssv`. Replaying that same signed callback must leave one credit and acknowledge the transaction. A successful SDK callback alone is not server-credit acceptance.

Save sanitized results and a screenshot. Remove only the synthetic fixture user matched by both UUID and its test metadata marker, then confirm fixture wallet/tickets are gone. Keep personal account, Google Play session and purchase records intact.

## Limits

This probe bypasses the app's normal entry screen to isolate ad transport and SSV; it does **not** certify UMP consent, normal ViewModel polling or production deployment. The source is excluded unless `-PadDeviceTest=true`; ordinary CI has no network-ad dependency. A missing nonce, wrong variant or physical device is a hard error, not a skipped/pass result. If SDK loading, reward or signed callback fails, report that boundary precisely.
