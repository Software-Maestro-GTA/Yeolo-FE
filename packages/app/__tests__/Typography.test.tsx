/**
 * @file Typography.test.tsx
 * @description 공통 텍스트의 네이티브 줄바꿈 기본값과 원문·말줄임·입력·폰트 속성 보존을 검증합니다.
 */
import React, { createRef } from 'react';
import { StyleSheet, type TextInput as NativeTextInput } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import {
  Text,
  TextInput,
  TypographyProvider,
} from '../src/components/common/Typography';

describe('공통 타이포그래피 줄바꿈', () => {
  const original =
    '갤러리에 새 사진이 없다면\n분석 결과가 이전과 비슷할 수 있어요.';

  it('기본 텍스트에 reason·memo와 같은 플랫폼별 줄바꿈을 전달하고 원문을 유지한다', async () => {
    const ui = await render(<Text testID='body'>{original}</Text>);
    const text = ui.getByTestId('body');
    expect(text.props).toMatchObject({
      children: original,
      lineBreakStrategyIOS: 'hangul-word',
      textBreakStrategy: 'highQuality',
      android_hyphenationFrequency: 'none',
    });
  });

  it('다중행 입력도 같은 기준을 사용하며 값과 편집 콜백을 변환하지 않는다', async () => {
    const onChangeText = jest.fn();
    const ref = createRef<NativeTextInput>();
    const ui = await render(
      <TextInput
        ref={ref}
        testID='input'
        multiline
        value={original}
        onChangeText={onChangeText}
      />,
    );
    expect(ui.getByTestId('input').props).toMatchObject({
      value: original,
      multiline: true,
      lineBreakStrategyIOS: 'hangul-word',
      textBreakStrategy: 'highQuality',
    });
    const edited = `${original}\nhttps://example.com/verylongunbrokenpath`;
    await fireEvent.changeText(ui.getByTestId('input'), edited);
    expect(onChangeText).toHaveBeenCalledWith(edited);
    expect(ref.current?.focus).toEqual(expect.any(Function));
  });

  it('한 줄 말줄임·접근성·폰트 및 중첩 굵기를 유지한다', async () => {
    const onPress = jest.fn();
    const ui = await render(
      <TypographyProvider loaded>
        <Text
          testID='title'
          style={{ fontSize: 16, fontWeight: '700' }}
          numberOfLines={1}
          ellipsizeMode='tail'
          accessibilityLabel='전체 제목'
          onPress={onPress}>
          긴 여행 코스 제목 <Text testID='nested'>강조 문구</Text>
        </Text>
      </TypographyProvider>,
    );
    const title = ui.getByTestId('title');
    expect(title.props).toMatchObject({
      numberOfLines: 1,
      ellipsizeMode: 'tail',
      accessibilityLabel: '전체 제목',
    });
    expect(StyleSheet.flatten(title.props.style)).toMatchObject({
      fontSize: 16,
      fontFamily: 'Pretendard-Bold',
    });
    expect(
      StyleSheet.flatten(ui.getByTestId('nested').props.style),
    ).toMatchObject({
      fontFamily: 'Pretendard-Bold',
    });
    await fireEvent.press(title);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('명시적인 네이티브 줄바꿈 예외와 사용자 폰트를 그대로 전달한다', async () => {
    const ui = await render(
      <TypographyProvider loaded>
        <Text
          testID='custom'
          lineBreakStrategyIOS='standard'
          textBreakStrategy='simple'
          android_hyphenationFrequency='normal'
          style={{ fontFamily: 'CustomFont' }}>
          custom
        </Text>
      </TypographyProvider>,
    );
    expect(ui.getByTestId('custom').props).toMatchObject({
      lineBreakStrategyIOS: 'standard',
      textBreakStrategy: 'simple',
      android_hyphenationFrequency: 'normal',
    });
    expect(
      StyleSheet.flatten(ui.getByTestId('custom').props.style).fontFamily,
    ).toBe('CustomFont');
  });
});
