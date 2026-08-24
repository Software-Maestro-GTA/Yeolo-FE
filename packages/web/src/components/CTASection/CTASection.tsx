/**
 * @file CTASection.tsx
 * @description Yeolo 모바일 앱 다운로드 유도 Call To Action 섹션 컴포넌트
 */

import React from 'react';
import Image from 'next/image';
import { PlayIcon, AppleIcon } from '@/components/Icons';

export interface CTASectionProps {
  className?: string;
}

export function CTASection({ className = '' }: CTASectionProps) {
  return (
    <section
      id='download'
      className={`w-full bg-white py-16 lg:py-20 ${className}`}>
      <div className='max-w-7xl mx-auto px-6 sm:px-12 lg:px-20'>
        <div className='bg-[#0d2137] rounded-[32px] p-8 sm:p-12 lg:p-20 text-white flex flex-col lg:flex-row items-center justify-between gap-12 overflow-hidden relative shadow-2xl'>
          {/* Subtle Background Glow Accent */}
          <div className='absolute -top-24 -right-24 w-96 h-96 bg-[#00c9a7]/10 rounded-full blur-3xl pointer-events-none' />
          <div className='absolute -bottom-24 -left-24 w-96 h-96 bg-[#2d7dd2]/10 rounded-full blur-3xl pointer-events-none' />

          {/* Left: Text & Store Download Buttons */}
          <div className='flex flex-col items-start gap-7 max-w-2xl z-10'>
            <h2 className='text-[28px] sm:text-[38px] lg:text-[44px] font-extrabold leading-[1.25] text-white tracking-tight'>
              지금 다운로드하고
              <br />
              나만의 똑똑한 여행을 만들어 보세요
            </h2>

            <p className='text-[15px] sm:text-[16px] text-white/85 leading-[1.6]'>
              구글 플레이 스토어와 애플 앱 스토어에서 여로 앱을 다운로드하고
              <br className='hidden sm:inline' />
              복잡한 여행 계획으로부터 완벽하게 자유로워지세요.
            </p>

            {/* Store Download Buttons */}
            <div className='flex flex-wrap gap-4 pt-2'>
              {/* Google Play Button */}
              <a
                href='#google-play'
                className='bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-[14px] px-5 py-3 rounded-[12px] inline-flex items-center gap-2.5 transition-all active:scale-95 shadow-sm'>
                <PlayIcon size={20} className='text-white' />
                <span>Google Play</span>
              </a>

              {/* App Store Button */}
              <a
                href='https://apps.apple.com/kr/app/%EC%97%AC%EB%A1%9C/id6796231811'
                className='bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-[14px] px-5 py-3 rounded-[12px] inline-flex items-center gap-2.5 transition-all active:scale-95 shadow-sm'>
                <AppleIcon size={20} className='text-white' />
                <span>App Store</span>
              </a>
            </div>
          </div>

          {/* Right: Realistic Smartphone Device Mockup Frame */}
          <div className='relative shrink-0 z-10 flex items-center justify-center my-2 lg:my-0'>
            {/* Outer Smartphone Body: scaled to match Left content height (~380px-400px) */}
            <div className='relative w-[165px] sm:w-[175px] lg:w-[185px] aspect-[390/844] rounded-[32px] overflow-hidden bg-[#0c1824] shadow-[0_20px_50px_-10px_rgba(0,0,0,0.7),0_0_0_1px_rgba(255,255,255,0.15)] border-[4px] border-[#1e293b] transition-transform duration-500 hover:scale-[1.03]'>
              {/* Screen Area: Full edge-to-edge fitting native status and bottom bars */}
              <div className='relative w-full h-full bg-[#f5faf8]'>
                <Image
                  src='/images/app-mockup.png'
                  alt='Yeolo App Screen Preview'
                  fill
                  priority
                  sizes='(max-width: 640px) 165px, (max-width: 1024px) 175px, 185px'
                  className='object-cover object-top'
                />
                {/* Subtle Screen Reflection Highlight */}
                <div className='absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/[0.03] to-white/10' />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
