/**
 * @file LocalSvgAssets.test.tsx
 * @description Local course vectors must render without resolving or fetching Android resource names.
 */
import React from 'react';
import { Image } from 'react-native';
import { render } from '@testing-library/react-native';
import Back from '../assets/images/figma-course/back.svg';
import SequenceCircle from '../assets/images/figma-course/sequence-circle.svg';
import { FigmaAsset } from '../src/components/common/FigmaAsset';

describe('bundled SVG components', () => {
  afterEach(() => jest.restoreAllMocks());

  it('renders the back arrow and numbered-stop background without asset URLs', async () => {
    const resolve = jest.spyOn(Image, 'resolveAssetSource').mockReturnValue({
      uri: 'assets_images_figmacourse_back',
      width: 24,
      height: 24,
      scale: 1,
    });
    const fetch = jest
      .spyOn(global, 'fetch')
      .mockRejectedValue(new Error('no protocol'));
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const screen = await render(
      <>
        <FigmaAsset source={Back} width={24} height={24} />
        <FigmaAsset source={SequenceCircle} width={16} height={16} />
      </>,
    );
    const tree = JSON.stringify(screen.toJSON());
    expect(tree).toContain('M15 4L8 12L15 20');
    expect(tree).toContain('RNSVGCircle');
    expect(tree).not.toContain('"display":"block"');
    expect(resolve).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
});
