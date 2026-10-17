'use client';
/**
 * @file Header.tsx
 * @description 기기별 다운로드 경로와 키보드 접근 가능한 모바일 메뉴를 제공하는 UI v3 헤더
 */
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MenuIcon, CloseIcon, ArrowRightIcon } from '@/components/Icons';

export interface HeaderProps {
  className?: string;
}
const menuItems = [
  { label: '주요 기능', href: '/#features' },
  { label: '이용 방법', href: '/#how-it-works' },
  { label: '여행의 발견', href: '/#destinations' },
];

/** 모든 화면의 첫 영역에서 앱 다운로드와 주요 섹션 탐색을 제공합니다. */
export function Header({ className = '' }: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isMobileMenuOpen]);

  return (
    <header className={`site-header ${className}`}>
      <div className='site-container header-inner'>
        <Link href='/' aria-label='여로 홈페이지' className='brand-link'>
          <Image
            src='/branding/yeolo-logo.svg'
            alt='여로 (Yeolo)'
            width={588}
            height={188}
            className='brand-logo'
            priority
          />
        </Link>
        <nav aria-label='주요 메뉴' className='desktop-nav'>
          {menuItems.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className='header-actions'>
          <Link href='/download' className='header-download'>
            앱 다운로드
            <ArrowRightIcon size={16} aria-hidden='true' />
          </Link>
          <button
            ref={toggleRef}
            type='button'
            className='menu-toggle'
            aria-label='메뉴 열기/닫기'
            aria-expanded={isMobileMenuOpen}
            aria-controls='mobile-menu'
            onClick={() => setIsMobileMenuOpen((open) => !open)}>
            {isMobileMenuOpen ? (
              <CloseIcon size={22} aria-hidden='true' />
            ) : (
              <MenuIcon size={22} aria-hidden='true' />
            )}
          </button>
        </div>
      </div>
      {isMobileMenuOpen && (
        <nav id='mobile-menu' aria-label='모바일 메뉴' className='mobile-nav'>
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}>
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
