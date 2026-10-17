/**
 * @file FigmaAsset.tsx
 * @description 다운로드한 Figma SVG를 원본 크기의 로컬 자산으로 표시합니다.
 */
import { Image, View, type StyleProp, type ViewStyle } from 'react-native';
import { SvgUri } from 'react-native-svg';

/** 원본 SVG의 크기를 유지하고 배치·회전은 바깥 View에 적용합니다. */
export function FigmaAsset({
  source,
  width,
  height,
  style,
}: {
  source: number;
  width: number;
  height: number;
  style?: StyleProp<ViewStyle>;
}) {
  const asset = Image.resolveAssetSource(source);
  return (
    <View pointerEvents='none' accessible={false} style={style}>
      <SvgUri uri={asset?.uri ?? null} width={width} height={height} />
    </View>
  );
}
