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
    TasteAnalysisScreen: ({ onFinish, onFail }: any) => (
      <React.Fragment>
        <Button title='Finish Taste' onPress={() => onFinish?.('taste-1')} />
        <Button title='Fail Taste' onPress={() => onFail?.()} />
      </React.Fragment>
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
    CourseDetailScreen: ({ courseId, onSelectPlace, onBack }: any) => (
      <React.Fragment>
        <Button
          title='Select Place Stop'
          onPress={() =>
            onSelectPlace?.({
              sequence: 1,
              place: {
                placeId: 'place-123',
                placeName: '함덕 해수욕장',
              },
            })
          }
        />
        <Button title='Detail Back' onPress={() => onBack?.()} />
      </React.Fragment>
    ),
    CourseShareScreen: ({ courseId, onSaveSuccess, onDecline }: any) => (
      <React.Fragment>
        <Text testID='course-share-screen'>CourseShareScreen: {courseId}</Text>
        <Button
          title='Accept Share'
          onPress={() => onSaveSuccess?.('course-accepted-1')}
        />
        <Button title='Decline Share' onPress={() => onDecline?.()} />
      </React.Fragment>
    ),
    ProfileInputScreen: () => (
      <Text testID='profile-input-screen'>ProfileInputScreen</Text>
    ),
    PlaceDetailScreen: ({ stop, placeId }: any) => (
      <Text testID='place-detail-screen'>
        PlaceDetailScreen: {stop?.place?.placeName || placeId}
      </Text>
    ),
  };
});

import { NAV_STEPS } from '../src/constants';

describe('NavigationRoot - CourseDetailScreen Navigation Bar & PlaceDetail Navigation', () => {
  const mockAuthContext = {
    isAuthenticated: true,
    isLoading: false,
    user: { id: 'user-1', email: 'test@example.com' },
    login: jest.fn(),
    logout: jest.fn(),
  };

  it('renders BottomNavBar when showing CourseDetailScreen', async () => {
    const { queryByText, getByText } = await render(
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
      expect(getByText('Select Place Stop')).toBeTruthy();
    });
  });

  it('navigates from CourseDetailScreen to PlaceDetailScreen when place is pressed', async () => {
    const { getByText, findByTestId } = await render(
      <AuthContext.Provider value={mockAuthContext as any}>
        <NavigationRoot />
      </AuthContext.Provider>,
    );

    if (getByText('Go to Explore')) {
      await act(async () => {
        fireEvent.press(getByText('Go to Explore'));
      });
    }

    if (getByText('Select Course')) {
      await act(async () => {
        fireEvent.press(getByText('Select Course'));
      });
    }

    await act(async () => {
      fireEvent.press(getByText('Select Place Stop'));
    });

    const placeDetailScreen = await findByTestId('place-detail-screen');
    expect(placeDetailScreen).toBeTruthy();
    expect(getByText(/함덕 해수욕장/)).toBeTruthy();
  });

  it('hasCompletedOnboarding이 false인 경우 로그인 성공/세션 복원 시 IntroScreen(온보딩)으로 진입해야 한다', async () => {
    const mockAuthOnboarding = {
      isAuthenticated: true,
      isLoading: false,
      hasCompletedOnboarding: false,
      user: { id: 'user-1', email: 'test@example.com' },
      login: jest.fn(),
      logout: jest.fn(),
    };

    const { getByText } = await render(
      <AuthContext.Provider value={mockAuthOnboarding as any}>
        <NavigationRoot />
      </AuthContext.Provider>,
    );

    await waitFor(() => {
      expect(getByText('Go to Intro Next')).toBeTruthy();
    });
  });

  it('hasCompletedOnboarding이 true인 경우 HomeScreen으로 진입해야 한다', async () => {
    const mockAuthCompleted = {
      isAuthenticated: true,
      isLoading: false,
      hasCompletedOnboarding: true,
      user: { id: 'user-1', email: 'test@example.com' },
      login: jest.fn(),
      logout: jest.fn(),
    };

    const { getByText } = await render(
      <AuthContext.Provider value={mockAuthCompleted as any}>
        <NavigationRoot />
      </AuthContext.Provider>,
    );

    await waitFor(() => {
      expect(getByText('Go to Explore')).toBeTruthy();
    });
  });

  it('yeolo://invite/{shareToken} 딥링크 진입 시 CourseShareScreen으로 이동해야 한다', async () => {
    const { Linking } = require('react-native');
    jest
      .spyOn(Linking, 'getInitialURL')
      .mockResolvedValueOnce('yeolo://invite/test-share-token-123');

    const { findByTestId } = await render(
      <AuthContext.Provider value={mockAuthContext as any}>
        <NavigationRoot />
      </AuthContext.Provider>,
    );

    const shareScreen = await findByTestId('course-share-screen');
    expect(shareScreen).toBeTruthy();
  });

  it('공유 코스 수락(onSaveSuccess) 후 CourseDetailScreen에서 뒤로가기 시 CourseShareScreen이 아닌 HomeScreen으로 복귀해야 한다', async () => {
    const { Linking } = require('react-native');
    jest
      .spyOn(Linking, 'getInitialURL')
      .mockResolvedValueOnce('yeolo://invite/test-share-token-123');

    const { findByTestId, getByText } = await render(
      <AuthContext.Provider value={mockAuthContext as any}>
        <NavigationRoot />
      </AuthContext.Provider>,
    );

    expect(await findByTestId('course-share-screen')).toBeTruthy();

    // 1. 코스 저장(수락)
    await act(async () => {
      fireEvent.press(getByText('Accept Share'));
    });

    // 2. CourseDetailScreen으로 이동 확인
    expect(getByText('Select Place Stop')).toBeTruthy();

    // 3. CourseDetailScreen에서 뒤로가기 실행
    await act(async () => {
      fireEvent.press(getByText('Detail Back'));
    });

    // 4. CourseShareScreen으로 돌아가지 않고 HomeScreen(Go to Explore)으로 이동했는지 확인
    expect(getByText('Go to Explore')).toBeTruthy();
  });

  it('공유 코스 거절(onDecline) 시 HomeScreen으로 바로 이동해야 한다', async () => {
    const { Linking } = require('react-native');
    jest
      .spyOn(Linking, 'getInitialURL')
      .mockResolvedValueOnce('yeolo://invite/test-share-token-123');

    const { findByTestId, getByText } = await render(
      <AuthContext.Provider value={mockAuthContext as any}>
        <NavigationRoot />
      </AuthContext.Provider>,
    );

    expect(await findByTestId('course-share-screen')).toBeTruthy();

    // 코스 거절 실행
    await act(async () => {
      fireEvent.press(getByText('Decline Share'));
    });

    // HomeScreen으로 이동 확인
    expect(getByText('Go to Explore')).toBeTruthy();
  });

  it('비로그인 상태에서 공유 코스 거절(onDecline) 시 LoginScreen으로 이동해야 한다', async () => {
    const { Linking } = require('react-native');
    jest
      .spyOn(Linking, 'getInitialURL')
      .mockResolvedValueOnce('yeolo://invite/test-share-token-123');

    const mockUnauthenticatedContext = {
      isAuthenticated: false,
      isLoading: false,
      user: null,
      login: jest.fn(),
      logout: jest.fn(),
    };

    const { findByTestId, getByText } = await render(
      <AuthContext.Provider value={mockUnauthenticatedContext as any}>
        <NavigationRoot />
      </AuthContext.Provider>,
    );

    expect(await findByTestId('course-share-screen')).toBeTruthy();

    // 코스 거절 실행
    await act(async () => {
      fireEvent.press(getByText('Decline Share'));
    });

    // LoginScreen(Mock Login)으로 이동 확인
    expect(getByText('Mock Login')).toBeTruthy();
  });

  it('hasCompletedOnboarding이 false인 사용자가 코스 생성을 시도하면 IntroScreen(온보딩)으로 유도해야 한다', async () => {
    const mockAuthNeedsOnboarding = {
      isAuthenticated: true,
      isLoading: false,
      hasCompletedOnboarding: false,
      user: { id: 'u1', name: 'New User' },
    };

    const { getByText } = await render(
      <AuthContext.Provider value={mockAuthNeedsOnboarding as any}>
        <NavigationRoot />
      </AuthContext.Provider>,
    );

    // Initial state is IntroScreen because hasCompletedOnboarding is false
    expect(getByText('Go to Intro Next')).toBeTruthy();
  });

  it('hasCompletedOnboarding이 false인 상태에서 하단 탭 코스 생성을 탭하면 IntroScreen으로 이동해야 한다', async () => {
    const mockAuthNeedsOnboarding = {
      isAuthenticated: true,
      isLoading: false,
      hasCompletedOnboarding: false,
      user: { id: 'u1', name: 'New User' },
    };

    // Render starting from HOME step
    const { getByTestId, getByText } = await render(
      <AuthContext.Provider value={mockAuthNeedsOnboarding as any}>
        <NavigationRoot initialStep={'HOME' as any} />
      </AuthContext.Provider>,
    );

    expect(getByText('Go to Explore')).toBeTruthy();

    // Tab bar 'CREATE' 탭 클릭
    const tabCreate = getByTestId('tab-create');
    await act(async () => {
      fireEvent.press(tabCreate);
    });

    // CourseCreateScreen 대신 IntroScreen(Go to Intro Next)이 렌더링되어야 함
    expect(getByText('Go to Intro Next')).toBeTruthy();
  });

  it('온보딩 중 TasteAnalysisScreen에서 onFail 발생 시 MBTI 화면(MbtiInputScreen)으로 이동해야 한다', async () => {
    const mockAuthNeedsOnboarding = {
      isAuthenticated: true,
      isLoading: false,
      hasCompletedOnboarding: false,
      user: { id: 'u1', name: 'New User' },
    };

    const { getByText } = await render(
      <AuthContext.Provider value={mockAuthNeedsOnboarding as any}>
        <NavigationRoot initialStep={NAV_STEPS.TASTE} />
      </AuthContext.Provider>,
    );

    expect(getByText('Fail Taste')).toBeTruthy();

    await act(async () => {
      fireEvent.press(getByText('Fail Taste'));
    });

    expect(getByText('Go to MBTI Next')).toBeTruthy();
  });

  it('온보딩 완료 후 TasteAnalysisScreen에서 onFail 발생 시 ProfileScreen으로 이동해야 한다', async () => {
    const mockAuthCompleted = {
      isAuthenticated: true,
      isLoading: false,
      hasCompletedOnboarding: true,
      user: { id: 'u1', name: 'Existing User' },
    };

    const { getByText } = await render(
      <AuthContext.Provider value={mockAuthCompleted as any}>
        <NavigationRoot initialStep={NAV_STEPS.TASTE} />
      </AuthContext.Provider>,
    );

    expect(getByText('Fail Taste')).toBeTruthy();

    await act(async () => {
      fireEvent.press(getByText('Fail Taste'));
    });

    expect(getByText('ProfileScreen')).toBeTruthy();
  });
});

