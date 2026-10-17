/**
 * @file page.tsx
 * @description /download 접속 시 기기에 맞는 앱 스토어 또는 웹 홈페이지로 자동 이동
 */

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { APP_STORE_URL, PLAY_STORE_URL, getDownloadUrl } from '@/lib/download';

/** 기기 판별 후 현재 방문 기록을 대체하고, 자동 이동이 차단되면 수동 링크를 제공합니다. */
export default function DownloadPage() {
  useEffect(() => {
    window.location.replace(getDownloadUrl(navigator));
  }, []);

  return (
    <main
      id='main-content'
      tabIndex={-1}
      className='download-bridge flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-6 text-center text-foreground'>
      <h1 className='text-2xl font-bold'>여로로 이동 중입니다</h1>
      <p className='text-muted'>
        자동으로 이동하지 않으면 아래 링크를 눌러주세요.
      </p>
      <nav
        aria-label='앱 다운로드 및 홈페이지'
        className='flex flex-wrap justify-center gap-6'>
        <a className='text-blue-ink underline' href={APP_STORE_URL}>
          App Store
        </a>
        <a className='text-blue-ink underline' href={PLAY_STORE_URL}>
          Google Play
        </a>
        <Link className='text-blue-ink underline' href='/'>
          웹 홈페이지
        </Link>
      </nav>
    </main>
  );
}
