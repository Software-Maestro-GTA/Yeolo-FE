jest.mock('@react-native-async-storage/async-storage', () => {
  const store = {};
  return {
    setItem: jest.fn(async (key, value) => {
      store[key] = value;
    }),
    getItem: jest.fn(async (key) => store[key] || null),
    removeItem: jest.fn(async (key) => {
      delete store[key];
    }),
    clear: jest.fn(async () => {
      Object.keys(store).forEach((key) => delete store[key]);
    }),
  };
});

jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn().mockResolvedValue(true),
    signIn: jest.fn().mockResolvedValue({
      data: { serverAuthCode: 'mock-google-auth-code' },
    }),
  },
}));

jest.mock('react-native-maps', () => {
  const mockReact = require('react');
  const { View: mockView } = require('react-native');
  const MockMapView = (props) => mockReact.createElement(mockView, props, props.children);
  const MockMarker = (props) => mockReact.createElement(mockView, props, props.children);
  const MockPolyline = (props) => mockReact.createElement(mockView, props, props.children);
  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMarker,
    Polyline: MockPolyline,
  };
});

jest.mock('react-native-webview', () => {
  const mockReact = require('react');
  const { View: mockView } = require('react-native');
  return {
    WebView: (props) => mockReact.createElement(mockView, props, props.children),
  };
});

jest.mock('expo-media-library', () => ({
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getAssetsAsync: jest.fn().mockResolvedValue({ assets: [] }),
  MediaType: {},
  AssetField: {},
  Query: {},
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
