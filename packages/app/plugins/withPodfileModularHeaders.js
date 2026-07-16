/**
 * @file withPodfileModularHeaders.js
 * @description Local Expo Config Plugin to automatically inject use_modular_headers! and deployment targets into the generated iOS Podfile.
 * @requirements REQ-11
 * @functional FUN-1
 * @api N/A
 * @author Antigravity Agent
 */
const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

module.exports = function withPodfileModularHeaders(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(config.modRequest.platformProjectRoot, 'Podfile');
      let podfileContent = fs.readFileSync(podfilePath, 'utf-8');

      // 1. Inject use_modular_headers! right after platform directive
      if (!podfileContent.includes('use_modular_headers!')) {
        podfileContent = podfileContent.replace(
          /platform :ios, (.*)/,
          `platform :ios, $1\nuse_modular_headers!`
        );
      }

      // 2. Inject IPHONEOS_DEPLOYMENT_TARGET enforcement right inside post_install block start
      if (!podfileContent.includes("config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '16.4'")) {
        const targetInsertion = `
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '16.4'
      end
    end
`;
        podfileContent = podfileContent.replace(
          /post_install do \|installer\|/,
          `$&${targetInsertion}`
        );
      }

      fs.writeFileSync(podfilePath, podfileContent);
      return config;
    },
  ]);
};
