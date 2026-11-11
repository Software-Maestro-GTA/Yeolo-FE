/**
 * @file iosSceneSupport.test.cjs
 * @description Exercises the configured Expo scene migration, preserving native initialization and link handlers across prebuilds.
 */
const assert = require('node:assert/strict');
const { test } = require('node:test');
const path = require('node:path');
const { withBuildProperties } = require('expo-build-properties');
const { expo } = require('../../app.json');

// Firebase inserts its initialization between the two legacy startup statements.
// Keep that layout in this fixture so scene adoption cannot remove SDK setup.
const appDelegate = `internal import Expo
import FirebaseCore
import React

@main
class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?
  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    reactNativeDelegate = delegate
    reactNativeFactory = factory

#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    FirebaseApp.configure()
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif
    GMSServices.provideAPIKey("test-key")
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }

  public override func application(_ app: UIApplication, open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
    return super.application(app, open: url, options: options)
      || RCTLinkingManager.application(app, open: url, options: options)
  }

  public override func application(_ application: UIApplication, continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
    return super.application(application, continue: userActivity, restorationHandler: restorationHandler)
      || RCTLinkingManager.application(application, continue: userActivity, restorationHandler: restorationHandler)
  }
}
`;

async function migrate(contents = appDelegate, infoPlist = {}) {
  const [, options] = expo.plugins.find(
    (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-build-properties',
  );
  const config = withBuildProperties(
    { ...expo, _internal: { projectRoot: path.resolve(__dirname, '../..') } },
    options,
  );
  const runMod = async (name, modResults) =>
    config.mods?.ios?.[name]
      ? (await config.mods.ios[name]({ ...config, modResults, modRequest: {} }))
          .modResults
      : modResults;
  return {
    source: (await runMod('appDelegate', { contents, language: 'swift' }))
      .contents,
    plist: await runMod('infoPlist', infoPlist),
  };
}

test('prebuild registers the shipped Expo scene delegate for a single-window app', async () => {
  const { plist, source } = await migrate();
  const manifest = plist.UIApplicationSceneManifest;
  assert.ok(manifest, 'iOS 27 aborts launch without a scene manifest');
  assert.equal(manifest.UIApplicationSupportsMultipleScenes, false);
  assert.equal(
    manifest.UISceneConfigurations.UIWindowSceneSessionRoleApplication[0]
      .UISceneDelegateClassName,
    'EXExpoAppSceneDelegate',
  );
  assert.match(
    source,
    /AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider/,
  );
  assert.doesNotMatch(source, /UIWindow\(frame:|factory\.startReactNative\(/);
});

test('scene adoption preserves Firebase, Maps, retained factory and login/deep-link hooks', async () => {
  const { source } = await migrate();
  for (const setup of [
    'reactNativeDelegate = delegate',
    'reactNativeFactory = factory',
    'FirebaseApp.configure()',
    'GMSServices.provideAPIKey("test-key")',
    'return super.application(application, didFinishLaunchingWithOptions: launchOptions)',
  ]) {
    assert.ok(
      source.includes(setup),
      `native setup must survive migration: ${setup}`,
    );
  }
  assert.equal(
    source.slice(source.indexOf('  public override func application(_ app:')),
    appDelegate.slice(
      appDelegate.indexOf('  public override func application(_ app:'),
    ),
  );
});

test('repeated prebuilds preserve scene registration and unrelated permission settings', async () => {
  const originalPlist = {
    CFBundleURLTypes: [{ CFBundleURLSchemes: ['yeolo', 'com.google.test'] }],
    UIBackgroundModes: ['processing'],
    NSPhotoLibraryUsageDescription: 'Read travel photo metadata',
  };
  const first = await migrate(appDelegate, structuredClone(originalPlist));
  assert.ok(
    first.plist.UIApplicationSceneManifest,
    'scene support must be explicitly enabled',
  );
  const second = await migrate(first.source, structuredClone(first.plist));
  assert.deepEqual(second, first);
  for (const [key, value] of Object.entries(originalPlist)) {
    assert.deepEqual(second.plist[key], value);
  }
});
