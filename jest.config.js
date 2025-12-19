module.exports = {
    preset: 'jest-expo',
    setupFilesAfterEnv: ['./jest-setup.js'],
    transform: {
        '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
    },
    transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|react-native-unistyles)',
    ],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '^expo-router$': 'expo-router/build/index',
    },
};
