/**
 * @file NavigationRoot.test.tsx
 * @description Verifies UI v3 navigation, course interruption home/history cleanup, onboarding paths and deep links.
 */
import React from 'react';
import { BackHandler, Platform, PanResponder } from 'react-native';
import { fireEvent, waitFor, act } from '@testing-library/react-native';
import {
  NavigationRoot,
  shouldHandleEdgeSwipe,
  handlePanResponderRelease,
} from '../src/navigation/NavigationRoot';
import { AuthContext } from '../src/context';
import { renderWithQueryClient as render } from './test-utils';

jest.mock('../src/screens', () => {
  const React = require('react');
  const { Text, Button } = require('react-native');
  return {
    LoginScreen: ({ onLoginSuccess }: any) => (
      <>
        <Button title='Mock Login' onPress={() => onLoginSuccess?.(false)} />
        <Button title='New Login' onPress={() => onLoginSuccess?.(true)} />
      </>
    ),
    HomeScreen: ({
      onNavigateToExplore,
      onOpenBooking,
      onNavigateToCreate,
      onNavigateToProfile,
    }: any) => (
      <React.Fragment>
        <Button title='Go to Explore' onPress={onNavigateToExplore} />
        <Button title='Create Course' onPress={onNavigateToCreate} />
        <Button title='Open Profile' onPress={onNavigateToProfile} />
        <Button
          title='Open Ticket Booking'
          onPress={() => onOpenBooking?.('ticket', { keyword: '도쿄' })}
        />
      </React.Fragment>
    ),
    CourseListScreen: ({ onSelectCourse }: any) => (
      <Button
        title='Select Course'
        onPress={() => onSelectCourse('course-123')}
      />
    ),
    MBTIConsentScreen: ({ onNext, onPhoto }: any) => (
      <>
        <Button title='Choose MBTI' onPress={onNext} />
        <Button title='Choose Photos' onPress={onPhoto} />
      </>
    ),
    PhotoAuthExplainScreen: ({ onNext, onBack }: any) => (
      <>
        {onBack && <Button title='Permission Back' onPress={onBack} />}
        <Button title='Full Permission Ready' onPress={() => onNext('all')} />
        <Button
          title='Selected Permission Ready'
          onPress={() => onNext('limited')}
        />
      </>
    ),
    MBTIResultScreen: ({ mbti, onGenerateCourse, onPhoto, onBack }: any) => (
      <>
        <Text>{mbti} Result</Text>
        <Button title='Result Course' onPress={onGenerateCourse} />
        <Button title='Result Photos' onPress={onPhoto} />
        <Button title='Result Back' onPress={onBack} />
      </>
    ),
    MbtiInputScreen: ({ onNext }: any) => (
      <Button title='Go to MBTI Next' onPress={() => onNext('INFJ')} />
    ),
    PhotoConsentScreen: ({ onNext }: any) => (
      <>
        <Button title='Go to Photo Next' onPress={() => onNext('all')} />
        <Button title='Limited Photos' onPress={() => onNext('limited')} />
        <Button title='Deny Photos' onPress={() => onNext('denied')} />
      </>
    ),
    TasteAnalysisScreen: ({
      onFinish,
      onFail,
      mode,
      onLimitedFinish,
      onClose,
      onFailureStateChange,
    }: any) => {
      const [failed, setFailed] = React.useState(false);
      React.useEffect(() => {
        onFailureStateChange?.(failed);
        return () => onFailureStateChange?.(false);
      }, [failed, onFailureStateChange]);
      return (
        <React.Fragment>
          <Text>
            {failed
              ? 'Selection Failure'
              : mode === 'limited'
                ? 'Limited Analysis'
                : 'Real Analysis'}
          </Text>
          <Button
            title='Mark Analysis Failed'
            onPress={() => setFailed(true)}
          />
          {onClose && <Button title='Close Analysis' onPress={onClose} />}
          <Button title='Finish Limited' onPress={onLimitedFinish} />
          <Button title='Finish Taste' onPress={() => onFinish?.('taste-1')} />
          <Button title='Fail Taste' onPress={() => onFail?.()} />
        </React.Fragment>
      );
    },
    TasteProfileScreen: ({ onGenerateCourse, onBack }: any) => (
      <>
        <Button title='Taste Back' onPress={onBack} />
        <Button
          title='Go Home from Taste'
          onPress={() =>
            onGenerateCourse({ countryName: '포르투갈', cityName: '리스본' })
          }
        />
      </>
    ),
    ProfileScreen: () => <Text>ProfileScreen</Text>,
    CourseCreateScreen: ({
      mbti,
      recommendedDestination,
      onBack,
      onSubmit,
    }: any) => (
      <>
        <Text>CourseCreateScreen</Text>
        <Button title='Create Back' onPress={onBack} />
        <Button title='Generate Course' onPress={onSubmit} />
        {recommendedDestination && (
          <Text>
            {recommendedDestination.countryName},{' '}
            {recommendedDestination.cityName}
          </Text>
        )}
        <Text>{mbti ? `Create with ${mbti}` : 'Create with photos'}</Text>
      </>
    ),
    CourseGeneratingScreen: ({
      onComplete,
      onReturnToCreate,
      onReturnHome,
    }: any) => (
      <>
        <Button
          title='Complete Course Generation'
          onPress={() => onComplete?.('course-123')}
        />
        <Button title='Return to Course Create' onPress={onReturnToCreate} />
        <Button
          title='Background Connection Interrupted'
          onPress={onReturnHome}
        />
      </>
    ),
    CourseDetailScreen: ({ courseId, onBack }: any) => (
      <React.Fragment>
        <Text>CourseDetailScreen: {courseId}</Text>
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
  };
});

import { NAV_STEPS, UI_STRINGS } from '../src/constants';

describe('NavigationRoot - course detail and onboarding navigation', () => {
  const mockAuthContext = {
    isAuthenticated: true,
    isLoading: false,
    user: { id: 'user-1', email: 'test@example.com' },
    login: jest.fn(),
    logout: jest.fn(),
  };

  it('생성 실패 후 코스 생성 화면으로 돌아가고 뒤로가기로 실패 화면을 다시 열지 않는다', async () => {
    const ui = await render(
      <AuthContext.Provider value={mockAuthContext as any}>
        <NavigationRoot />
      </AuthContext.Provider>,
    );
    await fireEvent.press(ui.getByText('Create Course'));
    await fireEvent.press(ui.getByText('Generate Course'));
    await fireEvent.press(ui.getByText('Return to Course Create'));
    expect(ui.getByText('CourseCreateScreen')).toBeTruthy();
    expect(ui.queryByText('Go to Photo Next')).toBeNull();
    expect(ui.queryByText('Complete Course Generation')).toBeNull();
    await fireEvent.press(ui.getByText('Create Back'));
    expect(ui.getByText('Create Course')).toBeTruthy();
    expect(ui.queryByText('Complete Course Generation')).toBeNull();
  });

  it.each(['confirm', 'backdrop', 'requestClose'])(
    'shows an app info dialog over home after an interruption and dismisses via %s without returning to generation',
    async (dismissal) => {
      const ui = await render(
        <AuthContext.Provider value={mockAuthContext as any}>
          <NavigationRoot />
        </AuthContext.Provider>,
      );
      await fireEvent.press(ui.getByText('Create Course'));
      await fireEvent.press(ui.getByText('Generate Course'));
      await fireEvent.press(ui.getByText('Background Connection Interrupted'));
      expect(ui.getByTestId('course-interruption-notice')).toBeTruthy();
      expect(
        ui.getByText(UI_STRINGS.COURSE_GENERATING.BACKGROUND_INTERRUPTED_TITLE),
      ).toBeTruthy();
      expect(
        ui.getByText(
          UI_STRINGS.COURSE_GENERATING.BACKGROUND_INTERRUPTED_MESSAGE,
        ),
      ).toBeTruthy();
      expect(ui.queryByText('Complete Course Generation')).toBeNull();
      if (dismissal === 'confirm')
        await fireEvent.press(ui.getByText(UI_STRINGS.COMMON.CONFIRM));
      else if (dismissal === 'backdrop')
        await fireEvent.press(
          ui.getByTestId('course-interruption-notice-backdrop', {
            includeHiddenElements: true,
          }),
        );
      else
        await fireEvent(
          ui.getByTestId('course-interruption-notice'),
          'requestClose',
        );
      expect(ui.queryByTestId('course-interruption-notice')).toBeNull();
      expect(ui.getByText('Create Course')).toBeTruthy();
      await fireEvent.press(ui.getByText('Create Course'));
      await fireEvent.press(ui.getByText('Create Back'));
      expect(ui.getByText('Create Course')).toBeTruthy();
      expect(ui.queryByText('Complete Course Generation')).toBeNull();
    },
  );

  it('opens CourseDetailScreen from the home course list', async () => {
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
      expect(getByText('CourseDetailScreen: course-123')).toBeTruthy();
    });
  });

  it('returns from course detail to its originating course list', async () => {
    const { getByText, queryByText } = await render(
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

    expect(getByText('CourseDetailScreen: course-123')).toBeTruthy();
    await act(async () => {
      fireEvent.press(getByText('Detail Back'));
    });
    expect(getByText('Select Course')).toBeTruthy();
    expect(queryByText('CourseDetailScreen: course-123')).toBeNull();
  });

  it('hasCompletedOnboarding이 false인 경우 로그인 성공/세션 복원 시 PhotoConsentScreen(온보딩)으로 진입해야 한다', async () => {
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
      expect(getByText('Go to Photo Next')).toBeTruthy();
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
    expect(getByText('CourseDetailScreen: course-accepted-1')).toBeTruthy();

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

  it('hasCompletedOnboarding이 false인 사용자가 코스 생성을 시도하면 PhotoConsentScreen(온보딩)으로 유도해야 한다', async () => {
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

    // Initial state is PhotoConsentScreen because hasCompletedOnboarding is false
    expect(getByText('Go to Photo Next')).toBeTruthy();
  });

  it('hasCompletedOnboarding이 false인 상태에서 홈에서 코스 생성을 누르면 PhotoConsentScreen으로 이동해야 한다', async () => {
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
    const tabCreate = getByText('Create Course');
    await act(async () => {
      fireEvent.press(tabCreate);
    });

    // CourseCreateScreen 대신 PhotoConsentScreen(Go to Photo Next)이 렌더링되어야 함
    expect(getByText('Go to Photo Next')).toBeTruthy();
  });

  it('온보딩 중 TasteAnalysisScreen에서 onFail 발생 시 MBTI 동의 화면으로 이동해야 한다', async () => {
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

    expect(getByText('Choose MBTI')).toBeTruthy();
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

  describe('iOS Edge Swipe to Go Back (PanResponder & shouldHandleEdgeSwipe)', () => {
    it('shouldHandleEdgeSwipe: iOS에서 좌측 엣지(x0 <= 45) 및 가로 스와이프 시 true를 반환해야 한다', () => {
      expect(
        shouldHandleEdgeSwipe({
          step: NAV_STEPS.COURSE_DETAIL,
          history: [NAV_STEPS.COURSE_LIST],
          x0: 30,
          dx: 60,
          dy: 5,
          isIos: true,
        }),
      ).toBe(true);
    });

    it('shouldHandleEdgeSwipe: x0 > 45(비 엣지 영역)이면 false를 반환해야 한다', () => {
      expect(
        shouldHandleEdgeSwipe({
          step: NAV_STEPS.COURSE_DETAIL,
          history: [NAV_STEPS.COURSE_LIST],
          x0: 100,
          dx: 60,
          dy: 5,
          isIos: true,
        }),
      ).toBe(false);
    });

    it('shouldHandleEdgeSwipe: 세로 스크롤(dy > dx)인 경우 false를 반환해야 한다', () => {
      expect(
        shouldHandleEdgeSwipe({
          step: NAV_STEPS.COURSE_DETAIL,
          history: [NAV_STEPS.COURSE_LIST],
          x0: 30,
          dx: 10,
          dy: 70,
          isIos: true,
        }),
      ).toBe(false);
    });

    it('shouldHandleEdgeSwipe: history가 비어있거나 홈/로그인/생성중 단계인 경우 false를 반환해야 한다', () => {
      expect(
        shouldHandleEdgeSwipe({
          step: NAV_STEPS.HOME,
          history: [],
          x0: 30,
          dx: 60,
          dy: 5,
          isIos: true,
        }),
      ).toBe(false);

      expect(
        shouldHandleEdgeSwipe({
          step: NAV_STEPS.GENERATING_COURSE,
          history: [NAV_STEPS.HOME],
          x0: 30,
          dx: 60,
          dy: 5,
          isIos: true,
        }),
      ).toBe(false);
    });

    it('shouldHandleEdgeSwipe: iOS가 아닌 환경(Android 등)에서는 false를 반환해야 한다', () => {
      expect(
        shouldHandleEdgeSwipe({
          step: NAV_STEPS.COURSE_DETAIL,
          history: [NAV_STEPS.COURSE_LIST],
          x0: 30,
          dx: 60,
          dy: 5,
          isIos: false,
        }),
      ).toBe(false);
    });

    it('handlePanResponderRelease: dx > 60 또는 dx > 30 & vx > 0.5인 경우 onBack을 호출해야 한다', () => {
      const onBack1 = jest.fn();
      const res1 = handlePanResponderRelease({ dx: 70 }, onBack1);
      expect(res1).toBe(true);
      expect(onBack1).toHaveBeenCalledTimes(1);

      const onBack2 = jest.fn();
      const res2 = handlePanResponderRelease({ dx: 40, vx: 0.8 }, onBack2);
      expect(res2).toBe(true);
      expect(onBack2).toHaveBeenCalledTimes(1);

      const onBack3 = jest.fn();
      const res3 = handlePanResponderRelease({ dx: 20, vx: 0.1 }, onBack3);
      expect(res3).toBe(false);
      expect(onBack3).not.toHaveBeenCalled();
    });

    it('최상위 네비게이션 컨테이너에 PanResponder panHandlers가 정상 바인딩되어 있어야 한다', async () => {
      const mockAuth = {
        isAuthenticated: true,
        isLoading: false,
        hasCompletedOnboarding: true,
      };

      const { getByTestId } = await render(
        <AuthContext.Provider value={mockAuth as any}>
          <NavigationRoot initialStep={NAV_STEPS.COURSE_LIST} />
        </AuthContext.Provider>,
      );

      const container = getByTestId('navigation-root-container');
      expect(container.props.onMoveShouldSetResponder).toBeDefined();
      expect(container.props.onResponderRelease).toBeDefined();
    });
  });
});

describe('예약 화면의 앱 공통 내비게이션', () => {
  const auth = {
    isAuthenticated: true,
    isLoading: false,
    hasCompletedOnboarding: true,
  };
  it('예약에서 뒤로 돌아가 홈의 프로필 진입을 사용할 수 있다', async () => {
    const ui = await render(
      <AuthContext.Provider value={auth as any}>
        <NavigationRoot initialStep={NAV_STEPS.HOME} />
      </AuthContext.Provider>,
    );
    await fireEvent.press(ui.getByText('Open Ticket Booking'));
    expect(ui.getByTestId('booking-screen-ticket')).toBeTruthy();
    expect(ui.queryByTestId('bottom-nav-bar')).toBeNull();
    expect(ui.getByLabelText('도시 또는 장소 이름').props.value).toBe('도쿄');
    await fireEvent.press(ui.getByLabelText('예약 이전 화면으로'));
    expect(ui.getByText('Open Ticket Booking')).toBeTruthy();
    await fireEvent.press(ui.getByText('Open Profile'));
    expect(ui.getByText('ProfileScreen')).toBeTruthy();
    expect(ui.queryByTestId('booking-screen-ticket')).toBeNull();
  });
});

describe('UI v3 onboarding routes', () => {
  afterEach(() => jest.restoreAllMocks());
  function Wrapper({ children }: { children: React.ReactNode }) {
    const [completed, setCompleted] = React.useState(false);
    return (
      <AuthContext.Provider
        value={
          {
            isAuthenticated: true,
            isLoading: false,
            hasCompletedOnboarding: completed,
            setHasCompletedOnboarding: async (value: boolean) =>
              setCompleted(value),
          } as any
        }>
        {children}
      </AuthContext.Provider>
    );
  }
  it('first login opens photo consent', async () => {
    const screen = await render(
      <Wrapper>
        <NavigationRoot initialStep={NAV_STEPS.LOGIN} />
      </Wrapper>,
    );
    await fireEvent.press(screen.getByText('New Login'));
    expect(screen.getByText('Go to Photo Next')).toBeTruthy();
  });
  it('full permission reaches the taste profile and course creation', async () => {
    const screen = await render(
      <Wrapper>
        <NavigationRoot />
      </Wrapper>,
    );
    await fireEvent.press(screen.getByText('Go to Photo Next'));
    expect(screen.getByText('Real Analysis')).toBeTruthy();
    expect(screen.queryByText('Close Analysis')).toBeNull();
    await fireEvent.press(screen.getByText('Finish Taste'));
    await fireEvent.press(screen.getByText('Go Home from Taste'));
    expect(screen.getByText('CourseCreateScreen')).toBeTruthy();
    expect(screen.getByText('포르투갈, 리스본')).toBeTruthy();
    await fireEvent.press(screen.getByText('Create Back'));
    await fireEvent.press(screen.getByText('Taste Back'));
    await fireEvent.press(screen.getByText('Create Course'));
    expect(screen.getByText('CourseCreateScreen')).toBeTruthy();
    expect(screen.queryByText('포르투갈, 리스본')).toBeNull();
  });
  it('limited mode leads to explanation and switches back to real analysis', async () => {
    const screen = await render(
      <Wrapper>
        <NavigationRoot />
      </Wrapper>,
    );
    await fireEvent.press(screen.getByText('Limited Photos'));
    expect(screen.getByText('Limited Analysis')).toBeTruthy();
    await fireEvent.press(screen.getByText('Finish Limited'));
    await fireEvent.press(screen.getByText('Full Permission Ready'));
    expect(screen.getByText('Real Analysis')).toBeTruthy();
  });
  it('permission guidance can explicitly restart analysis with selected-photo access', async () => {
    const screen = await render(
      <Wrapper>
        <NavigationRoot />
      </Wrapper>,
    );
    await fireEvent.press(screen.getByText('Limited Photos'));
    await fireEvent.press(screen.getByText('Finish Limited'));
    await fireEvent.press(screen.getByText('Selected Permission Ready'));
    expect(screen.getByText('Limited Analysis')).toBeTruthy();
    expect(screen.queryByText('Real Analysis')).toBeNull();
    await fireEvent.press(screen.getByText('Finish Taste'));
    expect(screen.getByText('Go Home from Taste')).toBeTruthy();
  });
  it.each(['button', 'android', 'ios'])(
    'permission %s back restores the selection failure without restarting analysis',
    async (method) => {
      jest.replaceProperty(
        Platform,
        'OS',
        method === 'ios' ? 'ios' : 'android',
      );
      const backListener = jest.spyOn(BackHandler, 'addEventListener');
      const panCreate = jest.spyOn(PanResponder, 'create');
      const screen = await render(
        <Wrapper>
          <NavigationRoot />
        </Wrapper>,
      );
      await fireEvent.press(screen.getByText(/Limited Photos/i));
      await fireEvent.press(screen.getByText(/Mark Analysis Failed/i));
      await fireEvent.press(screen.getByText(/Finish Limited/i));
      expect(screen.queryByText('Selection Failure')).toBeNull();
      if (method === 'button')
        await fireEvent.press(screen.getByText(/Permission Back/i));
      else if (method === 'android') {
        const calls = backListener.mock.calls;
        const handler = calls
          .filter(([event]) => event === 'hardwareBackPress')
          .at(-1)![1];
        await act(async () => {
          expect(handler({} as never)).toBe(true);
        });
      } else {
        await act(async () => {
          panCreate.mock.calls.at(-1)![0].onPanResponderRelease!(
            {} as any,
            { dx: 80, vx: 0.8 } as any,
          );
        });
      }
      expect(screen.getByText('Selection Failure')).toBeTruthy();
      expect(screen.queryByText('Limited Analysis')).toBeNull();
      expect(screen.queryByText(/Go to Photo Next/i)).toBeNull();
      await fireEvent.press(screen.getByText(/Finish Limited/i));
      await fireEvent.press(screen.getByText(/Full Permission Ready/i));
      expect(screen.getByText('Real Analysis')).toBeTruthy();
      expect(screen.queryByText('Selection Failure')).toBeNull();
      jest.restoreAllMocks();
    },
  );
  it('permission back returns to the denied-access screen', async () => {
    const screen = await render(
      <Wrapper>
        <NavigationRoot />
      </Wrapper>,
    );
    await fireEvent.press(screen.getByText('Deny Photos'));
    await fireEvent.press(screen.getByText('Choose Photos'));
    await fireEvent.press(screen.getByText('Permission Back'));
    expect(screen.getByText('Choose Photos')).toBeTruthy();
    expect(screen.getByText('Choose MBTI')).toBeTruthy();
    expect(screen.queryByText('Go to Photo Next')).toBeNull();
  });
  it('denial flows through MBTI consent, input and result before course creation', async () => {
    const screen = await render(
      <Wrapper>
        <NavigationRoot />
      </Wrapper>,
    );
    await fireEvent.press(screen.getByText('Deny Photos'));
    await fireEvent.press(screen.getByText('Choose MBTI'));
    await fireEvent.press(screen.getByText('Go to MBTI Next'));
    expect(screen.getByText('INFJ Result')).toBeTruthy();
    expect(screen.queryByText('CourseCreateScreen')).toBeNull();
    await fireEvent.press(screen.getByText('Result Course'));
    expect(screen.getByText('CourseCreateScreen')).toBeTruthy();
    expect(screen.getByText('Create with INFJ')).toBeTruthy();
  });
  it.each(['consent', 'result'])(
    '%s photo CTA opens the permission explanation',
    async (source) => {
      const screen = await render(
        <Wrapper>
          <NavigationRoot />
        </Wrapper>,
      );
      await fireEvent.press(screen.getByText('Deny Photos'));
      if (source === 'result') {
        await fireEvent.press(screen.getByText('Choose MBTI'));
        await fireEvent.press(screen.getByText('Go to MBTI Next'));
        await fireEvent.press(screen.getByText('Result Photos'));
      } else await fireEvent.press(screen.getByText('Choose Photos'));
      expect(screen.getByText('Full Permission Ready')).toBeTruthy();
      if (source === 'result') {
        await fireEvent.press(screen.getByText('Full Permission Ready'));
        await fireEvent.press(screen.getByText('Finish Taste'));
        await fireEvent.press(screen.getByText('Go Home from Taste'));
        expect(screen.getByText('Create with photos')).toBeTruthy();
      }
    },
  );
});
