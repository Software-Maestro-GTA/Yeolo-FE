/**
 * @file OnboardingIllustrations.tsx
 * @description Locally bundled UI v3 vector renderer and photo privacy illustration.
 */
import {
  Image,
  StyleSheet,
  View,
  type ImageSourcePropType,
} from 'react-native';
import { SvgUri } from 'react-native-svg';
import { palette } from '../../theme/colors';

/** Displays an unmodified local Figma SVG at its intrinsic dimensions. */
export function OnboardingSvg({ source }: { source: ImageSourcePropType }) {
  const asset = Image.resolveAssetSource(source);
  return <SvgUri uri={asset?.uri ?? null} />;
}

/** Privacy illustration from nodes 1018:42–48; square shapes stay native and SVG artwork is bundled. */
export function PrivacyIllustration() {
  return (
    <View style={styles.privacy} testID='hero-illustration' accessible={false}>
      <View style={[styles.paper, styles.paperOne]} />
      <View style={[styles.paper, styles.paperTwo]} />
      <View style={[styles.paper, styles.paperThree]} />
      <View style={styles.bin}>
        <OnboardingSvg
          source={require('../../../assets/ui-v3-onboarding/privacy-bin.svg')}
        />
      </View>
      {[styles.lineOne, styles.lineTwo, styles.lineThree].map((line, index) => (
        <View key={index} style={[styles.binLine, line]}>
          <OnboardingSvg
            source={require('../../../assets/ui-v3-onboarding/privacy-bin-line.svg')}
          />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  privacy: { width: 142, height: 264 },
  paper: {
    position: 'absolute',
    width: 44.53,
    height: 44.53,
    backgroundColor: palette.gray200,
  },
  paperOne: { left: 8.15, top: 70.17, transform: [{ rotate: '30deg' }] },
  paperTwo: { left: 23.25, top: 8.94, transform: [{ rotate: '52.67deg' }] },
  paperThree: { left: 73.86, top: 51.59, transform: [{ rotate: '66.36deg' }] },
  bin: { position: 'absolute', left: 1.19, top: 109.73 },
  binLine: {
    position: 'absolute',
    top: 182.09,
    transform: [{ rotate: '90deg' }],
  },
  lineOne: { left: -6.36 },
  lineTwo: { left: 23.86 },
  lineThree: { left: 54.07 },
});
