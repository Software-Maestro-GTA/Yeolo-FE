/**
 * @file CourseSearchBar.tsx
 * @description Destination search input bar component for course list screen matching UI v2 design system, complying with colors.ts palette and strings.ts UI_STRINGS.
 */
import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { palette } from '../../theme/colors';
import { UI_STRINGS } from '../../constants';

export interface CourseSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
}

export const CourseSearchBar: React.FC<CourseSearchBarProps> = ({
  value,
  onChangeText,
}) => {
  return (
    <View style={styles.searchRow}>
      <View style={styles.searchInputWrapper}>
        <Ionicons
          name='search'
          size={18}
          color={palette.mutedText}
          style={styles.searchIcon}
        />
        <TextInput
          testID='search-input'
          style={styles.searchInput}
          placeholder={UI_STRINGS.COURSE_LIST.SEARCH_PLACEHOLDER}
          placeholderTextColor={palette.mutedText}
          value={value}
          onChangeText={onChangeText}
        />
        {value.length > 0 && (
          <TouchableOpacity
            testID='clear-search-button'
            style={styles.clearButton}
            onPress={() => onChangeText('')}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name='close-circle' size={18} color={palette.mutedText} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInputWrapper: {
    flex: 1,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.gray100,
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: palette.deepNavy,
    padding: 0,
  },
  clearButton: {
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
