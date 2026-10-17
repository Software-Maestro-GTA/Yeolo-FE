/**
 * @file FigmaAsset.tsx
 * @description 빌드 시 변환한 Figma SVG 컴포넌트를 지정한 크기로 표시합니다.
 */
import { View, type StyleProp, type ViewStyle } from 'react-native';
import type { ComponentType } from 'react';
import type { SvgProps } from 'react-native-svg';

/** 원본 SVG의 크기를 유지하고 배치·회전은 바깥 View에 적용합니다. */
export function FigmaAsset({
  source: Vector,
  width,
  height,
  style,
}: {
  source: ComponentType<SvgProps>;
  width: number;
  height: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View pointerEvents='none' accessible={false} style={style}>
      <Vector width={width} height={height} />
    </View>
  );
}
