/**
 * @file HeroSection.tsx
 * @description Yeolo 메인 히어로 섹션 컴포넌트
 */

import React from 'react';
import Image from 'next/image';
import { ArrowRightIcon } from '@/components/Icons';

export interface HeroSectionProps {
  className?: string;
}

export function HeroSection({ className = '' }: HeroSectionProps) {
  return (
    <section
      className={`w-full bg-[#f5faf8] overflow-hidden py-12 lg:py-16 ${className}`}>
      <div className='max-w-7xl mx-auto px-6 sm:px-12 lg:px-20'>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-12 items-center'>
          {/* Left Column: Text & Actions */}
          <div className='flex flex-col items-start gap-6 lg:gap-7'>
            {/* Tag Badge */}
            <div className='inline-flex items-center px-3.5 py-1.5 rounded-[20px] bg-[#e0f7f1]'>
              <span className='text-[#2d7dd2] text-[13px] font-bold tracking-tight'>
                AI 기반 초개인화 여행 플랫폼
              </span>
            </div>

            {/* Headline */}
            <h1 className='text-[34px] sm:text-[44px] lg:text-[52px] font-extrabold text-[#0d2137] leading-[1.25] tracking-tight'>
              여행의 새로운 시작,
              <br />
              나만을 위한 맞춤 <span className='text-[#2d7dd2]'>여로</span>
            </h1>

            {/* Description */}
            <p className='text-[16px] sm:text-[18px] text-[#64748b] leading-[1.6] max-w-xl'>
              당신의 취향, MBTI 를 분석해
              <br className='hidden sm:inline' />
              세상에 단 하나뿐인 최적의 여행 코스를 실시간으로 설계합니다.
            </p>

            {/* CTA Button */}
            <div className='pt-2'>
              <a
                href='#features'
                className='inline-flex items-center gap-2 bg-[#2d7dd2] hover:bg-[#236dbb] active:scale-95 text-white font-bold text-[16px] px-7 py-4 rounded-[30px] shadow-lg shadow-[#2d7dd2]/25 transition-all group'>
                <span>나만의 여행 시작하기</span>
                <ArrowRightIcon
                  className='transition-transform group-hover:translate-x-1'
                  size={18}
                />
              </a>
            </div>
          </div>

          {/* Right Column: Hero Image */}
          <div className='relative w-full aspect-[4/3] lg:aspect-[616/560] max-h-[560px] rounded-[24px] overflow-hidden shadow-2xl shadow-slate-300/50'>
            <Image
              src='/images/hero-travel.png'
              alt='여로 여행 맞춤 코스 뷰'
              fill
              priority
              sizes='(max-width: 1024px) 100vw, 50vw'
              className='object-cover transition-transform duration-700 hover:scale-105'
            />
          </div>
        </div>
      </div>
    </section>
  );
}
