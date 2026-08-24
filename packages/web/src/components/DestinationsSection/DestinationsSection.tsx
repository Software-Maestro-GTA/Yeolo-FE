/**
 * @file DestinationsSection.tsx
 * @description Yeolo 추천 인기 여행지(Trending Destinations) 카드 그리드 섹션 컴포넌트
 */

import React from 'react';
import Image from 'next/image';
import { MiniMapPinIcon } from '@/components/Icons';

export interface DestinationItem {
  id: string;
  name: string;
  locationDetails: string;
  description: string;
  imageSrc: string;
  tags: string[];
}

export interface DestinationsSectionProps {
  className?: string;
}

const DESTINATIONS: DestinationItem[] = [
  {
    id: 'jeju',
    name: '제주도',
    locationDetails: '대한민국 제주도 • 2026-08-19 • 3일',
    description: '푸른 바다와 고즈넉한 돌담길, 감성 넘치는 로컬 카페 여행지',
    imageSrc: '/images/dest-jeju.png',
    tags: ['#힐링', '#로컬카페', '#바다'],
  },
  {
    id: 'kyoto',
    name: '교토',
    locationDetails: '일본 교토 • 2026-08-22 • 2일',
    description:
      '전통 건축과 아름다운 대나무 숲길, 고요한 평온함이 흐르는 도시',
    imageSrc: '/images/dest-kyoto.png',
    tags: ['#역사문화', '#대나무숲', '#전통'],
  },
  {
    id: 'bali',
    name: '발리',
    locationDetails: '인도네시아 발리 • 2026-08-24 • 4일',
    description: '이국적인 사원과 서핑, 신비로운 정글 속 프라이빗 스파 투어',
    imageSrc: '/images/dest-bali.png',
    tags: ['#자연휴양', '#서핑', '#스파'],
  },
  {
    id: 'paris',
    name: '파리',
    locationDetails: '프랑스 파리 • 2026-08-26 • 3일',
    description:
      '거리 곳곳이 미술관이 되는 낭만과 로맨스가 흐르는 빛의 예술 도시',
    imageSrc: '/images/dest-paris.png',
    tags: ['#낭만예술', '#로맨틱', '#미술관'],
  },
  {
    id: 'bangkok',
    name: '방콕',
    locationDetails: '태국 방콕 • 2026-08-28 • 2일',
    description:
      '화려한 야시장과 루프탑 바, 오감을 자극하는 동남아 미식의 중심지',
    imageSrc: '/images/dest-bangkok.png',
    tags: ['#미식탐험', '#야시장', '#루프탑'],
  },
  {
    id: 'barcelona',
    name: '바르셀로나',
    locationDetails: '스페인 바르셀로나 • 2026-08-30 • 4일',
    description:
      '아름다운 지중해 바다와 천재 건축가의 숨결을 동시에 느끼는 여정',
    imageSrc: '/images/dest-barcelona.png',
    tags: ['#가우디투어', '#지중해', '#건축'],
  },
];

export function DestinationsSection({
  className = '',
}: DestinationsSectionProps) {
  return (
    <section
      id='destinations'
      className={`w-full bg-[#f5faf8] py-20 lg:py-24 ${className}`}>
      <div className='max-w-7xl mx-auto px-6 sm:px-12 lg:px-20'>
        {/* Section Header */}
        <div className='text-center flex flex-col items-center gap-3 mb-14 lg:mb-16'>
          <span className='text-[#2d7dd2] text-[14px] font-bold tracking-[1px] uppercase'>
            TRENDING DESTINATIONS
          </span>
          <h2 className='text-[28px] sm:text-[34px] lg:text-[36px] font-extrabold text-[#0d2137]'>
            여로 이용자들이 선택한 인기 탐험지
          </h2>
        </div>

        {/* 6 Destination Cards Grid */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8'>
          {DESTINATIONS.map((dest) => (
            <div
              key={dest.id}
              className='bg-white rounded-[16px] overflow-hidden shadow-[0px_4px_16px_0px_rgba(15,23,42,0.06)] border border-slate-100 flex flex-col group transition-all duration-300 hover:shadow-xl hover:-translate-y-1'>
              {/* Photo Area with Overlay */}
              <div className='relative h-[160px] w-full overflow-hidden'>
                <Image
                  src={dest.imageSrc}
                  alt={dest.name}
                  fill
                  sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
                  className='object-cover transition-transform duration-500 group-hover:scale-105'
                />
                <div className='absolute inset-0 bg-gradient-to-t from-[#0d2137]/80 via-[#0d2137]/30 to-transparent' />
                <div className='absolute bottom-3 left-3 flex flex-col text-white'>
                  <h3 className='font-bold text-[18px] leading-snug drop-shadow-sm'>
                    {dest.name}
                  </h3>
                  <p className='text-[12px] text-white/90 font-normal'>
                    {dest.locationDetails}
                  </p>
                </div>
              </div>

              {/* Card Body */}
              <div className='p-4 flex flex-col gap-3 flex-1 justify-between'>
                <div className='flex items-center gap-1.5 text-[#45464c]'>
                  <MiniMapPinIcon className='shrink-0 text-[#2d7dd2]' />
                  <p
                    className='text-[13px] font-medium leading-normal truncate'
                    title={dest.description}>
                    {dest.description}
                  </p>
                </div>

                {/* Hashtag Pills */}
                <div className='flex flex-wrap gap-1.5'>
                  {dest.tags.map((tag) => (
                    <span
                      key={tag}
                      className='inline-block bg-[#e0f7f1] text-[#2d7dd2] text-[11px] font-bold px-2 py-1 rounded-full'>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
