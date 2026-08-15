/**
 * @file CourseDetailScreen.test.tsx
 * @description Unit and integration tests for CourseDetailScreen & CourseTimeline (FUN-3, REQ-9, API-SHARE-1).
 */
import React from 'react';
import { fireEvent, waitFor, act } from '@testing-library/react-native';
import { Share, Alert } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { CourseDetailScreen } from '../src/screens/CourseDetailScreen';
import * as commonApi from '@yeolo/common';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { renderWithQueryClient as render } from './test-utils';

jest.mock('@react-native-clipboard/clipboard', () => ({
  setString: jest.fn(),
  getString: jest.fn().mockResolvedValue(''),
}));

jest.mock('../src/components/navigation/BottomNavBar', () => ({
  BottomNavBar: () => null,
}));

jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockMapView = (props: any) =>
    React.createElement(
      View,
      { ...props, testID: props.testID || 'in-app-map-view' },
      props.children,
    );
  const MockMarker = (props: any) => React.createElement(View, props);
  const MockPolyline = (props: any) => React.createElement(View, props);
  return {
    __esModule: true,
    default: MockMapView,
    Marker: MockMarker,
    Polyline: MockPolyline,
  };
});

jest.mock('react-native-webview', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    WebView: (props: any) =>
      React.createElement(View, {
        ...props,
        testID: props.testID || 'in-app-webview',
      }),
  };
});

const mockCourseDetail: commonApi.CourseDetail = {
  courseId: 'test-course-id-123',
  userId: 'test-user-id',
  title: '2박 3일 서귀포 감성 힐링 코스',
  destinationCountry: '대한민국',
  destinationCity: '제주',
  coverImageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf',
  startDate: '2026-08-01',
  totalDays: 2,
  totalCost: 350000,
  tags: ['힐링', '카페', '자연'],
  recommendationReason:
    '자연과 카페 선호도가 높아 힐링 중심의 짧은 동선으로 추천합니다.',

  itinerary: {
    days: [
      {
        day: 1,
        date: '2026-08-01',
        memo: '1일차: 서귀포 도심 감성 카페 투어',
        stops: [
          {
            sequence: 1,
            arrivalTime: '10:00',
            stayMinutes: 90,
            memo: '오픈런 추천',
            reason: '바다 전망 추천',
            place: {
              placeId: 'place-1',
              placeName: '함덕 해수욕장',
              category: '해변',
              latitude: 33.5434,
              longitude: 126.6692,
            },
            transportToNext: {
              type: 'transit',
              distance: 15000,
              minutes: 30,
              cost: 0,
              memo: '대중교통 이동',
            },
          },
          {
            sequence: 2,
            arrivalTime: '12:00',
            stayMinutes: 60,
            memo: '시그니처 라떼 추천',
            reason: '커피 품질 및 바다 뷰 우수',
            place: {
              placeId: 'place-2',
              placeName: '감성 카페 델문도',
              category: '카페',
              latitude: 33.5436,
              longitude: 126.6695,
            },
            transportToNext: {
              type: 'none',
              distance: null,
              minutes: null,
              cost: 15000,
              memo: null,
            },
          },
        ],
      },
      {
        day: 2,
        date: '2026-08-02',
        memo: '2일차: 숲길 산책',
        stops: [
          {
            sequence: 1,
            arrivalTime: '10:30',
            stayMinutes: 120,
            memo: '',
            reason: '',
            place: {
              placeId: 'place-3',
              placeName: '비자림',
              category: '관광지',
              latitude: 33.4912,
              longitude: 126.8114,
            },
            transportToNext: {
              type: 'none',
              distance: null,
              minutes: null,
              cost: 4000,
              memo: null,
            },
          },
        ],
      },
    ],
  },
};

describe('CourseDetailScreen (FUN-3: 추천 일정 카드/타임라인 상세 표시 & API-SHARE-1)', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.setItem('accessToken', 'mock-token');
  });

  it('코스 상세 데이터 조회 후 타임라인, 방문지 카드, 추천 이유를 올바르게 렌더링해야 한다', async () => {
    jest
      .spyOn(commonApi, 'getCourseDetailApi')
      .mockResolvedValue(mockCourseDetail);

    const { getByText } = await render(
      <CourseDetailScreen courseId='test-course-id-123' />,
    );

    await waitFor(() => {
      expect(getByText(/2박 3일 서귀포 감성 힐링 코스/)).toBeTruthy();
      expect(getByText('대한민국 제주')).toBeTruthy();
      expect(getByText('₩350,000')).toBeTruthy();
      expect(getByText(/10:00/)).toBeTruthy();
      expect(getByText(/90분/)).toBeTruthy();
      expect(getByText(/바다 전망 추천/)).toBeTruthy();
      expect(getByText('1일차: 서귀포 도심 감성 카페 투어')).toBeTruthy();
    });
    expect(getByText(/대중교통 30분/)).toBeTruthy();
  });

  it('일자별 탭/섹션 선택 시 해당 일자의 일정 스탑 목록이 표시되어야 한다', async () => {
    jest
      .spyOn(commonApi, 'getCourseDetailApi')
      .mockResolvedValue(mockCourseDetail);

    const { getByTestId, getByText, queryByText } = await render(
      <CourseDetailScreen courseId='test-course-id-123' />,
    );

    await waitFor(() => {
      expect(getByText('함덕 해수욕장')).toBeTruthy();
    });

    const day2Tab = getByTestId('day-tab-2');
    await act(async () => {
      fireEvent.press(day2Tab);
    });

    await waitFor(() => {
      expect(getByText('비자림')).toBeTruthy();
      expect(queryByText('함덕 해수욕장')).toBeNull();
    });
  });

  it('메모나 추천 이유 등의 옵션 정보 누락 시 "정보 없음" 상태가 표시되어야 한다', async () => {
    jest
      .spyOn(commonApi, 'getCourseDetailApi')
      .mockResolvedValue(mockCourseDetail);

    const { getByTestId, getByText, getAllByText } = await render(
      <CourseDetailScreen courseId='test-course-id-123' />,
    );

    await waitFor(() => {
      expect(getByText('함덕 해수욕장')).toBeTruthy();
    });

    const day2Tab = getByTestId('day-tab-2');
    await act(async () => {
      fireEvent.press(day2Tab);
    });

    await waitFor(() => {
      expect(getByText('비자림')).toBeTruthy();
      expect(getAllByText('정보 없음').length).toBeGreaterThan(0);
    });
  });

  it('API 호출 실패 시 에러 메시지 및 재시도 버튼을 노출하고, 재시도 시 데이터를 다시 요청해야 한다', async () => {
    const apiSpy = jest
      .spyOn(commonApi, 'getCourseDetailApi')
      .mockRejectedValueOnce(new Error('네트워크 에러가 발생했습니다.'))
      .mockResolvedValueOnce(mockCourseDetail);

    const { getByTestId, getByText } = await render(
      <CourseDetailScreen courseId='test-course-id-123' />,
    );

    await waitFor(() => {
      expect(getByText('코스 상세 조회 오류')).toBeTruthy();
      expect(getByTestId('retry-button')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByTestId('retry-button'));
    });

    await waitFor(() => {
      expect(getByText(/2박 3일 서귀포 감성 힐링 코스/)).toBeTruthy();
    });

    expect(apiSpy).toHaveBeenCalledTimes(2);
  });

  it('iOS 환경에서는 앱 내부 네이티브 지도(MapView)가 렌더링되어야 한다', async () => {
    jest
      .spyOn(commonApi, 'getCourseDetailApi')
      .mockResolvedValue(mockCourseDetail);

    const { getByTestId, getByText } = await render(
      <CourseDetailScreen courseId='test-course-id-123' />,
    );

    await waitFor(() => {
      expect(getByText(/2박 3일 서귀포 감성 힐링 코스/)).toBeTruthy();
      expect(getByTestId('in-app-map-view')).toBeTruthy();
    });
  });

  it('Android 환경에서는 API 키가 필요 없는 인앱 웹뷰(WebView)로 지도가 렌더링되어야 한다', async () => {
    const originalOS = require('react-native').Platform.OS;
    require('react-native').Platform.OS = 'android';
    jest
      .spyOn(commonApi, 'getCourseDetailApi')
      .mockResolvedValue(mockCourseDetail);

    const { getByTestId } = await render(
      <CourseDetailScreen courseId='test-course-id-123' />,
    );

    await waitFor(() => {
      expect(getByTestId('mini-map-webview-card')).toBeTruthy();
      expect(getByTestId('in-app-webview')).toBeTruthy();
    });

    require('react-native').Platform.OS = originalOS;
  });

  it('화면 하단에 총 예상 경비 카드가 정상적으로 렌더링되어야 한다', async () => {
    jest
      .spyOn(commonApi, 'getCourseDetailApi')
      .mockResolvedValue(mockCourseDetail);

    const { getByText } = await render(
      <CourseDetailScreen courseId='test-course-id-123' />,
    );

    await waitFor(() => {
      expect(getByText('총 예상 경비')).toBeTruthy();
      expect(getByText('₩350,000')).toBeTruthy();
    });
  });

  it('상단 헤더의 뒤로가기 버튼 클릭 시 onBack 콜백이 호출되어야 한다', async () => {
    const handleBack = jest.fn();
    jest
      .spyOn(commonApi, 'getCourseDetailApi')
      .mockResolvedValue(mockCourseDetail);

    const { getByTestId, getByText } = await render(
      <CourseDetailScreen courseId='test-course-id-123' onBack={handleBack} />,
    );

    await waitFor(() => {
      expect(getByText(/2박 3일 서귀포 감성 힐링 코스/)).toBeTruthy();
    });

    const backButton = getByTestId('btn-back');
    fireEvent.press(backButton);

    expect(handleBack).toHaveBeenCalledTimes(1);
  });

  it('헤더의 공유 버튼(btn-share) 클릭 시 createShareLinkApi (API-SHARE-1)가 호출되고 Share.share가 구동되어야 한다', async () => {
    jest
      .spyOn(commonApi, 'getCourseDetailApi')
      .mockResolvedValue(mockCourseDetail);

    const shareApiSpy = jest
      .spyOn(commonApi, 'createShareLinkApi')
      .mockResolvedValue({
        shareUrl: 'https://yeolo.app/share-links/token-123',
        shareToken: 'token-123',
        expiresAt: '2026-08-17T10:00:00.000Z',
      });

    const shareSpy = jest.spyOn(Share, 'share').mockResolvedValue({
      action: Share.sharedAction,
    });

    const { getByTestId, getByText } = await render(
      <CourseDetailScreen courseId='test-course-id-123' />,
    );

    await waitFor(() => {
      expect(getByText(/2박 3일 서귀포 감성 힐링 코스/)).toBeTruthy();
    });

    const shareButton = getByTestId('btn-share');
    await act(async () => {
      fireEvent.press(shareButton);
    });

    expect(shareApiSpy).toHaveBeenCalledWith(
      expect.any(String),
      'mock-token',
      'test-course-id-123',
    );

    expect(shareSpy).toHaveBeenCalledWith({
      message: '[여로] 2박 3일 서귀포 감성 힐링 코스 여행 일정을 공유합니다!',
      url: 'https://yeolo.app/share-links/token-123',
    });
  });

  it('Share.share 실패 시 iOS에서는 Alert, Android에서는 ToastAndroid로 클립보드 복사 완료 알림이 호출되어야 한다', async () => {
    const { Platform, ToastAndroid } = require('react-native');
    const originalOS = Platform.OS;

    jest
      .spyOn(commonApi, 'getCourseDetailApi')
      .mockResolvedValue(mockCourseDetail);

    jest.spyOn(commonApi, 'createShareLinkApi').mockResolvedValue({
      shareUrl: 'https://yeolo.app/share-links/token-123',
      shareToken: 'token-123',
      expiresAt: null,
    });

    jest.spyOn(Share, 'share').mockRejectedValue(new Error('Share failed'));
    const setStringSpy = jest.spyOn(Clipboard, 'setString');
    const alertSpy = jest.spyOn(Alert, 'alert');
    const toastSpy = jest.spyOn(ToastAndroid, 'show');

    // iOS Test
    Platform.OS = 'ios';
    const { getByTestId, getByText } = await render(
      <CourseDetailScreen courseId='test-course-id-123' />,
    );

    await waitFor(() => {
      expect(getByText(/2박 3일 서귀포 감성 힐링 코스/)).toBeTruthy();
    });

    const shareButton = getByTestId('btn-share');
    await act(async () => {
      fireEvent.press(shareButton);
    });

    expect(setStringSpy).toHaveBeenCalledWith(
      'https://yeolo.app/share-links/token-123',
    );
    expect(alertSpy).toHaveBeenCalledWith(
      '공유 링크 복사 완료',
      '공유 링크가 클립보드에 복사되었습니다.',
    );

    // Android Test
    Platform.OS = 'android';
    await act(async () => {
      fireEvent.press(shareButton);
    });

    expect(toastSpy).toHaveBeenCalledWith(
      '공유 링크가 클립보드에 복사되었습니다.',
      ToastAndroid.SHORT,
    );

    Platform.OS = originalOS;
  });

  it('Trip.com 항공권 예약 CTA 클릭 시 Linking.openURL이 TRIP_FLIGHT_URL로 올바르게 구동되어야 한다', async () => {
    const { Linking } = require('react-native');
    const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);

    jest
      .spyOn(commonApi, 'getCourseDetailApi')
      .mockResolvedValue(mockCourseDetail);

    const { getByTestId, getByText } = await render(
      <CourseDetailScreen courseId='test-course-id-123' />,
    );

    await waitFor(() => {
      expect(getByText(/2박 3일 서귀포 감성 힐링 코스/)).toBeTruthy();
    });

    const flightCta = getByTestId('btn-flight-cta');
    fireEvent.press(flightCta);

    expect(openURLSpy).toHaveBeenCalledWith(
      'https://kr.trip.com/flights/?locale=ko-KR&curr=KRW&Allianceid=9936872&SID=327895947',
    );
  });

  it('Trip.com 숙소 예약 CTA 클릭 시 Linking.openURL이 TRIP_HOTEL_URL로 올바르게 구동되어야 한다', async () => {
    const { Linking } = require('react-native');
    const openURLSpy = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);

    jest
      .spyOn(commonApi, 'getCourseDetailApi')
      .mockResolvedValue(mockCourseDetail);

    const { getByTestId, getByText } = await render(
      <CourseDetailScreen courseId='test-course-id-123' />,
    );

    await waitFor(() => {
      expect(getByText(/2박 3일 서귀포 감성 힐링 코스/)).toBeTruthy();
    });

    const hotelCta = getByTestId('btn-hotel-cta');
    fireEvent.press(hotelCta);

    expect(openURLSpy).toHaveBeenCalledWith(
      'https://kr.trip.com/hotels/w/home?Allianceid=9936872&SID=327895947',
    );
  });

  it('Linking.openURL 호출 실패 시 사용자 안내 알림 메시지가 출력되어야 한다', async () => {
    const { Linking, Alert } = require('react-native');
    jest
      .spyOn(Linking, 'openURL')
      .mockRejectedValue(new Error('Cannot open URL'));
    const alertSpy = jest.spyOn(Alert, 'alert');

    jest
      .spyOn(commonApi, 'getCourseDetailApi')
      .mockResolvedValue(mockCourseDetail);

    const { getByTestId, getByText } = await render(
      <CourseDetailScreen courseId='test-course-id-123' />,
    );

    await waitFor(() => {
      expect(getByText(/2박 3일 서귀포 감성 힐링 코스/)).toBeTruthy();
    });

    const hotelCta = getByTestId('btn-hotel-cta');
    await act(async () => {
      fireEvent.press(hotelCta);
    });

    expect(alertSpy).toHaveBeenCalledWith(
      '오류',
      '예약 페이지를 열 수 없습니다. 잠시 후 다시 시도해주세요.',
    );
  });

  it('CourseDetailScreen 마운트 시 AsyncStorage에 recentCourseId를 저장하고 AuthContext 상태를 갱신해야 한다', async () => {
    jest
      .spyOn(commonApi, 'getCourseDetailApi')
      .mockResolvedValue(mockCourseDetail);

    const mockSetRecentCourseId = jest.fn();
    const { AuthContext } = require('../src/context/AuthContext');
    const mockAuthValue = {
      isAuthenticated: true,
      user: { displayName: '테스터' },
      isLoading: false,
      recentCourseId: null,
      setRecentCourseId: mockSetRecentCourseId,
      loginWithGoogle: jest.fn(),
      loginWithApple: jest.fn(),
      logout: jest.fn(),
    };

    await render(
      <AuthContext.Provider value={mockAuthValue}>
        <CourseDetailScreen courseId='test-course-id-123' />
      </AuthContext.Provider>,
    );

    await waitFor(() => {
      expect(mockSetRecentCourseId).toHaveBeenCalledWith('test-course-id-123');
    });

    expect(await AsyncStorage.getItem('recentCourseId')).toBe(
      'test-course-id-123',
    );
  });
});
