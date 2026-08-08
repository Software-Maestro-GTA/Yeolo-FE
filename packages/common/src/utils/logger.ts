/**
 * @file logger.ts
 * @description Logger utility wrapper that outputs logs only when __DEV__ or development environment is active.
 */

/**
 * Checks if the current environment is development mode (__DEV__ === true or NODE_ENV !== 'production').
 */
export const isDev = (): boolean => {
  if (typeof __DEV__ !== 'undefined') {
    return Boolean(__DEV__);
  }
  const proc = (
    globalThis as unknown as { process?: { env?: { NODE_ENV?: string } } }
  ).process;
  if (typeof proc !== 'undefined' && proc?.env) {
    return proc.env.NODE_ENV !== 'production';
  }
  return false;
};

/**
 * Utility logger for development environment.
 * Logs are output only when isDev() is true.
 */
export const logger = {
  log: (...args: unknown[]): void => {
    if (isDev()) {
      console.log('[DEV]', ...args);
    }
  },
  info: (...args: unknown[]): void => {
    if (isDev()) {
      console.info('[DEV]', ...args);
    }
  },
  warn: (...args: unknown[]): void => {
    if (isDev()) {
      console.warn('[DEV]', ...args);
    }
  },
  error: (...args: unknown[]): void => {
    if (isDev()) {
      console.error('[DEV]', ...args);
    }
  },
  debug: (...args: unknown[]): void => {
    if (isDev()) {
      console.debug('[DEV]', ...args);
    }
  },
};
