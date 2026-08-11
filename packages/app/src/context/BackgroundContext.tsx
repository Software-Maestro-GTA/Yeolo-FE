/**
 * @file BackgroundContext.tsx
 * @description Global context providing background image, gradient customization, and noTopEdges safe area control for screens across the app with automatic cleanup.
 */
import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
} from 'react';
import { StyleProp, ImageStyle, ViewStyle, DimensionValue } from 'react-native';

export interface BackgroundConfig {
  heroImageUrl?: string | null;
  heroImageStyle?: StyleProp<ImageStyle>;
  heroImageHeight?: DimensionValue;
  gradientColors?: readonly [string, string, ...string[]];
  gradientLocations?: readonly number[];
  gradientStyle?: StyleProp<ViewStyle>;
  noTopEdges?: boolean;
}

export interface BackgroundContextType {
  heroImageUrl: string | null;
  heroImageStyle?: StyleProp<ImageStyle>;
  heroImageHeight?: DimensionValue;
  gradientColors?: readonly [string, string, ...string[]];
  gradientLocations?: readonly number[];
  gradientStyle?: StyleProp<ViewStyle>;
  noTopEdges?: boolean;
  setBackground: (config: BackgroundConfig) => void;
  resetBackground: () => void;
}

const defaultBackgroundContext: BackgroundContextType = {
  heroImageUrl: null,
  noTopEdges: false,
  setBackground: () => {},
  resetBackground: () => {},
};

export const BackgroundContext = createContext<BackgroundContextType>(
  defaultBackgroundContext,
);

export const BackgroundProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [bgConfig, setBgConfig] = useState<BackgroundConfig>({
    heroImageUrl: null,
    noTopEdges: false,
  });

  const setBackground = useCallback((config: BackgroundConfig) => {
    setBgConfig(config);
  }, []);

  const resetBackground = useCallback(() => {
    setBgConfig({ heroImageUrl: null, noTopEdges: false });
  }, []);

  const contextValue = useMemo(
    () => ({
      heroImageUrl: bgConfig.heroImageUrl ?? null,
      heroImageStyle: bgConfig.heroImageStyle,
      heroImageHeight: bgConfig.heroImageHeight,
      gradientColors: bgConfig.gradientColors,
      gradientLocations: bgConfig.gradientLocations,
      gradientStyle: bgConfig.gradientStyle,
      noTopEdges: bgConfig.noTopEdges ?? false,
      setBackground,
      resetBackground,
    }),
    [bgConfig, setBackground, resetBackground],
  );

  return (
    <BackgroundContext.Provider value={contextValue}>
      {children}
    </BackgroundContext.Provider>
  );
};

export const useBackground = (): BackgroundContextType => {
  return useContext(BackgroundContext);
};
