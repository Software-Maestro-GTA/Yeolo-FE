/**
 * @file jest.setup.js
 * @description Jest setup and mocking configurations for React Native and Expo modules.
 * @requirements REQ-11
 * @functional FUN-1
 * @api API-FB-1
 * @author Antigravity Agent
 */
import 'whatwg-fetch';

// Mock Environment variables strictly for Jest testing context
process.env.EXPO_PUBLIC_API_URL = 'https://api.yeolo.com';
process.env.EXPO_PUBLIC_REDIRECT_URI = 'https://auth.expo.io/@mock/yeolo';
process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID = 'mock-google-client-id.apps.googleusercontent.com';
process.env.EXPO_PUBLIC_IOS_GOOGLE_CLIENT_ID = 'mock-ios-google-client-id.apps.googleusercontent.com';
process.env.EXPO_PUBLIC_ANDROID_GOOGLE_CLIENT_ID = 'mock-android-google-client-id.apps.googleusercontent.com';


// Mock EventTarget to avoid native module transpilation issues in Jest
class EventTarget {
  listeners = {};
  addEventListener(type, callback) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(callback);
  }
  removeEventListener(type, callback) {
    if (!this.listeners[type]) return;
    this.listeners[type] = this.listeners[type].filter((cb) => cb !== callback);
  }
  dispatchEvent(event) {
    if (!this.listeners[event.type]) return true;
    this.listeners[event.type].forEach((cb) => cb(event));
    return true;
  }
}
global.EventTarget = EventTarget;
global.Event = class Event {
  type;
  constructor(type) {
    this.type = type;
  }
};

if (!global.MessageEvent) {
  global.MessageEvent = class MessageEvent extends Event {
    data;
    origin;
    lastEventId;
    source;
    ports;
    constructor(type, options = {}) {
      super(type, options);
      this.data = options.data;
      this.origin = options.origin || '';
      this.lastEventId = options.lastEventId || '';
      this.source = options.source || null;
      this.ports = options.ports || [];
    }
  };
}

if (!global.EventSource) {
  global.EventSource = class EventSource extends EventTarget {};
}

// Mock until-async to bypass ESM importing issue
jest.mock('until-async', () => ({
  until: jest.fn((fn) => fn()),
}));

// Mock perf_hooks to provide markResourceTiming needed by undici
jest.mock('perf_hooks', () => {
  const original = jest.requireActual('perf_hooks');
  return {
    ...original,
    performance: {
      ...original.performance,
      markResourceTiming: jest.fn(),
      clearResourceTimings: jest.fn(),
    },
  };
});

// Mock parse-sse to bypass ESM importing issue
jest.mock('parse-sse', () => ({
  parseServerSentEvents: jest.fn(),
  ServerSentEventTransformStream: class {},
}));

// Mock @open-draft/deferred-promise to bypass ESM importing issue
jest.mock('@open-draft/deferred-promise', () => {
  return {
    DeferredPromise: class DeferredPromise extends Promise {
      resolve;
      reject;
      constructor(executor) {
        let res;
        let rej;
        super((resolve, reject) => {
          res = resolve;
          rej = reject;
          if (executor) executor(resolve, reject);
        });
        this.resolve = res;
        this.reject = rej;
      }
    }
  };
});

// Mock AsyncStorage directly to prevent resolution issues
jest.mock('@react-native-async-storage/async-storage', () => {
  let cache = {};
  return {
    getItem: jest.fn((key) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(cache[key] || null);
        }, 10);
      });
    }),
    setItem: jest.fn((key, value) => {
      cache[key] = value.toString();
      return Promise.resolve(null);
    }),
    removeItem: jest.fn((key) => {
      delete cache[key];
      return Promise.resolve(null);
    }),
    clear: jest.fn(() => {
      cache = {};
      return Promise.resolve(null);
    }),
  };
});

// Mock expo-auth-session
jest.mock('expo-auth-session', () => {
  return {
    useAuthRequest: jest.fn(() => [
      { url: 'https://mock-oauth-url' }, // request
      null, // response
      jest.fn(async () => ({
        type: 'success',
        authentication: { accessToken: 'mock-google-token' },
        params: { code: 'mock-google-auth-code' },
      })), // promptAsync
    ]),
    makeRedirectUri: jest.fn(() => 'https://auth.expo.io/@mock/yeolo'),
  };
});

// Mock expo-web-browser
jest.mock('expo-web-browser', () => {
  return {
    maybeCompleteAuthSession: jest.fn(),
  };
});

// Restore global fetch with undici to bypass expo winter fetch limitations
const undici = require('undici');
const originalEntries = undici.Headers.prototype.entries;
undici.Headers.prototype.entries = function () {
  const iter = originalEntries.call(this);
  return {
    [Symbol.iterator]() {
      return this;
    },
    next() {
      return iter.next();
    },
  };
};
undici.Headers.prototype[Symbol.iterator] = undici.Headers.prototype.entries;

global.fetch = undici.fetch;
global.Headers = undici.Headers;
global.Request = undici.Request;
global.Response = undici.Response;

// TextEncoder / TextDecoder compatibility for MSW in Node environment
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;







// Mock @react-native-google-signin/google-signin
jest.mock('@react-native-google-signin/google-signin', () => {
  return {
    GoogleSignin: {
      configure: jest.fn(),
      hasPlayServices: jest.fn().mockResolvedValue(true),
      signIn: jest.fn().mockResolvedValue({
        data: {
          serverAuthCode: 'mock-google-auth-code',
        },
      }),
    },
  };
});
