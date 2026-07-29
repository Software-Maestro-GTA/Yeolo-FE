/**
 * @file NavigationRoot.test.tsx
 * @description Unit test for NavigationRoot showing BottomNavBar on CourseDetailScreen.
 * @requirements REQ-11, REQ-9
 * @functional FUN-4, FUN-7
 * @author Antigravity Agent
 */
import React from 'react';
import { fireEvent, waitFor, act } from '@testing-library/react-native';
import { NavigationRoot } from '../src/navigation/NavigationRoot';
import { AuthContext } from '../src/context';
import { renderWithQueryClient as render } from './test-utils';

jest.mock('../src/screens', () => {
  const React = require('react');
  const { Text, Button } = require('react-native');
  return {
    LoginScreen: () => <Text>LoginScreen</Text>,
    HomeScreen: ({ onNavigateToExplore }: any) => (
      <Button title="Go to Explore" onPress={onNavigateToExplore} />
    ),
    CourseListScreen: ({ onSelectCourse }: any) => (
      <Button title="Select Course" onPress={() => onSelectCourse('course-123')} />
    ),
    IntroScreen: () => <Text>IntroScreen</Text>,
    PhotoAnalysisScreen: () => <Text>PhotoAnalysisScreen</Text>,
    TasteAnalysisScreen: () => <Text>TasteAnalysisScreen</Text>,
    TasteProfileScreen: () => <Text>TasteProfileScreen</Text>,
    ProfileScreen: () => <Text>ProfileScreen</Text>,
    CourseCreateScreen: () => <Text>CourseCreateScreen</Text>,
    CourseGeneratingScreen: () => <Text>CourseGeneratingScreen</Text>,
    CourseDetailScreen: ({ courseId }: any) => <Text testID="course-detail-screen">CourseDetailScreen: {courseId}</Text>,
  };
});

describe('NavigationRoot - CourseDetailScreen Navigation Bar', () => {
  const mockAuthContext = {
    isAuthenticated: true,
    isLoading: false,
    user: { id: 'user-1', email: 'test@example.com' },
    login: jest.fn(),
    logout: jest.fn(),
  };

  it('renders BottomNavBar when showing CourseDetailScreen', async () => {
    const { getByTestId, getByText } = await render(
      <AuthContext.Provider value={mockAuthContext as any}>
        <NavigationRoot />
      </AuthContext.Provider>
    );

    // Initial step is HOME, navigate to COURSE_LIST
    await act(async () => {
      fireEvent.press(getByText('Go to Explore'));
    });

    // Wait for COURSE_LIST screen button
    await waitFor(() => {
      expect(getByText('Select Course')).toBeTruthy();
    });

    // Select course to transition to COURSE_DETAIL
    await act(async () => {
      fireEvent.press(getByText('Select Course'));
    });

    // Verify CourseDetailScreen is visible
    await waitFor(() => {
      expect(getByTestId('course-detail-screen')).toBeTruthy();
    });

    // Verify bottom nav tab labels exist (홈, 탐색, 생성, 프로필)
    expect(getByText('탐색')).toBeTruthy();
    expect(getByText('홈')).toBeTruthy();
  });
});
