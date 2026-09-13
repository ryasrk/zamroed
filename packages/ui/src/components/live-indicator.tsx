'use client';

import { useEffect, useState } from 'react';

import { cn } from '../lib/cn';

/** Nada indikator: siaran aktif atau tidak ada aktivitas. */
export type LiveIndicatorTone = 'live' | 'offline';

export interface LiveIndicatorProps {
  /** Jumlah orang yang sedang melihat. `undefined` menyembunyikan angka. */
  count?: number;
  /** Ganti label bawaan. Tanpa `label`, teks mengikuti `count` & `tone`. */
  label?: string;
  /** 'live' = titik berdenyut (status.good), 'offline' = titik statis redup. */
  tone?: LiveIndicatorTone;
  /** Ukuran titik & teks. 'sm' untuk kartu, 'md' untuk header siaran langsung. */
  size?: 'sm' | 'md';
  /** Tampilkan `count` dalam bentuk angka saja tanpa kata "orang". */
  showDot?: boolean;
  /** Kelas tambahan untuk elemen pembungkus. */
  className?: string;
}

/** Label bawaan Bahasa Indonesia untuk tiap nada. */
const TONE_LABELS: Record<LiveIndicatorTone, string> = {
  live: 'Sedang tayang',
  offline: 'Tidak tayang',
};

const SIZE = {
  sm: { wrapper: 'h-6 gap-2 text-xs', dot: 'h-2 w-2', ring: 'h-2 w-2' },
  md: { wrapper: 'h-8 gap-2.5 text-xs', dot: 'h-2.5 w-2.5', ring: 'h-2.5 w-2.5' },
} as const;

const TONE: Record<LiveIndicatorTone, { dot: string; ring: string; text: string }> = {
  live: {
    dot: 'bg-status-good ring-status-good/30',
    ring: 'bg-status-good/70',
    text: 'text-status-good',
  },
  offline: {
    dot: 'bg-ink-secondary/45 ring-ink-secondary/20',
    ring: 'bg-ink-secondary/40',
    text: 'text-ink-secondary',
  },
};

/** Format angka dengan pemisah ribuan Indonesia; aman untuk NaN/Infinity/negatif. */
function formatCount(value: number | undefined): string | null {
  if (value === undefined || !Number.isFinite(value)) return null;
  return new Intl.NumberFormat('id-ID').format(Math.max(0, Math.trunc(value)));
}

/**
 * LiveIndicator — penanda "sedang tayang" bersama untuk Jagatirta &
 * ZAMROED Bergerak.
 *
 * Client component: membaca `prefers-reduced-motion` lewat `matchMedia`
 * sehingga pengguna yang memintanya mendapat titik statis tanpa denyut.
 * Warna selalu dari token (`status.good` untuk live, `ink.secondary` untuk
 * offline) agar satu komponen melayani `theme-jagatirta` dan `theme-zamroed`.
 *
 * Selalu `role="status"` + `aria-live="polite"`: jumlah penonton berubah
 * saat halaman terbuka dan pembaca layar perlu diumumkan tanpa merebut fokus.
 */
export function LiveIndicator({
  count,
  label,
  tone = 'live',
  size = 'sm',
  showDot = true,
  className,
}: LiveIndicatorProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(query.matches);

    const onChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  const isLive = tone === 'live';
  const formatted = formatCount(count);
  const hasCount = formatted !== null;
  const text = label ?? (hasCount ? `${formatted} orang sedang melihat` : TONE_LABELS[tone]);
  const toneStyles = TONE[tone];
  const sizeStyles = SIZE[size];
  const shouldPulse = isLive && !reducedMotion;

  return (
    <span
      role="status"
      aria-live="polite"
      aria-atomic="true"
      data-tone={tone}
      data-reduced-motion={reducedMotion ? 'true' : undefined}
      className={cn(
        'inline-flex select-none items-center rounded-full border px-3 font-semibold uppercase leading-none tracking-[0.08em] transition-colors duration-300 ease-crisp',
        isLive
          ? 'border-status-good/35 bg-status-good/10'
          : 'border-editorial bg-surface-pure',
        toneStyles.text,
        sizeStyles.wrapper,
        className,
      )}
    >
      <span className="sr-only">Indikator siaran:</span>

      {showDot ? (
        <span
          aria-hidden="true"
          className="relative flex shrink-0 items-center justify-center"
        >
          {shouldPulse ? (
            <span
              className={cn(
                'absolute rounded-full animate-pulse-ring',
                sizeStyles.ring,
                toneStyles.ring,
              )}
            />
          ) : null}
          <span
            className={cn(
              'relative rounded-full ring-1 ring-inset',
              sizeStyles.dot,
              toneStyles.dot,
            )}
          />
        </span>
      ) : null}

      <span className="truncate">{text}</span>

      {!isLive ? <span className="sr-only">— siaran tidak aktif</span> : null}
    </span>
  );
}

export default LiveIndicator;
