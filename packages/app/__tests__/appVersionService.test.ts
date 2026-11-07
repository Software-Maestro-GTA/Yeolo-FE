/**
 * @file appVersionService.test.ts
 * @description Verifies native app version selection and Expo Go configuration fallback before API requests.
 */
const mockSetAppVersion = jest.fn();
const mockSetVersionMismatchHandler = jest.fn();
let mockNativeApplicationVersion: string | null = '1.2.1';
let mockExecutionEnvironment = 'standalone';
let mockAppOwnership: string | null = null;
let mockConfiguredVersion: string | undefined = '9.9.9';

jest.mock('@yeolo/common', () => ({
  setAppVersion: mockSetAppVersion,
  setVersionMismatchHandler: mockSetVersionMismatchHandler,
}));
jest.mock('expo-application', () => ({
  get nativeApplicationVersion() {
    return mockNativeApplicationVersion;
  },
}));
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    get executionEnvironment() {
      return mockExecutionEnvironment;
    },
    get appOwnership() {
      return mockAppOwnership;
    },
    get expoConfig() {
      return { version: mockConfiguredVersion };
    },
  },
  ExecutionEnvironment: { StoreClient: 'storeClient' },
}));

describe('appVersionService', () => {
  beforeEach(() => {
    jest.resetModules();
    mockSetAppVersion.mockClear();
    mockSetVersionMismatchHandler.mockClear();
    mockNativeApplicationVersion = '1.2.1';
    mockExecutionEnvironment = 'standalone';
    mockAppOwnership = null;
    mockConfiguredVersion = '9.9.9';
  });

  it('configures the common client with the installed native app version', () => {
    const service = require('../src/services/appVersionService');
    expect(service.APP_VERSION).toBe('1.2.1');
    expect(mockSetAppVersion).toHaveBeenCalledWith('1.2.1');
  });

  it('uses the project version rather than the Expo Go host application version', () => {
    mockExecutionEnvironment = 'storeClient';
    mockAppOwnership = 'expo';
    mockNativeApplicationVersion = '57.0.0';
    const service = require('../src/services/appVersionService');
    expect(service.APP_VERSION).toBe('9.9.9');
    expect(mockSetAppVersion).toHaveBeenCalledWith('9.9.9');
  });

  it('uses Expo configuration when no installed native version is available', () => {
    mockNativeApplicationVersion = null;
    const service = require('../src/services/appVersionService');
    expect(service.APP_VERSION).toBe('9.9.9');
    expect(mockSetAppVersion).toHaveBeenCalledWith('9.9.9');
  });

  it('keeps the installed version for a development client', () => {
    mockExecutionEnvironment = 'storeClient';
    const service = require('../src/services/appVersionService');
    expect(service.APP_VERSION).toBe('1.2.1');
    expect(mockSetAppVersion).toHaveBeenCalledWith('1.2.1');
  });

  it('retains an update required before UI subscription and ignores duplicate notices', () => {
    const service = require('../src/services/appVersionService');
    const handler = mockSetVersionMismatchHandler.mock.calls[0][0];
    const firstMismatch = { status: 426, message: '업데이트가 필요합니다.' };
    handler(firstMismatch);
    expect(service.getVersionMismatch()).toBe(firstMismatch);
    const listener = jest.fn();
    const unsubscribe = service.subscribeVersionMismatch(listener);
    handler({ status: 426, message: '중복 응답' });
    expect(service.getVersionMismatch()).toBe(firstMismatch);
    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });

  it('notifies a mounted UI of the first update requirement', () => {
    const service = require('../src/services/appVersionService');
    const handler = mockSetVersionMismatchHandler.mock.calls[0][0];
    const listener = jest.fn();
    const unsubscribe = service.subscribeVersionMismatch(listener);
    const mismatch = { status: 426, message: '업데이트가 필요합니다.' };
    handler(mismatch);
    expect(listener).toHaveBeenCalledTimes(1);
    expect(service.getVersionMismatch()).toBe(mismatch);
    unsubscribe();
  });
});
