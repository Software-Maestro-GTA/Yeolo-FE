/**
 * @file courseBackgroundNative.test.cjs
 * @description Compiles the production Swift controller with OS doubles to verify device-only scheduling failures before HTTP starts.
 */
const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

test(
  'native course startup keeps valid finite execution through scheduler refusals',
  { skip: process.platform !== 'darwin' },
  (t) => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'yeolo-course-native-'));
    t.after(() => fs.rmSync(root, { recursive: true, force: true }));
    const fixtures = path.join(__dirname, 'fixtures/course-background');
    const run = (command, args, options = {}) => {
      const result = spawnSync(command, args, { encoding: 'utf8', ...options });
      assert.equal(
        result.status,
        0,
        `${command}: ${result.stderr}\n${result.stdout}`,
      );
      return result;
    };
    for (const name of ['UIKit', 'BackgroundTasks']) {
      run('xcrun', [
        'swiftc',
        '-module-cache-path',
        path.join(root, 'cache'),
        '-emit-library',
        '-emit-module',
        '-module-name',
        name,
        path.join(fixtures, `${name}.swift`),
        '-o',
        path.join(root, `lib${name}.dylib`),
      ]);
    }
    const app = path.join(root, 'Verify.app/Contents');
    fs.mkdirSync(path.join(app, 'MacOS'), { recursive: true });
    fs.writeFileSync(
      path.join(app, 'Info.plist'),
      '<?xml version="1.0"?><plist version="1.0"><dict><key>CFBundleIdentifier</key><string>com.yeolo-travel.app</string><key>CFBundleExecutable</key><string>verify</string><key>CFBundlePackageType</key><string>APPL</string></dict></plist>',
    );
    const binary = path.join(app, 'MacOS/verify');
    run('xcrun', [
      'swiftc',
      '-module-cache-path',
      path.join(root, 'cache'),
      '-I',
      root,
      '-L',
      root,
      '-lUIKit',
      '-lBackgroundTasks',
      path.resolve(
        __dirname,
        '../../modules/yeolo-course-background/ios/CourseBackgroundController.swift',
      ),
      path.join(fixtures, 'main.swift'),
      '-o',
      binary,
    ]);
    for (const scenario of [
      '4',
      '2',
      '3',
      'registration',
      '1',
      'timeout',
      'assertion',
      'inactive',
      'continued',
    ]) {
      const result = run(binary, [scenario], {
        env: { ...process.env, DYLD_LIBRARY_PATH: root },
      });
      assert.match(result.stdout, new RegExp(`PASS ${scenario}`));
    }
  },
);
