/**
 * @file InviteErrorState.tsx
 * @description 공유 링크 404, 410 및 에러 발생 시 사용자 친화적인 안내 화면 컴포넌트
 */

import React from 'react';
import Link from 'next/link';

export interface InviteErrorStateProps {
  status?: number;
  message?: string;
  className?: string;
}

export function InviteErrorState({
  status = 404,
  message,
  className = '',
}: InviteErrorStateProps) {
  let title = '유효하지 않은 링크';
  let defaultDesc = '유효하지 않은 공유 링크입니다.';

  if (status === 410) {
    title = '만료된 공유 링크';
    defaultDesc = '만료된 공유 링크입니다. 친구에게 다시 초대를 요청해주세요.';
  } else if (status >= 500) {
    title = '일시적인 오류 발생';
    defaultDesc =
      '공유 링크를 불러오는 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.';
  }

  const description = message || defaultDesc;

  return (
    <div
      className={`w-full max-w-md bg-white rounded-[24px] border border-slate-100 p-8 sm:p-10 shadow-xl flex flex-col items-center text-center gap-6 ${className}`}>
      {/* Icon Graphic */}
      <div className='w-16 h-16 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center font-bold text-[28px] shadow-sm'>
        !
      </div>

      <div className='flex flex-col gap-2'>
        <h2 className='text-[20px] sm:text-[22px] font-extrabold text-[#0d2137] tracking-tight'>
          {title}
        </h2>
        <p className='text-[14px] text-[#64748b] leading-relaxed'>
          {description}
        </p>
      </div>

      <Link
        href='/'
        className='w-full bg-[#2d7dd2] hover:bg-[#236dbb] text-white font-bold text-[15px] py-3.5 px-6 rounded-[14px] transition-all shadow-md active:scale-[0.98]'>
        여로 홈으로 이동
      </Link>
    </div>
  );
}
