/**
 * @file ProfileScreen.test.tsx
 * @description Integration and unit tests for ProfileScreen component (User Profile, Taste Analysis card, Settings, Terms, Logout API-FB-11, and Withdraw API-FB-12).
 * @requirements REQ-11, REQ-12
 * @functional FUN-4
 * @api API-FB-11, API-FB-12
 * @author Antigravity Agent
 */
import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { ProfileScreen } from '../src/screens/ProfileScreen';
import AsyncStorage from '@react-native-async-storage/async-storage';

const mockUserData = {
  userId: '550e8400-e29b-41d4-a716-446655440000',
  displayName: '김선규',
  email: 'sun925@yeolo.com',
  profileImageUrl: 'https://example.com/avatar.jpg',
};

describe('ProfileScreen Integration Tests (Issue #21 / API-FB-11 / API-FB-12 / DOM-3)', () => {
  const mockNavigateToAnalysis = jest.fn();
  const mockNavigateToLogin = jest.fn();
  const mockLogoutApi = jest.fn();
  const mockWithdrawApi = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.setItem('accessToken', 'mock-access-token');
    await AsyncStorage.setItem('refreshToken', 'mock-refresh-token');
    mockLogoutApi.mockResolvedValue({ status: 200, message: '로그아웃 성공', data: null });
    mockWithdrawApi.mockResolvedValue({ status: 200, message: '회원탈퇴 성공', data: null });
  });

  it('프로필 헤더에 사용자 이름과 이메일 정보가 정확히 렌더링되어야 한다 (DOM-3)', async () => {
    const { findByText } = await render(
      <ProfileScreen
        user={mockUserData}
        onNavigateToAnalysis={mockNavigateToAnalysis}
        onNavigateToLogin={mockNavigateToLogin}
        logoutFetcher={mockLogoutApi}
        withdrawFetcher={mockWithdrawApi}
      />
    );

    expect(await findByText('김선규')).toBeTruthy();
    expect(await findByText('sun925@yeolo.com')).toBeTruthy();
  });

  it('AI 여행 취향 분석 카드가 표시되고 "취향 분석 재요청" 클릭 시 콜백이 호출되어야 한다', async () => {
    const { findByText, getByText } = await render(
      <ProfileScreen
        user={mockUserData}
        onNavigateToAnalysis={mockNavigateToAnalysis}
        onNavigateToLogin={mockNavigateToLogin}
        logoutFetcher={mockLogoutApi}
        withdrawFetcher={mockWithdrawApi}
      />
    );

    expect(await findByText('AI 여행 취향 분석')).toBeTruthy();

    const reAnalysisButton = getByText('취향 분석 요청');
    expect(reAnalysisButton).toBeTruthy();

    fireEvent.press(reAnalysisButton);
    expect(mockNavigateToAnalysis).toHaveBeenCalledTimes(1);
  });

  it('"이용약관" 메뉴 클릭 시 이용약관 안내 모달이 노출되어야 한다', async () => {
    const { findByText, getByText } = await render(
      <ProfileScreen
        user={mockUserData}
        onNavigateToAnalysis={mockNavigateToAnalysis}
        onNavigateToLogin={mockNavigateToLogin}
        logoutFetcher={mockLogoutApi}
        withdrawFetcher={mockWithdrawApi}
      />
    );

    const termsMenu = await findByText('이용약관');
    fireEvent.press(termsMenu);

    expect(await findByText('여로 서비스 이용약관')).toBeTruthy();
    const closeBtn = getByText('닫기');
    fireEvent.press(closeBtn);
  });

  it('"로그아웃" 메뉴 클릭 시 확인 모달이 뜨고 확인 누르면 logoutApi(API-FB-11) 호출 후 로그인 화면으로 이동해야 한다', async () => {
    const { findByText, getByText } = await render(
      <ProfileScreen
        user={mockUserData}
        onNavigateToAnalysis={mockNavigateToAnalysis}
        onNavigateToLogin={mockNavigateToLogin}
        logoutFetcher={mockLogoutApi}
        withdrawFetcher={mockWithdrawApi}
      />
    );

    const logoutMenu = await findByText('로그아웃');
    fireEvent.press(logoutMenu);

    expect(await findByText('정말 로그아웃 하시겠습니까?')).toBeTruthy();

    const confirmBtn = getByText('로그아웃 확인');
    fireEvent.press(confirmBtn);

    await waitFor(() => {
      expect(mockLogoutApi).toHaveBeenCalledWith(
        expect.any(String),
        'mock-access-token',
        { refreshToken: 'mock-refresh-token' }
      );
      expect(mockNavigateToLogin).toHaveBeenCalled();
    });
  });

  it('"탈퇴하기" 메뉴 클릭 시 경고 모달이 뜨고 확인 누르면 withdrawApi(API-FB-12) 호출 후 로그인 화면으로 이동해야 한다', async () => {
    const { findByText, getByText } = await render(
      <ProfileScreen
        user={mockUserData}
        onNavigateToAnalysis={mockNavigateToAnalysis}
        onNavigateToLogin={mockNavigateToLogin}
        logoutFetcher={mockLogoutApi}
        withdrawFetcher={mockWithdrawApi}
      />
    );

    const withdrawMenu = await findByText('탈퇴하기');
    fireEvent.press(withdrawMenu);

    expect(await findByText('회원탈퇴 안내')).toBeTruthy();

    const confirmBtn = getByText('탈퇴 진행');
    fireEvent.press(confirmBtn);

    await waitFor(() => {
      expect(mockWithdrawApi).toHaveBeenCalledWith(
        expect.any(String),
        'mock-access-token',
        { reason: '사용자 요청' }
      );
      expect(mockNavigateToLogin).toHaveBeenCalled();
    });
  });
});
