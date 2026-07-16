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

  return {
    ...config,
    ios: {
      ...config.ios,
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
