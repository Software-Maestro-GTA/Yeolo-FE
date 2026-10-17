/**
 * @file FeaturesSection.tsx
 * @description 텍스트와 선형 아이콘으로 소개하는 여로의 취향·코스·기록 기능
 */
import { CameraIcon, CalendarCheckIcon, PlayIcon } from '@/components/Icons';
export interface FeaturesSectionProps {
  className?: string;
}
export function FeaturesSection({ className = '' }: FeaturesSectionProps) {
  return (
    <section
      id='features'
      className={`section-space ${className}`}
      aria-labelledby='features-title'>
      <div className='site-container'>
        <div className='section-heading'>
          <div>
            <span className='eyebrow'>MADE FOR YOUR JOURNEY</span>
            <h2 id='features-title'>
              남들이 좋다는 곳보다,
              <br />
              내가 좋아할 여행.
            </h2>
          </div>
          <p>
            취향을 알아보는 작은 발견부터
            <br />
            여행을 오래 간직하는 방법까지.
          </p>
        </div>
        <div className='feature-grid'>
          <article className='feature-card feature-card--blue'>
            <span className='feature-number'>01 / DISCOVER</span>
            <h3>
              사진 속에 담긴
              <br />
              나의 여행 취향
            </h3>
            <p>
              사진과 MBTI로 발견하는 나만의 여행 스타일.
              <br />
              미처 몰랐던 취향까지 만나보세요.
            </p>
            <div className='feature-visual feature-visual--type'>
              <span className='feature-symbol' aria-hidden='true'>
                <CameraIcon size={32} />
              </span>
              <strong>사진 한 장, 새로운 발견</strong>
              <span>사진 · MBTI · 나의 취향</span>
            </div>
            <span className='feature-caption'>취향을 발견하는 즐거움</span>
          </article>
          <article className='feature-card feature-card--map'>
            <span className='feature-number'>02 / PLAN</span>
            <h3>
              가고 싶은 마음을
              <br />
              하나의 코스로
            </h3>
            <p>
              여행지와 날짜, 예산을 알려주세요.
              <br />내 취향에 맞는 여정을 만들어드릴게요.
            </p>
            <div className='feature-visual feature-visual--type'>
              <span className='feature-symbol' aria-hidden='true'>
                <CalendarCheckIcon size={32} />
              </span>
              <strong>나만의 여행 코스</strong>
              <span>목적지 · 날짜 · 예산</span>
            </div>
            <span className='feature-caption'>계획은 가볍게, 여행은 깊게</span>
          </article>
          <article className='feature-card feature-card--light'>
            <span className='feature-number'>03 / REMEMBER</span>
            <h3>
              여행이 끝나도
              <br />
              계속되는 설렘
            </h3>
            <p>
              여행 사진을 모아 나만의 릴스로.
              <br />
              좋았던 순간을 다시 꺼내 보세요.
            </p>
            <div className='feature-visual feature-visual--type'>
              <span className='feature-symbol' aria-hidden='true'>
                <PlayIcon size={32} />
              </span>
              <strong>다시 꺼내 보는 그 순간</strong>
              <span>여행 사진 · 릴스 · 추억</span>
            </div>
            <span className='feature-caption'>나만의 방식으로 남기는 기록</span>
          </article>
        </div>
      </div>
    </section>
  );
}
