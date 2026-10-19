/**
 * @file BookingScreen.tsx
 * @description Entry-aware booking searches with smooth form transitions, readable product cards, and overlay price guidance.
 */
import { CachedImageBackground } from '../components/common/CachedImage';
import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  LayoutAnimation,
  Linking,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Text, TextInput } from '../components/common/Typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
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
  resolveCourseArrivalAirport,
  type BookingContext,
} from '../services/bookingService';
import { APP_CONFIG } from '../constants/config';
import { UI_STRINGS } from '../constants/strings';
import { palette, hexToRgba } from '../theme/colors';
import { BOOKING_REEL_UI } from '../constants/bookingReelUiStrings';
import {
  BookingPartner,
  BookingProductShade,
  BookingReelAsset,
} from '../components/booking/BookingReelAsset';
import { DestinationPickerSheet } from '../components/course/DestinationPickerSheet';
import { TravelDateSheet } from '../components/course/TravelDateSheet';
import { TicketCouponPack } from '../components/booking/TicketCouponPack';
import { BookingAirportSheet } from '../components/booking/BookingAirportSheet';

const S = UI_STRINGS.BOOKING;
const V = BOOKING_REEL_UI.BOOKING;
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
  const safeAreaStyles = StyleSheet.create({
    footer: { paddingBottom: insets.bottom + 22 },
    list: { paddingBottom: insets.bottom + 24 },
    scrollTop: { bottom: insets.bottom + 20 },
  });
  const [headerHeight, setHeaderHeight] = useState(64);
  const [destinationVisible, setDestinationVisible] = useState(false);
  const [datesVisible, setDatesVisible] = useState(false);
  useEffect(() => {
    // BackgroundImageLayout owns the top inset; do not add a second safe area here.
    setBackground({ noTopEdges: false });
    return resetBackground;
  }, [setBackground, resetBackground]);
  const [keyword, setKeyword] = useState(
    (kind === 'flight' && context.arrivalAirportName) || context.keyword || '',
  );
  const [destinationCountry, setDestinationCountry] = useState(
    context.country?.trim() || '',
  );
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
  const [priceInfoVisible, setPriceInfoVisible] = useState(false);
  const [formCollapsed, setFormCollapsed] = useState(false);
  const reduceMotion = useRef(true);
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
  const airportPrefill = useRef<
    Partial<Record<AirportTarget, AbortController>>
  >({});
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
    let disposed = false;
    let preferenceChanged = false;
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled) => {
        preferenceChanged = true;
        reduceMotion.current = enabled;
      },
    );
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (!disposed && !preferenceChanged) reduceMotion.current = enabled;
      })
      .catch(() => {
        // Keep transitions still when the accessibility preference is unknown.
      });
    return () => {
      disposed = true;
      subscription.remove();
    };
  }, []);

  const transitionForm = (collapsed: boolean) => {
    if (!reduceMotion.current) {
      // Animate the form height and surrounding layout in the same native commit.
      LayoutAnimation.configureNext(
        LayoutAnimation.create(280, 'easeInEaseOut', 'opacity'),
      );
    }
    setFormCollapsed(collapsed);
  };

  useEffect(() => {
    if (kind !== 'flight') return;
    const controllers = {
      departure: new AbortController(),
      arrival: new AbortController(),
    };
    airportPrefill.current = controllers;
    const preselect = async (target: AirportTarget) => {
      const controller = controllers[target];
      if (airportTouched.current[target]) return;
      try {
        const airports =
          target === 'departure'
            ? await myRealTrip.searchAirports('인천', controller.signal)
            : [];
        const airport =
          target === 'departure'
            ? airports.find(({ airport: item }) => item.code === 'ICN') ||
              airports[0]
            : await resolveCourseArrivalAirport(context, controller.signal);
        if (
          controller.signal.aborted ||
          !mounted.current ||
          airportTouched.current[target]
        )
          return;
        if (!airport) {
          if (context.autoSearch && !autoSearchStarted.current)
            setMessage(S.FLIGHT_AIRPORT_REQUIRED);
          return;
        }
        const { code, koName, enName } = airport.airport;
        const label = `${koName || enName || code} (${code})`;
        if (target === 'departure') {
          setDeparture(label);
          setDepCode(code);
        } else {
          setKeyword(label);
          setArrCode(code);
        }
      } catch (error) {
        if (
          controller.signal.aborted ||
          !mounted.current ||
          airportTouched.current[target] ||
          !context.autoSearch ||
          autoSearchStarted.current
        )
          return;
        setMessage(
          error instanceof MyRealTripError && error.code === 'configuration'
            ? S.UNAVAILABLE
            : error instanceof MyRealTripError && error.status === 429
              ? S.RATE_LIMIT
              : S.ERROR,
        );
      }
    };
    void preselect('departure');
    void preselect('arrival');
    return () => {
      controllers.departure.abort();
      controllers.arrival.abort();
    };
  }, [
    kind,
    context.keyword,
    context.country,
    context.arrivalAirportName,
    context.autoSearch,
  ]);

  useEffect(() => {
    if (kind !== 'hotel' || !context.keyword?.trim()) return;
    const controller = new AbortController();
    void myRealTrip
      .searchRegions(context.keyword.trim(), domestic, controller.signal)
      .then((regions) => {
        const region = regions[0];
        if (controller.signal.aborted || regionTouched.current) return;
        if (!region) {
          autoSearchStarted.current = true;
          if (context.autoSearch) setMessage(S.HOTEL_REGION_REQUIRED);
          return;
        }
        setRegionId(region.regionId);
        setKeyword([region.name, region.subName].filter(Boolean).join(' · '));
      })
      .catch(() => {
        if (controller.signal.aborted || regionTouched.current) return;
        autoSearchStarted.current = true;
        if (context.autoSearch) setMessage(S.HOTEL_REGION_REQUIRED);
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
    // Editing a condition takes ownership away from the one-time entry search.
    autoSearchStarted.current = true;
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
    setPriceInfoVisible(false);
    setFlightFallback(false);
  };
  const close = () => {
    autoSearchStarted.current = true;
    airportPrefill.current.departure?.abort();
    airportPrefill.current.arrival?.abort();
    active.current?.abort();
    onBack();
  };
  const openDestination = () => {
    if (active.current) return;
    autoSearchStarted.current = true;
    Keyboard.dismiss();
    setDestinationVisible(true);
  };
  const openDates = () => {
    if (active.current) return;
    autoSearchStarted.current = true;
    Keyboard.dismiss();
    setDatesVisible(true);
  };
  const run = async (
    action: (signal: AbortSignal) => Promise<void>,
    onFailure?: () => void,
  ) => {
    if (active.current) return;
    const controller = new AbortController();
    active.current = controller;
    setBusy(true);
    setMessage('');
    try {
      await action(controller.signal);
    } catch (error) {
      if (mounted.current && !controller.signal.aborted) {
        onFailure?.();
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
    if (active.current) return;
    autoSearchStarted.current = true;
    const count = Number(adults);
    if (kind === 'ticket' && !keyword.trim()) {
      setMessage(S.KEYWORD_REQUIRED);
      return;
    }
    if (kind !== 'ticket') {
      if (!isBookingDate(start) || !isBookingDate(end)) {
        setMessage(S.INVALID_DATE);
        return;
      }
      if (!/^\d+$/.test(adults) || !Number.isSafeInteger(count) || count < 1) {
        setMessage(S.INVALID_ADULTS);
        return;
      }
      if (kind === 'hotel') {
        if (!regionId) {
          setMessage(S.HOTEL_REGION_REQUIRED);
          return;
        }
        if (end <= start) {
          setMessage(S.HOTEL_DATE_ORDER);
          return;
        }
      } else {
        if ((!depCode && !departure.trim()) || (!arrCode && !keyword.trim())) {
          setMessage(S.FLIGHT_AIRPORT_REQUIRED);
          return;
        }
        if (depCode && arrCode && depCode === arrCode) {
          setMessage(S.FLIGHT_SAME_AIRPORT);
          return;
        }
        if (end < start) {
          setMessage(S.FLIGHT_DATE_ORDER);
          return;
        }
      }
    }
    airportPrefill.current.departure?.abort();
    airportPrefill.current.arrival?.abort();
    clearResults();
    Keyboard.dismiss();
    if (kind === 'ticket') transitionForm(true);
    void run(
      async (signal) => {
        if (kind === 'flight') {
          setAirportSearch(null);
          setAirportChoices([]);
          const resolveAirport = async (
            value: string,
            selectedCode: string,
            target: AirportTarget,
          ) => {
            if (selectedCode) return selectedCode;
            const query = value.replace(/ \([A-Z]{3}\)$/, '').trim();
            const match =
              target === 'arrival' &&
              !airportTouched.current.arrival &&
              context.arrivalAirportName
                ? await resolveCourseArrivalAirport(context, signal)
                : (await myRealTrip.searchAirports(query, signal))[0];
            if (!match || signal.aborted || !mounted.current) return '';
            const { code, koName, enName } = match.airport;
            const label = `${koName || enName || code} (${code})`;
            if (target === 'departure') {
              setDeparture(label);
              setDepCode(code);
            } else {
              setKeyword(label);
              setArrCode(code);
            }
            return code;
          };
          const departureCode = await resolveAirport(
            departure,
            depCode,
            'departure',
          );
          const arrivalCode = await resolveAirport(keyword, arrCode, 'arrival');
          if (signal.aborted || !mounted.current) return;
          if (!departureCode || !arrivalCode) {
            setMessage(S.FLIGHT_AIRPORT_REQUIRED);
            return;
          }
          if (departureCode === arrivalCode) {
            setMessage(S.FLIGHT_SAME_AIRPORT);
            return;
          }
          const url = await myRealTrip.createFlightLink(
            {
              depAirportCd: departureCode,
              arrAirportCd: arrivalCode,
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
          if (!signal.aborted && mounted.current) {
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
            if (kind !== 'ticket') transitionForm(true);
          }
          showChoices(found, signal);
        }
      },
      kind === 'ticket' ? () => transitionForm(false) : undefined,
    );
  };
  useEffect(() => {
    if (
      !context.autoSearch ||
      (kind === 'flight' ? !depCode || !arrCode : !context.keyword?.trim()) ||
      (kind === 'hotel' && !regionId)
    )
      return;
    const timer = setTimeout(() => {
      if (autoSearchStarted.current) return;
      autoSearchStarted.current = true;
      search();
    }, 0);
    return () => clearTimeout(timer);
  }, [
    kind,
    context.autoSearch,
    context.keyword,
    regionId,
    depCode,
    arrCode,
    start,
    end,
    adults,
  ]);
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
    autoSearchStarted.current = true;
    const target = airportSearch?.target || 'arrival';
    airportPrefill.current[target]?.abort();
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
    Keyboard.dismiss();
  };
  const changeAirportQuery = (target: AirportTarget, next: string) => {
    airportTouched.current[target] = true;
    airportPrefill.current[target]?.abort();
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
  };
  const openAirport = (target: AirportTarget, value: string) => {
    if (active.current) return;
    autoSearchStarted.current = true;
    airportTouched.current[target] = true;
    airportPrefill.current[target]?.abort();
    setAirportSearch({ target, query: value.replace(/ \([A-Z]{3}\)$/, '') });
  };
  const airportField = (
    target: AirportTarget,
    label: string,
    value: string,
  ) => (
    <View style={styles.halfField}>
      <TextInput
        accessibilityLabel={label}
        placeholder={label}
        placeholderTextColor={palette.mutedText}
        style={styles.input}
        value={value}
        editable={!busy}
        autoCapitalize='none'
        showSoftInputOnFocus={false}
        onPressIn={() => openAirport(target, value)}
        onFocus={() => openAirport(target, value)}
        onChangeText={(next) => changeAirportQuery(target, next)}
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
        showSoftInputOnFocus={type !== 'date'}
        onPressIn={type === 'date' ? openDates : undefined}
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
        <View style={styles.primaryButtonContent}>
          <Text style={styles.buttonText}>{label}</Text>
        </View>
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
        <Text
          style={styles.sectionTitle}
          accessibilityLabel={`${kind === 'hotel' ? S.HOTEL_RESULTS : S.TICKET_RESULTS} ${productsTotalCount}${kind === 'hotel' ? S.HOTEL_COUNT : S.TICKET_COUNT}`}>
          {kind === 'hotel' ? S.HOTEL_RESULTS : S.TICKET_RESULTS}
        </Text>
        <TouchableOpacity
          accessibilityRole='button'
          accessibilityLabel={S.PRICE_NOTE}
          onPress={() => setPriceInfoVisible(true)}
          style={styles.priceInformationIcon}
          hitSlop={8}>
          <BookingReelAsset name='info' />
          <Text accessible={false} style={styles.priceInformationMark}>
            !
          </Text>
        </TouchableOpacity>
        <View style={styles.resultsHeadingSpacer} />
        <BookingPartner compact />
      </View>
      {!!message && (
        <Text accessibilityRole='alert' style={styles.note}>
          {message}
        </Text>
      )}
    </View>
  );
  const ticketCardContent = (item: Choice) => (
    <View style={styles.ticketOverlay}>
      <BookingProductShade kind='ticket' />
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
          <View
            style={styles.rating}
            accessible
            accessibilityLabel={`★ ${item.product.reviewScore}`}>
            <BookingReelAsset name='star' />
            <Text style={styles.hotelDetail}>{item.product.reviewScore}</Text>
          </View>
        )}
        {Number.isInteger(item.product?.reviewCount) && (
          <Text style={styles.hotelDetail}>
            {S.HOTEL_REVIEWS} {item.product!.reviewCount!.toLocaleString()}
          </Text>
        )}
      </View>
      <Text style={styles.hotelPrice}>
        {S.TICKET_START_PRICE} ₩{item.product?.salePrice.toLocaleString()}
      </Text>
    </View>
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
          <BookingReelAsset name='back' />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{S.TITLE}</Text>
        {productsSearched ? (
          <TouchableOpacity
            style={styles.backButton}
            accessibilityRole='button'
            accessibilityLabel={V.CLOSE}
            onPress={close}>
            <BookingReelAsset name='close' />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerSpacer} />
        )}
      </View>
      <KeyboardAvoidingView
        style={styles.content}
        keyboardVerticalOffset={insets.top + headerHeight}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.resultsViewport}>
          <FlatList
            testID='booking-results-list'
            ref={listRef}
            data={choices}
            numColumns={kind === 'hotel' ? 2 : 1}
            columnWrapperStyle={
              kind === 'hotel' ? styles.hotelColumns : undefined
            }
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps='handled'
            keyboardDismissMode='on-drag'
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.list, safeAreaStyles.list]}
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
                {!productsSearched && !formCollapsed && (
                  <View style={styles.intro}>
                    <View style={styles.introHeading}>
                      <Text style={styles.title}>
                        {kind === 'flight'
                          ? V.FLIGHT_TITLE
                          : kind === 'hotel'
                            ? V.HOTEL_TITLE
                            : V.TICKET_TITLE}
                      </Text>
                      {kind === 'ticket' && <BookingPartner />}
                    </View>
                    {kind === 'flight' && (
                      <Text style={styles.subtitle}>{V.FLIGHT_NOTE}</Text>
                    )}
                  </View>
                )}
                <View
                  testID='booking-form'
                  style={[
                    styles.form,
                    !productsSearched && !formCollapsed && styles.initialForm,
                    formCollapsed && styles.collapsedForm,
                  ]}>
                  {(productsSearched || formCollapsed) && (
                    <View style={styles.sectionHeading}>
                      <Text style={styles.sectionTitle}>{V.SUMMARY}</Text>
                      {kind !== 'flight' && (
                        <TouchableOpacity
                          testID={`${kind}-toggle-form`}
                          accessibilityRole='button'
                          accessibilityLabel={
                            formCollapsed ? S.EDIT_SEARCH : S.COLLAPSE_SEARCH
                          }
                          disabled={busy}
                          accessibilityState={{ expanded: !formCollapsed }}
                          onPress={() => transitionForm(!formCollapsed)}
                          style={styles.formToggle}>
                          <View
                            style={
                              formCollapsed ? styles.caretDown : styles.caretUp
                            }>
                            <BookingReelAsset name='caret' />
                          </View>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                  {kind !== 'flight' && formCollapsed ? (
                    <View
                      testID={`${kind}-search-summary`}
                      style={styles.summaryChips}>
                      {kind === 'ticket' && destinationCountry ? (
                        <View style={styles.destinationChip}>
                          <Text style={styles.destinationChipText}>
                            {destinationCountry}
                          </Text>
                          <View
                            style={styles.destinationDivider}
                            accessible={false}
                            pointerEvents='none'>
                            <View style={styles.destinationDividerRotation}>
                              <BookingReelAsset name='destinationDivider' />
                            </View>
                          </View>
                          <Text style={styles.destinationChipText}>
                            {keyword}
                          </Text>
                        </View>
                      ) : (
                        <Text style={styles.summaryChip}>{keyword}</Text>
                      )}
                      {kind === 'hotel' && (
                        <>
                          <Text style={styles.summaryChip}>
                            {start.replace(/-/g, '.').slice(2)} -{' '}
                            {end.replace(/-/g, '.').slice(2)}
                          </Text>
                          <Text style={styles.summaryChip}>
                            {V.ADULT} {adults}
                            {V.PERSON}
                          </Text>
                        </>
                      )}
                    </View>
                  ) : (
                    <>
                      <View style={styles.fieldHeading}>
                        <BookingReelAsset
                          name={kind === 'ticket' ? 'planeTicket' : 'plane'}
                        />
                        {kind === 'flight' ? (
                          <Text style={styles.fieldTitle}>{V.DESTINATION}</Text>
                        ) : (
                          <TouchableOpacity
                            testID='booking-destination-picker'
                            accessibilityRole='button'
                            accessibilityLabel={V.CHOOSE_DESTINATION}
                            disabled={busy}
                            style={styles.headingButton}
                            onPress={openDestination}>
                            <Text style={styles.fieldTitle}>
                              {V.DESTINATION}
                            </Text>
                          </TouchableOpacity>
                        )}
                      </View>
                      {kind === 'flight' && (
                        <View style={styles.airportSection}>
                          <View testID='booking-airport-row' style={styles.row}>
                            {airportField('departure', S.DEPARTURE, departure)}
                            {airportField('arrival', S.ARRIVAL, keyword)}
                          </View>
                        </View>
                      )}
                      {kind === 'hotel' && (
                        <>
                          <View style={styles.airportSection}>
                            <View style={styles.field}>
                              <TextInput
                                accessibilityLabel={S.HOTEL_LOCATION}
                                placeholder={S.HOTEL_LOCATION}
                                placeholderTextColor={palette.mutedText}
                                style={styles.input}
                                value={keyword}
                                editable={!busy}
                                showSoftInputOnFocus={false}
                                onPressIn={openDestination}
                                onFocus={openDestination}
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
                        </>
                      )}
                      {kind === 'ticket' &&
                        field(S.KEYWORD, keyword, (value) => {
                          if (value.trim() !== keyword.trim()) {
                            setDestinationCountry('');
                          }
                          setKeyword(value);
                          setRegionId(undefined);
                        })}
                      {kind !== 'ticket' && (
                        <>
                          <View style={styles.fieldHeading}>
                            <BookingReelAsset name='calendar' />
                            <TouchableOpacity
                              testID='booking-calendar-open'
                              accessibilityRole='button'
                              accessibilityLabel={V.CHOOSE_DATES}
                              disabled={busy}
                              style={styles.headingButton}
                              onPress={openDates}>
                              <Text style={styles.fieldTitle}>{V.DATES}</Text>
                            </TouchableOpacity>
                          </View>
                          <View
                            testID={
                              kind === 'flight'
                                ? 'booking-date-row'
                                : 'booking-hotel-date-row'
                            }
                            style={styles.dateRow}>
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
                            <Text style={styles.dateDash}>-</Text>
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
                          <View style={styles.fieldHeading}>
                            <BookingReelAsset name='person' />
                            <Text style={styles.fieldTitle}>{V.PEOPLE}</Text>
                          </View>
                          <View style={styles.stepper}>
                            <TouchableOpacity
                              testID='booking-adults-minus'
                              accessibilityRole='button'
                              accessibilityLabel={V.DECREASE}
                              disabled={busy || Number(adults) <= 1}
                              onPress={() => {
                                clearResults();
                                setAdults(
                                  String(Math.max(1, Number(adults) - 1)),
                                );
                              }}
                              style={styles.stepperButton}>
                              <BookingReelAsset name='minus' />
                            </TouchableOpacity>
                            <View style={styles.stepperValue}>
                              <TextInput
                                accessibilityLabel={S.ADULTS}
                                value={adults}
                                keyboardType='number-pad'
                                editable={!busy}
                                style={styles.peopleInput}
                                onChangeText={(value) => {
                                  clearResults();
                                  setAdults(value.replace(/\D/g, ''));
                                }}
                              />
                              <Text style={styles.fieldTitle}>{V.PERSON}</Text>
                            </View>
                            <TouchableOpacity
                              testID='booking-adults-plus'
                              accessibilityRole='button'
                              accessibilityLabel={V.INCREASE}
                              disabled={busy}
                              onPress={() => {
                                clearResults();
                                setAdults(String((Number(adults) || 1) + 1));
                              }}
                              style={styles.stepperButton}>
                              <BookingReelAsset name='plus' />
                            </TouchableOpacity>
                          </View>
                        </>
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
                    </>
                  )}
                  {busy && (!formCollapsed || !productsSearched) && (
                    <View accessibilityLabel={S.LOADING}>
                      <ActivityIndicator color={palette.primary} />
                      <Text style={styles.note}>{S.LOADING}</Text>
                    </View>
                  )}
                  {!!message && !productsSearched && (
                    <Text accessibilityRole='alert' style={styles.note}>
                      {message}
                    </Text>
                  )}
                </View>
                {kind !== 'ticket' && !productsSearched && <BookingPartner />}
                {kind === 'ticket' && !formCollapsed && <TicketCouponPack />}
                {productResults}
              </View>
            }
            renderItem={({ item, index }) =>
              kind === 'hotel' ? (
                <TouchableOpacity
                  testID={`hotel-result-${index}`}
                  accessibilityRole='button'
                  accessibilityState={{
                    selected: item.id === selectedHotelUrl,
                  }}
                  disabled={busy}
                  onPress={() => choose(item)}
                  style={[styles.hotelResult, busy && styles.disabled]}>
                  {item.product?.imageUrl ? (
                    <CachedImageBackground
                      source={{ uri: item.product.imageUrl }}
                      contentFit='cover'
                      imageStyle={styles.hotelImage}
                      style={styles.hotelImageBackground}>
                      <View style={styles.hotelOverlay}>
                        <BookingProductShade kind='hotel' />
                        <Text
                          style={[styles.hotelName, styles.hotelTitle]}
                          numberOfLines={2}
                          ellipsizeMode='tail'
                          lineBreakStrategyIOS='hangul-word'
                          textBreakStrategy='balanced'
                          android_hyphenationFrequency='none'>
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
                            <View
                              style={styles.rating}
                              accessible
                              accessibilityLabel={`★ ${item.product.reviewScore}`}>
                              <BookingReelAsset name='star' />
                              <Text style={styles.hotelDetail}>
                                {item.product.reviewScore}
                              </Text>
                            </View>
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
                      </View>
                    </CachedImageBackground>
                  ) : (
                    <View style={styles.hotelOverlay}>
                      <BookingProductShade kind='hotel' />
                      <Text
                        style={[styles.hotelName, styles.hotelTitle]}
                        numberOfLines={2}
                        ellipsizeMode='tail'
                        lineBreakStrategyIOS='hangul-word'
                        textBreakStrategy='balanced'
                        android_hyphenationFrequency='none'>
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
                          <View
                            style={styles.rating}
                            accessible
                            accessibilityLabel={`★ ${item.product.reviewScore}`}>
                            <BookingReelAsset name='star' />
                            <Text style={styles.hotelDetail}>
                              {item.product.reviewScore}
                            </Text>
                          </View>
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
                    </View>
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
                    <CachedImageBackground
                      source={{ uri: item.product.imageUrl }}
                      contentFit='cover'
                      imageStyle={styles.hotelImage}
                      style={styles.hotelImageBackground}>
                      {ticketCardContent(item)}
                    </CachedImageBackground>
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
          {kind !== 'flight' && showScrollTop && (
            <TouchableOpacity
              testID='booking-scroll-top'
              accessibilityRole='button'
              accessibilityLabel={S.SCROLL_TOP}
              style={[
                styles.scrollTop,
                formCollapsed && safeAreaStyles.scrollTop,
              ]}
              onPress={() =>
                listRef.current?.scrollToOffset({ offset: 0, animated: true })
              }>
              <Ionicons name='arrow-up' size={22} color={palette.white} />
            </TouchableOpacity>
          )}
        </View>
        {!formCollapsed && (
          <View style={[styles.fixedFooter, safeAreaStyles.footer]}>
            {button(
              kind === 'flight'
                ? V.FLIGHT_SEARCH
                : kind === 'hotel'
                  ? V.HOTEL_SEARCH
                  : V.TICKET_SEARCH,
              search,
              'booking-search',
            )}
          </View>
        )}
      </KeyboardAvoidingView>
      {airportSearch && (
        <BookingAirportSheet
          target={airportSearch.target}
          query={airportSearch.query}
          choices={airportChoices}
          onChange={(query) => changeAirportQuery(airportSearch.target, query)}
          onSelect={chooseAirport}
          onClose={() => {
            setAirportSearch(null);
            setAirportChoices([]);
            Keyboard.dismiss();
          }}
        />
      )}
      <DestinationPickerSheet
        visible={destinationVisible}
        initialCountry={destinationCountry}
        onClose={() => setDestinationVisible(false)}
        onSelect={(country, city) => {
          setDestinationVisible(false);
          clearResults();
          setDestinationCountry(country.trim());
          setKeyword(city);
          setDomestic(['대한민국', '한국', 'KR'].includes(country));
          if (kind === 'hotel') {
            regionTouched.current = true;
            setRegionId(undefined);
            setRegionSearch(city);
            void run(async (signal) => {
              const regions = await myRealTrip.searchRegions(
                city,
                ['대한민국', '한국', 'KR'].includes(country),
                signal,
              );
              if (!signal.aborted && regions[0]) {
                setRegionId(regions[0].regionId);
                setKeyword(
                  [regions[0].name, regions[0].subName]
                    .filter(Boolean)
                    .join(' · '),
                );
                setRegionSearch(null);
              }
            });
          }
        }}
      />
      <TravelDateSheet
        visible={datesVisible}
        startDate={start}
        endDate={end}
        maxDays={365}
        onClose={() => setDatesVisible(false)}
        onConfirm={(nextStart, nextEnd) => {
          clearResults();
          setStart(nextStart);
          setEnd(nextEnd);
          setDatesVisible(false);
        }}
      />
      <Modal
        testID='booking-price-info-modal'
        visible={priceInfoVisible}
        transparent
        animationType='fade'
        onRequestClose={() => setPriceInfoVisible(false)}>
        <View style={styles.priceInfoOverlay}>
          <Pressable
            testID='booking-price-info-backdrop'
            accessible={false}
            style={StyleSheet.absoluteFill}
            onPress={() => setPriceInfoVisible(false)}
          />
          <View style={styles.priceInfoCard} accessibilityViewIsModal>
            <Text style={styles.priceInfoTitle} accessibilityRole='header'>
              {S.PRICE_NOTE_TITLE}
            </Text>
            <Text style={styles.priceInfoBody}>{S.PRICE_NOTE}</Text>
            <TouchableOpacity
              accessibilityRole='button'
              accessibilityLabel={V.CLOSE}
              style={styles.priceInfoClose}
              onPress={() => setPriceInfoVisible(false)}>
              <Text style={styles.buttonText}>{V.CLOSE}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  initialForm: { marginHorizontal: 7 },
  intro: { gap: 8, paddingHorizontal: 10, paddingTop: 8, paddingBottom: 4 },
  introHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 12,
    minHeight: 37,
  },
  fieldTitle: {
    color: palette.deepNavy,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.8,
  },
  headingButton: { flex: 1, minHeight: 37, justifyContent: 'center' },
  priceInfoOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: hexToRgba(palette.deepNavy, 0.4),
  },
  priceInfoCard: {
    width: '100%',
    maxWidth: 360,
    padding: 24,
    borderRadius: 20,
    backgroundColor: palette.white,
    gap: 18,
  },
  priceInfoTitle: { fontSize: 18, fontWeight: '600', color: palette.deepNavy },
  priceInfoBody: { fontSize: 15, lineHeight: 23, color: palette.subText },
  priceInfoClose: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: palette.primary,
  },
  resultsViewport: { flex: 1 },
  fixedFooter: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: palette.white,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.white,
    borderRadius: 11,
  },
  dateDash: { color: palette.subText, fontSize: 14 },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.white,
    borderRadius: 11,
    overflow: 'hidden',
    height: 54,
  },
  stepperButton: {
    width: 60,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: palette.gray300,
    borderWidth: StyleSheet.hairlineWidth,
  },
  stepperValue: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  peopleInput: {
    color: palette.deepNavy,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'right',
    minWidth: 20,
    padding: 0,
  },
  hotelColumns: { justifyContent: 'space-between' },
  screen: { flex: 1, backgroundColor: palette.white },
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

    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: '600',
    color: palette.deepNavy,
  },
  headerSpacer: { width: 44 },
  list: { paddingHorizontal: 20, paddingBottom: 24 },
  listHeader: { gap: 16, paddingBottom: 16 },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: palette.deepNavy,
    letterSpacing: -1,
  },
  subtitle: {
    color: palette.mutedText,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: -1,
  },
  form: {
    gap: 8,
    padding: 20,
    paddingBottom: 40,
    borderRadius: 24,
    backgroundColor: palette.gray100,
  },
  collapsedForm: { paddingVertical: 16, minHeight: 99 },
  caretDown: { transform: [{ rotate: '-90deg' }] },
  caretUp: { transform: [{ rotate: '90deg' }] },
  priceInformationIcon: { width: 20, height: 20 },
  priceInformationMark: {
    position: 'absolute',
    left: 8,
    top: -3,
    color: palette.mutedText,
    fontSize: 16,
    lineHeight: 27,
    fontWeight: '600',
    letterSpacing: -1,
  },
  summaryChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  destinationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '100%',
    gap: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: palette.white,
    borderRadius: 53,
  },
  destinationChipText: {
    flexShrink: 1,
    color: palette.deepNavy,
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    letterSpacing: -1,
  },
  destinationDivider: {
    width: 2,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  destinationDividerRotation: { transform: [{ rotate: '90deg' }] },
  summaryChip: {
    color: palette.deepNavy,
    fontSize: 16,
    lineHeight: 22,
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: palette.white,
    borderRadius: 53,
    overflow: 'hidden',
    letterSpacing: -1,
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
  sectionTitle: {
    color: palette.deepNavy,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -1,
  },
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
    paddingTop: 4,
    backgroundColor: palette.white,
  },
  resultsHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  resultsHeadingSpacer: { flex: 1 },
  hotelResult: {
    flex: 1,
    maxWidth: '47.15%',
    height: 201,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: palette.deepNavy,
  },
  hotelImage: { borderRadius: 12 },
  hotelImageBackground: { flex: 1 },
  hotelOverlay: { flex: 1, justifyContent: 'flex-end', padding: 8, gap: 2 },
  hotelName: {
    color: palette.white,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
    letterSpacing: -0.5,
  },
  hotelTitle: { lineHeight: 17, letterSpacing: -1 },
  hotelDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  hotelDetail: { color: palette.white, fontSize: 12, fontWeight: '600' },
  hotelPrice: { color: palette.white, fontSize: 16, fontWeight: '600' },
  ticketResult: {
    height: 179,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: palette.deepNavy,
  },
  ticketOverlay: { flex: 1, justifyContent: 'flex-end', padding: 16, gap: 7 },
  ticketDescription: { color: palette.white, fontSize: 12, lineHeight: 18 },
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
    minHeight: 54,
    backgroundColor: palette.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: palette.deepNavy,
    fontSize: 15,
  },
  button: { borderRadius: 16, overflow: 'hidden' },
  primaryButtonContent: {
    backgroundColor: palette.primary,
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 15,
  },
  secondaryButton: {
    backgroundColor: palette.gray200,
    borderColor: palette.gray300,
    borderWidth: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  buttonText: {
    color: palette.white,
    fontSize: 20,
    fontWeight: '500',
    letterSpacing: -0.6,
  },
  secondaryButtonText: {
    color: palette.subText,
    fontSize: 13,
    fontWeight: '600',
  },
  row: { flexDirection: 'row', gap: 8 },
  note: { color: palette.subText, fontSize: 12, lineHeight: 19 },
  disabled: { opacity: 0.5 },
});
