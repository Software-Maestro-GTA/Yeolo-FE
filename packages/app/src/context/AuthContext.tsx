/**
 * @file AuthContext.tsx
 * @description Authentication, session restoration, private query cleanup and confirmed GA4 auth milestones.
 */
import React, {
  createContext,
  useState,
  ReactNode,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQueryClient } from '@tanstack/react-query';
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
import { appAnalyticsTracker } from '../analytics/firebaseTracker';

import {
  useGoogleLoginMutation,
  useAppleLoginMutation,
  useLogoutMutation,
} from '../hooks/queries/useAuthMutations';

type OnboardingMethod = 'photo' | 'mbti';

export interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  recentCourseId?: string | null;
  hasCompletedOnboarding?: boolean | null;
  setRecentCourseId?: (id: string | null) => void;
  setHasCompletedOnboarding?: (
    completed: boolean,
    method?: OnboardingMethod,
  ) => Promise<void>;
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

// These endpoints return the same public data regardless of the signed-in user.
const PUBLIC_QUERY_KEYS = new Set([
  'destination-countries',
  'destination-cities',
  'destination-search',
  'shareLinkDetail',
]);

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined,
);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const queryClient = useQueryClient();
  const clearPrivateQueries = useCallback(() => {
    // Removing a query also cancels its retryer, so an old in-flight result
    // cannot repopulate the cache after another account signs in.
    queryClient.removeQueries({
      predicate: (query) => !PUBLIC_QUERY_KEYS.has(String(query.queryKey[0])),
    });
  }, [queryClient]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [recentCourseId, setRecentCourseId] = useState<string | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboardingState] = useState<
    boolean | null
  >(null);
  const onboardingStatus = useRef<boolean | null>(null);
  const analyticsUserId = useRef<string | null | undefined>(undefined);
  const pendingTutorialCompletion = useRef<{
    userId: string;
    method: OnboardingMethod | undefined;
  } | null>(null);

  const { mutateAsync: googleLogin, isPending: googleLoginPending } =
    useGoogleLoginMutation();
  const { mutateAsync: appleLogin, isPending: appleLoginPending } =
    useAppleLoginMutation();
  const { mutateAsync: logoutUser, isPending: logoutPending } =
    useLogoutMutation();

  const syncAnalyticsUserId = useCallback((id?: string | null) => {
    const normalizedId = id == null ? null : String(id);
    if (analyticsUserId.current === normalizedId) return;
    analyticsUserId.current = normalizedId;
    pendingTutorialCompletion.current = null;
    void analyticsService.setUserId(normalizedId);
  }, []);

  useLayoutEffect(() => {
    syncAnalyticsUserId(user?.userId);
  }, [syncAnalyticsUserId, user?.userId]);

  const setOnboardingStatus = useCallback((status: boolean | null) => {
    onboardingStatus.current = status;
    if (status !== true) pendingTutorialCompletion.current = null;
    setHasCompletedOnboardingState(status);
  }, []);

  const setHasCompletedOnboarding = useCallback(
    async (completed: boolean, method?: OnboardingMethod) => {
      const userId = analyticsUserId.current;
      if (completed && onboardingStatus.current === false && userId) {
        pendingTutorialCompletion.current = { userId, method };
      }
      const completion = completed ? pendingTutorialCompletion.current : null;
      setOnboardingStatus(completed);
      await AsyncStorage.setItem(
        'hasCompletedOnboarding',
        completed ? 'true' : 'false',
      );
      if (
        completion &&
        pendingTutorialCompletion.current === completion &&
        analyticsUserId.current === completion.userId
      ) {
        // Preserve the pending milestone on a failed write. The first
        // successful write consumes it, even when the user retries.
        pendingTutorialCompletion.current = null;
        void appAnalyticsTracker.logEvent(
          'tutorial_complete',
          completion.method ? { method: completion.method } : undefined,
        );
      }
    },
    [setOnboardingStatus],
  );

  useEffect(() => {
    clearPrivateQueries();
    setTokenGetter(async () => {
      const { accessToken, refreshToken } = Object.fromEntries(
        await AsyncStorage.multiGet(['accessToken', 'refreshToken']),
      );
      return { accessToken, refreshToken };
    });

    setTokenSetter(async (newAccessToken, newRefreshToken) => {
      await AsyncStorage.multiSet([
        ['accessToken', newAccessToken],
        ['refreshToken', newRefreshToken],
      ]);
    });

    setUnauthorizedHandler(async () => {
      await notifyUnauthorized();
    });

    const unsubscribe = onUnauthorized(() => {
      clearPrivateQueries();
      logger.info(
        '[AuthContext] Received 401 Unauthorized event. Resetting auth state...',
      );
      setIsAuthenticated(false);
      setUser(null);
      setRecentCourseId(null);
      setOnboardingStatus(null);
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
        } = Object.fromEntries(
          await AsyncStorage.multiGet(SESSION_STORAGE_KEYS),
        );

        if (savedRecentCourseId) {
          setRecentCourseId(savedRecentCourseId);
        }

        if (savedOnboarding !== null) {
          setOnboardingStatus(savedOnboarding === 'true');
        }

        if (token && refreshToken) {
          try {
            const newTokens = await refreshTokenApi(apiUrl, refreshToken);
            await AsyncStorage.multiSet([
              ['accessToken', newTokens.data.accessToken],
              ['refreshToken', newTokens.data.refreshToken],
            ]);
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
              await AsyncStorage.multiRemove([
                'recentCourseId',
                'hasCompletedOnboarding',
              ]);
              setIsAuthenticated(false);
              setUser(null);
              setRecentCourseId(null);
              setOnboardingStatus(null);
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
          setOnboardingStatus(null);
        }
      } catch (error) {
        logger.error('[AuthContext] 세션 복원 실패:', error);
        setIsAuthenticated(false);
        setUser(null);
        setRecentCourseId(null);
        setOnboardingStatus(null);
      } finally {
        setIsRestoring(false);
      }
    };

    restoreSession();

    return () => {
      unsubscribe();
    };
  }, [clearPrivateQueries, setOnboardingStatus]);

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
      clearPrivateQueries();
      try {
        const result = await googleLogin(code);
        clearPrivateQueries();
        syncAnalyticsUserId(result.user.userId);
        void appAnalyticsTracker.logEvent('login', { method: 'google' });
        setUser(result.user);
        setRecentCourseId(result.recentCourseId || null);
        setOnboardingStatus(!result.doOnboarding);
        setIsAuthenticated(true);
        logger.info('[AuthContext] Google login successful');
        return result;
      } catch (error) {
        clearPrivateQueries();
        logger.error('[AuthContext] Login flow API error:', error);
        await signOutGoogle();
        await clearLocalSession();
        setIsAuthenticated(false);
        setUser(null);
        setRecentCourseId(null);
        setOnboardingStatus(null);
        throw error;
      }
    },
    [
      googleLogin,
      clearPrivateQueries,
      setOnboardingStatus,
      syncAnalyticsUserId,
    ],
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
      clearPrivateQueries();
      try {
        const result = await appleLogin(payload);
        clearPrivateQueries();
        syncAnalyticsUserId(result.user.userId);
        void appAnalyticsTracker.logEvent('login', { method: 'apple' });
        setUser(result.user);
        setRecentCourseId(result.recentCourseId || null);
        setOnboardingStatus(!result.doOnboarding);
        setIsAuthenticated(true);
        logger.info('[AuthContext] Apple login successful');
        return result;
      } catch (error) {
        clearPrivateQueries();
        logger.error('[AuthContext] Apple login flow API error:', error);
        await clearLocalSession();
        setIsAuthenticated(false);
        setUser(null);
        setRecentCourseId(null);
        setOnboardingStatus(null);
        throw error;
      }
    },
    [appleLogin, clearPrivateQueries, setOnboardingStatus, syncAnalyticsUserId],
  );

  const logout = useCallback(async () => {
    logger.info('[AuthContext] Executing logout...');
    clearPrivateQueries();
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
      await AsyncStorage.multiRemove(SESSION_STORAGE_KEYS);
      clearPrivateQueries();
      setIsAuthenticated(false);
      setUser(null);
      setRecentCourseId(null);
      setOnboardingStatus(null);
      logger.info('[AuthContext] Local session cleanup finished');
    }
  }, [logoutUser, clearPrivateQueries, setOnboardingStatus]);

  const resetAuthState = useCallback(async () => {
    logger.info('[AuthContext] Resetting local auth state without API call...');
    clearPrivateQueries();
    await signOutGoogle();
    await AsyncStorage.multiRemove(SESSION_STORAGE_KEYS);
    clearPrivateQueries();
    setIsAuthenticated(false);
    setUser(null);
    setRecentCourseId(null);
    setOnboardingStatus(null);
  }, [clearPrivateQueries, setOnboardingStatus]);

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
