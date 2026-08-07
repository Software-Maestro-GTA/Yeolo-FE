/**
 * @file PlaceDetailScreen.test.tsx
 * @description Unit and integration tests for PlaceDetailScreen and OpeningHoursModal matching Figma UI specifications.
 * @requirements REQ-9
 * @functional FUN-3, FUN-GA4
 * @author Antigravity Agent
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { PlaceDetailScreen } from '../src/screens/PlaceDetailScreen';
import { OpeningHoursModal } from '../src/components/place/OpeningHoursModal';

jest.mock('../src/components/navigation/BottomNavBar', () => ({
  BottomNavBar: () => null,
}));

describe('PlaceDetailScreen & OpeningHoursModal (FUN-3: 장소 확인 및 영업시간 모달)', () => {
  it('Figma UI 스펙 장소 상세 요소들(장소명, 카테고리, 별점, 요약 메트릭, AI 추천, 위치)이 올바르게 렌더링되어야 한다', async () => {
    const { getByText, getByTestId } = await render(
      <PlaceDetailScreen
        placeName="모리 미술관"
        category="관광명소"
        rating="4.5"
        arrivalTime="10:00 AM"
        stayMinutes={90}
        cost={18000}
      />
    );

    expect(getByText('모리 미술관')).toBeTruthy();
    expect(getByText('관광명소')).toBeTruthy();
    expect(getByText('4.5')).toBeTruthy();
    expect(getByTestId('summary-bar-card')).toBeTruthy();
    expect(getByText('10:00 AM')).toBeTruthy();
    expect(getByText('90분 소요')).toBeTruthy();
    expect(getByText('₩18,000')).toBeTruthy();
    expect(getByTestId('opening-hours-section')).toBeTruthy();
    expect(getByTestId('ai-recommend-card')).toBeTruthy();
    expect(getByTestId('location-section')).toBeTruthy();
  });

  it('"더보기 ▾" 버튼 클릭 시 영업시간 상세 모달이 오픈되어야 하고, 닫기 버튼으로 모달을 닫을 수 있어야 한다', async () => {
    const { getByText, getByTestId, queryByTestId } = await render(
      <PlaceDetailScreen placeName="모리 미술관" />
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

  it('OpeningHoursModal 단독 렌더링 시 주간 요일 목록 및 영업시간이 정상 표시되어야 한다', async () => {
    const mockOnClose = jest.fn();
    const { getByText, getAllByText, getByTestId } = await render(
      <OpeningHoursModal visible={true} onClose={mockOnClose} />
    );

    expect(getByTestId('opening-hours-modal-card')).toBeTruthy();
    expect(getByText('월요일')).toBeTruthy();
    expect(getByText('일요일')).toBeTruthy();
    expect(getAllByText('10:00 - 22:00').length).toBe(7);
  });
});
