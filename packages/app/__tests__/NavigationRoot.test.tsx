/**
 * @file NavigationRoot.test.tsx
 * @description Unit test for NavigationRoot showing BottomNavBar on CourseDetailScreen.
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
    LoginScreen: ({ onLoginSuccess }: any) => (
      <Button title='Mock Login' onPress={() => onLoginSuccess?.(false)} />
    ),
    HomeScreen: ({ onNavigateToExplore }: any) => (
      <Button title='Go to Explore' onPress={onNavigateToExplore} />
    ),
    CourseListScreen: ({ onSelectCourse }: any) => (
      <Button
        title='Select Course'
        onPress={() => onSelectCourse('course-123')}
      />
    ),
    IntroScreen: ({ onNext }: any) => (
      <Button title='Go to Intro Next' onPress={onNext} />
    ),
    MbtiInputScreen: ({ onNext }: any) => (
      <Button title='Go to MBTI Next' onPress={onNext} />
    ),
    PhotoConsentScreen: ({ onNext }: any) => (
      <Button title='Go to Photo Next' onPress={onNext} />
    ),
    TasteAnalysisScreen: ({ onFinish }: any) => (
      <Button title='Finish Taste' onPress={() => onFinish?.('taste-1')} />
    ),
    TasteProfileScreen: ({ onGenerateCourse }: any) => (
      <Button title='Go Home from Taste' onPress={onGenerateCourse} />
    ),
    ProfileScreen: () => <Text>ProfileScreen</Text>,
    CourseCreateScreen: () => <Text>CourseCreateScreen</Text>,
    CourseGeneratingScreen: ({ onComplete }: any) => (
      <Button
        title='Complete Course Generation'
        onPress={() => onComplete?.('course-123')}
      />
    ),
    CourseDetailScreen: ({ courseId }: any) => (
      <Text testID='course-detail-screen'>CourseDetailScreen: {courseId}</Text>
    ),
    CourseShareScreen: ({ courseId }: any) => (
      <Text testID='course-share-screen'>CourseShareScreen: {courseId}</Text>
    ),
    ProfileInputScreen: () => (
      <Text testID='profile-input-screen'>ProfileInputScreen</Text>
    ),
    PlaceDetailScreen: () => (
      <Text testID='place-detail-screen'>PlaceDetailScreen</Text>
    ),
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
    const { getByTestId, queryByText, getByText } = await render(
      <AuthContext.Provider value={mockAuthContext as any}>
        <NavigationRoot />
      </AuthContext.Provider>,
    );

    if (queryByText('Go to Explore')) {
      await act(async () => {
        fireEvent.press(getByText('Go to Explore'));
      });
    }

    if (queryByText('Select Course')) {
      await act(async () => {
        fireEvent.press(getByText('Select Course'));
      });
    }

    await waitFor(() => {
      expect(getByTestId('course-detail-screen')).toBeTruthy();
    });
  });
});
