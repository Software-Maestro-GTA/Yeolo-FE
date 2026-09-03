/**
 * @file BudgetTypeSelector.tsx
 * @description Radio selection component for choosing budget and spending preference.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BudgetType } from '@yeolo/common';
import { theme } from '../../theme';
import { UI_STRINGS } from '../../constants';

export interface BudgetTypeSelectorProps {
  selectedType: BudgetType | null;
  onSelect: (type: BudgetType) => void;
}

export const BudgetTypeSelector: React.FC<BudgetTypeSelectorProps> = ({
  selectedType,
  onSelect,
}) => {
  return (
    <View style={styles.inputGroup}>
      <View style={styles.labelRow}>
        <Ionicons
          name='wallet-outline'
          size={16}
          color={theme.colors.primary}
        />
        <Text style={styles.label}>
          {UI_STRINGS.COURSE_CREATE.BUDGET_LABEL}
        </Text>
      </View>
      <View style={styles.radioGroup}>
        <TouchableOpacity
          testID='budget-cost_effective'
          activeOpacity={0.8}
          style={[
            styles.radioButton,
            selectedType === 'cost_effective' && styles.radioButtonActive,
          ]}
          onPress={() => onSelect('cost_effective')}>
          <Ionicons
            name='wallet-outline'
            size={18}
            color={
              selectedType === 'cost_effective'
                ? theme.colors.primary
                : theme.colors.text.subtle
            }
          />
          <Text
            style={[
              styles.radioText,
              selectedType === 'cost_effective' && styles.radioTextActive,
            ]}>
            {UI_STRINGS.COURSE_CREATE.BUDGET_COST_EFFECTIVE}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID='budget-moderate'
          activeOpacity={0.8}
          style={[
            styles.radioButton,
            selectedType === 'moderate' && styles.radioButtonActive,
          ]}
          onPress={() => onSelect('moderate')}>
          <Ionicons
            name='card-outline'
            size={18}
            color={
              selectedType === 'moderate'
                ? theme.colors.primary
                : theme.colors.text.subtle
            }
          />
          <Text
            style={[
              styles.radioText,
              selectedType === 'moderate' && styles.radioTextActive,
            ]}>
            {UI_STRINGS.COURSE_CREATE.BUDGET_STANDARD}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID='budget-luxury'
          activeOpacity={0.8}
          style={[
            styles.radioButton,
            selectedType === 'luxury' && styles.radioButtonActive,
          ]}
          onPress={() => onSelect('luxury')}>
          <Ionicons
            name='diamond-outline'
            size={18}
            color={
              selectedType === 'luxury'
                ? theme.colors.primary
                : theme.colors.text.subtle
            }
          />
          <Text
            style={[
              styles.radioText,
              selectedType === 'luxury' && styles.radioTextActive,
            ]}>
            {UI_STRINGS.COURSE_CREATE.BUDGET_LUXURY}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  inputGroup: {
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.text.secondary,
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  radioButton: {
    flex: 1,
    backgroundColor: theme.colors.bg.input,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 6,
  },
  radioButtonActive: {
    backgroundColor: theme.colors.primaryContainer,
    borderColor: theme.colors.border.active,
  },
  radioText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.subtle,
  },
  radioTextActive: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
});
