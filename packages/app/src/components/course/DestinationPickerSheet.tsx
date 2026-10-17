/**
 * @file DestinationPickerSheet.tsx
 * @description 선택 국가 위치에서 열리며 기기에 저장한 도시 즐겨찾기를 제공하는 여행지 선택 시트.
 */
import CloseSvg from '../../../assets/images/figma-course/close.svg';
import SearchSvg from '../../../assets/images/figma-course/search.svg';
import { useSheetEntrance } from '../../hooks/useSheetEntrance';
import { Text, TextInput } from '../common/Typography';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import {
  fetchCitiesApi,
  fetchCountriesApi,
  searchLocationsApi,
} from '@yeolo/common';
import { FigmaAsset } from '../common/FigmaAsset';
import { APP_CONFIG } from '../../constants';
import {
  COURSE_UI,
  COURSE_POPULAR_DESTINATIONS,
} from '../../constants/courseUiStrings';
import { palette, hexToRgba } from '../../theme/colors';
import { useDestinationFavorites } from '../../hooks/useDestinationFavorites';

const FAVORITES_CATEGORY = '__favorites__';
const destinationKey = ({ country, city }: { country: string; city: string }) =>
  JSON.stringify([country, city]);

interface DestinationPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (country: string, city: string) => void;
  initialCountry?: string;
}

interface CountryLayout {
  index: number;
  length: number;
  offset: number;
}

interface CountryRow {
  countryName: string;
  label?: string;
}

/** Measures the same wrapping and font sizes as visible rows once per list/width/text-scale combination. */
function CountryMeasurements({
  countries,
  onReady,
}: {
  countries: CountryRow[];
  onReady: (layouts: CountryLayout[]) => void;
}) {
  const heights = useRef(new Map<number, number>());
  const completed = useRef(false);
  return (
    <View
      style={styles.countryMeasurements}
      pointerEvents='none'
      accessibilityElementsHidden
      importantForAccessibility='no-hide-descendants'>
      {countries.map((item, index) => (
        <View
          key={item.countryName || 'popular'}
          testID={`destination-country-measure-${item.countryName || 'popular'}`}
          style={styles.countryRow}
          onLayout={({ nativeEvent }) => {
            if (completed.current || nativeEvent.layout.height <= 0) return;
            heights.current.set(index, nativeEvent.layout.height);
            if (heights.current.size !== countries.length) return;
            completed.current = true;
            let offset = 0;
            onReady(
              countries.map((_, rowIndex) => {
                const length = heights.current.get(rowIndex)!;
                const layout = { index: rowIndex, length, offset };
                offset += length;
                return layout;
              }),
            );
          }}>
          <Text style={styles.itemText}>{item.label ?? item.countryName}</Text>
        </View>
      ))}
    </View>
  );
}

/** Selects a curated or API-returned destination; stale searches never replace a newer query. */
export function DestinationPickerSheet({
  visible,
  onClose,
  onSelect,
  initialCountry = '',
}: DestinationPickerSheetProps) {
  const insets = useSafeAreaInsets();
  const { fontScale } = useWindowDimensions();
  const [sessionReady, setSessionReady] = useState(visible);
  const entranceStyle = useSheetEntrance(visible && sessionReady);
  const [country, setCountry] = useState(initialCountry);
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const favorites = useDestinationFavorites(visible);
  const favoriteKeys = new Set(favorites.favorites.map(destinationKey));
  const isFavoritesCategory = country === FAVORITES_CATEGORY;
  const [countryColumnWidth, setCountryColumnWidth] = useState(0);
  const [countryMeasurements, setCountryMeasurements] = useState<{
    key: string;
    layouts: CountryLayout[];
  } | null>(null);
  const cityListRef = useRef<FlatList<{ country: string; city: string }>>(null);
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || APP_CONFIG.DEFAULT_API_URL;
  useEffect(() => {
    setSessionReady(visible);
    if (visible) {
      setCountry(initialCountry);
      setKeyword('');
      setDebouncedKeyword('');
    }
  }, [visible, initialCountry]);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword.trim()), 250);
    return () => clearTimeout(timer);
  }, [keyword]);
  const countries = useQuery({
    queryKey: ['destination-countries', apiUrl],
    queryFn: () => fetchCountriesApi(apiUrl),
    enabled: visible,
    retry: false,
  });
  const cities = useQuery({
    queryKey: ['destination-cities', apiUrl, country],
    queryFn: () => fetchCitiesApi(apiUrl, country),
    enabled:
      visible && Boolean(country) && !isFavoritesCategory && !debouncedKeyword,
    retry: false,
  });
  const search = useQuery({
    queryKey: ['destination-search', apiUrl, debouncedKeyword],
    queryFn: ({ signal }) =>
      searchLocationsApi(apiUrl, debouncedKeyword, signal),
    enabled: visible && Boolean(debouncedKeyword),
    retry: false,
  });
  const isSearching = Boolean(keyword.trim());
  const showingFavorites = isFavoritesCategory && !isSearching;
  const currentQuery = isSearching ? search : country ? cities : countries;
  const isLoading = showingFavorites
    ? favorites.isLoading
    : currentQuery.isFetching || keyword.trim() !== debouncedKeyword;
  const hasError = showingFavorites
    ? favorites.error === 'load'
    : currentQuery.isError;
  const countryRows = useMemo<CountryRow[]>(
    () => [
      { countryName: '', label: COURSE_UI.POPULAR },
      { countryName: FAVORITES_CATEGORY, label: COURSE_UI.FAVORITES },
      ...[...(countries.data?.data.countries ?? [])].sort((a, b) =>
        a.countryName.localeCompare(b.countryName, 'ko'),
      ),
    ],
    [countries.data?.data.countries],
  );
  const measurementKey = JSON.stringify([
    countryColumnWidth,
    fontScale,
    countryRows.map((item) => item.countryName),
  ]);
  const latestMeasurementKey = useRef(measurementKey);
  useLayoutEffect(() => {
    latestMeasurementKey.current = measurementKey;
  }, [measurementKey]);
  const countryLayouts =
    countryMeasurements?.key === measurementKey
      ? countryMeasurements.layouts
      : undefined;
  const selectedCountryIndex = Math.max(
    0,
    countryRows.findIndex((item) => item.countryName === country),
  );
  const destinations = (
    isSearching
      ? (search.data?.data.results ?? []).flatMap((group) =>
          group.cities.map((city) => ({
            country: group.countryName,
            city: city.cityName,
          })),
        )
      : showingFavorites
        ? [...favorites.favorites]
        : country
          ? (cities.data?.data.cities ?? []).map((city) => ({
              country,
              city: city.cityName,
            }))
          : [...COURSE_POPULAR_DESTINATIONS]
  ).sort(
    (a, b) =>
      a.city.localeCompare(b.city, 'ko') ||
      a.country.localeCompare(b.country, 'ko'),
  );
  const insetStyle = StyleSheet.create({
    listContent: { paddingBottom: insets.bottom + 16 },
  });
  const select = (destination: { country: string; city: string }) => {
    Keyboard.dismiss();
    onSelect(destination.country, destination.city);
    onClose();
  };
  const scrollToInitial = (initial: string) => {
    const choseong = [
      'ㄱ',
      'ㄲ',
      'ㄴ',
      'ㄷ',
      'ㄸ',
      'ㄹ',
      'ㅁ',
      'ㅂ',
      'ㅃ',
      'ㅅ',
      'ㅆ',
      'ㅇ',
      'ㅈ',
      'ㅉ',
      'ㅊ',
      'ㅋ',
      'ㅌ',
      'ㅍ',
      'ㅎ',
    ];
    const index = destinations.findIndex(({ city }) => {
      const code = city.charCodeAt(0) - 0xac00;
      return (
        code >= 0 &&
        code <= 11171 &&
        choseong[Math.floor(code / 588)] === initial
      );
    });
    if (index >= 0)
      cityListRef.current?.scrollToIndex({ index, animated: true });
  };
  return (
    <Modal
      visible={visible && sessionReady}
      transparent
      animationType='fade'
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          testID='destination-sheet-backdrop'
          accessibilityLabel={COURSE_UI.CLOSE}
        />
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <Animated.View
            style={[styles.sheet, entranceStyle]}
            testID='destination-sheet'>
            <View style={styles.header}>
              <Text style={styles.title}>{COURSE_UI.DESTINATION_TITLE}</Text>
              <Pressable
                onPress={onClose}
                accessibilityRole='button'
                accessibilityLabel={COURSE_UI.CLOSE}
                style={styles.iconButton}>
                <FigmaAsset source={CloseSvg} width={24} height={24} />
              </Pressable>
            </View>
            <View style={styles.searchField}>
              <FigmaAsset source={SearchSvg} width={14.891} height={16.9999} />
              <TextInput
                testID='destination-search'
                style={styles.searchInput}
                value={keyword}
                onChangeText={setKeyword}
                placeholder={COURSE_UI.DESTINATION_SEARCH}
                placeholderTextColor={palette.mutedText}
                accessibilityLabel={COURSE_UI.DESTINATION_SEARCH}
              />
            </View>
            {favorites.error &&
              (!showingFavorites || favorites.error === 'save') && (
                <View style={styles.favoriteFeedback}>
                  <Text style={styles.feedbackText} accessibilityRole='alert'>
                    {favorites.error === 'load'
                      ? COURSE_UI.FAVORITES_LOAD_ERROR
                      : COURSE_UI.FAVORITES_SAVE_ERROR}
                  </Text>
                  {favorites.error === 'load' && (
                    <Pressable
                      accessibilityRole='button'
                      onPress={favorites.reload}
                      style={styles.retry}>
                      <Text style={styles.itemText}>{COURSE_UI.RETRY}</Text>
                    </Pressable>
                  )}
                </View>
              )}
            <View style={styles.columns}>
              {!isSearching && (
                <View
                  testID='destination-country-pane'
                  style={styles.countryPane}
                  onLayout={({ nativeEvent }) =>
                    setCountryColumnWidth(nativeEvent.layout.width)
                  }>
                  {visible && sessionReady && countryLayouts ? (
                    <FlatList
                      testID='destination-countries'
                      contentContainerStyle={insetStyle.listContent}
                      scrollIndicatorInsets={{ bottom: insets.bottom }}
                      data={countryRows}
                      initialScrollIndex={selectedCountryIndex}
                      getItemLayout={(_, index) => countryLayouts[index]}
                      keyExtractor={(item) => item.countryName || 'popular'}
                      keyboardShouldPersistTaps='handled'
                      ListFooterComponent={
                        countries.isError && country ? (
                          <View style={styles.feedback}>
                            <Text style={styles.feedbackText}>
                              {COURSE_UI.DESTINATION_ERROR}
                            </Text>
                            <Pressable
                              accessibilityRole='button'
                              onPress={() => countries.refetch()}
                              style={styles.retry}>
                              <Text style={styles.itemText}>
                                {COURSE_UI.RETRY}
                              </Text>
                            </Pressable>
                          </View>
                        ) : null
                      }
                      renderItem={({ item }) => (
                        <Pressable
                          testID={`destination-country-${item.countryName || 'popular'}`}
                          style={[
                            styles.countryRow,
                            country === item.countryName &&
                              styles.selectedCountry,
                          ]}
                          accessibilityRole='button'
                          accessibilityState={{
                            selected: country === item.countryName,
                          }}
                          onPress={() => setCountry(item.countryName)}>
                          <Text style={styles.itemText}>
                            {item.label ?? item.countryName}
                          </Text>
                        </Pressable>
                      )}
                    />
                  ) : (
                    <>
                      <ActivityIndicator
                        style={styles.feedback}
                        color={palette.primary}
                      />
                      {visible &&
                        (countries.data || countries.isError) &&
                        countryColumnWidth > 0 && (
                          <CountryMeasurements
                            key={measurementKey}
                            countries={countryRows}
                            onReady={(layouts) => {
                              if (
                                latestMeasurementKey.current === measurementKey
                              ) {
                                setCountryMeasurements({
                                  key: measurementKey,
                                  layouts,
                                });
                              }
                            }}
                          />
                        )}
                    </>
                  )}
                </View>
              )}
              <View style={styles.cityPane}>
                {isLoading ? (
                  <ActivityIndicator
                    style={styles.feedback}
                    color={palette.primary}
                  />
                ) : hasError ? (
                  <View style={styles.feedback}>
                    <Text style={styles.feedbackText}>
                      {showingFavorites
                        ? COURSE_UI.FAVORITES_LOAD_ERROR
                        : COURSE_UI.DESTINATION_ERROR}
                    </Text>
                    <Pressable
                      accessibilityRole='button'
                      onPress={() =>
                        showingFavorites
                          ? favorites.reload()
                          : currentQuery.refetch()
                      }
                      style={styles.retry}>
                      <Text style={styles.itemText}>{COURSE_UI.RETRY}</Text>
                    </Pressable>
                  </View>
                ) : (
                  <FlatList
                    ref={cityListRef}
                    testID='destination-cities'
                    contentContainerStyle={insetStyle.listContent}
                    scrollIndicatorInsets={{ bottom: insets.bottom }}
                    data={destinations}
                    keyboardShouldPersistTaps='handled'
                    keyExtractor={destinationKey}
                    extraData={favorites}
                    getItemLayout={(_, index) => ({
                      length: 52,
                      offset: 52 * index,
                      index,
                    })}
                    ListEmptyComponent={
                      <Text style={styles.feedbackText}>
                        {showingFavorites
                          ? COURSE_UI.FAVORITES_EMPTY
                          : COURSE_UI.DESTINATION_EMPTY}
                      </Text>
                    }
                    renderItem={({ item }) => (
                      <View style={styles.cityRow}>
                        <Pressable
                          testID={`destination-favorite-${destinationKey(item)}`}
                          accessibilityRole='button'
                          accessibilityLabel={`${item.country} ${item.city} ${favoriteKeys.has(destinationKey(item)) ? COURSE_UI.FAVORITE_REMOVE : COURSE_UI.FAVORITE_ADD}`}
                          accessibilityState={{
                            selected: favoriteKeys.has(destinationKey(item)),
                          }}
                          disabled={
                            favorites.isLoading ||
                            favorites.isSaving ||
                            favorites.error === 'load'
                          }
                          style={styles.favoriteButton}
                          onPress={() => void favorites.toggle(item)}>
                          <Svg
                            width={16.168}
                            height={15.3766}
                            viewBox='0 0 16.168 15.3766'
                            accessible={false}
                            pointerEvents='none'>
                            <Path
                              d='M8.08398 0L10.8818 4.64908L16.168 5.87336L12.611 9.97092L13.0802 15.3766L8.08398 13.26L3.08781 15.3766L3.55695 9.97092L0 5.87336L5.28612 4.64908L8.08398 0Z'
                              fill={
                                favoriteKeys.has(destinationKey(item))
                                  ? palette.primary
                                  : palette.gray300
                              }
                            />
                          </Svg>
                        </Pressable>
                        <Pressable
                          testID={`destination-city-${item.city}`}
                          accessibilityRole='button'
                          accessibilityLabel={`${item.country} ${item.city}`}
                          style={styles.citySelectButton}
                          onPress={() => select(item)}>
                          <Text style={styles.itemText} numberOfLines={2}>
                            {isSearching || showingFavorites
                              ? `${item.country} · ${item.city}`
                              : item.city}
                          </Text>
                        </Pressable>
                      </View>
                    )}
                  />
                )}
                {!isSearching && destinations.length > 7 && (
                  <View style={styles.alphabet}>
                    {COURSE_UI.ALPHABET.map((initial) => (
                      <Pressable
                        key={initial}
                        accessibilityRole='button'
                        accessibilityLabel={`${initial} ${COURSE_UI.CITY_INITIAL}`}
                        onPress={() => scrollToInitial(initial)}
                        style={styles.alphabetButton}>
                        <Text style={styles.alphabetText}>{initial}</Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>
            </View>
          </Animated.View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: hexToRgba(palette.deepNavy, 0.6),
  },
  sheet: {
    height: '82%',
    backgroundColor: palette.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    minHeight: 65,
    paddingLeft: 25,
    paddingRight: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 16, fontWeight: '600', color: palette.deepNavy },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchField: {
    marginHorizontal: 20,
    marginBottom: 20,
    minHeight: 54,
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: palette.gray100,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: palette.deepNavy,
    paddingVertical: 16,
  },
  columns: {
    flex: 1,
    flexDirection: 'row',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: palette.gray200,
  },
  countryPane: { width: '41.5%', overflow: 'hidden' },
  countryMeasurements: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    opacity: 0,
  },
  countryRow: {
    minHeight: 58,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  selectedCountry: { backgroundColor: palette.gray100 },
  cityPane: { flex: 1, backgroundColor: palette.gray100 },
  cityRow: {
    height: 52,
    paddingLeft: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  favoriteButton: {
    width: 44,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  citySelectButton: {
    flex: 1,
    height: 52,
    paddingRight: 26,
    justifyContent: 'center',
  },
  favoriteFeedback: { paddingHorizontal: 20, paddingBottom: 12 },
  itemText: { fontSize: 16, color: palette.deepNavy, flexShrink: 1 },
  feedback: { padding: 20, gap: 12 },
  feedbackText: { color: palette.subText, fontSize: 14, padding: 12 },
  retry: { padding: 12, backgroundColor: palette.white, borderRadius: 12 },
  alphabet: {
    position: 'absolute',
    right: 0,
    top: 48,
    backgroundColor: palette.white,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
  },
  alphabetButton: {
    width: 28,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alphabetText: { fontSize: 14, color: palette.subText },
});
