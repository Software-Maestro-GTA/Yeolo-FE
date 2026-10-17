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
    <footer className={`site-footer ${className}`}>
      <div className='site-container'>
        <div className='footer-top'>
          <div className='footer-brand'>
            <Link href='/' aria-label='여로 홈페이지' className='brand-link'>
              <Image
                src='/branding/yeolo-logo.svg'
                alt='여로 (Yeolo)'
                width={588}
                height={188}
                className='brand-logo'
              />
            </Link>
            <p>
              나도 몰랐던 내 안의 여행 취향 발견.
              <br />
              당신다운 여행의 시작, 여로.
            </p>
          </div>
          <nav className='footer-links' aria-label='고객 지원 및 정책'>
            <div>
              <h3>여로와 함께</h3>
              <a href={partnerMailHref}>제휴 제안</a>
              <a href={supportMailHref}>고객센터</a>
            </div>
            <div>
              <h3>이용 안내</h3>
              <Link href='/terms'>서비스 이용약관</Link>
              <Link href='/privacy'>개인정보처리방침</Link>
            </div>
          </nav>
        </div>
        <div className='footer-bottom'>
          <p>© 2026 여로 (Yeolo) Inc. All rights reserved.</p>
          <span>YOUR TRAVEL, YOUR WAY.</span>
        </div>
      </div>
    </footer>
  );
}
