/**
 * @file AuthContext.tsx
 * @description Context provider for managing user authentication state, Google Sign-In, and automatic session restore.
 * @requirements REQ-11
 * @functional FUN-1
 * @api API-FB-1
 * @author Antigravity Agent
 */
import React, { createContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginWithGoogleApi } from '@yeolo/common';
import { initializeGoogleSignin, signOutGoogle } from '../services/authService';
import { AUTH_CONSTANTS } from '../constants/auth';

export interface AuthContextType {
  isAuthenticated: boolean;
  user: any;
  isLoading: boolean;
  loginWithGoogle: (code: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const webClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
    const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
    initializeGoogleSignin(webClientId, iosClientId);

    const restoreSession = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        if (token) {
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.warn('Failed to restore session token:', error);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const loginWithGoogle = async (code: string) => {
    setIsLoading(true);
    try {
      console.log('loginWithGoogle called with code:', code);
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || AUTH_CONSTANTS.DEFAULT_API_URL;
      const redirectUri = process.env.EXPO_PUBLIC_REDIRECT_URI || AUTH_CONSTANTS.DEFAULT_REDIRECT_URI;

      const response = await loginWithGoogleApi(apiUrl, { code, redirectUri });

      // Save tokens to AsyncStorage
      await AsyncStorage.setItem('accessToken', response.data.accessToken);
      await AsyncStorage.setItem('refreshToken', response.data.refreshToken);

      setUser(response.data.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Login flow API error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await signOutGoogle();
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      setIsAuthenticated(false);
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        user,
        isLoading,
        loginWithGoogle,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
