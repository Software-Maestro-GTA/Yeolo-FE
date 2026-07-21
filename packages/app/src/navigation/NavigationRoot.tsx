/**
 * @file NavigationRoot.tsx
 * @description Root navigation controller managing screen steps, authentication state, and layout wrappers with tasteProfileId data binding.
 * @requirements REQ-11
 * @functional FUN-4
 * @author Antigravity Agent
 */
import React, { useContext, useState, useEffect } from 'react';
import type { CourseCreateRequest } from '@yeolo/common';
import { AuthContext } from '../context/AuthContext';
import { NavTab } from '../components/navigation/BottomNavBar';
import MainLayout from '../layouts/MainLayout';

import LoginScreen from '../screens/LoginScreen';
import HomeScreen from '../screens/HomeScreen';
import IntroScreen from '../screens/IntroScreen';
import PhotoAnalysisScreen from '../screens/PhotoAnalysisScreen';
import TasteAnalysisScreen from '../screens/TasteAnalysisScreen';
import TasteProfileScreen from '../screens/TasteProfileScreen';
import CourseCreateScreen from '../screens/CourseCreateScreen';
import CourseGeneratingScreen from '../screens/CourseGeneratingScreen';

export function NavigationRoot() {
  const auth = useContext(AuthContext);
  const [pendingCourseRequest, setPendingCourseRequest] = useState<CourseCreateRequest | null>(null);
  const [activeTasteProfileId, setActiveTasteProfileId] = useState<string | undefined>();
  const [step, setStep] = useState<
    'LOGIN' | 'INTRO' | 'PHOTO' | 'TASTE' | 'PROFILE' | 'HOME' | 'CREATE_COURSE' | 'GENERATING_COURSE'
  >(auth?.isAuthenticated ? 'HOME' : 'LOGIN');

  useEffect(() => {
    if (!auth?.isLoading) {
      if (auth?.isAuthenticated) {
        setStep((prev) => (prev === 'LOGIN' ? 'HOME' : prev));
      } else {
        setStep('LOGIN');
      }
    }
  }, [auth?.isAuthenticated, auth?.isLoading]);

  const handleTabPress = (tab: NavTab) => {
    if (tab === 'home') setStep('HOME');
    if (tab === 'create') setStep('CREATE_COURSE');
    if (tab === 'profile') setStep('PROFILE');
  };

  if (auth?.isLoading) {
    return null;
  }

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
          <TasteProfileScreen
            tasteProfileId={activeTasteProfileId}
            onNavigateToAnalysis={() => setStep('TASTE')}
            onNavigateToLogin={() => setStep('LOGIN')}
            onGenerateCourse={() => setStep('CREATE_COURSE')}
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
          onComplete={(_courseId) => {
            setPendingCourseRequest(null);
            setStep('HOME');
          }}
          onRetry={() => {
            setStep('CREATE_COURSE');
          }}
        />
      );
    case 'HOME':
    default:
      return (
        <MainLayout currentTab="home" onTabPress={handleTabPress}>
          <HomeScreen />
        </MainLayout>
      );
  }
}

export default NavigationRoot;
