/**
 * @file InviteCard.tsx
 * @description 여행 코스 초대 정보(코스 요약 및 초대한 사용자 프로필) 렌더링 카드 컴포넌트
 */

import React from 'react';
import Image from 'next/image';
import {
  formatYYYYMMDD,
  type ShareLinkDetailResponseData,
} from '@yeolo/common';
import { MapPinIcon, CalendarCheckIcon } from '@/components/Icons';

export interface InviteCardProps {
  data: ShareLinkDetailResponseData;
  className?: string;
}

export function InviteCard({ data, className = '' }: InviteCardProps) {
  const { course, inviter, expiresAt } = data;
  const inviterName = inviter.displayName || '여행자';

  return (
    <div
      className={`w-full max-w-lg bg-white rounded-[24px] border border-slate-100 shadow-[0px_8px_30px_0px_rgba(15,23,42,0.08)] overflow-hidden flex flex-col ${className}`}>
      {/* Top Inviter Banner */}
      <div className='bg-[#f5faf8] border-b border-slate-100 p-6 flex items-center gap-4'>
        <div className='relative w-12 h-12 rounded-full overflow-hidden bg-[#e0f7f1] border-2 border-white shadow-sm shrink-0 flex items-center justify-center'>
          {inviter.profileImageUrl ? (
            <Image
              src={inviter.profileImageUrl}
              alt={inviterName}
              fill
              className='object-cover'
              sizes='48px'
            />
          ) : (
            <span className='text-[#2d7dd2] font-extrabold text-[18px]'>
              {inviterName.charAt(0)}
            </span>
          )}
        </div>

        <div className='flex flex-col'>
          <span className='text-[#2d7dd2] text-[12px] font-bold tracking-tight'>
            초대 알림
          </span>
          <h2 className='text-[#0d2137] font-bold text-[16px] leading-snug'>
            {inviter.displayName
              ? `${inviter.displayName}님이 여행 코스에 초대했습니다!`
              : '여행 코스에 초대받았습니다!'}
          </h2>
        </div>
      </div>

      {/* Course Summary Body */}
      <div className='p-6 sm:p-8 flex flex-col gap-6'>
        <div className='flex flex-col gap-2'>
          <span className='inline-block self-start bg-[#e0f7f1] text-[#2d7dd2] text-[12px] font-bold px-2.5 py-1 rounded-full'>
            AI 맞춤 여행 코스
          </span>
          <h1 className='text-[22px] sm:text-[26px] font-extrabold text-[#0d2137] leading-tight'>
            {course.title}
          </h1>
        </div>

        {/* Details Grid */}
        <div className='bg-slate-50 rounded-[16px] p-4 flex flex-col gap-3 text-[14px]'>
          {/* Location */}
          <div className='flex items-center gap-2.5 text-[#0d2137]'>
            <MapPinIcon size={18} className='text-[#2d7dd2] shrink-0' />
            <span className='font-semibold'>
              {course.destinationCountry} {course.destinationCity}
            </span>
          </div>

          {/* Date & Duration */}
          <div className='flex items-center gap-2.5 text-[#45464c]'>
            <CalendarCheckIcon size={18} className='text-[#00c9a7] shrink-0' />
            <span>
              {course.startDate} • {course.totalDays}일
            </span>
          </div>
        </div>

        {expiresAt && (
          <p className='text-[12px] text-[#94a3b8] text-center'>
            * 본 공유 링크는 {formatYYYYMMDD(expiresAt)}까지 유효합니다.
          </p>
        )}
      </div>
    </div>
  );
}
