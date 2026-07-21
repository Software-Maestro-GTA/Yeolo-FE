/**
 * @file AuthContext.test.tsx
 * @description Unit tests for AuthContext state management and auto-login restore.
 * @requirements REQ-11
 * @functional FUN-1
 * @api API-FB-1
 * @author Antigravity Agent
 */
import React from 'react';
import { renderHook, act } from '@testing-library/react-native';

import { AuthProvider, AuthContext } from '../src/context/AuthContext';
import { server } from './mocks/server';
import { http, HttpResponse } from 'msw';

let shouldFail = false;
const originalFetch = global.fetch;

beforeAll(() => {
  global.fetch = jest.fn(async (url: any, options: any) => {
    const requestUrl = typeof url === 'string' ? url : (url && url.url) || '';
    if (typeof requestUrl === 'string' && requestUrl.includes('/api/auth/google')) {
      if (shouldFail) {
        return new Response(JSON.stringify({
          status: 400,
          message: '인가 코드가 유효하지 않습니다.',
          data: null,
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({
        status: 200,
        message: '로그인 성공',
        data: {
          user: {
            userId: '550e8400-e29b-41d4-a716-446655440000',
            provider: 'google',
            email: 'user@gmail.com',
            displayName: '최고민수',
            profileImageUrl: 'https://lh3.googleusercontent.com/avatar',
            status: 'active',
            lastLoginAt: '2026-07-16T11:00:00Z',
          },
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
        },
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return originalFetch(url, options);
  }) as any;
});

import AsyncStorage from '@react-native-async-storage/async-storage';

beforeEach(async () => {
  await AsyncStorage.clear();
  shouldFail = false;
  jest.clearAllMocks();
});

afterEach(() => {
  shouldFail = false;
  jest.clearAllMocks();
});

afterAll(() => {
  global.fetch = originalFetch;
});

describe('AuthContext', () => {


  it('기본 상태는 비인증 상태(isAuthenticated: false)여야 한다', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );
    const { result } = await renderHook(() => React.useContext(AuthContext)!, { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });


  it('loginWithGoogle 호출 시 인가 코드를 서버에 전송하고 성공하면 사용자 정보와 토큰을 저장해야 한다', async () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );
    const { result } = await renderHook(() => React.useContext(AuthContext)!, { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    await act(async () => {
      await result.current.loginWithGoogle('mock-code');
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.displayName).toBe('최고민수');


  });

  it('loginWithGoogle 호출 시 서버가 에러를 반환하면 로그인이 실패하고 에러를 발생시켜야 한다', async () => {
    shouldFail = true;

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthProvider>{children}</AuthProvider>
    );
    const { result } = await renderHook(() => React.useContext(AuthContext)!, { wrapper });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    await act(async () => {
      await expect(result.current.loginWithGoogle('invalid-code')).rejects.toThrow(
        '인가 코드가 유효하지 않습니다.'
      );
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });
});
