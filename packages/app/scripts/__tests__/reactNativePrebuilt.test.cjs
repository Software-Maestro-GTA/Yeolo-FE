/**
 * @file reactNativePrebuilt.test.cjs
 * @description Runs RNCore's real build-phase CLI against small tarballs to verify configuration recovery and failure handling.
 */
const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const { patchReactNativePrebuilt } = require('../patchReactNativePrebuilt');

const script =
  require.resolve('react-native/scripts/replace-rncore-version.js');
const version = '0.86.3';

function fixture(t) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'yeolo-rncore-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  // Patch a copy so the tests also exercise postinstall on non-macOS CI.
  const runtime = path.join(root, 'runtime');
  fs.mkdirSync(path.join(runtime, 'scripts'), { recursive: true });
  fs.writeFileSync(
    path.join(runtime, 'package.json'),
    JSON.stringify({ version }),
  );
  const scriptUnderTest = path.join(
    runtime,
    'scripts/replace-rncore-version.js',
  );
  fs.copyFileSync(script, scriptUnderTest);
  patchReactNativePrebuilt(runtime);
  const pod = path.join(root, 'React-Core-prebuilt');
  const marker = path.join(pod, '.last_build_configuration');
  const binary = path.join(pod, 'React.xcframework', 'binary');
  const modulemap = path.join(pod, 'React-use-frameworks.modulemap');
  const artifacts = path.join(root, 'ReactNativeCore-artifacts');
  fs.mkdirSync(path.dirname(binary), { recursive: true });
  fs.mkdirSync(artifacts);
  fs.writeFileSync(binary, 'binary-Release');
  fs.writeFileSync(modulemap, 'module React {}\n');
  const archive = (configuration) =>
    path.join(
      artifacts,
      `reactnative-core-${version}-${configuration.toLowerCase()}.tar.gz`,
    );
  for (const configuration of ['Debug', 'Release']) {
    const staging = path.join(root, configuration);
    fs.mkdirSync(path.join(staging, 'React.xcframework', 'Modules'), {
      recursive: true,
    });
    fs.writeFileSync(
      path.join(staging, 'React.xcframework', 'Modules', 'module.modulemap'),
      'module React {}\n',
    );
    fs.writeFileSync(
      path.join(staging, 'React.xcframework', 'binary'),
      `binary-${configuration}`,
    );
    const result = spawnSync('tar', [
      '-czf',
      archive(configuration),
      '-C',
      staging,
      'React.xcframework',
    ]);
    assert.equal(result.status, 0, result.stderr?.toString());
  }
  const run = (configuration) =>
    spawnSync(
      process.execPath,
      [scriptUnderTest, '-c', configuration, '-r', version, '-p', root],
      {
        cwd: root,
        encoding: 'utf8',
        env: {
          ...process.env,
          NODE_PATH: [
            path.dirname(path.dirname(require.resolve('yargs/package.json'))),
            process.env.NODE_PATH,
          ]
            .filter(Boolean)
            .join(path.delimiter),
        },
      },
    );
  return { root, marker, binary, modulemap, archive, run };
}

test('missing marker restores Debug binaries even when the installed core is Release', (t) => {
  const { run, marker, binary, modulemap } = fixture(t);
  const result = run('Debug');
  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.readFileSync(binary, 'utf8'), 'binary-Debug');
  assert.equal(fs.readFileSync(marker, 'utf8'), 'Debug');
  assert.equal(fs.readFileSync(modulemap, 'utf8'), 'module React {}\n');
});

test('configuration switches replace the core and preserve Expo modulemaps', (t) => {
  const { run, marker, binary, modulemap } = fixture(t);
  fs.writeFileSync(marker, 'Debug');
  for (const configuration of ['Release', 'Debug']) {
    const result = run(configuration);
    assert.equal(result.status, 0, result.stderr);
    assert.equal(fs.readFileSync(binary, 'utf8'), `binary-${configuration}`);
    assert.equal(fs.readFileSync(marker, 'utf8'), configuration);
    assert.equal(fs.readFileSync(modulemap, 'utf8'), 'module React {}\n');
  }
});

test('failed swaps invalidate the previous marker and recover on the next Debug build', (t) => {
  const { run, marker, binary, archive } = fixture(t);
  fs.writeFileSync(marker, 'Debug');
  fs.rmSync(archive('Release'));
  const failed = run('Release');
  assert.notEqual(failed.status, 0);
  assert.match(failed.stderr, /tar extraction failed/);
  assert.equal(fs.readFileSync(marker, 'utf8'), 'in-progress');
  const recovered = run('Debug');
  assert.equal(recovered.status, 0, recovered.stderr);
  assert.equal(fs.readFileSync(binary, 'utf8'), 'binary-Debug');
});

test('matching configuration skips extraction and invalid configurations still fail', (t) => {
  const { run, marker, binary, archive } = fixture(t);
  fs.writeFileSync(marker, 'Release');
  fs.rmSync(archive('Release'));
  assert.equal(run('Release').status, 0);
  assert.equal(fs.readFileSync(binary, 'utf8'), 'binary-Release');
  const invalid = run('Unknown');
  assert.notEqual(invalid.status, 0);
  assert.match(invalid.stderr, /Invalid configuration/);
  assert.equal(fs.readFileSync(marker, 'utf8'), 'Release');
});

test('postinstall is idempotent, version guarded and fails on unexpected affected source', (t) => {
  const { root } = fixture(t);
  fs.mkdirSync(path.join(root, 'scripts'));
  const metadata = path.join(root, 'package.json');
  const target = path.join(root, 'scripts/replace-rncore-version.js');
  const source = fs.readFileSync(
    path.join(root, 'runtime/scripts/replace-rncore-version.js'),
    'utf8',
  );
  fs.writeFileSync(metadata, JSON.stringify({ version }));
  fs.writeFileSync(target, source);
  assert.equal(patchReactNativePrebuilt(root), 'already patched');
  assert.equal(fs.readFileSync(target, 'utf8'), source);
  fs.writeFileSync(target, 'unexpected source');
  assert.throws(() => patchReactNativePrebuilt(root), /script changed/);
  fs.writeFileSync(metadata, JSON.stringify({ version: '0.87.1' }));
  assert.equal(patchReactNativePrebuilt(root), 'different version');
  assert.equal(fs.readFileSync(target, 'utf8'), 'unexpected source');
});
