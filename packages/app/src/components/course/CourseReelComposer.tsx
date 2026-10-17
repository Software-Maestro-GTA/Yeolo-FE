/**
 * @file CourseReelComposer.tsx
 * @description Course-day photo/caption editor with portrait preview and cancellable MP4 export/save/share.
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
  type ReelPhoto,
  type ReelMapSnapshot,
} from '../../services/courseReelService';
import {
  ReelEditorDialog,
  type ReelEditorDialogMode,
} from './ReelEditorDialog';
import { ReelPreview } from './ReelPreview';
import { ReelRouteMap } from './ReelRouteMap';

type DayDraft = {
  photos: ReelPhoto[];
  text?: Record<string, { placeName: string; caption: string }>;
};
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
  const revealFocusedInput = useCallback(() => {
    if (revealFrame.current !== null) cancelAnimationFrame(revealFrame.current);
    revealFrame.current = requestAnimationFrame(() => {
      revealFrame.current = null;
      if (focusedInput.current === null) return;
      const target = focusedInput.current;
      const viewport = editorList.current?.getNativeScrollRef() as
        React.ElementRef<typeof View> | null | undefined;
      viewport?.measureInWindow((_x, top, _width, height) => {
        UIManager.measureInWindow(
          target,
          (_inputX, inputTop, _inputWidth, inputHeight) => {
            if (focusedInput.current !== target || height <= 0) return;
            const visibleTop = top + 16;
            const visibleBottom = top + height - 16;
            const delta =
              inputTop + inputHeight > visibleBottom
                ? inputTop + inputHeight - visibleBottom
                : inputTop < visibleTop
                  ? inputTop - visibleTop
                  : 0;
            if (Math.abs(delta) < 1) return;
            editorList.current?.scrollToOffset({
              offset: Math.max(0, editorScrollOffset.current + delta),
              animated: true,
            });
          },
        );
      });
    });
  }, []);
  useEffect(() => {
    const shown = Keyboard.addListener('keyboardDidShow', revealFocusedInput);
    return () => {
      shown.remove();
      if (revealFrame.current !== null)
        cancelAnimationFrame(revealFrame.current);
    };
  }, [revealFocusedInput]);
  const focusInput: NonNullable<
    React.ComponentProps<typeof TextInput>['onFocus']
  > = (event) => {
    focusedInput.current = event.nativeEvent.target;
    revealFocusedInput();
  };
  const blurInput = () => {
    focusedInput.current = null;
  };
  const [editorDialog, setEditorDialog] = useState<ReelEditorDialogMode>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState(initialDay);
  const [drafts, setDrafts] = useState<Record<number, DayDraft>>({});
  const [hasEdits, setHasEdits] = useState(false);
  const [title, setTitle] = useState(
    `${course.destinationCity}${S.TITLE_SUFFIX}`,
  );
  const [ending, setEnding] = useState<string>(S.ENDING_DEFAULT);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const progressStyles = useMemo(
    () => makeProgressStyles(progress),
    [progress],
  );
  const [busyPhase, setBusyPhase] = useState<
    'photo' | 'render' | 'action' | null
  >(null);
  const busy = busyPhase !== null;
  const [output, setOutput] = useState<string | null>(null);
  const [map, setMap] = useState<ReelMapSnapshot | null>(null);
  const alive = useRef(true);
  const outputRef = useRef<string | null>(null);
  const operation = useRef(false);
  const day = course.itinerary.days.find((d) => d.day === selectedDay);
  const draft = drafts[selectedDay] || { photos: [] };
  const plan = useMemo(() => {
    if (!day || !draft.photos.length) return null;
    return buildReelPlan(day, draft.photos, title, ending, undefined, map);
  }, [day, draft.photos, title, ending, map]);
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
  function stopText(stop: ItineraryStop) {
    const photo = draft.photos.find((p) => p.placeId === stop.place.placeId);
    return (
      draft.text?.[stop.place.placeId] ?? {
        placeName:
          photo?.placeName ??
          stop.place.placeName.slice(0, APP_CONFIG.REEL.TITLE_LIMIT),
        caption:
          photo?.caption ??
          (
            stop.memo?.trim() ||
            stop.reason?.trim() ||
            stop.place.placeName
          ).slice(0, APP_CONFIG.REEL.CAPTION_LIMIT),
      }
    );
  }
  function updateStopText(
    stop: ItineraryStop,
    change: Partial<{ placeName: string; caption: string }>,
  ) {
    const text = { ...stopText(stop), ...change };
    updateDraft({
      ...draft,
      text: { ...draft.text, [stop.place.placeId]: text },
      photos: draft.photos.map((photo) =>
        photo.placeId === stop.place.placeId ? { ...photo, ...text } : photo,
      ),
    });
  }
  async function addPhoto(stop: ItineraryStop) {
    if (operation.current) return;
    const existing = draft.photos.find((p) => p.placeId === stop.place.placeId);
    if (!existing && draft.photos.length >= APP_CONFIG.REEL.MAX_PHOTOS) {
      setError(S.LIMIT);
      return;
    }
    operation.current = true;
    setBusyPhase('photo');
    setError('');
    try {
      const uri = await pickReelPhoto();
      if (uri && alive.current)
        updateDraft({
          ...draft,
          photos: [
            ...draft.photos.filter((p) => p.placeId !== stop.place.placeId),
            {
              placeId: stop.place.placeId,
              uri,
              ...stopText(stop),
            },
          ],
        });
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
        if (alive.current) setProgress(value);
      });
      if (!alive.current) {
        await deleteReel(uri);
        return;
      }
      outputRef.current = uri;
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
  const stops = useMemo(() => (day ? reelPhotoStops(day) : []), [day]);
  function renderStop({ item: stop }: { item: ItineraryStop }) {
    const photo = draft.photos.find((p) => p.placeId === stop.place.placeId);
    return (
      <View style={styles.placeCard}>
        <TouchableOpacity
          testID={`reel-photo-${stop.place.placeId}`}
          accessibilityRole='button'
          accessibilityLabel={`${stop.place.placeName} ${photo ? S.CHANGE_PHOTO : S.ADD_PHOTO}`}
          style={styles.photo}
          disabled={busy}
          onPress={() => addPhoto(stop)}>
          {photo ? (
            <Image source={{ uri: photo.uri }} style={styles.photoImage} />
          ) : (
            <BookingReelAsset name='photo' />
          )}
        </TouchableOpacity>
        <View style={styles.placeBody}>
          <View style={styles.placeHeading}>
            <Text style={styles.placeName} numberOfLines={1}>
              {stop.place.placeName}
            </Text>
          </View>
          <TextInput
            testID={`reel-place-name-${stop.place.placeId}`}
            onFocus={focusInput}
            onBlur={blurInput}
            accessibilityLabel={`${stop.place.placeName} ${S.PLACE_NAME_LABEL}`}
            placeholder={V.TITLE_PLACEHOLDER}
            placeholderTextColor={palette.mutedText}
            value={stopText(stop).placeName}
            maxLength={APP_CONFIG.REEL.TITLE_LIMIT}
            editable={!busy}
            style={styles.captionInput}
            onChangeText={(placeName) => updateStopText(stop, { placeName })}
          />
          <TextInput
            testID={`reel-caption-${stop.place.placeId}`}
            onFocus={focusInput}
            onBlur={blurInput}
            accessibilityLabel={`${stop.place.placeName} ${S.CAPTION_LABEL}`}
            placeholder={V.CAPTION_PLACEHOLDER}
            placeholderTextColor={palette.mutedText}
            value={stopText(stop).caption}
            maxLength={APP_CONFIG.REEL.CAPTION_LIMIT}
            editable={!busy}
            style={[styles.captionInput, styles.captionArea]}
            multiline
            onChangeText={(caption) => updateStopText(stop, { caption })}
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
                <View
                  style={styles.progressTrack}
                  accessibilityRole='progressbar'
                  accessibilityValue={{
                    min: 0,
                    max: 100,
                    now: Math.round(progress * 100),
                  }}>
                  <View style={[styles.progressFill, progressStyles.fill]} />
                  <View style={progressStyles.remaining} />
                </View>
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
                            invalidate();
                            setMap(null);
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
                        disabled={!plan}
                        style={styles.previewButton}
                        onPress={() => setPreviewVisible(true)}>
                        <BookingReelAsset name='video' />
                        <Text style={styles.toolbarText}>{V.PREVIEW}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        testID='reel-settings-toggle'
                        accessibilityRole='button'
                        accessibilityLabel={V.SETTINGS}
                        accessibilityState={{ expanded: settingsVisible }}
                        onPress={() => setSettingsVisible(!settingsVisible)}
                        style={styles.settingsToggle}>
                        <Text style={styles.toolbarText}>
                          {V.TITLE_SETTINGS}
                        </Text>
                        <Ionicons
                          name={settingsVisible ? 'chevron-up' : 'chevron-down'}
                          size={16}
                          color={palette.subText}
                        />
                      </TouchableOpacity>
                    </View>
                    <FlatList
                      ref={editorList}
                      testID='reel-editor-list'
                      onLayout={revealFocusedInput}
                      onContentSizeChange={revealFocusedInput}
                      keyboardDismissMode='on-drag'
                      scrollEventThrottle={16}
                      onScroll={(event) => {
                        editorScrollOffset.current =
                          event.nativeEvent.contentOffset.y;
                      }}
                      style={styles.editorList}
                      data={stops}
                      keyExtractor={(stop) => stop.place.placeId}
                      renderItem={renderStop}
                      keyboardShouldPersistTaps='handled'
                      contentContainerStyle={styles.content}
                      extraData={{ draft, busy }}
                      ListEmptyComponent={
                        <Text style={styles.hint}>{S.EMPTY_DAY}</Text>
                      }
                      ListHeaderComponent={
                        settingsVisible ? (
                          <View style={styles.settings}>
                            <Text style={styles.label}>{S.TITLE_LABEL}</Text>
                            <TextInput
                              testID='reel-title'
                              onFocus={focusInput}
                              onBlur={blurInput}
                              accessibilityLabel={S.TITLE_LABEL}
                              style={styles.input}
                              value={title}
                              maxLength={APP_CONFIG.REEL.TITLE_LIMIT}
                              editable={!busy}
                              onChangeText={(value) => {
                                if (value !== title) setHasEdits(true);
                                invalidate();
                                setTitle(value);
                              }}
                            />
                            <Text style={styles.label}>{S.ENDING_LABEL}</Text>
                            <TextInput
                              testID='reel-ending'
                              onFocus={focusInput}
                              onBlur={blurInput}
                              accessibilityLabel={S.ENDING_LABEL}
                              style={styles.input}
                              value={ending}
                              maxLength={APP_CONFIG.REEL.CAPTION_LIMIT}
                              editable={!busy}
                              multiline
                              onChangeText={(value) => {
                                if (value !== ending) setHasEdits(true);
                                invalidate();
                                setEnding(value);
                              }}
                            />
                          </View>
                        ) : null
                      }
                      ListFooterComponent={
                        <>
                          {!!error && (
                            <Text
                              accessibilityRole='alert'
                              style={styles.error}>
                              {error}
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
                    <SafeAreaView
                      style={[styles.footer, styles.editorFooter]}
                      edges={['bottom']}>
                      <TouchableOpacity
                        testID='reel-create'
                        accessibilityRole='button'
                        accessibilityState={{ disabled: !plan || !map || busy }}
                        disabled={!plan || !map || busy}
                        style={[
                          styles.primary,
                          (!plan || !map || busy) && styles.disabled,
                        ]}
                        onPress={() => {
                          void create();
                        }}>
                        <Text
                          style={[
                            styles.primaryText,
                            (!plan || !map || busy) && styles.disabledText,
                          ]}>
                          {S.CREATE}
                        </Text>
                      </TouchableOpacity>
                    </SafeAreaView>
                  </>
                )}
              </>
            )}
            {day && (
              <View style={styles.routeCapture}>
                <ReelRouteMap
                  key={selectedDay}
                  day={day}
                  onReady={setMap}
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
              <View style={styles.introPreview}>
                <ReelPreview plan={null} intro />
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

function makeProgressStyles(progress: number) {
  const fraction = Math.min(1, Math.max(0, progress));
  return StyleSheet.create({
    fill: { flex: Math.max(0.01, fraction) },
    remaining: { flex: 1 - fraction },
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
  editorList: { flex: 1, backgroundColor: palette.gray100 },
  editorFooter: { backgroundColor: palette.gray100 },
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
    minHeight: 23,
  },
  placeName: {
    flex: 1,
    color: palette.deepNavy,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -1,
  },
  captionInput: {
    fontSize: 14,
    lineHeight: 19,
    color: palette.subText,
    paddingHorizontal: 8,
    paddingVertical: 7,
    minHeight: 33,
    borderRadius: 8,
    backgroundColor: palette.gray100,
  },
  captionArea: { minHeight: 55, textAlignVertical: 'top' },
  settingsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
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
  progressTrack: {
    width: 249,
    height: 9,
    borderRadius: 5,
    overflow: 'hidden',
    flexDirection: 'row',
    backgroundColor: palette.gray200,
  },
  progressFill: { backgroundColor: palette.primary },
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
  outputActions: { gap: 12, marginTop: 'auto' },
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
  introBody: { flexGrow: 1, paddingHorizontal: 24 },
  introPreview: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  selectionContent: { paddingHorizontal: 20, paddingBottom: 20, gap: 16 },
  selectionTitle: { marginBottom: 0 },
});
