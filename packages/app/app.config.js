/**
 * @file app.config.js
 * @description Dynamic Expo configuration file resolving Google client keys safely from local environment variables.
 */

module.exports = ({ config }) => {
  const googleScheme =
    process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID_REVERSE || '';

  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

  const androidGoogleServices =
    process.env.GOOGLE_SERVICES_JSON || './google-services.json';
  const iosGoogleServices =
    process.env.GOOGLE_SERVICES_INFO_PLIST || './GoogleService-Info.plist';

  return {
    ...config,
    plugins: [...(config.plugins || []), 'expo-apple-authentication'],
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
        CFBundleURLTypes: [
          {
            CFBundleURLSchemes: [googleScheme].filter(Boolean),
          },
        ],
      },
    },
  };
};
