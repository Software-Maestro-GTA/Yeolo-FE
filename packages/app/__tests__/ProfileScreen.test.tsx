/**
 * @file ProfileScreen.test.tsx
 * @description Unit and integration tests for ProfileScreen reflecting updated requirements (removal of defaults, Alert withdrawal, and onEditProfile callback).
 */
import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, waitFor, act } from '@testing-library/react-native';
import * as yeoloCommon from '@yeolo/common';
import { renderWithQueryClient as render } from './test-utils';
import { ProfileScreen } from '../src/screens/ProfileScreen';

describe('ProfileScreen (FUN-11: 프로필 화면 개편 및 마이페이지 연동)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('Figma UI 스펙 요소들이 정상 렌더링되어야 하며 하드코딩된 DEFAULT 값이 없어야 한다', async () => {
    const { findByText, findByTestId, queryByText } = await render(
      <ProfileScreen />,
    );

    expect(await findByTestId('profile-screen')).toBeTruthy();
    expect(await findByTestId('profile-card')).toBeTruthy();

    // Check that default hardcoded user values ('김선규', 'ksk85628781@gmail.com') are removed
    expect(queryByText('김선규')).toBeNull();
    expect(queryByText('ksk85628781@gmail.com')).toBeNull();

    expect(await findByText('수정')).toBeTruthy();
    expect(await findByTestId('ai-taste-card')).toBeTruthy();
    expect(await findByText('AI 여행 취향 분석')).toBeTruthy();

    expect(await findByTestId('settings-section')).toBeTruthy();
    expect(await findByText('이용약관')).toBeTruthy();
    expect(await findByText('개인정보 처리방침')).toBeTruthy();
    expect(await findByText('고객 지원')).toBeTruthy();

    expect(await findByText('로그아웃')).toBeTruthy();
    expect(await findByText('탈퇴하기')).toBeTruthy();
  });

  it('수정 버튼 클릭 시 onEditProfile 콜백이 직접 호출되어야 한다', async () => {
    const mockOnEditProfile = jest.fn();
    const { findByTestId } = await render(
      <ProfileScreen onEditProfile={mockOnEditProfile} />,
    );

    const btnEdit = await findByTestId('btn-edit-profile');
    fireEvent.press(btnEdit);

    expect(mockOnEditProfile).toHaveBeenCalledTimes(1);
  });

  it('탈퇴하기 링크 클릭 시 Alert.alert가 호출되며, 확인 선택 시 withdrawApi(API-USER-2) 호출 후 로그인 화면으로 이동해야 한다', async () => {
    const mockOnNavigateToLogin = jest.fn();
    const spyAlert = jest.spyOn(Alert, 'alert');
    const spyWithdraw = jest
      .spyOn(yeoloCommon, 'withdrawApi')
      .mockResolvedValueOnce({
        status: 200,
        message: '회원탈퇴 성공',
        data: null,
      });

    const { findByTestId } = await render(
      <ProfileScreen onNavigateToLogin={mockOnNavigateToLogin} />,
    );

    const btnWithdraw = await findByTestId('btn-withdraw');
    fireEvent.press(btnWithdraw);

    expect(spyAlert).toHaveBeenCalledWith(
      '회원탈퇴',
      expect.any(String),
      expect.any(Array),
    );

    const buttons = spyAlert.mock.calls[0][2];
    const destructBtn = buttons?.find((b) => b.style === 'destructive');
    expect(destructBtn).toBeTruthy();

    await act(async () => {
      if (destructBtn && destructBtn.onPress) {
        await destructBtn.onPress();
      }
    });

    await waitFor(() => {
      expect(spyWithdraw).toHaveBeenCalledWith(expect.any(String), undefined, {
        reason: '서비스 이용 불편',
      });
      expect(mockOnNavigateToLogin).toHaveBeenCalledTimes(1);
    });
  });
});
