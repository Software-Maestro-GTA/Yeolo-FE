/**
 * @file NavigationRoot.tsx
 * @description Screen history, flow cleanup, course interruption home routing with shared guidance, shared-link resumption and session-aware back navigation.
 */
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  BackHandler,
  ToastAndroid,
  Platform,
  Linking,
  PanResponder,
  View,
  StyleSheet,
} from 'react-native';
import type { BookingKind } from '@yeolo/common';
import { BookingScreen } from '../screens/BookingScreen';
import type { BookingContext, OpenBooking } from '../services/bookingService';
import {
  getPhotoAccess,
  type PhotoAccess,
} from '../services/photoPermissionService';
import type { MbtiType } from '../constants/mbtiProfiles';
import { AuthContext } from '../context';
import { NavTab } from '../components/navigation';
import { MainLayout, OnboardingLayout } from '../layouts';
import { NAV_STEPS, NAV_TABS, NavStep, UI_STRINGS } from '../constants';
import type { CourseCreateScreenProps } from '../screens/CourseCreateScreen';
import type { CourseDetailViewState } from '../screens/CourseDetailScreen';
import { InfoDialog } from '../components/common/InfoDialog';
import {
  LoginScreen,
  HomeScreen,
  CourseListScreen,
  PhotoAuthExplainScreen,
  MBTIConsentScreen,
  MBTIResultScreen,
  MbtiInputScreen,
  PhotoConsentScreen,
  TasteAnalysisScreen,
  TasteProfileScreen,
  ProfileScreen,
  ProfileInputScreen,
  CourseCreateScreen,
  CourseGeneratingScreen,
  CourseDetailScreen,
  CourseShareScreen,
} from '../screens';

const NON_HISTORY_STEPS: NavStep[] = [
  NAV_STEPS.LOGIN,
  NAV_STEPS.GENERATING_COURSE,
  NAV_STEPS.TASTE,
];

const MAX_HISTORY_LENGTH = 10;
const ONBOARDING_FLOW_STEPS: NavStep[] = [
  NAV_STEPS.PHOTO,
  NAV_STEPS.PHOTO_AUTH,
  NAV_STEPS.MBTI_CONSENT,
  NAV_STEPS.MBTI,
  NAV_STEPS.MBTI_RESULT,
  NAV_STEPS.TASTE,
];

interface NavigationState {
  step: NavStep | null;
  history: NavStep[];
  revision: number;
}

export interface NavigationRootProps {
  initialStep?: NavStep;
  initialShareToken?: string;
}

export interface EdgeSwipeParams {
  step: NavStep | null;
  history: NavStep[];
  x0: number;
  dx: number;
  dy: number;
  isIos?: boolean;
}

export function shouldHandleEdgeSwipe({
  step,
  history,
  x0,
  dx,
  dy,
  isIos = Platform.OS === 'ios',
}: EdgeSwipeParams): boolean {
  if (!isIos) return false;

  if (
    !step ||
    history.length === 0 ||
    step === NAV_STEPS.HOME ||
    step === NAV_STEPS.LOGIN ||
    NON_HISTORY_STEPS.includes(step)
  ) {
    return false;
  }

  const isEdgeStart = x0 <= 45;
  const isHorizontalSwipe = dx > 15 && Math.abs(dx) > Math.abs(dy) * 1.5;

  return isEdgeStart && isHorizontalSwipe;
}

export function handlePanResponderRelease(
  gestureState: { dx: number; vx?: number },
  onBack: () => void,
): boolean {
  if (
    gestureState.dx > 60 ||
    (gestureState.dx > 30 && (gestureState.vx ?? 0) > 0.5)
  ) {
    onBack();
    return true;
  }
  return false;
}

export function NavigationRoot({
  initialStep,
  initialShareToken = '',
}: NavigationRootProps = {}) {
  const auth = useContext(AuthContext);
  const [analysisMode, setAnalysisMode] = useState<'full' | 'limited'>('full');
  const [analysisFailed, setAnalysisFailed] = useState(false);
  const [analysisRun, setAnalysisRun] = useState(0);
  const [selectedMbti, setSelectedMbti] = useState<MbtiType | null>(null);
  const [activeTasteProfileId, setActiveTasteProfileId] = useState<
    string | undefined
  >();
  const [recommendedDestination, setRecommendedDestination] =
    useState<CourseCreateScreenProps['recommendedDestination']>();
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [showCourseInterruptionNotice, setShowCourseInterruptionNotice] =
    useState(false);
  const [selectedShareToken, setSelectedShareToken] =
    useState<string>(initialShareToken);
  const [bookingRequest, setBookingRequest] = useState<{
    kind: BookingKind;
    context: BookingContext;
    tab: NavTab;
  } | null>(null);
  const [navigation, setNavigation] = useState<NavigationState>({
    step: initialStep || null,
    history: [],
    revision: 0,
  });
  const { step, history, revision } = navigation;
  const navStateRef = useRef(navigation);
  const authRef = useRef(auth);
  authRef.current = auth;
  const previousAuthenticated = useRef(auth?.isAuthenticated);
  const photoReanalysisPending = useRef(false);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  const lastBackPressRef = useRef<number>(0);
  const detailViewState = useRef<{
    courseId: string;
    state: CourseDetailViewState;
  } | null>(null);

  // The ref advances synchronously so double taps and callbacks from an old
  // screen cannot append history or navigate after that screen has closed.
  const commitNavigation = (nextStep: NavStep, nextHistory: NavStep[]) => {
    setShowCourseInterruptionNotice(false);
    const next = {
      step: nextStep,
      history: nextHistory.slice(-MAX_HISTORY_LENGTH),
      revision: navStateRef.current.revision + 1,
    };
    navStateRef.current = next;
    lastBackPressRef.current = 0;
    setNavigation(next);
  };
  const isCurrentRoute = () => navStateRef.current.revision === revision;
  const rootStep = (): NavStep => {
    if (!authRef.current?.isAuthenticated) return NAV_STEPS.LOGIN;
    return authRef.current.hasCompletedOnboarding === false
      ? NAV_STEPS.PHOTO
      : NAV_STEPS.HOME;
  };

  const goBack = () => {
    if (!isCurrentRoute()) return;
    if (step === NAV_STEPS.COURSE_SHARE) setSelectedShareToken('');
    const previous = history[history.length - 1];
    const target =
      previous === NAV_STEPS.LOGIN && authRef.current?.isAuthenticated
        ? rootStep()
        : previous || rootStep();
    commitNavigation(target, history.slice(0, -1));
  };

  const navigateTo = (
    nextStep: NavStep,
    destination?: CourseCreateScreenProps['recommendedDestination'],
  ) => {
    if (!isCurrentRoute() || step === nextStep) return;
    if (nextStep === NAV_STEPS.CREATE_COURSE)
      setRecommendedDestination(destination);
    const nextHistory =
      nextStep === NAV_STEPS.HOME || nextStep === NAV_STEPS.LOGIN
        ? []
        : step &&
            (!NON_HISTORY_STEPS.includes(step) ||
              (step === NAV_STEPS.TASTE &&
                analysisFailed &&
                nextStep === NAV_STEPS.PHOTO_AUTH))
          ? [...history, step]
          : history;
    commitNavigation(nextStep, nextHistory);
  };

  const returnTo = (target: NavStep) => {
    if (!isCurrentRoute()) return;
    const index = history.lastIndexOf(target);
    commitNavigation(target, index >= 0 ? history.slice(0, index) : []);
  };

  const finishFlow = (target: NavStep, completedSteps: NavStep[]) => {
    if (!isCurrentRoute()) return;
    commitNavigation(
      target,
      history.filter(
        (item) => !completedSteps.includes(item) && item !== target,
      ),
    );
  };

  const closeAnalysis = (fallback: NavStep = NAV_STEPS.HOME) => {
    if (!isCurrentRoute()) return;
    const origins = history.filter(
      (item) => !ONBOARDING_FLOW_STEPS.includes(item),
    );
    commitNavigation(
      origins[origins.length - 1] || fallback,
      origins.slice(0, -1),
    );
  };

  useEffect(() => {
    let active = true;
    let receivedRuntimeLink = false;
    const handleUrl = (url: string | null) => {
      if (!active || !url) return;
      const match = /(?:invite|share-links)\/([a-zA-Z0-9_-]+)/.exec(url);
      if (!match?.[1]) return;
      const current = navStateRef.current;
      setSelectedShareToken(match[1]);
      const origin = current.step || rootStep();
      const nextHistory =
        current.step === NAV_STEPS.COURSE_SHARE
          ? current.history
          : [...current.history, origin];
      commitNavigation(NAV_STEPS.COURSE_SHARE, nextHistory);
    };

    Linking.getInitialURL()
      .then((url) => {
        if (!receivedRuntimeLink) handleUrl(url);
      })
      .catch(() => {});
    const subscription = Linking.addEventListener('url', (event) => {
      receivedRuntimeLink = true;
      handleUrl(event.url);
    });
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (auth?.isLoading) return;
    const wasAuthenticated = previousAuthenticated.current;
    previousAuthenticated.current = auth?.isAuthenticated;
    if (wasAuthenticated && !auth?.isAuthenticated) {
      setSelectedCourseId('');
      setSelectedShareToken('');
      setSelectedMbti(null);
      setActiveTasteProfileId(undefined);
      setRecommendedDestination(undefined);
      setBookingRequest(null);
      setAnalysisMode('full');
      setAnalysisFailed(false);
      detailViewState.current = null;
      commitNavigation(NAV_STEPS.LOGIN, []);
      return;
    }
    if (navStateRef.current.step === null) {
      if (selectedShareToken) {
        commitNavigation(NAV_STEPS.COURSE_SHARE, [rootStep()]);
      } else {
        commitNavigation(rootStep(), []);
      }
    }
  }, [
    auth?.isAuthenticated,
    auth?.isLoading,
    auth?.hasCompletedOnboarding,
    selectedShareToken,
  ]);

  useEffect(() => {
    if (auth?.recentCourseId && !selectedCourseId && auth.isAuthenticated) {
      setSelectedCourseId(auth.recentCourseId);
    }
  }, [auth?.recentCourseId, auth?.isAuthenticated, selectedCourseId]);

  useEffect(() => {
    const handleBackPress = () => {
      if (step === NAV_STEPS.TASTE && analysisFailed) {
        goBack();
        return true;
      }
      if (step === NAV_STEPS.TASTE && auth?.hasCompletedOnboarding) {
        closeAnalysis();
        return true;
      }
      if (step === NAV_STEPS.GENERATING_COURSE || step === NAV_STEPS.TASTE) {
        if (Platform.OS === 'android') {
          ToastAndroid.show(
            UI_STRINGS.NAVIGATION.IN_PROGRESS,
            ToastAndroid.SHORT,
          );
        }
        return true;
      }
      if (
        history.length > 0 ||
        (step !== rootStep() && step !== NAV_STEPS.LOGIN)
      ) {
        goBack();
        return true;
      }
      const now = Date.now();
      if (
        lastBackPressRef.current > 0 &&
        now - lastBackPressRef.current < 2000
      ) {
        BackHandler.exitApp();
        return true;
      }
      lastBackPressRef.current = now;
      if (Platform.OS === 'android') {
        ToastAndroid.show(
          UI_STRINGS.NAVIGATION.EXIT_CONFIRM,
          ToastAndroid.SHORT,
        );
      }
      return true;
    };
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      handleBackPress,
    );
    return () => subscription.remove();
  }, [
    navigation,
    auth?.isAuthenticated,
    auth?.hasCompletedOnboarding,
    analysisFailed,
  ]);

  const goBackRef = useRef(goBack);
  goBackRef.current = goBack;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponder: (evt, gestureState) =>
          shouldHandleEdgeSwipe({
            step: navStateRef.current.step,
            history: navStateRef.current.history,
            x0: gestureState.x0 || evt?.nativeEvent?.pageX || 0,
            dx: gestureState.dx,
            dy: gestureState.dy,
          }),
        onMoveShouldSetPanResponderCapture: (evt, gestureState) =>
          shouldHandleEdgeSwipe({
            step: navStateRef.current.step,
            history: navStateRef.current.history,
            x0: gestureState.x0 || evt?.nativeEvent?.pageX || 0,
            dx: gestureState.dx,
            dy: gestureState.dy,
          }),
        onPanResponderRelease: (_evt, gestureState) => {
          handlePanResponderRelease(gestureState, () => goBackRef.current());
        },
        onPanResponderTerminationRequest: () => false,
      }),
    [],
  );

  if (step === null) {
    return null;
  }

  const handleTabPress = (tab: NavTab) => {
    if (tab === NAV_TABS.HOME) navigateTo(NAV_STEPS.HOME);
    if (tab === NAV_TABS.EXPLORE) navigateTo(NAV_STEPS.COURSE_LIST);
    if (tab === NAV_TABS.CREATE) {
      if (auth?.hasCompletedOnboarding === false) {
        navigateTo(NAV_STEPS.PHOTO);
      } else {
        navigateTo(NAV_STEPS.CREATE_COURSE);
      }
    }
    if (tab === NAV_TABS.PROFILE) navigateTo(NAV_STEPS.PROFILE);
  };

  const openBooking: OpenBooking = (kind, context) => {
    if (!isCurrentRoute()) return;
    setBookingRequest({
      kind,
      context,
      tab: step === NAV_STEPS.HOME ? NAV_TABS.HOME : NAV_TABS.EXPLORE,
    });
    navigateTo(NAV_STEPS.BOOKING);
  };

  const routePhotoAccess = (access: PhotoAccess) => {
    if (!isCurrentRoute()) return;
    if (access === 'denied') {
      navigateTo(NAV_STEPS.MBTI_CONSENT);
      return;
    }
    setAnalysisMode(access === 'limited' ? 'limited' : 'full');
    setAnalysisFailed(false);
    setAnalysisRun((value) => value + 1);
    // Starting again replaces the retained failure/help pair; Back alone preserves it.
    if (
      step === NAV_STEPS.PHOTO_AUTH &&
      history[history.length - 1] === NAV_STEPS.TASTE
    ) {
      commitNavigation(NAV_STEPS.TASTE, history.slice(0, -1));
    } else navigateTo(NAV_STEPS.TASTE);
  };

  // Reanalysis is an explicit action from an existing photo result; check OS access afresh.
  const reanalyzeTaste = async () => {
    if (!isCurrentRoute() || photoReanalysisPending.current) return;
    photoReanalysisPending.current = true;
    try {
      const access = await getPhotoAccess();
      if (!mounted.current || !isCurrentRoute()) return;
      if (access === 'denied') navigateTo(NAV_STEPS.PHOTO_AUTH);
      else routePhotoAccess(access);
    } catch {
      if (mounted.current && isCurrentRoute()) {
        Alert.alert(
          UI_STRINGS.ONBOARDING.ERROR_TITLE,
          UI_STRINGS.PHOTO_AUTH.PERMISSION_CHECK_ERROR,
        );
      }
    } finally {
      photoReanalysisPending.current = false;
    }
  };

  const renderCurrentScreen = () => {
    switch (step) {
      case NAV_STEPS.BOOKING:
        return (
          <MainLayout
            currentTab={bookingRequest?.tab || NAV_TABS.HOME}
            onTabPress={handleTabPress}>
            <BookingScreen
              kind={bookingRequest?.kind || 'ticket'}
              context={bookingRequest?.context}
              onBack={goBack}
            />
          </MainLayout>
        );
      case NAV_STEPS.LOGIN:
        return (
          <LoginScreen
            onLoginSuccess={(doOnboarding) => {
              if (!isCurrentRoute()) return;
              if (
                selectedShareToken &&
                history.includes(NAV_STEPS.COURSE_SHARE)
              ) {
                commitNavigation(NAV_STEPS.COURSE_SHARE, [
                  doOnboarding ? NAV_STEPS.PHOTO : NAV_STEPS.HOME,
                ]);
              } else {
                commitNavigation(
                  doOnboarding ? NAV_STEPS.PHOTO : NAV_STEPS.HOME,
                  [],
                );
              }
            }}
          />
        );
      case NAV_STEPS.MBTI_CONSENT:
        return (
          <OnboardingLayout>
            <MBTIConsentScreen
              onBack={history.length > 0 ? goBack : undefined}
              onNext={() => navigateTo(NAV_STEPS.MBTI)}
              onPhoto={() => navigateTo(NAV_STEPS.PHOTO_AUTH)}
            />
          </OnboardingLayout>
        );
      case NAV_STEPS.MBTI:
        return (
          <OnboardingLayout>
            <MbtiInputScreen
              onBack={goBack}
              onNext={(mbti) => {
                setSelectedMbti(mbti);
                navigateTo(NAV_STEPS.MBTI_RESULT);
              }}
            />
          </OnboardingLayout>
        );
      case NAV_STEPS.MBTI_RESULT:
        return (
          <OnboardingLayout>
            {selectedMbti ? (
              <MBTIResultScreen
                mbti={selectedMbti}
                onBack={goBack}
                onGenerateCourse={async () => {
                  await auth?.setHasCompletedOnboarding?.(true);
                  setRecommendedDestination(undefined);
                  finishFlow(NAV_STEPS.CREATE_COURSE, ONBOARDING_FLOW_STEPS);
                }}
                onPhoto={() => navigateTo(NAV_STEPS.PHOTO_AUTH)}
              />
            ) : (
              <MbtiInputScreen onNext={setSelectedMbti} />
            )}
          </OnboardingLayout>
        );
      case NAV_STEPS.PHOTO:
        return (
          <OnboardingLayout>
            <PhotoConsentScreen
              onBack={history.length > 0 ? goBack : undefined}
              onNext={routePhotoAccess}
            />
          </OnboardingLayout>
        );
      case NAV_STEPS.PHOTO_AUTH:
      case NAV_STEPS.TASTE:
        return (
          <OnboardingLayout>
            {(step === NAV_STEPS.TASTE ||
              history[history.length - 1] === NAV_STEPS.TASTE) && (
              <View
                key='analysis'
                style={
                  step === NAV_STEPS.TASTE ? styles.container : styles.hidden
                }
                accessibilityElementsHidden={step === NAV_STEPS.PHOTO_AUTH}
                importantForAccessibility={
                  step === NAV_STEPS.PHOTO_AUTH ? 'no-hide-descendants' : 'auto'
                }>
                <TasteAnalysisScreen
                  key={analysisRun}
                  onClose={
                    auth?.hasCompletedOnboarding
                      ? () => closeAnalysis()
                      : undefined
                  }
                  mode={analysisMode}
                  onFailureBack={goBack}
                  onFailureStateChange={setAnalysisFailed}
                  onChooseMbti={() => navigateTo(NAV_STEPS.MBTI)}
                  onLimitedFinish={() => navigateTo(NAV_STEPS.PHOTO_AUTH)}
                  onFinish={(tasteProfileId) => {
                    if (!isCurrentRoute() || step !== NAV_STEPS.TASTE) return;
                    auth?.setHasCompletedOnboarding?.(true);
                    setSelectedMbti(null);
                    setActiveTasteProfileId(tasteProfileId);
                    finishFlow(NAV_STEPS.TASTE_PROFILE, ONBOARDING_FLOW_STEPS);
                  }}
                  onFail={() => {
                    if (auth?.hasCompletedOnboarding === false) {
                      navigateTo(NAV_STEPS.MBTI_CONSENT);
                    } else {
                      closeAnalysis(NAV_STEPS.PROFILE);
                    }
                  }}
                />
              </View>
            )}
            {step === NAV_STEPS.PHOTO_AUTH && (
              <PhotoAuthExplainScreen
                key='photo-auth'
                onBack={history.length > 0 ? goBack : undefined}
                onNext={routePhotoAccess}
              />
            )}
          </OnboardingLayout>
        );

      case NAV_STEPS.TASTE_PROFILE:
        return (
          <MainLayout currentTab={NAV_TABS.PROFILE} onTabPress={handleTabPress}>
            <TasteProfileScreen
              onBack={goBack}
              tasteProfileId={activeTasteProfileId}
              onGenerateCourse={(destination) => {
                if (!isCurrentRoute()) return;
                auth?.setHasCompletedOnboarding?.(true);
                navigateTo(NAV_STEPS.CREATE_COURSE, destination);
              }}
              onReanalyze={reanalyzeTaste}
              onNavigateToIntro={() => navigateTo(NAV_STEPS.PHOTO)}
            />
          </MainLayout>
        );
      case NAV_STEPS.PROFILE:
        return (
          <MainLayout currentTab={NAV_TABS.PROFILE} onTabPress={handleTabPress}>
            <ProfileScreen
              onBack={() => navigateTo(NAV_STEPS.HOME)}
              onNavigateToTasteProfile={() => {
                if (auth?.hasCompletedOnboarding === false) {
                  navigateTo(NAV_STEPS.PHOTO);
                } else {
                  navigateTo(NAV_STEPS.TASTE_PROFILE);
                }
              }}
              onReanalyzeTaste={() => navigateTo(NAV_STEPS.PHOTO)}
              onNavigateToLogin={() => navigateTo(NAV_STEPS.LOGIN)}
              onEditProfile={() => navigateTo(NAV_STEPS.PROFILE_INPUT)}
            />
          </MainLayout>
        );
      case NAV_STEPS.PROFILE_INPUT:
        return (
          <MainLayout currentTab={NAV_TABS.PROFILE} onTabPress={handleTabPress}>
            <ProfileInputScreen
              onGoBack={() => returnTo(NAV_STEPS.PROFILE)}
              onSaveSuccess={() => returnTo(NAV_STEPS.PROFILE)}
            />
          </MainLayout>
        );
      case NAV_STEPS.COURSE_LIST:
        return (
          <MainLayout currentTab={NAV_TABS.EXPLORE} onTabPress={handleTabPress}>
            <CourseListScreen
              onDeleted={(courseId) => {
                if (selectedCourseId === courseId) setSelectedCourseId('');
              }}
              onBack={() => navigateTo(NAV_STEPS.HOME)}
              onSelectCourse={(courseId) => {
                setSelectedCourseId(courseId);
                navigateTo(NAV_STEPS.COURSE_DETAIL);
              }}
              onCreateCourse={() => {
                if (auth?.hasCompletedOnboarding === false) {
                  navigateTo(NAV_STEPS.PHOTO);
                } else {
                  navigateTo(NAV_STEPS.CREATE_COURSE);
                }
              }}
            />
          </MainLayout>
        );
      case NAV_STEPS.CREATE_COURSE:
        if (auth?.hasCompletedOnboarding === false) {
          return (
            <OnboardingLayout>
              <PhotoConsentScreen
                onBack={history.length > 0 ? goBack : undefined}
                onNext={routePhotoAccess}
              />
            </OnboardingLayout>
          );
        }
        return (
          <MainLayout currentTab={NAV_TABS.CREATE} onTabPress={handleTabPress}>
            <CourseCreateScreen
              mbti={selectedMbti}
              recommendedDestination={recommendedDestination}
              onBack={goBack}
              onPhoto={() => navigateTo(NAV_STEPS.PHOTO)}
              onSubmit={() => navigateTo(NAV_STEPS.GENERATING_COURSE)}
            />
          </MainLayout>
        );
      case NAV_STEPS.GENERATING_COURSE:
        return (
          <CourseGeneratingScreen
            onComplete={(courseId) => {
              if (!isCurrentRoute()) return;
              if (courseId) {
                setSelectedCourseId(courseId);
              }
              finishFlow(
                courseId ? NAV_STEPS.COURSE_DETAIL : NAV_STEPS.COURSE_LIST,
                [NAV_STEPS.CREATE_COURSE, NAV_STEPS.GENERATING_COURSE],
              );
            }}
            onReturnToCreate={() => returnTo(NAV_STEPS.CREATE_COURSE)}
            onReturnHome={() => {
              if (!isCurrentRoute()) return;
              navigateTo(NAV_STEPS.HOME);
              setShowCourseInterruptionNotice(true);
            }}
          />
        );
      case NAV_STEPS.COURSE_DETAIL:
        return (
          <MainLayout
            currentTab={NAV_TABS.EXPLORE}
            onTabPress={handleTabPress}
            noTopEdges={true}>
            <CourseDetailScreen
              key={selectedCourseId}
              onOpenBooking={openBooking}
              courseId={selectedCourseId || ''}
              initialViewState={
                detailViewState.current?.courseId === selectedCourseId
                  ? detailViewState.current.state
                  : undefined
              }
              onViewStateChange={(state) => {
                if (isCurrentRoute())
                  detailViewState.current = {
                    courseId: selectedCourseId,
                    state,
                  };
              }}
              onBack={goBack}
            />
          </MainLayout>
        );
      case NAV_STEPS.COURSE_SHARE:
        return (
          <CourseShareScreen
            shareToken={selectedShareToken}
            courseId={selectedShareToken ? undefined : selectedCourseId}
            onSaveSuccess={(acceptedCourseId) => {
              if (!isCurrentRoute()) return;
              setSelectedShareToken('');
              if (acceptedCourseId) setSelectedCourseId(acceptedCourseId);
              commitNavigation(
                acceptedCourseId
                  ? NAV_STEPS.COURSE_DETAIL
                  : NAV_STEPS.COURSE_LIST,
                [rootStep()],
              );
            }}
            onDecline={goBack}
            onNavigateToLogin={() => {
              if (!isCurrentRoute()) return;
              commitNavigation(NAV_STEPS.LOGIN, [NAV_STEPS.COURSE_SHARE]);
            }}
          />
        );

      case NAV_STEPS.HOME:
      default:
        return (
          <MainLayout
            currentTab={NAV_TABS.HOME}
            onTabPress={handleTabPress}
            noTopEdges={true}>
            <HomeScreen
              onOpenBooking={openBooking}
              selectedCourseId={selectedCourseId}
              onNavigateToCreate={() => {
                if (auth?.hasCompletedOnboarding === false) {
                  navigateTo(NAV_STEPS.PHOTO);
                } else {
                  navigateTo(NAV_STEPS.CREATE_COURSE);
                }
              }}
              onNavigateToExplore={() => navigateTo(NAV_STEPS.COURSE_LIST)}
              onNavigateToProfile={() => navigateTo(NAV_STEPS.PROFILE)}
              onNavigateToTasteProfile={() => {
                if (auth?.hasCompletedOnboarding === false) {
                  navigateTo(NAV_STEPS.PHOTO);
                } else {
                  navigateTo(NAV_STEPS.TASTE_PROFILE);
                }
              }}
              onNavigateToPhotoConsent={() => navigateTo(NAV_STEPS.PHOTO)}
              onSelectCourse={(courseId) => {
                setSelectedCourseId(courseId);
                navigateTo(NAV_STEPS.COURSE_DETAIL);
              }}
            />
          </MainLayout>
        );
    }
  };

  return (
    <View
      style={styles.container}
      testID='navigation-root-container'
      {...panResponder.panHandlers}>
      {renderCurrentScreen()}
      <InfoDialog
        visible={showCourseInterruptionNotice && step === NAV_STEPS.HOME}
        testID='course-interruption-notice'
        title={UI_STRINGS.COURSE_GENERATING.BACKGROUND_INTERRUPTED_TITLE}
        message={UI_STRINGS.COURSE_GENERATING.BACKGROUND_INTERRUPTED_MESSAGE}
        closeLabel={UI_STRINGS.COMMON.CONFIRM}
        onDismiss={() => setShowCourseInterruptionNotice(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hidden: { display: 'none' },
  container: {
    flex: 1,
  },
});

export default NavigationRoot;
