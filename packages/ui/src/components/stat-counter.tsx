'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { cn } from '../lib/cn';

export interface StatCounterProps {
  /** Nilai akhir yang akan dihitung — diformat dengan `Intl.NumberFormat('id-ID')`. */
  value: number;
  /** Nama statistik, mis. "Relawan Aktif" atau "Sungai Terpantau". */
  label: string;
  /** Teks di belakang angka, mis. "ha", "%", "kg". */
  suffix?: string;
  /** Teks di depan angka, mis. "Rp". */
  prefix?: string;
  /** Durasi hitung-naik dalam milidetik. Default 1800. */
  duration?: number;
  className?: string;
}

/** Durasi default hitung-naik (ms). */
const DEFAULT_DURATION = 1800;

/** easeOutExpo — melaju cepat lalu mendarat dengan halus. */
function easeOutExpo(t: number): number {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

/** Jumlah desimal yang dipertahankan agar nilai desimal tidak dibulatkan hilang. */
function countDecimals(value: number): number {
  if (Number.isInteger(value)) return 0;
  const fraction = value.toString().split('.')[1] ?? '';
  return Math.min(2, fraction.length);
}

/**
 * `useLayoutEffect` di server tidak melakukan apa-apa dan React akan memperingatkan,
 * jadi pakai `useEffect` saat tidak ada DOM.
 */
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/**
 * Statistik besar yang berhitung naik saat masuk ke viewport.
 * Warna selalu mengikuti token `brand.*` agar satu komponen dipakai
 * Jagatirta (tema `theme-jagatirta`) dan ZAMROED Bergerak (tema `theme-zamroed`).
 */
export function StatCounter({
  value,
  label,
  suffix,
  prefix,
  duration = DEFAULT_DURATION,
  className,
}: StatCounterProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [display, setDisplay] = useState(value);
  const [inView, setInView] = useState(false);
  const [reducedMotion, setReducedMotion] = useState<boolean>(() =>
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );

  const decimals = useMemo(() => countDecimals(value), [value]);
  const formatter = useMemo(
    () =>
      new Intl.NumberFormat('id-ID', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      }),
    [decimals],
  );

  const finalText = formatter.format(value);

  // Dengarkan perubahan preferensi gerak (bisa berubah di tengah sesi).
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    setReducedMotion(query.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, []);

  useIsomorphicLayoutEffect(() => {
    const node = rootRef.current;
    if (!node) return;

    // Hormati prefers-reduced-motion: tampilkan nilai akhir tanpa animasi.
    if (reducedMotion || duration <= 0) {
      setDisplay(value);
      return;
    }

    if (typeof IntersectionObserver === 'undefined' || typeof requestAnimationFrame === 'undefined') {
      setDisplay(value);
      return;
    }

    setDisplay(0);

    let frame = 0;
    let startedAt: number | null = null;

    const step = (now: number) => {
      if (startedAt === null) startedAt = now;
      const progress = Math.min(1, (now - startedAt) / duration);
      if (progress >= 1) {
        setDisplay(value);
        return;
      }
      setDisplay(value * easeOutExpo(progress));
      frame = requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.disconnect();
          setInView(true);
          frame = requestAnimationFrame(step);
        }
      },
      { threshold: 0.4, rootMargin: '0px 0px -10% 0px' },
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [duration, reducedMotion, value]);

  return (
    <div ref={rootRef} className={cn('flex min-w-0 flex-col gap-3 py-2', className)}>
      {/* Nilai akhir untuk pembaca layar; angka yang beranimasi disembunyikan. */}
      <span className="sr-only">{`${prefix ?? ''}${finalText}${suffix ? ` ${suffix}` : ''}`}</span>

      <span
        aria-hidden="true"
        className={cn(
          'block h-[3px] w-14 origin-left rounded-full bg-brand-accent',
          'transition-transform duration-700 ease-crisp motion-reduce:transition-none',
          inView ? 'scale-x-100' : 'scale-x-0',
        )}
      />

      <p
        aria-hidden="true"
        className="flex flex-wrap items-baseline gap-x-1.5 font-display text-display font-bold leading-none tracking-tight text-brand-primary"
      >
        {prefix ? (
          <span className="text-[0.42em] font-semibold tracking-normal text-brand-accent">
            {prefix}
          </span>
        ) : null}

        {/* Baris hantu menahan lebar akhir agar angka tidak menggeser tata letak. */}
        <span className="inline-grid justify-items-start">
          <span className="col-start-1 row-start-1 invisible tabular-nums">{finalText}</span>
          <span className="col-start-1 row-start-1 tabular-nums">
            {formatter.format(display)}
          </span>
        </span>

        {suffix ? (
          <span className="text-[0.42em] font-semibold tracking-normal text-brand-accent">
            {suffix}
          </span>
        ) : null}
      </p>

      <p className="text-sm font-semibold leading-snug text-ink-secondary sm:text-base">
        {label}
      </p>
    </div>
  );
}
