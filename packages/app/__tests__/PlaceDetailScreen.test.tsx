/**
 * @file PlaceDetailScreen.test.tsx
 * @description Unit and integration tests for PlaceDetailScreen with API-PLACE-1 data fetching and course stop synthesis.
 */
import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { PlaceDetailScreen } from '../src/screens/PlaceDetailScreen';
import { OpeningHoursModal } from '../src/components/place/OpeningHoursModal';
import { renderWithQueryClient as render } from './test-utils';
import type { ItineraryStop } from '@yeolo/common';

jest.mock('../src/components/navigation/BottomNavBar', () => ({
  BottomNavBar: () => null,
}));

jest.mock('../src/hooks/queries', () => ({
  ...jest.requireActual('../src/hooks/queries'),
  usePlaceDetailQuery: ({ placeId }: { placeId?: string }) => {
    if (placeId === 'error-place-id') {
      return {
        data: undefined,
        isLoading: false,
        isError: true,
        error: new Error('장소 정보를 찾을 수 없습니다.'),
      };
    }
    return {
      data: {
        placeId: placeId || 'place-123',
        placeName: '함덕 해수욕장 (API)',
        placeEngName: 'Hamdeok Beach (API)',
        category: '해변',
        address: '제주특별자치도 제주시 조천읍 함덕리 1008',
        latitude: 33.5434,
        longitude: 126.6692,
        rating: 4.8,
        photoUrl:
          'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf',
        openingHours: [
          '월요일 09:00 - 18:00',
          '화요일 09:00 - 18:00',
          '수요일 09:00 - 18:00',
          '목요일 09:00 - 18:00',
          '금요일 09:00 - 18:00',
          '토요일 09:00 - 18:00',
          '일요일 09:00 - 18:00',
        ],
      },
      isLoading: false,
      isError: false,
      error: null,
    };
  },
  getPlaceDetailQueryKey: (placeId: string) => ['placeDetail', placeId],
}));

const mockStop: ItineraryStop = {
  sequence: 1,
  arrivalTime: '10:00 AM',
  stayMinutes: 90,
  memo: '탁 트인 에메랄드빛 바다 산책',
  reason: '에메랄드빛 바다 전망 및 오션뷰 추천',
  place: {
    placeId: 'place-123',
    placeName: '함덕 해수욕장',
    category: '해변',
    latitude: 33.5434,
    longitude: 126.6692,
  },
  transportToNext: {
    type: 'none',
    distance: null,
    minutes: 0,
    cost: 15000,
    memo: null,
  },
};

describe('PlaceDetailScreen & OpeningHoursModal (API-PLACE-1 & 코스 정보 종합)', () => {
  it('stop 전달 시 API-PLACE-1 데이터와 코스 확인 창 정보가 종합되어 올바르게 렌더링되어야 한다', async () => {
    const { getByText, getByTestId, findByText } = await render(
      <PlaceDetailScreen stop={mockStop} />,
    );

    // 코스 확인 창에서 전달된 일정 항목 정보
    expect(getByTestId('summary-bar-card')).toBeTruthy();
    expect(getByText('10:00 AM')).toBeTruthy();
    expect(getByText('90분 소요')).toBeTruthy();
    expect(getByText('₩15,000')).toBeTruthy();
    expect(getByText('에메랄드빛 바다 전망 및 오션뷰 추천')).toBeTruthy();
    expect(getByText('탁 트인 에메랄드빛 바다 산책')).toBeTruthy();

    // API-PLACE-1 연동으로 비동기 받아온 장소 정보 종합 렌더링
    expect(await findByText('함덕 해수욕장 (API)')).toBeTruthy();
    expect(
      await findByText('제주특별자치도 제주시 조천읍 함덕리 1008'),
    ).toBeTruthy();
    expect(await findByText('4.8')).toBeTruthy();
    expect(getByTestId('opening-hours-section')).toBeTruthy();
    expect(getByTestId('ai-recommend-card')).toBeTruthy();
    expect(getByTestId('location-section')).toBeTruthy();
  });

  it('"더보기 ▾" 버튼 클릭 시 영업시간 상세 모달이 오픈되어야 하고, 닫기 버튼으로 모달을 닫을 수 있어야 한다', async () => {
    const { getByText, getByTestId, queryByTestId } = await render(
      <PlaceDetailScreen stop={mockStop} />,
    );

    expect(queryByTestId('opening-hours-modal-card')).toBeNull();

    const moreBtn = getByText('더보기 ▾');
    fireEvent.press(moreBtn);

    await waitFor(() => {
      expect(getByTestId('opening-hours-modal-card')).toBeTruthy();
      expect(getByText('월요일')).toBeTruthy();
      expect(getByText('오늘')).toBeTruthy();
    });

    const closeBtn = getByTestId('close-modal-btn');
    fireEvent.press(closeBtn);

    await waitFor(() => {
      expect(queryByTestId('opening-hours-modal-card')).toBeNull();
    });
  });

  it('API 호출 실패(error-place-id) 시 에러 안내가 노출되거나 stop의 기본 정보로 fallback 처리되어야 한다', async () => {
    const { getByText, findByText } = await render(
      <PlaceDetailScreen
        stop={{
          ...mockStop,
          place: { ...mockStop.place, placeId: 'error-place-id' },
        }}
      />,
    );

    // 에러 발생 또는 fallback 시 stop의 장소 정보 사용
    expect(getByText('10:00 AM')).toBeTruthy();
    expect(await findByText('함덕 해수욕장')).toBeTruthy();
  });

  it('OpeningHoursModal 단독 렌더링 시 주간 요일 목록 및 영업시간이 정상 표시되어야 한다', async () => {
    const mockOnClose = jest.fn();
    const mockHoursData = [
      { day: '월요일', hours: '10:00 - 22:00' },
      { day: '화요일', hours: '10:00 - 22:00' },
      { day: '수요일', hours: '10:00 - 22:00' },
      { day: '목요일', hours: '10:00 - 22:00' },
      { day: '금요일', hours: '10:00 - 22:00' },
      { day: '토요일', hours: '10:00 - 22:00' },
      { day: '일요일', hours: '10:00 - 22:00' },
    ];
    const { getByText, getAllByText, getByTestId } = await render(
      <OpeningHoursModal
        visible={true}
        onClose={mockOnClose}
        hoursData={mockHoursData}
      />,
    );

    expect(getByTestId('opening-hours-modal-card')).toBeTruthy();
    expect(getByText('월요일')).toBeTruthy();
    expect(getByText('일요일')).toBeTruthy();
    expect(getAllByText('10:00 - 22:00').length).toBe(7);
  });
});
