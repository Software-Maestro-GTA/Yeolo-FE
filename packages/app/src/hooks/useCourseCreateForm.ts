/**
 * @file useCourseCreateForm.ts
 * @description Custom hook for managing travel course creation form inputs, location search/selection (API-LOC-1~3), numeric budget and validated travel dates (API-COURSE-1).
 */
import { useState, useEffect, useCallback } from 'react';
import type { CourseCreateRequest, CountryItem, CityItem } from '@yeolo/common';
import {
  DATE_REGEX,
  formatYYYYMMDD,
  calculateTotalDays,
  fetchCountriesApi,
  fetchCitiesApi,
  searchLocationsApi,
} from '@yeolo/common';
import { APP_CONFIG } from '../constants';

export interface CountrySuggestionItem {
  countryId?: string;
  countryName: string;
  countryNameKo: string;
}

export interface CitySuggestionItem {
  cityId?: string;
  cityName: string;
  cityNameKo: string;
  countryName?: string;
  countryNameKo?: string;
}

const POPULAR_DESTINATIONS = [
  { flag: '🇯🇵', country: '일본', city: '도쿄' },
  { flag: '🇹🇭', country: '태국', city: '방콕' },
  { flag: '🇫🇷', country: '프랑스', city: '파리' },
  { flag: '🇻🇳', country: '베트남', city: '다낭' },
  { flag: '🇪🇸', country: '스페인', city: '바르셀로나' },
  { flag: '🇮🇹', country: '이탈리아', city: '로마' },
  { flag: '🇰🇷', country: '대한민국', city: '제주' },
  { flag: '🇵🇹', country: '포르투갈', city: '리스본' },
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
    CountrySuggestionItem[]
  >([]);
  const [citySuggestions, setCitySuggestions] = useState<CitySuggestionItem[]>(
    [],
  );

  const [availableCountries, setAvailableCountries] = useState<CountryItem[]>(
    [],
  );
  const [availableCities, setAvailableCities] = useState<CityItem[]>([]);

  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudgetState] = useState<number>(
    APP_CONFIG.DEFAULT_COURSE_BUDGET,
  );
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || APP_CONFIG.DEFAULT_API_URL;

  const setBudget = useCallback((val: number) => {
    const clamped = Math.min(Math.max(Math.round(val), 500000), 10000000);
    setBudgetState(clamped);
  }, []);

  const loadCountries = useCallback(async () => {
    try {
      const res = await fetchCountriesApi(apiUrl);
      if (res?.data?.countries) {
        setAvailableCountries(res.data.countries);
      }
    } catch {
      // Ignore errors in background country list fetch
    }
  }, [apiUrl]);

  const loadCitiesForCountry = useCallback(
    async (countryName: string) => {
      if (!countryName.trim()) {
        setAvailableCities([]);
        return;
      }
      try {
        const res = await fetchCitiesApi(apiUrl, countryName.trim());
        if (res?.data?.cities) {
          setAvailableCities(res.data.cities);
        }
      } catch {
        setAvailableCities([]);
      }
    },
    [apiUrl],
  );

  const setDestinationCountry = (text: string) => {
    setDestinationCountryState(text);
    setCountrySuggestions([]);
    setCitySuggestions([]);
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
    setCitySuggestions([]);
    if (validatedCity !== text) {
      setValidatedCity(null);
    }
    setShowCityDropdown(true);
    setShowCountryDropdown(false);
  };

  // API-LOC-3: 국가 검색어 입력 시 통합 지역 검색 API 연동
  useEffect(() => {
    if (!destinationCountry.trim()) {
      setCountrySuggestions([]);
      return;
    }
    if (validatedCountry === destinationCountry.trim()) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      searchLocationsApi(apiUrl, destinationCountry.trim(), controller.signal)
        .then((res) => {
          if (!controller.signal.aborted) {
            const results = res?.data?.results || [];
            setCountrySuggestions(
              results.map((r) => ({
                countryName: r.countryName,
                countryNameKo: r.countryName,
              })),
            );
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setCountrySuggestions([]);
          }
        });
    }, APP_CONFIG.AUTOCOMPLETE_DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [destinationCountry, validatedCountry, apiUrl]);

  // API-LOC-3: 도시 검색어 입력 시 통합 지역 검색 API 연동
  useEffect(() => {
    if (!destinationCity.trim()) {
      setCitySuggestions([]);
      return;
    }
    if (validatedCity === destinationCity.trim()) return;
    const controller = new AbortController();
    const countryFilter = destinationCountry.trim() || undefined;
    const timer = setTimeout(() => {
      searchLocationsApi(apiUrl, destinationCity.trim(), controller.signal)
        .then((res) => {
          if (!controller.signal.aborted) {
            const results = res?.data?.results || [];
            const flattened: CitySuggestionItem[] = [];
            results.forEach((group) => {
              if (countryFilter && group.countryName !== countryFilter) {
                return;
              }
              (group.cities || []).forEach((c) => {
                flattened.push({
                  cityName: c.cityName,
                  cityNameKo: c.cityName,
                  countryName: group.countryName,
                  countryNameKo: group.countryName,
                });
              });
            });
            setCitySuggestions(flattened);
          }
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setCitySuggestions([]);
          }
        });
    }, APP_CONFIG.AUTOCOMPLETE_DEBOUNCE_MS);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [destinationCity, destinationCountry, validatedCity, apiUrl]);

  const handleSelectCountry = (country: CountrySuggestionItem) => {
    setDestinationCountryState(country.countryNameKo);
    setValidatedCountry(country.countryNameKo);
    setDestinationCityState('');
    setValidatedCity(null);
    setValidatedCityCountry(null);
    setCountrySuggestions([]);
    setShowCountryDropdown(false);
    void loadCitiesForCountry(country.countryNameKo);
  };

  const handleSelectCity = (city: CitySuggestionItem) => {
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

  const isCountryValid =
    destinationCountry.trim().length > 0 &&
    (validatedCountry === destinationCountry.trim() ||
      POPULAR_DESTINATIONS.some(
        (d) => d.country === destinationCountry.trim(),
      ) ||
      countrySuggestions.some(
        (c) => c.countryNameKo === destinationCountry.trim(),
      ) ||
      availableCountries.some(
        (c) => c.countryName === destinationCountry.trim(),
      ));

  const isKnownMismatchedCity =
    POPULAR_DESTINATIONS.some(
      (d) =>
        d.city === destinationCity.trim() &&
        d.country !== destinationCountry.trim(),
    ) ||
    citySuggestions.some(
      (c) =>
        c.cityNameKo === destinationCity.trim() &&
        c.countryNameKo &&
        c.countryNameKo !== destinationCountry.trim(),
    ) ||
    (validatedCityCountry !== null &&
      validatedCityCountry !== destinationCountry.trim());

  // API 목록에 없는 도시라도 사용자가 직접 입력한 도시명을 유효한 것으로 인정
  const isCityValid =
    destinationCity.trim().length > 0 &&
    isCountryValid &&
    !isKnownMismatchedCity;

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
    budget >= 500000;

  const handleSubmit = () => {
    if (!isFormValid || !calculatedDays) return;

    const requestData: CourseCreateRequest = {
      destinationCountry: destinationCountry.trim(),
      destinationCity: destinationCity.trim(),
      startDate: startDate.trim(),
      totalDays: calculatedDays,
      budget,
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
    availableCountries,
    availableCities,
    loadCountries,
    loadCitiesForCountry,
    showCountryDropdown,
    setShowCountryDropdown,
    showCityDropdown,
    setShowCityDropdown,
    handleSelectCountry,
    handleSelectCity,
    handleSelectPopularDestination,
    startDate,
    endDate,
    budget,
    setBudget,
    handleStartDateChange,
    handleEndDateChange,
    isStartDateValid,
    isEndDateValid,
    isFormValid,
    handleSubmit,
  };
}
