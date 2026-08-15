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
  placeId: 'place-1',
  placeName: '함덕 해수욕장',
  category: '해변',
  arrivalTime: '10:00',
  stayMinutes: 90,
  transportToNext: 'transit',
  travelMinutesToNext: 30,
  cost: 0,
  memo: '',
  reason: '',
  latitude: 33.5434,
  longitude: 126.6692,
};

describe('ItineraryTimelineItem', () => {
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
});
