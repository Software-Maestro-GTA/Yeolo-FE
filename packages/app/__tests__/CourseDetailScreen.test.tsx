/**
 * @file CourseDetailScreen.test.tsx
 * @description Verifies course timeline, currency display and restoration, booking, and sharing interactions.
 */
import React from 'react';
import { fireEvent, waitFor, act, within } from '@testing-library/react-native';
import { Share, Alert, Linking, StyleSheet, FlatList } from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import { CourseDetailScreen } from '../src/screens/CourseDetailScreen';
import * as commonApi from '@yeolo/common';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { renderWithQueryClient as render } from './test-utils';
import { AuthContext, type AuthContextType } from '../src/context/AuthContext';
import { useQueryClient, type QueryClient } from '@tanstack/react-query';
import { getCourseDetailQueryKey } from '../src/hooks/queries/useCourseDetailQuery';

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
    PROVIDER_GOOGLE: 'google',
    PROVIDER_DEFAULT: 'default',
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
  totalCostExRate: 250,
  exRateIcon: '$',
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
            cost: 0,
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
            cost: 15000,
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
            cost: 0,
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
  it('does not rewrite the recent course when unrelated user profile context changes', async () => {
    jest.clearAllMocks();
    jest
      .spyOn(commonApi, 'getCourseDetailApi')
      .mockResolvedValue(mockCourseDetail);
    const setRecentCourseId = jest.fn();
    const session: AuthContextType = {
      isAuthenticated: true,
      user: null,
      isLoading: false,
      recentCourseId: null,
      setRecentCourseId,
      loginWithGoogle: jest.fn(),
      loginWithApple: jest.fn(),
      logout: jest.fn(),
    };
    const screen = (name: string) => (
      <AuthContext.Provider
        value={{ ...session, user: { displayName: name } as commonApi.User }}>
        <CourseDetailScreen courseId={mockCourseDetail.courseId} />
      </AuthContext.Provider>
    );
    let updateProfile!: React.Dispatch<React.SetStateAction<string>>;
    function ProfileHarness() {
      const [name, setName] = React.useState('처음');
      updateProfile = setName;
      return screen(name);
    }
    const { findByTestId } = await render(<ProfileHarness />);
    await findByTestId('in-app-map-view');
    const recentWrites = () =>
      jest
        .mocked(AsyncStorage.setItem)
        .mock.calls.filter(([key]) => key === 'recentCourseId');
    expect(recentWrites()).toHaveLength(1);
    await act(() => updateProfile('새 이름'));
    expect(recentWrites()).toHaveLength(1);
    expect(setRecentCourseId).toHaveBeenCalledTimes(1);
  });
  beforeEach(async () => {
    jest.clearAllMocks();
    await AsyncStorage.setItem('accessToken', 'mock-token');
  });

  it('지도는 스크롤 거리만큼 즉시 접히고 목록 높이와 멈춘 위치는 유지된다', async () => {
    jest.useFakeTimers();
    try {
      jest
        .spyOn(commonApi, 'getCourseDetailApi')
        .mockResolvedValue(mockCourseDetail);
      const screen = await render(
        <CourseDetailScreen courseId={mockCourseDetail.courseId} />,
      );
      await screen.findByText('함덕 해수욕장');
      await fireEvent(screen.getByTestId('course-detail-header'), 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 340, height: 120 } },
      });
      await fireEvent(screen.getByTestId('course-controls-details'), 'layout', {
        nativeEvent: { layout: { x: 0, y: 0, width: 340, height: 110 } },
      });
      const height = (id: string) =>
        StyleSheet.flatten(screen.getByTestId(id).props.style).height as number;
      const reservedHeight = height('course-controls-spacer');
      const scroll = async (y: number, expectedHeight: number) => {
        await fireEvent.scroll(screen.getByTestId('course-detail-list'), {
          nativeEvent: { contentOffset: { x: 0, y } },
        });
        expect(height('mini-map-card')).toBe(expectedHeight);
        expect(height('course-controls-spacer')).toBe(reservedHeight);
      };
      await scroll(119, 168);
      await scroll(120, 168);
      await scroll(121, 167);
      await scroll(130, 158);
      await scroll(150, 138);
      await scroll(160, 128);
      await scroll(1800, 128);
      await scroll(150, 138);
      await scroll(130, 158);
      await act(async () => {
        await jest.advanceTimersByTimeAsync(400);
      });
      expect(height('mini-map-card')).toBe(158);
      expect(height('course-controls-spacer')).toBe(reservedHeight);
      await scroll(120, 168);
      await scroll(-20, 168);
    } finally {
      jest.useRealTimers();
    }
  });

  it('장소 이름과 지도 아이콘은 장소 상세 API 호출 없이 같은 Google Maps 링크를 연다', async () => {
    jest
      .spyOn(commonApi, 'getCourseDetailApi')
      .mockResolvedValue(mockCourseDetail);
    const placeLookup = jest.spyOn(commonApi, 'getPlaceDetailApi');
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    const screen = await render(
      <CourseDetailScreen courseId={mockCourseDetail.courseId} />,
    );
    await fireEvent.press(await screen.findByText('함덕 해수욕장'));
    await fireEvent.press(screen.getByTestId('map-link-1'));
    expect(openURL).toHaveBeenCalledTimes(2);
    expect(openURL.mock.calls[0][0]).toBe(openURL.mock.calls[1][0]);
    const url = new URL(openURL.mock.calls[0][0]);
    expect(url.searchParams.get('query_place_id')).toBe('place-1');
    expect(placeLookup).not.toHaveBeenCalled();
    expect(screen.getByTestId('course-detail-header')).toBeTruthy();
    placeLookup.mockRestore();
    openURL.mockRestore();
  });

  it('고정 날짜 컨트롤은 목록 바깥에 한 번만 표시되어 이동된 셀의 터치 영역에 의존하지 않는다', async () => {
    jest
      .spyOn(commonApi, 'getCourseDetailApi')
      .mockResolvedValue(mockCourseDetail);
    const screen = await render(
      <CourseDetailScreen courseId={mockCourseDetail.courseId} />,
    );
    await screen.findByText('함덕 해수욕장');
    const list = screen.getByTestId('course-detail-list');
    expect(within(list).queryByTestId('course-sticky-controls')).toBeNull();
    expect(screen.getAllByTestId('day-tab-2')).toHaveLength(1);
    await fireEvent.scroll(list, {
      nativeEvent: { contentOffset: { x: 0, y: 1800 } },
    });
    await fireEvent.press(screen.getByTestId('day-tab-2'));
    expect(screen.getByText('비자림')).toBeTruthy();
  });

  it('아래로 내려간 상태에서 날짜를 바꾸면 새 일정의 처음으로 이동하고 같은 날짜 재선택은 유지한다', async () => {
    jest
      .spyOn(commonApi, 'getCourseDetailApi')
      .mockResolvedValue(mockCourseDetail);
    const scrollToOffset = jest
      .spyOn(FlatList.prototype, 'scrollToOffset')
      .mockImplementation(() => {});
    const screen = await render(
      <CourseDetailScreen courseId={mockCourseDetail.courseId} />,
    );
    await screen.findByText('함덕 해수욕장');
    await fireEvent.scroll(screen.getByTestId('course-detail-list'), {
      nativeEvent: { contentOffset: { x: 0, y: 1800 } },
    });
    await fireEvent.press(screen.getByTestId('day-tab-2'));
    expect(screen.getByText('비자림')).toBeTruthy();
    expect(screen.getAllByTestId(/course-map-marker-/)).toHaveLength(1);
    expect(screen.getByTestId('course-map-marker-0').props.coordinate).toEqual({
      latitude: mockCourseDetail.itinerary.days[1].stops[0].place.latitude,
      longitude: mockCourseDetail.itinerary.days[1].stops[0].place.longitude,
    });
    expect(scrollToOffset).toHaveBeenCalledWith({ offset: 0, animated: true });
    scrollToOffset.mockClear();
    await fireEvent.press(screen.getByTestId('day-tab-2'));
    expect(scrollToOffset).not.toHaveBeenCalled();
    scrollToOffset.mockRestore();
  });

  it('날짜와 통화 선택을 복귀 화면에서 복원할 수 있도록 변경 상태를 전달한다', async () => {
    jest
      .spyOn(commonApi, 'getCourseDetailApi')
      .mockResolvedValue(mockCourseDetail);
    const onViewStateChange = jest.fn();
    const screen = await render(
      <CourseDetailScreen
        courseId={mockCourseDetail.courseId}
        onViewStateChange={onViewStateChange}
      />,
    );
    await screen.findByText('함덕 해수욕장');

    await fireEvent.press(screen.getByTestId('day-tab-2'));
    expect(onViewStateChange).toHaveBeenLastCalledWith({
      selectedDay: 2,
      currencyMode: 'KRW',
    });
    await fireEvent.press(screen.getByTestId('currency-toggle-local'));
    expect(onViewStateChange).toHaveBeenLastCalledWith({
      selectedDay: 2,
      currencyMode: 'LOCAL',
    });
  });

  it('예약 화면에서 복귀할 때 저장한 날짜와 통화로 상세 화면을 연다', async () => {
    jest
      .spyOn(commonApi, 'getCourseDetailApi')
      .mockResolvedValue(mockCourseDetail);
    const screen = await render(
      <CourseDetailScreen
        courseId={mockCourseDetail.courseId}
        initialViewState={{ selectedDay: 2, currencyMode: 'LOCAL' }}
      />,
    );

    await screen.findByText('비자림');
    expect(screen.queryByText('함덕 해수욕장')).toBeNull();
    expect(screen.getByTestId('day-tab-2')).toHaveProp('accessibilityState', {
      selected: true,
    });
    expect(screen.getByText(/\$\s*250/)).toBeTruthy();
  });

  it('원화와 외화 모두 통화 기호와 금액 사이에 같은 간격을 사용한다', async () => {
    jest
      .spyOn(commonApi, 'getCourseDetailApi')
      .mockResolvedValue(mockCourseDetail);
    const screen = await render(
      <CourseDetailScreen courseId={mockCourseDetail.courseId} />,
    );

    await screen.findByText('₩ 350,000');
    await fireEvent.press(screen.getByTestId('currency-toggle-local'));
    expect(screen.getByText('$ 250')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('currency-toggle-krw'));
    expect(screen.getByText('₩ 350,000')).toBeTruthy();
  });

  it.each(['₩', 'KRW', '원', '  krw  ', '￦'])(
    '현지 통화가 %s이면 저장된 외화 선택을 원화로 복구하고 중복 토글을 숨긴다',
    async (exRateIcon) => {
      jest.spyOn(commonApi, 'getCourseDetailApi').mockResolvedValue({
        ...mockCourseDetail,
        exRateIcon,
      });
      const onViewStateChange = jest.fn();
      const screen = await render(
        <CourseDetailScreen
          courseId={mockCourseDetail.courseId}
          initialViewState={{ selectedDay: 2, currencyMode: 'LOCAL' }}
          onViewStateChange={onViewStateChange}
        />,
      );

      await screen.findByText('비자림');
      expect(screen.getByText('₩ 350,000')).toBeTruthy();
      expect(screen.queryByTestId('currency-toggle-krw')).toBeNull();
      expect(screen.queryByTestId('currency-toggle-local')).toBeNull();
      expect(onViewStateChange).toHaveBeenLastCalledWith({
        selectedDay: 2,
        currencyMode: 'KRW',
      });
      await fireEvent.press(screen.getByTestId('day-tab-1'));
      expect(screen.getByText('₩ 350,000')).toBeTruthy();
      expect(onViewStateChange).toHaveBeenLastCalledWith({
        selectedDay: 1,
        currencyMode: 'KRW',
      });
    },
  );

  it('원화가 아닌 현지 통화는 기호 앞뒤 공백을 제거하고 환산 금액을 표시한다', async () => {
    jest.spyOn(commonApi, 'getCourseDetailApi').mockResolvedValue({
      ...mockCourseDetail,
      exRateIcon: ' ¥ ',
      totalCostExRate: 39500,
    });
    const screen = await render(
      <CourseDetailScreen
        courseId={mockCourseDetail.courseId}
        initialViewState={{ selectedDay: 1, currencyMode: 'LOCAL' }}
      />,
    );

    await screen.findByText('함덕 해수욕장');
    expect(screen.getByText('¥ 39,500')).toBeTruthy();
    expect(screen.getByTestId('currency-toggle-local')).toHaveProp(
      'accessibilityState',
      { selected: true },
    );
    await fireEvent.press(screen.getByTestId('currency-toggle-krw'));
    expect(screen.getByText('₩ 350,000')).toBeTruthy();
  });

  it('같은 코스가 다시 조회되어도 아직 존재하는 날짜와 통화 선택을 유지한다', async () => {
    const api = jest
      .spyOn(commonApi, 'getCourseDetailApi')
      .mockResolvedValueOnce(mockCourseDetail)
      .mockResolvedValueOnce({
        ...mockCourseDetail,
        title: '갱신된 제주 코스',
      });
    let queryClient!: QueryClient;
    function RefetchHarness() {
      queryClient = useQueryClient();
      return <CourseDetailScreen courseId={mockCourseDetail.courseId} />;
    }
    const screen = await render(<RefetchHarness />);
    await screen.findByText('함덕 해수욕장');
    await fireEvent.press(screen.getByTestId('day-tab-2'));
    await fireEvent.press(screen.getByTestId('currency-toggle-local'));

    await act(async () => {
      await queryClient.invalidateQueries({
        queryKey: getCourseDetailQueryKey(mockCourseDetail.courseId),
      });
    });
    await waitFor(() => expect(api).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(screen.getByTestId('course-detail-header')).toHaveProp(
        'accessibilityLabel',
        '갱신된 제주 코스',
      ),
    );

    expect(screen.getByText('비자림')).toBeTruthy();
    expect(screen.queryByText('함덕 해수욕장')).toBeNull();
    expect(screen.getByText(/\$\s*250/)).toBeTruthy();
  });

  it('저장한 날짜가 코스에 없으면 첫날로 복구하고 유효한 상태를 전달한다', async () => {
    jest
      .spyOn(commonApi, 'getCourseDetailApi')
      .mockResolvedValue(mockCourseDetail);
    const onViewStateChange = jest.fn();
    const screen = await render(
      <CourseDetailScreen
        courseId={mockCourseDetail.courseId}
        initialViewState={{ selectedDay: 99, currencyMode: 'LOCAL' }}
        onViewStateChange={onViewStateChange}
      />,
    );

    await screen.findByText('함덕 해수욕장');
    expect(screen.getByTestId('day-tab-1')).toHaveProp('accessibilityState', {
      selected: true,
    });
    expect(screen.getByText(/\$\s*250/)).toBeTruthy();
    expect(onViewStateChange).toHaveBeenLastCalledWith({
      selectedDay: 1,
      currencyMode: 'LOCAL',
    });
  });

  it('공유 왼쪽의 릴스 버튼으로 현재 선택한 날짜의 편집기를 연다', async () => {
    jest
      .spyOn(commonApi, 'getCourseDetailApi')
      .mockResolvedValue(mockCourseDetail);
    const { findByTestId, getByTestId } = await render(
      <CourseDetailScreen courseId='test-course-id-123' />,
    );
    await findByTestId('btn-share');
    await fireEvent.press(getByTestId('day-tab-2'));
    const actions = getByTestId('course-share-actions');
    expect(
      actions.children
        .filter((node) => typeof node !== 'string')
        .map((node) => (typeof node === 'string' ? '' : node.props.testID)),
    ).toEqual(['btn-reel', 'btn-share']);
    await fireEvent.press(getByTestId('btn-reel'));
    await findByTestId('reel-back');
    expect(getByTestId('reel-day-2').props.accessibilityState.selected).toBe(
      true,
    );
    expect(getByTestId('reel-photo-place-3')).toBeTruthy();
    await fireEvent.press(getByTestId('reel-back'));
    expect(getByTestId('btn-share')).toBeTruthy();
  });

  it('코스 상세 데이터 조회 후 타임라인, 방문지 카드, 추천 이유를 올바르게 렌더링해야 한다', async () => {
    jest
      .spyOn(commonApi, 'getCourseDetailApi')
      .mockResolvedValue(mockCourseDetail);

    const { getByText } = await render(
      <CourseDetailScreen courseId='test-course-id-123' />,
    );

    await waitFor(() => {
      expect(getByText('대한민국')).toBeTruthy();
      expect(getByText('제주')).toBeTruthy();
      expect(getByText('26.08.01 - 26.08.02')).toBeTruthy();
      expect(getByText(/₩\s*350,000/)).toBeTruthy();
      expect(getByText(/90분/)).toBeTruthy();
      expect(getByText(/바다 전망 추천/)).toBeTruthy();
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
      expect(getByText('대한민국')).toBeTruthy();
      expect(getByText('제주')).toBeTruthy();
    });

    expect(apiSpy).toHaveBeenCalledTimes(2);
  });

  it('Google Map(MapView) 기반 지도가 정상적으로 렌더링되어야 한다', async () => {
    jest
      .spyOn(commonApi, 'getCourseDetailApi')
      .mockResolvedValue(mockCourseDetail);

    const { getByTestId, getByText } = await render(
      <CourseDetailScreen courseId='test-course-id-123' />,
    );

    await waitFor(() => {
      expect(getByText('대한민국')).toBeTruthy();
      expect(getByText('제주')).toBeTruthy();
      expect(getByTestId('mini-map-card')).toBeTruthy();
      expect(getByTestId('in-app-map-view')).toBeTruthy();
    });
  });

  it('총 예상 경비 카드와 원화(₩)/현지통화(exRateIcon) 토글 및 하단 공유 버튼이 정상 작동해야 한다 (UI v3 & API-COURSE-2)', async () => {
    jest
      .spyOn(commonApi, 'getCourseDetailApi')
      .mockResolvedValue(mockCourseDetail);

    const { getByText, getByTestId } = await render(
      <CourseDetailScreen courseId='test-course-id-123' />,
    );

    await waitFor(() => {
      expect(getByText('총 예상 경비')).toBeTruthy();
      expect(getByText(/₩\s*350,000/)).toBeTruthy();
      expect(getByTestId('btn-share-bottom')).toBeTruthy();
      expect(getByText('친구에게 코스 공유하기')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.press(getByTestId('currency-toggle-local'));
    });

    expect(getByText(/\$\s*250/)).toBeTruthy();

    await act(async () => {
      fireEvent.press(getByTestId('currency-toggle-krw'));
    });

    expect(getByText(/₩\s*350,000/)).toBeTruthy();
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
      expect(getByText('대한민국')).toBeTruthy();
      expect(getByText('제주')).toBeTruthy();
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
      expect(getByText('대한민국')).toBeTruthy();
      expect(getByText('제주')).toBeTruthy();
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
      message:
        '[여로] 2박 3일 서귀포 감성 힐링 코스 여행 일정을 공유합니다!\nhttps://www.yeolo.app/invite/token-123',
      url: 'https://www.yeolo.app/invite/token-123',
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
      expect(getByText('대한민국')).toBeTruthy();
      expect(getByText('제주')).toBeTruthy();
    });

    const shareButton = getByTestId('btn-share');
    await act(async () => {
      fireEvent.press(shareButton);
    });

    expect(setStringSpy).toHaveBeenCalledWith(
      'https://www.yeolo.app/invite/token-123',
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

  it.each(['flight', 'hotel', 'ticket'])(
    '코스 %s 예약에 목적지·날짜를 전달하고 숙소·티켓만 자동 검색한다',
    async (kind) => {
      jest
        .spyOn(commonApi, 'getCourseDetailApi')
        .mockResolvedValue(mockCourseDetail);
      const onOpenBooking = jest.fn();
      const { getByTestId, findByText } = await render(
        <CourseDetailScreen
          courseId='test-course-id-123'
          onOpenBooking={onOpenBooking}
        />,
      );
      await findByText('대한민국');
      await findByText('제주');
      await fireEvent.press(getByTestId(`btn-${kind}-cta`));
      expect(onOpenBooking).toHaveBeenCalledWith(kind, {
        keyword: '제주',
        country: '대한민국',
        startDate: '2026-08-01',
        endDate: '2026-08-02',
        ...(kind === 'flight' ? {} : { autoSearch: true }),
      });
    },
  );

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

it('unknown 구간의 길찾기는 해당 날짜의 바로 다음 장소를 목적지로 전달한다', async () => {
  const course = JSON.parse(
    JSON.stringify(mockCourseDetail),
  ) as commonApi.CourseDetail;
  course.itinerary.days[0].stops[0].transportToNext = {
    type: 'unknown',
    distance: null,
    minutes: null,
    memo: null,
  };
  jest.spyOn(commonApi, 'getCourseDetailApi').mockResolvedValue(course);
  const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
  const screen = await render(
    <CourseDetailScreen courseId={course.courseId} />,
  );
  const link = await screen.findByRole('link', {
    name: 'Google 지도에서 길찾기',
  });
  await fireEvent.press(link);
  const url = new URL(open.mock.calls[open.mock.calls.length - 1][0]);
  expect(url.searchParams.get('origin_place_id')).toBe('place-1');
  expect(url.searchParams.get('destination_place_id')).toBe('place-2');
});
