/**
 * @file patchExpoModulesJsi.js
 * @description Applies the SDK 57.0.3 Xcode 27 nested-build logging workaround after installation.
 */
const fs = require('node:fs');
const path = require('node:path');

// Xcode 27 can turn warnings in a successful nested `xcodebuild -quiet` into
// an error in the parent archive. Keep full diagnostics and the real exit code.
// https://github.com/expo/expo/issues/50311
const before =
  '    -configuration "$CONFIGURATION" \\\n    -quiet \\\n    -disableAutomaticPackageResolution';
const after =
  '    -configuration "$CONFIGURATION" \\\n    -disableAutomaticPackageResolution';

/**
 * Removes only the affected invocation's quiet flag; returns the patch status.
 * @param {string} packageRoot Installed expo-modules-jsi package directory.
 * @returns {'patched'|'already patched'|'different version'} Installation status.
 * @throws {Error} If the pinned package has an unexpected build script.
 */
function patchExpoModulesJsi(packageRoot) {
  const metadata = JSON.parse(
    fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'),
  );
  if (metadata.version !== '57.0.3') return 'different version';
  const filename = path.join(packageRoot, 'apple/scripts/build-xcframework.sh');
  const source = fs.readFileSync(filename, 'utf8');
  if (source.includes(before)) {
    fs.writeFileSync(filename, source.replace(before, after));
    return 'patched';
  }
  if (source.includes(after)) return 'already patched';
  throw new Error(
    'ExpoModulesJSI build script changed; review the Xcode 27 workaround.',
  );
}

if (require.main === module && process.platform === 'darwin') {
  const packageRoot = path.dirname(
    require.resolve('expo-modules-jsi/package.json'),
  );
  console.log(
    `[ExpoModulesJSI] Xcode 27 workaround: ${patchExpoModulesJsi(packageRoot)}`,
  );
}

module.exports = { patchExpoModulesJsi };
