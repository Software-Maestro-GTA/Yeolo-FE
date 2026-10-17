/**
 * @file CachedImage.tsx
 * @description 화면 재진입 시 사진을 메모리·디스크 캐시에서 재사용하고 반복 페이드를 방지합니다.
 */
import {
  Image,
  ImageBackground,
  type ImageProps,
  type ImageBackgroundProps,
} from 'expo-image';

/** Renders photos with a shared native cache, without animating each screen mount. */
export function CachedImage(props: ImageProps) {
  return <Image cachePolicy='memory-disk' transition={0} {...props} />;
}

/** Preserves background overlays while applying the same photo cache policy. */
export function CachedImageBackground(props: ImageBackgroundProps) {
  return (
    <ImageBackground cachePolicy='memory-disk' transition={0} {...props} />
  );
}
