/**
 * @file CourseSearchBar.tsx
 * @description Destination search input bar component for course list screen matching UI v2 design system.
 */
import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
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
        <Ionicons name="search" size={18} color="#99A1AB" style={styles.searchIcon} />
        <TextInput
          testID="search-input"
          style={styles.searchInput}
          placeholder={UI_STRINGS.COURSE_LIST?.SEARCH_PLACEHOLDER || '여행 코스 검색'}
          placeholderTextColor="#99A1AB"
          value={value}
          onChangeText={onChangeText}
        />
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
    backgroundColor: '#F0F2F5',
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
});
