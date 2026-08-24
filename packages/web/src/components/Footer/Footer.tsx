/**
 * @file Footer.tsx
 * @description Yeolo 하단 푸터 컴포넌트
 */

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export interface FooterProps {
  className?: string;
}

export function Footer({ className = '' }: FooterProps) {
  const mailSubject = encodeURIComponent('[여로] 서비스 문의 및 피드백');
  const mailBody = encodeURIComponent(
    `안녕하세요, 여로(Yeolo) 고객센터입니다.\n\n1. 문의 유형: (서비스 이용 / 버그 및 오류 / 제휴 / 기타)\n2. 문의 내용:\n\n\n--------------------------------------------------\n* 정확하고 빠른 확인을 위해 상세 내용을 입력해 주시면 감사하겠습니다.`,
  );
  const supportMailHref = `mailto:ksk85628781@gmail.com?subject=${mailSubject}&body=${mailBody}`;

  const partnerMailSubject = encodeURIComponent(
    '[여로] 비즈니스 제휴 및 협업 제안',
  );
  const partnerMailBody = encodeURIComponent(
    `안녕하세요, 여로(Yeolo) 팀에게 제휴/협업을 제안합니다.\n\n1. 기업 / 담당자 정보:\n  - 회사(단체)명:\n  - 담당자명 / 직책:\n  - 연락처 / 회신 이메일:\n\n2. 제휴 / 협업 유형: (관광 콘텐츠 / 여행 상품 및 숙소 연계 / 마케팅 및 프로모션 / API 연동 / 기타)\n\n3. 제휴 제안 내용 및 세부 사항:\n\n\n--------------------------------------------------\n* 회사 소개서나 제안서 파일이 있으신 경우 함께 첨부해 주시면 더욱 빠른 검토가 가능합니다.`,
  );
  const partnerMailHref = `mailto:ksk85628781@gmail.com?subject=${partnerMailSubject}&body=${partnerMailBody}`;

  return (
    <footer
      className={`w-full bg-[#0d2137] text-white pt-16 pb-12 ${className}`}>
      <div className='max-w-7xl mx-auto px-6 sm:px-12 lg:px-20 flex flex-col gap-12'>
        {/* Top Content Row */}
        <div className='flex flex-col lg:flex-row justify-between items-start gap-10'>
          {/* Brand Info */}
          <div className='flex flex-col items-start gap-4 max-w-md'>
            <Link href='/' className='flex items-center gap-2.5'>
              <div className='relative w-6 h-6 rounded-[5px] overflow-hidden shrink-0'>
                <Image
                  src='/images/logo-mark.png'
                  alt='Yeolo Logo'
                  width={24}
                  height={24}
                  className='object-cover w-full h-full'
                />
              </div>
              <span className='font-extrabold text-[18px] text-white tracking-tight'>
                여로
              </span>
            </Link>

            <p className='text-[14px] text-[#64748b] leading-[1.6]'>
              초개인화 기술로 새로운 형태의 여행을 설계하는 플랫폼, 여로.
              <br />
              당신의 다음 모험을 누구보다 똑똑하게 가이드합니다.
            </p>
          </div>

          {/* Nav Links Columns */}
          <div className='flex gap-14 sm:gap-20'>
            {/* Company Column */}
            <div className='flex flex-col gap-3'>
              <h4 className='font-bold text-[14px] text-white tracking-tight'>
                회사 소개
              </h4>
              <ul className='flex flex-col gap-2.5 text-[13px] text-[#64748b]'>
                <li>
                  <a
                    href={partnerMailHref}
                    className='hover:text-white transition-colors'>
                    제휴 제안
                  </a>
                </li>
              </ul>
            </div>

            {/* Terms Column */}
            <div className='flex flex-col gap-3'>
              <h4 className='font-bold text-[14px] text-white tracking-tight'>
                이용 약관
              </h4>
              <ul className='flex flex-col gap-2.5 text-[13px] text-[#64748b]'>
                <li>
                  <Link
                    href='/terms'
                    className='hover:text-white transition-colors'>
                    서비스 이용약관
                  </Link>
                </li>
                <li>
                  <Link
                    href='/privacy'
                    className='hover:text-white transition-colors'>
                    개인정보처리방침
                  </Link>
                </li>
                <li>
                  <a
                    href={supportMailHref}
                    className='hover:text-white transition-colors'>
                    고객센터
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Divider Line */}
        <div className='w-full h-px bg-white/10' />

        {/* Bottom Copyright */}
        <div className='flex items-center justify-between text-[12px] text-[#64748b]'>
          <p>© 2026 여로 (Yeolo) Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
