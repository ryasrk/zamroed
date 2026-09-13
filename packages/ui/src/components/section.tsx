import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { cn } from '../lib/cn';
import { Reveal } from './reveal';

export type SectionAlign = 'left' | 'center';
export type SectionTone = 'light' | 'dark';

/**
 * Tingkat kepadatan vertikal. Sebelumnya tiap halaman menuliskan padding
 * sendiri, sehingga muncul enam nilai berbeda tanpa alasan yang jelas.
 * Memusatkannya di tiga tingkat membuat ritme halaman terbaca.
 */
export type SectionDensity = 'compact' | 'normal' | 'loose';

const DENSITY_PAD: Record<SectionDensity, string> = {
  compact: 'py-section-compact',
  normal: 'py-section-normal',
  loose: 'py-section-loose',
};

/** Jarak header section ke isinya, mengikuti kepadatan yang sama. */
const DENSITY_GAP: Record<SectionDensity, string> = {
  compact: 'mt-7 md:mt-9',
  normal: 'mt-9 md:mt-12',
  loose: 'mt-12 md:mt-16',
};

export interface SectionProps extends ComponentPropsWithoutRef<'section'> {
  /** Judul utama bagian — dirender sebagai <h2> dengan utilitas .text-section. */
  title?: string;
  /** Label kecil berwarna brand di atas judul, mis. "Program Kami". */
  eyebrow?: string;
  /** Paragraf pengantar di bawah judul, dibatasi measure-editorial. */
  description?: string;
  /** Perataan horizontal header bagian. Default: 'left'. */
  align?: SectionAlign;
  /** Nada latar: 'light' = canvas hangat, 'dark' = biru/ hijau dalam brand. */
  tone?: SectionTone;
  /** Kepadatan ruang vertikal. Default 'normal'. */
  density?: SectionDensity;
  /** Anchor untuk navigasi lompat (#id). */
  id?: string;
  className?: string;
  children?: ReactNode;
}

/**
 * Section — pembungkus layout bersama untuk Jagatirta & ZAMROED Bergerak.
 *
 * Server-compatible (tanpa hooks), semantic `<section>`, dan seluruh warna
 * diambil dari token `brand.*` sehingga satu komponen melayani dua tema.
 */
export function Section({
  title,
  eyebrow,
  description,
  align = 'left',
  tone = 'light',
  density = 'normal',
  id,
  className,
  children,
  ...rest
}: SectionProps) {
  const isDark = tone === 'dark';
  const isCenter = align === 'center';
  const hasHeader = Boolean(eyebrow || title || description);
  const headingId = id && title ? `${id}-judul` : undefined;

  return (
    <section
      id={id}
      aria-labelledby={hasHeader ? headingId : undefined}
      className={cn(
        'relative isolate scroll-mt-20 overflow-hidden px-5 sm:px-8',
        DENSITY_PAD[density],
        isDark ? 'bg-brand-deep text-white' : 'bg-canvas text-ink',
        className,
      )}
      {...rest}
    >
      {isDark ? (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 -z-10 h-72 w-72 rounded-full bg-brand-primary opacity-20 blur-3xl"
        />
      ) : null}

      <div className="mx-auto max-w-7xl">
        {hasHeader ? (
          <Reveal
            className={cn(
              isCenter ? 'flex flex-col items-center text-center' : 'flex flex-col items-start',
            )}
          >
            {eyebrow ? (
              <p
                className={cn(
                  'flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em]',
                  isDark ? 'text-brand-accent' : 'text-brand-primary',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'h-px w-8 shrink-0',
                    isDark ? 'bg-brand-accent opacity-70' : 'bg-brand-primary opacity-60',
                  )}
                />
                {eyebrow}
              </p>
            ) : null}

            {title ? (
              <h2
                id={headingId}
                className={cn(
                  'text-section font-display font-bold',
                  isDark ? 'text-white' : 'text-ink',
                  eyebrow ? 'mt-4' : undefined,
                )}
              >
                {title}
              </h2>
            ) : null}

            {description ? (
              <p
                className={cn(
                  'measure-editorial mt-4 text-base leading-relaxed',
                  isDark ? 'text-white opacity-80' : 'text-ink-secondary',
                  isCenter ? 'mx-auto' : undefined,
                )}
              >
                {description}
              </p>
            ) : null}
          </Reveal>
        ) : null}

        {children ? (
          <div className={cn(hasHeader ? DENSITY_GAP[density] : undefined)}>
            {children}
          </div>
        ) : null}
      </div>
    </section>
  );
}
