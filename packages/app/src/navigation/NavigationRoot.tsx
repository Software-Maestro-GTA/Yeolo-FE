import React, { useContext, useEffect, useRef, useState } from 'react';
import { BackHandler, ToastAndroid, Platform, Linking } from 'react-native';
import type { ItineraryStop } from '@yeolo/common';
import { AuthContext } from '../context';
import { NavTab } from '../components/navigation';
import { MainLayout, OnboardingLayout } from '../layouts';
import { NAV_STEPS, NAV_TABS, NavStep } from '../constants';
import {
  LoginScreen,
  HomeScreen,
  CourseListScreen,
  IntroScreen,
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
  PlaceDetailScreen,
} from '../screens';

const NON_HISTORY_STEPS: NavStep[] = [
  NAV_STEPS.GENERATING_COURSE,
  NAV_STEPS.TASTE,
];

const MAX_HISTORY_LENGTH = 10;

export interface NavigationRootProps {
  initialStep?: NavStep;
  initialShareToken?: string;
}

export function NavigationRoot({
  initialStep,
  initialShareToken = '',
}: NavigationRootProps = {}) {
  const auth = useContext(AuthContext);
  const [activeTasteProfileId, setActiveTasteProfileId] = useState<
    string | undefined
  >();
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [selectedShareToken, setSelectedShareToken] =
    useState<string>(initialShareToken);
  const [selectedPlaceStop, setSelectedPlaceStop] = useState<
    ItineraryStop | undefined
  >();
  const [history, setHistory] = useState<NavStep[]>([]);
  const [step, setStep] = useState<NavStep | null>(initialStep || null);
  const lastBackPressRef = useRef<number>(0);

  const goBack = () => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory((old) => old.slice(0, -1));
      setStep(prev);
    } else {
      setStep(auth?.isAuthenticated ? NAV_STEPS.COURSE_LIST : NAV_STEPS.LOGIN);
    }
  };

  const navigateTo = (nextStep: NavStep) => {
    if (nextStep === NAV_STEPS.HOME || nextStep === NAV_STEPS.LOGIN) {
      setHistory([]);
    } else if (step && step !== nextStep && !NON_HISTORY_STEPS.includes(step)) {
      setHistory((prev) => [...prev.slice(-(MAX_HISTORY_LENGTH - 1)), step]);
    }
    setStep(nextStep);
  };

  useEffect(() => {
    const handleUrl = (url: string | null) => {
      if (!url) return;
      const match = /(?:invite|share-links)\/([a-zA-Z0-9_-]+)/.exec(url);
      if (match && match[1]) {
        setSelectedShareToken(match[1]);
        const fallbackStep = auth?.isAuthenticated
          ? NAV_STEPS.HOME
          : NAV_STEPS.LOGIN;
        setHistory((prev) => (prev.length === 0 ? [fallbackStep] : prev));
        setStep(NAV_STEPS.COURSE_SHARE);
      }
    };

    Linking.getInitialURL()
      .then(handleUrl)
      .catch(() => {});
    const subscription = Linking.addEventListener('url', (event) =>
      handleUrl(event.url),
    );
    return () => subscription.remove();
  }, [auth?.isAuthenticated]);

  useEffect(() => {
    if (!auth?.isLoading) {
      if (step === null) {
        if (auth?.isAuthenticated) {
          if (selectedShareToken) {
            setHistory([NAV_STEPS.HOME]);
            setStep(NAV_STEPS.COURSE_SHARE);
          } else if (auth?.hasCompletedOnboarding === false) {
            setStep(NAV_STEPS.INTRO);
          } else {
            setStep(NAV_STEPS.HOME);
          }
        } else {
          if (selectedShareToken) {
            setHistory([NAV_STEPS.LOGIN]);
            setStep(NAV_STEPS.COURSE_SHARE);
          } else {
            setStep(NAV_STEPS.LOGIN);
          }
        }
      }
    }
  }, [
    auth?.isAuthenticated,
    auth?.isLoading,
    auth?.hasCompletedOnboarding,
    selectedShareToken,
    step,
  ]);

  useEffect(() => {
    if (auth?.recentCourseId && !selectedCourseId) {
      setSelectedCourseId(auth.recentCourseId);
    }
  }, [auth?.recentCourseId, selectedCourseId]);

  useEffect(() => {
    const handleBackPress = () => {
      if (step === NAV_STEPS.GENERATING_COURSE || step === NAV_STEPS.TASTE) {
        if (Platform.OS === 'android') {
          ToastAndroid.show(
            '진행 중에는 이전으로 돌아갈 수 없습니다.',
            ToastAndroid.SHORT,
          );
        }
        return true;
      }

      if (
        step !== NAV_STEPS.HOME &&
        step !== NAV_STEPS.LOGIN &&
        history.length > 0
      ) {
        const prev = history[history.length - 1];
        setHistory((old) => old.slice(0, -1));
        setStep(prev);
        return true;
      }

      const now = Date.now();
      if (lastBackPressRef.current && now - lastBackPressRef.current < 2000) {
        BackHandler.exitApp();
        return true;
      }
      lastBackPressRef.current = now;
      if (Platform.OS === 'android') {
        ToastAndroid.show(
          '한 번 더 누르시면 앱이 종료됩니다.',
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
  }, [step, history]);

  if (step === null) {
    return null;
  }

  const handleTabPress = (tab: NavTab) => {
    if (tab === NAV_TABS.HOME) navigateTo(NAV_STEPS.HOME);
    if (tab === NAV_TABS.EXPLORE) navigateTo(NAV_STEPS.COURSE_LIST);
    if (tab === NAV_TABS.CREATE) {
      if (auth?.hasCompletedOnboarding === false) {
        navigateTo(NAV_STEPS.INTRO);
      } else {
        navigateTo(NAV_STEPS.CREATE_COURSE);
      }
    }
    if (tab === NAV_TABS.PROFILE) navigateTo(NAV_STEPS.PROFILE);
  };

  switch (step) {
    case NAV_STEPS.LOGIN:
      return (
        <LoginScreen
          onLoginSuccess={(doOnboarding) => {
            if (doOnboarding) {
              navigateTo(NAV_STEPS.INTRO);
            } else {
              navigateTo(NAV_STEPS.HOME);
            }
          }}
        />
      );
    case NAV_STEPS.INTRO:
      return (
        <OnboardingLayout>
          <IntroScreen onNext={() => navigateTo(NAV_STEPS.MBTI)} />
        </OnboardingLayout>
      );
    case NAV_STEPS.MBTI:
      return (
        <OnboardingLayout>
          <MbtiInputScreen
            onNext={() => {
              auth?.setHasCompletedOnboarding?.(true);
              navigateTo(NAV_STEPS.CREATE_COURSE);
            }}
            onDetailRecommend={() => navigateTo(NAV_STEPS.PHOTO)}
          />
        </OnboardingLayout>
      );
    case NAV_STEPS.PHOTO:
      return (
        <OnboardingLayout>
          <PhotoConsentScreen onNext={() => navigateTo(NAV_STEPS.TASTE)} />
        </OnboardingLayout>
      );
    case NAV_STEPS.TASTE:
      return (
        <OnboardingLayout>
          <TasteAnalysisScreen
            onFinish={(tasteProfileId) => {
              auth?.setHasCompletedOnboarding?.(true);
              setActiveTasteProfileId(tasteProfileId);
              navigateTo(NAV_STEPS.TASTE_PROFILE);
            }}
            onFail={() => navigateTo(NAV_STEPS.PHOTO)}
          />
        </OnboardingLayout>
      );
    case NAV_STEPS.TASTE_PROFILE:
      return (
        <MainLayout currentTab={NAV_TABS.PROFILE} onTabPress={handleTabPress}>
          <TasteProfileScreen
            tasteProfileId={activeTasteProfileId}
            onGenerateCourse={() => {
              auth?.setHasCompletedOnboarding?.(true);
              navigateTo(NAV_STEPS.CREATE_COURSE);
            }}
            onReanalyze={() => navigateTo(NAV_STEPS.TASTE)}
            onNavigateToIntro={() => navigateTo(NAV_STEPS.INTRO)}
          />
        </MainLayout>
      );
    case NAV_STEPS.PROFILE:
      return (
        <MainLayout currentTab={NAV_TABS.PROFILE} onTabPress={handleTabPress}>
          <ProfileScreen
            onNavigateToTasteProfile={() => {
              if (auth?.hasCompletedOnboarding === false) {
                navigateTo(NAV_STEPS.INTRO);
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
            onGoBack={() => navigateTo(NAV_STEPS.PROFILE)}
            onSaveSuccess={() => navigateTo(NAV_STEPS.PROFILE)}
          />
        </MainLayout>
      );
    case NAV_STEPS.COURSE_LIST:
      return (
        <MainLayout currentTab={NAV_TABS.EXPLORE} onTabPress={handleTabPress}>
          <CourseListScreen
            onSelectCourse={(courseId) => {
              setSelectedCourseId(courseId);
              navigateTo(NAV_STEPS.COURSE_DETAIL);
            }}
            onCreateCourse={() => {
              if (auth?.hasCompletedOnboarding === false) {
                navigateTo(NAV_STEPS.INTRO);
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
            <IntroScreen onNext={() => navigateTo(NAV_STEPS.MBTI)} />
          </OnboardingLayout>
        );
      }
      return (
        <MainLayout currentTab={NAV_TABS.CREATE} onTabPress={handleTabPress}>
          <CourseCreateScreen
            onSubmit={() => navigateTo(NAV_STEPS.GENERATING_COURSE)}
          />
        </MainLayout>
      );
    case NAV_STEPS.GENERATING_COURSE:
      return (
        <CourseGeneratingScreen
          onComplete={(courseId) => {
            if (courseId) {
              setSelectedCourseId(courseId);
            }
            navigateTo(NAV_STEPS.COURSE_DETAIL);
          }}
          onRetry={() => {
            navigateTo(NAV_STEPS.CREATE_COURSE);
          }}
          onNavigateToIntro={() => {
            navigateTo(NAV_STEPS.INTRO);
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
            courseId={selectedCourseId || ''}
            onSelectPlace={(stop) => {
              setSelectedPlaceStop(stop);
              navigateTo(NAV_STEPS.PLACE_DETAIL);
            }}
            onBack={goBack}
          />
        </MainLayout>
      );
    case NAV_STEPS.COURSE_SHARE:
      return (
        <CourseShareScreen
          shareToken={selectedShareToken}
          courseId={selectedCourseId}
          onSaveSuccess={(acceptedCourseId) => {
            if (acceptedCourseId) {
              setSelectedCourseId(acceptedCourseId);
            }
            setHistory([NAV_STEPS.HOME]);
            setStep(NAV_STEPS.COURSE_DETAIL);
          }}
          onDecline={() => {
            const fallback = auth?.isAuthenticated
              ? NAV_STEPS.HOME
              : NAV_STEPS.LOGIN;
            setHistory([]);
            setStep(fallback);
          }}
          onNavigateToLogin={() => {
            setHistory([NAV_STEPS.COURSE_SHARE]);
            setStep(NAV_STEPS.LOGIN);
          }}
        />
      );

    case NAV_STEPS.PLACE_DETAIL:
      return (
        <MainLayout
          currentTab={NAV_TABS.EXPLORE}
          onTabPress={handleTabPress}
          noTopEdges={true}>
          <PlaceDetailScreen stop={selectedPlaceStop} />
        </MainLayout>
      );
    case NAV_STEPS.HOME:
    default:
      return (
        <MainLayout
          currentTab={NAV_TABS.HOME}
          onTabPress={handleTabPress}
          noTopEdges={true}>
          <HomeScreen
            selectedCourseId={selectedCourseId}
            onNavigateToCreate={() => {
              if (auth?.hasCompletedOnboarding === false) {
                navigateTo(NAV_STEPS.INTRO);
              } else {
                navigateTo(NAV_STEPS.CREATE_COURSE);
              }
            }}
            onNavigateToExplore={() => navigateTo(NAV_STEPS.COURSE_LIST)}
            onNavigateToProfile={() => navigateTo(NAV_STEPS.PROFILE)}
            onNavigateToTasteProfile={() => {
              if (auth?.hasCompletedOnboarding === false) {
                navigateTo(NAV_STEPS.INTRO);
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
}

export default NavigationRoot;
