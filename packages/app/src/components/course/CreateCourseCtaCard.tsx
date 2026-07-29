/**
 * @file CreateCourseCtaCard.tsx
 * @description Gradient CTA card for initiating AI course generation flow (FUN-7).
 * @requirements REQ-9
 * @functional FUN-7
 * @api N/A
 * @author Antigravity Agent
 */
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../theme';
import { UI_STRINGS } from '../../constants';

export interface CreateCourseCtaCardProps {
  onPress: () => void;
}

export function CreateCourseCtaCard({ onPress }: CreateCourseCtaCardProps) {
  return (
    <TouchableOpacity
      testID="create-course-cta-card"
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.container}
    >
      <LinearGradient
        colors={[theme.colors.primary, '#7c3aed', '#ec4899']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}
      >
        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>✨</Text>
          </View>
          <Text style={styles.titleText}>{UI_STRINGS.COMPONENTS.CTA_TITLE}</Text>
          <Text style={styles.subtitleText}>{UI_STRINGS.COMPONENTS.CTA_SUBTITLE}</Text>

          <View style={styles.actionButton}>
            <Text style={styles.actionButtonText}>{UI_STRINGS.COMPONENTS.CTA_BUTTON}</Text>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  gradientBackground: {
    padding: 20,
  },
  content: {
    alignItems: 'flex-start',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.bg.glass,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconText: {
    fontSize: 20,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text.inverse,
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: theme.colors.bg.card,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  actionButtonText: {
    color: theme.colors.primary,
    fontWeight: '800',
    fontSize: 13,
  },
});
