/**
 * @file CreateCourseCtaCard.tsx
 * @description Gradient CTA card component for initiating AI course generation flow.
 */
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { palette } from '../../theme/colors';

export interface CreateCourseCtaCardProps {
  onPress: () => void;
}

export function CreateCourseCtaCard({ onPress }: CreateCourseCtaCardProps) {
  return (
    <TouchableOpacity
      testID='create-course-cta-card'
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.container}>
      <LinearGradient
        colors={[palette.primary, '#7c3aed', palette.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradientBackground}>
        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconText}>✨</Text>
          </View>
          <Text style={styles.titleText}>AI와 함께 여로를 만들어보세요</Text>
          <Text style={styles.subtitleText}>
            취향과 관심사에 딱 맞는 1:1 맞춤형 추천
          </Text>

          <View style={styles.actionButton}>
            <Text style={styles.actionButtonText}>새 코스 생성하기</Text>
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
    shadowColor: palette.primary,
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
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
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
    color: palette.white,
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: palette.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  actionButtonText: {
    color: palette.primary,
    fontWeight: '800',
    fontSize: 13,
  },
});
