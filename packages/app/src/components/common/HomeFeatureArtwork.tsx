/**
 * @file HomeFeatureArtwork.tsx
 * @description UI v3 home button artwork composed from original transparent Figma layers.
 */
import React from 'react';
import { StyleSheet, View } from 'react-native';
import BubbleLineOne from '../../../assets/figma-v3/screen-media/bubble-line-1.svg';
import BubbleLineTwo from '../../../assets/figma-v3/screen-media/bubble-line-2.svg';
import BubbleLineThree from '../../../assets/figma-v3/screen-media/bubble-line-3.svg';
import BubbleLineFour from '../../../assets/figma-v3/screen-media/bubble-line-4.svg';
import { CachedImage } from './CachedImage';

/** Preserves authored layer sizes, rotation and stacking inside each 165pt card. */
export function HomeFeatureArtwork({ kind }: { kind: 'taste' | 'create' }) {
  return (
    <View style={styles.canvas} pointerEvents='none' accessible={false}>
      {kind === 'taste' ? (
        <>
          <CachedImage
            source={require('../../../assets/figma-v3/screen-media/phone-shadow.png')}
            style={styles.phoneShadow}
            contentFit='contain'
          />
          <CachedImage
            source={require('../../../assets/figma-v3/screen-media/phone.png')}
            style={styles.phone}
            contentFit='contain'
          />
          <CachedImage
            source={require('../../../assets/figma-v3/screen-media/magnifier.png')}
            style={styles.magnifier}
            contentFit='contain'
          />
          <CachedImage
            source={require('../../../assets/figma-v3/screen-media/bubble.png')}
            style={styles.bubbleOne}
            contentFit='contain'
          />
          <View style={styles.lineOne}>
            <BubbleLineOne />
          </View>
          <View style={styles.lineTwo}>
            <BubbleLineTwo />
          </View>
          <CachedImage
            source={require('../../../assets/figma-v3/screen-media/bubble.png')}
            style={styles.bubbleTwo}
            contentFit='contain'
          />
          <View style={styles.lineThree}>
            <BubbleLineThree />
          </View>
          <View style={styles.lineFour}>
            <BubbleLineFour />
          </View>
        </>
      ) : (
        <>
          <CachedImage
            source={require('../../../assets/figma-v3/screen-media/map-shadow.png')}
            style={styles.mapShadow}
            contentFit='contain'
          />
          <CachedImage
            source={require('../../../assets/figma-v3/screen-media/map.png')}
            style={styles.map}
            contentFit='contain'
          />
          <CachedImage
            source={require('../../../assets/figma-v3/screen-media/marker-shadow.png')}
            style={styles.markerShadow}
            contentFit='contain'
          />
          <CachedImage
            source={require('../../../assets/figma-v3/screen-media/map-marker.png')}
            style={styles.marker}
            contentFit='contain'
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  canvas: {
    position: 'absolute',
    top: 0,
    left: '50%',
    marginLeft: -82.5,
    width: 165,
    height: 167,
  },
  phoneShadow: {
    position: 'absolute',
    left: 47.5,
    top: 95,
    width: 101.3,
    height: 54.9,
  },
  phone: {
    position: 'absolute',
    left: 38,
    top: 22.51,
    width: 116.99,
    height: 116.99,
    transform: [{ rotate: '24.55deg' }],
  },
  magnifier: {
    position: 'absolute',
    left: 84.91,
    top: 63.77,
    width: 77.25,
    height: 77.25,
    transform: [{ rotate: '14.61deg' }],
  },
  bubbleOne: {
    position: 'absolute',
    left: 27.46,
    top: 9.14,
    width: 58.387,
    height: 58.387,
  },
  bubbleTwo: {
    position: 'absolute',
    left: 9.56,
    top: 52.46,
    width: 49.911,
    height: 49.911,
  },
  lineOne: { position: 'absolute', left: 39.7, top: 30.68 },
  lineTwo: { position: 'absolute', left: 39.7, top: 36.33 },
  lineThree: { position: 'absolute', left: 20.86, top: 70.24 },
  lineFour: { position: 'absolute', left: 20.86, top: 75.89 },
  mapShadow: { position: 'absolute', left: 5, top: 95, width: 157, height: 62 },
  map: { position: 'absolute', left: 13, top: 30.03, width: 136, height: 136 },
  markerShadow: {
    position: 'absolute',
    left: 50.27,
    top: 71.38,
    width: 14.6398,
    height: 10.951,
  },
  marker: {
    position: 'absolute',
    left: 25.5,
    top: 23,
    width: 65.66,
    height: 65.66,
  },
});
