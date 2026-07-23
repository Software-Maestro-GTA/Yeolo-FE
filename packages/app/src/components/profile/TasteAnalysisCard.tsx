/**
 * @file TasteAnalysisCard.tsx
 * @description Prominent card component displaying AI travel taste analysis banner and large trigger button matching Figma UI specifications.
 * @requirements REQ-11
 * @functional FUN-4
 * @author Antigravity Agent
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface TasteAnalysisCardProps {
  onNavigateToAnalysis?: () => void;
}

export const TasteAnalysisCard: React.FC<TasteAnalysisCardProps> = ({
  onNavigateToAnalysis,
}) => {
  return (
    <View style={styles.card}>
      <View style={styles.titleWithIcon}>
        <Ionicons name="sparkles" size={22} color="#4648D4" />
        <Text style={styles.cardTitle}>AI 여행 취향 분석</Text>
      </View>

      <TouchableOpacity
        style={styles.largeButton}
        onPress={onNavigateToAnalysis}
        activeOpacity={0.8}
      >
        <Ionicons name="refresh-outline" size={18} color="#FFFFFF" style={styles.buttonIcon} />
        <Text style={styles.largeButtonText}>취향 분석 요청</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#030612',
  },
  descriptionText: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 16,
  },
  largeButton: {
    backgroundColor: '#4648D4',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    width: '100%',
    shadowColor: '#4648D4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  buttonIcon: {
    marginRight: 6,
  },
  largeButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default TasteAnalysisCard;
