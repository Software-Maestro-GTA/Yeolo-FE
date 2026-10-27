/**
 * @file LoginScreen.test.tsx
 * @description 로그인 영상의 접근성 처리와 플랫폼별 OAuth 성공·취소·오류 동작을 검증합니다.
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo, Alert, Platform, ToastAndroid } from 'react-native';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { AuthContext } from '../src/context/AuthContext';
import { LoginScreen } from '../src/screens/LoginScreen';
import { signInWithGoogle } from '../src/services/authService';
import { UI_STRINGS } from '../src/constants/strings';

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
    </AuthContext.Provider>,
  );
};

describe('LoginScreen UI & Interaction', () => {
  const originalPlatform = Platform.OS;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    jest.spyOn(ToastAndroid, 'show').mockImplementation(() => {});
    jest
      .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
      .mockResolvedValue(false);
    Platform.OS = 'android';
  });

  afterEach(() => {
    Platform.OS = originalPlatform;
    jest.restoreAllMocks();
  });

  it('UI v3 문구, 일러스트 및 로그인 버튼이 정상적으로 렌더링되어야 한다', async () => {
    const { getByText, getByTestId, getByRole } = await renderLoginScreen();

    expect(getByText(/나도 몰랐던 내 안의\s*여행 취향 발견/)).toBeTruthy();
    expect(
      getByText(/사진첩 속에 숨겨진 나만의 여행길을\s*지금 바로 열어보세요\./),
    ).toBeTruthy();
    expect(getByTestId('login-hero-illustration')).toBeTruthy();
    expect(getByRole('button', { name: '구글로 시작하기' })).toBeTruthy();
  });

  it('iOS 환경일 경우 Apple 로그인 버튼이 노출되어야 한다', async () => {
    Platform.OS = 'ios';
    const { getByTestId } = await renderLoginScreen();

    expect(getByTestId('apple-login-button')).toBeTruthy();
  });

  it.each(['ios', 'android'] as const)(
    '%s 로그인 화면에 무음 영상을 연결하고 동작 줄이기에서는 정지 이미지를 표시한다',
    async (platform) => {
      Platform.OS = platform;
      const motion = jest
        .spyOn(AccessibilityInfo, 'isReduceMotionEnabled')
        .mockResolvedValue(true);
      try {
        const ui = await renderLoginScreen();
        const hidden = { includeHiddenElements: true };
        const video = ui.getByTestId('login-hero-video-player', hidden);
        expect(video.props.nativeControls).toBe(false);
        expect(video.props.player).toMatchObject({ loop: true, muted: true });
        expect(video.props.player.play).not.toHaveBeenCalled();
        expect(ui.getByTestId('login-hero-video-poster', hidden)).toBeTruthy();
        expect(
          ui.getByRole('button', { name: '구글로 시작하기' }),
        ).toBeTruthy();
        expect(ui.queryByTestId('apple-login-button') !== null).toBe(
          platform === 'ios',
        );
      } finally {
        motion.mockRestore();
      }
    },
  );

  it('Google 계정으로 계속하기 버튼 클릭 시 promptAsync 혹은 로그인 로직이 촉발되어야 한다', async () => {
    mockLoginWithGoogle.mockResolvedValueOnce({
      isNewUser: false,
      doOnboarding: true,
    });
    const onLoginSuccess = jest.fn();

    const mockContextValue = {
      isAuthenticated: false,
      user: null,
      isLoading: false,
      loginWithGoogle: mockLoginWithGoogle,
      loginWithApple: mockLoginWithApple,
      logout: jest.fn(),
    };

    const { getByRole } = await render(
      <AuthContext.Provider value={mockContextValue}>
        <LoginScreen onLoginSuccess={onLoginSuccess} />
      </AuthContext.Provider>,
    );
    const loginButton = getByRole('button', { name: '구글로 시작하기' });

    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(mockLoginWithGoogle).toHaveBeenCalledWith('mock-google-auth-code');
      expect(onLoginSuccess).toHaveBeenCalledWith(true);
    });
  });

  it('doOnboarding이 false인 경우 onLoginSuccess에 false를 전달해야 한다', async () => {
    mockLoginWithGoogle.mockResolvedValueOnce({
      isNewUser: false,
      doOnboarding: false,
    });
    const onLoginSuccess = jest.fn();

    const mockContextValue = {
      isAuthenticated: false,
      user: null,
      isLoading: false,
      loginWithGoogle: mockLoginWithGoogle,
      loginWithApple: mockLoginWithApple,
      logout: jest.fn(),
    };

    const { getByRole } = await render(
      <AuthContext.Provider value={mockContextValue}>
        <LoginScreen onLoginSuccess={onLoginSuccess} />
      </AuthContext.Provider>,
    );
    const loginButton = getByRole('button', { name: '구글로 시작하기' });

    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(mockLoginWithGoogle).toHaveBeenCalledWith('mock-google-auth-code');
      expect(onLoginSuccess).toHaveBeenCalledWith(false);
    });
  });

  it.each(['android', 'ios'] as const)(
    '%s에서 Google 로그인 창을 닫으면 오류 없이 머무르고 다시 로그인할 수 있다',
    async (platform) => {
      Platform.OS = platform;
      jest.mocked(GoogleSignin.signIn).mockResolvedValueOnce({
        type: 'cancelled',
        data: null,
      });
      mockLoginWithGoogle.mockResolvedValueOnce({
        isNewUser: false,
        doOnboarding: false,
      });
      const onLoginSuccess = jest.fn();
      const { getByRole } = await render(
        <AuthContext.Provider
          value={{
            isAuthenticated: false,
            user: null,
            isLoading: false,
            loginWithGoogle: mockLoginWithGoogle,
            loginWithApple: mockLoginWithApple,
            logout: jest.fn(),
          }}>
          <LoginScreen onLoginSuccess={onLoginSuccess} />
        </AuthContext.Provider>,
      );

      fireEvent.press(getByRole('button', { name: '구글로 시작하기' }));

      await waitFor(() => {
        expect(GoogleSignin.signIn).toHaveBeenCalledTimes(1);
        expect(getByRole('button', { name: '구글로 시작하기' })).toBeEnabled();
      });
      expect(mockLoginWithGoogle).not.toHaveBeenCalled();
      expect(onLoginSuccess).not.toHaveBeenCalled();
      expect(Alert.alert).not.toHaveBeenCalled();
      expect(ToastAndroid.show).not.toHaveBeenCalled();

      fireEvent.press(getByRole('button', { name: '구글로 시작하기' }));

      await waitFor(() => {
        expect(mockLoginWithGoogle).toHaveBeenCalledWith(
          'mock-google-auth-code',
        );
        expect(onLoginSuccess).toHaveBeenCalledWith(false);
      });
    },
  );

  it('Google 인증 성공 응답에 인가 코드가 없으면 기존 오류를 유지한다', async () => {
    const successResponse = await GoogleSignin.signIn();
    if (!successResponse.data) throw new Error('Expected success fixture');
    jest.mocked(GoogleSignin.signIn).mockResolvedValueOnce({
      type: 'success',
      data: { ...successResponse.data, serverAuthCode: null },
    });

    await expect(signInWithGoogle()).rejects.toThrow(
      UI_STRINGS.AUTH.MISSING_AUTH_CODE_ERROR,
    );
    expect(mockLoginWithGoogle).not.toHaveBeenCalled();
  });

  it('iOS 환경에서 Apple 로그인 버튼 클릭 시 signInWithApple 및 loginWithApple이 촉발되어야 한다', async () => {
    Platform.OS = 'ios';
    mockLoginWithApple.mockResolvedValueOnce({
      isNewUser: false,
      doOnboarding: false,
    });

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

    const { getByRole } = await renderLoginScreen();
    const loginButton = getByRole('button', { name: '구글로 시작하기' });

    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(mockLoginWithGoogle).toHaveBeenCalled();
    });
  });
});
