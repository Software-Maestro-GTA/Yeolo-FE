/**
 * @file CourseDetailScreen.test.tsx
 * @description Unit and integration tests for CourseDetailScreen & CourseTimeline (FUN-3, REQ-9).
 * @requirements REQ-9
 * @functional FUN-3
 * @api API-FB-7
 * @author Antigravity Agent
 */
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import * as WebBrowser from 'expo-web-browser';
import { CourseDetailScreen } from '../src/screens/CourseDetailScreen';
import * as commonApi from '@yeolo/common';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('../src/components/navigation/BottomNavBar', () => ({
  BottomNavBar: () => null,
}));

jest.mock('react-native-maps', () => {
  const React = require('react');
  const { View } = require('react-native');
  const MockMapView = (props: any) =>
    React.createElement(View, { ...props, testID: props.testID || 'in-app-map-view' }, props.children);
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
    WebView: (props: any) => React.createElement(View, { ...props, testID: props.testID || 'in-app-webview' }),
  };
});

globalThis.fetch = jest.fn().mockImplementation((url: string) => {
  if (url.includes('nominatim.openstreetmap.org')) {
    return Promise.resolve({
      json: () => Promise.resolve([{ lat: '33.5434', lon: '126.6692' }]),
    });
  }
  return Promise.reject(new Error('Unknown URL'));
}) as any;

const mockCourseDetail: commonApi.CourseDetail = {
  courseId: 'test-course-id-123',
  userId: 'test-user-id',
  title: '2박 3일 서귀포 감성 힐링 코스',
  destinationCountry: '대한민국',
  destinationCity: '제주',
  startDate: '2026-08-01',
  totalDays: 2,
  totalCost: 350000,
  tags: ['힐링', '카페', '자연'],
  recommendationReason: '자연과 카페 선호도가 높아 힐링 중심의 짧은 동선으로 추천합니다.',

  itinerary: {
    days: [
      {
        day: 1,
        date: '2026-08-01',
        memo: '1일차: 서귀포 도심 감성 카페 투어',
        stops: [
          {
            sequence: 1,
            placeId: 'place-1',
            placeName: '함덕 해수욕장',
            category: '해변',
            arrivalTime: '10:00',
            stayMinutes: 90,
            memo: '오픈런 추천',
            transportToNext: 'transit',
            travelMinutesToNext: 30,
            cost: 0,
            reason: '바다 전망 추천',
          },
          {
            sequence: 2,
            placeId: 'place-2',
            placeName: '감성 카페 델문도',
            category: '카페',
            arrivalTime: '12:00',
            stayMinutes: 60,
            memo: '시그니처 라떼 추천',
            transportToNext: 'none',
            travelMinutesToNext: 0,
            cost: 15000,
            reason: '커피 품질 및 바다 뷰 우수',
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
            placeId: 'place-3',
            placeName: '비자림',
            category: '관광지',
            arrivalTime: '10:30',
            stayMinutes: 120,
            memo: '',
            transportToNext: 'none',
            travelMinutesToNext: 0,
            cost: 4000,
            reason: '',
          },
        ],
      },
    ],
  },
};

describe('CourseDetailScreen (FUN-3: 추천 일정 카드/타임라인 상세 표시)', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.setItem('accessToken', 'mock-token');
  });

  it('코스 상세 데이터 조회 후 타임라인, 방문지 카드, 추천 이유를 올바르게 렌더링해야 한다', async () => {
    jest.spyOn(commonApi, 'getCourseDetailApi').mockResolvedValue(mockCourseDetail);

    const { getByText } = await render(
      <CourseDetailScreen courseId="test-course-id-123" />
    );

    await waitFor(() => {
      expect(getByText(/2박 3일 서귀포 감성 힐링 코스/)).toBeTruthy();
      expect(getByText('함덕 해수욕장')).toBeTruthy();
      expect(getByText('감성 카페 델문도')).toBeTruthy();
    });

    expect(getByText(/350,000/)).toBeTruthy();
    expect(getByText(/10:00/)).toBeTruthy();
    expect(getByText(/90분 체류/)).toBeTruthy();
    expect(getByText('바다 전망 추천')).toBeTruthy();
    expect(getByText(/대중교통 30분/)).toBeTruthy();
  });

  it('일자별 탭/섹션 선택 시 해당 일자의 일정 스탑 목록이 표시되어야 한다', async () => {
    jest.spyOn(commonApi, 'getCourseDetailApi').mockResolvedValue(mockCourseDetail);

    const { getByTestId, getByText, queryByText } = await render(
      <CourseDetailScreen courseId="test-course-id-123" />
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
    jest.spyOn(commonApi, 'getCourseDetailApi').mockResolvedValue(mockCourseDetail);

    const { getByTestId, getByText, getAllByText } = await render(
      <CourseDetailScreen courseId="test-course-id-123" />
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
      <CourseDetailScreen courseId="test-course-id-123" />
    );

    await waitFor(() => {
      expect(getByText('여행 코스 정보를 불러오지 못했습니다.')).toBeTruthy();
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
    jest.spyOn(commonApi, 'getCourseDetailApi').mockResolvedValue(mockCourseDetail);

    const { getByTestId, getByText } = await render(
      <CourseDetailScreen courseId="test-course-id-123" />
    );

    await waitFor(() => {
      expect(getByText(/2박 3일 서귀포 감성 힐링 코스/)).toBeTruthy();
      expect(getByTestId('in-app-map-view')).toBeTruthy();
    });
  });

  it('Android 환경에서는 API 키가 필요 없는 인앱 웹뷰(WebView)로 지도가 렌더링되어야 한다', async () => {
    const originalOS = require('react-native').Platform.OS;
    require('react-native').Platform.OS = 'android';
    jest.spyOn(commonApi, 'getCourseDetailApi').mockResolvedValue(mockCourseDetail);

    const { getByTestId } = await render(
      <CourseDetailScreen courseId="test-course-id-123" />
    );

    await waitFor(() => {
      expect(getByTestId('mini-map-webview-card')).toBeTruthy();
      expect(getByTestId('in-app-webview')).toBeTruthy();
    });

    require('react-native').Platform.OS = originalOS;
  });
});
