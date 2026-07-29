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
import { type User, logger } from '@yeolo/common';
import { initializeGoogleSignin, signOutGoogle, onUnauthorized, clearLocalSession } from '../services';

import { useGoogleLoginMutation, useLogoutMutation } from '../hooks/queries/useAuthMutations';

export interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  loginWithGoogle: (code: string) => Promise<{ user: User; isNewUser: boolean }>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  const googleLoginMutation = useGoogleLoginMutation();
  const logoutMutation = useLogoutMutation();

  useEffect(() => {
    const unsubscribe = onUnauthorized(() => {
      logger.info('[AuthContext] Received 401 Unauthorized event. Resetting auth state...');
      setIsAuthenticated(false);
      setUser(null);
    });

    const webClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
    const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
    initializeGoogleSignin(webClientId, iosClientId);

    const restoreSession = async () => {
      logger.info('[AuthContext] Restoring session...');
      try {
        const token = await AsyncStorage.getItem('accessToken');
        const savedUser = await AsyncStorage.getItem('user');
        if (token) {
          setIsAuthenticated(true);
          if (savedUser) {
            setUser(JSON.parse(savedUser));
          }
          logger.info('[AuthContext] Session restored successfully');
        }
      } catch (error) {
        console.error('세션 복원 실패:', error);
      } finally {
        setIsRestoring(false);
      }
    };

    restoreSession();

    return () => {
      unsubscribe();
    };
  }, []);

  const loginWithGoogle = async (code: string): Promise<{ user: User; isNewUser: boolean }> => {
    logger.info('[AuthContext] Executing loginWithGoogle...');
    try {
      const result = await googleLoginMutation.mutateAsync(code);
      setUser(result.user);
      setIsAuthenticated(true);
      logger.info('[AuthContext] Google login successful:', result.user);
      return result;
    } catch (error) {
      console.error('Login flow API error:', error);
      throw error;
    }
  };

  const logout = async () => {
    logger.info('[AuthContext] Executing logout...');
    try {
      await logoutMutation.mutateAsync();
      logger.info('[AuthContext] Logout API call completed');
    } catch (error) {
      logger.warn('[AuthContext] Logout API error encountered (e.g. token expired/invalid), continuing local session cleanup:', error);
    } finally {
      await signOutGoogle();
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('user');
      setIsAuthenticated(false);
      setUser(null);
      logger.info('[AuthContext] Local session cleanup finished');
    }
  };

  const isLoading = isRestoring || googleLoginMutation.isPending || logoutMutation.isPending;

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
