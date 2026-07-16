import React, { useContext } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, AuthContext } from './context/AuthContext';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';

function NavigationRoot() {
  const auth = useContext(AuthContext);

  if (auth?.isAuthenticated) {
    return <HomeScreen />;
  }

  return <LoginScreen />;
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationRoot />
      <StatusBar style="auto" />
    </AuthProvider>
  );
}
