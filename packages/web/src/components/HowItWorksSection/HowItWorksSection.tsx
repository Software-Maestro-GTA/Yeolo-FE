/**
 * @file HowItWorksSection.tsx
 * @description Yeolo 서비스 이용 방법(How It Works) 3단계 프로세스 소개 컴포넌트
 */

import React from 'react';
import { ChevronRightIcon } from '@/components/Icons';

export interface HowItWorksSectionProps {
  className?: string;
}

export function HowItWorksSection({ className = '' }: HowItWorksSectionProps) {
  const steps = [
    {
      step: '1',
      title: '여행 취향 분석',
      description:
        'AI가 내 정보를 바탕으로 자연 풍경·카페·미식 등\n나만의 여행 취향을 자동으로 분석해 줍니다.',
    },
    {
      step: '2',
      title: '목적지·일정 설정',
      description:
        '여행지, 날짜, 여행 스타일을 선택하면 AI가 취향 분석 결과를 바탕으로 최적의 맞춤 코스를 생성합니다.',
    },
    {
      step: '3',
      title: '일정 확인 & 공유',
      description:
        '지도와 함께 데이별 상세 일정을 확인하고\n친구에게 여행 코스를 공유하세요.',
    },
  ];

  return (
    <section
      id='how-it-works'
      className={`w-full bg-white py-20 lg:py-24 ${className}`}>
      <div className='max-w-7xl mx-auto px-6 sm:px-12 lg:px-20'>
        {/* Section Header */}
        <div className='text-center flex flex-col items-center gap-3 mb-14 lg:mb-16'>
          <span className='text-[#2d7dd2] text-[14px] font-bold tracking-[1px] uppercase'>
            HOW IT WORKS
          </span>
          <h2 className='text-[28px] sm:text-[34px] lg:text-[36px] font-extrabold text-[#0d2137]'>
            오직 나만을 위한 여행 코스
          </h2>
        </div>

        {/* Steps Container */}
        <div className='flex flex-col md:flex-row items-center justify-between gap-6 lg:gap-4'>
          {steps.map((item, index) => (
            <React.Fragment key={item.step}>
              {/* Step Card */}
              <div className='w-full md:flex-1 bg-[#f5faf8] rounded-[20px] p-8 flex flex-col items-center text-center gap-4 transition-all duration-300 hover:shadow-md hover:shadow-slate-100 hover:-translate-y-1'>
                {/* Step Number Circle */}
                <div className='w-10 h-10 rounded-[20px] bg-[#2d7dd2] text-white font-extrabold text-[16px] flex items-center justify-center shadow-md shadow-[#2d7dd2]/20'>
                  {item.step}
                </div>

                {/* Title */}
                <h3 className='text-[18px] font-bold text-[#0d2137] tracking-tight'>
                  {item.title}
                </h3>

                {/* Description */}
                <p className='text-[14px] text-[#64748b] leading-[1.6] whitespace-pre-line'>
                  {item.description}
                </p>
              </div>

              {/* Arrow Connector (Hidden on mobile and last item) */}
              {index < steps.length - 1 && (
                <div className='hidden md:flex items-center justify-center shrink-0 px-1 text-slate-300'>
                  <ChevronRightIcon size={24} className='text-slate-300' />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
