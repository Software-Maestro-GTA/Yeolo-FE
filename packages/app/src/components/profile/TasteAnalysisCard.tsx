/**
 * @file TasteAnalysisCard.tsx
 * @description Prominent card component displaying AI travel taste analysis banner with '취향 보기' and '취향 분석 요청' buttons.
 * @requirements REQ-11
 * @functional FUN-4
 * @author Antigravity Agent
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../theme';
import { UI_STRINGS } from '../../constants';

export interface TasteAnalysisCardProps {
  onStartAnalysis?: () => void;
  onNavigateToAnalysis?: () => void;
  onNavigateToTasteProfile?: () => void;
}

export const TasteAnalysisCard: React.FC<TasteAnalysisCardProps> = ({
  onStartAnalysis,
  onNavigateToAnalysis,
  onNavigateToTasteProfile,
}) => {
  const handleReAnalysisPress = onStartAnalysis || onNavigateToAnalysis;

  return (
    <View style={styles.card}>
      <View style={styles.titleWithIcon}>
        <Ionicons name="sparkles" size={22} color={theme.colors.primary} />
        <Text style={styles.cardTitle}>{UI_STRINGS.COMPONENTS.TASTE_CARD_TITLE}</Text>
      </View>

      <TouchableOpacity
        style={styles.viewButton}
        onPress={onNavigateToTasteProfile}
        activeOpacity={0.8}
      >
        <Ionicons name="eye-outline" size={18} color={theme.colors.primary} style={styles.buttonIcon} />
        <Text style={styles.viewButtonText}>{UI_STRINGS.COMPONENTS.TASTE_CARD_VIEW_BUTTON}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.largeButton}
        onPress={handleReAnalysisPress}
        activeOpacity={0.8}
      >
        <Ionicons name="refresh-outline" size={18} color={theme.colors.text.inverse} style={styles.buttonIcon} />
        <Text style={styles.largeButtonText}>{UI_STRINGS.COMPONENTS.TASTE_CARD_BUTTON}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.bg.card,
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text.primary,
  },
  descriptionText: {
    fontSize: 13,
    color: theme.colors.text.subtle,
    lineHeight: 20,
    marginBottom: 16,
  },
  viewButton: {
    backgroundColor: theme.colors.bg.card,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    marginBottom: 10,
  },
  viewButtonText: {
    color: theme.colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  largeButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonIcon: {
    marginRight: 6,
  },
  largeButtonText: {
    color: theme.colors.text.inverse,
    fontSize: 15,
    fontWeight: '600',
  },
});
