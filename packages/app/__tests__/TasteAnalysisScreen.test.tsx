/**
 * @file TasteAnalysisScreen.test.tsx
 * @description Verifies analysis layouts, limited access, shared re-entry and closed-screen completion isolation.
 * @jest-environment-options {"customExportConditions":["node","node-addons"]}
 */
import React from 'react';
import { Platform } from 'react-native';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { renderWithQueryClient as render } from './test-utils';
import { TasteAnalysisScreen } from '../src/screens/TasteAnalysisScreen';
import { UI_STRINGS } from '../src/constants';
import * as MediaLibrary from 'expo-media-library';
import { http, HttpResponse } from 'msw';
import { server } from './mocks/server';
import { useTasteStore } from '@yeolo/common';
// Keep MSW's HTTP body and the real SSE parser in the same stream realm.
jest.mock('parse-sse', () => {
  Object.assign(globalThis, require('node:stream/web'));
  return jest.requireActual('parse-sse');
});
Object.assign(globalThis, {
  ...require('node:stream/web'),
  TextEncoder: require('node:util').TextEncoder,
  TextDecoder: require('node:util').TextDecoder,
});
const originalAnalyzeTaste = useTasteStore.getState().analyzeTaste;
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
const nativeLibrary = require('expo-media-library') as {
  presentPermissionsPicker: jest.Mock;
  addListener: jest.Mock;
};
nativeLibrary.presentPermissionsPicker = jest.fn().mockResolvedValue(undefined);
nativeLibrary.addListener = jest.fn(() => ({ remove: jest.fn() }));
import { fetchPhotosWithExifData } from '../src/services/photoService';

jest.mock('../src/services/photoService', () => ({
  fetchPhotosWithExifData: jest.fn().mockResolvedValue([
    {
      sourceImageId: 'asset-1',
      capturedAt: '2026-08-08T00:00:00.000Z',
      latitude: 37.5665,
      longitude: 126.978,
      timezone: 'UTC',
    },
  ]),
}));

describe('TasteAnalysisScreen UI & Progress', () => {
  const mockOnFinish = jest.fn();
  const mockOnFail = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.replaceProperty(Platform, 'OS', 'android');
    useTasteStore.setState({ analyzeTaste: originalAnalyzeTaste });
    jest.useFakeTimers();
    (fetchPhotosWithExifData as jest.Mock).mockResolvedValue([
      {
        sourceImageId: 'asset-1',
        capturedAt: '2026-08-08T00:00:00.000Z',
        latitude: 37.5665,
        longitude: 126.978,
        timezone: 'UTC',
      },
    ]);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('제한 접근도 실제 분석을 진행하고 완료 전에는 시간이 지나도 실패 화면으로 전환하지 않는다', async () => {
    let finish!: (id: string) => void;
    const analyze = jest
      .spyOn(require('@yeolo/common').useTasteStore.getState(), 'analyzeTaste')
      .mockImplementation(
        () =>
          new Promise((resolve) => {
            finish = resolve as (id: string) => void;
          }),
      );
    const screen = await render(
      <TasteAnalysisScreen mode='limited' onFinish={mockOnFinish} />,
    );
    await waitFor(() => expect(analyze).toHaveBeenCalledTimes(1));
    expect(fetchPhotosWithExifData).toHaveBeenCalledTimes(1);
    await act(async () => {
      jest.advanceTimersByTime(10000);
    });
    expect(screen.queryByText(UI_STRINGS.TASTE_ANALYSIS.FAIL_TITLE)).toBeNull();
    await act(async () => {
      finish('selected-photos-profile');
    });
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(mockOnFinish).toHaveBeenCalledWith('selected-photos-profile');
  });

  it('표본이 부족하면 서버 분석을 요청하지 않고 오류를 안내해야 한다', async () => {
    const useTasteStore = require('@yeolo/common').useTasteStore;
    const analyze = jest.spyOn(useTasteStore.getState(), 'analyzeTaste');
    (fetchPhotosWithExifData as jest.Mock).mockRejectedValueOnce(
      new Error(UI_STRINGS.TASTE_ANALYSIS.INSUFFICIENT_PHOTOS_ERROR),
    );
    const { getByText } = await render(
      <TasteAnalysisScreen onFinish={mockOnFinish} onFail={mockOnFail} />,
    );
    await waitFor(() =>
      expect(getByText(UI_STRINGS.TASTE_ANALYSIS.FAIL_SUBTITLE)).toBeTruthy(),
    );
    expect(analyze).not.toHaveBeenCalled();
    expect(mockOnFinish).not.toHaveBeenCalled();
  });

  it('제한 접근 표본 부족 시 사진 선택을 바꿀 수 있도록 설정 버튼을 제공해야 한다', async () => {
    (fetchPhotosWithExifData as jest.Mock).mockRejectedValueOnce(
      new Error(UI_STRINGS.TASTE_ANALYSIS.LIMITED_PHOTOS_ERROR),
    );
    const { getByText } = await render(
      <TasteAnalysisScreen
        mode='limited'
        onFinish={mockOnFinish}
        onFail={mockOnFail}
      />,
    );
    await waitFor(() =>
      expect(
        getByText(UI_STRINGS.TASTE_ANALYSIS.ALLOW_ALL_BUTTON),
      ).toBeTruthy(),
    );
  });

  it('최신 UI v3 제목과 접근성 파이프라인 메시지를 제공하고 닫기 동작을 유지한다', async () => {
    const onClose = jest.fn();
    let finishAnalysis!: (id: string) => void;
    jest
      .spyOn(require('@yeolo/common').useTasteStore.getState(), 'analyzeTaste')
      .mockImplementation(
        () =>
          new Promise((resolve) => {
            finishAnalysis = resolve as (id: string) => void;
          }),
      );
    const { getByText, getByTestId, queryByTestId } = await render(
      <TasteAnalysisScreen
        onFinish={mockOnFinish}
        onFail={mockOnFail}
        onClose={onClose}
      />,
    );
    expect(getByText('열심히 분석하고 있어요')).toBeTruthy();
    expect(queryByTestId('analysis-illustration')).toBeNull();
    expect(getByTestId('analysis-progress-message')).toBeTruthy();
    await fireEvent.press(getByTestId('analysis-close-button'));
    expect(onClose).toHaveBeenCalledTimes(1);
    await act(async () => {
      finishAnalysis('finished-preview');
    });
  });

  it('사진 수집 중 화면을 닫으면 수집 완료 후 서버 분석을 시작하지 않는다', async () => {
    let finishPhotos!: (images: unknown[]) => void;
    (fetchPhotosWithExifData as jest.Mock).mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          finishPhotos = resolve;
        }),
    );
    const analyze = jest
      .spyOn(require('@yeolo/common').useTasteStore.getState(), 'analyzeTaste')
      .mockResolvedValue('unused');
    const screen = await render(
      <TasteAnalysisScreen onFinish={mockOnFinish} />,
    );
    await waitFor(() =>
      expect(fetchPhotosWithExifData).toHaveBeenCalledTimes(1),
    );
    await screen.unmount();
    await act(async () => {
      finishPhotos([]);
    });
    expect(analyze).not.toHaveBeenCalled();
    expect(mockOnFinish).not.toHaveBeenCalled();
  });

  it('분석 중 닫았다가 다시 들어오면 기존 요청과 진행 상태를 이어받는다', async () => {
    const store = require('@yeolo/common').useTasteStore;
    let finishAnalysis!: (id: string) => void;
    const analyze = jest
      .spyOn(store.getState(), 'analyzeTaste')
      .mockImplementation(
        () =>
          new Promise((resolve) => {
            finishAnalysis = resolve as (id: string) => void;
          }),
      );
    const firstFinish = jest.fn(),
      secondFinish = jest.fn();
    const first = await render(<TasteAnalysisScreen onFinish={firstFinish} />);
    await waitFor(() => expect(analyze).toHaveBeenCalledTimes(1));
    await act(async () => {
      store
        .getState()
        .setProgress('ANALYZING_PREFERENCE', '기존 분석이 진행 중입니다.');
    });
    await first.unmount();
    const second = await render(
      <TasteAnalysisScreen onFinish={secondFinish} />,
    );
    await waitFor(() =>
      expect(second.getByText('기존 분석이 진행 중입니다.')).toBeTruthy(),
    );
    expect(fetchPhotosWithExifData).toHaveBeenCalledTimes(1);
    expect(analyze).toHaveBeenCalledTimes(1);
    await act(async () => {
      finishAnalysis('shared-result');
    });
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(firstFinish).not.toHaveBeenCalled();
    expect(secondFinish).toHaveBeenCalledWith('shared-result');
  });

  it('사진 수집 도중 재진입해도 기기 사진을 중복 수집하지 않는다', async () => {
    let finishPhotos!: (images: unknown[]) => void;
    (fetchPhotosWithExifData as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) => {
          finishPhotos = resolve;
        }),
    );
    const analyze = jest
      .spyOn(require('@yeolo/common').useTasteStore.getState(), 'analyzeTaste')
      .mockResolvedValue('shared-photos');
    const first = await render(<TasteAnalysisScreen onFinish={mockOnFinish} />);
    await waitFor(() =>
      expect(fetchPhotosWithExifData).toHaveBeenCalledTimes(1),
    );
    await first.unmount();
    const secondFinish = jest.fn();
    await render(<TasteAnalysisScreen onFinish={secondFinish} />);
    expect(fetchPhotosWithExifData).toHaveBeenCalledTimes(1);
    await act(async () => {
      finishPhotos([]);
    });
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(analyze).toHaveBeenCalledTimes(1);
    expect(secondFinish).toHaveBeenCalledWith('shared-photos');
    expect(mockOnFinish).not.toHaveBeenCalled();
  });

  it('계정이 바뀌면 이전 분석 결과를 전달하지 않고 기존 요청이 끝난 뒤 새 분석을 시작한다', async () => {
    await AsyncStorage.setItem('accessToken', 'first-account');
    let finishFirst!: (id: string) => void;
    const analyze = jest
      .spyOn(require('@yeolo/common').useTasteStore.getState(), 'analyzeTaste')
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finishFirst = resolve as (id: string) => void;
          }),
      )
      .mockResolvedValueOnce('second-account-result');
    const first = await render(<TasteAnalysisScreen onFinish={mockOnFinish} />);
    await waitFor(() => expect(analyze).toHaveBeenCalledTimes(1));
    await first.unmount();
    await AsyncStorage.setItem('accessToken', 'second-account');
    const secondFinish = jest.fn();
    await render(<TasteAnalysisScreen onFinish={secondFinish} />);
    expect(analyze).toHaveBeenCalledTimes(1);
    await act(async () => {
      finishFirst('first-account-result');
    });
    await waitFor(() => expect(analyze).toHaveBeenCalledTimes(2));
    expect(analyze.mock.calls[1][1]).toBe('second-account');
    expect(fetchPhotosWithExifData).toHaveBeenCalledTimes(2);
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(mockOnFinish).not.toHaveBeenCalled();
    expect(secondFinish).toHaveBeenCalledWith('second-account-result');
    expect(secondFinish).toHaveBeenCalledTimes(1);
  });

  it('선택 사진의 정보가 부족하면 실패 화면에서 다시 선택하고 실제 분석을 재시도한다', async () => {
    (MediaLibrary.getPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
      accessPrivileges: 'limited',
    });
    (fetchPhotosWithExifData as jest.Mock).mockRejectedValueOnce(
      new Error(UI_STRINGS.TASTE_ANALYSIS.INSUFFICIENT_PHOTOS_ERROR),
    );
    const analyze = jest
      .spyOn(require('@yeolo/common').useTasteStore.getState(), 'analyzeTaste')
      .mockResolvedValue('retry-profile');
    const onLimitedFinish = jest.fn();
    const screen = await render(
      <TasteAnalysisScreen
        mode='limited'
        onFinish={mockOnFinish}
        onLimitedFinish={onLimitedFinish}
      />,
    );
    await waitFor(() =>
      expect(screen.getByTestId('select-photos-again-button')).toBeTruthy(),
    );
    expect(
      screen.getByText('여행 취향을 찾을 수 있는 사진이 부족해요.'),
    ).toBeTruthy();
    expect(analyze).not.toHaveBeenCalled();
    expect(screen.queryByText(UI_STRINGS.PHOTO_AUTH.REQUIRED)).toBeNull();
    await fireEvent.press(screen.getByTestId('select-photos-again-button'));
    expect(nativeLibrary.presentPermissionsPicker).toHaveBeenCalledWith([
      'photo',
    ]);
    await waitFor(() => expect(analyze).toHaveBeenCalledTimes(1));
    expect(fetchPhotosWithExifData).toHaveBeenCalledTimes(2);
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(mockOnFinish).toHaveBeenCalledWith('retry-profile');
    expect(onLimitedFinish).not.toHaveBeenCalled();
  });

  it('iOS 재선택은 선택 범위 변경 알림 이후 새 사진을 분석한다', async () => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    (MediaLibrary.getPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
      accessPrivileges: 'limited',
    });
    (fetchPhotosWithExifData as jest.Mock).mockRejectedValueOnce(
      new Error(UI_STRINGS.TASTE_ANALYSIS.NO_EXIF_ERROR),
    );
    const analyze = jest
      .spyOn(useTasteStore.getState(), 'analyzeTaste')
      .mockResolvedValue('ios-selection');
    const screen = await render(
      <TasteAnalysisScreen mode='limited' onFinish={mockOnFinish} />,
    );
    await waitFor(() =>
      expect(screen.getByTestId('select-photos-again-button')).toBeTruthy(),
    );
    await fireEvent.press(screen.getByTestId('select-photos-again-button'));
    expect(fetchPhotosWithExifData).toHaveBeenCalledTimes(1);
    const onChange = nativeLibrary.addListener.mock.calls[0][0];
    await act(async () => {
      onChange({ hasIncrementalChanges: false });
    });
    await waitFor(() => expect(analyze).toHaveBeenCalledTimes(1));
    expect(fetchPhotosWithExifData).toHaveBeenCalledTimes(2);
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(mockOnFinish).toHaveBeenCalledWith('ios-selection');
  });

  it('재선택 창을 열지 못하면 현재 실패 화면을 유지하고 분석 요청을 보내지 않는다', async () => {
    (MediaLibrary.getPermissionsAsync as jest.Mock).mockResolvedValue({
      status: 'granted',
      accessPrivileges: 'limited',
    });
    (fetchPhotosWithExifData as jest.Mock).mockRejectedValueOnce(
      new Error(UI_STRINGS.TASTE_ANALYSIS.NO_EXIF_ERROR),
    );
    nativeLibrary.presentPermissionsPicker.mockRejectedValueOnce(
      new Error('picker unavailable'),
    );
    const screen = await render(
      <TasteAnalysisScreen mode='limited' onFinish={mockOnFinish} />,
    );
    await waitFor(() =>
      expect(screen.getByTestId('select-photos-again-button')).toBeTruthy(),
    );
    await fireEvent.press(screen.getByTestId('select-photos-again-button'));
    expect(fetchPhotosWithExifData).toHaveBeenCalledTimes(1);
    expect(
      screen.getByText(UI_STRINGS.TASTE_ANALYSIS.FAIL_SUBTITLE),
    ).toBeTruthy();
  });

  it('전체 접근에서 사진이 부족하면 전체 허용 버튼 대신 뒤로가기와 MBTI 대안을 제공한다', async () => {
    (fetchPhotosWithExifData as jest.Mock).mockRejectedValueOnce(
      new Error(UI_STRINGS.TASTE_ANALYSIS.INSUFFICIENT_PHOTOS_ERROR),
    );
    const back = jest.fn();
    const mbti = jest.fn();
    const failure = jest.fn();
    const screen = await render(
      <TasteAnalysisScreen
        mode='full'
        onFinish={mockOnFinish}
        onFailureBack={back}
        onChooseMbti={mbti}
        onFailureStateChange={failure}
      />,
    );
    await waitFor(() =>
      expect(
        screen.getByText(UI_STRINGS.TASTE_ANALYSIS.FAIL_SUBTITLE),
      ).toBeTruthy(),
    );
    expect(screen.queryByTestId('allow-all-photos-button')).toBeNull();
    expect(failure).toHaveBeenLastCalledWith(true);
    await fireEvent.press(
      screen.getByRole('button', { name: UI_STRINGS.ONBOARDING.BACK }),
    );
    expect(back).toHaveBeenCalledTimes(1);
    await fireEvent.press(screen.getByText('MBTI로 알아보기'));
    expect(mbti).toHaveBeenCalledTimes(1);
  });

  it('서버가 메타데이터 부족을 반환하면 사진 선택 실패 화면을 보여준다', async () => {
    server.use(
      http.post('*/api/users/me/taste-profile/analysis', () =>
        HttpResponse.json(
          {
            status: 400,
            message: '분석 가능한 이미지 메타데이터가 부족합니다.',
            data: null,
          },
          { status: 400 },
        ),
      ),
    );
    const screen = await render(
      <TasteAnalysisScreen mode='limited' onFinish={mockOnFinish} />,
    );
    await waitFor(() =>
      expect(screen.getByTestId('select-photos-again-button')).toBeTruthy(),
    );
    expect(mockOnFinish).not.toHaveBeenCalled();
  });

  it('제한 접근 분석이 서버 오류로 실패하면 과정 화면의 오류 없이 사진 선택 실패 화면을 보여준다', async () => {
    server.use(
      http.post('*/api/users/me/taste-profile/analysis', () =>
        HttpResponse.json(
          { status: 500, message: '분석 서버 오류' },
          { status: 500 },
        ),
      ),
    );
    const screen = await render(
      <TasteAnalysisScreen mode='limited' onFinish={mockOnFinish} />,
    );
    await waitFor(() =>
      expect(screen.getByTestId('select-photos-again-button')).toBeTruthy(),
    );
    expect(
      screen.getByText(UI_STRINGS.TASTE_ANALYSIS.FAIL_SUBTITLE),
    ).toBeTruthy();
    expect(screen.queryByTestId('error-container')).toBeNull();
    expect(screen.queryByText('분석 서버 오류')).toBeNull();
    expect(screen.queryByText(UI_STRINGS.TASTE_ANALYSIS.MAIN_TITLE)).toBeNull();
    expect(mockOnFinish).not.toHaveBeenCalled();
  });

  it('전체 접근의 서버 장애는 기존 오류 안내에서 다시 시도할 수 있다', async () => {
    server.use(
      http.post('*/api/users/me/taste-profile/analysis', () =>
        HttpResponse.json(
          { status: 500, message: '분석 서버에 연결할 수 없습니다.' },
          { status: 500 },
        ),
      ),
    );
    const screen = await render(
      <TasteAnalysisScreen mode='full' onFinish={mockOnFinish} />,
    );
    await waitFor(() =>
      expect(screen.getByText('분석 서버에 연결할 수 없습니다.')).toBeTruthy(),
    );
    expect(screen.queryByTestId('select-photos-again-button')).toBeNull();
    expect(screen.queryByText(UI_STRINGS.TASTE_ANALYSIS.FAIL_TITLE)).toBeNull();
    server.resetHandlers();
    await fireEvent.press(screen.getByTestId('retry-analysis-button'));
    await waitFor(() =>
      expect(fetchPhotosWithExifData).toHaveBeenCalledTimes(2),
    );
    await waitFor(() =>
      expect(screen.getByText('사용자 취향 분석 완료!')).toBeTruthy(),
    );
    await act(async () => {
      jest.advanceTimersByTime(1000);
    });
    expect(mockOnFinish).toHaveBeenCalled();
  });

  it('분석 완료 시 즉시 전환되지 않고 1초의 텀을 두고 onFinish가 호출되어야 한다', async () => {
    const useTasteStore = require('@yeolo/common').useTasteStore;
    jest
      .spyOn(useTasteStore.getState(), 'analyzeTaste')
      .mockResolvedValueOnce('550e8400-e29b-41d4-a716-446655440001');

    await render(
      <TasteAnalysisScreen onFinish={mockOnFinish} onFail={mockOnFail} />,
    );

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    // Initial render: onFinish should not be called yet
    expect(mockOnFinish).not.toHaveBeenCalled();

    // Advance 1s timer for transition
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockOnFinish).toHaveBeenCalledWith(
      '550e8400-e29b-41d4-a716-446655440001',
    );
  });
});
