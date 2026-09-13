import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { cn } from '../lib/cn';
import type { RiverStatus } from '../types';

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

/**
 * Latar dan teks memakai token bersama (brand.*, status.*) sehingga satu komponen
 * melayani tema Jagatirta (teal/navy) maupun ZAMROED Bergerak (emerald/gold).
 */
const TONE_STYLES: Record<BadgeTone, string> = {
  neutral: 'bg-canvas text-ink-secondary ring-1 ring-inset ring-editorial',
  primary:
    'bg-brand-soft text-brand-deep ring-1 ring-inset ring-[var(--brand-primary)]',
  success: 'bg-status-good/10 text-ink ring-1 ring-inset ring-status-good/30',
  warning: 'bg-status-warning/15 text-ink ring-1 ring-inset ring-status-warning/40',
  danger: 'bg-status-critical/10 text-ink ring-1 ring-inset ring-status-critical/30',
};

/** Warna titik penanda — dibaca sebagai warna semantik, bukan hiasan semata. */
const DOT_STYLES: Record<BadgeTone, string> = {
  neutral: 'bg-ink-secondary',
  primary: 'bg-brand-primary',
  success: 'bg-status-good',
  warning: 'bg-status-warning',
  danger: 'bg-status-critical',
};

export interface BadgeProps extends ComponentPropsWithoutRef<'span'> {
  /** Nada warna badge. Default `neutral`. */
  tone?: BadgeTone;
  /** Tampilkan titik penanda di sisi kiri. */
  dot?: boolean;
  /** Denyut pada titik penanda untuk status yang butuh perhatian segera. */
  pulse?: boolean;
  /** Ikon inline SVG (jangan impor library ikon di paket ini). */
  icon?: ReactNode;
  /** Bila diisi, badge dirender sebagai tautan yang dapat difokuskan. */
  href?: string;
  children?: ReactNode;
}

/**
 * Pill ringkas untuk label, status, dan kategori.
 * Server-compatible: tanpa hook, state, maupun event handler.
 */
export function Badge({
  tone = 'neutral',
  dot = false,
  pulse = false,
  icon,
  href,
  className,
  children,
  ...rest
}: BadgeProps) {
  const shell = cn(
    'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1',
    'text-[11px] font-semibold uppercase leading-none tracking-wide',
    'transition-colors duration-200 ease-crisp',
    TONE_STYLES[tone],
    href &&
      'min-h-[48px] px-3.5 no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-primary',
    className,
  );

  const content = (
    <>
      {dot ? (
        <span className="relative flex h-1.5 w-1.5 shrink-0" aria-hidden="true">
          {pulse ? (
            <span
              className={cn(
                'absolute inline-flex h-full w-full rounded-full animate-pulse-ring',
                DOT_STYLES[tone],
              )}
            />
          ) : null}
          <span className={cn('relative inline-flex h-1.5 w-1.5 rounded-full', DOT_STYLES[tone])} />
        </span>
      ) : null}
      {icon ? (
        <span
          className="flex shrink-0 items-center [&_svg]:block [&_svg]:h-3 [&_svg]:w-3"
          aria-hidden="true"
        >
          {icon}
        </span>
      ) : null}
      <span className="truncate">{children}</span>
    </>
  );

  if (href) {
    return (
      <a href={href} className={shell} {...(rest as ComponentPropsWithoutRef<'a'>)}>
        {content}
      </a>
    );
  }

  return (
    <span className={shell} {...rest}>
      {content}
    </span>
  );
}

const RIVER_STATUS_META: Record<RiverStatus, { tone: BadgeTone; label: string }> = {
  good: { tone: 'success', label: 'Sehat' },
  warning: { tone: 'warning', label: 'Waspada' },
  critical: { tone: 'danger', label: 'Kritis' },
};

export interface RiverStatusBadgeProps extends Omit<BadgeProps, 'tone' | 'dot' | 'children'> {
  /** Status mutu air dari data sungai. */
  status: RiverStatus;
  /** Teks pengganti label bawaan, mis. "IKA 78 — Sehat". */
  label?: string;
}

/** Badge status mutu air: Sehat / Waspada / Kritis. */
export function RiverStatusBadge({
  status,
  label,
  pulse,
  className,
  ...rest
}: RiverStatusBadgeProps) {
  const meta = RIVER_STATUS_META[status];

  return (
    <Badge
      tone={meta.tone}
      dot
      pulse={pulse ?? status === 'critical'}
      className={className}
      {...rest}
    >
      {label ?? meta.label}
    </Badge>
  );
}
