/**
 * @file CourseShareScreen.test.tsx
 * @description Unit and integration tests for CourseShareScreen component (API-SHARE-2, API-SHARE-3, expired link handling).
 */
import React from 'react';
import { fireEvent, waitFor, act } from '@testing-library/react-native';
import { Alert, Platform } from 'react-native';
import { renderWithQueryClient as render } from './test-utils';
import { CourseShareScreen } from '../src/screens/CourseShareScreen';
import { AuthContext } from '../src/context';
import * as commonApi from '@yeolo/common';
import AsyncStorage from '@react-native-async-storage/async-storage';

const mockShareDetailResponse = {
  course: {
    title: '동유럽 감성 야경 투어',
    destinationCountry: '체코',
    destinationCity: '프라하',
    startDate: '2026-09-01',
    totalDays: 5,
  },
  inviter: {
    displayName: '홍길동',
    profileImageUrl: 'https://example.com/inviter.jpg',
  },
  expiresAt: '2026-08-30T10:00:00.000Z',
};

describe('CourseShareScreen (API-SHARE-2, API-SHARE-3 & 공유 수신/예외 처리)', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.setItem('accessToken', 'mock-token');
  });

  it('shareToken이 전달되면 API-SHARE-2를 호출하고 초대자 및 코스 요약 정보를 화면에 표시해야 한다', async () => {
    const getShareSpy = jest
      .spyOn(commonApi, 'getShareLinkApi')
      .mockResolvedValue(mockShareDetailResponse);

    const mockAuthContext = {
      isAuthenticated: true,
      isLoading: false,
      user: { uid: 'user-1', email: 'test@yeolo.com', displayName: '김선규' },
      login: jest.fn(),
      logout: jest.fn(),
    };

    const { findByTestId, findByText, queryByTestId } = await render(
      <AuthContext.Provider value={mockAuthContext as any}>
        <CourseShareScreen shareToken='token-abc-123' />
      </AuthContext.Provider>,
    );

    expect(await findByTestId('course-share-screen')).toBeTruthy();
    expect(getShareSpy).toHaveBeenCalledWith(
      expect.any(String),
      'token-abc-123',
    );

    expect(
      await findByText('홍길동님이 여행 코스를 공유했습니다'),
    ).toBeTruthy();
    expect(await findByText('동유럽 감성 야경 투어')).toBeTruthy();
    expect(await findByText('체코 · 프라하')).toBeTruthy();
    expect(await findByText('2026-09-01 · 5일')).toBeTruthy();
    expect(await findByTestId('btn-save-course')).toBeTruthy();
    expect(queryByTestId('login-bottom-sheet')).toBeNull();
  });

  it('미로그인(게스트) 상태일 때 딤 오버레이 및 로그인 요청 바텀시트가 표시되어야 한다', async () => {
    jest
      .spyOn(commonApi, 'getShareLinkApi')
      .mockResolvedValue(mockShareDetailResponse);

    const mockGuestAuthContext = {
      isAuthenticated: false,
      isLoading: false,
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
    };

    const { findByTestId, findByText } = await render(
      <AuthContext.Provider value={mockGuestAuthContext as any}>
        <CourseShareScreen shareToken='token-abc-123' />
      </AuthContext.Provider>,
    );

    expect(await findByTestId('dim-overlay')).toBeTruthy();
    expect(await findByTestId('login-bottom-sheet')).toBeTruthy();
    expect(await findByText('로그인이 필요합니다')).toBeTruthy();
    expect(await findByTestId('btn-google-login')).toBeTruthy();
  });

  it('Android 환경인 경우 Apple 로그인 버튼이 표시되지 않아야 한다', async () => {
    const originalOS = Platform.OS;
    Platform.OS = 'android';

    jest
      .spyOn(commonApi, 'getShareLinkApi')
      .mockResolvedValue(mockShareDetailResponse);

    const mockGuestAuthContext = {
      isAuthenticated: false,
      isLoading: false,
      user: null,
    };

    const { queryByTestId, findByTestId } = await render(
      <AuthContext.Provider value={mockGuestAuthContext as any}>
        <CourseShareScreen shareToken='token-abc-123' />
      </AuthContext.Provider>,
    );

    expect(await findByTestId('btn-google-login')).toBeTruthy();
    expect(queryByTestId('btn-apple-login')).toBeNull();

    Platform.OS = originalOS;
  });

  it('코스 저장 버튼 클릭 시 acceptShareLinkApi (API-SHARE-3)가 호출되고 수락된 courseId와 함께 onSaveSuccess가 호출되어야 한다', async () => {
    jest
      .spyOn(commonApi, 'getShareLinkApi')
      .mockResolvedValue(mockShareDetailResponse);

    const acceptApiSpy = jest
      .spyOn(commonApi, 'acceptShareLinkApi')
      .mockResolvedValue({ courseId: 'accepted-course-999' });

    const mockSaveSuccess = jest.fn();
    const mockAuthContext = {
      isAuthenticated: true,
      isLoading: false,
      user: { uid: 'user-1' },
    };

    const { findByTestId } = await render(
      <AuthContext.Provider value={mockAuthContext as any}>
        <CourseShareScreen
          shareToken='token-abc-123'
          onSaveSuccess={mockSaveSuccess}
        />
      </AuthContext.Provider>,
    );

    const btnSave = await findByTestId('btn-save-course');
    await act(async () => {
      fireEvent.press(btnSave);
    });

    expect(acceptApiSpy).toHaveBeenCalledWith(
      expect.any(String),
      'mock-token',
      'token-abc-123',
    );
    expect(mockSaveSuccess).toHaveBeenCalledWith('accepted-course-999');
  });

  it('acceptShareLinkApi 호출 시 400 에러(본인 코스 또는 이미 수락된 코스)가 발생하면 "이미 저장된 코스입니다" 알림 후 onSaveSuccess가 호출되어야 한다', async () => {
    jest
      .spyOn(commonApi, 'getShareLinkApi')
      .mockResolvedValue(mockShareDetailResponse);

    jest
      .spyOn(commonApi, 'acceptShareLinkApi')
      .mockRejectedValue(
        new commonApi.ApiError(400, '수락할 수 없는 공유 링크입니다.'),
      );

    const alertSpy = jest.spyOn(Alert, 'alert');
    const mockSaveSuccess = jest.fn();
    const mockAuthContext = {
      isAuthenticated: true,
      isLoading: false,
      user: { uid: 'user-1' },
    };

    const { findByTestId } = await render(
      <AuthContext.Provider value={mockAuthContext as any}>
        <CourseShareScreen
          shareToken='token-abc-123'
          courseId='original-course-123'
          onSaveSuccess={mockSaveSuccess}
        />
      </AuthContext.Provider>,
    );

    const btnSave = await findByTestId('btn-save-course');
    await act(async () => {
      fireEvent.press(btnSave);
    });

    expect(alertSpy).toHaveBeenCalledWith(
      '안내',
      '이미 저장된 코스입니다.',
      expect.any(Array),
    );
    const alertButtons = alertSpy.mock.calls[0][2];
    alertButtons?.[0]?.onPress?.();
    expect(mockSaveSuccess).toHaveBeenCalledWith('original-course-123');
  });

  it('만료되었거나 유효하지 않은 공유 링크(API-SHARE-2 404/410 에러) 진입 시 로그인 유저는 홈 화면으로 리다이렉트되어야 한다', async () => {
    jest
      .spyOn(commonApi, 'getShareLinkApi')
      .mockRejectedValue(
        new commonApi.ApiError(410, '만료되었거나 회수된 공유 링크입니다.'),
      );

    const alertSpy = jest.spyOn(Alert, 'alert');
    const mockDecline = jest.fn();
    const mockAuthContext = {
      isAuthenticated: true,
      isLoading: false,
      user: { uid: 'user-1' },
    };

    await render(
      <AuthContext.Provider value={mockAuthContext as any}>
        <CourseShareScreen shareToken='expired-token' onDecline={mockDecline} />
      </AuthContext.Provider>,
    );

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        '공유 링크 오류',
        '만료되었거나 유효하지 않은 공유 링크입니다.',
        expect.any(Array),
      );
    });

    // Simulate pressing OK on Alert
    const alertButtons = alertSpy.mock.calls[0][2];
    alertButtons?.[0]?.onPress?.();

    expect(mockDecline).toHaveBeenCalledTimes(1);
  });

  it('만료되었거나 유효하지 않은 공유 링크(API-SHARE-2 404/410 에러) 진입 시 비로그인(게스트) 유저는 로그인 화면으로 리다이렉트되어야 한다', async () => {
    jest
      .spyOn(commonApi, 'getShareLinkApi')
      .mockRejectedValue(
        new commonApi.ApiError(404, '유효하지 않은 공유 링크입니다.'),
      );

    const alertSpy = jest.spyOn(Alert, 'alert');
    const mockNavigateToLogin = jest.fn();
    const mockGuestAuthContext = {
      isAuthenticated: false,
      isLoading: false,
      user: null,
    };

    await render(
      <AuthContext.Provider value={mockGuestAuthContext as any}>
        <CourseShareScreen
          shareToken='invalid-token'
          onNavigateToLogin={mockNavigateToLogin}
        />
      </AuthContext.Provider>,
    );

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith(
        '공유 링크 오류',
        '만료되었거나 유효하지 않은 공유 링크입니다.',
        expect.any(Array),
      );
    });

    const alertButtons = alertSpy.mock.calls[0][2];
    alertButtons?.[0]?.onPress?.();

    expect(mockNavigateToLogin).toHaveBeenCalledTimes(1);
  });

  it('초대자의 프로필 이미지가 없는 경우 기본 사람 아이콘 플래스홀더가 표시되어야 한다', async () => {
    jest.spyOn(commonApi, 'getShareLinkApi').mockResolvedValue({
      ...mockShareDetailResponse,
      inviter: {
        displayName: '이순신',
        profileImageUrl: null as any,
      },
    });

    const mockAuthContext = {
      isAuthenticated: true,
      isLoading: false,
      user: { uid: 'user-1' },
    };

    const { findByTestId } = await render(
      <AuthContext.Provider value={mockAuthContext as any}>
        <CourseShareScreen shareToken='token-no-avatar' />
      </AuthContext.Provider>,
    );

    expect(await findByTestId('default-avatar-placeholder')).toBeTruthy();
  });
});
