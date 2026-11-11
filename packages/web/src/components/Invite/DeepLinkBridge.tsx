/**
 * @file DeepLinkBridge.tsx
 * @description 사용자 기기에서 커스텀 스킴(yeolo://invite/{shareToken}) 딥링크를 제공하는 앱 열기 링크 컴포넌트
 */

import { ArrowRightIcon } from '@/components/Icons';

export interface DeepLinkBridgeProps {
  shareToken: string;
  className?: string;
}

export function DeepLinkBridge({
  shareToken,
  className = '',
}: DeepLinkBridgeProps) {
  return (
    <div className={`invite-open ${className}`}>
      <a
        href={`yeolo://invite/${encodeURIComponent(shareToken)}`}
        className='invite-primary-button'>
        <span>여로 앱에서 열기</span>
        <ArrowRightIcon size={18} aria-hidden='true' />
      </a>
    </div>
  );
}
