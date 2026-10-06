/**
 * @file jest.setup.js
 * @description Global native-module mocks for isolated @yeolo/app Jest tests.
 */

jest.mock('@react-native-async-storage/async-storage', () => {
  const store = {};
  return {
    setItem: jest.fn(async (key, value) => {
      store[key] = value;
    }),
    getItem: jest.fn(async (key) => store[key] || null),
    getMany: jest.fn(async (keys) =>
      Object.fromEntries(keys.map((key) => [key, store[key] ?? null])),
    ),
    setMany: jest.fn(async (entries) => {
      Object.assign(store, entries);
    }),
    removeMany: jest.fn(async (keys) => {
      keys.forEach((key) => {
        delete store[key];
      });
    }),
    removeItem: jest.fn(async (key) => {
      delete store[key];
    }),
    clear: jest.fn(async () => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
  };
});

jest.mock('@react-native-clipboard/clipboard', () => ({
  __esModule: true,
  default: { setString: jest.fn() },
}));

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn().mockResolvedValue(true),
    signIn: jest.fn().mockResolvedValue({
      data: { serverAuthCode: 'mock-google-auth-code' },
    }),
    signOut: jest.fn().mockResolvedValue(null),
  },
}));

jest.mock('expo-apple-authentication', () => ({
  signInAsync: jest.fn().mockResolvedValue({
    authorizationCode: 'mock-apple-auth-code',
    identityToken: 'mock-apple-id-token',
  }),
  AppleAuthenticationScope: {
    FULL_NAME: 0,
    EMAIL: 1,
  },
  AppleAuthenticationButton: 'AppleAuthenticationButton',
  AppleAuthenticationButtonStyle: {
    BLACK: 0,
    WHITE: 1,
  },
  AppleAuthenticationButtonType: {
    SIGN_IN: 0,
  },
  isAvailableAsync: jest.fn().mockResolvedValue(true),
}));

jest.mock('react-native-maps', () => {
  const mockReact = require('react');
  const { View: mockView } = require('react-native');
  const MockMapView = (props) =>
    mockReact.createElement(mockView, props, props.children);
  const MockMarker = (props) =>
    mockReact.createElement(mockView, props, props.children);
  const MockPolyline = (props) =>
    mockReact.createElement(mockView, props, props.children);
  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMarker,
    Polyline: MockPolyline,
    PROVIDER_GOOGLE: 'google',
    PROVIDER_DEFAULT: 'default',
  };
});

jest.mock('react-native-webview', () => {
  const mockReact = require('react');
  const { View: mockView } = require('react-native');
  return {
    WebView: (props) =>
      mockReact.createElement(mockView, props, props.children),
  };
});

jest.mock('expo-media-library', () => {
  class MockQuery {
    eq() {
      return this;
    }
    orderBy() {
      return this;
    }
    limit() {
      return this;
    }
    exe() {
      return Promise.resolve([
        {
          id: 'asset-1',
          getLocation: () =>
            Promise.resolve({ latitude: 37.5665, longitude: 126.978 }),
          getCreationTime: () => Promise.resolve(Date.now()),
        },
      ]);
    }
  }

  return {
    requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    getAssetsAsync: jest.fn().mockResolvedValue({ assets: [] }),
    MediaType: { IMAGE: 'photo' },
    AssetField: { MEDIA_TYPE: 'mediaType', CREATION_TIME: 'creationTime' },
    Query: MockQuery,
  };
});

jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest
    .fn()
    .mockResolvedValue({ status: 'granted' }),
  launchImageLibraryAsync: jest.fn().mockResolvedValue({
    canceled: false,
    assets: [{ uri: 'https://example.com/mock-avatar.jpg' }],
  }),
  MediaTypeOptions: { Images: 'Images' },
}));

const mockAnalyticsLogEvent = jest.fn();
const mockAnalyticsLogScreenView = jest.fn();
const mockAnalyticsSetUserId = jest.fn();
const mockAnalyticsSetUserProperty = jest.fn();
const mockAnalyticsSetUserProperties = jest.fn();
const mockGetAnalytics = jest.fn(() => ({}));

jest.mock('@react-native-firebase/analytics', () => {
  const defaultExport = () => ({
    logEvent: mockAnalyticsLogEvent,
    logScreenView: mockAnalyticsLogScreenView,
    setUserId: mockAnalyticsSetUserId,
    setUserProperty: mockAnalyticsSetUserProperty,
    setUserProperties: mockAnalyticsSetUserProperties,
  });
  defaultExport.getAnalytics = mockGetAnalytics;
  defaultExport.logEvent = mockAnalyticsLogEvent;
  defaultExport.setUserId = mockAnalyticsSetUserId;
  defaultExport.setUserProperties = mockAnalyticsSetUserProperties;
  defaultExport.setUserProperty = mockAnalyticsSetUserProperty;

  return {
    __esModule: true,
    default: defaultExport,
    getAnalytics: mockGetAnalytics,
    logEvent: mockAnalyticsLogEvent,
    setUserId: mockAnalyticsSetUserId,
    setUserProperties: mockAnalyticsSetUserProperties,
    setUserProperty: mockAnalyticsSetUserProperty,
  };
});

const mockAirbridgeTrackEvent = jest.fn();
const mockAirbridgeSetUserID = jest.fn();
const mockAirbridgeClearUserID = jest.fn();
const mockAirbridgeSetUserAttribute = jest.fn();
const mockAirbridgeRemoveUserAttribute = jest.fn();

jest.mock('airbridge-react-native-sdk', () => ({
  Airbridge: {
    trackEvent: mockAirbridgeTrackEvent,
    setUserID: mockAirbridgeSetUserID,
    clearUserID: mockAirbridgeClearUserID,
    setUserAttribute: mockAirbridgeSetUserAttribute,
    removeUserAttribute: mockAirbridgeRemoveUserAttribute,
  },
  AirbridgeCategory: {
    SIGN_IN: 'airbridge.user.signin',
    SIGN_UP: 'airbridge.user.signup',
    SIGN_OUT: 'airbridge.user.signout',
    COMPLETE_TUTORIAL: 'airbridge.user.completeTutorial',
    SHARE: 'airbridge.share',
    ORDER_COMPLETED: 'airbridge.ecommerce.order.completed',
  },
}));
