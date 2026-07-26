/**
 * @file NavigationRoot.tsx
 * @description Root navigation controller managing screen steps, authentication state, and layout wrappers.
 * @requirements REQ-11, REQ-9
 * @functional FUN-4, FUN-3, FUN-7
 * @author Antigravity Agent
 */
import React, { useContext, useEffect, useState } from 'react';
import type { CourseCreateRequest } from '@yeolo/common';
import { AuthContext } from '../context';
import { NavTab } from '../components/navigation';
import { MainLayout } from '../layouts';
import {
  LoginScreen,
  HomeScreen,
  CourseListScreen,
  IntroScreen,
  PhotoAnalysisScreen,
  TasteAnalysisScreen,
  ProfileScreen,
  CourseCreateScreen,
  CourseGeneratingScreen,
  CourseDetailScreen,
} from '../screens';

export function NavigationRoot() {
  const auth = useContext(AuthContext);
  const [pendingCourseRequest, setPendingCourseRequest] = useState<CourseCreateRequest | null>(null);
  const [activeTasteProfileId, setActiveTasteProfileId] = useState<string | undefined>();
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');

  const [step, setStep] = useState<
    'LOGIN' | 'INTRO' | 'PHOTO' | 'TASTE' | 'PROFILE' | 'HOME' | 'COURSE_LIST' | 'CREATE_COURSE' | 'GENERATING_COURSE' | 'COURSE_DETAIL' | null
  >(null);

  useEffect(() => {
    if (!auth?.isLoading) {
      if (auth?.isAuthenticated) {
        setStep((prev) => (prev === null || prev === 'LOGIN' ? 'HOME' : prev));
      } else {
        setStep('LOGIN');
      }
    }
  }, [auth?.isAuthenticated, auth?.isLoading]);

  if (auth?.isLoading || step === null) {
    return null;
  }

  const handleTabPress = (tab: NavTab) => {
    if (tab === 'home') setStep('HOME');
    if (tab === 'explore') setStep('COURSE_LIST');
    if (tab === 'create') setStep('CREATE_COURSE');
    if (tab === 'profile') setStep('PROFILE');
  };

  switch (step) {
    case 'LOGIN':
      return <LoginScreen />;
    case 'INTRO':
      return <IntroScreen onNext={() => setStep('PHOTO')} />;
    case 'PHOTO':
      return <PhotoAnalysisScreen onNext={() => setStep('TASTE')} />;
    case 'TASTE':
      return (
        <TasteAnalysisScreen
          onFinish={(tasteProfileId) => {
            setActiveTasteProfileId(tasteProfileId);
            setStep('PROFILE');
          }}
          onFail={() => setStep('LOGIN')}
        />
      );
    case 'PROFILE':
      return (
        <MainLayout currentTab="profile" onTabPress={handleTabPress}>
          <ProfileScreen
            onNavigateToAnalysis={() => setStep('TASTE')}
            onNavigateToLogin={() => setStep('LOGIN')}
          />
        </MainLayout>
      );
    case 'COURSE_LIST':
      return (
        <MainLayout currentTab="explore" onTabPress={handleTabPress}>
          <CourseListScreen
            onSelectCourse={(courseId) => {
              setSelectedCourseId(courseId);
              setStep('COURSE_DETAIL');
            }}
            onCreateCourse={() => setStep('CREATE_COURSE')}
          />
        </MainLayout>
      );
    case 'CREATE_COURSE':
      return (
        <MainLayout currentTab="create" onTabPress={handleTabPress}>
          <CourseCreateScreen
            onSubmit={(formData) => {
              setPendingCourseRequest(formData);
              setStep('GENERATING_COURSE');
            }}
          />
        </MainLayout>
      );
    case 'GENERATING_COURSE':
      return (
        <CourseGeneratingScreen
          requestData={pendingCourseRequest}
          onComplete={(courseId) => {
            setPendingCourseRequest(null);
            if (courseId) {
              setSelectedCourseId(courseId);
            }
            setStep('COURSE_DETAIL');
          }}
          onRetry={() => {
            setStep('CREATE_COURSE');
          }}
        />
      );
    case 'COURSE_DETAIL':
      return (
        <CourseDetailScreen
          courseId={selectedCourseId}
          onBack={() => setStep('COURSE_LIST')}
          onTabPress={handleTabPress}
        />
      );
    case 'HOME':
    default:
      return (
        <MainLayout currentTab="home" onTabPress={handleTabPress}>
          <HomeScreen
            onNavigateToCreate={() => setStep('CREATE_COURSE')}
            onNavigateToExplore={() => setStep('COURSE_LIST')}
            onNavigateToProfile={() => setStep('PROFILE')}
          />
        </MainLayout>
      );
  }
}

export default NavigationRoot;
