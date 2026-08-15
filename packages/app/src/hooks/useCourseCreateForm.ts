/**
 * @file useCourseCreateForm.ts
 * @description Custom hook for managing travel course creation form inputs, location autocomplete (API-LOC-1, API-LOC-2), and inline calendar state.
 */
import { useState, useRef, useEffect } from 'react';
import { ScrollView } from 'react-native';
import type {
  BudgetType,
  CourseCreateRequest,
  CountryAutocompleteItem,
  CityAutocompleteItem,
} from '@yeolo/common';
import {
  DATE_REGEX,
  formatYYYYMMDD,
  calculateTotalDays,
  fetchCountryAutocomplete,
  fetchCityAutocomplete,
} from '@yeolo/common';
import { APP_CONFIG } from '../constants';

const POPULAR_DESTINATIONS = [
  { flag: '🇯🇵', country: '일본', city: '도쿄' },
  { flag: '🇹🇭', country: '태국', city: '방콕' },
  { flag: '🇫🇷', country: '프랑스', city: '파리' },
  { flag: '🇻🇳', country: '베트남', city: '다낭' },
  { flag: '🇪🇸', country: '스페인', city: '바르셀로나' },
  { flag: '🇮🇹', country: '이탈리아', city: '로마' },
  { flag: '🇰🇷', country: '대한민국', city: '제주' },
];

export function useCourseCreateForm(
  onSubmit?: (data: CourseCreateRequest) => void,
) {
  const [destinationCountry, setDestinationCountryState] = useState('');
  const [destinationCity, setDestinationCityState] = useState('');

  const [validatedCountry, setValidatedCountry] = useState<string | null>(null);
  const [validatedCity, setValidatedCity] = useState<string | null>(null);
  const [validatedCityCountry, setValidatedCityCountry] = useState<
    string | null
  >(null);

  const [countrySuggestions, setCountrySuggestions] = useState<
    CountryAutocompleteItem[]
  >([]);
  const [citySuggestions, setCitySuggestions] = useState<
    CityAutocompleteItem[]
  >([]);

  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budgetType, setBudgetType] = useState<BudgetType | null>(null);

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [activeDateTarget, setActiveDateTarget] = useState<'start' | 'end'>(
    'start',
  );

  const todayDate = new Date();
  const [currentYearMonth, setCurrentYearMonth] = useState({
    year: todayDate.getFullYear(),
    month: todayDate.getMonth() + 1,
  });

  const scrollViewRef = useRef<ScrollView>(null);
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || APP_CONFIG.DEFAULT_API_URL;

  const setDestinationCountry = (text: string) => {
    setDestinationCountryState(text);
    if (validatedCountry !== text) {
      setValidatedCountry(null);
    }
    setDestinationCityState('');
    setValidatedCity(null);
    setValidatedCityCountry(null);
    setShowCountryDropdown(true);
    setShowCityDropdown(false);
  };

  const setDestinationCity = (text: string) => {
    setDestinationCityState(text);
    if (validatedCity !== text) {
      setValidatedCity(null);
    }
    setShowCityDropdown(true);
    setShowCountryDropdown(false);
  };

  // API-LOC-1: 국가 자동완성 API 연동
  useEffect(() => {
    if (!destinationCountry.trim()) {
      setCountrySuggestions([]);
      return;
    }
    let isSubscribed = true;
    fetchCountryAutocomplete(apiUrl, destinationCountry.trim())
      .then((res) => {
        if (isSubscribed) {
          if (res?.data?.countries) {
            setCountrySuggestions(res.data.countries);
          } else {
            setCountrySuggestions([]);
          }
        }
      })
      .catch(() => {
        if (isSubscribed) {
          setCountrySuggestions([]);
        }
      });
    return () => {
      isSubscribed = false;
    };
  }, [destinationCountry, apiUrl]);

  // API-LOC-2: 도시 자동완성 API 연동
  useEffect(() => {
    if (!destinationCity.trim()) {
      setCitySuggestions([]);
      return;
    }
    let isSubscribed = true;
    const countryFilter = destinationCountry.trim() || undefined;
    fetchCityAutocomplete(apiUrl, destinationCity.trim(), countryFilter)
      .then((res) => {
        if (isSubscribed) {
          if (res?.data?.cities) {
            setCitySuggestions(res.data.cities);
          } else {
            setCitySuggestions([]);
          }
        }
      })
      .catch(() => {
        if (isSubscribed) {
          setCitySuggestions([]);
        }
      });
    return () => {
      isSubscribed = false;
    };
  }, [destinationCity, destinationCountry, apiUrl]);

  useEffect(() => {
    if (isCalendarOpen) {
      const scrollTimer = setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return () => clearTimeout(scrollTimer);
    }
  }, [isCalendarOpen]);

  const handleSelectCountry = (country: CountryAutocompleteItem) => {
    setDestinationCountryState(country.countryNameKo);
    setValidatedCountry(country.countryNameKo);
    setDestinationCityState('');
    setValidatedCity(null);
    setValidatedCityCountry(null);
    setCountrySuggestions([]);
    setShowCountryDropdown(false);
  };

  const handleSelectCity = (city: CityAutocompleteItem) => {
    setDestinationCityState(city.cityNameKo);
    setValidatedCity(city.cityNameKo);
    if (city.countryNameKo) {
      setValidatedCityCountry(city.countryNameKo);
      setDestinationCountryState(city.countryNameKo);
      setValidatedCountry(city.countryNameKo);
    } else {
      setValidatedCityCountry(destinationCountry.trim());
    }
    setCitySuggestions([]);
    setShowCityDropdown(false);
  };

  const handleSelectPopularDestination = (country: string, city: string) => {
    setDestinationCountryState(country);
    setValidatedCountry(country);
    setDestinationCityState(city);
    setValidatedCity(city);
    setValidatedCityCountry(country);
    setShowCountryDropdown(false);
    setShowCityDropdown(false);
  };

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
      setCurrentYearMonth({
        year: now.getFullYear(),
        month: now.getMonth() + 1,
      });
    }

    setIsCalendarOpen(true);
  };

  const handlePrevMonth = () => {
    if (currentYearMonth.month === 1) {
      setCurrentYearMonth({ year: currentYearMonth.year - 1, month: 12 });
    } else {
      setCurrentYearMonth({
        year: currentYearMonth.year,
        month: currentYearMonth.month - 1,
      });
    }
  };

  const handleNextMonth = () => {
    if (currentYearMonth.month === 12) {
      setCurrentYearMonth({ year: currentYearMonth.year + 1, month: 1 });
    } else {
      setCurrentYearMonth({
        year: currentYearMonth.year,
        month: currentYearMonth.month + 1,
      });
    }
  };

  const handleSelectDay = (day: number) => {
    const mm = String(currentYearMonth.month).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    const dateStr = `${currentYearMonth.year}-${mm}-${dd}`;

    const now = new Date();
    const todayY = now.getFullYear();
    const todayM = String(now.getMonth() + 1).padStart(2, '0');
    const todayD = String(now.getDate()).padStart(2, '0');
    const todayStr = `${todayY}-${todayM}-${todayD}`;

    if (dateStr < todayStr) return;

    if (!startDate || (startDate && endDate) || dateStr < startDate) {
      setStartDate(dateStr);
      setEndDate('');
      setActiveDateTarget('end');
    } else {
      const days = calculateTotalDays(startDate, dateStr);
      if (days !== null && days >= 30) {
        return;
      }
      setEndDate(dateStr);
    }
  };

  const isCountryValid =
    destinationCountry.trim().length > 0 &&
    (validatedCountry === destinationCountry.trim() ||
      POPULAR_DESTINATIONS.some(
        (d) => d.country === destinationCountry.trim(),
      ) ||
      countrySuggestions.some(
        (c) => c.countryNameKo === destinationCountry.trim(),
      ));

  const isCityValid =
    destinationCity.trim().length > 0 &&
    isCountryValid &&
    ((validatedCity === destinationCity.trim() &&
      (!validatedCityCountry ||
        validatedCityCountry === destinationCountry.trim())) ||
      POPULAR_DESTINATIONS.some(
        (d) =>
          d.country === destinationCountry.trim() &&
          d.city === destinationCity.trim(),
      ) ||
      citySuggestions.some(
        (c) =>
          c.cityNameKo === destinationCity.trim() &&
          (c.countryNameKo === destinationCountry.trim() || !c.countryNameKo),
      ));

  const isStartDateValid = !startDate || DATE_REGEX.test(startDate.trim());
  const isEndDateValid =
    !endDate ||
    DATE_REGEX.test(endDate.trim()) ||
    (/^\d+$/.test(endDate.trim()) && Number(endDate.trim()) > 0);

  const calculatedDays = calculateTotalDays(startDate, endDate);

  const isFormValid =
    isCountryValid &&
    isCityValid &&
    startDate.trim().length > 0 &&
    isStartDateValid &&
    endDate.trim().length > 0 &&
    isEndDateValid &&
    calculatedDays !== null &&
    calculatedDays > 0 &&
    calculatedDays < 30 &&
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
