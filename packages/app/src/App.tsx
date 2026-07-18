import React, { useContext, useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, AuthContext } from './context/AuthContext';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import IntroScreen from './screens/IntroScreen';
import PhotoAnalysisScreen from './screens/PhotoAnalysisScreen';
import TasteAnalysisScreen from './screens/TasteAnalysisScreen';

function NavigationRoot() {
  const auth = useContext(AuthContext);
  const [step, setStep] = useState<'LOGIN' | 'INTRO' | 'PHOTO' | 'TASTE' | 'HOME'>(
    auth?.isAuthenticated ? 'HOME' : 'LOGIN'
  );

  useEffect(() => {
    if (auth?.isAuthenticated) {
      if (step === 'LOGIN') {
        setStep('HOME');
      }
    } else {
      setStep('LOGIN');
    }
  }, [auth?.isAuthenticated]);

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
          onFinish={() => setStep('HOME')}
          onFail={() => setStep('LOGIN')}
        />
      );
    case 'HOME':
    default:
      return <HomeScreen />;
  }
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationRoot />
        <StatusBar style="auto" />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
