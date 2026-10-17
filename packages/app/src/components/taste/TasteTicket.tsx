/**
 * @file TasteTicket.tsx
 * @description UI v3 ticket shared by photo and MBTI results, with data-driven spectra and destination imagery.
 */
import { Text } from '../common/Typography';
import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { TasteProfile } from '@yeolo/common';
import { OnboardingSvg } from './OnboardingIllustrations';
import { palette, hexToRgba } from '../../theme/colors';
import { UI_STRINGS } from '../../constants';
import { CachedImage } from '../common/CachedImage';

export interface TasteTicketProps {
  intro: string;
  hashtags: string[];
  types: TasteProfile['types'];
  recommendCity?: TasteProfile['recommendCity'];
  footer?: React.ReactNode;
  footerStyle?: StyleProp<ViewStyle>;
  testID?: string;
}

/** Maps a returned score to a marker that remains inside the available track. */
function Spectrum({ item }: { item: TasteProfile['types'][number] }) {
  const [width, setWidth] = useState(160);
  const position = Math.min(Math.max(item.score ?? 0, -100), 100);
  const geometry = StyleSheet.create({
    track: { transform: [{ scaleX: width / 160 }] },
    marker: { left: ((position + 100) / 200) * Math.max(0, width - 15) },
  });
  return (
    <View
      style={styles.spectrumItem}
      accessible
      accessibilityLabel={`${item.typeName}, ${item.lowName} / ${item.highName}, ${position}`}>
      <Text style={styles.spectrumTitle}>{item.typeName}</Text>
      <View style={styles.spectrumRow}>
        <Text style={styles.pole}>{item.lowName}</Text>
        <View
          style={styles.trackSpace}
          onLayout={(event: LayoutChangeEvent) =>
            setWidth(event.nativeEvent.layout.width)
          }>
          <View style={[styles.trackAsset, geometry.track]}>
            <OnboardingSvg
              source={require('../../../assets/ui-v3-onboarding/spectrum-track.svg')}
            />
          </View>
          <View style={[styles.marker, geometry.marker]}>
            <OnboardingSvg
              source={require('../../../assets/ui-v3-onboarding/spectrum-point.svg')}
            />
          </View>
        </View>
        <Text style={[styles.pole, styles.highPole]}>{item.highName}</Text>
      </View>
    </View>
  );
}

/** Composes the confirmed ticket hierarchy: summary, spectra, destination, perforation, and actions. */
export function TasteTicket({
  intro,
  hashtags,
  types,
  recommendCity,
  footer,
  footerStyle,
  testID,
}: TasteTicketProps) {
  const photoResult = Boolean(recommendCity);
  const designHeight = photoResult ? 678 : 670;
  const [size, setSize] = useState({ width: 350, height: designHeight });
  const perforation = StyleSheet.create({
    line: {
      width: photoResult ? 313 : 314,
      transform: [
        { scaleX: Math.max(1, size.width - 36) / (photoResult ? 313 : 314) },
      ],
    },
    background: {
      width: 350,
      height: designHeight,
      transform: [
        { scaleX: size.width / 350 },
        { scaleY: size.height / designHeight },
      ],
    },
  });
  return (
    <View
      style={styles.ticket}
      testID={testID}
      onLayout={(event) => setSize(event.nativeEvent.layout)}>
      <View
        style={styles.backgroundFrame}
        pointerEvents='none'
        accessible={false}>
        <View style={perforation.background}>
          <OnboardingSvg
            source={
              photoResult
                ? require('../../../assets/ui-v3-onboarding/ticket-photo.svg')
                : require('../../../assets/ui-v3-onboarding/ticket-mbti.svg')
            }
          />
        </View>
      </View>
      <View style={[styles.header, !photoResult && styles.mbtiHeader]}>
        <Text style={styles.intro}>{intro}</Text>
        <Text style={styles.tags}>
          {hashtags
            .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`))
            .join(' ')}
        </Text>
      </View>
      <View style={styles.spectra}>
        {types.map((item) => (
          <Spectrum key={item.typeCode} item={item} />
        ))}
      </View>
      {recommendCity && (
        <View style={styles.destination} testID='recommend-city-card'>
          {recommendCity.imageUrl ? (
            <View style={styles.destinationImageFrame}>
              <CachedImage
                source={{ uri: recommendCity.imageUrl }}
                style={styles.destinationImage}
                contentFit='cover'
              />
              <LinearGradient
                colors={[palette.white, hexToRgba(palette.white, 0)]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.imageFade}
              />
            </View>
          ) : null}
          <View style={styles.destinationCopy}>
            <Text style={styles.destinationLabel}>
              {UI_STRINGS.TASTE_PROFILE.RECOMMEND_CITY_TITLE}
            </Text>
            <Text style={styles.destinationTitle}>
              {recommendCity.countryName} · {recommendCity.cityName}
            </Text>
            <Text style={styles.destinationReason}>{recommendCity.reason}</Text>
          </View>
        </View>
      )}
      {footer && (
        <>
          <View
            style={[
              styles.perforation,
              !photoResult && styles.mbtiPerforation,
            ]}>
            <View style={[styles.perforationLine, perforation.line]}>
              <OnboardingSvg
                source={
                  photoResult
                    ? require('../../../assets/ui-v3-onboarding/ticket-perforation-photo.svg')
                    : require('../../../assets/ui-v3-onboarding/ticket-perforation-mbti.svg')
                }
              />
            </View>
          </View>
          <View
            style={[
              styles.footer,
              !photoResult && styles.mbtiFooter,
              footerStyle,
            ]}>
            {footer}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ticket: {
    position: 'relative',
  },
  backgroundFrame: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingTop: 28,
    paddingHorizontal: 20,
    paddingBottom: 20,
    minHeight: 130,
    gap: 7,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mbtiHeader: { paddingTop: 44, paddingBottom: 18, minHeight: 144 },
  intro: {
    fontSize: 20,
    lineHeight: 29,
    letterSpacing: -1,
    fontWeight: '600',
    color: palette.deepNavy,
    textAlign: 'center',
  },
  tags: {
    fontSize: 14,
    lineHeight: 17,
    color: palette.subText,
    textAlign: 'center',
  },
  spectra: {
    marginHorizontal: 20,
    backgroundColor: palette.white,
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 24,
    gap: 28,
    minHeight: 241,
  },
  spectrumItem: { gap: 5 },
  spectrumTitle: {
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '500',
    color: palette.mutedText,
  },
  spectrumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 24,
  },
  pole: {
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: -1,
    fontWeight: '600',
    color: palette.deepNavy,
    minWidth: 36,
  },
  highPole: { textAlign: 'right' },
  trackSpace: {
    flex: 1,
    height: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackAsset: { width: 160, height: 9 },
  marker: { position: 'absolute', top: 0, width: 15, height: 15 },
  destination: {
    minHeight: 131,
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: palette.white,
    borderRadius: 20,
    overflow: 'hidden',
  },
  destinationImageFrame: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 109,
  },
  destinationImage: { width: '100%', height: '100%' },
  imageFade: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 55 },
  destinationCopy: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    width: '78%',
    gap: 3,
  },
  destinationLabel: { fontSize: 12, lineHeight: 16, color: palette.mutedText },
  destinationTitle: {
    fontSize: 20,
    lineHeight: 26,
    letterSpacing: -1,
    fontWeight: '600',
    color: palette.deepNavy,
  },
  destinationReason: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    color: palette.deepNavy,
  },
  perforation: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mbtiPerforation: { height: 103 },
  perforationLine: { height: 1 },
  footer: { paddingHorizontal: 20, minHeight: 104, paddingBottom: 12 },
  mbtiFooter: { minHeight: 182, gap: 17, paddingBottom: 41 },
});
