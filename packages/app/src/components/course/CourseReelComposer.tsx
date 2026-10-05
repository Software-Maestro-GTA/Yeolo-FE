/**
 * @file CourseReelComposer.tsx
 * @description Course-day photo/caption editor with portrait preview and cancellable MP4 export/save/share.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { CourseDetail, ItineraryStop } from '@yeolo/common';
import { APP_CONFIG } from '../../constants/config';
import { UI_STRINGS } from '../../constants/strings';
import { palette } from '../../theme/colors';
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
import { ReelPreview } from './ReelPreview';
import { ReelRouteMap } from './ReelRouteMap';

type DayDraft = { photos: ReelPhoto[]; firstPlaceId?: string };
const S = UI_STRINGS.REEL;

/** Edits one date at a time; all images stay on the device and output changes invalidate the MP4. */
export function CourseReelComposer({
  course,
  initialDay,
  onClose,
}: {
  course: CourseDetail;
  initialDay: number;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [selectedDay, setSelectedDay] = useState(initialDay);
  const [drafts, setDrafts] = useState<Record<number, DayDraft>>({});
  const [title, setTitle] = useState(
    `${course.destinationCity}${S.TITLE_SUFFIX}`,
  );
  const [ending, setEnding] = useState<string>(S.ENDING_DEFAULT);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);
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
    return buildReelPlan(
      day,
      draft.photos,
      title,
      ending,
      draft.firstPlaceId,
      map,
    );
  }, [day, draft.photos, draft.firstPlaceId, title, ending, map]);
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
  function updateDraft(next: DayDraft) {
    invalidate();
    setDrafts((prev) => ({ ...prev, [selectedDay]: next }));
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
              placeName: existing?.placeName ?? stop.place.placeName,
              caption: existing?.caption ?? stop.memo ?? stop.place.placeName,
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
      setStatus(S.READY);
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
  function renderStop({ item: stop }: { item: ItineraryStop }) {
    const photo = draft.photos.find((p) => p.placeId === stop.place.placeId);
    const first =
      (draft.firstPlaceId ||
        (day ? reelPhotoStops(day) : []).find((s) =>
          draft.photos.some((p) => p.placeId === s.place.placeId),
        )?.place.placeId) === stop.place.placeId;
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
            <Ionicons
              name='image-outline'
              size={24}
              color={palette.mutedText}
            />
          )}
        </TouchableOpacity>
        <View style={styles.placeBody}>
          <Text style={styles.placeName}>
            {stop.sequence}. {stop.place.placeName}
          </Text>
          {photo ? (
            <>
              <Text style={styles.hint}>{S.PLACE_NAME_LABEL}</Text>
              <TextInput
                testID={`reel-place-name-${stop.place.placeId}`}
                accessibilityLabel={`${stop.place.placeName} ${S.PLACE_NAME_LABEL}`}
                value={photo.placeName ?? stop.place.placeName}
                maxLength={APP_CONFIG.REEL.TITLE_LIMIT}
                editable={!busy}
                style={styles.captionInput}
                onChangeText={(placeName) =>
                  updateDraft({
                    ...draft,
                    photos: draft.photos.map((p) =>
                      p.placeId === photo.placeId ? { ...p, placeName } : p,
                    ),
                  })
                }
              />
              <Text style={styles.hint}>{S.CAPTION_LABEL}</Text>
              <TextInput
                testID={`reel-caption-${stop.place.placeId}`}
                accessibilityLabel={`${stop.place.placeName} ${S.CAPTION_LABEL}`}
                value={photo.caption}
                maxLength={APP_CONFIG.REEL.CAPTION_LIMIT}
                editable={!busy}
                style={styles.captionInput}
                multiline
                onChangeText={(caption) =>
                  updateDraft({
                    ...draft,
                    photos: draft.photos.map((p) =>
                      p.placeId === photo.placeId ? { ...p, caption } : p,
                    ),
                  })
                }
              />
              <View style={styles.photoActions}>
                <TouchableOpacity
                  disabled={busy}
                  accessibilityRole='button'
                  accessibilityState={{ selected: first }}
                  onPress={() =>
                    updateDraft({ ...draft, firstPlaceId: photo.placeId })
                  }>
                  <Text style={first ? styles.selectedText : styles.actionText}>
                    {first ? S.FIRST_SELECTED : S.FIRST_PHOTO}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  disabled={busy}
                  accessibilityRole='button'
                  accessibilityLabel={`${stop.place.placeName} ${S.REMOVE_PHOTO}`}
                  onPress={() =>
                    updateDraft({
                      photos: draft.photos.filter(
                        (p) => p.placeId !== photo.placeId,
                      ),
                      firstPlaceId:
                        draft.firstPlaceId === photo.placeId
                          ? undefined
                          : draft.firstPlaceId,
                    })
                  }>
                  <Text style={styles.actionText}>{S.REMOVE_PHOTO}</Text>
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <Text style={styles.hint}>{S.ADD_PHOTO}</Text>
          )}
        </View>
      </View>
    );
  }
  return (
    <Modal
      visible
      animationType='slide'
      presentationStyle='fullScreen'
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[
          styles.screen,
          { paddingTop: insets.top, paddingBottom: insets.bottom },
        ]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>{S.TITLE}</Text>
            <Text style={styles.hint}>{course.destinationCity}</Text>
          </View>
          <TouchableOpacity
            testID='reel-close'
            accessibilityRole='button'
            accessibilityLabel={S.CLOSE}
            onPress={onClose}
            style={styles.close}>
            <Ionicons name='close' size={24} color={palette.deepNavy} />
          </TouchableOpacity>
        </View>
        <FlatList
          data={day ? reelPhotoStops(day) : []}
          keyExtractor={(stop) => stop.place.placeId}
          renderItem={renderStop}
          keyboardShouldPersistTaps='handled'
          contentContainerStyle={styles.content}
          extraData={{ draft, busy }}
          ListEmptyComponent={<Text style={styles.hint}>{S.EMPTY_DAY}</Text>}
          ListHeaderComponent={
            <>
              <Text style={styles.description}>{S.DESCRIPTION}</Text>
              <View style={styles.days}>
                {course.itinerary.days.map((d) => (
                  <TouchableOpacity
                    key={d.day}
                    testID={`reel-day-${d.day}`}
                    accessibilityRole='button'
                    accessibilityState={{ selected: selectedDay === d.day }}
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
                      DAY {d.day}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <ReelPreview plan={map ? plan : null} />
              {day && (
                <ReelRouteMap
                  key={selectedDay}
                  day={day}
                  onReady={setMap}
                  disabled={busy}
                />
              )}
              <Text style={styles.label}>{S.TITLE_LABEL}</Text>
              <TextInput
                testID='reel-title'
                accessibilityLabel={S.TITLE_LABEL}
                style={styles.input}
                value={title}
                maxLength={APP_CONFIG.REEL.TITLE_LIMIT}
                editable={!busy}
                onChangeText={(value) => {
                  invalidate();
                  setTitle(value);
                }}
              />
              <Text style={styles.label}>{S.ENDING_LABEL}</Text>
              <TextInput
                testID='reel-ending'
                accessibilityLabel={S.ENDING_LABEL}
                style={styles.input}
                value={ending}
                maxLength={APP_CONFIG.REEL.CAPTION_LIMIT}
                editable={!busy}
                multiline
                onChangeText={(value) => {
                  invalidate();
                  setEnding(value);
                }}
              />
              <Text style={styles.label}>
                {S.PHOTOS} · {draft.photos.length}/{APP_CONFIG.REEL.MAX_PHOTOS}
              </Text>
              <Text style={styles.hint}>{S.PHOTO_HINT}</Text>
            </>
          }
          ListFooterComponent={
            <>
              <Text style={styles.music}>{S.MUSIC_HINT}</Text>
              {!!error && (
                <Text accessibilityRole='alert' style={styles.error}>
                  {error}
                </Text>
              )}
              {!!status && (
                <Text accessibilityLiveRegion='polite' style={styles.status}>
                  {status}
                </Text>
              )}
              {busy && (
                <View style={styles.progress}>
                  <ActivityIndicator color={palette.primary} />
                  <Text style={styles.hint}>
                    {busyPhase === 'render'
                      ? `${S.GENERATING} ${Math.round(progress * 100)}%`
                      : busyPhase === 'photo'
                        ? S.LOADING_PHOTO
                        : S.WORKING_VIDEO}
                  </Text>
                </View>
              )}
              {output ? (
                <View style={styles.outputActions}>
                  <TouchableOpacity
                    testID='reel-watch'
                    accessibilityRole='button'
                    disabled={busy}
                    style={styles.secondary}
                    onPress={() => outputAction('watch')}>
                    <Text style={styles.secondaryText}>{S.WATCH}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    testID='reel-save'
                    accessibilityRole='button'
                    disabled={busy}
                    style={styles.secondary}
                    onPress={() => outputAction('save')}>
                    <Text style={styles.secondaryText}>
                      {Platform.OS === 'android' &&
                      Number(Platform.Version) < 29
                        ? S.SAVE_FILE
                        : S.SAVE}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    testID='reel-share'
                    accessibilityRole='button'
                    disabled={busy}
                    style={styles.primary}
                    onPress={() => outputAction('share')}>
                    <Text style={styles.primaryText}>{S.SHARE}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
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
                  <Text style={styles.primaryText}>{S.CREATE}</Text>
                </TouchableOpacity>
              )}
            </>
          }
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: palette.softMint },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: palette.gray200,
  },
  title: { fontSize: 20, fontWeight: '800', color: palette.deepNavy },
  close: { padding: 8 },
  content: { padding: 20, paddingBottom: 40, gap: 12 },
  description: { color: palette.subText, fontSize: 14, lineHeight: 22 },
  days: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  day: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: palette.white,
  },
  daySelected: { backgroundColor: palette.deepNavy },
  dayText: { fontSize: 13, color: palette.subText },
  daySelectedText: { fontSize: 13, color: palette.white, fontWeight: '700' },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: palette.deepNavy,
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: palette.gray200,
    borderRadius: 12,
    padding: 14,
    backgroundColor: palette.white,
    color: palette.deepNavy,
    fontSize: 14,
  },
  hint: { color: palette.subText, fontSize: 12, lineHeight: 19 },
  placeCard: {
    padding: 12,
    flexDirection: 'row',
    gap: 12,
    backgroundColor: palette.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: palette.gray200,
  },
  photo: {
    width: 76,
    height: 100,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: palette.gray100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  placeBody: { flex: 1, gap: 8 },
  placeName: { color: palette.deepNavy, fontSize: 14, fontWeight: '700' },
  captionInput: {
    fontSize: 13,
    lineHeight: 19,
    color: palette.subText,
    padding: 6,
    borderRadius: 6,
    backgroundColor: palette.softMint,
  },
  photoActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  actionText: { fontSize: 12, color: palette.subText, paddingVertical: 6 },
  selectedText: {
    fontSize: 12,
    color: palette.primary,
    fontWeight: '700',
    paddingVertical: 6,
  },
  music: {
    color: palette.subText,
    fontSize: 12,
    lineHeight: 20,
    marginVertical: 16,
  },
  primary: {
    backgroundColor: palette.primary,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  primaryText: { color: palette.white, fontSize: 15, fontWeight: '700' },
  disabled: { opacity: 0.45 },
  secondary: {
    borderWidth: 1,
    borderColor: palette.gray200,
    backgroundColor: palette.white,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  secondaryText: { color: palette.deepNavy, fontSize: 14, fontWeight: '600' },
  outputActions: { gap: 10 },
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
    marginBottom: 12,
  },
  progress: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
});
