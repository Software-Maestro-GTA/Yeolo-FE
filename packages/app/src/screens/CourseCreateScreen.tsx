/**
 * @file CourseCreateScreen.tsx
 * @description Screen for entering travel conditions with custom useCourseCreateForm hook and modularized subcomponents.
 * @requirements REQ-7
 * @functional FUN-6
 * @api API-FB-4
 * @author Antigravity Agent
 */
import React from 'react';
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
import { useCourseCreateForm } from '../hooks';
import type { NavTab } from '../components/navigation';
import { theme } from '../theme';
import { UI_STRINGS } from '../constants';

export interface CourseCreateScreenProps {
  onSubmit?: (data: CourseCreateRequest) => void;
  onTabPress?: (tab: NavTab) => void;
}

export const CourseCreateScreen: React.FC<CourseCreateScreenProps> = ({
  onSubmit,
}) => {
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
  } = useCourseCreateForm(onSubmit);

  return (
    <View style={styles.screenContainer}>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Component */}
        <CourseCreateHeader />

        {/* Input Form Section Card */}
        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
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

          <View style={styles.inputGroup}>
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

          {/* Date Range Section */}
          <View style={styles.inputGroup}>
            <View style={styles.dateRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <View style={styles.labelRow}>
                  <Ionicons name="calendar-outline" size={16} color={theme.colors.primary} />
                  <Text style={styles.label}>{UI_STRINGS.COURSE_CREATE.START_DATE_LABEL}</Text>
                </View>
                <View style={styles.inputWithIcon}>
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
                    onChangeText={handleStartDateChange}
                    onFocus={() => openCalendarForTarget('start')}
                    keyboardType="number-pad"
                    maxLength={10}
                    placeholderTextColor={theme.colors.text.placeholder}
                  />
                  <TouchableOpacity
                    style={styles.calendarIconButton}
                    onPress={() => {
                      if (isCalendarOpen && activeDateTarget === 'start') {
                        setIsCalendarOpen(false);
                      } else {
                        openCalendarForTarget('start');
                      }
                    }}
                  >
                    <Ionicons name="calendar" size={18} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <View style={styles.labelRow}>
                  <Ionicons name="calendar-sharp" size={16} color={theme.colors.primary} />
                  <Text style={styles.label}>{UI_STRINGS.COURSE_CREATE.END_DATE_LABEL}</Text>
                </View>
                <View style={styles.inputWithIcon}>
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
                    onChangeText={handleEndDateChange}
                    onFocus={() => openCalendarForTarget('end')}
                    keyboardType="number-pad"
                    maxLength={10}
                    placeholderTextColor={theme.colors.text.placeholder}
                  />
                  <TouchableOpacity
                    style={styles.calendarIconButton}
                    onPress={() => {
                      if (isCalendarOpen && activeDateTarget === 'end') {
                        setIsCalendarOpen(false);
                      } else {
                        openCalendarForTarget('end');
                      }
                    }}
                  >
                    <Ionicons name="calendar" size={18} color={theme.colors.primary} />
                  </TouchableOpacity>
                </View>
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
            onSelect={setBudgetType}
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
});
