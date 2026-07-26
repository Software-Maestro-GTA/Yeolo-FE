/**
 * @file CourseCreateHeader.tsx
 * @description Header card component for AI course creation matching Yeolo UI v1.
 * @requirements REQ-7
 * @functional FUN-6
 * @author Antigravity Agent
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../theme';
import { UI_STRINGS } from '../../constants';

export const CourseCreateHeader: React.FC = () => {
  return (
    <View style={styles.headerCard}>
      <View style={styles.badge}>
        <Ionicons name="sparkles" size={14} color={theme.colors.primary} />
        <Text style={styles.badgeText}>{UI_STRINGS.COURSE_CREATE.BADGE_TEXT}</Text>
      </View>
      <Text style={styles.headerTitle}>{UI_STRINGS.COURSE_CREATE.HEADER_TITLE}</Text>
      <Text style={styles.headerSubtitle}>{UI_STRINGS.COURSE_CREATE.SUBTITLE}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  headerCard: {
    backgroundColor: theme.colors.bg.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primaryContainer,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    gap: 6,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text.primary,
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 13,
    color: theme.colors.text.subtle,
    lineHeight: 18,
  },
});
