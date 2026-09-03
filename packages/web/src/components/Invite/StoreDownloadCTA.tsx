'use client';

/**
 * @file StoreDownloadCTA.tsx
 * @description OS별(iOS App Store, Android Google Play) 다운로드 유도 및 Desktop 접속 시 QR 코드 안내 컴포넌트
 */

import React, { useState, useEffect } from 'react';
import { PlayIcon, AppleIcon } from '@/components/Icons';

export interface StoreDownloadCTAProps {
  shareToken: string;
  userAgent?: 'ios' | 'android' | 'desktop';
  className?: string;
}

export function StoreDownloadCTA({
  shareToken,
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

  const appStoreUrl = 'https://apps.apple.com/kr/app/id6796231811';
  const playStoreUrl =
    'https://play.google.com/store/apps/details?id=com.yeolo.app&pcampaignid=web_share';

  return (
    <div
      className={`w-full max-w-lg bg-[#0d2137] rounded-[24px] p-6 sm:p-8 text-white flex flex-col gap-6 shadow-xl ${className}`}>
      <div className='flex flex-col gap-1.5 text-center sm:text-left'>
        <h3 className='text-[18px] sm:text-[20px] font-bold text-white tracking-tight'>
          아직 여로 앱이 없으신가요?
        </h3>
        <p className='text-[14px] text-white/80 leading-relaxed'>
          앱을 설치하고 초개인화 AI 여행 코스를 자유롭게 확인하고 편집해보세요.
        </p>
      </div>

      {detectedOs === 'ios' && (
        <div className='flex flex-col gap-3'>
          <a
            href={appStoreUrl}
            className='w-full bg-white text-[#0d2137] hover:bg-slate-100 active:scale-[0.98] font-bold text-[15px] py-3.5 px-5 rounded-[14px] inline-flex items-center justify-center gap-2.5 transition-all shadow-md'>
            <AppleIcon size={22} className='text-[#0d2137]' />
            <span>App Store에서 다운로드</span>
          </a>
        </div>
      )}

      {detectedOs === 'android' && (
        <div className='flex flex-col gap-3'>
          <a
            href={playStoreUrl}
            className='w-full bg-white text-[#0d2137] hover:bg-slate-100 active:scale-[0.98] font-bold text-[15px] py-3.5 px-5 rounded-[14px] inline-flex items-center justify-center gap-2.5 transition-all shadow-md'>
            <PlayIcon size={22} className='text-[#0d2137]' />
            <span>Google Play에서 다운로드</span>
          </a>
        </div>
      )}

      {detectedOs === 'desktop' && (
        <div className='flex flex-col sm:flex-row items-center gap-3 pt-2 w-full'>
          <a
            href={playStoreUrl}
            target='_blank'
            rel='noopener noreferrer'
            className='flex-1 w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-[14px] px-5 py-3.5 rounded-[12px] inline-flex items-center justify-center gap-2.5 transition-all shadow-sm'>
            <PlayIcon size={18} className='text-white' />
            <span>Google Play</span>
          </a>
          <a
            href={appStoreUrl}
            target='_blank'
            rel='noopener noreferrer'
            className='flex-1 w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-[14px] px-5 py-3.5 rounded-[12px] inline-flex items-center justify-center gap-2.5 transition-all shadow-sm'>
            <AppleIcon size={18} className='text-white' />
            <span>App Store</span>
          </a>
        </div>
      )}
    </div>
  );
}
