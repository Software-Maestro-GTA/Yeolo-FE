/**
 * @file ProductPreview.tsx
 * @description 이미지 에셋 없이 텍스트와 단계로 여로의 핵심 기능을 소개하는 미리보기
 */
import Image from 'next/image';
import { ArrowRightIcon } from '@/components/Icons';

/** 비대화형 서비스 소개 카드입니다. */
export function ProductPreview() {
  return (
    <div
      className='product-preview'
      role='img'
      aria-label='여로 서비스 소개: 여행 취향 분석, 코스 만들기, 여행 기록'>
      <div className='preview-top'>
        <Image
          src='/branding/yeolo-logo.svg'
          width={588}
          height={188}
          alt=''
          className='preview-logo'
        />
        <span className='preview-label'>YOUR JOURNEY</span>
      </div>
      <p className='preview-greeting'>어떤 여행이 나다울까요?</p>
      <div className='preview-journey'>
        {[
          ['01', '나의 취향 발견', '좋아하는 순간에서 시작해요'],
          ['02', '나만의 코스 계획', '가고 싶은 곳을 하나의 여정으로'],
          ['03', '우리의 여행 기록', '다시 꺼내 보고 싶은 순간들'],
        ].map(([number, title, description]) => (
          <div className='preview-journey-step' key={number}>
            <span>{number}</span>
            <div>
              <strong>{title}</strong>
              <p>{description}</p>
            </div>
          </div>
        ))}
      </div>
      <div className='preview-reel'>
        <span>다음 여행은 조금 더 나답게</span>
        <ArrowRightIcon size={16} aria-hidden='true' />
      </div>
    </div>
  );
}
