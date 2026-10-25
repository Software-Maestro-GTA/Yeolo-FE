/**
 * @file patchExpoModulesJsi.test.cjs
 * @description Checks reinstall safety, version guards and preserved build failures for the Xcode workaround.
 */
const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { patchExpoModulesJsi } = require('../patchExpoModulesJsi');

function fixture(t, source, version = '57.0.3') {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'yeolo-jsi-patch-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(root, 'apple/scripts'), { recursive: true });
  fs.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify({ version }),
  );
  const script = path.join(root, 'apple/scripts/build-xcframework.sh');
  fs.writeFileSync(script, source, { mode: 0o755 });
  return { root, script };
}

test('removes quiet mode after each reinstall without hiding output or build failures', (t) => {
  const source = `#!/bin/bash
set -euo pipefail
CONFIGURATION=Release
xcodebuild() { printf '%s\\n' "$@"; echo 'compiler diagnostic' >&2; return 7; }
xcodebuild \\
    -configuration "$CONFIGURATION" \\
    -quiet \\
    -disableAutomaticPackageResolution
`;
  const { root, script } = fixture(t, source);
  for (let install = 0; install < 2; install++) {
    fs.writeFileSync(script, source);
    assert.equal(patchExpoModulesJsi(root), 'patched');
    assert.equal(patchExpoModulesJsi(root), 'already patched');
    const result = spawnSync('bash', [script], { encoding: 'utf8' });
    assert.equal(result.status, 7);
    assert.match(
      result.stdout,
      /-configuration\nRelease\n-disableAutomaticPackageResolution/,
    );
    assert.doesNotMatch(result.stdout, /-quiet/);
    assert.match(result.stderr, /compiler diagnostic/);
    assert.equal(fs.statSync(script).mode & 0o111, 0o111);
  }
});

test('leaves other dependency versions untouched', (t) => {
  const source = '#!/bin/bash\nexit 0\n';
  const { root, script } = fixture(t, source, '58.0.4');
  assert.equal(patchExpoModulesJsi(root), 'different version');
  assert.equal(fs.readFileSync(script, 'utf8'), source);
});

test('fails on unexpected source instead of silently claiming a successful patch', (t) => {
  const source = '#!/bin/bash\nxcodebuild -quiet\n';
  const { root, script } = fixture(t, source);
  assert.throws(() => patchExpoModulesJsi(root), /build script changed/);
  assert.equal(fs.readFileSync(script, 'utf8'), source);
});
