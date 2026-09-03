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

describe('PhotoConsentScreen UI & Navigation', () => {
  const mockOnNext = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('Figma 스펙 타이틀, 보증 카드 2개 및 동의 버튼이 정상 렌더링되어야 한다', async () => {
    const { getByText, getByTestId } = await render(
      <PhotoConsentScreen onNext={mockOnNext} />,
    );

    expect(getByText(UI_STRINGS.PHOTO_CONSENT.MAIN_TITLE)).toBeTruthy();
    expect(getByText(UI_STRINGS.PHOTO_CONSENT.CARD_1_TITLE)).toBeTruthy();
    expect(getByText(UI_STRINGS.PHOTO_CONSENT.CARD_2_TITLE)).toBeTruthy();
    expect(getByText(UI_STRINGS.PHOTO_CONSENT.START_BUTTON)).toBeTruthy();

    expect(getByTestId('hero-illustration')).toBeTruthy();
    expect(getByTestId('info-card-1')).toBeTruthy();
    expect(getByTestId('info-card-2')).toBeTruthy();
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
