/**
 * @file app.config.js
 * @description Expo environment configuration and iOS background course generation capabilities.
 */

module.exports = ({ config }) => {
  const googleScheme =
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID_REVERSE || '';

  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  const airbridgeAppName = process.env.AIRBRIDGE_APP_NAME || 'yeolo';
  const airbridgeAppToken = process.env.AIRBRIDGE_APP_SDK_TOKEN || '';

  const androidGoogleServices =
    process.env.GOOGLE_SERVICES_JSON || './google-services.json';
  const iosGoogleServices =
    process.env.GOOGLE_SERVICES_INFO_PLIST || './GoogleService-Info.plist';

  return {
    ...config,
    extra: {
      ...config.extra,
      // Direct app integration: this value is embedded in the public Expo configuration.
      myRealTripApiKey: process.env.MY_REAL_TRIP_API_KEY || '',
    },
    plugins: [
      ...(config.plugins || []),
      'expo-apple-authentication',
      [
        'react-native-maps',
        {
          iosGoogleMapsApiKey: googleMapsApiKey,
          androidGoogleMapsApiKey: googleMapsApiKey,
        },
      ],
      [
        'airbridge-expo-sdk',
        {
          appName: airbridgeAppName,
          appToken: airbridgeAppToken,
        },
      ],
    ],
    android: {
      ...config.android,
      config: {
        ...config.android?.config,
        googleMaps: {
          apiKey: googleMapsApiKey,
        },
      },
      googleServicesFile: androidGoogleServices,
    },
    ios: {
      ...config.ios,
      config: {
        ...config.ios?.config,
        googleMapsApiKey: googleMapsApiKey,
      },
      bundleIdentifier: 'com.yeolo-travel.app',
      usesAppleSignIn: true,
      entitlements: {
        ...config.ios?.entitlements,
        'com.apple.developer.applesignin': ['Default'],
      },
      googleServicesFile: iosGoogleServices,
      infoPlist: {
        ...config.ios?.infoPlist,
        UIBackgroundModes: [
          ...new Set([
            ...(config.ios?.infoPlist?.UIBackgroundModes || []),
            'processing',
          ]),
        ],
        BGTaskSchedulerPermittedIdentifiers: [
          ...new Set([
            ...(config.ios?.infoPlist?.BGTaskSchedulerPermittedIdentifiers ||
              []),
            'com.yeolo-travel.app.course-generation.*',
          ]),
        ],
        CFBundleURLTypes: [
          {
            CFBundleURLSchemes: ['yeolo', googleScheme].filter(Boolean),
          },
        ],
      },
    },
  };
};
