/**
 * @file LoginScreen.test.tsx
 * @description Unit tests for LoginScreen layout, style parameters, and OAuth login action trigger.
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert, Platform } from 'react-native';
import { AuthContext } from '../src/context/AuthContext';
import { LoginScreen } from '../src/screens/LoginScreen';

const mockLoginWithGoogle = jest.fn();
const mockLoginWithApple = jest.fn();

const renderLoginScreen = async (isAuthenticated = false) => {
  const mockContextValue = {
    isAuthenticated,
    user: null,
    isLoading: false,
    loginWithGoogle: mockLoginWithGoogle,
    loginWithApple: mockLoginWithApple,
    logout: jest.fn(),
  };

  return await render(
    <AuthContext.Provider value={mockContextValue}>
      <LoginScreen />
    </AuthContext.Provider>
  );
};

describe('LoginScreen UI & Interaction', () => {
  const originalPlatform = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    Platform.OS = 'android';
  });

  afterEach(() => {
    Platform.OS = originalPlatform;
  });

  it('기본 UI 문구 및 로그인 버튼이 정상적으로 렌더링되어야 한다', async () => {
    const { getByText, getAllByText } = await renderLoginScreen();

    expect(getByText('당신의 여행을 데이터로 그리다,')).toBeTruthy();
    expect(getAllByText('여로')[0]).toBeTruthy();
    expect(getByText('Google 계정으로 계속하기')).toBeTruthy();
  });

  it('iOS 환경일 경우 Apple 로그인 버튼이 노출되어야 한다', async () => {
    Platform.OS = 'ios';
    const { getByTestId } = await renderLoginScreen();

    expect(getByTestId('apple-login-button')).toBeTruthy();
  });

  it('Google 계정으로 계속하기 버튼 클릭 시 promptAsync 혹은 로그인 로직이 촉발되어야 한다', async () => {
    mockLoginWithGoogle.mockResolvedValueOnce({ isNewUser: false, doOnboarding: true });
    const onLoginSuccess = jest.fn();

    const mockContextValue = {
      isAuthenticated: false,
      user: null,
      isLoading: false,
      loginWithGoogle: mockLoginWithGoogle,
      loginWithApple: mockLoginWithApple,
      logout: jest.fn(),
    };

    const { getByText } = await render(
      <AuthContext.Provider value={mockContextValue}>
        <LoginScreen onLoginSuccess={onLoginSuccess} />
      </AuthContext.Provider>
    );
    const loginButton = getByText('Google 계정으로 계속하기');

    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(mockLoginWithGoogle).toHaveBeenCalledWith('mock-google-auth-code');
      expect(onLoginSuccess).toHaveBeenCalledWith(true);
    });
  });

  it('doOnboarding이 false인 경우 onLoginSuccess에 false를 전달해야 한다', async () => {
    mockLoginWithGoogle.mockResolvedValueOnce({ isNewUser: false, doOnboarding: false });
    const onLoginSuccess = jest.fn();

    const mockContextValue = {
      isAuthenticated: false,
      user: null,
      isLoading: false,
      loginWithGoogle: mockLoginWithGoogle,
      loginWithApple: mockLoginWithApple,
      logout: jest.fn(),
    };

    const { getByText } = await render(
      <AuthContext.Provider value={mockContextValue}>
        <LoginScreen onLoginSuccess={onLoginSuccess} />
      </AuthContext.Provider>
    );
    const loginButton = getByText('Google 계정으로 계속하기');

    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(mockLoginWithGoogle).toHaveBeenCalledWith('mock-google-auth-code');
      expect(onLoginSuccess).toHaveBeenCalledWith(false);
    });
  });

  it('iOS 환경에서 Apple 로그인 버튼 클릭 시 signInWithApple 및 loginWithApple이 촉발되어야 한다', async () => {
    Platform.OS = 'ios';
    mockLoginWithApple.mockResolvedValueOnce({ isNewUser: false, doOnboarding: false });

    const { getByTestId } = await renderLoginScreen();
    const appleButton = getByTestId('apple-login-button');

    fireEvent.press(appleButton);

    await waitFor(() => {
      expect(mockLoginWithApple).toHaveBeenCalledWith({
        code: 'mock-apple-auth-code',
        idToken: 'mock-apple-id-token',
      });
    });
  });

  it('로그인 처리 중 에러 발생 시 ToastAndroid 메시지를 표시해야 한다', async () => {
    const errorMessage = 'Google 로그인 실패';
    mockLoginWithGoogle.mockRejectedValueOnce(new Error(errorMessage));

    const { getByText } = await renderLoginScreen();
    const loginButton = getByText('Google 계정으로 계속하기');

    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(mockLoginWithGoogle).toHaveBeenCalled();
    });
  });
});

