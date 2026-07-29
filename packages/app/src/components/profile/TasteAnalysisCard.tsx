import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { theme } from '../../theme';
import { UI_STRINGS } from '../../constants';

export interface TasteAnalysisCardProps {
  onNavigateToTasteProfile?: () => void;
}

export const TasteAnalysisCard: React.FC<TasteAnalysisCardProps> = ({
  onNavigateToTasteProfile,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.titleWithIcon}>
        <Ionicons name="sparkles" size={22} color={theme.colors.primary} />
        <Text style={styles.cardTitle}>{UI_STRINGS.COMPONENTS.TASTE_CARD_TITLE}</Text>
      </View>
      <Text style={styles.descriptionText}>
        AI가 분석한 나의 독창적인 여행 스타일과 성향 키워드를 확인해보세요!
      </Text>

      <TouchableOpacity
        style={styles.largeButton}
        onPress={onNavigateToTasteProfile}
        activeOpacity={0.8}
      >
        <Ionicons name="eye-outline" size={18} color={theme.colors.text.inverse} style={styles.buttonIcon} />
        <Text style={styles.largeButtonText}>{UI_STRINGS.COMPONENTS.TASTE_CARD_VIEW_BUTTON}</Text>
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
    marginBottom: 10,
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
  largeButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
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
