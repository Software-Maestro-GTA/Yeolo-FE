'use client';

/**
 * @file DeepLinkBridge.tsx
 * @description 사용자 기기에서 커스텀 스킴(yeolo://invite/{shareToken}) 딥링크 실행을 시도하는 클라이언트 브릿지 컴포넌트
 */

import React from 'react';

export interface DeepLinkBridgeProps {
  shareToken: string;
  className?: string;
}

export function DeepLinkBridge({
  shareToken,
  className = '',
}: DeepLinkBridgeProps) {
  const handleOpenApp = () => {
    const deepLinkUrl = `yeolo://invite/${encodeURIComponent(shareToken)}`;
    window.location.href = deepLinkUrl;
  };

  return (
    <div className={`w-full max-w-lg flex flex-col gap-3 ${className}`}>
      <button
        type='button'
        onClick={handleOpenApp}
        className='w-full bg-[#2d7dd2] hover:bg-[#236dbb] active:scale-[0.98] text-white font-extrabold text-[16px] py-4 rounded-[16px] shadow-lg shadow-[#2d7dd2]/30 transition-all flex items-center justify-center gap-2 cursor-pointer'>
        <span>여로 앱에서 열기</span>
      </button>
    </div>
  );
}
