/**
 * @file ProfileScreen.test.tsx
 * @description Integration and unit tests for ProfileScreen component (User Profile, Taste Analysis card, Settings, Terms, Logout API-FB-11, and Withdraw API-FB-12).
 * @requirements REQ-11, REQ-12
 * @functional FUN-4
 * @api API-FB-11, API-FB-12
 * @author Antigravity Agent
 */
import React from 'react';
import { waitFor, fireEvent } from '@testing-library/react-native';
import { ProfileScreen } from '../src/screens/ProfileScreen';
import * as commonApi from '@yeolo/common';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { renderWithQueryClient as render } from './test-utils';

import { AuthContext } from '../src/context';

const mockUserData = {
  userId: '550e8400-e29b-41d4-a716-446655440000',
  provider: 'google',
  email: 'sun925@yeolo.com',
  displayName: '김선규',
  profileImageUrl: 'https://example.com/avatar.jpg',
  status: 'active',
};

const renderProfileScreen = async (props: any = {}) => {
  const mockContext = {
    isAuthenticated: true,
    user: mockUserData,
    isLoading: false,
    loginWithGoogle: jest.fn(),
    loginWithApple: jest.fn(),
    logout: jest.fn(async () => {
      await commonApi.logoutApi('http://localhost:3000');
    }),
  };

  return await render(
    <AuthContext.Provider value={mockContext}>
      <ProfileScreen {...props} />
    </AuthContext.Provider>
  );
};

describe('ProfileScreen Integration Tests (Issue #21 / API-FB-11 / API-FB-12 / DOM-3)', () => {
  const mockNavigateToAnalysis = jest.fn();
  const mockNavigateToLogin = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.setItem('accessToken', 'mock-access-token');
    await AsyncStorage.setItem('refreshToken', 'mock-refresh-token');
    jest.spyOn(commonApi, 'logoutApi').mockResolvedValue({ status: 200, message: '로그아웃 성공', data: null });
    jest.spyOn(commonApi, 'withdrawApi').mockResolvedValue({ status: 200, message: '회원탈퇴 성공', data: null });
  });

  it('프로필 헤더에 사용자 이름과 이메일 정보가 정확히 렌더링되어야 한다 (DOM-3)', async () => {
    const { findByText } = await renderProfileScreen({
      onNavigateToAnalysis: mockNavigateToAnalysis,
      onNavigateToLogin: mockNavigateToLogin,
    });

    expect(await findByText('김선규')).toBeTruthy();
    expect(await findByText('sun925@yeolo.com')).toBeTruthy();
  });

  it('AI 여행 취향 분석 카드가 표시되고 "취향 보기" 버튼 클릭 시 콜백이 호출되어야 한다', async () => {
    const mockNavigateToTasteProfile = jest.fn();
    const { findByText, getByText } = await renderProfileScreen({
      onNavigateToTasteProfile: mockNavigateToTasteProfile,
      onNavigateToLogin: mockNavigateToLogin,
    });

    expect(await findByText('AI 여행 취향 분석')).toBeTruthy();

    const viewButton = getByText('나의 취향 보기');
    expect(viewButton).toBeTruthy();
    fireEvent.press(viewButton);

    await waitFor(() => {
      expect(mockNavigateToTasteProfile).toHaveBeenCalledTimes(1);
    });
  });

  it('"이용약관" 메뉴 클릭 시 이용약관 안내 모달이 노출되어야 한다', async () => {
    const { findByText, getByText } = await renderProfileScreen({
      onNavigateToLogin: mockNavigateToLogin,
    });

    const termsMenu = await findByText('이용약관');
    fireEvent.press(termsMenu);

    expect(await findByText('여로 서비스 이용약관')).toBeTruthy();
    const closeBtn = getByText('닫기');
    fireEvent.press(closeBtn);
  });

  it('"로그아웃" 메뉴 클릭 시 확인 모달이 뜨고 확인 누르면 logoutApi(API-FB-11) 호출 후 로그인 화면으로 이동해야 한다', async () => {
    const logoutSpy = jest.spyOn(commonApi, 'logoutApi');

    const { findByText, getByText } = await renderProfileScreen({
      onNavigateToAnalysis: mockNavigateToAnalysis,
      onNavigateToLogin: mockNavigateToLogin,
    });

    const logoutMenu = await findByText('로그아웃');
    fireEvent.press(logoutMenu);

    expect(await findByText('정말 로그아웃 하시겠습니까?')).toBeTruthy();

    const confirmBtn = getByText('로그아웃 확인');
    fireEvent.press(confirmBtn);

    await waitFor(() => {
      expect(logoutSpy).toHaveBeenCalled();
      expect(mockNavigateToLogin).toHaveBeenCalled();
    });
  });

  it('"탈퇴하기" 메뉴 클릭 시 경고 모달이 뜨고 확인 누르면 withdrawApi(API-FB-12) 호출 후 로그인 화면으로 이동해야 한다', async () => {
    const withdrawSpy = jest.spyOn(commonApi, 'withdrawApi');

    const { findByText, getByText } = await renderProfileScreen({
      onNavigateToAnalysis: mockNavigateToAnalysis,
      onNavigateToLogin: mockNavigateToLogin,
    });

    const withdrawMenu = await findByText('탈퇴하기');
    fireEvent.press(withdrawMenu);

    expect(await findByText('회원탈퇴 안내')).toBeTruthy();

    const confirmBtn = getByText('탈퇴 진행');
    fireEvent.press(confirmBtn);

    await waitFor(() => {
      expect(withdrawSpy).toHaveBeenCalled();
      expect(mockNavigateToLogin).toHaveBeenCalled();
    });
  });
});
