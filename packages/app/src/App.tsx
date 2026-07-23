/**
 * @file App.tsx
 * @description Main mobile application root component initializing providers and navigation.
 * @requirements REQ-11
 * @functional FUN-1
 * @author Antigravity Agent
 */
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './context/AuthContext';
import NavigationRoot from './navigation/NavigationRoot';

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
