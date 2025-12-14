const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */

const config = getDefaultConfig(__dirname);

// Firebase packages mix ESM/CJS entrypoints via `package.json#exports` which can
// lead to duplicate module instances in Metro ("Component auth has not been registered yet").
// Disabling package exports forces Metro back to mainFields resolution and fixes it.
config.resolver.unstable_enablePackageExports = false;

// Fix for @sanity/client/csm module resolution in React Native
// Use resolveRequest to redirect the CSM submodule import
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
    if (moduleName === '@sanity/client/csm') {
        return {
            filePath: path.resolve(__dirname, 'node_modules/@sanity/client/dist/csm.cjs'),
            type: 'sourceFile',
        };
    }
    if (originalResolveRequest) {
        return originalResolveRequest(context, moduleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;

