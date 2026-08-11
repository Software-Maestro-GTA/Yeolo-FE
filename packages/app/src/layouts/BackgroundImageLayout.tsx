/**
 * @file BackgroundImageLayout.tsx
 * @description Global shell layout component providing single top safe area inset for general screens, and optional full-bleed status bar space when noTopEdges is active.
 */
import React from 'react';
import {
  StyleSheet,
  View,
  ImageBackground,
  StyleProp,
  ViewStyle,
  ImageStyle,
  DimensionValue,
} from 'react-native';
import {
  SafeAreaView,
  NativeSafeAreaViewProps,
} from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useBackground } from '../context/BackgroundContext';
import { palette } from '../theme/colors';

export interface BackgroundImageLayoutProps {
  children: React.ReactNode;
  heroImageUrl?: string;
  heroImageStyle?: StyleProp<ImageStyle>;
  heroImageHeight?: DimensionValue;
  gradientColors?: readonly [string, string, ...string[]];
  gradientLocations?: readonly number[];
  gradientStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  safeAreaStyle?: StyleProp<ViewStyle>;
  noTopEdges?: boolean;
}

export const BackgroundImageLayout: React.FC<BackgroundImageLayoutProps> = ({
  children,
  heroImageUrl: propHeroImageUrl,
  heroImageStyle: propHeroImageStyle,
  heroImageHeight: propHeroImageHeight,
  gradientColors: propGradientColors,
  gradientLocations: propGradientLocations,
  gradientStyle: propGradientStyle,
  style,
  safeAreaStyle,
  noTopEdges: propNoTopEdges,
}) => {
  const context = useBackground();

  // Combine props and context state (props take precedence if provided)
  const activeHeroImageUrl = propHeroImageUrl || context.heroImageUrl;
  const activeHeroImageStyle = propHeroImageStyle || context.heroImageStyle;
  const activeHeroImageHeight =
    propHeroImageHeight || context.heroImageHeight || 320;
  const activeGradientColors = propGradientColors || context.gradientColors;
  const activeGradientLocations =
    propGradientLocations || context.gradientLocations;
  const activeGradientStyle = propGradientStyle || context.gradientStyle;
  const activeNoTopEdges = propNoTopEdges ?? context.noTopEdges ?? false;

  const safeAreaEdges: NativeSafeAreaViewProps['edges'] = activeNoTopEdges
    ? ['left', 'right']
    : ['top', 'left', 'right'];

  return (
    <View style={[styles.container, style]}>
      {/* 1. Top n% Background Image & Optional LinearGradient Overlay layer */}
      {activeHeroImageUrl ? (
        <View
          style={[styles.topHeroWrapper, { height: activeHeroImageHeight }]}>
          <ImageBackground
            source={{ uri: activeHeroImageUrl }}
            style={[StyleSheet.absoluteFill, activeHeroImageStyle]}
            resizeMode='cover'
          />
          {activeGradientColors ? (
            <LinearGradient
              colors={activeGradientColors}
              locations={activeGradientLocations as any}
              style={[StyleSheet.absoluteFill, activeGradientStyle]}
            />
          ) : null}
        </View>
      ) : null}

      {/* 2. Content Area with screen-appropriate safe area edges */}
      <SafeAreaView
        style={[styles.safeAreaContainer, safeAreaStyle]}
        edges={safeAreaEdges}>
        {children}
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: palette.softMint,
  },
  topHeroWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    overflow: 'hidden',
  },
  safeAreaContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});
