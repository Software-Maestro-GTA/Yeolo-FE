/**
 * @file page.tsx
 * @description 여로 앱의 회원 탈퇴 절차와 사용자 데이터 삭제 요청 방법을 안내합니다.
 */

import type { Metadata } from 'next';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

const title = '사용자 데이터 삭제 안내 | 여로 (Yeolo)';
const description =
  '여로 앱에서 회원 탈퇴로 데이터를 삭제하는 방법과 이메일로 삭제를 요청하는 방법을 안내합니다.';
const deletionMailHref = `mailto:yeolotrip@gmail.com?subject=${encodeURIComponent('[여로] 사용자 데이터 삭제 요청')}&body=${encodeURIComponent(
  '안녕하세요. 여로 사용자 데이터 삭제를 요청합니다.\n\n가입한 이메일 주소:\n삭제를 요청하는 내용:\n앱에서 탈퇴하기 어려운 경우 그 사유 (선택):\n\n비밀번호나 인증번호는 기재하지 마세요.',
)}`;

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/data-deletion' },
  openGraph: { title, description, url: '/data-deletion' },
};

/** 로그인 없이 열람할 수 있는 데이터 삭제 절차 안내 페이지를 반환합니다. */
export default function DataDeletionPage() {
  return (
    <div className='min-h-screen flex flex-col bg-background text-foreground'>
      <Header />

      <main id='main-content' tabIndex={-1} className='flex-1 flex flex-col'>
        <section className='legal-banner' aria-labelledby='deletion-title'>
          <div className='max-w-4xl mx-auto flex flex-col items-center gap-4'>
            <span className='inline-flex items-center px-4 py-2 rounded-full bg-mint-light text-blue-ink text-sm font-bold'>
              여로 서비스 이용 약관 &amp; 정책
            </span>
            <h1
              id='deletion-title'
              className='text-3xl sm:text-4xl font-extrabold tracking-tight'>
              사용자 데이터 삭제 안내
            </h1>
            <p className='text-sm font-medium text-muted'>
              여로(Yeolo) 계정 및 개인정보 삭제 요청 방법
            </p>
          </div>
        </section>

        <div className='legal-content'>
          <div className='max-w-4xl mx-auto flex flex-col gap-10 text-sm text-muted leading-relaxed'>
            <p className='text-base'>
              여로 이용자는 앱에서 회원 탈퇴를 진행하거나 고객센터에 이메일로
              사용자 데이터 삭제를 요청할 수 있습니다. 이 안내는 로그인 없이
              확인할 수 있습니다.
            </p>

            <section aria-labelledby='in-app-deletion' className='space-y-4'>
              <h2
                id='in-app-deletion'
                className='text-lg font-bold text-foreground'>
                1. 앱에서 회원 탈퇴하기
              </h2>
              <ol className='list-decimal pl-5 space-y-3'>
                <li>여로 앱에 삭제하려는 계정으로 로그인합니다.</li>
                <li>홈 화면의 프로필 버튼을 눌러 프로필 화면을 엽니다.</li>
                <li>
                  <strong className='text-foreground'>앱 정보</strong>에서{' '}
                  <strong className='text-foreground'>탈퇴하기</strong>를
                  선택합니다.
                </li>
                <li>
                  <strong className='text-foreground'>회원탈퇴</strong> 확인창의
                  안내를 확인한 뒤{' '}
                  <strong className='text-foreground'>탈퇴</strong> 버튼을
                  누릅니다.
                </li>
              </ol>
              <div className='rounded-xl border border-card-border bg-bg-soft p-5 space-y-2'>
                <p className='font-bold text-foreground'>
                  탈퇴 전 확인해 주세요
                </p>
                <p>
                  앱의 탈퇴 안내에 따라 모든 일정 및 회원 정보가 삭제되며,
                  삭제된 데이터는 복구할 수 없습니다.
                </p>
                <p>
                  로그아웃하거나 기기에서 앱을 삭제하는 것만으로는 회원 탈퇴가
                  처리되지 않습니다. 오류가 발생하거나 삭제 완료 여부를 확인하기
                  어려우면 아래 이메일로 문의해 주세요.
                </p>
              </div>
            </section>

            <section aria-labelledby='email-deletion' className='space-y-4'>
              <h2
                id='email-deletion'
                className='text-lg font-bold text-foreground'>
                2. 이메일로 데이터 삭제 요청하기
              </h2>
              <p>
                앱에 로그인할 수 없거나 앱에서 탈퇴를 진행하기 어려운 경우, 아래
                고객센터로 데이터 삭제를 요청해 주세요. 가능하면 여로에 가입한
                이메일 주소로 보내 주세요.
              </p>
              <ul className='list-disc pl-5 space-y-2'>
                <li>받는 곳: yeolotrip@gmail.com</li>
                <li>제목: [여로] 사용자 데이터 삭제 요청</li>
                <li>내용: 가입한 이메일 주소와 삭제를 요청하는 내용</li>
              </ul>
              <p>
                비밀번호, 인증번호, 신분증 등 민감한 정보는 보내지 마세요.
                요청한 계정을 확인하기 위해 필요한 추가 절차가 있는 경우
                이메일로 안내합니다.
              </p>
              <a
                href={deletionMailHref}
                className='inline-flex rounded-xl bg-blue-ink px-5 py-3 font-bold text-white'>
                이메일로 데이터 삭제 요청하기
              </a>
              <p>
                메일 앱이 열리지 않으면 이용 중인 이메일 서비스에서{' '}
                <a
                  href='mailto:yeolotrip@gmail.com'
                  className='font-medium text-blue-ink underline'>
                  yeolotrip@gmail.com
                </a>
                으로 직접 보내 주세요.
              </p>
            </section>

            <section aria-labelledby='deletion-scope' className='space-y-4'>
              <h2
                id='deletion-scope'
                className='text-lg font-bold text-foreground'>
                3. 삭제 대상 및 보관 안내
              </h2>
              <p>
                회원 탈퇴 시 회원 정보와 저장된 여행 일정 등 계정에 연결된
                데이터가 삭제 대상입니다. 개인정보처리방침에 따라 수집된
                개인정보는 회원 탈퇴 시 원칙적으로 즉시 파기합니다.
              </p>
              <p>
                다만 관계 법령에 따라 보존해야 하는 정보는 해당 법령에서 정한
                기간 동안 보관합니다. 개인정보의 수집 항목, 보유 기간 및
                이용자의 권리에 관한 자세한 내용은{' '}
                <Link href='/privacy' className='text-blue-ink underline'>
                  개인정보처리방침
                </Link>
                에서 확인할 수 있습니다.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
