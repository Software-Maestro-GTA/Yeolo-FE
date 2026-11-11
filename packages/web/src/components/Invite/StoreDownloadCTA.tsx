'use client';

/**
 * @file StoreDownloadCTA.tsx
 * @description OS별 다운로드 링크와 데스크톱의 스토어 선택을 제공하는 컴포넌트
 */

import React, { useState, useEffect } from 'react';
import { PlayIcon, AppleIcon } from '@/components/Icons';
import { StoreButtons } from '@/components/StoreButtons/StoreButtons';
import { APP_STORE_URL, PLAY_STORE_URL } from '@/lib/download';

export interface StoreDownloadCTAProps {
  shareToken: string;
  userAgent?: 'ios' | 'android' | 'desktop';
  className?: string;
}

export function StoreDownloadCTA({
  userAgent: initialOs,
  className = '',
}: StoreDownloadCTAProps) {
  const [detectedOs, setDetectedOs] = useState<'ios' | 'android' | 'desktop'>(
    initialOs || 'desktop',
  );

  useEffect(() => {
    if (!initialOs && typeof window !== 'undefined') {
      const ua = navigator.userAgent || '';
      if (/iPhone|iPad|iPod/i.test(ua)) {
        setDetectedOs('ios');
      } else if (/Android/i.test(ua)) {
        setDetectedOs('android');
      } else {
        setDetectedOs('desktop');
      }
    }
  }, [initialOs]);

  const appStoreUrl = APP_STORE_URL;
  const playStoreUrl = PLAY_STORE_URL;

  return (
    <div className={`invite-install ${className}`}>
      <div className='invite-install-copy'>
        <h3 className='invite-install-title'>처음 여로를 만나셨나요?</h3>
        <p className='invite-install-description'>
          앱을 설치한 뒤 이 초대 링크를 다시 열어주세요.
        </p>
      </div>

      {detectedOs === 'ios' && (
        <div className='flex flex-col gap-3'>
          <a href={appStoreUrl} className='invite-store-link'>
            <AppleIcon size={22} aria-hidden='true' />
            <span>App Store에서 다운로드</span>
          </a>
        </div>
      )}

      {detectedOs === 'android' && (
        <div className='flex flex-col gap-3'>
          <a href={playStoreUrl} className='invite-store-link'>
            <PlayIcon size={22} aria-hidden='true' />
            <span>Google Play에서 다운로드</span>
          </a>
        </div>
      )}

      {detectedOs === 'desktop' && <StoreButtons />}
    </div>
  );
}
