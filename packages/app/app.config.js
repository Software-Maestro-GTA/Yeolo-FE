/**
 * @file app.config.js
 * @description Dynamic Expo configuration file resolving Google client keys safely from local environment variables.
 * @requirements REQ-11
 * @functional FUN-1
 * @api N/A
 * @author Antigravity Agent
 */

const fs = require('fs');

module.exports = ({ config }) => {
  const googleScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID_REVERSE || '';

  const resolveFilePath = (envVar, defaultPath) => {
    if (envVar && !envVar.startsWith('@') && fs.existsSync(envVar)) {
      return envVar;
    }
    if (fs.existsSync(defaultPath)) {
      return defaultPath;
    }
    return undefined;
  };

  const androidGoogleServices = resolveFilePath(process.env.GOOGLE_SERVICES_JSON, './google-services.json');
  const iosGoogleServices = resolveFilePath(process.env.GOOGLE_SERVICES_INFO_PLIST, './GoogleService-Info.plist');

  return {
    ...config,
    android: {
      ...config.android,
      ...(androidGoogleServices ? { googleServicesFile: androidGoogleServices } : {}),
    },
    ios: {
      ...config.ios,
      ...(iosGoogleServices ? { googleServicesFile: iosGoogleServices } : {}),
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
