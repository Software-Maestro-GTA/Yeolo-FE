/**
 * @file jest.config.js
 * @description Jest configuration for @yeolo/app package.
 * @requirements REQ-11
 * @functional FUN-1
 * @api API-FB-1
 * @author Antigravity Agent
 */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'node',
  testEnvironmentOptions: {
    customExportConditions: ['node', 'react-native'],
  },
  modulePaths: [
    '<rootDir>/node_modules',
    '<rootDir>/../../node_modules'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/__tests__/mocks/'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|msw|@mswjs|rettime|@open-draft|ky)',
    '/[\\/]node_modules[\\/](?!(jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|msw|@mswjs|rettime|@open-draft|ky)'
  ],
  transform: {
    '^.+\\.[jt]sx?$': 'babel-jest',
    '^.+\\.mjs$': 'babel-jest',
  },
  moduleNameMapper: {
    '^msw/node$': '<rootDir>/../../node_modules/msw/lib/node/index.js',
    '^msw$': '<rootDir>/../../node_modules/msw/lib/core/index.js',
  }
};
