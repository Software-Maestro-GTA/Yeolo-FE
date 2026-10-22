/**
 * @file PhotoConsentScreen.test.tsx
 * @description Unit test for PhotoConsentScreen component matching Figma UI specifications and API-PREF-2 consent flow.
 */
import React from 'react';
import { fireEvent, act, waitFor } from '@testing-library/react-native';
import * as yeoloCommon from '@yeolo/common';
import { PhotoConsentScreen } from '../src/screens/PhotoConsentScreen';
import { UI_STRINGS } from '../src/constants';
import { renderWithQueryClient as render } from './test-utils';
import { Alert } from 'react-native';
import { requestPermissionsAsync } from 'expo-media-library';

describe('PhotoConsentScreen UI & Navigation', () => {
  const mockOnNext = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('최신 Figma UI v3 타이틀, 온보딩 영상, 안심 안내 목록 및 동의 버튼을 표시한다', async () => {
    const { getByText, getByTestId, queryByTestId } = await render(
      <PhotoConsentScreen onNext={mockOnNext} />,
    );

    expect(
      getByText(/사진으로 쉽고 빠르게\s*여행 취향을 파악해드릴게요/),
    ).toBeTruthy();
    expect(getByText(/안심하세요!/)).toBeTruthy();
    expect(getByText(/저희는 사진을 볼 수 없어요/)).toBeTruthy();
    expect(getByText(/사진은 서버에 저장되지 않아요/)).toBeTruthy();
    expect(getByText(/취향파악이 끝나면 데이터는 소멸돼요/)).toBeTruthy();
    expect(getByText('내 여행 취향 알아보기')).toBeTruthy();

    expect(
      getByTestId('onboarding-video', { includeHiddenElements: true }),
    ).toBeTruthy();
    expect(getByTestId('assurance-card')).toBeTruthy();
    expect(queryByTestId('coupon-tooltip-badge')).toBeNull();
    expect(getByTestId('consent-start-button')).toBeTruthy();
  });

  it('동의하고 시작하기 버튼 클릭 시 savePhotoConsentApi 성공 후 onNext가 호출되어야 한다 (API-PREF-2)', async () => {
    const spySaveConsent = jest
      .spyOn(yeoloCommon, 'savePhotoConsentApi')
      .mockResolvedValueOnce({
        status: 200,
        message: '사진 데이터 분석 동의 저장 성공',
        data: {
          consent: {
            agreed: true,
            agreedAt: '2026-08-08T10:00:00.000Z',
            consentVersion: 'v1.0',
          },
        },
      });

    const { getByTestId } = await render(
      <PhotoConsentScreen onNext={mockOnNext} />,
    );

    await act(async () => {
      fireEvent.press(getByTestId('consent-start-button'));
    });

    await waitFor(() => {
      expect(spySaveConsent).toHaveBeenCalledWith(
        expect.any(String),
        undefined,
        { agreed: true, consentVersion: 'v1.0' },
      );
      expect(mockOnNext).toHaveBeenCalledTimes(1);
    });
  });

  it.each([
    ['all', 'granted', 'all'],
    ['limited', 'granted', 'limited'],
    ['none', 'denied', 'denied'],
  ])(
    '권한 %s 응답 이후에만 현재 화면에서 분기한다',
    async (accessPrivileges, status, expected) => {
      let resolvePermission!: (value: unknown) => void;
      (requestPermissionsAsync as jest.Mock).mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolvePermission = resolve;
          }),
      );
      jest
        .spyOn(yeoloCommon, 'savePhotoConsentApi')
        .mockResolvedValueOnce({ status: 200, data: {} } as any);
      const { getByTestId, getByText } = await render(
        <PhotoConsentScreen onNext={mockOnNext} />,
      );
      await fireEvent.press(getByTestId('consent-start-button'));
      await waitFor(() => expect(requestPermissionsAsync).toHaveBeenCalled());
      expect(getByText(UI_STRINGS.PHOTO_CONSENT.MAIN_TITLE)).toBeTruthy();
      expect(mockOnNext).not.toHaveBeenCalled();
      await act(async () => resolvePermission({ status, accessPrivileges }));
      await waitFor(() => expect(mockOnNext).toHaveBeenCalledWith(expected));
    },
  );

  it('API 동의 저장 실패 시 Alert 에러 안내 메시지가 표기되고 onNext가 호출되지 않아야 한다', async () => {
    const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    jest
      .spyOn(yeoloCommon, 'savePhotoConsentApi')
      .mockRejectedValueOnce(
        new yeoloCommon.ApiError(500, '사진 동의 저장 실패'),
      );

    const { getByTestId } = await render(
      <PhotoConsentScreen onNext={mockOnNext} />,
    );

    await act(async () => {
      fireEvent.press(getByTestId('consent-start-button'));
    });

    await waitFor(() => {
      expect(mockOnNext).not.toHaveBeenCalled();
      expect(alertSpy).toHaveBeenCalledWith(
        '오류',
        '사진 데이터 분석 동의 저장 중 오류가 발생했습니다.',
      );
    });

    alertSpy.mockRestore();
  });
});
