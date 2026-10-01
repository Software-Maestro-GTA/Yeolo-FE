/**
 * @file jest.config.js
 * @description Expo tests including transformation of MSW ESM dependencies.
 */
module.exports = {
  preset: 'jest-expo',
  transform: {
    ...require('jest-expo/jest-preset').transform,
    '^.+\\.mjs$': 'babel-jest',
  },
  setupFilesAfterEnv: ['./jest.setup.js'],
  testPathIgnorePatterns: ['/__tests__/mocks/'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|react-native-svg|ky|parse-sse|msw|rettime|@open-draft/.*|@mswjs/.*|until-async)',
  ],
};
