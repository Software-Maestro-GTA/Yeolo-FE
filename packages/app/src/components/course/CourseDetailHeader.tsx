/**
 * @file CourseDetailHeader.tsx
 * @description Edge-to-edge status bar translucent hero photo container header component.
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { palette, hexToRgba } from '../../theme/colors';
import { getDestinationImageUrl } from '../../services';

export interface CourseDetailHeaderProps {
  destinationCountry: string;
  destinationCity: string;
  startDate: string;
  title: string;
  totalCost?: number;
  heroImageUrl?: string;
  onBack?: () => void;
  onShare?: () => void;
}

export const CourseDetailHeader: React.FC<CourseDetailHeaderProps> = ({
  destinationCountry,
  destinationCity,
  startDate,
  title,
  heroImageUrl,
  onBack,
  onShare,
}) => {
  const activeHeroImageUrl =
    heroImageUrl || getDestinationImageUrl(destinationCountry, destinationCity);

  return (
    <View style={styles.heroSection} testID='course-detail-header'>
      <StatusBar
        barStyle='dark-content'
        backgroundColor={palette.transparent}
        translucent
      />
      {/* Background Image Container spanning into status bar */}
      <ImageBackground
        source={{ uri: activeHeroImageUrl }}
        style={styles.heroImageBackground}
        resizeMode='cover'>
        {/* Gradient Overlay */}
        <LinearGradient
          colors={[
            hexToRgba(palette.deepNavy, 0.6),
            hexToRgba(palette.deepNavy, 0.15),
            hexToRgba(palette.softMint, 0.65),
            hexToRgba(palette.softMint, 0.98),
          ]}
          locations={[0.5, 0.1, 0.9, 1]}
          style={styles.gradientOverlay}
        />

        {/* Top Nav Actions Bar (Back & Share buttons placed below status bar) */}
        <View style={styles.navActionsRow} testID='nav-actions'>
          <TouchableOpacity
            testID='btn-back'
            style={styles.actionCircleBtn}
            onPress={onBack}
            activeOpacity={0.8}>
            <Ionicons name='chevron-back' size={18} color={palette.deepNavy} />
          </TouchableOpacity>

          <TouchableOpacity
            testID='btn-share'
            style={styles.actionCircleBtn}
            onPress={onShare}
            activeOpacity={0.8}>
            <Ionicons name='share-outline' size={18} color={palette.deepNavy} />
          </TouchableOpacity>
        </View>

        {/* Title Content Group at the bottom of hero */}
        <View style={styles.headerContentGroup}>
          <Text style={styles.headerTitle}>
            {destinationCountry} {destinationCity}
          </Text>
          <Text style={styles.headerSubtitle}>
            {startDate ? `${startDate} · ` : ''}
            {title}
          </Text>
        </View>
      </ImageBackground>
    </View>
  );
};

const STATUS_BAR_HEIGHT =
  Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 44;

const styles = StyleSheet.create({
  heroSection: {
    width: '100%',
    height: 300,
    backgroundColor: palette.lightTeal,
    marginBottom: 4,
  },
  heroImageBackground: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: STATUS_BAR_HEIGHT + 8, // Extends hero image behind translucent status bar
    paddingBottom: 12,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFill,
  },
  navActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  actionCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: hexToRgba(palette.white, 0.85),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.deepNavy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  headerContentGroup: {
    gap: 4,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: palette.deepNavy,
    lineHeight: 32,
  },
  headerSubtitle: {
    fontSize: 14,
    color: palette.subText,
    fontWeight: '400',
    lineHeight: 20,
  },
});
