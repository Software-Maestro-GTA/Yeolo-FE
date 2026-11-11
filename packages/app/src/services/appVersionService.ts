/**
 * @file appVersionService.ts
 * @description Configures the installed release version and retains update notices during app startup.
 */
import Constants from 'expo-constants';
import { nativeApplicationVersion } from 'expo-application';
import {
  AppVersionMismatchError,
  setAppVersion,
  setVersionMismatchHandler,
} from '@yeolo/common';

// Expo Go's binary version belongs to Expo Go rather than this project.
export const APP_VERSION =
  (Constants.appOwnership === 'expo' ? null : nativeApplicationVersion) ||
  Constants.expoConfig?.version ||
  '';

setAppVersion(APP_VERSION);

let mismatch: AppVersionMismatchError | null = null;
const listeners = new Set<() => void>();
setVersionMismatchHandler((error) => {
  if (mismatch) return;
  mismatch = error;
  listeners.forEach((listener) => listener());
});

/** Subscribes the root update notice to mismatches from any API, including startup refresh. */
export function subscribeVersionMismatch(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Returns a stable snapshot; the update requirement lasts until the app restarts. */
export function getVersionMismatch(): AppVersionMismatchError | null {
  return mismatch;
}
