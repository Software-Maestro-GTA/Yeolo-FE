/**
 * @file ProfileInputScreen.test.tsx
 * @description Unit and integration tests for ProfileInputScreen component matching Figma UI specifications and API-USER-1.
 */
import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, waitFor, act } from '@testing-library/react-native';
import * as commonApi from '@yeolo/common';
import { renderWithQueryClient as render } from './test-utils';
import { ProfileInputScreen } from '../src/screens/ProfileInputScreen';
import { UI_STRINGS } from '../src/constants';

describe('ProfileInputScreen (TSK-61 / #64: 프로필 설정 화면)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

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

  it('닉네임이 공백일 경우 경고 알림이 발생하고 API가 호출되지 않아야 한다', async () => {
    const spyUpdateApi = jest.spyOn(commonApi, 'updateUserProfileApi');
    const mockOnSaveSuccess = jest.fn();
    const { findByTestId } = await render(
      <ProfileInputScreen onSaveSuccess={mockOnSaveSuccess} />,
    );

    const input = await findByTestId('input-profile-nickname');
    fireEvent.changeText(input, '   ');

    const btnSave = await findByTestId('btn-save-profile-input');
    fireEvent.press(btnSave);

    expect(Alert.alert).toHaveBeenCalledWith('알림', '닉네임을 입력해 주세요.');
    expect(spyUpdateApi).not.toHaveBeenCalled();
    expect(mockOnSaveSuccess).not.toHaveBeenCalled();
  });

  it('닉네임에 특수문자 입력 시 유효성 검증 에러 문구가 노출되고 저장 API가 호출되지 않아야 한다', async () => {
    const spyUpdateApi = jest.spyOn(commonApi, 'updateUserProfileApi');
    const { findByTestId, findByText } = await render(<ProfileInputScreen />);

    const input = await findByTestId('input-profile-nickname');
    fireEvent.changeText(input, '여로탐험가!@#');

    expect(await findByText('특수문자는 사용할 수 없습니다.')).toBeTruthy();

    const btnSave = await findByTestId('btn-save-profile-input');
    fireEvent.press(btnSave);

    expect(Alert.alert).toHaveBeenCalledWith(
      '알림',
      '특수문자는 사용할 수 없습니다.',
    );
    expect(spyUpdateApi).not.toHaveBeenCalled();
  });

  it('저장 버튼 클릭 시 updateUserProfileApi가 성공하면 onSaveSuccess 콜백 및 성공 안내가 호출되어야 한다', async () => {
    const spyUpdateApi = jest
      .spyOn(commonApi, 'updateUserProfileApi')
      .mockResolvedValue({
        status: 200,
        message: '사용자 프로필 수정 성공',
        data: {
          user: {
            userId: 'user-123',
            provider: 'google',
            email: 'ksk85628781@gmail.com',
            displayName: '여로탐험가',
            profileImageUrl:
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb',
            status: 'active',
            lastLoginAt: '2026-08-01T00:00:00Z',
          },
        },
      });

    const mockOnSaveSuccess = jest.fn();
    const { findByTestId } = await render(
      <ProfileInputScreen onSaveSuccess={mockOnSaveSuccess} />,
    );

    const input = await findByTestId('input-profile-nickname');
    fireEvent.changeText(input, '여로탐험가');

    const btnSave = await findByTestId('btn-save-profile-input');
    await act(async () => {
      fireEvent.press(btnSave);
    });

    await waitFor(() => {
      expect(spyUpdateApi).toHaveBeenCalledWith(
        expect.any(String),
        undefined,
        expect.objectContaining({
          displayName: '여로탐험가',
        }),
      );
      const callArgs = spyUpdateApi.mock.calls[0];
      const payload = callArgs[2] as any;
      expect(payload).not.toHaveProperty('email');
      expect(mockOnSaveSuccess).toHaveBeenCalled();
    });
  });

  it('updateUserProfileApi 호출 중 에러 발생 시 에러 알림이 노출되어야 한다', async () => {
    jest
      .spyOn(commonApi, 'updateUserProfileApi')
      .mockRejectedValue(new commonApi.ApiError(400, '중복된 닉네임입니다.'));

    const { findByTestId } = await render(<ProfileInputScreen />);

    const input = await findByTestId('input-profile-nickname');
    fireEvent.changeText(input, '중복닉네임');

    const btnSave = await findByTestId('btn-save-profile-input');
    await act(async () => {
      fireEvent.press(btnSave);
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalled();
    });
  });

  it('아바타 피커 클릭 시 프로필 사진 변경 바텀 시트 모달이 떠야 한다', async () => {
    const { findByTestId } = await render(<ProfileInputScreen />);

    const btnAvatar = await findByTestId('btn-avatar-picker');
    fireEvent.press(btnAvatar);

    expect(await findByTestId('avatar-action-bottom-sheet')).toBeTruthy();
    expect(await findByTestId('btn-select-gallery')).toBeTruthy();
    expect(await findByTestId('btn-reset-default')).toBeTruthy();
  });

  it('나중에 하기 버튼 및 뒤로가기 버튼 클릭 시 onGoBack 콜백이 호출되어야 한다', async () => {
    const mockOnGoBack = jest.fn();
    const { findByTestId } = await render(
      <ProfileInputScreen onGoBack={mockOnGoBack} />,
    );

    const btnSkip = await findByTestId('btn-skip-profile-input');
    fireEvent.press(btnSkip);
    expect(mockOnGoBack).toHaveBeenCalledTimes(1);

    const btnBack = await findByTestId('btn-back');
    fireEvent.press(btnBack);
    expect(mockOnGoBack).toHaveBeenCalledTimes(2);
  });
});
