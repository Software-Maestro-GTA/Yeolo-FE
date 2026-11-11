/**
 * @file patchReactNativePrebuilt.js
 * @description Makes RN 0.86.3 prebuilt core configuration swaps recover missing or interrupted build markers.
 */
const fs = require('node:fs');
const path = require('node:path');

// RN #57598: missing markers can leave Release binaries in a Debug build.
// Also invalidate the old marker before extraction, as in upstream a772a7c.
// https://github.com/react/react-native/issues/57598
const assumeDebug = `  // Assumption: if there is no stored last build, we assume that it was build for debug.
  if (!fileExists && configuration === 'Debug') {
    console.log(
      'No previous build detected, but Debug Configuration. No need to replace React-Core-prebuilt',
    );
    return false;
  }
`;
const recoverUnknown =
  '  // No marker means unknown binaries; restore the requested configuration.\n';
const replaceCore =
  '  replaceRNCoreConfiguration(configuration, version, podsRoot);';
const guardedReplace = `  // An interrupted extraction must not leave a trusted configuration marker.
  fs.writeFileSync(LAST_BUILD_FILENAME, 'in-progress');
${replaceCore}`;

/**
 * Applies the configuration recovery workaround to the affected RN version.
 * @param {string} packageRoot Installed react-native package directory.
 * @returns {'patched'|'already patched'|'different version'} Patch status.
 * @throws {Error} If the affected version has an unexpected replacement script.
 */
function patchReactNativePrebuilt(packageRoot) {
  const metadata = JSON.parse(
    fs.readFileSync(path.join(packageRoot, 'package.json'), 'utf8'),
  );
  if (metadata.version !== '0.86.3') return 'different version';
  const filename = path.join(packageRoot, 'scripts/replace-rncore-version.js');
  const source = fs.readFileSync(filename, 'utf8');
  if (source.includes(recoverUnknown) && source.includes(guardedReplace)) {
    return 'already patched';
  }
  if (
    source.includes(recoverUnknown) ||
    source.includes(guardedReplace) ||
    !source.includes(assumeDebug) ||
    !source.includes(replaceCore)
  ) {
    throw new Error(
      'React Native prebuilt script changed; review the configuration recovery workaround.',
    );
  }
  fs.writeFileSync(
    filename,
    source
      .replace(assumeDebug, recoverUnknown)
      .replace(replaceCore, guardedReplace),
  );
  return 'patched';
}

if (require.main === module && process.platform === 'darwin') {
  const packageRoot = path.dirname(
    require.resolve('react-native/package.json'),
  );
  console.log(
    `[RNCore] Configuration recovery: ${patchReactNativePrebuilt(packageRoot)}`,
  );
}

module.exports = { patchReactNativePrebuilt };
