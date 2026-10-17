/**
 * @file StoreButtons.tsx
 * @description 웹 전역에서 사용하는 App Store·Google Play 직접 다운로드 링크
 */
import { AppleIcon, PlayIcon } from '@/components/Icons';
import { APP_STORE_URL, PLAY_STORE_URL } from '@/lib/download';

interface StoreButtonsProps {
  compact?: boolean;
  light?: boolean;
}

/** 브라우저에서 실제 앱 스토어로 연결되는 접근 가능한 다운로드 버튼 묶음입니다. */
export function StoreButtons({
  compact = false,
  light = false,
}: StoreButtonsProps) {
  return (
    <div
      className={`store-buttons${compact ? ' store-buttons--compact' : ''}${light ? ' store-buttons--light' : ''}`}>
      <a
        href={APP_STORE_URL}
        className='store-button'
        aria-label='App Store에서 다운로드'>
        <AppleIcon size={23} className='store-symbol' aria-hidden='true' />
        <span>
          {!compact && <small>iPhone · iPad</small>}
          <strong>App Store</strong>
        </span>
      </a>
      <a
        href={PLAY_STORE_URL}
        className='store-button'
        aria-label='Google Play에서 다운로드'>
        <PlayIcon size={22} className='store-symbol' aria-hidden='true' />
        <span>
          {!compact && <small>Android</small>}
          <strong>Google Play</strong>
        </span>
      </a>
    </div>
  );
}
