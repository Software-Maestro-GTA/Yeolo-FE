/**
 * @file LoginScreen.test.tsx
 * @description Unit tests for LoginScreen layout, style parameters, and OAuth login action trigger.
 * @requirements REQ-11
 * @functional FUN-1
 * @api API-FB-1
 * @author Antigravity Agent
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { AuthContext } from '../src/context/AuthContext';
import LoginScreen from '../src/screens/LoginScreen';

const mockLoginWithGoogle = jest.fn();

const renderLoginScreen = async (isAuthenticated = false) => {
  const mockContextValue = {
    isAuthenticated,
    user: null,
    isLoading: false,
    loginWithGoogle: mockLoginWithGoogle,
    logout: jest.fn(),
  };

  return await render(
    <AuthContext.Provider value={mockContextValue}>
      <LoginScreen />
    </AuthContext.Provider>
  );
};

describe('LoginScreen UI & Interaction', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  it('기본 UI 문구 및 로그인 버튼이 정상적으로 렌더링되어야 한다', async () => {
    const { getByText } = await renderLoginScreen();

    expect(getByText('당신의 여행을 데이터로 그리다,')).toBeTruthy();
    expect(getByText('여로')).toBeTruthy();
    expect(getByText('Google 계정으로 계속하기')).toBeTruthy();
  });

  it('Google 계정으로 계속하기 버튼 클릭 시 promptAsync 혹은 로그인 로직이 촉발되어야 한다', async () => {
    mockLoginWithGoogle.mockResolvedValueOnce(undefined);

    const { getByText } = await renderLoginScreen();
    const loginButton = getByText('Google 계정으로 계속하기');

    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(mockLoginWithGoogle).toHaveBeenCalledWith('mock-google-auth-code');
    });
  });

  it('로그인 처리 중 에러 발생 시 Alert로 에러 메시지를 표시해야 한다', async () => {
    const errorMessage = 'Google 로그인 실패';
    mockLoginWithGoogle.mockRejectedValueOnce(new Error(errorMessage));

    const { getByText } = await renderLoginScreen();
    const loginButton = getByText('Google 계정으로 계속하기');

    fireEvent.press(loginButton);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('로그인 오류', errorMessage);
    });
  });
});
