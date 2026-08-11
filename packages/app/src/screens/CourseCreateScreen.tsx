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
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

import { Ionicons } from '@expo/vector-icons';
import type { CourseCreateRequest } from '@yeolo/common';
import { InlineCalendarView } from '../components/common';
import {
  useCourseCreateForm,
  useCourseCreateMutation,
  useGA4ScreenTracking,
  useGA4ButtonClick,
} from '../hooks';
import type { NavTab } from '../components/navigation';
import { palette } from '../theme/colors';
import { UI_STRINGS } from '../constants';

export interface CourseCreateScreenProps {
  onSubmit?: (data: CourseCreateRequest) => void;
  onNavigate?: (tab: NavTab) => void;
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
  const createCourseMutation = useCourseCreateMutation();

  const {
    destinationCountry,
    setDestinationCountry,
    destinationCity,
    setDestinationCity,
    countrySuggestions,
    citySuggestions,
    showCountryDropdown,
    setShowCountryDropdown,
    showCityDropdown,
    setShowCityDropdown,
    handleSelectCountry,
    handleSelectCity,
    handleSelectPopularDestination,
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
  } = useCourseCreateForm((data) => {
    trackButtonClick('btn_submit_course_create', 'Submit Course Create Form', {
      country: data.destinationCountry,
      city: data.destinationCity,
      budgetType: data.budgetType,
    });
    createCourseMutation.mutate(data);
    onSubmit?.(data);
  });

  const handleDismissOverlay = () => {
    if (isCalendarOpen) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsCalendarOpen(false);
    }
    if (showCountryDropdown) setShowCountryDropdown(false);
    if (showCityDropdown) setShowCityDropdown(false);
    Keyboard.dismiss();
  };

  const onSelectPopular = (country: string, city: string) => {
    trackButtonClick(
      'btn_select_popular_destination',
      `Select ${city}, ${country}`,
    );
    handleSelectPopularDestination(country, city);
  };

  return (
    <TouchableWithoutFeedback
      onPress={handleDismissOverlay}
      testID='dismiss-overlay-area'>
      <View style={styles.screenContainer} testID='screen-container'>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps='handled'>
          <View style={styles.mainBody} testID='main-content'>
            <View style={styles.headerContent} testID='top-content'>
              <Text style={styles.headerTitle}>
                {UI_STRINGS.COURSE_CREATE.MAIN_TITLE}
              </Text>
              <Text style={styles.headerSubTitle}>
                {UI_STRINGS.COURSE_CREATE.SUB_TITLE}
              </Text>
            </View>

            <View
              style={[
                styles.cardContainer,
                (showCountryDropdown || showCityDropdown) &&
                  styles.cardContainerActiveDropdown,
              ]}
              testID='destination-card'>
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
                      onFocus={() => setShowCountryDropdown(true)}
                      placeholderTextColor='#8C949E'
                    />
                  </View>
                  {showCountryDropdown && countrySuggestions.length > 0 && (
                    <View
                      style={styles.dropdownContainer}
                      testID='country-dropdown'>
                      <ScrollView
                        nestedScrollEnabled
                        style={styles.dropdownList}>
                        {countrySuggestions.map((item) => (
                          <TouchableOpacity
                            key={item.countryId}
                            style={styles.dropdownItem}
                            onPress={() => handleSelectCountry(item)}
                            activeOpacity={0.7}>
                            <Text style={styles.dropdownItemText}>
                              {item.countryNameKo}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
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
                      onFocus={() => setShowCityDropdown(true)}
                      placeholderTextColor='#8C949E'
                    />
                  </View>
                  {showCityDropdown && citySuggestions.length > 0 && (
                    <View
                      style={styles.dropdownContainer}
                      testID='city-dropdown'>
                      <ScrollView
                        nestedScrollEnabled
                        style={styles.dropdownList}>
                        {citySuggestions.map((item) => (
                          <TouchableOpacity
                            key={item.cityId}
                            style={styles.dropdownItem}
                            onPress={() => handleSelectCity(item)}
                            activeOpacity={0.7}>
                            <Text style={styles.dropdownItemText}>
                              {item.cityNameKo}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>

              {/* Popular Destinations Tag Section */}
              <View style={styles.tagSection}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.tagChipsRow}>
                  {POPULAR_DESTINATIONS.map((dest) => (
                    <TouchableOpacity
                      key={dest.city}
                      testID={`popular-tag-${dest.city}`}
                      style={styles.tagChip}
                      onPress={() => onSelectPopular(dest.country, dest.city)}
                      activeOpacity={0.7}>
                      <Text style={styles.tagFlagText}>{dest.flag}</Text>
                      <Text style={styles.tagChipText}>{dest.city}</Text>
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
                    LayoutAnimation.configureNext(
                      LayoutAnimation.Presets.easeInEaseOut,
                    );
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
                    {startDate ||
                      UI_STRINGS.COURSE_CREATE.START_DATE_PLACEHOLDER}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.dateBox}
                  onPress={() => {
                    LayoutAnimation.configureNext(
                      LayoutAnimation.Presets.easeInEaseOut,
                    );
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
                <Ionicons
                  name='card-outline'
                  size={20}
                  color={palette.primary}
                />
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
                        budgetType === 'luxury'
                          ? palette.accent
                          : palette.subText
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
                size={20}
                color='#FFFFFF'
                style={styles.ctaIconLeft}
              />
              <Text style={styles.ctaButtonText}>
                {UI_STRINGS.COURSE_CREATE.SUBMIT_BUTTON}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: palette.softMint, // #F5FAF8
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 24,
    gap: 18,
  },
  headerContent: {
    width: '100%',
    gap: 4,
    paddingBottom: 2,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: palette.deepNavy, // #0D2137
    lineHeight: 34,
    letterSpacing: -0.6,
    includeFontPadding: false,
  },
  headerSubTitle: {
    fontSize: 14,
    fontWeight: '400',
    color: palette.subText, // #59616B
    lineHeight: 20,
    includeFontPadding: false,
  },
  mainBody: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    gap: 18,
  },
  cardContainer: {
    backgroundColor: palette.white, // #FFFFFF
    borderWidth: 1,
    borderColor: palette.gray200, // #E0E5EB
    borderRadius: 18,
    padding: 18,
    gap: 16,
    shadowColor: palette.deepNavy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    zIndex: 1,
  },
  cardContainerActiveDropdown: {
    zIndex: 1000,
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
    includeFontPadding: false,
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
    zIndex: 100,
  },

  fieldColumn: {
    flex: 1,
    gap: 6,
    position: 'relative',
    zIndex: 10,
  },
  dropdownContainer: {
    position: 'absolute',
    top: 66,
    left: 0,
    right: 0,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.gray200,
    borderRadius: 10,
    maxHeight: 160,
    zIndex: 1000,
    elevation: 5,
    shadowColor: palette.deepNavy,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownList: {
    maxHeight: 150,
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEDF2',
  },
  dropdownItemText: {
    fontSize: 13,
    fontWeight: '500',
    color: palette.deepNavy,
    includeFontPadding: false,
  },

  fieldLabelText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8C949E',
    includeFontPadding: false,
  },
  inputBox: {
    backgroundColor: palette.softMint,
    borderWidth: 1,
    borderColor: 'rgba(217, 222, 229, 0.6)',
    borderRadius: 10,
    height: 44,
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  inputText: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.deepNavy,
    padding: 0,
    includeFontPadding: false,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0F7F1',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
  },
  tagFlagText: {
    fontSize: 14,
    includeFontPadding: false,
  },
  tagChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0D7361',
    includeFontPadding: false,
  },
  dateBox: {
    flex: 1,
    backgroundColor: palette.softMint,
    borderWidth: 1,
    borderColor: 'rgba(217, 222, 229, 0.6)',
    borderRadius: 10,
    padding: 12,
    gap: 4,
  },
  dateValueText: {
    fontSize: 13,
    fontWeight: '700',
    color: palette.deepNavy,
    includeFontPadding: false,
  },
  datePlaceholderText: {
    color: '#8C949E',
    fontWeight: '500',
  },
  threeColumnGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  styleCardItem: {
    flex: 1,
    backgroundColor: palette.white,
    borderWidth: 1.5,
    borderColor: palette.gray200,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  styleCardActive: {
    backgroundColor: '#E0F7F1',
    borderColor: palette.accent, // #00C9A7
  },
  styleIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: palette.softMint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  styleIconBoxActive: {
    backgroundColor: palette.white,
  },
  styleCardLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: palette.subText,
    lineHeight: 16,
    includeFontPadding: false,
  },
  styleCardLabelActive: {
    fontWeight: '700',
    color: palette.deepNavy,
  },

  bottomContainer: {
    width: '100%',
    marginTop: 'auto',
    paddingTop: 16,
  },
  ctaButton: {
    backgroundColor: palette.primary, // #2D7DD2
    height: 56,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: palette.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  ctaButtonDisabled: {
    opacity: 0.5,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    includeFontPadding: false,
  },
  ctaIconLeft: {
    marginRight: 8,
  },
});
