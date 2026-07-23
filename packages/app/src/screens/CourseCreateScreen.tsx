/**
 * @file CourseCreateScreen.tsx
 * @description Screen for entering travel conditions with modularized InlineCalendarView and iOS timezone-safe alignment.
 * @requirements REQ-7
 * @functional FUN-6
 * @api API-FB-4
 * @author Antigravity Agent
 */
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BudgetType, CourseCreateRequest } from '@yeolo/common';
import { DATE_REGEX, formatYYYYMMDD, calculateTotalDays } from '@yeolo/common';
import type { NavTab } from '../components/navigation/BottomNavBar';
import { GenerateCourseButton } from '../components/common/GenerateCourseButton';
import { InlineCalendarView } from '../components/common/InlineCalendarView';

export interface CourseCreateScreenProps {
  onSubmit?: (data: CourseCreateRequest) => void;
  onTabPress?: (tab: NavTab) => void;
}

export const CourseCreateScreen: React.FC<CourseCreateScreenProps> = ({
  onSubmit,
}) => {
  const [destinationCountry, setDestinationCountry] = useState('');
  const [destinationCity, setDestinationCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budgetType, setBudgetType] = useState<BudgetType | null>(null);

  // Inline Calendar State & Ref
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [activeDateTarget, setActiveDateTarget] = useState<'start' | 'end'>('start');

  const todayDate = new Date();
  const [currentYearMonth, setCurrentYearMonth] = useState({
    year: todayDate.getFullYear(),
    month: todayDate.getMonth() + 1,
  });

  const scrollViewRef = useRef<ScrollView>(null);

  // Smoothly scroll down to keep inline calendar fully visible when expanded
  useEffect(() => {
    if (isCalendarOpen) {
      const scrollTimer = setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return () => clearTimeout(scrollTimer);
    }
  }, [isCalendarOpen]);

  const handleStartDateChange = (text: string) => {
    setStartDate(formatYYYYMMDD(text));
  };

  const handleEndDateChange = (text: string) => {
    setEndDate(formatYYYYMMDD(text));
  };

  /**
   * Open calendar focused on the date's specific year and month to avoid iOS timezone mismatch
   */
  const openCalendarForTarget = (target: 'start' | 'end') => {
    setActiveDateTarget(target);
    const targetDateStr = target === 'start' ? startDate : endDate;

    if (DATE_REGEX.test(targetDateStr.trim())) {
      const [y, m] = targetDateStr.trim().split('-').map(Number);
      setCurrentYearMonth({ year: y, month: m });
    } else {
      const now = new Date();
      setCurrentYearMonth({ year: now.getFullYear(), month: now.getMonth() + 1 });
    }

    setIsCalendarOpen(true);
  };

  const handlePrevMonth = () => {
    if (currentYearMonth.month === 1) {
      setCurrentYearMonth({ year: currentYearMonth.year - 1, month: 12 });
    } else {
      setCurrentYearMonth({ year: currentYearMonth.year, month: currentYearMonth.month - 1 });
    }
  };

  const handleNextMonth = () => {
    if (currentYearMonth.month === 12) {
      setCurrentYearMonth({ year: currentYearMonth.year + 1, month: 1 });
    } else {
      setCurrentYearMonth({ year: currentYearMonth.year, month: currentYearMonth.month + 1 });
    }
  };

  const handleSelectDay = (day: number) => {
    const mm = String(currentYearMonth.month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const dateStr = `${currentYearMonth.year}-${mm}-${dd}`;

    if (activeDateTarget === 'start') {
      setStartDate(dateStr);
      setActiveDateTarget('end');
    } else {
      setEndDate(dateStr);
      setIsCalendarOpen(false);
    }
  };

  // Validate start date format YYYY-MM-DD
  const isStartDateValid = !startDate || DATE_REGEX.test(startDate.trim());

  // Validate end date format YYYY-MM-DD or numeric days for backward compatibility
  const isEndDateValid =
    !endDate ||
    DATE_REGEX.test(endDate.trim()) ||
    (/^\d+$/.test(endDate.trim()) && Number(endDate.trim()) > 0);

  const calculatedDays = calculateTotalDays(startDate, endDate);

  const isFormValid =
    destinationCountry.trim().length > 0 &&
    destinationCity.trim().length > 0 &&
    startDate.trim().length > 0 &&
    isStartDateValid &&
    endDate.trim().length > 0 &&
    isEndDateValid &&
    calculatedDays !== null &&
    calculatedDays > 0 &&
    budgetType !== null;

  const handleSubmit = () => {
    if (!isFormValid || !budgetType || !calculatedDays) return;

    const requestData: CourseCreateRequest = {
      destinationCountry: destinationCountry.trim(),
      destinationCity: destinationCity.trim(),
      startDate: startDate.trim(),
      totalDays: calculatedDays,
      budgetType,
    };

    onSubmit?.(requestData);
  };

  return (
    <View style={styles.screenContainer}>
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.badge}>
            <Ionicons name="sparkles" size={14} color="#4648D4" />
            <Text style={styles.badgeText}>여로 AI 맞춤 코스 생성</Text>
          </View>
          <Text style={styles.headerTitle}>어디로 떠나시나요?</Text>
          <Text style={styles.headerSubtitle}>
            여행 일정과 취향을 분석하여 당신만을 위한 최적의 이동 코스를 만들어 드립니다.
          </Text>
        </View>

        {/* Input Form Section */}
        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="earth-outline" size={16} color="#4648D4" />
              <Text style={styles.label}>여행 국가</Text>
            </View>
            <TextInput
              testID="input-country"
              style={styles.input}
              placeholder="예: 대한민국, 일본, 프랑스"
              value={destinationCountry}
              onChangeText={setDestinationCountry}
              placeholderTextColor="#94A3B8"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="location-outline" size={16} color="#4648D4" />
              <Text style={styles.label}>여행 도시</Text>
            </View>
            <TextInput
              testID="input-city"
              style={styles.input}
              placeholder="예: 제주, 서울, 파리"
              value={destinationCity}
              onChangeText={setDestinationCity}
              placeholderTextColor="#94A3B8"
            />
          </View>

          {/* Date Range Section with Auto-Hyphen Formatting */}
          <View style={styles.inputGroup}>
            <View style={styles.dateRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <View style={styles.labelRow}>
                  <Ionicons name="calendar-outline" size={16} color="#4648D4" />
                  <Text style={styles.label}>출발 예정일</Text>
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
                    placeholder="YYYY-MM-DD"
                    value={startDate}
                    onChangeText={handleStartDateChange}
                    onFocus={() => openCalendarForTarget('start')}
                    keyboardType="number-pad"
                    maxLength={10}
                    placeholderTextColor="#94A3B8"
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
                    <Ionicons name="calendar" size={18} color="#4648D4" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <View style={styles.labelRow}>
                  <Ionicons name="calendar-sharp" size={16} color="#4648D4" />
                  <Text style={styles.label}>도착 예정일</Text>
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
                    placeholder="YYYY-MM-DD"
                    value={endDate}
                    onChangeText={handleEndDateChange}
                    onFocus={() => openCalendarForTarget('end')}
                    keyboardType="number-pad"
                    maxLength={10}
                    placeholderTextColor="#94A3B8"
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
                    <Ionicons name="calendar" size={18} color="#4648D4" />
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

          {/* Budget Type Cards */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Ionicons name="wallet-outline" size={16} color="#4648D4" />
              <Text style={styles.label}>예산 및 소비 성향</Text>
            </View>
            <View style={styles.radioGroup}>
              <TouchableOpacity
                testID="budget-cost_effective"
                activeOpacity={0.8}
                style={[
                  styles.radioButton,
                  budgetType === 'cost_effective' && styles.radioButtonActive,
                ]}
                onPress={() => setBudgetType('cost_effective')}
              >
                <Ionicons
                  name="wallet-outline"
                  size={18}
                  color={budgetType === 'cost_effective' ? '#4648D4' : '#64748B'}
                />
                <Text
                  style={[
                    styles.radioText,
                    budgetType === 'cost_effective' && styles.radioTextActive,
                  ]}
                >
                  가성비
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                testID="budget-moderate"
                activeOpacity={0.8}
                style={[
                  styles.radioButton,
                  budgetType === 'moderate' && styles.radioButtonActive,
                ]}
                onPress={() => setBudgetType('moderate')}
              >
                <Ionicons
                  name="card-outline"
                  size={18}
                  color={budgetType === 'moderate' ? '#4648D4' : '#64748B'}
                />
                <Text
                  style={[
                    styles.radioText,
                    budgetType === 'moderate' && styles.radioTextActive,
                  ]}
                >
                  적정 수준
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                testID="budget-luxury"
                activeOpacity={0.8}
                style={[
                  styles.radioButton,
                  budgetType === 'luxury' && styles.radioButtonActive,
                ]}
                onPress={() => setBudgetType('luxury')}
              >
                <Ionicons
                  name="diamond-outline"
                  size={18}
                  color={budgetType === 'luxury' ? '#4648D4' : '#64748B'}
                />
                <Text
                  style={[
                    styles.radioText,
                    budgetType === 'luxury' && styles.radioTextActive,
                  ]}
                >
                  럭셔리
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Shared Yeolo UI v1 AI Path Generation Button */}
        <GenerateCourseButton
          testID="submit-course-btn"
          label="AI 코스 생성하기"
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
    backgroundColor: '#F6FAFE',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
    gap: 6,
    marginBottom: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#4648D4',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000000',
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
    color: '#334155',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 13,
    color: '#0F172A',
  },
  inputFocused: {
    borderColor: '#4648D4',
    backgroundColor: '#EEF2FF',
  },
  calendarIconButton: {
    position: 'absolute',
    right: 10,
    padding: 4,
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  radioGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  radioButton: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    gap: 6,
  },
  radioButtonActive: {
    backgroundColor: '#EEF2FF',
    borderColor: '#4648D4',
  },
  radioText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  radioTextActive: {
    color: '#4648D4',
    fontWeight: '700',
  },
});

export default CourseCreateScreen;
