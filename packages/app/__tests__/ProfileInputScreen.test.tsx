/**
 * @file ProfileInputScreen.test.tsx
 * @description Unit and integration tests for ProfileInputScreen component matching Figma UI specifications and API-USER-1.
 */
import React from 'react';
import { Alert } from 'react-native';
import { fireEvent, waitFor, act } from '@testing-library/react-native';
import * as commonApi from '@yeolo/common';
import { renderWithQueryClient as render } from './test-utils';
import {
  ProfileInputScreen,
  validateNickname,
} from '../src/screens/ProfileInputScreen';
import { UI_STRINGS } from '../src/constants';
import { AuthContext } from '../src/context/AuthContext';

const savedProfile = {
  status: 200,
  message: '사용자 프로필 수정 성공',
  data: {
    user: {
      userId: 'user-123',
      provider: 'google',
      email: 'test@example.com',
      displayName: '여로탐험가',
      profileImageUrl: null,
      status: 'active',
      lastLoginAt: '2026-08-01T00:00:00Z',
    },
  },
};

describe('ProfileInputScreen (TSK-61 / #64: 프로필 설정 화면)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  it.each([11, 12])('최신 UI v3의 %i자 닉네임은 유효하다', (length) => {
    expect(validateNickname('가'.repeat(length))).toBeNull();
  });

  it.each([1, 13])(
    '%i자 닉네임은 2–12자 범위를 벗어나 저장할 수 없다',
    (length) => {
      expect(validateNickname('가'.repeat(length))).toBe(
        UI_STRINGS.PROFILE_INPUT.NICKNAME_ERROR_LENGTH,
      );
    },
  );

  it('최신 Figma의 프로필 헤더, 사진 변경, 읽기 전용 이메일, 닉네임과 저장 액션을 표시한다', async () => {
    const { findByTestId, findByText, queryByTestId } = await render(
      <ProfileInputScreen />,
    );

    expect(await findByTestId('profile-input-screen')).toBeTruthy();
    expect(await findByText('프로필')).toBeTruthy();
    expect(await findByTestId('btn-avatar-picker')).toBeTruthy();
    expect(await findByText('닉네임')).toBeTruthy();
    expect(await findByTestId('input-profile-nickname')).toBeTruthy();
    expect(await findByTestId('nickname-counter')).toBeTruthy();
    expect(await findByTestId('btn-save-profile-input')).toBeTruthy();
    expect(queryByTestId('btn-skip-profile-input')).toBeNull();
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
    fireEvent.changeText(input, '여로탐험가의새여행취향길');
    expect(await findByTestId('nickname-counter')).toHaveTextContent('12 / 12');

    const btnSave = await findByTestId('btn-save-profile-input');
    await act(async () => {
      fireEvent.press(btnSave);
    });

    await waitFor(() => {
      expect(spyUpdateApi).toHaveBeenCalledWith(
        expect.any(String),
        undefined,
        expect.objectContaining({
          displayName: '여로탐험가의새여행취향길',
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

  it('저장 성공으로 이미 복귀한 뒤 알림을 확인해도 다시 뒤로 이동하지 않는다', async () => {
    jest
      .spyOn(commonApi, 'updateUserProfileApi')
      .mockResolvedValue(savedProfile);
    const onSaveSuccess = jest.fn();
    const onGoBack = jest.fn();
    const ui = await render(
      <ProfileInputScreen onSaveSuccess={onSaveSuccess} onGoBack={onGoBack} />,
    );
    await fireEvent.changeText(
      ui.getByTestId('input-profile-nickname'),
      '여로탐험가',
    );
    await fireEvent.press(ui.getByTestId('btn-save-profile-input'));
    await waitFor(() => expect(onSaveSuccess).toHaveBeenCalledTimes(1));
    const buttons = jest.mocked(Alert.alert).mock.calls.at(-1)?.[2];
    await act(async () => buttons?.[0]?.onPress?.());
    expect(onGoBack).not.toHaveBeenCalled();
    expect(onSaveSuccess).toHaveBeenCalledTimes(1);
  });

  it('저장 완료 콜백이 없으면 성공 알림을 확인할 때 한 번 복귀한다', async () => {
    jest
      .spyOn(commonApi, 'updateUserProfileApi')
      .mockResolvedValue(savedProfile);
    const onGoBack = jest.fn();
    const ui = await render(<ProfileInputScreen onGoBack={onGoBack} />);
    await fireEvent.changeText(
      ui.getByTestId('input-profile-nickname'),
      '여로탐험가',
    );
    await fireEvent.press(ui.getByTestId('btn-save-profile-input'));
    await waitFor(() => expect(Alert.alert).toHaveBeenCalled());
    expect(onGoBack).not.toHaveBeenCalled();
    const buttons = jest.mocked(Alert.alert).mock.calls.at(-1)?.[2];
    await act(async () => buttons?.[0]?.onPress?.());
    expect(onGoBack).toHaveBeenCalledTimes(1);
  });

  it('저장 중 화면을 떠나면 늦은 성공은 사용자 정보만 갱신하고 화면 이동이나 알림을 만들지 않는다', async () => {
    let resolveSave: (value: typeof savedProfile) => void = () => {};
    const save = jest.spyOn(commonApi, 'updateUserProfileApi').mockReturnValue(
      new Promise((resolve) => {
        resolveSave = resolve;
      }),
    );
    const onSaveSuccess = jest.fn();
    const updateUser = jest.fn();
    const ui = await render(
      <AuthContext.Provider value={{ updateUser } as any}>
        <ProfileInputScreen onSaveSuccess={onSaveSuccess} />
      </AuthContext.Provider>,
    );
    await fireEvent.changeText(
      ui.getByTestId('input-profile-nickname'),
      '여로탐험가',
    );
    const savePress = fireEvent.press(ui.getByTestId('btn-save-profile-input'));
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    await ui.unmount();
    await act(async () => {
      resolveSave(savedProfile);
      await savePress;
    });
    expect(updateUser).toHaveBeenCalledWith({
      displayName: '여로탐험가',
      profileImageUrl: null,
    });
    expect(onSaveSuccess).not.toHaveBeenCalled();
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('저장 중 화면을 떠나면 늦은 실패 알림도 표시하지 않는다', async () => {
    let rejectSave: (reason: Error) => void = () => {};
    const save = jest.spyOn(commonApi, 'updateUserProfileApi').mockReturnValue(
      new Promise((_, reject) => {
        rejectSave = reject;
      }),
    );
    const ui = await render(<ProfileInputScreen />);
    await fireEvent.changeText(
      ui.getByTestId('input-profile-nickname'),
      '여로탐험가',
    );
    const savePress = fireEvent.press(ui.getByTestId('btn-save-profile-input'));
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    await ui.unmount();
    await act(async () => {
      rejectSave(new commonApi.ApiError(400, '저장 실패'));
      await savePress;
    });
    expect(Alert.alert).not.toHaveBeenCalled();
  });

  it('아바타 피커 클릭 시 프로필 사진 변경 바텀 시트 모달이 떠야 한다', async () => {
    const { findByTestId } = await render(<ProfileInputScreen />);

    const btnAvatar = await findByTestId('btn-avatar-picker');
    fireEvent.press(btnAvatar);

    expect(await findByTestId('avatar-action-bottom-sheet')).toBeTruthy();
    expect(await findByTestId('btn-select-gallery')).toBeTruthy();
    expect(await findByTestId('btn-reset-default')).toBeTruthy();
  });

  it('뒤로가기 버튼으로 편집을 저장하지 않고 이전 화면으로 돌아간다', async () => {
    const mockOnGoBack = jest.fn();
    const { findByTestId } = await render(
      <ProfileInputScreen onGoBack={mockOnGoBack} />,
    );

    const btnBack = await findByTestId('btn-back');
    fireEvent.press(btnBack);
    expect(mockOnGoBack).toHaveBeenCalledTimes(1);
  });
});
