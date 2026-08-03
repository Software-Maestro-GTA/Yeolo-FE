/**
 * @file app.config.js
 * @description Dynamic Expo configuration file resolving Google client keys safely from local environment variables.
 * @requirements REQ-11
 * @functional FUN-1
 * @api N/A
 * @author Antigravity Agent
 */

module.exports = ({ config }) => {
  const googleScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID_REVERSE || '';

  const androidGoogleServices = process.env.GOOGLE_SERVICES_JSON || './google-services.json';
  const iosGoogleServices = process.env.GOOGLE_SERVICES_INFO_PLIST || './GoogleService-Info.plist';

  return {
    ...config,
    android: {
      ...config.android,
      googleServicesFile: androidGoogleServices,
    },
    ios: {
      ...config.ios,
      googleServicesFile: iosGoogleServices,
      infoPlist: {
        ...config.ios?.infoPlist,
        CFBundleURLTypes: [
          {
            CFBundleURLSchemes: [
              googleScheme
            ].filter(Boolean)
          }
        ]
      }
    }
  };
};
