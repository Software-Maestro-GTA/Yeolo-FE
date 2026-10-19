/**
 * @file CourseCreateScreen.tsx
 * @description 취향 유무에 맞는 안내와 여행 조건 입력, 안전 영역 위 생성 버튼을 제공합니다.
 */
import BackSvg from '../../assets/images/figma-course/back.svg';
import PlaneSvg from '../../assets/images/figma-course/plane.svg';
import RequiredSvg from '../../assets/images/figma-course/required.svg';
import RecommendationDividerSvg from '../../assets/images/figma-course/recommendation-divider.svg';
import CalendarSvg from '../../assets/images/figma-course/calendar.svg';
import { Text } from '../components/common/Typography';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useCourseStore,
  type CourseCreateRequest,
  type TasteProfile,
} from '@yeolo/common';
import {
  useCourseCreateForm,
  useCourseCreateMutation,
  useGA4ScreenTracking,
  useGA4ButtonClick,
} from '../hooks';
import { useTasteProfileQuery } from '../hooks/queries/useTasteProfileQuery';
import { DestinationPickerSheet } from '../components/course/DestinationPickerSheet';
import { TravelDateSheet } from '../components/course/TravelDateSheet';
import { NumericBudgetSlider } from '../components/course/NumericBudgetSlider';
import { FigmaAsset } from '../components/common/FigmaAsset';
import type { NavTab } from '../components/navigation';
import { palette, hexToRgba } from '../theme/colors';
import { UI_STRINGS } from '../constants';
import { MBTI_PROFILES, type MbtiType } from '../constants/mbtiProfiles';
import {
  COURSE_UI,
  COURSE_POPULAR_DESTINATIONS,
  COURSE_RECOMMENDED_DESTINATION_COUNT,
} from '../constants/courseUiStrings';

export interface CourseCreateScreenProps {
  onSubmit?: (data: CourseCreateRequest) => void;
  onNavigate?: (tab: NavTab) => void;
  onBack?: () => void;
  mbti?: MbtiType | null;
  recommendedDestination?: Pick<
    TasteProfile['recommendCity'],
    'countryName' | 'cityName'
  >;
  onPhoto?: () => void;
}

/** Collects an API-compatible destination, date range and numeric budget before submission. */
export const CourseCreateScreen: React.FC<CourseCreateScreenProps> = ({
  onSubmit,
  onBack,
  mbti,
  recommendedDestination,
  onPhoto,
}) => {
  useGA4ScreenTracking('CourseCreateScreen');
  const { trackButtonClick } = useGA4ButtonClick();
  const createCourseMutation = useCourseCreateMutation();
  const isGenerating = useCourseStore((state) => state.isGenerating);
  const [destinationOpen, setDestinationOpen] = useState(false);
  const [popularDestinations] = useState(() => {
    const countries = [
      ...new Set(COURSE_POPULAR_DESTINATIONS.map(({ country }) => country)),
    ];
    for (let index = countries.length - 1; index > 0; index -= 1) {
      const randomIndex = Math.floor(Math.random() * (index + 1));
      [countries[index], countries[randomIndex]] = [
        countries[randomIndex],
        countries[index],
      ];
    }
    return countries
      .slice(0, COURSE_RECOMMENDED_DESTINATION_COUNT)
      .map((country) => {
        const destinations = COURSE_POPULAR_DESTINATIONS.filter(
          (destination) => destination.country === country,
        );
        return destinations[Math.floor(Math.random() * destinations.length)];
      });
  });
  const country = recommendedDestination?.countryName.trim();
  const city = recommendedDestination?.cityName.trim();
  const recommendedDestinations =
    country && city
      ? [
          { country, city },
          ...popularDestinations.filter(
            (destination) => destination.country !== country,
          ),
        ].slice(0, COURSE_RECOMMENDED_DESTINATION_COUNT)
      : popularDestinations;
  const [dateOpen, setDateOpen] = useState(false);
  const [tasteOpen, setTasteOpen] = useState(false);
  const taste = useTasteProfileQuery({
    options: { enabled: !mbti },
  });
  const mbtiProfile = mbti ? MBTI_PROFILES[mbti] : undefined;
  const tasteSummary = mbtiProfile?.summary ?? taste.data?.intro;
  const tasteTags = (
    mbtiProfile ? mbtiProfile.tags.split(' ') : (taste.data?.hashtags ?? [])
  ).filter((tag) => tag.trim());
  const hasTaste = Boolean(
    mbtiProfile ||
    (taste.error?.status !== 404 &&
      (tasteSummary?.trim() || tasteTags.length > 0)),
  );
  const tasteLoading = !hasTaste && (taste.isPending || taste.isFetching);
  const tasteMissing =
    !hasTaste &&
    !tasteLoading &&
    (taste.error?.status === 404 || taste.isSuccess);
  const showTasteCard = hasTaste || !tasteMissing || Boolean(onPhoto);
  const form = useCourseCreateForm((data) => {
    if (
      createCourseMutation.isPending ||
      useCourseStore.getState().isGenerating
    )
      return;
    // The mutation awaits token storage before the store starts the request.
    // Clear the previous result synchronously, before mounting its loading UI.
    useCourseStore.getState().resetCourseState();
    trackButtonClick('btn_submit_course_create', 'Submit Course Create Form', {
      country: data.destinationCountry,
      city: data.destinationCity,
      budget: data.budget,
    });
    createCourseMutation.mutate(data);
    onSubmit?.(data);
  });
  const destinationLabel = form.destinationCity
    ? `${form.destinationCountry}  |  ${form.destinationCity}`
    : COURSE_UI.DESTINATION_PLACEHOLDER;
  const dateLabel =
    form.startDate && form.endDate
      ? `${form.startDate.slice(2).replace(/-/g, '.')} - ${form.endDate.slice(2).replace(/-/g, '.')}`
      : COURSE_UI.DATE_PLACEHOLDER;
  const disabled =
    !form.isFormValid || createCourseMutation.isPending || isGenerating;
  return (
    <SafeAreaView
      style={styles.screenContainer}
      edges={['bottom', 'left', 'right']}
      testID='screen-container'>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps='handled'
            showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <Pressable
                style={styles.backButton}
                accessibilityRole='button'
                accessibilityLabel={COURSE_UI.BACK}
                onPress={onBack}
                testID='course-create-back'>
                <FigmaAsset source={BackSvg} width={24} height={24} />
              </Pressable>
              <Text style={styles.headerTitle}>
                {UI_STRINGS.COURSE_CREATE.MAIN_TITLE}
              </Text>
              <View style={styles.headerSpacer} />
            </View>
            <View style={styles.mainBody} testID='main-content'>
              {showTasteCard && (
                <View style={styles.tasteCard} testID='my-taste-banner'>
                  {hasTaste ? (
                    <>
                      <Pressable
                        accessibilityRole='button'
                        accessibilityState={{ expanded: tasteOpen }}
                        testID='toggle-taste-summary'
                        style={styles.tasteHeader}
                        onPress={() => setTasteOpen((open) => !open)}>
                        <Text style={styles.tasteTitle}>
                          {COURSE_UI.TASTE_REVIEW}
                        </Text>
                        <FigmaAsset
                          source={BackSvg}
                          width={24}
                          height={24}
                          style={
                            tasteOpen ? styles.chevronUp : styles.chevronDown
                          }
                        />
                      </Pressable>
                      {tasteOpen && (
                        <View style={styles.tasteBody}>
                          {Boolean(tasteSummary?.trim()) && (
                            <Text style={styles.tasteDescription}>
                              {tasteSummary}
                            </Text>
                          )}
                          {tasteTags.length > 0 && (
                            <View style={styles.tags}>
                              {tasteTags.map((tag) => (
                                <Text key={tag} style={styles.tasteTag}>
                                  #{tag.replace(/^#/, '')}
                                </Text>
                              ))}
                            </View>
                          )}
                        </View>
                      )}
                    </>
                  ) : tasteMissing ? (
                    <Pressable
                      accessibilityRole='button'
                      testID='course-create-photo'
                      style={styles.tasteHeader}
                      onPress={onPhoto}>
                      <Text style={styles.tasteTitle}>
                        {COURSE_UI.TASTE_ANALYZE}
                      </Text>
                      <FigmaAsset
                        source={BackSvg}
                        width={24}
                        height={24}
                        style={styles.chevronForward}
                      />
                    </Pressable>
                  ) : (
                    <View
                      style={styles.tasteFeedback}
                      testID={
                        tasteLoading ? 'course-taste-loading' : undefined
                      }>
                      <Text style={styles.tasteFeedbackText}>
                        {tasteLoading
                          ? COURSE_UI.TASTE_LOADING
                          : COURSE_UI.TASTE_ERROR}
                      </Text>
                      {tasteLoading ? (
                        <ActivityIndicator color={palette.primary} />
                      ) : (
                        <Pressable
                          accessibilityRole='button'
                          testID='retry-course-taste'
                          style={styles.tasteRetry}
                          onPress={() => taste.refetch()}>
                          <Text style={styles.tasteRetryText}>
                            {COURSE_UI.RETRY}
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  )}
                </View>
              )}
              <View
                style={[
                  styles.conditionsCard,
                  mbti && styles.mbtiConditionsCard,
                ]}>
                <View testID='destination-card'>
                  <View style={styles.labelRow}>
                    <FigmaAsset source={PlaneSvg} width={16} height={16} />
                    <Text style={styles.cardTitle}>
                      {UI_STRINGS.COURSE_CREATE.DESTINATION_TITLE}
                    </Text>
                    <FigmaAsset source={RequiredSvg} width={12} height={12} />
                  </View>
                  <Pressable
                    testID='open-destination-sheet'
                    accessibilityRole='button'
                    style={styles.field}
                    onPress={() => setDestinationOpen(true)}>
                    <Text
                      style={[
                        styles.fieldText,
                        !form.destinationCity && styles.placeholder,
                      ]}>
                      {destinationLabel}
                    </Text>
                  </Pressable>
                  <View testID='recommended-destinations'>
                    <Text style={styles.recommendedLabel}>
                      {COURSE_UI.RECOMMENDED}
                    </Text>
                    <View style={styles.tags}>
                      {recommendedDestinations.map(({ country, city }) => {
                        const selected =
                          form.destinationCountry === country &&
                          form.destinationCity === city;
                        return (
                          <Pressable
                            key={`${country}-${city}`}
                            accessibilityRole='button'
                            accessibilityLabel={`${country}, ${city}`}
                            accessibilityState={{ selected }}
                            testID={`recommended-destination-${country}-${city}`}
                            style={[
                              styles.destinationTag,
                              selected && styles.selectedTag,
                            ]}
                            onPress={() => {
                              trackButtonClick(
                                'btn_select_popular_destination',
                                `Select ${city}, ${country}`,
                              );
                              form.handleSelectPopularDestination(
                                country,
                                city,
                              );
                            }}>
                            <Text style={styles.tagText}>{country}</Text>
                            <View style={styles.tagDivider}>
                              <FigmaAsset
                                source={RecommendationDividerSvg}
                                width={10}
                                height={1}
                                style={styles.tagDividerRotation}
                              />
                            </View>
                            <Text style={styles.tagText}>{city}</Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                </View>
                <View
                  testID='date-card'
                  style={[styles.dateSection, mbti && styles.mbtiDateSection]}>
                  <View style={styles.labelRow}>
                    <FigmaAsset
                      source={CalendarSvg}
                      width={14.5}
                      height={14.5}
                    />
                    <Text style={styles.cardTitle}>
                      {UI_STRINGS.COURSE_CREATE.DATE_TITLE}
                    </Text>
                    <FigmaAsset source={RequiredSvg} width={12} height={12} />
                  </View>
                  <Pressable
                    testID='open-date-sheet'
                    accessibilityRole='button'
                    style={styles.field}
                    onPress={() => setDateOpen(true)}>
                    <Text
                      style={[
                        styles.fieldText,
                        !form.startDate && styles.placeholder,
                      ]}>
                      {dateLabel}
                    </Text>
                  </Pressable>
                </View>
              </View>
              <NumericBudgetSlider
                value={form.budget}
                onChange={form.setBudget}
              />
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
        <View
          style={[
            styles.footer,
            Platform.OS === 'android' && styles.androidFooter,
          ]}>
          <Pressable
            testID='submit-course-btn'
            accessibilityRole='button'
            accessibilityState={{ disabled }}
            disabled={disabled}
            style={[styles.submitButton, disabled && styles.submitDisabled]}
            onPress={form.handleSubmit}>
            <Text
              style={[
                styles.submitText,
                disabled && styles.submitTextDisabled,
              ]}>
              {UI_STRINGS.COURSE_CREATE.SUBMIT_BUTTON}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
      <DestinationPickerSheet
        visible={destinationOpen}
        onClose={() => setDestinationOpen(false)}
        initialCountry={form.destinationCountry}
        onSelect={form.handleSelectPopularDestination}
      />
      <TravelDateSheet
        visible={dateOpen}
        onClose={() => setDateOpen(false)}
        startDate={form.startDate}
        endDate={form.endDate}
        onConfirm={(start, end) => {
          form.handleStartDateChange(start);
          form.handleEndDateChange(end);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  screenContainer: { flex: 1, backgroundColor: palette.white },
  content: { flexGrow: 1, paddingBottom: 16 },
  header: {
    height: 61,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: { width: 44 },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: -0.6,
    color: palette.deepNavy,
    textAlign: 'center',
  },
  mainBody: { flexGrow: 1, paddingHorizontal: 20, gap: 16 },
  tasteCard: { backgroundColor: palette.gray100, borderRadius: 24 },
  tasteHeader: {
    minHeight: 54,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tasteTitle: { fontSize: 16, fontWeight: '600', color: palette.deepNavy },
  tasteBody: { paddingHorizontal: 20, paddingBottom: 18, gap: 10 },
  tasteDescription: { fontSize: 14, lineHeight: 20, color: palette.subText },
  tasteFeedback: {
    minHeight: 54,
    paddingHorizontal: 20,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  tasteFeedbackText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: palette.subText,
  },
  tasteRetry: { minHeight: 44, justifyContent: 'center' },
  tasteRetryText: { fontSize: 14, fontWeight: '600', color: palette.primary },
  tasteTag: {
    fontSize: 12,
    color: palette.primary,
    backgroundColor: palette.primaryTint,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
  },
  chevronDown: { transform: [{ rotate: '-90deg' }] },
  chevronUp: { transform: [{ rotate: '90deg' }] },
  chevronForward: { transform: [{ rotate: '180deg' }] },
  conditionsCard: {
    backgroundColor: palette.gray100,
    borderRadius: 24,
    paddingHorizontal: 26,
    paddingTop: 26,
    paddingBottom: 26,
  },
  mbtiConditionsCard: { paddingTop: 26, paddingBottom: 41 },
  labelRow: {
    minHeight: 37,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -1,
    color: palette.deepNavy,
  },
  field: {
    minHeight: 56,
    backgroundColor: palette.white,
    borderRadius: 11,
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  fieldText: {
    fontSize: 16,
    fontWeight: '500',
    color: palette.deepNavy,
    letterSpacing: -0.48,
  },
  placeholder: {
    color: palette.mutedText,
    fontWeight: '500',
    fontSize: 14,
    letterSpacing: -0.28,
  },
  recommendedLabel: {
    fontSize: 12,
    color: palette.mutedText,
    marginTop: 16,
    marginBottom: 7,
  },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  destinationTag: {
    borderRadius: 152,
    backgroundColor: palette.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: palette.transparent,
  },
  selectedTag: {
    backgroundColor: hexToRgba(palette.primary, 0.2),
    borderColor: palette.primary,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
    color: palette.deepNavy,
  },
  tagDivider: {
    width: 1,
    height: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagDividerRotation: { transform: [{ rotate: '90deg' }] },
  dateSection: { marginTop: 16 },
  mbtiDateSection: { marginTop: 28 },
  footer: {
    flexShrink: 0,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: palette.white,
  },
  androidFooter: { paddingBottom: 24 },
  submitButton: {
    minHeight: 62,
    borderRadius: 16,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    shadowColor: palette.black,
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  submitDisabled: { backgroundColor: palette.gray300 },
  submitTextDisabled: { color: palette.gray600 },
  submitText: {
    fontSize: 20,
    fontWeight: '500',
    color: palette.white,
    textAlign: 'center',
  },
});
