---
name: upgrading-expo
description: Guidelines for upgrading Expo SDK versions and fixing dependency issues
version: 1.0.0
license: MIT
---

## Step-by-Step Upgrade Process

1. Upgrade Expo and dependencies

```bash
npx expo install expo@latest
npx expo install --fix
```

2. Run diagnostics: `npx expo-doctor`

3. Clear caches and reinstall

```bash
npx expo export -p ios --clear
rm -rf node_modules .expo
watchman watch-del-all
```

## Breaking Changes Checklist

- Check for removed APIs in release notes
- Update import paths for moved modules
- Review native module changes requiring prebuild
- Test all camera, audio, and video features
- Verify navigation still works correctly

## Prebuild for Native Changes

```bash
npx expo prebuild --clean
```

## Clear caches for bare workflow

- iOS: `cd ios && pod install --repo-update`
- Xcode: `npx expo run:ios --no-build-cache`
- Android: `cd android && ./gradlew clean`

## Housekeeping

- Review release notes at https://expo.dev/changelog
- SDK 54+: Install react-native-worklets for reanimated
- Enable React Compiler: `"experiments": { "reactCompiler": true }`
- Delete sdkVersion from app.json
- Remove implicit packages: @babel/core, babel-preset-expo, expo-constants

## Deprecated Packages

| Old Package | Replacement |
|-------------|-------------|
| expo-av | expo-audio and expo-video |
| expo-permissions | Individual package APIs |
| @expo/vector-icons | expo-symbols |
| AsyncStorage | expo-sqlite/localStorage |
| expo-app-loading | expo-splash-screen |
| expo-linear-gradient | CSS gradients in View |

## New Architecture

Enabled by default in SDK 53+. Remove `"newArchEnabled": true` from app.json.
