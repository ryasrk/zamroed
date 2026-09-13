'use client';

import { useCallback, useEffect, useId, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '../lib/cn';

/** Satu item navigasi utama. `href` boleh berupa path internal maupun URL absolut. */
export interface NavItem {
  label: string;
  href: string;
}

export interface HeaderProps {
  /** Nama merek yang tampil di samping logo. */
  brandName: string;
  /** Daftar tautan navigasi; array kosong diperbolehkan dan drawer tidak dirender. */
  navItems: NavItem[];
  /** Label tombol ajakan (CTA) di sisi kanan. Tanpa ini, CTA tidak dirender. */
  ctaLabel?: string;
  /** Tujuan CTA; tanpa ini CTA juga tidak dirender meski label diisi. */
  ctaHref?: string;
  /** Path logo. Bila kosong, dipakai penanda huruf pertama `brandName`. */
  logoSrc?: string;
  className?: string;
}

/** Ambang piksel sebelum header mendapat garis bawah dan bayangan. */
const SCROLL_THRESHOLD = 24;

/**
 * Menormalkan path untuk perbandingan tautan aktif: buang query/hash,
 * rapikan garis miring di ujung, dan perlakukan root sebagai '/'.
 */
function normalizePath(rawPath: string): string {
  if (typeof rawPath !== 'string') return '/';
  const withoutQuery = rawPath.split(/[?#]/, 1)[0] ?? '';
  if (withoutQuery === '') return '/';
  const trimmed = withoutQuery.replace(/\/+$/, '');
  return trimmed === '' ? '/' : trimmed;
}

/** True bila path saat ini berada di dalam cabang `href` (bukan sekadar awalan teks). */
function isActiveHref(currentPath: string, href: string): boolean {
  const current = normalizePath(currentPath);
  const target = normalizePath(href);
  if (target === '/') return current === '/';
  return current === target || current.startsWith(`${target}/`);
}

/** Inisial merek: huruf pertama, atau '·' bila nama kosong/hanya spasi. */
function brandInitial(brandName: string): string {
  const first = brandName.trim().charAt(0);
  return first === '' ? '·' : first.toUpperCase();
}

/**
 * Header situs bersama untuk Jagatirta (theme-jagatirta) dan ZAMROED Bergerak
 * (theme-zamroed). Semua warna dibaca dari token `brand.*` yang di-rebind per tema,
 * sehingga tidak ada warna merek yang di-hardcode.
 *
 * - Desktop (md+): navigasi horizontal, merek di kiri, CTA di kanan.
 * - Mobile: tombol hamburger 48px membuka drawer layar penuh dengan target sentuh besar.
 * - Kunci scroll body saat drawer terbuka; tutup dengan Escape atau saat tautan ditekan.
 */
export function Header({
  brandName,
  navItems,
  ctaLabel,
  ctaHref,
  logoSrc,
  className,
}: HeaderProps) {
  const rawPathname = usePathname();
  const pathname = typeof rawPathname === 'string' ? rawPathname : '/';

  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  const drawerId = `${useId()}-drawer`;
  const navLabelId = `${useId()}-nav`;
  const toggleRef = useRef<HTMLButtonElement | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);

  const hasNav = navItems.length > 0;
  const hasCta = Boolean(ctaLabel && ctaHref);
  const showLogoImage = Boolean(logoSrc) && !logoFailed;

  // SSR aman: window hanya disentuh di dalam effect (client-only).
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > SCROLL_THRESHOLD);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Rute berubah -> drawer harus tertutup (navigasi programatik atau tombol back).
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Kunci scroll body selama drawer terbuka; selalu pulihkan nilai awal.
  useEffect(() => {
    if (!isOpen) return;
    const { body } = document;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = 'hidden';
    // Cegah pergeseran layout saat scrollbar hilang.
    if (Number.isFinite(scrollbarWidth) && scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`;
    }
    return () => {
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
    };
  }, [isOpen]);

  // Escape menutup drawer dan memindahkan fokus kembali ke tombol pemicu.
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setIsOpen(false);
      toggleRef.current?.focus();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const closeDrawer = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleDrawer = useCallback(() => {
    setIsOpen((previous) => !previous);
  }, []);

  const brandMark = (
    <span
      className={cn(
        'grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl',
        'bg-brand-primary text-lg font-bold text-white shadow-[0_2px_0_0_var(--brand-deep)]',
      )}
      aria-hidden="true"
    >
      {showLogoImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- logo boleh dari CDN apa pun tanpa domain tetap.
        <img
          src={logoSrc}
          alt=""
          width={44}
          height={44}
          className="h-full w-full object-cover"
          onError={() => setLogoFailed(true)}
        />
      ) : (
        brandInitial(brandName)
      )}
    </span>
  );

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full',
        'bg-surface/80 backdrop-blur-md supports-[backdrop-filter]:bg-surface/65',
        'transition-[border-color,box-shadow,background-color] duration-300 ease-crisp',
        isScrolled
          ? 'border-b border-editorial shadow-[0_6px_24px_-12px_rgba(2,6,23,0.35)]'
          : 'border-b border-transparent shadow-none',
        className,
      )}
      data-scrolled={isScrolled || undefined}
    >
      <div className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        {/* Merek: tinggi baris dijaga 4rem agar target sentuh nyaman di ponsel. */}
        <Link
          href="/"
          className={cn(
            'group flex min-h-16 min-w-0 items-center gap-3 rounded-xl py-2 pr-2',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent',
            'focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
          )}
        >
          {brandMark}
          <span className="flex min-w-0 flex-col">
            <span className="truncate text-base font-bold leading-tight tracking-tight text-ink sm:text-lg">
              {brandName.trim() === '' ? 'Tanpa Nama' : brandName}
            </span>
            <span
              className="mt-0.5 h-[3px] w-8 rounded-full bg-brand-accent transition-all duration-300 ease-crisp group-hover:w-12"
              aria-hidden="true"
            />
          </span>
        </Link>

        {/* Desktop: navigasi horizontal dan CTA. */}
        {hasNav ? (
          <nav
            aria-label="Navigasi utama"
            className="ml-auto hidden items-center gap-1 md:flex"
          >
            <ul className="flex items-center gap-1">
              {navItems.map((item) => {
                const active = isActiveHref(pathname, item.href);
                return (
                  <li key={`${item.href}-${item.label}`}>
                    <Link
                      href={item.href}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'relative inline-flex min-h-12 items-center rounded-lg px-3 text-sm font-semibold',
                        'transition-colors duration-200 ease-crisp',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent',
                        'focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
                        active
                          ? 'text-brand-deep'
                          : 'text-ink-secondary hover:text-brand-deep',
                      )}
                    >
                      {item.label}
                      {/* Garis aktif bawah: penanda status, bukan hiasan. */}
                      <span
                        className={cn(
                          'absolute inset-x-3 bottom-1 h-[3px] rounded-full bg-brand-primary',
                          'origin-left transition-transform duration-300 ease-crisp',
                          active ? 'scale-x-100' : 'scale-x-0',
                        )}
                        aria-hidden="true"
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        ) : (
          <span className="ml-auto" />
        )}

        {hasCta ? (
          <Link
            href={ctaHref as string}
            className={cn(
              'ml-auto hidden min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl px-5 md:inline-flex',
              'bg-brand-primary text-sm font-semibold text-white',
              'shadow-[0_2px_0_0_var(--brand-deep)] transition-[background-color,box-shadow,transform] duration-200 ease-crisp',
              'hover:bg-brand-deep focus-visible:outline-none focus-visible:ring-2',
              'focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
            )}
          >
            {ctaLabel}
          </Link>
        ) : null}

        {/* Mobile: tombol hamburger minimal 48x48. */}
        {hasNav || hasCta ? (
          <button
            ref={toggleRef}
            type="button"
            onClick={toggleDrawer}
            aria-expanded={isOpen}
            aria-controls={drawerId}
            aria-label={isOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
            className={cn(
              'ml-auto inline-grid h-12 w-12 shrink-0 place-items-center rounded-xl md:hidden',
              'border border-editorial bg-surface-pure text-ink',
              'transition-[background-color,border-color,color] duration-200 ease-crisp',
              'hover:border-brand-primary hover:text-brand-deep',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent',
              'focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
            )}
          >
            {/* Ikon dua garis/bidang yang dianimasikan menjadi silang saat terbuka. */}
            <span className="relative block h-5 w-6" aria-hidden="true">
              <span
                className={cn(
                  'absolute left-0 block h-[3px] w-6 rounded-full bg-current',
                  'transition-transform duration-300 ease-crisp',
                  isOpen ? 'top-[8.5px] rotate-45' : 'top-0',
                )}
              />
              <span
                className={cn(
                  'absolute left-0 block h-[3px] w-6 rounded-full bg-current',
                  'transition-transform duration-300 ease-crisp',
                  isOpen ? 'top-[8.5px] scale-x-0' : 'top-2',
                )}
              />
              <span
                className={cn(
                  'absolute left-0 block h-[3px] w-6 rounded-full bg-current',
                  'transition-transform duration-300 ease-crisp',
                  isOpen ? 'top-[8.5px] -rotate-45' : 'top-4',
                )}
              />
            </span>
          </button>
        ) : null}
      </div>

      {/* Drawer mobile: panel layar penuh, target sentuh besar. */}
      <div
        id={drawerId}
        ref={drawerRef}
        hidden={!isOpen}
        className={cn(
          'fixed inset-x-0 bottom-0 top-16 z-40 md:hidden',
          'bg-canvas/[0.98] backdrop-blur-lg',
          isOpen && 'animate-fade-up',
        )}
      >
        <nav
          aria-labelledby={navLabelId}
          className="flex h-full flex-col gap-1 overflow-y-auto px-4 pb-8 pt-4 sm:px-6"
        >
          <p id={navLabelId} className="sr-only">
            Navigasi utama
          </p>

          {hasNav ? (
            <ul className="flex flex-col gap-1">
              {navItems.map((item, index) => {
                const active = isActiveHref(pathname, item.href);
                return (
                  <li key={`${item.href}-${item.label}`}>
                    <Link
                      href={item.href}
                      onClick={closeDrawer}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'flex min-h-[3.5rem] w-full items-center gap-3 rounded-xl px-4 py-3',
                        'text-lg font-semibold transition-colors duration-200 ease-crisp',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent',
                        'focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
                        active
                          ? 'bg-brand-soft text-brand-deep'
                          : 'text-ink hover:bg-brand-soft hover:text-brand-deep',
                      )}
                    >
                      <span
                        className="w-6 shrink-0 text-xs font-bold tabular-nums text-ink-secondary"
                        aria-hidden="true"
                      >
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {active ? (
                        <span className="text-xs font-bold uppercase tracking-wider text-brand-primary">
                          Aktif
                        </span>
                      ) : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="measure-editorial px-1 text-sm text-ink-secondary">
              Belum ada menu navigasi.
            </p>
          )}

          {hasCta ? (
            <Link
              href={ctaHref as string}
              onClick={closeDrawer}
              className={cn(
                'mt-4 flex min-h-[3.5rem] w-full items-center justify-center gap-2 rounded-xl px-5',
                'bg-brand-primary text-base font-semibold text-white',
                'shadow-[0_3px_0_0_var(--brand-deep)] transition-colors duration-200 ease-crisp',
                'hover:bg-brand-deep focus-visible:outline-none focus-visible:ring-2',
                'focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
              )}
            >
              {ctaLabel}
            </Link>
          ) : null}

          {/* Kaki drawer: jalur keluar darurat tetap tersedia tanpa harus menekan Escape. */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              toggleRef.current?.focus();
            }}
            className={cn(
              'mt-auto flex min-h-12 w-full items-center justify-center rounded-xl',
              'border border-editorial px-4 text-sm font-semibold text-ink-secondary',
              'transition-colors duration-200 ease-crisp hover:text-brand-deep',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent',
              'focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
            )}
          >
            Tutup menu
          </button>
        </nav>
      </div>
    </header>
  );
}
