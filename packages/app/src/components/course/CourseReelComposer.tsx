/**
 * @file CourseReelComposer.tsx
 * @description Day-specific reel photo/text/order drafts, recaptured map previews and cancellable MP4 export/save/share.
 */
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { Text, TextInput } from '../common/Typography';
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { CourseDetail, CourseSummary, ItineraryStop } from '@yeolo/common';
import { CourseCard } from './CourseCard';
import { useCourseDetailQuery } from '../../hooks/queries/useCourseDetailQuery';
import { APP_CONFIG } from '../../constants/config';
import { UI_STRINGS } from '../../constants/strings';
import { palette, hexToRgba } from '../../theme/colors';
import { BOOKING_REEL_UI } from '../../constants/bookingReelUiStrings';
import { BookingReelAsset } from '../booking/BookingReelAsset';
import {
  buildReelPlan,
  cancelReel,
  deleteReel,
  generateReel,
  pickReelPhoto,
  previewReel,
  saveReel,
  shareReel,
  reelPhotoStops,
  reelStopKey,
  applyReelDayEdits,
  reelMapSignature,
  type ReelDayEdits,
  type ReelPhoto,
  type ReelMapSnapshot,
} from '../../services/courseReelService';
import {
  ReelEditorDialog,
  type ReelEditorDialogMode,
} from './ReelEditorDialog';
import { ReelPreview } from './ReelPreview';
import { LoopingVideo } from '../common/LoopingVideo';
import { ReelRouteMap } from './ReelRouteMap';
import { ReelProgressBar } from './ReelProgressBar';

type ReelItemDraft = Partial<Pick<ReelPhoto, 'uri' | 'placeName' | 'caption'>>;
type DayDraft = ReelDayEdits & {
  items: Record<string, ReelItemDraft>;
  order?: string[];
};
const EMPTY_DAY_DRAFT: DayDraft = { items: {} };
const V = BOOKING_REEL_UI.REEL;
const S = UI_STRINGS.REEL;

/** Edits one date at a time; all images stay on the device and output changes invalidate the MP4. */
function ReelEditor({
  course,
  initialDay,
  onClose,
}: {
  course: CourseDetail;
  initialDay: number;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const editorList = useRef<FlatList<ItineraryStop>>(null);
  const focusedInput = useRef<number | null>(null);
  const revealFrame = useRef<number | null>(null);
  const editorScrollOffset = useRef(0);
  const keyboardReady = useRef(Keyboard.isVisible());
  const revealRevision = useRef(0);
  const [keyboardVisible, setKeyboardVisible] = useState(() =>
    Keyboard.isVisible(),
  );
  const editorInsets = useMemo(
    () => makeEditorInsets(insets.bottom, keyboardVisible),
    [insets.bottom, keyboardVisible],
  );
  const cancelReveal = useCallback(() => {
    revealRevision.current += 1;
    if (revealFrame.current !== null) {
      cancelAnimationFrame(revealFrame.current);
      revealFrame.current = null;
    }
  }, []);
  const revealFocusedInput = useCallback(() => {
    cancelReveal();
    if (!keyboardReady.current || focusedInput.current === null) return;
    const revision = revealRevision.current;
    revealFrame.current = requestAnimationFrame(() => {
      revealFrame.current = null;
      if (!keyboardReady.current || focusedInput.current === null) return;
      const target = focusedInput.current;
      const viewport = editorList.current?.getNativeScrollRef() as
        React.ElementRef<typeof View> | null | undefined;
      viewport?.measureInWindow((_x, top, _width, height) => {
        UIManager.measureInWindow(
          target,
          (_inputX, inputTop, _inputWidth, inputHeight) => {
            if (
              focusedInput.current !== target ||
              revealRevision.current !== revision ||
              !keyboardReady.current ||
              height <= 32
            )
              return;
            const visibleTop = top + 16;
            const visibleBottom = top + height - 16;
            // A tall field cannot fit both edges: keep its top visible instead
            // of alternating between top/bottom alignment on each layout.
            const delta =
              inputHeight > visibleBottom - visibleTop
                ? inputTop - visibleTop
                : inputTop + inputHeight > visibleBottom
                  ? inputTop + inputHeight - visibleBottom
                  : inputTop < visibleTop
                    ? inputTop - visibleTop
                    : 0;
            if (Math.abs(delta) < 1) return;
            const nextOffset = Math.max(0, editorScrollOffset.current + delta);
            // A layout can arrive before onScroll acknowledges this movement.
            // Keep subsequent corrections anchored to the requested position;
            // onScroll will still replace it with the actual clamped offset.
            editorScrollOffset.current = nextOffset;
            editorList.current?.scrollToOffset({
              offset: nextOffset,
              // Do not run a second scrolling animation against the keyboard's
              // viewport resize. Correct only the final, measured obstruction.
              animated: false,
            });
          },
        );
      });
    });
  }, [cancelReveal]);
  useEffect(() => {
    const willShow = Keyboard.addListener('keyboardWillShow', () => {
      keyboardReady.current = false;
      setKeyboardVisible(true);
      cancelReveal();
    });
    const shown = Keyboard.addListener('keyboardDidShow', () => {
      keyboardReady.current = true;
      setKeyboardVisible(true);
      revealFocusedInput();
    });
    const hideKeyboard = () => {
      keyboardReady.current = false;
      setKeyboardVisible(false);
      cancelReveal();
    };
    const willHide = Keyboard.addListener('keyboardWillHide', hideKeyboard);
    const hidden = Keyboard.addListener('keyboardDidHide', hideKeyboard);
    return () => {
      willShow.remove();
      shown.remove();
      willHide.remove();
      hidden.remove();
      cancelReveal();
    };
  }, [cancelReveal, revealFocusedInput]);
  const focusInput: NonNullable<
    React.ComponentProps<typeof TextInput>['onFocus']
  > = (event) => {
    focusedInput.current = event.nativeEvent.target;
    revealFocusedInput();
  };
  const blurInput = () => {
    focusedInput.current = null;
    cancelReveal();
  };
  const [editorDialog, setEditorDialog] = useState<ReelEditorDialogMode>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedDay, setSelectedDay] = useState(initialDay);
  const [drafts, setDrafts] = useState<Record<number, DayDraft>>({});
  const [hasEdits, setHasEdits] = useState(false);
  const [introDescription, setIntroDescription] = useState('');
  const [introTitle, setIntroTitle] = useState<string | undefined>();
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [busyPhase, setBusyPhase] = useState<
    'photo' | 'render' | 'action' | null
  >(null);
  const busy = busyPhase !== null;
  const [output, setOutput] = useState<string | null>(null);
  const [mapState, setMapState] = useState<{
    key: string;
    snapshot: ReelMapSnapshot;
  } | null>(null);
  const alive = useRef(true);
  const outputRef = useRef<string | null>(null);
  const operation = useRef(false);
  const originalDay = course.itinerary.days.find((d) => d.day === selectedDay);
  const draft = drafts[selectedDay] ?? EMPTY_DAY_DRAFT;
  const day = useMemo(
    () =>
      originalDay
        ? applyReelDayEdits(originalDay, {
            deleted: draft.deleted,
          })
        : undefined,
    [originalDay, draft.deleted],
  );
  const mapKey = useMemo(() => (day ? reelMapSignature(day) : ''), [day]);
  const activeMapKey = useRef(mapKey);
  activeMapKey.current = mapKey;
  const map = mapState?.key === mapKey ? mapState.snapshot : null;
  const receiveMap = useCallback(
    (snapshot: ReelMapSnapshot | null) => {
      if (activeMapKey.current === mapKey)
        setMapState(snapshot ? { key: mapKey, snapshot } : null);
    },
    [mapKey],
  );
  const stops = useMemo(
    () => (day ? reelPhotoStops(day, draft.order) : []),
    [day, draft.order],
  );
  const activePhotos = useMemo(
    () =>
      stops.flatMap((stop): ReelPhoto[] => {
        const key = reelStopKey(stop);
        const item = draft.items[key];
        return item?.uri
          ? [
              {
                placeId: key,
                uri: item.uri,
                placeName: item.placeName ?? stop.place.placeName,
                caption: item.caption ?? '',
              },
            ]
          : [];
      }),
    [stops, draft.items],
  );
  const tooManyPhotos = activePhotos.length > APP_CONFIG.REEL.MAX_PHOTOS;
  const plan = useMemo(() => {
    if (!day || !activePhotos.length || tooManyPhotos) return null;
    return buildReelPlan(
      day,
      activePhotos,
      course.destinationCity,
      introDescription,
      undefined,
      map,
      draft.order,
      {
        introTitle: introTitle ?? course.title,
        footerLocation: S.LOCATION_LABEL(
          course.destinationCountry,
          course.destinationCity,
        ),
      },
    );
  }, [
    course.destinationCountry,
    course.destinationCity,
    day,
    activePhotos,
    tooManyPhotos,
    course.title,
    draft.order,
    introDescription,
    introTitle,
    map,
  ]);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      cancelReel();
      if (outputRef.current) void deleteReel(outputRef.current).catch(() => {});
    };
  }, []);

  function invalidate() {
    setError('');
    setStatus('');
    setOutput(null);
    if (outputRef.current) void deleteReel(outputRef.current).catch(() => {});
    outputRef.current = null;
  }
  function handleBack() {
    if (output) invalidate();
    else requestClose();
  }
  function requestClose() {
    if (!hasEdits) {
      onClose();
      return;
    }
    Keyboard.dismiss();
    setEditorDialog('leave');
  }
  function updateDraft(next: DayDraft) {
    setHasEdits(true);
    invalidate();
    setDrafts((prev) => ({ ...prev, [selectedDay]: next }));
  }
  function moveStop(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (busy || target < 0 || target >= stops.length) return;
    const order = stops.map(reelStopKey);
    [order[index], order[target]] = [order[target], order[index]];
    updateDraft({ ...draft, order });
  }
  function removeStop(stop: ItineraryStop) {
    const key = reelStopKey(stop);
    setMapState(null);
    updateDraft({
      ...draft,
      order: (draft.order ?? stops.map(reelStopKey)).filter(
        (item) => item !== key,
      ),
      deleted: [...(draft.deleted || []), key],
    });
  }
  function resetItems() {
    if (busy || (!draft.order && !draft.deleted?.length)) return;
    if (draft.deleted?.length) setMapState(null);
    updateDraft({ ...draft, order: undefined, deleted: undefined });
  }
  function updateItem(stop: ItineraryStop, change: ReelItemDraft) {
    const key = reelStopKey(stop);
    updateDraft({
      ...draft,
      items: {
        ...draft.items,
        [key]: {
          placeName: stop.place.placeName,
          caption: '',
          ...draft.items[key],
          ...change,
        },
      },
    });
  }
  async function addPhoto(stop: ItineraryStop) {
    if (operation.current) return;
    const existing = draft.items[reelStopKey(stop)]?.uri;
    if (!existing && activePhotos.length >= APP_CONFIG.REEL.MAX_PHOTOS) {
      setError(S.LIMIT);
      return;
    }
    operation.current = true;
    setBusyPhase('photo');
    setError('');
    try {
      const uri = await pickReelPhoto();
      if (uri && alive.current) updateItem(stop, { uri });
    } catch {
      if (alive.current) setError(S.PICK_ERROR);
    } finally {
      operation.current = false;
      if (alive.current) setBusyPhase(null);
    }
  }
  async function create() {
    if (operation.current || !plan || !map) return;
    operation.current = true;
    setBusyPhase('render');
    invalidate();
    setProgress(0);
    try {
      const uri = await generateReel(plan, (value) => {
        if (alive.current && Number.isFinite(value))
          setProgress((previous) => Math.max(previous, Math.min(0.99, value)));
      });
      if (!alive.current) {
        await deleteReel(uri);
        return;
      }
      outputRef.current = uri;
      setProgress(1);
      setOutput(uri);
    } catch (e) {
      if (alive.current)
        setError(
          e instanceof Error && e.message === S.UNAVAILABLE
            ? S.UNAVAILABLE
            : S.EXPORT_ERROR,
        );
    } finally {
      operation.current = false;
      if (alive.current) setBusyPhase(null);
    }
  }
  async function outputAction(action: 'watch' | 'save' | 'share') {
    if (!output || operation.current) return;
    operation.current = true;
    setBusyPhase('action');
    setError('');
    setStatus('');
    try {
      const result = await {
        watch: previewReel,
        save: saveReel,
        share: shareReel,
      }[action](output);
      if (alive.current && action === 'save' && result !== false)
        setStatus(S.SAVED);
    } catch {
      if (alive.current) setError(S.ACTION_ERROR);
    } finally {
      operation.current = false;
      if (alive.current) setBusyPhase(null);
    }
  }
  function renderStop({
    item: stop,
    index,
  }: {
    item: ItineraryStop;
    index: number;
  }) {
    const key = reelStopKey(stop);
    const item = draft.items[key];
    const photoUri = item?.uri;
    return (
      <View style={styles.placeCard}>
        <TouchableOpacity
          testID={`reel-photo-${key}`}
          accessibilityRole='button'
          accessibilityLabel={`${stop.place.placeName} ${photoUri ? S.CHANGE_PHOTO : S.ADD_PHOTO}`}
          style={styles.photo}
          disabled={busy || editMode}
          onPress={() => addPhoto(stop)}>
          {photoUri ? (
            <Image source={{ uri: photoUri }} style={styles.photoImage} />
          ) : (
            <BookingReelAsset name='photo' />
          )}
        </TouchableOpacity>
        <View style={styles.placeBody}>
          <View testID={`reel-heading-${key}`} style={styles.placeHeading}>
            <Text style={styles.placeName} numberOfLines={1}>
              {stop.place.placeName}
            </Text>
            {editMode && (
              <View style={styles.itemActions}>
                <TouchableOpacity
                  testID={`reel-move-up-${key}`}
                  accessibilityRole='button'
                  accessibilityLabel={`${stop.place.placeName} ${S.MOVE_UP}`}
                  accessibilityState={{ disabled: busy || index === 0 }}
                  disabled={busy || index === 0}
                  style={styles.itemAction}
                  onPress={() => moveStop(index, -1)}>
                  <Ionicons
                    name='arrow-up'
                    size={18}
                    color={index === 0 ? palette.gray300 : palette.subText}
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  testID={`reel-move-down-${key}`}
                  accessibilityRole='button'
                  accessibilityLabel={`${stop.place.placeName} ${S.MOVE_DOWN}`}
                  accessibilityState={{
                    disabled: busy || index === stops.length - 1,
                  }}
                  disabled={busy || index === stops.length - 1}
                  style={styles.itemAction}
                  onPress={() => moveStop(index, 1)}>
                  <Ionicons
                    name='arrow-down'
                    size={18}
                    color={
                      index === stops.length - 1
                        ? palette.gray300
                        : palette.subText
                    }
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  testID={`reel-remove-${key}`}
                  accessibilityRole='button'
                  accessibilityLabel={`${stop.place.placeName} ${S.REMOVE_ITEM}`}
                  disabled={busy}
                  style={styles.itemAction}
                  onPress={() => removeStop(stop)}>
                  <Ionicons
                    name='trash-outline'
                    size={18}
                    color={palette.red500}
                  />
                </TouchableOpacity>
              </View>
            )}
          </View>
          <TextInput
            testID={`reel-place-name-${key}`}
            onFocus={focusInput}
            onBlur={blurInput}
            accessibilityLabel={`${stop.place.placeName} ${S.PLACE_NAME_LABEL}`}
            placeholder={V.TITLE_PLACEHOLDER}
            placeholderTextColor={palette.mutedText}
            value={item?.placeName ?? stop.place.placeName}
            maxLength={APP_CONFIG.REEL.TITLE_LIMIT}
            editable={!busy && !editMode}
            style={styles.placeNameInput}
            onChangeText={(placeName) => updateItem(stop, { placeName })}
          />
          <TextInput
            testID={`reel-caption-${key}`}
            onFocus={focusInput}
            onBlur={blurInput}
            accessibilityLabel={`${stop.place.placeName} ${S.CAPTION_LABEL}`}
            placeholder={V.CAPTION_PLACEHOLDER}
            placeholderTextColor={palette.mutedText}
            value={item?.caption ?? ''}
            maxLength={APP_CONFIG.REEL.CAPTION_LIMIT}
            editable={!busy && !editMode}
            style={[styles.placeNameInput, styles.descriptionInput]}
            multiline
            onChangeText={(caption) => updateItem(stop, { caption })}
          />
        </View>
      </View>
    );
  }
  return (
    <Modal
      visible
      animationType='slide'
      presentationStyle='fullScreen'
      onRequestClose={handleBack}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
          <KeyboardAvoidingView
            style={styles.screen}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}>
            {busyPhase === 'render' ? (
              <View style={styles.rendering} testID='reel-rendering'>
                <Text style={styles.renderText}>{V.GENERATING}</Text>
                <ReelProgressBar progress={progress} />
                <Text style={styles.music}>{V.MUSIC}</Text>
              </View>
            ) : (
              <>
                <View style={styles.header}>
                  <TouchableOpacity
                    testID='reel-back'
                    accessibilityRole='button'
                    accessibilityLabel={V.BACK}
                    onPress={handleBack}
                    style={styles.close}>
                    <BookingReelAsset name={output ? 'back' : 'backEditor'} />
                  </TouchableOpacity>
                  <Text style={styles.title}>{V.TITLE}</Text>
                  {output ? (
                    <TouchableOpacity
                      testID='reel-close'
                      accessibilityRole='button'
                      accessibilityLabel={S.CLOSE}
                      onPress={requestClose}
                      style={styles.close}>
                      <BookingReelAsset name='close' />
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      testID='reel-info'
                      accessibilityRole='button'
                      accessibilityLabel={V.INFO_TITLE}
                      style={styles.close}
                      onPress={() => {
                        Keyboard.dismiss();
                        setEditorDialog('info');
                      }}>
                      <View style={styles.infoIcon}>
                        <BookingReelAsset name='info' />
                        <Text accessible={false} style={styles.infoMark}>
                          !
                        </Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </View>
                {output ? (
                  <ScrollView contentContainerStyle={styles.completeBody}>
                    <Text style={styles.completeTitle}>{V.COMPLETE}</Text>
                    <TouchableOpacity
                      testID='reel-watch'
                      accessibilityRole='button'
                      accessibilityLabel={S.WATCH}
                      disabled={busy}
                      style={styles.completedPreview}
                      onPress={() => outputAction('watch')}>
                      <ReelPreview plan={plan} compact />
                    </TouchableOpacity>
                    <Text style={styles.music}>{V.MUSIC}</Text>
                    {!!status && (
                      <Text
                        accessibilityLiveRegion='polite'
                        style={styles.status}>
                        {status}
                      </Text>
                    )}
                    {!!error && (
                      <Text accessibilityRole='alert' style={styles.error}>
                        {error}
                      </Text>
                    )}
                    <SafeAreaView
                      style={styles.outputActions}
                      edges={['bottom']}>
                      <TouchableOpacity
                        testID='reel-share'
                        accessibilityRole='button'
                        disabled={busy}
                        style={styles.primary}
                        onPress={() => outputAction('share')}>
                        <Text style={styles.primaryText}>{V.SHARE}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        testID='reel-save'
                        accessibilityRole='button'
                        disabled={busy}
                        style={styles.primary}
                        onPress={() => outputAction('save')}>
                        <Text style={styles.primaryText}>
                          {Platform.OS === 'android' &&
                          Number(Platform.Version) < 29
                            ? S.SAVE_FILE
                            : V.SAVE}
                        </Text>
                      </TouchableOpacity>
                    </SafeAreaView>
                  </ScrollView>
                ) : (
                  <>
                    <View style={styles.courseMeta}>
                      <Text style={styles.destination}>
                        {course.destinationCountry} | {course.destinationCity}
                      </Text>
                      <Text style={styles.datesText}>
                        {course.startDate.replace(/-/g, '.').slice(2)} -{' '}
                        {(
                          course.itinerary.days.at(-1)?.date || course.startDate
                        )
                          .replace(/-/g, '.')
                          .slice(2)}
                      </Text>
                    </View>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.daysScroll}
                      contentContainerStyle={styles.days}>
                      {course.itinerary.days.map((d) => (
                        <TouchableOpacity
                          key={d.day}
                          testID={`reel-day-${d.day}`}
                          accessibilityRole='button'
                          accessibilityState={{
                            selected: selectedDay === d.day,
                          }}
                          disabled={busy}
                          style={[
                            styles.day,
                            selectedDay === d.day && styles.daySelected,
                          ]}
                          onPress={() => {
                            if (selectedDay === d.day) return;
                            blurInput();
                            Keyboard.dismiss();
                            invalidate();
                            setMapState(null);
                            setEditMode(false);
                            setSelectedDay(d.day);
                          }}>
                          <Text
                            style={
                              selectedDay === d.day
                                ? styles.daySelectedText
                                : styles.dayText
                            }>
                            Day {d.day}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                    <View style={styles.editorToolbar}>
                      <TouchableOpacity
                        testID='reel-preview-open'
                        accessibilityRole='button'
                        accessibilityLabel={V.PREVIEW}
                        accessibilityState={{ disabled: !plan || !map || busy }}
                        disabled={!plan || !map || busy}
                        style={styles.previewButton}
                        onPress={() => setPreviewVisible(true)}>
                        <BookingReelAsset name='video' />
                        <Text style={styles.toolbarText}>{V.PREVIEW}</Text>
                      </TouchableOpacity>
                      <View
                        testID='reel-edit-controls'
                        style={styles.editControls}>
                        {editMode && (
                          <TouchableOpacity
                            testID='reel-reset'
                            accessibilityRole='button'
                            accessibilityLabel={S.RESET_ITEMS}
                            disabled={busy}
                            style={styles.editToggle}
                            onPress={() => {
                              blurInput();
                              Keyboard.dismiss();
                              setEditorDialog('reset');
                            }}>
                            <Text style={styles.toolbarText}>
                              {S.RESET_ITEMS}
                            </Text>
                          </TouchableOpacity>
                        )}
                        <TouchableOpacity
                          testID='reel-edit-toggle'
                          accessibilityRole='button'
                          accessibilityLabel={editMode ? V.DONE : V.EDIT}
                          accessibilityState={{ expanded: editMode }}
                          disabled={busy}
                          style={styles.editToggle}
                          onPress={() => {
                            blurInput();
                            Keyboard.dismiss();
                            setEditMode((value) => !value);
                          }}>
                          <Text style={styles.toolbarText}>
                            {editMode ? V.DONE : V.EDIT}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.editorBody}>
                      <FlatList
                        ref={editorList}
                        testID='reel-editor-list'
                        onLayout={revealFocusedInput}
                        onContentSizeChange={revealFocusedInput}
                        keyboardDismissMode='on-drag'
                        onScrollBeginDrag={blurInput}
                        scrollEventThrottle={16}
                        onScroll={(event) => {
                          editorScrollOffset.current =
                            event.nativeEvent.contentOffset.y;
                        }}
                        style={styles.editorList}
                        data={stops}
                        keyExtractor={(stop) => reelStopKey(stop)}
                        renderItem={renderStop}
                        keyboardShouldPersistTaps='handled'
                        contentContainerStyle={[
                          styles.content,
                          editorInsets.content,
                        ]}
                        extraData={{ draft, busy, editMode }}
                        ListEmptyComponent={
                          <Text style={styles.hint}>{S.EMPTY_DAY}</Text>
                        }
                        ListHeaderComponent={
                          <View
                            testID='reel-intro-fields'
                            style={styles.settings}>
                            <Text style={styles.label}>
                              {S.INTRO_TITLE_LABEL}
                            </Text>
                            <TextInput
                              testID='reel-intro-title'
                              onFocus={focusInput}
                              onBlur={blurInput}
                              accessibilityLabel={S.INTRO_TITLE_LABEL}
                              style={styles.input}
                              placeholder={S.INTRO_TITLE_PLACEHOLDER}
                              placeholderTextColor={palette.mutedText}
                              value={introTitle ?? course.title}
                              maxLength={APP_CONFIG.REEL.TITLE_LIMIT}
                              editable={!busy}
                              onChangeText={(value) => {
                                setHasEdits(true);
                                invalidate();
                                setIntroTitle(value);
                              }}
                            />
                            <Text style={styles.label}>{S.TITLE_LABEL}</Text>
                            <TextInput
                              testID='reel-title'
                              onFocus={focusInput}
                              onBlur={blurInput}
                              accessibilityLabel={S.TITLE_LABEL}
                              style={styles.input}
                              placeholder={S.TITLE_PLACEHOLDER}
                              placeholderTextColor={palette.mutedText}
                              value={introDescription}
                              maxLength={APP_CONFIG.REEL.TITLE_LIMIT}
                              editable={!busy}
                              onChangeText={(value) => {
                                if (value !== introDescription)
                                  setHasEdits(true);
                                invalidate();
                                setIntroDescription(value);
                              }}
                            />
                          </View>
                        }
                        ListFooterComponent={
                          <>
                            {(!!error || tooManyPhotos) && (
                              <Text
                                accessibilityRole='alert'
                                style={styles.error}>
                                {tooManyPhotos ? S.LIMIT : error}
                              </Text>
                            )}
                            {busyPhase === 'photo' && (
                              <ActivityIndicator
                                accessibilityLabel={S.LOADING_PHOTO}
                                color={palette.primary}
                              />
                            )}
                          </>
                        }
                      />
                      {!keyboardVisible && (
                        <SafeAreaView
                          style={[styles.footer, styles.editorFooter]}
                          edges={['bottom']}>
                          <TouchableOpacity
                            testID='reel-create'
                            accessibilityRole='button'
                            accessibilityState={{
                              disabled: !plan || !map || busy,
                            }}
                            disabled={!plan || !map || busy}
                            style={[
                              styles.primary,
                              styles.createButton,
                              (!plan || !map || busy) && styles.disabled,
                            ]}
                            onPress={() => {
                              void create();
                            }}>
                            <Text
                              style={[
                                styles.primaryText,
                                styles.createButtonText,
                                (!plan || !map || busy) && styles.disabledText,
                              ]}>
                              {S.CREATE}
                            </Text>
                          </TouchableOpacity>
                        </SafeAreaView>
                      )}
                    </View>
                  </>
                )}
              </>
            )}
            {day && (
              <View style={styles.routeCapture}>
                <ReelRouteMap
                  key={selectedDay}
                  day={day}
                  onReady={receiveMap}
                  disabled={busy}
                  compact
                />
              </View>
            )}
            {previewVisible && (
              <Modal
                transparent
                visible
                animationType='fade'
                onRequestClose={() => setPreviewVisible(false)}>
                <SafeAreaProvider>
                  <SafeAreaView style={styles.previewOverlay}>
                    <View style={styles.previewStage}>
                      <ReelPreview
                        plan={map ? plan : null}
                        expanded
                        onClose={() => setPreviewVisible(false)}
                      />
                    </View>
                  </SafeAreaView>
                </SafeAreaProvider>
              </Modal>
            )}
          </KeyboardAvoidingView>
          <ReelEditorDialog
            mode={editorDialog}
            destination={`${course.destinationCountry} · ${course.destinationCity}`}
            date={(day?.date || course.startDate).replace(/-/g, '.')}
            onDismiss={() => setEditorDialog(null)}
            onReset={() => {
              setEditorDialog(null);
              resetItems();
            }}
            onLeave={() => {
              setEditorDialog(null);
              onClose();
            }}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

/** Opens the v3 introduction/selection flow or an existing course directly in its editor. */
export function CourseReelComposer({
  course,
  courses = [course],
  courseSummaries,
  initialDay,
  initialStep = 'edit',
  onClose,
}: {
  course: CourseDetail;
  courses?: CourseDetail[];
  courseSummaries?: CourseSummary[];
  initialDay: number;
  initialStep?: 'intro' | 'select' | 'edit';
  onClose: () => void;
}) {
  const [step, setStep] = useState(initialStep);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(
    initialStep === 'edit' ? course.courseId : null,
  );
  const availableDetail = courses.find(
    (item) => item.courseId === selectedCourseId,
  );
  const {
    data: fetchedDetail,
    isFetching,
    isError,
    refetch,
  } = useCourseDetailQuery({
    courseId: selectedCourseId ?? '',
    options: {
      enabled: step === 'edit' && !!selectedCourseId && !availableDetail,
    },
  });
  const selectedCourse = availableDetail ?? fetchedDetail;
  const choices =
    courseSummaries ??
    courses.map((item) => ({
      ...item,
      coverImageUrl: item.coverImageUrl ?? '',
      createdAt: '',
    }));
  const loadingDetail = step === 'edit' && !availableDetail && isFetching;
  const selectionDisabled =
    step !== 'intro' && (!selectedCourseId || loadingDetail);
  const handleBack = () => {
    if (step !== 'intro') setStep('intro');
    else onClose();
  };
  if (step === 'edit' && selectedCourse)
    return (
      <ReelEditor
        key={selectedCourse.courseId}
        course={selectedCourse}
        initialDay={
          selectedCourse.courseId === course.courseId
            ? initialDay
            : selectedCourse.itinerary.days[0]?.day || 1
        }
        onClose={onClose}
      />
    );
  return (
    <Modal
      visible
      animationType='slide'
      presentationStyle='fullScreen'
      onRequestClose={handleBack}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.screen} edges={['top', 'left', 'right']}>
          <View style={styles.header}>
            <TouchableOpacity
              accessibilityRole='button'
              accessibilityLabel={V.BACK}
              style={styles.close}
              onPress={handleBack}>
              <BookingReelAsset name='back' />
            </TouchableOpacity>
            <Text style={styles.title}>{V.TITLE}</Text>
            <View style={styles.close} />
          </View>
          {step === 'intro' ? (
            <ScrollView contentContainerStyle={styles.introBody}>
              <Text style={styles.completeTitle}>{V.INTRO}</Text>
              <View
                style={styles.introPreview}
                accessible
                accessibilityRole='image'
                accessibilityLabel={V.EXAMPLE_VIDEO}>
                <LoopingVideo
                  source={require('../../../assets/reel-example/seoul-day.mp4')}
                  poster={require('../../../assets/reel-example/seoul-day-poster.jpg')}
                  style={styles.exampleVideo}
                  testID='reel-example-video'
                />
              </View>
              <Text style={styles.music}>{V.MUSIC}</Text>
            </ScrollView>
          ) : (
            <FlatList
              data={choices}
              keyExtractor={(item) => item.courseId}
              contentContainerStyle={styles.selectionContent}
              ListHeaderComponent={
                <Text style={[styles.completeTitle, styles.selectionTitle]}>
                  {V.SELECT_TITLE}
                </Text>
              }
              renderItem={({ item }) => (
                <CourseCard
                  testID={`reel-course-${item.courseId}`}
                  item={item}
                  selected={selectedCourseId === item.courseId}
                  onPress={(id) => {
                    setSelectedCourseId(id);
                    setStep('select');
                  }}
                />
              )}
            />
          )}
          <SafeAreaView style={styles.footer} edges={['bottom']}>
            {step === 'edit' && !availableDetail && isError && (
              <Text accessibilityRole='alert' style={styles.status}>
                {V.LOAD_ERROR}
              </Text>
            )}
            <TouchableOpacity
              testID='reel-next'
              accessibilityRole='button'
              accessibilityState={{
                disabled: selectionDisabled,
                busy: loadingDetail,
              }}
              disabled={selectionDisabled}
              style={[styles.primary, selectionDisabled && styles.disabled]}
              onPress={() => {
                if (step === 'edit' && isError) void refetch();
                else setStep(step === 'intro' ? 'select' : 'edit');
              }}>
              {loadingDetail && <ActivityIndicator color={palette.white} />}
              <Text
                style={[
                  styles.primaryText,
                  selectionDisabled && styles.disabledText,
                ]}>
                {step === 'intro' ? V.SELECT_COUNTRY : V.SELECT_DONE}
              </Text>
            </TouchableOpacity>
          </SafeAreaView>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}

function makeEditorInsets(bottomInset: number, keyboardVisible: boolean) {
  return StyleSheet.create({
    content: { paddingBottom: keyboardVisible ? 16 : bottomInset + 100 },
  });
}

const styles = StyleSheet.create({
  routeCapture: { position: 'absolute', left: 20, right: 20, bottom: 82 },
  screen: { flex: 1, backgroundColor: palette.white },
  header: {
    height: 64,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoIcon: { width: 20, height: 20 },
  infoMark: {
    position: 'absolute',
    left: 8,
    top: -3,
    color: palette.mutedText,
    fontSize: 16,
    lineHeight: 27,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: palette.deepNavy,
    letterSpacing: -1,
  },
  close: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editorBody: { flex: 1, backgroundColor: palette.gray100 },
  editorList: { flex: 1, backgroundColor: palette.gray100 },
  editorFooter: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingTop: 16,
    paddingBottom: 22,
    backgroundColor: palette.gray100,
  },
  createButton: {
    boxShadow: [
      {
        offsetX: 2,
        offsetY: 3,
        blurRadius: 16,
        color: hexToRgba(palette.black, 0.12),
      },
      {
        offsetX: 0,
        offsetY: 2,
        blurRadius: 8,
        color: hexToRgba(palette.black, 0.05),
      },
    ],
  },
  createButtonText: { lineHeight: 37 },
  courseMeta: {
    paddingHorizontal: 24,
    paddingTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  destination: { color: palette.deepNavy, fontSize: 16, fontWeight: '500' },
  datesText: { color: palette.subText, fontSize: 16, lineHeight: 24 },
  daysScroll: { flexGrow: 0, flexShrink: 0 },
  days: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 23,
    paddingTop: 16,
    paddingBottom: 15,
  },
  day: {
    minWidth: 67,
    height: 36,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 48,
    backgroundColor: palette.gray200,
    borderWidth: 1,
    borderColor: palette.gray300,
  },
  daySelected: {
    backgroundColor: palette.primary,
    borderColor: palette.primary,
  },
  dayText: { fontSize: 16, color: palette.deepNavy },
  daySelectedText: { fontSize: 16, color: palette.white },
  editorToolbar: {
    backgroundColor: palette.gray100,
    paddingHorizontal: 24,
    minHeight: 51,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 12,
  },
  toolbarText: { color: palette.subText, fontSize: 16 },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 16,
    backgroundColor: palette.gray100,
  },
  placeCard: {
    padding: 16,
    minHeight: 159,
    flexDirection: 'row',
    gap: 13,
    backgroundColor: palette.white,
    borderRadius: 16,
  },
  photo: {
    width: 83,
    height: 127,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: palette.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeBody: { flex: 1, gap: 8 },
  placeHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 4,
    height: 23,
  },
  placeName: {
    flex: 1,
    color: palette.deepNavy,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -1,
  },
  placeNameInput: {
    fontSize: 14,
    lineHeight: 19,
    color: palette.subText,
    paddingHorizontal: 8,
    paddingVertical: 7,
    minHeight: 33,
    borderRadius: 8,
    backgroundColor: palette.gray100,
  },
  descriptionInput: { minHeight: 55, maxHeight: 114, textAlignVertical: 'top' },
  editToggle: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  itemActions: { flexDirection: 'row' },
  itemAction: {
    minHeight: 23,
    width: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settings: { gap: 8, marginBottom: 16 },
  label: { color: palette.deepNavy, fontSize: 14, fontWeight: '600' },
  input: {
    borderRadius: 12,
    padding: 14,
    backgroundColor: palette.white,
    color: palette.deepNavy,
    fontSize: 14,
  },
  hint: { color: palette.subText, fontSize: 12, lineHeight: 19 },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: palette.white,
  },
  primary: {
    backgroundColor: palette.primary,
    borderRadius: 16,
    minHeight: 62,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryText: {
    color: palette.white,
    fontSize: 20,
    fontWeight: '500',
    letterSpacing: -0.6,
  },
  disabled: { backgroundColor: palette.gray200 },
  disabledText: { color: palette.subText },
  rendering: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 18,
  },
  renderText: { color: palette.deepNavy, fontSize: 16 },
  music: {
    color: palette.mutedText,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 24,
    letterSpacing: -0.32,
  },
  completeBody: { flexGrow: 1, paddingHorizontal: 24, paddingBottom: 8 },
  completeTitle: {
    color: palette.deepNavy,
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 27,
    letterSpacing: -1,
    marginTop: 8,
    marginBottom: 24,
  },
  completedPreview: { alignItems: 'center' },
  outputActions: { gap: 12, marginTop: 'auto', paddingBottom: 32 },
  error: {
    color: palette.red700,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 12,
  },
  status: {
    color: palette.darkTeal,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: hexToRgba(palette.black, 0.7),
    paddingHorizontal: 26,
    paddingBottom: 8,
  },
  previewStage: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  exampleVideo: { width: 252, aspectRatio: 9 / 16, borderRadius: 12 },
  introBody: { flexGrow: 1, paddingHorizontal: 24 },
  introPreview: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  selectionContent: { paddingHorizontal: 20, paddingBottom: 20, gap: 16 },
  selectionTitle: { marginBottom: 0 },
});
