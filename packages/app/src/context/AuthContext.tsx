/**
 * @file AuthContext.tsx
 * @description Context provider for managing user authentication state, Google/Apple Sign-In, and automatic session restore.
 */
import React, {
  createContext,
  useState,
  ReactNode,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  type User,
  analyticsService,
  logger,
  setTokenGetter,
  setTokenSetter,
  setUnauthorizedHandler,
  refreshTokenApi,
} from '@yeolo/common';
import {
  initializeGoogleSignin,
  signOutGoogle,
  onUnauthorized,
  notifyUnauthorized,
  clearLocalSession,
} from '../services';
import { APP_CONFIG } from '../constants';

import {
  useGoogleLoginMutation,
  useAppleLoginMutation,
  useLogoutMutation,
} from '../hooks/queries/useAuthMutations';

export interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  recentCourseId?: string | null;
  hasCompletedOnboarding?: boolean | null;
  setRecentCourseId?: (id: string | null) => void;
  setHasCompletedOnboarding?: (completed: boolean) => Promise<void>;
  loginWithGoogle: (code: string) => Promise<{
    user: User;
    isNewUser: boolean;
    doOnboarding: boolean;
    recentCourseId?: string | null;
  }>;
  loginWithApple: (payload: {
    code: string;
    idToken?: string | null;
  }) => Promise<{
    user: User;
    isNewUser: boolean;
    doOnboarding: boolean;
    recentCourseId?: string | null;
  }>;
  logout: () => void;
  resetAuthState?: () => Promise<void>;
  updateUser?: (updatedFields: Partial<User>) => void;
}

const SESSION_STORAGE_KEYS = [
  'accessToken',
  'refreshToken',
  'user',
  'recentCourseId',
  'hasCompletedOnboarding',
];

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [recentCourseId, setRecentCourseId] = useState<string | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboardingState] = useState<
    boolean | null
  >(null);

  const { mutateAsync: googleLogin, isPending: googleLoginPending } =
    useGoogleLoginMutation();
  const { mutateAsync: appleLogin, isPending: appleLoginPending } =
    useAppleLoginMutation();
  const { mutateAsync: logoutUser, isPending: logoutPending } =
    useLogoutMutation();

  useEffect(() => {
    void analyticsService.setUserId(
      user?.userId === undefined || user?.userId === null
        ? null
        : String(user.userId),
    );
  }, [user?.userId]);

  const setHasCompletedOnboarding = useCallback(async (completed: boolean) => {
    setHasCompletedOnboardingState(completed);
    await AsyncStorage.setItem(
      'hasCompletedOnboarding',
      completed ? 'true' : 'false',
    );
  }, []);

  useEffect(() => {
    setTokenGetter(async () => {
      const { accessToken, refreshToken } = await AsyncStorage.getMany([
        'accessToken',
        'refreshToken',
      ]);
      return { accessToken, refreshToken };
    });

    setTokenSetter(async (newAccessToken, newRefreshToken) => {
      await AsyncStorage.setMany({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    });

    setUnauthorizedHandler(async () => {
      await notifyUnauthorized();
    });

    const unsubscribe = onUnauthorized(() => {
      logger.info(
        '[AuthContext] Received 401 Unauthorized event. Resetting auth state...',
      );
      setIsAuthenticated(false);
      setUser(null);
      setRecentCourseId(null);
      setHasCompletedOnboardingState(null);
    });

    const webClientId = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID;
    const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
    initializeGoogleSignin(webClientId, iosClientId);

    const restoreSession = async () => {
      logger.info('[AuthContext] Restoring and validating session...');
      const apiUrl =
        process.env.EXPO_PUBLIC_API_URL || APP_CONFIG.DEFAULT_API_URL;
      try {
        const {
          accessToken: token,
          refreshToken,
          user: savedUser,
          recentCourseId: savedRecentCourseId,
          hasCompletedOnboarding: savedOnboarding,
        } = await AsyncStorage.getMany(SESSION_STORAGE_KEYS);

        if (savedRecentCourseId) {
          setRecentCourseId(savedRecentCourseId);
        }

        if (savedOnboarding !== null) {
          setHasCompletedOnboardingState(savedOnboarding === 'true');
        }

        if (token && refreshToken) {
          try {
            const newTokens = await refreshTokenApi(apiUrl, refreshToken);
            await AsyncStorage.setMany({
              accessToken: newTokens.data.accessToken,
              refreshToken: newTokens.data.refreshToken,
            });
            setIsAuthenticated(true);
            if (savedUser) {
              setUser(JSON.parse(savedUser));
            }
            logger.info(
              '[AuthContext] Session refreshed and validated successfully on startup',
            );
          } catch (refreshErr: any) {
            const status = refreshErr?.status;
            if (status === 401 || status === 403) {
              logger.warn(
                '[AuthContext] Refresh token expired or invalid on startup. Resetting local session:',
                refreshErr,
              );
              await clearLocalSession();
              await AsyncStorage.removeMany([
                'recentCourseId',
                'hasCompletedOnboarding',
              ]);
              setIsAuthenticated(false);
              setUser(null);
              setRecentCourseId(null);
              setHasCompletedOnboardingState(null);
            } else {
              logger.warn(
                `[AuthContext] Refresh API returned status ${status || 'network error'}, falling back to existing token session:`,
                refreshErr?.message || refreshErr,
              );
              setIsAuthenticated(true);
              if (savedUser) {
                setUser(JSON.parse(savedUser));
              }
            }
          }
        } else if (token) {
          setIsAuthenticated(true);
          if (savedUser) {
            setUser(JSON.parse(savedUser));
          }
          logger.info('[AuthContext] Session restored with existing token');
        } else {
          setIsAuthenticated(false);
          setUser(null);
          setRecentCourseId(null);
          setHasCompletedOnboardingState(null);
        }
      } catch (error) {
        logger.error('[AuthContext] 세션 복원 실패:', error);
        setIsAuthenticated(false);
        setUser(null);
        setRecentCourseId(null);
        setHasCompletedOnboardingState(null);
      } finally {
        setIsRestoring(false);
      }
    };

    restoreSession();

    return () => {
      unsubscribe();
    };
  }, []);

  const loginWithGoogle = useCallback(
    async (
      code: string,
    ): Promise<{
      user: User;
      isNewUser: boolean;
      doOnboarding: boolean;
      recentCourseId?: string | null;
    }> => {
      logger.info('[AuthContext] Executing loginWithGoogle...');
      try {
        const result = await googleLogin(code);
        setUser(result.user);
        setRecentCourseId(result.recentCourseId || null);
        setHasCompletedOnboardingState(!result.doOnboarding);
        setIsAuthenticated(true);
        logger.info('[AuthContext] Google login successful:', {
          userId: result.user.userId,
          email: result.user.email,
          doOnboarding: result.doOnboarding,
          hasCompletedOnboarding: !result.doOnboarding,
          recentCourseId: result.recentCourseId,
          isNewUser: result.isNewUser,
        });
        return result;
      } catch (error) {
        logger.error('[AuthContext] Login flow API error:', error);
        await signOutGoogle();
        await clearLocalSession();
        setIsAuthenticated(false);
        setUser(null);
        setRecentCourseId(null);
        setHasCompletedOnboardingState(null);
        throw error;
      }
    },
    [googleLogin],
  );

  const loginWithApple = useCallback(
    async (payload: {
      code: string;
      idToken?: string | null;
    }): Promise<{
      user: User;
      isNewUser: boolean;
      doOnboarding: boolean;
      recentCourseId?: string | null;
    }> => {
      logger.info('[AuthContext] Executing loginWithApple...');
      try {
        const result = await appleLogin(payload);
        setUser(result.user);
        setRecentCourseId(result.recentCourseId || null);
        setHasCompletedOnboardingState(!result.doOnboarding);
        setIsAuthenticated(true);
        logger.info('[AuthContext] Apple login successful:', {
          userId: result.user.userId,
          email: result.user.email,
          doOnboarding: result.doOnboarding,
          hasCompletedOnboarding: !result.doOnboarding,
          recentCourseId: result.recentCourseId,
          isNewUser: result.isNewUser,
        });
        return result;
      } catch (error) {
        logger.error('[AuthContext] Apple login flow API error:', error);
        await clearLocalSession();
        setIsAuthenticated(false);
        setUser(null);
        setRecentCourseId(null);
        setHasCompletedOnboardingState(null);
        throw error;
      }
    },
    [appleLogin],
  );

  const logout = useCallback(async () => {
    logger.info('[AuthContext] Executing logout...');
    try {
      await logoutUser();
      logger.info('[AuthContext] Logout API call completed');
    } catch (error) {
      logger.warn(
        '[AuthContext] Logout API error encountered (e.g. token expired/invalid), continuing local session cleanup:',
        error,
      );
    } finally {
      await signOutGoogle();
      await AsyncStorage.removeMany(SESSION_STORAGE_KEYS);
      setIsAuthenticated(false);
      setUser(null);
      setRecentCourseId(null);
      setHasCompletedOnboardingState(null);
      logger.info('[AuthContext] Local session cleanup finished');
    }
  }, [logoutUser]);

  const resetAuthState = useCallback(async () => {
    logger.info('[AuthContext] Resetting local auth state without API call...');
    await signOutGoogle();
    await AsyncStorage.removeMany(SESSION_STORAGE_KEYS);
    setIsAuthenticated(false);
    setUser(null);
    setRecentCourseId(null);
    setHasCompletedOnboardingState(null);
  }, []);

  const updateUser = useCallback((updatedFields: Partial<User>) => {
    setUser((prevUser) =>
      prevUser ? { ...prevUser, ...updatedFields } : null,
    );
  }, []);

  const isLoading =
    isRestoring || googleLoginPending || appleLoginPending || logoutPending;

  const contextValue = useMemo<AuthContextType>(
    () => ({
      isAuthenticated,
      user,
      isLoading,
      recentCourseId,
      hasCompletedOnboarding,
      setRecentCourseId,
      setHasCompletedOnboarding,
      loginWithGoogle,
      loginWithApple,
      logout,
      resetAuthState,
      updateUser,
    }),
    [
      isAuthenticated,
      user,
      isLoading,
      recentCourseId,
      hasCompletedOnboarding,
      setHasCompletedOnboarding,
      loginWithGoogle,
      loginWithApple,
      logout,
      resetAuthState,
      updateUser,
    ],
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};
