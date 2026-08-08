/**
 * @file ProfileScreen.test.tsx
 * @description Unit and integration tests for ProfileScreen, ProfileEditModal, and WithdrawModal (API-USER-2).
 */
import React from 'react';
import { fireEvent, waitFor, act } from '@testing-library/react-native';
import * as yeoloCommon from '@yeolo/common';
import { renderWithQueryClient as render } from './test-utils';
import { ProfileScreen } from '../src/screens/ProfileScreen';

describe('ProfileScreen (FUN-8: 프로필 화면, 닉네임 수정 및 회원 탈퇴 비즈니스 로직 API-USER-2)', () => {
  it('Figma UI 스펙 요소들(프로필 카드, AI 취향 카드, 설정 목록, 계정 링크)이 정상 렌더링되어야 한다', async () => {
    const { findByText, findByTestId } = await render(<ProfileScreen />);

    expect(await findByTestId('profile-screen')).toBeTruthy();
    expect(await findByTestId('profile-card')).toBeTruthy();
    expect(await findByText('김선규')).toBeTruthy();
    expect(await findByText('ksk85628781@gmail.com')).toBeTruthy();
    expect(await findByText('수정')).toBeTruthy();

    expect(await findByTestId('ai-taste-card')).toBeTruthy();
    expect(await findByText('AI 여행 취향 분석')).toBeTruthy();
    expect(await findByText('나의 취향 보기')).toBeTruthy();
    expect(await findByText('취향 재분석')).toBeTruthy();

    expect(await findByTestId('settings-section')).toBeTruthy();
    expect(await findByText('이용약관')).toBeTruthy();
    expect(await findByText('개인정보 처리방침')).toBeTruthy();
    expect(await findByText('고객 지원')).toBeTruthy();

    expect(await findByText('로그아웃')).toBeTruthy();
    expect(await findByText('탈퇴하기')).toBeTruthy();
  });

  it('수정 버튼 클릭 시 ProfileEditModal이 열리고 닉네임 변경 저장이 가능해야 한다', async () => {
    const { findByTestId, findByText, queryByTestId } = await render(
      <ProfileScreen />,
    );

    expect(queryByTestId('profile-edit-modal-card')).toBeNull();

    const btnEdit = await findByTestId('btn-edit-profile');
    fireEvent.press(btnEdit);

    expect(await findByTestId('profile-edit-modal-card')).toBeTruthy();
    expect(await findByText('프로필 정보 수정')).toBeTruthy();

    const input = await findByTestId('input-nickname');
    fireEvent.changeText(input, '여로탐험가');

    const btnSave = await findByTestId('btn-save-edit');
    fireEvent.press(btnSave);

    await waitFor(async () => {
      expect(await findByText('여로탐험가')).toBeTruthy();
    });
  });

  it('취향 보기 및 재분석 버튼 클릭 시 각 네비게이션 콜백 함수가 호출되어야 한다', async () => {
    const mockOnNavigateToTasteProfile = jest.fn();
    const mockOnReanalyzeTaste = jest.fn();

    const { findByTestId } = await render(
      <ProfileScreen
        onNavigateToTasteProfile={mockOnNavigateToTasteProfile}
        onReanalyzeTaste={mockOnReanalyzeTaste}
      />,
    );

    const btnViewTaste = await findByTestId('btn-view-taste');
    fireEvent.press(btnViewTaste);
    expect(mockOnNavigateToTasteProfile).toHaveBeenCalledTimes(1);

    const btnReanalyzeTaste = await findByTestId('btn-reanalyze-taste');
    fireEvent.press(btnReanalyzeTaste);
    expect(mockOnReanalyzeTaste).toHaveBeenCalledTimes(1);
  });

  it('탈퇴하기 링크 클릭 시 WithdrawModal이 표시되고 취소 시 닫혀야 한다', async () => {
    const { findByTestId, findByText, queryByTestId } = await render(
      <ProfileScreen />,
    );

    expect(queryByTestId('withdraw-modal-card')).toBeNull();

    const btnWithdraw = await findByTestId('btn-withdraw');
    fireEvent.press(btnWithdraw);

    expect(await findByTestId('withdraw-modal-card')).toBeTruthy();
    expect(await findByText('정말 탈퇴하시겠습니까?')).toBeTruthy();

    const btnCancel = await findByTestId('btn-cancel-withdraw');
    fireEvent.press(btnCancel);

    await waitFor(() => {
      expect(queryByTestId('withdraw-modal-card')).toBeNull();
    });
  });

  it('WithdrawModal에서 탈퇴 확정 클릭 시 withdrawApi(API-USER-2) 호출 후 로그인 화면으로 이동해야 한다', async () => {
    const mockOnNavigateToLogin = jest.fn();
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

    const btnConfirm = await findByTestId('btn-confirm-withdraw');
    await act(async () => {
      fireEvent.press(btnConfirm);
    });

    await waitFor(() => {
      expect(spyWithdraw).toHaveBeenCalledWith(expect.any(String), undefined, {
        reason: '사용자 요청 회원 탈퇴',
      });
      expect(mockOnNavigateToLogin).toHaveBeenCalledTimes(1);
    });
  });
});
