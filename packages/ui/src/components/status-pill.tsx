import { cn } from '../lib/cn';
import type { RiverStatus } from '../types';

/** Label resmi kualitas air — satu sumber kebenaran untuk seluruh brand. */
export const STATUS_LABELS: Record<RiverStatus, string> = {
  good: 'Baik',
  warning: 'Waspada',
  critical: 'Kritis',
};

export interface StatusPillProps {
  /** Status mutu air sungai. */
  status: RiverStatus;
  /** Ganti label bawaan (Baik/Waspada/Kritis) bila konteks membutuhkannya. */
  label?: string;
  /** Informasi pendamping, mis. "IKA 42" atau "DO 3,1 mg/L". */
  detail?: string;
  /** 'sm' untuk kartu & tabel, 'md' untuk header detail sungai. */
  size?: 'sm' | 'md';
  className?: string;
}

const TONE: Record<RiverStatus, { pill: string; dot: string; ring: string }> = {
  good: {
    pill: 'border-status-good/40 bg-status-good/10',
    dot: 'bg-status-good',
    ring: 'bg-status-good/70',
  },
  warning: {
    pill: 'border-status-warning/45 bg-status-warning/12',
    dot: 'bg-status-warning',
    ring: 'bg-status-warning/70',
  },
  critical: {
    pill: 'border-status-critical/50 bg-status-critical/12',
    dot: 'bg-status-critical',
    ring: 'bg-status-critical/60',
  },
};

const SIZE = {
  sm: 'h-6 gap-1.5 px-2.5 text-[11px]',
  md: 'h-8 gap-2 px-3.5 text-xs',
} as const;

/**
 * Pil status mutu air sungai — netral brand, dipakai Jagatirta & ZAMROED Bergerak.
 * Status `critical` menambahkan cincin berdenyut sebagai penanda urgensi.
 */
export function StatusPill({
  status,
  label,
  detail,
  size = 'sm',
  className,
}: StatusPillProps) {
  const tone = TONE[status];
  const text = label ?? STATUS_LABELS[status];

  return (
    <span
      data-status={status}
      className={cn(
        'inline-flex select-none items-center rounded-full border font-semibold uppercase leading-none tracking-[0.08em] text-ink transition-colors duration-300 ease-crisp',
        tone.pill,
        SIZE[size],
        className,
      )}
    >
      <span className="sr-only">Status mutu air sungai:</span>

      <span
        aria-hidden="true"
        className="relative flex h-2 w-2 shrink-0 items-center justify-center"
      >
        {status === 'critical' ? (
          <span
            className={cn('absolute h-2 w-2 rounded-full', tone.ring, 'animate-pulse-ring')}
          />
        ) : null}
        <span
          className={cn(
            'relative h-2 w-2 rounded-full ring-1 ring-inset ring-black/10',
            tone.dot,
          )}
        />
      </span>

      <span>{text}</span>

      {detail ? (
        <>
          <span aria-hidden="true" className={cn('h-2.5 w-px', tone.dot, 'opacity-40')} />
          <span className="font-medium tracking-normal">{detail}</span>
        </>
      ) : null}

      {status === 'critical' ? (
        <span className="sr-only">— perlu tindakan segera</span>
      ) : null}
    </span>
  );
}

export default StatusPill;
