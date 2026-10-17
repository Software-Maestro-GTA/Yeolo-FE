/**
 * @file Typography.tsx
 * @description 로드된 Pretendard의 실제 굵기를 선택하며 네이티브 텍스트 속성과 ref를 유지합니다.
 */
import React, { createContext, forwardRef, useContext } from 'react';
import {
  Text as NativeText,
  TextInput as NativeTextInput,
  StyleSheet,
  type TextProps,
  type TextInputProps,
  type TextStyle,
} from 'react-native';
import { fontForWeight } from '../../theme/fonts';

const FontReadyContext = createContext(false);
const WeightContext = createContext<TextStyle['fontWeight']>('400');

export function TypographyProvider({
  loaded,
  children,
}: {
  loaded: boolean;
  children: React.ReactNode;
}) {
  return (
    <FontReadyContext.Provider value={loaded}>
      {children}
    </FontReadyContext.Provider>
  );
}

export const Text = forwardRef<NativeText, TextProps>(function Text(
  { style, ...props },
  ref,
) {
  const loaded = useContext(FontReadyContext);
  const inheritedWeight = useContext(WeightContext);
  const flattened = StyleSheet.flatten(style);
  const weight = flattened?.fontWeight ?? inheritedWeight;
  const font: TextStyle | undefined =
    loaded && !flattened?.fontFamily
      ? { fontFamily: fontForWeight(weight), fontWeight: 'normal' }
      : undefined;
  return (
    <WeightContext.Provider value={weight}>
      <NativeText ref={ref} {...props} style={[style, font]} />
    </WeightContext.Provider>
  );
});

export const TextInput = forwardRef<NativeTextInput, TextInputProps>(
  function TextInput({ style, ...props }, ref) {
    const loaded = useContext(FontReadyContext);
    const flattened = StyleSheet.flatten(style);
    const font: TextStyle | undefined =
      loaded && !flattened?.fontFamily
        ? {
            fontFamily: fontForWeight(flattened?.fontWeight),
            fontWeight: 'normal',
          }
        : undefined;
    return <NativeTextInput ref={ref} {...props} style={[style, font]} />;
  },
);
