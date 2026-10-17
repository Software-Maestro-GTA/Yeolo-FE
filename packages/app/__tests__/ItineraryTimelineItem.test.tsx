/**
 * @file ItineraryTimelineItem.test.tsx
 * @description 일정 카드의 장소 ID 지도 연결과 추천 이유·메모·교통 정보 표시를 검증합니다.
 */
import React from 'react';
import { fireEvent, waitFor, within } from '@testing-library/react-native';
import { Alert, Linking } from 'react-native';
import { renderWithQueryClient as render } from './test-utils';
import { ItineraryTimelineItem } from '../src/components/course/ItineraryTimelineItem';
import { COURSE_UI } from '../src/constants/courseUiStrings';
import type { ItineraryStop } from '@yeolo/common';

const baseStop: ItineraryStop = {
  sequence: 1,
  arrivalTime: '10:00',
  stayMinutes: 90,
  memo: '',
  reason: '',
  cost: 0,
  place: {
    placeId: 'ChIJ_yeolo_test_place',
    placeName: '함덕 해수욕장',
    category: 'NATURE',
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
};

describe('ItineraryTimelineItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('장소 이름·바로가기와 지도 아이콘 모두 같은 Google Place ID 링크를 연다', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    const { getByText, getByTestId } = await render(
      <ItineraryTimelineItem stop={baseStop} isLast={false} />,
    );
    await fireEvent.press(getByText('함덕 해수욕장'));
    await fireEvent.press(getByTestId('map-link-1'));
    expect(openURL).toHaveBeenCalledTimes(2);
    expect(openURL.mock.calls[0][0]).toBe(openURL.mock.calls[1][0]);
    const url = new URL(openURL.mock.calls[0][0]);
    expect(url.origin + url.pathname).toBe(
      'https://www.google.com/maps/search/',
    );
    expect(Object.fromEntries(url.searchParams)).toEqual({
      api: '1',
      query: '함덕 해수욕장',
      query_place_id: 'ChIJ_yeolo_test_place',
    });
  });

  it('Place ID가 없는 장소는 좌표 대신 인코딩된 장소명으로 검색한다', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    const stop = {
      ...baseStop,
      place: { ...baseStop.place, placeId: ' ', placeName: '카페 A&B / 서울' },
    };
    const { getByTestId } = await render(
      <ItineraryTimelineItem stop={stop} isLast />,
    );
    await fireEvent.press(getByTestId('map-link-1'));
    const url = new URL(openURL.mock.calls[0][0]);
    expect(Object.fromEntries(url.searchParams)).toEqual({
      api: '1',
      query: '카페 A&B / 서울',
    });
  });

  it('장소명이 없어도 Place ID로 지도 링크를 연다', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    const { getByTestId } = await render(
      <ItineraryTimelineItem
        stop={{ ...baseStop, place: { ...baseStop.place, placeName: ' ' } }}
        isLast
      />,
    );
    await fireEvent.press(getByTestId('map-link-1'));
    const url = new URL(openURL.mock.calls[0][0]);
    expect(url.searchParams.get('query')).toBe('ChIJ_yeolo_test_place');
    expect(url.searchParams.get('query_place_id')).toBe(
      'ChIJ_yeolo_test_place',
    );
  });

  it('Place ID와 장소명이 모두 없으면 빈 검색 대신 안내를 표시한다', async () => {
    const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByTestId } = await render(
      <ItineraryTimelineItem
        stop={{
          ...baseStop,
          place: { ...baseStop.place, placeId: '', placeName: '' },
        }}
        isLast
      />,
    );
    await fireEvent.press(getByTestId('map-link-1'));
    expect(openURL).not.toHaveBeenCalled();
    expect(alert).toHaveBeenCalledWith(COURSE_UI.MAP_ERROR);
  });

  it('지도 링크를 열 수 없으면 기존 오류 안내를 표시한다', async () => {
    jest
      .spyOn(Linking, 'openURL')
      .mockRejectedValue(new Error('Cannot open URL'));
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const { getByTestId } = await render(
      <ItineraryTimelineItem stop={baseStop} isLast />,
    );
    await fireEvent.press(getByTestId('map-link-1'));
    await waitFor(() =>
      expect(alert).toHaveBeenCalledWith(COURSE_UI.MAP_ERROR),
    );
  });

  it('마지막 장소 뒤에는 다음 이동 카드를 표시하지 않는다', async () => {
    const { queryByTestId } = await render(
      <ItineraryTimelineItem stop={baseStop} isLast />,
    );
    expect(queryByTestId('transit-card')).toBeNull();
  });

  it('place 정보(장소명, 카테고리) 및 transportToNext 정보(이동수단, 소요시간)가 정상 노출되어야 한다', async () => {
    const { getByText, getByTestId } = await render(
      <ItineraryTimelineItem stop={baseStop} isLast={false} />,
    );

    expect(getByText('함덕 해수욕장')).toBeTruthy();
    expect(getByText('자연·산책')).toBeTruthy();
    expect(getByTestId('place-card')).toBeTruthy();
    expect(getByTestId('transit-card')).toBeTruthy();
    expect(getByText('대중교통 30분 소요')).toBeTruthy();
  });

  it('reason과 memo가 모두 존재할 때 아이콘 구분과 함께 둘 다 노출되어야 한다', async () => {
    const stop: ItineraryStop = {
      ...baseStop,
      reason: '바다 전망 추천',
      memo: '오픈런 추천',
    };

    const { getByText } = await render(
      <ItineraryTimelineItem stop={stop} isLast={false} />,
    );

    expect(getByText('바다 전망 추천')).toBeTruthy();
    expect(getByText('오픈런 추천')).toBeTruthy();
  });

  it('reason만 존재할 때 reason만 노출되어야 한다', async () => {
    const stop: ItineraryStop = {
      ...baseStop,
      reason: '바다 전망 추천',
      memo: '',
    };

    const { getByText, queryByText } = await render(
      <ItineraryTimelineItem stop={stop} isLast={false} />,
    );

    expect(getByText('바다 전망 추천')).toBeTruthy();
    expect(queryByText('오픈런 추천')).toBeNull();
  });

  it('memo만 존재할 때 memo만 노출되어야 한다', async () => {
    const stop: ItineraryStop = {
      ...baseStop,
      reason: '',
      memo: '오픈런 추천',
    };

    const { getByText, queryByText } = await render(
      <ItineraryTimelineItem stop={stop} isLast={false} />,
    );

    expect(getByText('오픈런 추천')).toBeTruthy();
    expect(queryByText('바다 전망 추천')).toBeNull();
  });

  it('reason과 memo가 모두 비어있을 때 정보 없음이 노출되어야 한다', async () => {
    const stop: ItineraryStop = {
      ...baseStop,
      reason: '',
      memo: '',
    };

    const { getByText } = await render(
      <ItineraryTimelineItem stop={stop} isLast={false} />,
    );

    expect(getByText('정보 없음')).toBeTruthy();
  });

  it('reason과 memo가 완전히 동일할 때 중복 노출되지 않아야 한다', async () => {
    const stop: ItineraryStop = {
      ...baseStop,
      reason: '바다 전망 추천',
      memo: '바다 전망 추천',
    };

    const { getByText, getAllByText } = await render(
      <ItineraryTimelineItem stop={stop} isLast={false} />,
    );

    expect(getByText('바다 전망 추천')).toBeTruthy();
    expect(getAllByText('바다 전망 추천').length).toBe(1);
  });

  it('transportToNext의 cost와 memo가 정상적으로 렌더링되어야 한다', async () => {
    const stopWithCost: ItineraryStop = {
      ...baseStop,
      cost: 15000,
      transportToNext: {
        type: 'transit',
        distance: 15000,
        minutes: 30,
        cost: 2500,
        memo: '101번 버스 탑승 후 서귀포 환승',
      },
    };

    const { getByText } = await render(
      <ItineraryTimelineItem stop={stopWithCost} isLast={false} />,
    );

    // Place cost
    expect(getByText('₩15,000')).toBeTruthy();
    // Transit cost
    expect(getByText('₩2,500')).toBeTruthy();
    // Transit memo tip
    expect(getByText('101번 버스 탑승 후 서귀포 환승')).toBeTruthy();
  });

  it('도보 이동 시 도보 무료가 노출되어야 한다', async () => {
    const stopWithWalking: ItineraryStop = {
      ...baseStop,
      cost: 0,
      transportToNext: {
        type: 'walking',
        distance: 500,
        minutes: 10,
        cost: 0,
        memo: '',
      },
    };

    const { getByText } = await render(
      <ItineraryTimelineItem stop={stopWithWalking} isLast={false} />,
    );

    expect(getByText('도보 무료')).toBeTruthy();
    expect(
      getByText('가장 효율적인 추천 동선으로 연결된 구간입니다.'),
    ).toBeTruthy();
  });

  it('유료 이동수단(대중교통/택시 등)의 cost가 0 또는 null일 때 교통비 별도가 노출되어야 한다', async () => {
    const stopWithUnspecifiedTransit: ItineraryStop = {
      ...baseStop,
      cost: 0,
      transportToNext: {
        type: 'transit',
        distance: 5000,
        minutes: 20,
        cost: 0,
        memo: '시내버스 이동',
      },
    };

    const { getByText } = await render(
      <ItineraryTimelineItem
        stop={stopWithUnspecifiedTransit}
        isLast={false}
      />,
    );

    expect(getByText('교통비 별도')).toBeTruthy();
    expect(getByText('시내버스 이동')).toBeTruthy();
  });
});

const unknownStop: ItineraryStop = {
  ...baseStop,
  transportToNext: {
    type: 'unknown',
    distance: null,
    minutes: null,
    memo: null,
  },
};
const nextPlace = {
  ...baseStop.place,
  placeId: 'ChIJ_next_place',
  placeName: '카페 A&B / 제주',
};

describe('unknown 이동 구간', () => {
  beforeEach(() => jest.clearAllMocks());
  afterEach(() => jest.restoreAllMocks());

  it('알 수 없는 이동은 안내와 두 Place ID의 길찾기를 제공하고 추정 정보를 표시하지 않는다', async () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    const screen = await render(
      <ItineraryTimelineItem
        stop={unknownStop}
        nextPlace={nextPlace}
        isLast={false}
      />,
    );
    const card = within(screen.getByTestId('transit-card'));
    expect(card.getByText('이동 경로를 확인할 수 없어요')).toBeTruthy();
    expect(
      card.queryByText(/km|분 소요|₩|교통비|도보|자가용|추천 동선/),
    ).toBeNull();
    await fireEvent.press(
      card.getByRole('link', { name: 'Google 지도에서 길찾기' }),
    );
    const url = new URL(open.mock.calls[0][0]);
    expect(url.origin + url.pathname).toBe('https://www.google.com/maps/dir/');
    expect(Object.fromEntries(url.searchParams)).toEqual({
      api: '1',
      origin: baseStop.place.placeName,
      origin_place_id: baseStop.place.placeId,
      destination: nextPlace.placeName,
      destination_place_id: nextPlace.placeId,
    });
  });

  it('Place ID가 없는 다음 장소는 장소명으로 길찾기를 연다', async () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    const screen = await render(
      <ItineraryTimelineItem
        stop={unknownStop}
        nextPlace={{ ...nextPlace, placeId: '' }}
        isLast={false}
      />,
    );
    await fireEvent.press(
      screen.getByRole('link', { name: 'Google 지도에서 길찾기' }),
    );
    const url = new URL(open.mock.calls[0][0]);
    expect(url.searchParams.get('destination')).toBe(nextPlace.placeName);
    expect(url.searchParams.has('destination_place_id')).toBe(false);
    expect(url.searchParams.get('origin_place_id')).toBe(
      baseStop.place.placeId,
    );
  });

  it('다음 장소가 없으면 안내만 표시하고 마지막 장소에는 이동 카드도 표시하지 않는다', async () => {
    const screen = await render(
      <ItineraryTimelineItem stop={unknownStop} isLast={false} />,
    );
    expect(screen.getByText('이동 경로를 확인할 수 없어요')).toBeTruthy();
    expect(
      screen.queryByRole('link', { name: 'Google 지도에서 길찾기' }),
    ).toBeNull();
    await screen.rerender(
      <ItineraryTimelineItem stop={unknownStop} nextPlace={nextPlace} isLast />,
    );
    expect(screen.queryByTestId('transit-card')).toBeNull();
  });

  it('길찾기를 열 수 없으면 오류를 안내한다', async () => {
    jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('unavailable'));
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    const screen = await render(
      <ItineraryTimelineItem
        stop={unknownStop}
        nextPlace={nextPlace}
        isLast={false}
      />,
    );
    await fireEvent.press(
      screen.getByRole('link', { name: 'Google 지도에서 길찾기' }),
    );
    await waitFor(() =>
      expect(alert).toHaveBeenCalledWith(COURSE_UI.MAP_ERROR),
    );
  });
});
