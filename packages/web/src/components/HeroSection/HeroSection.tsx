/**
 * @file HeroSection.tsx
 * @description 브랜드 문구와 텍스트 기반 서비스 소개를 활용한 다운로드 중심 첫 화면
 */
import { ArrowRightIcon } from '@/components/Icons';
import { StoreButtons } from '@/components/StoreButtons/StoreButtons';
import { ProductPreview } from '@/components/ProductPreview/ProductPreview';
export interface HeroSectionProps {
  className?: string;
}

export function HeroSection({ className = '' }: HeroSectionProps) {
  return (
    <section
      className={`hero-section ${className}`}
      aria-labelledby='hero-title'>
      <div className='site-container hero-grid'>
        <div className='hero-copy'>
          <span className='eyebrow'>
            <span className='eyebrow-dot' /> 나를 아는 여행의 시작
          </span>
          <h1 id='hero-title'>
            나도 몰랐던
            <br />내 안의 <span>여행 취향.</span>
          </h1>
          <p className='hero-description'>
            사진첩 속 취향이 나만의 여행 코스로.
            <br />
            어디로 갈지 고민하는 순간부터,
            <br className='mobile-break' /> 여로가 함께할게요.
          </p>
          <StoreButtons />
          <a className='text-link hero-explore' href='#how-it-works'>
            여로와 여행하는 방법 <ArrowRightIcon size={18} aria-hidden='true' />
          </a>
        </div>
        <div className='hero-art'>
          <div className='hero-orbit' aria-hidden='true' />
          <ProductPreview />
        </div>
      </div>
      <div className='site-container hero-bottom'>
        <span>발견하고</span>
        <i />
        <span>계획하고</span>
        <i />
        <span>기록하는 여행</span>
        <p>모든 여정의 시작, 여로</p>
      </div>
    </section>
  );
}
