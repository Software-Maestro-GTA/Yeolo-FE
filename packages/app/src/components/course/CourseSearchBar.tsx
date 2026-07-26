/**
 * @file CourseSearchBar.tsx
 * @description Destination search input bar component for course list screen.
 * @requirements REQ-9
 * @functional FUN-7
 * @author Antigravity Agent
 */
import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { theme } from '../../theme';
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
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          testID="search-input"
          style={styles.searchInput}
          placeholder={UI_STRINGS.COURSE_LIST.SEARCH_PLACEHOLDER}
          placeholderTextColor={theme.colors.text.placeholder}
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bg.card,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
  },
  searchIcon: {
    marginRight: 8,
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.text.primary,
    padding: 0,
  },
});
