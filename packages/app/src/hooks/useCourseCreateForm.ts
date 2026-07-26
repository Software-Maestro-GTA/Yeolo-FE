/**
 * @file useCourseCreateForm.ts
 * @description Custom hook for managing travel course creation form inputs and inline calendar state.
 * @requirements REQ-7
 * @functional FUN-6
 * @author Antigravity Agent
 */
import { useState, useRef, useEffect } from 'react';
import { ScrollView } from 'react-native';
import type { BudgetType, CourseCreateRequest } from '@yeolo/common';
import { DATE_REGEX, formatYYYYMMDD, calculateTotalDays } from '@yeolo/common';

export function useCourseCreateForm(onSubmit?: (data: CourseCreateRequest) => void) {
  const [destinationCountry, setDestinationCountry] = useState('');
  const [destinationCity, setDestinationCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budgetType, setBudgetType] = useState<BudgetType | null>(null);

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [activeDateTarget, setActiveDateTarget] = useState<'start' | 'end'>('start');

  const todayDate = new Date();
  const [currentYearMonth, setCurrentYearMonth] = useState({
    year: todayDate.getFullYear(),
    month: todayDate.getMonth() + 1,
  });

  const scrollViewRef = useRef<ScrollView>(null);

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

  const isStartDateValid = !startDate || DATE_REGEX.test(startDate.trim());
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

  return {
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
  };
}
