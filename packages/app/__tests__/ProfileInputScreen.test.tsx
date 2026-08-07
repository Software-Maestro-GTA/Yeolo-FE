/**
 * @file ProfileInputScreen.test.tsx
 * @description Unit tests for ProfileInputScreen component matching Figma UI specifications.
 */
import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithQueryClient as render } from './test-utils';
import { ProfileInputScreen } from '../src/screens/ProfileInputScreen';

describe('ProfileInputScreen (Figma 프로필 설정 화면)', () => {
  it('Figma 스펙의 주요 요소들(프로필 설정 타이틀, 아바타 피커, 닉네임/이메일 입력란, 액션 버튼)이 정상 렌더링되어야 한다', async () => {
    const { findByTestId, findByText } = await render(<ProfileInputScreen />);

    expect(await findByTestId('profile-input-screen')).toBeTruthy();
    expect(await findByText('프로필 설정')).toBeTruthy();
    expect(await findByTestId('btn-avatar-picker')).toBeTruthy();
    expect(await findByText('닉네임 *')).toBeTruthy();
    expect(await findByTestId('input-profile-nickname')).toBeTruthy();
    expect(await findByText('이메일 *')).toBeTruthy();
    expect(await findByTestId('btn-save-profile-input')).toBeTruthy();
    expect(await findByTestId('btn-skip-profile-input')).toBeTruthy();
  });

  it('저장 버튼 클릭 시 닉네임 유효성 검사 및 저장 콜백 함수가 호출되어야 한다', async () => {
    const mockOnSaveSuccess = jest.fn();
    const { findByTestId } = await render(
      <ProfileInputScreen onSaveSuccess={mockOnSaveSuccess} />
    );

    const input = await findByTestId('input-profile-nickname');
    fireEvent.changeText(input, '여로탐험가');

    const btnSave = await findByTestId('btn-save-profile-input');
    fireEvent.press(btnSave);

    await waitFor(() => {
      expect(mockOnSaveSuccess).toHaveBeenCalled();
    });
  });

  it('나중에 하기 버튼 클릭 시 뒤로가기 콜백이 호출되어야 한다', async () => {
    const mockOnGoBack = jest.fn();
    const { findByTestId } = await render(
      <ProfileInputScreen onGoBack={mockOnGoBack} />
    );

    const btnSkip = await findByTestId('btn-skip-profile-input');
    fireEvent.press(btnSkip);

    expect(mockOnGoBack).toHaveBeenCalledTimes(1);
  });
});
