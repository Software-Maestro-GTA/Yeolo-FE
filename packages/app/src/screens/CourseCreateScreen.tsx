/**
 * @file CourseCreateScreen.tsx
 * @description Screen for entering travel conditions with custom useCourseCreateForm hook and modularized subcomponents.
 * @requirements REQ-7, REQ-22
 * @functional FUN-6, FUN-GA4
 * @api API-FB-4
 * @author Antigravity Agent
 */
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { CourseCreateRequest } from '@yeolo/common';
import {
  GenerateCourseButton,
  InlineCalendarView,
} from '../components/common';
import {
  CourseCreateHeader,
  BudgetTypeSelector,
} from '../components/course';
import { useCourseCreateForm, useGA4ScreenTracking, useGA4ButtonClick } from '../hooks';
import type { NavTab } from '../components/navigation';
import { theme } from '../theme';
import { UI_STRINGS } from '../constants';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCourseStore, DEFAULT_API_URL } from '@yeolo/common';

export interface CourseCreateScreenProps {
  onSubmit?: (data: CourseCreateRequest) => void;
  onTabPress?: (tab: NavTab) => void;
}

export const CourseCreateScreen: React.FC<CourseCreateScreenProps> = ({
  onSubmit,
}) => {
  useGA4ScreenTracking('CourseCreateScreen');
  const { trackButtonClick } = useGA4ButtonClick();

  const {
    destinationCountry,
    setDestinationCountry,
    destinationCity,
    setDestinationCity,
    startDate,
    endDate,
    budgetType,
    setBudgetType,
    isCalendarOpen,
    setIsCalendarOpen,
    activeDateTarget,
    currentYearMonth,
    scrollViewRef,
    handleStartDateChange,
    handleEndDateChange,
    openCalendarForTarget,
    handlePrevMonth,
    handleNextMonth,
    handleSelectDay,
    isStartDateValid,
    isEndDateValid,
    isFormValid,
    handleSubmit,
  } = useCourseCreateForm(async (data) => {
    trackButtonClick('btn_submit_course_create', 'Submit Course Create Form', {
      country: data.destinationCountry,
      city: data.destinationCity,
      budgetType: data.budgetType,
    });
    try {
      const token = (await AsyncStorage.getItem('accessToken')) || '';
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL;
      useCourseStore.getState().createCourse(apiUrl, data, token);
    } catch (err) {
      console.error('Failed to trigger createCourse store action:', err);
    }
    onSubmit?.(data);
  });

  return (
    <View style={styles.screenContainer}>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header Component */}
        <CourseCreateHeader />

        {/* Input Form Section Card */}
        <View style={styles.formCard}>
          {/* Destination Section (Country & City arranged horizontally) */}
          <View style={styles.destinationRow}>
            {/* Country Input Group */}
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <View style={styles.labelRow}>
                <Ionicons name="earth-outline" size={16} color={theme.colors.primary} />
                <Text style={styles.label}>{UI_STRINGS.COURSE_CREATE.COUNTRY_LABEL}</Text>
              </View>
              <TextInput
                testID="input-country"
                style={styles.input}
                placeholder={UI_STRINGS.COURSE_CREATE.COUNTRY_PLACEHOLDER}
                value={destinationCountry}
                onChangeText={setDestinationCountry}
                placeholderTextColor={theme.colors.text.placeholder}
              />
            </View>

            {/* City Input Group */}
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <View style={styles.labelRow}>
                <Ionicons name="location-outline" size={16} color={theme.colors.primary} />
                <Text style={styles.label}>{UI_STRINGS.COURSE_CREATE.CITY_LABEL}</Text>
              </View>
              <TextInput
                testID="input-city"
                style={styles.input}
                placeholder={UI_STRINGS.COURSE_CREATE.CITY_PLACEHOLDER}
                value={destinationCity}
                onChangeText={setDestinationCity}
                placeholderTextColor={theme.colors.text.placeholder}
              />
            </View>
          </View>

          {/* Date Range Section */}
          <View style={styles.inputGroup}>
            <View style={styles.dateRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <View style={styles.labelRow}>
                  <Ionicons name="calendar-outline" size={16} color={theme.colors.primary} />
                  <Text style={styles.label}>{UI_STRINGS.COURSE_CREATE.START_DATE_LABEL}</Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    if (isCalendarOpen && activeDateTarget === 'start') {
                      setIsCalendarOpen(false);
                    } else {
                      openCalendarForTarget('start');
                    }
                  }}
                  style={styles.inputWithIcon}
                >
                  <TextInput
                    testID="input-start-date"
                    style={[
                      styles.input,
                      { flex: 1 },
                      startDate.length > 0 && !isStartDateValid && styles.inputError,
                      isCalendarOpen && activeDateTarget === 'start' && styles.inputFocused,
                    ]}
                    placeholder={UI_STRINGS.COURSE_CREATE.START_DATE_PLACEHOLDER}
                    value={startDate}
                    editable={false}
                    pointerEvents="none"
                    placeholderTextColor={theme.colors.text.placeholder}
                  />
                  <View style={styles.calendarIconButton}>
                    <Ionicons name="calendar" size={18} color={theme.colors.primary} />
                  </View>
                </TouchableOpacity>
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <View style={styles.labelRow}>
                  <Ionicons name="calendar-sharp" size={16} color={theme.colors.primary} />
                  <Text style={styles.label}>{UI_STRINGS.COURSE_CREATE.END_DATE_LABEL}</Text>
                </View>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    if (isCalendarOpen && activeDateTarget === 'end') {
                      setIsCalendarOpen(false);
                    } else {
                      openCalendarForTarget('end');
                    }
                  }}
                  style={styles.inputWithIcon}
                >
                  <TextInput
                    testID="input-total-days"
                    style={[
                      styles.input,
                      { flex: 1 },
                      endDate.length > 0 && !isEndDateValid && styles.inputError,
                      isCalendarOpen && activeDateTarget === 'end' && styles.inputFocused,
                    ]}
                    placeholder={UI_STRINGS.COURSE_CREATE.END_DATE_PLACEHOLDER}
                    value={endDate}
                    editable={false}
                    pointerEvents="none"
                    placeholderTextColor={theme.colors.text.placeholder}
                  />
                  <View style={styles.calendarIconButton}>
                    <Ionicons name="calendar" size={18} color={theme.colors.primary} />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Expandable Inline Calendar View */}
          {isCalendarOpen && (
            <InlineCalendarView
              currentYearMonth={currentYearMonth}
              startDate={startDate}
              endDate={endDate}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              onSelectDay={handleSelectDay}
            />
          )}

          {/* Budget Type Selector Component */}
          <BudgetTypeSelector
            selectedType={budgetType}
            onSelect={(type) => {
              trackButtonClick('btn_select_budget_type', `Select Budget ${type}`, { budgetType: type });
              setBudgetType(type);
            }}
          />
        </View>

        {/* Generate Button Component */}
        <GenerateCourseButton
          testID="submit-course-btn"
          label={UI_STRINGS.COURSE_CREATE.SUBMIT_BUTTON}
          disabled={!isFormValid}
          onPress={handleSubmit}
          isFloating={false}
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: theme.colors.bg.screen,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  formCard: {
    backgroundColor: theme.colors.bg.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    gap: 16,
  },
  destinationRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 10,
  },
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
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  input: {
    backgroundColor: theme.colors.bg.input,
    borderWidth: 1,
    borderColor: theme.colors.border.default,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 13,
    color: theme.colors.text.primary,
  },
  inputFocused: {
    borderColor: theme.colors.border.active,
    backgroundColor: theme.colors.primaryContainer,
  },
  calendarIconButton: {
    position: 'absolute',
    right: 10,
    padding: 4,
  },
  inputError: {
    borderColor: theme.colors.border.error,
    backgroundColor: theme.colors.bg.error,
  },
  inputDisabled: {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderColor: 'rgba(0, 0, 0, 0.08)',
    opacity: 0.7,
  },
  dropdownContainer: {
    position: 'absolute',
    top: 68,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.bg.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border.light,
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
    maxHeight: 180,
    zIndex: 999,
    overflow: 'hidden',
  },
  dropdownScroll: {
    maxHeight: 180,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.04)',
  },
  dropdownItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text.primary,
  },
});
