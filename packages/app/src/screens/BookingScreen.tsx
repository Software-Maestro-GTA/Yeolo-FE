/**
 * @file BookingScreen.tsx
 * @description Context-aware MRT booking search, user-selected products and affiliate navigation.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  ImageBackground,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useBackground } from '../context';
import { useGA4ScreenTracking } from '../hooks';
import {
  MyRealTripError,
  type BookingKind,
  type BookingProduct,
} from '@yeolo/common';
import {
  myRealTrip,
  isBookingDate,
  type BookingContext,
} from '../services/bookingService';
import { APP_CONFIG } from '../constants/config';
import { UI_STRINGS } from '../constants/strings';
import { palette } from '../theme/colors';

const S = UI_STRINGS.BOOKING;
type Choice = { id: string; label: string; product?: BookingProduct };
type AirportTarget = 'departure' | 'arrival';
type FieldType = 'text' | 'number' | 'date';
type HotelQuery = {
  regionId: number;
  checkIn: string;
  checkOut: string;
  adultCount: number;
};

const formatBookingDateInput = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  return [digits.slice(0, 4), digits.slice(4, 6), digits.slice(6, 8)]
    .filter(Boolean)
    .join('-');
};

interface Props {
  kind: BookingKind;
  context?: BookingContext;
  onBack: () => void;
}

/** Mount per booking session so closing or changing screens discards stale requests and results. */
export function BookingScreen({ kind, context = {}, onBack }: Props) {
  useGA4ScreenTracking('BookingScreen');
  const { setBackground, resetBackground } = useBackground();
  const insets = useSafeAreaInsets();
  const [headerHeight, setHeaderHeight] = useState(64);
  useEffect(() => {
    // BackgroundImageLayout owns the top inset; do not add a second safe area here.
    setBackground({ noTopEdges: false });
    return resetBackground;
  }, [setBackground, resetBackground]);
  const [keyword, setKeyword] = useState(context.keyword || '');
  const [departure, setDeparture] = useState('');
  const [depCode, setDepCode] = useState('');
  const [arrCode, setArrCode] = useState('');
  const [regionId, setRegionId] = useState<number>();
  const [domestic, setDomestic] = useState(
    ['대한민국', '한국', 'KR'].includes(context.country || ''),
  );
  const [start, setStart] = useState(context.startDate || '');
  const [end, setEnd] = useState(context.endDate || '');
  const [adults, setAdults] = useState('1');
  const [choices, setChoices] = useState<Choice[]>([]);
  const [regionChoices, setRegionChoices] = useState<Choice[]>([]);
  const [regionSearch, setRegionSearch] = useState<string | null>(null);
  const [selectedHotelUrl, setSelectedHotelUrl] = useState<string>();
  const [productsSearched, setProductsSearched] = useState(false);
  const [productsTotalCount, setProductsTotalCount] = useState(0);
  const [formCollapsed, setFormCollapsed] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [pageError, setPageError] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [airportChoices, setAirportChoices] = useState<Choice[]>([]);
  const [airportSearch, setAirportSearch] = useState<{
    target: AirportTarget;
    query: string;
  } | null>(null);
  const [message, setMessage] = useState('');
  const [flightFallback, setFlightFallback] = useState(false);
  const [busy, setBusy] = useState(false);
  const active = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const airportTouched = useRef({ departure: false, arrival: false });
  const regionTouched = useRef(false);
  const listRef = useRef<FlatList<Choice>>(null);
  const hotelQuery = useRef<HotelQuery | null>(null);
  const ticketQuery = useRef<string | null>(null);
  const resultPage = useRef(0);
  const hasMoreResults = useRef(false);
  const pageController = useRef<AbortController | null>(null);
  const resultsVersion = useRef(0);
  const hasScrolledResults = useRef(false);
  const autoSearchStarted = useRef(false);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      active.current?.abort();
      pageController.current?.abort();
    };
  }, []);

  useEffect(() => {
    if (kind !== 'flight') return;
    const controller = new AbortController();
    const preselect = async (target: AirportTarget, query: string) => {
      if (!query.trim()) return;
      try {
        const airports = await myRealTrip.searchAirports(
          query,
          controller.signal,
        );
        const airport =
          (target === 'departure'
            ? airports.find(({ airport: item }) => item.code === 'ICN')
            : undefined) || airports[0];
        if (
          !airport ||
          controller.signal.aborted ||
          airportTouched.current[target]
        )
          return;
        const { code, koName, enName } = airport.airport;
        const label = `${koName || enName || code} (${code})`;
        if (target === 'departure') {
          setDeparture(label);
          setDepCode(code);
        } else {
          setKeyword(label);
          setArrCode(code);
        }
      } catch {
        // The user can still search and select an airport manually.
      }
    };
    void preselect('departure', '인천');
    void preselect('arrival', context.keyword || '');
    return () => controller.abort();
  }, [kind, context.keyword]);

  useEffect(() => {
    if (kind !== 'hotel' || !context.keyword?.trim()) return;
    const controller = new AbortController();
    void myRealTrip
      .searchRegions(context.keyword.trim(), domestic, controller.signal)
      .then((regions) => {
        const region = regions[0];
        if (!region || controller.signal.aborted || regionTouched.current)
          return;
        setRegionId(region.regionId);
        setKeyword([region.name, region.subName].filter(Boolean).join(' · '));
      })
      .catch(() => {
        // The location input remains available when the initial lookup fails.
      });
    return () => controller.abort();
  }, [kind, context.keyword]);

  useEffect(() => {
    if (regionSearch === null || !regionSearch.trim()) {
      setRegionChoices([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const regions = await myRealTrip.searchRegions(
          regionSearch.trim(),
          domestic,
          controller.signal,
        );
        if (controller.signal.aborted) return;
        setRegionChoices(
          regions.map((region) => ({
            id: String(region.regionId),
            label: [region.name, region.subName].filter(Boolean).join(' · '),
          })),
        );
      } catch {
        if (!controller.signal.aborted) setRegionChoices([]);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [regionSearch, domestic]);

  useEffect(() => {
    if (!airportSearch?.query.trim()) {
      setAirportChoices([]);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const airports = await myRealTrip.searchAirports(
          airportSearch.query.trim(),
          controller.signal,
        );
        if (controller.signal.aborted) return;
        setAirportChoices(
          airports.map(({ airport }) => ({
            id: airport.code,
            label: `${airport.koName || airport.enName || airport.code} (${airport.code})`,
          })),
        );
      } catch {
        if (!controller.signal.aborted) setAirportChoices([]);
      }
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [airportSearch]);

  const clearResults = () => {
    resultsVersion.current += 1;
    pageController.current?.abort();
    pageController.current = null;
    hotelQuery.current = null;
    ticketQuery.current = null;
    hasMoreResults.current = false;
    resultPage.current = 0;
    hasScrolledResults.current = false;
    setChoices([]);
    setSelectedHotelUrl(undefined);
    setProductsSearched(false);
    setProductsTotalCount(0);
    setFormCollapsed(false);
    setLoadingMore(false);
    setPageError(false);
    setMessage('');
    setFlightFallback(false);
  };
  const close = () => {
    active.current?.abort();
    onBack();
  };
  const run = async (action: (signal: AbortSignal) => Promise<void>) => {
    if (active.current) return;
    const controller = new AbortController();
    active.current = controller;
    setBusy(true);
    setMessage('');
    try {
      await action(controller.signal);
    } catch (error) {
      if (mounted.current && !controller.signal.aborted) {
        if (
          kind === 'flight' &&
          error instanceof MyRealTripError &&
          error.status === 400
        ) {
          setFlightFallback(true);
          setMessage(S.FLIGHT_UNAVAILABLE);
          return;
        }
        setMessage(
          error instanceof MyRealTripError && error.code === 'configuration'
            ? S.UNAVAILABLE
            : error instanceof MyRealTripError && error.status === 429
              ? S.RATE_LIMIT
              : S.ERROR,
        );
      }
    } finally {
      if (mounted.current) setBusy(false);
      if (active.current === controller) active.current = null;
    }
  };
  const showChoices = (items: Choice[], signal: AbortSignal) => {
    if (signal.aborted || !mounted.current) return;
    setChoices(items);
    setMessage(items.length ? '' : S.EMPTY);
  };
  const openLink = async (url: string, signal: AbortSignal) => {
    if (signal.aborted || !mounted.current) return;
    try {
      await Linking.openURL(url);
    } catch {
      if (mounted.current) setMessage(S.OPEN_ERROR);
    }
  };
  const search = () => {
    const count = Number(adults);
    if (kind === 'ticket' && !keyword.trim()) {
      setMessage(S.KEYWORD_REQUIRED);
      return;
    }
    if (
      kind !== 'ticket' &&
      (!isBookingDate(start) ||
        !isBookingDate(end) ||
        !/^\d+$/.test(adults) ||
        !Number.isSafeInteger(count) ||
        count < 1 ||
        (kind === 'hotel'
          ? !regionId || end <= start
          : !depCode || !arrCode || depCode === arrCode || end < start))
    ) {
      setMessage(S.INVALID);
      return;
    }
    clearResults();
    Keyboard.dismiss();
    void run(async (signal) => {
      if (kind === 'flight') {
        const url = await myRealTrip.createFlightLink(
          {
            depAirportCd: depCode,
            arrAirportCd: arrCode,
            depDate: start,
            arrDate: end,
            adult: count,
          },
          signal,
        );
        await openLink(url, signal);
      } else {
        const query: HotelQuery | null =
          kind === 'hotel'
            ? {
                regionId: regionId!,
                checkIn: start,
                checkOut: end,
                adultCount: count,
              }
            : null;
        const pageResult =
          kind === 'hotel'
            ? await myRealTrip.searchHotels(query!, signal)
            : await myRealTrip.searchTicketPage(keyword, 1, signal);
        const found = pageResult.items.map((p) => ({
          id: p.productUrl,
          label: p.itemName,
          product: p,
        }));
        if (!signal.aborted) {
          if (kind === 'hotel') {
            hotelQuery.current = query;
            if (found.length) setSelectedHotelUrl(found[0].id);
          } else {
            ticketQuery.current = keyword.trim();
          }
          hasMoreResults.current = pageResult.hasMore;
          resultPage.current = pageResult.page;
          setProductsSearched(true);
          setProductsTotalCount(pageResult.totalCount);
          setFormCollapsed(true);
        }
        showChoices(found, signal);
      }
    });
  };
  useEffect(() => {
    if (kind !== 'ticket' || !context.autoSearch || !context.keyword?.trim())
      return;
    const timer = setTimeout(() => {
      if (autoSearchStarted.current) return;
      autoSearchStarted.current = true;
      search();
    }, 0);
    return () => clearTimeout(timer);
  }, [kind, context.autoSearch, context.keyword]);
  const loadMoreProducts = (retry = false) => {
    if (
      kind === 'flight' ||
      (kind === 'hotel' ? !hotelQuery.current : !ticketQuery.current) ||
      !hasMoreResults.current ||
      pageController.current ||
      active.current ||
      (!hasScrolledResults.current && !retry) ||
      (pageError && !retry)
    )
      return;
    const controller = new AbortController();
    const version = resultsVersion.current;
    const nextPage = resultPage.current + 1;
    pageController.current = controller;
    setLoadingMore(true);
    void (
      kind === 'hotel'
        ? myRealTrip.searchHotels(
            { ...hotelQuery.current!, page: nextPage },
            controller.signal,
          )
        : myRealTrip.searchTicketPage(
            ticketQuery.current!,
            nextPage,
            controller.signal,
          )
    )
      .then((result) => {
        if (
          controller.signal.aborted ||
          !mounted.current ||
          version !== resultsVersion.current
        )
          return;
        resultPage.current = result.page;
        hasMoreResults.current = result.hasMore;
        setChoices((current) => {
          const seen = new Set(current.map((item) => item.id));
          const additional = result.items
            .filter((product) => !seen.has(product.productUrl))
            .map((product) => ({
              id: product.productUrl,
              label: product.itemName,
              product,
            }));
          return [...current, ...additional];
        });
      })
      .catch(() => {
        if (
          !controller.signal.aborted &&
          mounted.current &&
          version === resultsVersion.current
        )
          setPageError(true);
      })
      .finally(() => {
        if (pageController.current === controller) {
          pageController.current = null;
          if (mounted.current) setLoadingMore(false);
        }
      });
  };
  const choose = (item: Choice) => {
    if (active.current) return;
    if (item.product) {
      if (kind === 'hotel') setSelectedHotelUrl(item.id);
      void run(async (signal) => {
        await openLink(
          await myRealTrip.createLink(item.product!.productUrl, signal),
          signal,
        );
      });
      return;
    }
  };
  const chooseRegion = (item: Choice) => {
    regionTouched.current = true;
    setRegionId(Number(item.id));
    setKeyword(item.label);
    setRegionSearch(null);
    setRegionChoices([]);
    clearResults();
    Keyboard.dismiss();
  };
  const chooseAirport = (item: Choice) => {
    if (airportSearch?.target === 'departure') {
      airportTouched.current.departure = true;
      setDeparture(item.label);
      setDepCode(item.id);
    } else {
      airportTouched.current.arrival = true;
      setKeyword(item.label);
      setArrCode(item.id);
    }
    setAirportSearch(null);
    setAirportChoices([]);
    setMessage('');
  };
  const airportField = (
    target: AirportTarget,
    label: string,
    value: string,
  ) => (
    <View style={styles.halfField}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholder={label}
        placeholderTextColor={palette.mutedText}
        style={styles.input}
        value={value}
        editable={!busy}
        autoCapitalize='none'
        onFocus={() =>
          setAirportSearch({
            target,
            query: value.replace(/ \([A-Z]{3}\)$/, ''),
          })
        }
        onChangeText={(next) => {
          airportTouched.current[target] = true;
          clearResults();
          if (target === 'departure') {
            setDeparture(next);
            setDepCode('');
          } else {
            setKeyword(next);
            setArrCode('');
          }
          setAirportChoices([]);
          setAirportSearch({ target, query: next });
        }}
      />
    </View>
  );
  const field = (
    label: string,
    value: string,
    change: (value: string) => void,
    type: FieldType = 'text',
  ) => (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholder={label}
        placeholderTextColor={palette.mutedText}
        accessibilityLabel={label}
        style={styles.input}
        value={value}
        editable={!busy}
        maxLength={type === 'date' ? 10 : 100}
        autoCapitalize='none'
        keyboardType={type === 'text' ? 'default' : 'number-pad'}
        onChangeText={(value) => {
          clearResults();
          change(
            type === 'date'
              ? formatBookingDateInput(value)
              : type === 'number'
                ? value.replace(/\D/g, '')
                : value,
          );
        }}
      />
    </View>
  );
  const button = (label: string, action: () => void, testID?: string) => (
    <TouchableOpacity
      testID={testID}
      accessibilityRole='button'
      accessibilityState={{ disabled: busy }}
      disabled={busy}
      onPress={action}
      activeOpacity={0.8}
      style={[
        styles.button,
        testID !== 'booking-search' && styles.secondaryButton,
        busy && styles.disabled,
      ]}>
      {testID === 'booking-search' ? (
        <LinearGradient
          colors={[palette.primary, palette.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.primaryButtonContent}>
          <Ionicons name='search-outline' size={18} color={palette.white} />
          <Text style={styles.buttonText}>{label}</Text>
          <Ionicons name='arrow-forward' size={18} color={palette.white} />
        </LinearGradient>
      ) : (
        <Text style={styles.secondaryButtonText}>{label}</Text>
      )}
    </TouchableOpacity>
  );
  const productResults = kind !== 'flight' && productsSearched && (
    <View
      testID={
        kind === 'hotel' ? 'hotel-results-section' : 'ticket-results-section'
      }
      style={styles.hotelResultsSection}>
      <View style={styles.resultsHeading}>
        <Text style={styles.sectionTitle}>
          {kind === 'hotel' ? S.HOTEL_RESULTS : S.TICKET_RESULTS}
        </Text>
        <Text style={styles.resultsCount}>
          {productsTotalCount}
          {kind === 'hotel' ? S.HOTEL_COUNT : S.TICKET_COUNT}
        </Text>
      </View>
      <Text style={styles.note}>{S.PRICE_NOTE}</Text>
      {!!message && (
        <Text accessibilityRole='alert' style={styles.note}>
          {message}
        </Text>
      )}
    </View>
  );
  const ticketCardContent = (item: Choice) => (
    <LinearGradient
      colors={
        item.product?.imageUrl
          ? ['transparent', 'rgba(4, 25, 42, 0.94)']
          : [palette.darkTeal, palette.deepNavy]
      }
      style={styles.ticketOverlay}>
      <Text style={styles.hotelName} numberOfLines={2}>
        {item.label}
      </Text>
      {!!item.product?.description && (
        <Text style={styles.ticketDescription} numberOfLines={2}>
          {item.product.description}
        </Text>
      )}
      <View style={styles.hotelDetails}>
        {item.product?.reviewScore != null && (
          <Text style={styles.hotelDetail}>★ {item.product.reviewScore}</Text>
        )}
        {Number.isInteger(item.product?.reviewCount) && (
          <Text style={styles.hotelDetail}>
            {S.HOTEL_REVIEWS} {item.product!.reviewCount!.toLocaleString()}
          </Text>
        )}
      </View>
      {Array.isArray(item.product?.tags) && item.product.tags.length > 0 && (
        <View style={styles.ticketTags}>
          {item.product.tags
            .filter((tag): tag is string => typeof tag === 'string')
            .slice(0, 3)
            .map((tag) => (
              <Text key={tag} style={styles.ticketTag}>
                {tag}
              </Text>
            ))}
        </View>
      )}
      <Text style={styles.hotelPrice}>
        {S.TICKET_START_PRICE} ₩{item.product?.salePrice.toLocaleString()}
      </Text>
    </LinearGradient>
  );
  return (
    <View style={styles.screen} testID={`booking-screen-${kind}`}>
      <StatusBar barStyle='dark-content' />
      <View
        style={styles.header}
        onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}>
        <TouchableOpacity
          accessibilityRole='button'
          accessibilityLabel={S.BACK}
          onPress={close}
          style={styles.backButton}>
          <Ionicons name='chevron-back' size={22} color={palette.deepNavy} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{S.TITLE}</Text>
        <View style={styles.headerSpacer} />
      </View>
      <KeyboardAvoidingView
        style={styles.content}
        keyboardVerticalOffset={insets.top + headerHeight}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          testID='booking-results-list'
          ref={listRef}
          data={choices}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps='handled'
          keyboardDismissMode='on-drag'
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          onScroll={(event) => {
            const offset = event.nativeEvent.contentOffset.y;
            if (offset > 20) hasScrolledResults.current = true;
            setShowScrollTop(offset > 260);
          }}
          scrollEventThrottle={100}
          onEndReached={
            kind !== 'flight' ? () => loadMoreProducts() : undefined
          }
          onEndReachedThreshold={0.4}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <LinearGradient
                colors={[palette.lightTeal, palette.softMint]}
                style={styles.hero}>
                <View style={styles.heroTop}>
                  <View style={styles.heroIcon}>
                    <Ionicons
                      name={
                        kind === 'flight'
                          ? 'airplane-outline'
                          : kind === 'hotel'
                            ? 'bed-outline'
                            : 'ticket-outline'
                      }
                      size={26}
                      color={palette.primary}
                    />
                  </View>
                  <Text style={styles.partner}>{S.PARTNER}</Text>
                </View>
                <Text style={styles.title}>
                  {kind === 'flight'
                    ? S.FLIGHT
                    : kind === 'hotel'
                      ? S.HOTEL
                      : S.TICKET}
                </Text>
                <Text style={styles.subtitle}>
                  {kind === 'flight'
                    ? S.FLIGHT_HINT
                    : kind === 'hotel'
                      ? S.HOTEL_HINT
                      : S.TICKET_HINT}
                </Text>
              </LinearGradient>
              <View testID='booking-form' style={styles.form}>
                <View style={styles.sectionHeading}>
                  <Ionicons
                    name='options-outline'
                    size={18}
                    color={palette.accent}
                  />
                  <Text style={styles.sectionTitle}>{S.SEARCH_CONDITIONS}</Text>
                  {kind !== 'flight' && productsSearched && (
                    <TouchableOpacity
                      testID={`${kind}-toggle-form`}
                      accessibilityRole='button'
                      accessibilityLabel={
                        formCollapsed ? S.EDIT_SEARCH : S.COLLAPSE_SEARCH
                      }
                      onPress={() => setFormCollapsed((value) => !value)}
                      style={styles.formToggle}>
                      <Text style={styles.formToggleText}>
                        {formCollapsed ? S.EDIT_SEARCH : S.COLLAPSE_SEARCH}
                      </Text>
                      <Ionicons
                        name={formCollapsed ? 'chevron-down' : 'chevron-up'}
                        size={16}
                        color={palette.primary}
                      />
                    </TouchableOpacity>
                  )}
                </View>
                {kind !== 'flight' && formCollapsed ? (
                  <Text
                    testID={`${kind}-search-summary`}
                    style={styles.summary}>
                    {kind === 'hotel'
                      ? `${keyword} · ${start} ~ ${end} · ${adults}${S.ADULTS_SUFFIX}`
                      : keyword}
                  </Text>
                ) : (
                  <>
                    {kind === 'flight' && (
                      <View style={styles.airportSection}>
                        <View testID='booking-airport-row' style={styles.row}>
                          {airportField('departure', S.DEPARTURE, departure)}
                          {airportField('arrival', S.ARRIVAL, keyword)}
                        </View>
                        {!!airportSearch && airportChoices.length > 0 && (
                          <View
                            testID='airport-suggestion-viewport'
                            style={[
                              styles.airportSuggestions,
                              airportChoices.length === 1
                                ? styles.airportSuggestionsOne
                                : airportChoices.length === 2
                                  ? styles.airportSuggestionsTwo
                                  : airportChoices.length === 3
                                    ? styles.airportSuggestionsThree
                                    : styles.airportSuggestionsMany,
                            ]}>
                            <FlatList
                              testID='airport-suggestion-list'
                              data={airportChoices}
                              keyExtractor={(item) => item.id}
                              style={styles.airportSuggestionsList}
                              scrollEnabled
                              nestedScrollEnabled
                              keyboardShouldPersistTaps='always'
                              initialNumToRender={4}
                              maxToRenderPerBatch={4}
                              renderItem={({ item }) => (
                                <TouchableOpacity
                                  testID={`airport-suggestion-${item.id}`}
                                  accessibilityRole='button'
                                  onPress={() => chooseAirport(item)}
                                  style={styles.airportSuggestion}>
                                  <Text style={styles.label}>{item.label}</Text>
                                </TouchableOpacity>
                              )}
                            />
                          </View>
                        )}
                      </View>
                    )}
                    {kind === 'hotel' && (
                      <>
                        <View style={styles.airportSection}>
                          <View style={styles.field}>
                            <Text style={styles.label}>{S.HOTEL_LOCATION}</Text>
                            <TextInput
                              accessibilityLabel={S.HOTEL_LOCATION}
                              placeholder={S.HOTEL_LOCATION}
                              placeholderTextColor={palette.mutedText}
                              style={styles.input}
                              value={keyword}
                              editable={!busy}
                              onFocus={() => {
                                setRegionSearch(keyword.split(' · ')[0]);
                                requestAnimationFrame(() => {
                                  listRef.current?.scrollToEnd({
                                    animated: true,
                                  });
                                });
                              }}
                              onChangeText={(value) => {
                                regionTouched.current = true;
                                setKeyword(value);
                                setRegionId(undefined);
                                setRegionChoices([]);
                                setRegionSearch(value);
                                clearResults();
                              }}
                            />
                          </View>
                          {regionSearch !== null &&
                            regionChoices.length > 0 && (
                              <View
                                testID='hotel-region-suggestion-viewport'
                                style={[
                                  styles.airportSuggestions,
                                  regionChoices.length === 1
                                    ? styles.airportSuggestionsOne
                                    : regionChoices.length === 2
                                      ? styles.airportSuggestionsTwo
                                      : regionChoices.length === 3
                                        ? styles.airportSuggestionsThree
                                        : styles.airportSuggestionsMany,
                                ]}>
                                <FlatList
                                  testID='hotel-region-suggestion-list'
                                  data={regionChoices}
                                  keyExtractor={(item) => item.id}
                                  style={styles.airportSuggestionsList}
                                  scrollEnabled
                                  nestedScrollEnabled
                                  keyboardShouldPersistTaps='always'
                                  initialNumToRender={4}
                                  maxToRenderPerBatch={4}
                                  renderItem={({ item }) => (
                                    <TouchableOpacity
                                      testID={`hotel-region-choice-${item.id}`}
                                      accessibilityRole='button'
                                      onPress={() => chooseRegion(item)}
                                      style={styles.airportSuggestion}>
                                      <Text style={styles.label}>
                                        {item.label}
                                      </Text>
                                    </TouchableOpacity>
                                  )}
                                />
                              </View>
                            )}
                        </View>
                        <View style={styles.row}>
                          {[true, false].map((value) => (
                            <TouchableOpacity
                              key={String(value)}
                              accessibilityRole='radio'
                              accessibilityState={{
                                checked: domestic === value,
                                disabled: busy,
                              }}
                              disabled={busy}
                              style={[
                                styles.option,
                                domestic === value && styles.selected,
                              ]}
                              onPress={() => {
                                regionTouched.current = true;
                                setDomestic(value);
                                setRegionId(undefined);
                                setRegionChoices([]);
                                setRegionSearch(keyword.split(' · ')[0]);
                                clearResults();
                              }}>
                              <Text style={styles.label}>
                                {value ? S.DOMESTIC : S.INTERNATIONAL}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </>
                    )}
                    {kind === 'ticket' &&
                      field(S.KEYWORD, keyword, (value) => {
                        setKeyword(value);
                        setRegionId(undefined);
                      })}
                    {kind !== 'ticket' && (
                      <>
                        <View
                          testID={
                            kind === 'flight'
                              ? 'booking-date-row'
                              : 'booking-hotel-date-row'
                          }
                          style={styles.row}>
                          <View style={styles.halfField}>
                            {field(
                              kind === 'flight'
                                ? S.FLIGHT_START_DATE
                                : S.HOTEL_CHECK_IN,
                              start,
                              setStart,
                              'date',
                            )}
                          </View>
                          <View style={styles.halfField}>
                            {field(
                              kind === 'flight'
                                ? S.FLIGHT_END_DATE
                                : S.HOTEL_CHECK_OUT,
                              end,
                              setEnd,
                              'date',
                            )}
                          </View>
                        </View>
                        {field(S.ADULTS, adults, setAdults, 'number')}
                      </>
                    )}
                    {button(
                      kind === 'flight' ? S.FLIGHT : S.SEARCH,
                      search,
                      'booking-search',
                    )}
                    {busy && (
                      <View accessibilityLabel={S.LOADING}>
                        <ActivityIndicator color={palette.primary} />
                        <Text style={styles.note}>{S.LOADING}</Text>
                      </View>
                    )}
                    {flightFallback &&
                      button(S.FLIGHT_FALLBACK, () => {
                        void run(async (signal) => {
                          await openLink(
                            await myRealTrip.createLink(
                              APP_CONFIG.MYREALTRIP_HOME_URL,
                              signal,
                            ),
                            signal,
                          );
                        });
                      })}
                    {!!message && (
                      <Text accessibilityRole='alert' style={styles.note}>
                        {message}
                      </Text>
                    )}
                  </>
                )}
              </View>
              {productResults}
            </View>
          }
          renderItem={({ item, index }) =>
            kind === 'hotel' ? (
              <TouchableOpacity
                testID={`hotel-result-${index}`}
                accessibilityRole='button'
                accessibilityState={{ selected: item.id === selectedHotelUrl }}
                disabled={busy}
                onPress={() => choose(item)}
                style={[
                  styles.hotelResult,
                  item.id === selectedHotelUrl && styles.selectedHotelResult,
                  busy && styles.disabled,
                ]}>
                {item.product?.imageUrl ? (
                  <ImageBackground
                    source={{ uri: item.product.imageUrl }}
                    resizeMode='cover'
                    imageStyle={styles.hotelImage}
                    style={styles.hotelImageBackground}>
                    <LinearGradient
                      colors={['transparent', 'rgba(4, 25, 42, 0.92)']}
                      style={styles.hotelOverlay}>
                      {item.id === selectedHotelUrl && (
                        <Text style={styles.hotelRecommended}>
                          {S.HOTEL_RECOMMENDED}
                        </Text>
                      )}
                      <Text style={styles.hotelName} numberOfLines={2}>
                        {item.label}
                      </Text>
                      <View style={styles.hotelDetails}>
                        {Number.isInteger(item.product.starRating) &&
                          item.product.starRating! > 0 && (
                            <Text style={styles.hotelDetail}>
                              {item.product.starRating}
                              {S.HOTEL_STAR}
                            </Text>
                          )}
                        {!!item.product.reviewScore && (
                          <Text style={styles.hotelDetail}>
                            ★ {item.product.reviewScore}
                          </Text>
                        )}
                        {Number.isInteger(item.product.reviewCount) && (
                          <Text style={styles.hotelDetail}>
                            {S.HOTEL_REVIEWS}{' '}
                            {item.product.reviewCount!.toLocaleString()}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.hotelPrice}>
                        {item.product.salePrice > 0
                          ? `₩${item.product.salePrice.toLocaleString()} ~`
                          : S.HOTEL_PRICE_CHECK}
                      </Text>
                    </LinearGradient>
                  </ImageBackground>
                ) : (
                  <LinearGradient
                    colors={[palette.darkTeal, palette.deepNavy]}
                    style={styles.hotelOverlay}>
                    {item.id === selectedHotelUrl && (
                      <Text style={styles.hotelRecommended}>
                        {S.HOTEL_RECOMMENDED}
                      </Text>
                    )}
                    <Text style={styles.hotelName} numberOfLines={2}>
                      {item.label}
                    </Text>
                    <View style={styles.hotelDetails}>
                      {Number.isInteger(item.product?.starRating) &&
                        item.product!.starRating! > 0 && (
                          <Text style={styles.hotelDetail}>
                            {item.product!.starRating}
                            {S.HOTEL_STAR}
                          </Text>
                        )}
                      {!!item.product?.reviewScore && (
                        <Text style={styles.hotelDetail}>
                          ★ {item.product.reviewScore}
                        </Text>
                      )}
                      {Number.isInteger(item.product?.reviewCount) && (
                        <Text style={styles.hotelDetail}>
                          {S.HOTEL_REVIEWS}{' '}
                          {item.product!.reviewCount!.toLocaleString()}
                        </Text>
                      )}
                    </View>
                    <Text style={styles.hotelPrice}>
                      {item.product && item.product.salePrice > 0
                        ? `₩${item.product.salePrice.toLocaleString()} ~`
                        : S.HOTEL_PRICE_CHECK}
                    </Text>
                  </LinearGradient>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                testID={`ticket-result-${index}`}
                accessibilityRole='button'
                disabled={busy}
                onPress={() => choose(item)}
                style={[styles.ticketResult, busy && styles.disabled]}>
                {item.product?.imageUrl ? (
                  <ImageBackground
                    source={{ uri: item.product.imageUrl }}
                    resizeMode='cover'
                    imageStyle={styles.hotelImage}
                    style={styles.hotelImageBackground}>
                    {ticketCardContent(item)}
                  </ImageBackground>
                ) : (
                  ticketCardContent(item)
                )}
              </TouchableOpacity>
            )
          }
          ListFooterComponent={
            kind !== 'flight' && productsSearched ? (
              <View style={styles.resultsFooter}>
                {loadingMore && (
                  <ActivityIndicator
                    testID={`${kind}-loading-more`}
                    color={palette.primary}
                  />
                )}
                {pageError && (
                  <TouchableOpacity
                    testID={`${kind}-retry-page`}
                    accessibilityRole='button'
                    onPress={() => {
                      setPageError(false);
                      loadMoreProducts(true);
                    }}>
                    <Text style={styles.retryText}>{S.LOAD_MORE_ERROR}</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : null
          }
        />
      </KeyboardAvoidingView>
      {kind !== 'flight' && showScrollTop && (
        <TouchableOpacity
          testID='booking-scroll-top'
          accessibilityRole='button'
          accessibilityLabel={S.SCROLL_TOP}
          style={styles.scrollTop}
          onPress={() =>
            listRef.current?.scrollToOffset({ offset: 0, animated: true })
          }>
          <Ionicons name='arrow-up' size={22} color={palette.white} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.softMint },
  content: { flex: 1 },
  header: {
    minHeight: 64,
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 44,
    height: 44,
    backgroundColor: palette.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '800',
    color: palette.deepNavy,
  },
  headerSpacer: { width: 44 },
  list: { paddingHorizontal: 20, paddingBottom: 24 },
  listHeader: { gap: 16, paddingBottom: 16 },
  hero: {
    borderRadius: 22,
    padding: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: palette.lightTeal,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: palette.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partner: {
    color: palette.darkTeal,
    fontWeight: '600',
    fontSize: 12,
    backgroundColor: palette.white,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 99,
    overflow: 'hidden',
  },
  title: { fontSize: 24, fontWeight: '800', color: palette.deepNavy },
  subtitle: { color: palette.subText, fontSize: 13, lineHeight: 21 },
  form: {
    gap: 14,
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.gray200,
    backgroundColor: palette.white,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingBottom: 4,
  },
  formToggle: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  formToggleText: { color: palette.primary, fontSize: 12, fontWeight: '700' },
  summary: { color: palette.deepNavy, fontSize: 13, lineHeight: 21 },
  sectionTitle: { color: palette.deepNavy, fontSize: 16, fontWeight: '700' },
  field: { gap: 8 },
  halfField: { flex: 1, minWidth: 0, gap: 8 },
  airportSection: { position: 'relative', zIndex: 2 },
  airportSuggestions: {
    position: 'absolute',
    top: 82,
    left: 0,
    right: 0,
    borderWidth: 1,
    borderColor: palette.gray200,
    borderRadius: 12,
    backgroundColor: palette.white,
    zIndex: 3,
    elevation: 6,
    overflow: 'hidden',
  },
  airportSuggestionsList: { flex: 1 },
  airportSuggestionsOne: { height: 46 },
  airportSuggestionsTwo: { height: 90 },
  airportSuggestionsThree: { height: 134 },
  airportSuggestionsMany: { height: 178 },
  airportSuggestion: {
    minHeight: 44,
    paddingHorizontal: 14,
    justifyContent: 'center',
    borderBottomWidth: 1,
    borderBottomColor: palette.gray200,
  },
  hotelResultsSection: {
    gap: 8,
    padding: 18,
    borderWidth: 1,
    borderColor: palette.gray200,
    borderRadius: 20,
    backgroundColor: palette.white,
  },
  resultsHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultsCount: { color: palette.primary, fontSize: 13, fontWeight: '700' },
  hotelResult: {
    height: 190,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: palette.deepNavy,
  },
  selectedHotelResult: {
    borderColor: palette.accent,
  },
  hotelImage: { borderRadius: 16 },
  hotelImageBackground: { flex: 1 },
  hotelOverlay: { flex: 1, justifyContent: 'flex-end', padding: 16, gap: 5 },
  hotelName: { color: palette.white, fontSize: 17, fontWeight: '800' },
  hotelDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  hotelDetail: { color: palette.white, fontSize: 12, fontWeight: '600' },
  hotelPrice: { color: palette.white, fontSize: 16, fontWeight: '800' },
  ticketResult: {
    height: 238,
    marginBottom: 12,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: palette.deepNavy,
  },
  ticketOverlay: { flex: 1, justifyContent: 'flex-end', padding: 16, gap: 7 },
  ticketDescription: { color: palette.white, fontSize: 12, lineHeight: 18 },
  ticketTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  ticketTag: {
    color: palette.white,
    borderColor: palette.white,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 11,
  },
  hotelRecommended: {
    color: palette.white,
    fontSize: 11,
    fontWeight: '700',
  },
  resultsFooter: { gap: 16, paddingVertical: 12 },
  retryText: { textAlign: 'center', color: palette.primary, fontWeight: '700' },
  scrollTop: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    height: 48,
    width: 48,
    borderRadius: 24,
    backgroundColor: palette.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
  },
  label: { color: palette.deepNavy, fontSize: 14, fontWeight: '600' },
  input: {
    minHeight: 50,
    borderWidth: 1,
    borderColor: palette.gray200,
    backgroundColor: palette.softMint,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: palette.deepNavy,
    fontSize: 15,
  },
  button: { borderRadius: 14, overflow: 'hidden' },
  primaryButtonContent: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 15,
  },
  secondaryButton: {
    backgroundColor: palette.lightTeal,
    borderColor: palette.lightTeal,
    borderWidth: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  buttonText: { color: palette.white, fontSize: 15, fontWeight: '700' },
  secondaryButtonText: {
    color: palette.darkTeal,
    fontSize: 13,
    fontWeight: '600',
  },
  row: { flexDirection: 'row', gap: 8 },
  option: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: palette.softMint,
    borderWidth: 1,
    borderColor: palette.gray200,
  },
  selected: { backgroundColor: palette.lightTeal, borderColor: palette.accent },
  note: { color: palette.subText, fontSize: 12, lineHeight: 19 },
  disabled: { opacity: 0.5 },
});
