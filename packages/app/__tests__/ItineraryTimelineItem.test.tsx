/**
 * @file ItineraryTimelineItem.test.tsx
 * @description Unit tests for ItineraryTimelineItem component checking reason, memo, and aiTipText formatting.
 */
import React from 'react';
import { renderWithQueryClient as render } from './test-utils';
import { ItineraryTimelineItem } from '../src/components/course/ItineraryTimelineItem';
import type { ItineraryStop } from '@yeolo/common';

const baseStop: ItineraryStop = {
  sequence: 1,
  arrivalTime: '10:00',
  stayMinutes: 90,
  memo: '',
  reason: '',
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
};

describe('ItineraryTimelineItem', () => {
  it('place 정보(장소명, 카테고리) 및 transportToNext 정보(이동수단, 소요시간)가 정상 노출되어야 한다', async () => {
    const { getByText, getByTestId } = await render(
      <ItineraryTimelineItem stop={baseStop} isLast={false} />,
    );

    expect(getByText('함덕 해수욕장')).toBeTruthy();
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
