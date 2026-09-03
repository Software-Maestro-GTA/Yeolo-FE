/**
 * @file FeaturesSection.tsx
 * @description Yeolo 주요 기능(Key Features) 소개 섹션 컴포넌트
 */

import React from 'react';
import { CameraIcon, MapPinIcon, CalendarCheckIcon } from '@/components/Icons';

export interface FeaturesSectionProps {
  className?: string;
}

export function FeaturesSection({ className = '' }: FeaturesSectionProps) {
  const features = [
    {
      id: 'photo-analysis',
      icon: <CameraIcon size={28} />,
      title: 'AI 사진 취향 분석',
      description:
        'MBTI와 사진 메타데이터를 AI가 분석하여 자연 풍경, 카페, 미식 등 나만의 여행 성향을 정밀하게 파악합니다.',
    },
    {
      id: 'auto-course',
      icon: <MapPinIcon size={28} />,
      title: '맞춤 코스 자동 생성',
      description:
        '목적지와 일정, 여행 스타일만 선택하면 AI가 동선까지 최적화된 데이별 여행 코스를 자동으로 만들어 드립니다.',
    },
    {
      id: 'schedule-booking',
      icon: <CalendarCheckIcon size={28} />,
      title: '일정 관리 & 예약 통합',
      description:
        '장소별 시간·비용·교통편은 물론 항공권과 호텔 예약까지 하나의 화면에서 한 번에 관리할 수 있습니다.',
    },
  ];

  return (
    <section
      id='features'
      className={`w-full bg-white py-20 lg:py-24 ${className}`}>
      <div className='max-w-7xl mx-auto px-6 sm:px-12 lg:px-20'>
        {/* Section Header */}
        <div className='text-center flex flex-col items-center gap-3 mb-14 lg:mb-16'>
          <span className='text-[#00c9a7] text-[14px] font-bold tracking-[1px] uppercase'>
            KEY FEATURES
          </span>
          <h2 className='text-[28px] sm:text-[34px] lg:text-[36px] font-extrabold text-[#0d2137]'>
            더 스마트하고 완벽한 여정을 위한 제안
          </h2>
        </div>

        {/* Feature Cards Grid */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8'>
          {features.map((item) => (
            <div
              key={item.id}
              className='bg-white border border-[#e2e8f0] rounded-[20px] p-8 flex flex-col items-start gap-4 transition-all duration-300 hover:shadow-lg hover:shadow-slate-100 hover:border-[#00c9a7]/50 hover:-translate-y-1'>
              {/* Icon Container */}
              <div className='w-14 h-14 rounded-[16px] bg-[#e0f7f1] flex items-center justify-center text-[#00c9a7] shrink-0'>
                {item.icon}
              </div>

              {/* Title */}
              <h3 className='text-[20px] font-bold text-[#0d2137] tracking-tight'>
                {item.title}
              </h3>

              {/* Description */}
              <p className='text-[15px] text-[#64748b] leading-[1.6]'>
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
