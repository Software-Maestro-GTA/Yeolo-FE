/**
 * @file HomeScreen.test.tsx
 * @description Unit and integration tests for HomeScreen matching Figma UI specifications.
 */
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { HomeScreen } from '../src/screens/HomeScreen';

describe('HomeScreen (FUN-1: 홈 스크린 Figma UI)', () => {
  it('Figma UI 스펙 요소들(브랜드 로고, 인사말, 퀵 버튼 3종, 최근 확인 코스, 여행 예약 타일 4종)이 올바르게 렌더링되어야 한다', async () => {
    const { getByText, getByTestId } = await render(<HomeScreen />);

    expect(getByTestId('home-screen')).toBeTruthy();
    expect(getByText('여로')).toBeTruthy();
    expect(getByText('오늘은 어디로 떠나볼까요?')).toBeTruthy();

    expect(getByTestId('quick-icons')).toBeTruthy();
    expect(getByText('코스 생성하기')).toBeTruthy();
    expect(getByText('코스 둘러보기')).toBeTruthy();
    expect(getByText('내 여행 취향')).toBeTruthy();

    expect(getByTestId('recent-course-section')).toBeTruthy();
    expect(getByText('최근 확인한 여행 코스')).toBeTruthy();
    expect(getByText('서울 힐링 여행')).toBeTruthy();

    expect(getByTestId('booking-section')).toBeTruthy();
    expect(getByText('여행 예약')).toBeTruthy();
    expect(getByText('Trip.com')).toBeTruthy();
    expect(getByText('항공')).toBeTruthy();
    expect(getByText('숙소')).toBeTruthy();
    expect(getByText('기차')).toBeTruthy();
    expect(getByText('투어·티켓')).toBeTruthy();
  });

  it('퀵 버튼 클릭 시 각각의 네비게이션 콜백 함수가 정상 호출되어야 한다', async () => {
    const mockOnCreate = jest.fn();
    const mockOnExplore = jest.fn();
    const mockOnProfile = jest.fn();

    const { getByText } = await render(
      <HomeScreen
        onNavigateToCreate={mockOnCreate}
        onNavigateToExplore={mockOnExplore}
        onNavigateToProfile={mockOnProfile}
      />
    );

    fireEvent.press(getByText('코스 생성하기'));
    expect(mockOnCreate).toHaveBeenCalledTimes(1);

    fireEvent.press(getByText('코스 둘러보기'));
    expect(mockOnExplore).toHaveBeenCalledTimes(1);

    fireEvent.press(getByText('내 여행 취향'));
    expect(mockOnProfile).toHaveBeenCalledTimes(1);
  });
});
