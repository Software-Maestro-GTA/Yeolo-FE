/**
 * @file CTASection.tsx
 * @description 스토어 직접 링크와 자주 묻는 질문을 제공하는 다운로드 영역
 */
import { StoreButtons } from '@/components/StoreButtons/StoreButtons';
export interface CTASectionProps {
  className?: string;
}
export function CTASection({ className = '' }: CTASectionProps) {
  return (
    <>
      <section
        className='faq-section section-space'
        aria-labelledby='faq-title'>
        <div className='site-container faq-grid'>
          <div>
            <span className='eyebrow'>BEFORE YOU GO</span>
            <h2 id='faq-title' className='section-title'>
              떠나기 전,
              <br />
              궁금한 이야기.
            </h2>
          </div>
          <div className='faq-list'>
            <details>
              <summary>
                여로는 어떤 앱인가요?<span aria-hidden='true'>+</span>
              </summary>
              <p>
                사진과 MBTI를 바탕으로 여행 취향을 발견하고, 목적지·날짜·예산에
                맞춰 코스를 만드는 여행 앱이에요. 코스 공유와 여행 릴스 제작도
                함께 이용할 수 있어요.
              </p>
            </details>
            <details>
              <summary>
                사진을 선택하지 않아도 이용할 수 있나요?
                <span aria-hidden='true'>+</span>
              </summary>
              <p>
                네. 사진 분석 대신 MBTI로 여행 취향을 알아보고 코스를 만들 수
                있어요. 앱에서 나에게 편한 방법을 선택해 주세요.
              </p>
            </details>
            <details>
              <summary>
                친구에게 여행 코스를 공유할 수 있나요?
                <span aria-hidden='true'>+</span>
              </summary>
              <p>
                앱에서 만든 코스의 공유 링크를 보내면 친구가 웹에서 내용을
                확인할 수 있어요. 이어서 여로 앱에서 여행을 함께 준비해 보세요.
              </p>
            </details>
          </div>
        </div>
      </section>
      <section
        id='download'
        className={`download-section ${className}`}
        aria-labelledby='download-title'>
        <div className='site-container download-panel download-panel--text'>
          <div>
            <span className='eyebrow'>YOUR JOURNEY, YOUR WAY</span>
            <h2 id='download-title'>
              다음 여행은
              <br />
              조금 더 나답게.
            </h2>
            <p>지금 여로에서 나만의 여행길을 열어보세요.</p>
            <StoreButtons light />
          </div>
        </div>
      </section>
    </>
  );
}
