/**
 * @file BottomNavBar.test.tsx
 * @description Unit test for BottomNavBar component matching Figma UI specifications.
 */
import React from 'react';
import { fireEvent, act } from '@testing-library/react-native';
import { BottomNavBar } from '../src/components/navigation/BottomNavBar';
import { renderWithQueryClient as render } from './test-utils';

describe('BottomNavBar UI & Interactions', () => {
  const mockOnTabPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('홈, 탐색, 생성, 프로필 4개 탭이 정상 렌더링되어야 한다', async () => {
    const { getByText, getByTestId } = await render(
      <BottomNavBar currentTab="profile" onTabPress={mockOnTabPress} />
    );

    expect(getByText('홈')).toBeTruthy();
    expect(getByText('탐색')).toBeTruthy();
    expect(getByText('생성')).toBeTruthy();
    expect(getByText('프로필')).toBeTruthy();

    expect(getByTestId('tab-home')).toBeTruthy();
    expect(getByTestId('tab-explore')).toBeTruthy();
    expect(getByTestId('tab-create')).toBeTruthy();
    expect(getByTestId('tab-profile')).toBeTruthy();
  });

  it('탭 클릭 시 해당 tab id와 함께 onTabPress가 호출되어야 한다', async () => {
    const { getByTestId } = await render(
      <BottomNavBar currentTab="profile" onTabPress={mockOnTabPress} />
    );

    await act(async () => {
      fireEvent.press(getByTestId('tab-home'));
    });
    expect(mockOnTabPress).toHaveBeenCalledWith('home');

    await act(async () => {
      fireEvent.press(getByTestId('tab-explore'));
    });
    expect(mockOnTabPress).toHaveBeenCalledWith('explore');
  });
});
