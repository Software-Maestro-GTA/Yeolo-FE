/**
 * @file CourseCreateScreen.tsx
 * @description Screen component for entering travel conditions and preferences.
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
import { logger } from '@yeolo/common';
import { InlineCalendarView } from '../components/common';
import {
  useCourseCreateForm,
  useGA4ScreenTracking,
  useGA4ButtonClick,
} from '../hooks';
import type { NavTab } from '../components/navigation';
import { palette } from '../theme/colors';
import { UI_STRINGS } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCourseStore, DEFAULT_API_URL } from '@yeolo/common';

export interface CourseCreateScreenProps {
  onSubmit?: (data: CourseCreateRequest) => void;
  onTabPress?: (tab: NavTab) => void;
}

const POPULAR_DESTINATIONS = [
  { flag: '🇯🇵', country: '일본', city: '도쿄' },
  { flag: '🇹🇭', country: '태국', city: '방콕' },
  { flag: '🇫🇷', country: '프랑스', city: '파리' },
  { flag: '🇻🇳', country: '베트남', city: '다낭' },
  { flag: '🇪🇸', country: '스페인', city: '바르셀로나' },
  { flag: '🇮🇹', country: '이탈리아', city: '로마' },
];

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
    openCalendarForTarget,
    handlePrevMonth,
    handleNextMonth,
    handleSelectDay,
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
      logger.error('Failed to trigger createCourse store action:', err);
    }
    onSubmit?.(data);
  });

  const handleSelectPopularDestination = (country: string, city: string) => {
    trackButtonClick(
      'btn_select_popular_destination',
      `Select ${city}, ${country}`,
    );
    setDestinationCountry(country);
    setDestinationCity(city);
  };

  return (
    <View style={styles.screenContainer} testID='screen-container'>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps='handled'>
        <View style={styles.headerContent} testID='top-content'>
          <Text style={styles.headerTitle}>
            {UI_STRINGS.COURSE_CREATE.MAIN_TITLE}
          </Text>
          <Text style={styles.headerSubTitle}>
            {UI_STRINGS.COURSE_CREATE.SUB_TITLE}
          </Text>
        </View>

        <View style={styles.mainBody} testID='main-content'>
          <View style={styles.cardContainer} testID='destination-card'>
            <View style={styles.cardHeaderRow}>
              <Ionicons
                name='airplane-outline'
                size={20}
                color={palette.primary}
              />
              <Text style={styles.cardTitleText}>
                {UI_STRINGS.COURSE_CREATE.DESTINATION_TITLE}
              </Text>
            </View>

            {/* Input Row (Country & City 2-Column) */}
            <View style={styles.twoColumnRow}>
              <View style={styles.fieldColumn}>
                <Text style={styles.fieldLabelText}>
                  {UI_STRINGS.COURSE_CREATE.COUNTRY_LABEL}
                </Text>
                <View style={styles.inputBox}>
                  <TextInput
                    testID='input-country'
                    style={styles.inputText}
                    placeholder={UI_STRINGS.COURSE_CREATE.COUNTRY_PLACEHOLDER}
                    value={destinationCountry}
                    onChangeText={setDestinationCountry}
                    placeholderTextColor='#8C949E'
                  />
                </View>
              </View>

              <View style={styles.fieldColumn}>
                <Text style={styles.fieldLabelText}>
                  {UI_STRINGS.COURSE_CREATE.CITY_LABEL}
                </Text>
                <View style={styles.inputBox}>
                  <TextInput
                    testID='input-city'
                    style={styles.inputText}
                    placeholder={UI_STRINGS.COURSE_CREATE.CITY_PLACEHOLDER}
                    value={destinationCity}
                    onChangeText={setDestinationCity}
                    placeholderTextColor='#8C949E'
                  />
                </View>
              </View>
            </View>

            {/* Divider Line */}
            <View style={styles.cardDivider} />

            {/* Popular Destinations Tag Section */}
            <View style={styles.tagSection}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.tagChipsRow}>
                {POPULAR_DESTINATIONS.map((dest) => (
                  <TouchableOpacity
                    key={dest.city}
                    style={styles.tagChip}
                    onPress={() =>
                      handleSelectPopularDestination(dest.country, dest.city)
                    }
                    activeOpacity={0.7}>
                    <Text style={styles.tagChipText}>
                      {dest.flag} {dest.city}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.cardContainer} testID='date-card'>
            <View style={styles.cardHeaderRow}>
              <Ionicons
                name='calendar-outline'
                size={20}
                color={palette.primary}
              />
              <Text style={styles.cardTitleText}>
                {UI_STRINGS.COURSE_CREATE.DATE_TITLE}
              </Text>
            </View>

            <View style={styles.twoColumnRow}>
              <TouchableOpacity
                style={styles.dateBox}
                onPress={() => {
                  if (isCalendarOpen && activeDateTarget === 'start') {
                    setIsCalendarOpen(false);
                  } else {
                    openCalendarForTarget('start');
                  }
                }}
                activeOpacity={0.8}>
                <Text style={styles.fieldLabelText}>
                  {UI_STRINGS.COURSE_CREATE.START_DATE_LABEL}
                </Text>
                <Text
                  style={[
                    styles.dateValueText,
                    !startDate && styles.datePlaceholderText,
                  ]}>
                  {startDate || UI_STRINGS.COURSE_CREATE.START_DATE_PLACEHOLDER}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.dateBox}
                onPress={() => {
                  if (isCalendarOpen && activeDateTarget === 'end') {
                    setIsCalendarOpen(false);
                  } else {
                    openCalendarForTarget('end');
                  }
                }}
                activeOpacity={0.8}>
                <Text style={styles.fieldLabelText}>
                  {UI_STRINGS.COURSE_CREATE.END_DATE_LABEL}
                </Text>
                <Text
                  style={[
                    styles.dateValueText,
                    !endDate && styles.datePlaceholderText,
                  ]}>
                  {endDate || UI_STRINGS.COURSE_CREATE.END_DATE_PLACEHOLDER}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Expandable Inline Calendar */}
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
          </View>

          {/* Card 3: Budget Card */}
          <View style={styles.cardContainer} testID='budget-card'>
            <View style={styles.cardHeaderRow}>
              <Ionicons name='card-outline' size={20} color={palette.primary} />
              <Text style={styles.cardTitleText}>
                {UI_STRINGS.COURSE_CREATE.STYLE_TITLE}
              </Text>
            </View>

            <View style={styles.threeColumnGrid}>
              {/* Option 1: 가성비 */}
              <TouchableOpacity
                testID='budget-cost_effective'
                style={[
                  styles.styleCardItem,
                  budgetType === 'cost_effective' && styles.styleCardActive,
                ]}
                onPress={() => {
                  trackButtonClick(
                    'btn_select_budget_type',
                    'Select Budget cost_effective',
                  );
                  setBudgetType('cost_effective');
                }}
                activeOpacity={0.8}>
                <View
                  style={[
                    styles.styleIconBox,
                    budgetType === 'cost_effective' &&
                      styles.styleIconBoxActive,
                  ]}>
                  <Ionicons
                    name='wallet-outline'
                    size={18}
                    color={
                      budgetType === 'cost_effective'
                        ? palette.accent
                        : palette.subText
                    }
                  />
                </View>
                <Text
                  style={[
                    styles.styleCardLabel,
                    budgetType === 'cost_effective' &&
                      styles.styleCardLabelActive,
                  ]}>
                  {UI_STRINGS.COURSE_CREATE.STYLE_BUDGET}
                </Text>
              </TouchableOpacity>

              {/* Option 2: 적정 수준 */}
              <TouchableOpacity
                testID='budget-moderate'
                style={[
                  styles.styleCardItem,
                  budgetType === 'moderate' && styles.styleCardActive,
                ]}
                onPress={() => {
                  trackButtonClick(
                    'btn_select_budget_type',
                    'Select Budget moderate',
                  );
                  setBudgetType('moderate');
                }}
                activeOpacity={0.8}>
                <View
                  style={[
                    styles.styleIconBox,
                    budgetType === 'moderate' && styles.styleIconBoxActive,
                  ]}>
                  <Ionicons
                    name='briefcase-outline'
                    size={18}
                    color={
                      budgetType === 'moderate'
                        ? palette.accent
                        : palette.subText
                    }
                  />
                </View>
                <Text
                  style={[
                    styles.styleCardLabel,
                    budgetType === 'moderate' && styles.styleCardLabelActive,
                  ]}>
                  {UI_STRINGS.COURSE_CREATE.STYLE_MODERATE}
                </Text>
              </TouchableOpacity>

              {/* Option 3: 럭셔리 */}
              <TouchableOpacity
                testID='budget-luxury'
                style={[
                  styles.styleCardItem,
                  budgetType === 'luxury' && styles.styleCardActive,
                ]}
                onPress={() => {
                  trackButtonClick(
                    'btn_select_budget_type',
                    'Select Budget luxury',
                  );
                  setBudgetType('luxury');
                }}
                activeOpacity={0.8}>
                <View
                  style={[
                    styles.styleIconBox,
                    budgetType === 'luxury' && styles.styleIconBoxActive,
                  ]}>
                  <Ionicons
                    name='diamond-outline'
                    size={18}
                    color={
                      budgetType === 'luxury' ? palette.accent : palette.subText
                    }
                  />
                </View>
                <Text
                  style={[
                    styles.styleCardLabel,
                    budgetType === 'luxury' && styles.styleCardLabelActive,
                  ]}>
                  {UI_STRINGS.COURSE_CREATE.STYLE_LUXURY}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.bottomContainer} testID='bottom-container'>
            <TouchableOpacity
              testID='submit-course-btn'
              style={[
                styles.ctaButton,
                !isFormValid && styles.ctaButtonDisabled,
              ]}
              disabled={!isFormValid}
              onPress={handleSubmit}
              activeOpacity={0.8}>
              <Ionicons
                name='sparkles'
                size={18}
                color='#FFFFFF'
                style={styles.ctaIconLeft}
              />
              <Text style={styles.ctaButtonText}>
                {UI_STRINGS.COURSE_CREATE.SUBMIT_BUTTON}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: palette.softMint, // #F5FAF8
  },
  scrollContentContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 76,
    gap: 16,
  },
  headerContent: {
    width: '100%',
    gap: 6,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: palette.deepNavy, // #0D2137
    lineHeight: 32,
  },
  headerSubTitle: {
    fontSize: 14,
    fontWeight: '400',
    color: palette.subText, // #59616B
  },
  mainBody: {
    width: '100%',
    gap: 16,
  },
  cardContainer: {
    backgroundColor: palette.white, // #FFFFFF
    borderWidth: 1,
    borderColor: palette.gray200, // #E0E5EB
    borderRadius: 16,
    padding: 16,
    gap: 14,
    shadowColor: palette.deepNavy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardTitleText: {
    fontSize: 15,
    fontWeight: '700',
    color: palette.deepNavy,
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldColumn: {
    flex: 1,
    gap: 6,
  },
  fieldLabelText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#8C949E',
  },
  inputBox: {
    backgroundColor: palette.softMint,
    borderWidth: 1,
    borderColor: 'rgba(217, 222, 229, 0.6)',
    borderRadius: 8,
    height: 40,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  inputText: {
    fontSize: 12,
    fontWeight: '700',
    color: palette.deepNavy,
    padding: 0,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#EBEDF2',
    width: '100%',
  },
  tagSection: {
    gap: 10,
  },
  tagChipsRow: {
    gap: 8,
  },
  tagChip: {
    backgroundColor: '#E0F7F1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0D7361',
  },
  dateBox: {
    flex: 1,
    backgroundColor: palette.softMint,
    borderRadius: 8,
    padding: 10,
    gap: 4,
  },
  dateValueText: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.deepNavy,
  },
  datePlaceholderText: {
    color: '#8C949E',
    fontWeight: '500',
  },
  threeColumnGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  styleCardItem: {
    flex: 1,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.gray200,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  styleCardActive: {
    backgroundColor: '#E0F7F1',
    borderWidth: 1.5,
    borderColor: palette.accent, // #00C9A7
  },
  styleIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: palette.softMint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  styleIconBoxActive: {
    backgroundColor: palette.white,
  },
  styleCardLabel: {
    fontSize: 11,
    fontWeight: '500',
    color: palette.subText,
  },
  styleCardLabelActive: {
    fontWeight: '700',
    color: palette.deepNavy,
  },
  bottomContainer: {
    width: '100%',
    marginTop: 8,
  },
  ctaButton: {
    backgroundColor: palette.primary, // #2D7DD2
    height: 56,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2D7DD2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  ctaButtonDisabled: {
    opacity: 0.5,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ctaIconLeft: {
    marginRight: 8,
  },
});
