/**
 * @file logger.test.ts
 * @description Unit tests for logger utility and isDev environment check.
 */

import { isDev, logger } from '../logger';

describe('logger & isDev', () => {
  const originalDev = (globalThis as unknown as { __DEV__?: boolean }).__DEV__;
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    (globalThis as unknown as { __DEV__?: boolean }).__DEV__ = originalDev;
    process.env.NODE_ENV = originalEnv;
    jest.restoreAllMocks();
  });

  describe('isDev', () => {
    it('returns true when __DEV__ is true', () => {
      (globalThis as unknown as { __DEV__?: boolean }).__DEV__ = true;
      expect(isDev()).toBe(true);
    });

    it('returns false when __DEV__ is false', () => {
      (globalThis as unknown as { __DEV__?: boolean }).__DEV__ = false;
      expect(isDev()).toBe(false);
    });

    it('falls back to NODE_ENV !== production when __DEV__ is undefined', () => {
      delete (globalThis as unknown as { __DEV__?: boolean }).__DEV__;

      process.env.NODE_ENV = 'development';
      expect(isDev()).toBe(true);

      process.env.NODE_ENV = 'production';
      expect(isDev()).toBe(false);
    });
  });

  describe('logger methods in dev mode', () => {
    beforeEach(() => {
      (globalThis as unknown as { __DEV__?: boolean }).__DEV__ = true;
    });

    it('logs console.log with [DEV] prefix', () => {
      const spy = jest.spyOn(console, 'log').mockImplementation();
      logger.log('test log message', { data: 123 });
      expect(spy).toHaveBeenCalledWith('[DEV]', 'test log message', {
        data: 123,
      });
    });

    it('logs console.info with [DEV] prefix', () => {
      const spy = jest.spyOn(console, 'info').mockImplementation();
      logger.info('test info message');
      expect(spy).toHaveBeenCalledWith('[DEV]', 'test info message');
    });

    it('logs console.warn with [DEV] prefix', () => {
      const spy = jest.spyOn(console, 'warn').mockImplementation();
      logger.warn('test warn message');
      expect(spy).toHaveBeenCalledWith('[DEV]', 'test warn message');
    });

    it('logs console.error with [DEV] prefix', () => {
      const spy = jest.spyOn(console, 'error').mockImplementation();
      logger.error('test error message');
      expect(spy).toHaveBeenCalledWith('[DEV]', 'test error message');
    });

    it('logs console.debug with [DEV] prefix', () => {
      const spy = jest.spyOn(console, 'debug').mockImplementation();
      logger.debug('test debug message');
      expect(spy).toHaveBeenCalledWith('[DEV]', 'test debug message');
    });
  });

  describe('logger methods in production mode', () => {
    beforeEach(() => {
      (globalThis as unknown as { __DEV__?: boolean }).__DEV__ = false;
      process.env.NODE_ENV = 'production';
    });

    it('suppresses logs in production mode', () => {
      const spyLog = jest.spyOn(console, 'log').mockImplementation();
      const spyInfo = jest.spyOn(console, 'info').mockImplementation();
      const spyWarn = jest.spyOn(console, 'warn').mockImplementation();
      const spyError = jest.spyOn(console, 'error').mockImplementation();
      const spyDebug = jest.spyOn(console, 'debug').mockImplementation();

      logger.log('test');
      logger.info('test');
      logger.warn('test');
      logger.error('test');
      logger.debug('test');

      expect(spyLog).not.toHaveBeenCalled();
      expect(spyInfo).not.toHaveBeenCalled();
      expect(spyWarn).not.toHaveBeenCalled();
      expect(spyError).not.toHaveBeenCalled();
      expect(spyDebug).not.toHaveBeenCalled();
    });
  });
});
