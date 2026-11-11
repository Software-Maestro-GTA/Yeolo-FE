'use client';
/**
 * @file HowItWorksSection.tsx
 * @description 여행 시작 단계를 선택해 살펴볼 수 있는 접근 가능한 앱 이용 안내
 */
import { useState } from 'react';
import { ArrowRightIcon } from '@/components/Icons';
export interface HowItWorksSectionProps {
  className?: string;
}
const STEPS = [
  {
    title: '나를 알아가는 시간',
    label: '여행 취향 분석',
    description:
      '사진으로 취향을 찾거나 MBTI로 시작해 보세요. 내가 좋아하는 여행의 모습이 조금 더 선명해져요.',
    tags: ['사진으로 취향 발견', 'MBTI로 간편하게'],
    heading: '여행의 시작은, 나로부터.',
  },
  {
    title: '떠나고 싶은 곳을 골라요',
    label: '목적지·일정 설정',
    description:
      '목적지와 여행 날짜, 예산만 정하면 준비 끝. 취향에 맞는 장소와 동선을 한눈에 확인할 수 있어요.',
    tags: ['목적지와 날짜', '나에게 맞는 예산'],
    heading: '복잡한 계획은 가볍게.',
  },
  {
    title: '함께 나누면 더 좋은 여행',
    label: '일정 확인 & 공유',
    description:
      '완성된 코스를 확인하고 친구에게 공유해 보세요. 다녀온 여행은 사진을 모아 릴스로 간직할 수 있어요.',
    tags: ['친구에게 코스 공유', '여행을 릴스로 기록'],
    heading: '설렘은 함께, 기억은 오래.',
  },
];
export function HowItWorksSection({ className = '' }: HowItWorksSectionProps) {
  const [active, setActive] = useState(0);
  const step = STEPS[active];
  return (
    <section
      id='how-it-works'
      className={`how-section section-space ${className}`}
      aria-labelledby='how-title'>
      <div className='site-container how-grid'>
        <div>
          <span className='eyebrow'>HOW TO YEOLO</span>
          <h2 id='how-title' className='section-title'>
            여행 준비,
            <br />
            이렇게 쉬워져요.
          </h2>
          <div className='step-list'>
            {STEPS.map((item, index) => (
              <button
                key={item.label}
                type='button'
                aria-pressed={active === index}
                aria-controls='step-preview'
                className={`step-button${active === index ? ' is-active' : ''}`}
                onClick={() => setActive(index)}>
                <span className='step-index'>0{index + 1}</span>
                <span>
                  <small>{item.label}</small>
                  <strong>{item.title}</strong>
                </span>
                <ArrowRightIcon size={20} aria-hidden='true' />
              </button>
            ))}
          </div>
        </div>
        <div
          id='step-preview'
          className='step-preview'
          aria-live='polite'
          aria-atomic='true'>
          <span className='preview-kicker'>STEP 0{active + 1}</span>
          <div className='step-art step-art--number' aria-hidden='true'>
            0{active + 1}
          </div>
          <h3>{step.heading}</h3>
          <p>{step.description}</p>
          <div className='tag-row'>
            {step.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
