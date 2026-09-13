import type { ReactNode } from 'react';

import { cn } from '../lib/cn';
import type { RiverStatus } from '../types';

/** Label Indonesia untuk tiap status mutu air. */
const STATUS_LABEL: Record<RiverStatus, string> = {
  good: 'Baik',
  warning: 'Waspada',
  critical: 'Kritis',
};

/** Satu sumber warna untuk isi bar — token `status.*` saat status tersedia. */
const STATUS_FILL: Record<RiverStatus, string> = {
  good: 'bg-status-good',
  warning: 'bg-status-warning',
  critical: 'bg-status-critical',
};

/** Warna garis luar baris sesuai status; default memakai token brand. */
const STATUS_RING: Record<RiverStatus, string> = {
  good: 'border-status-good/35',
  warning: 'border-status-warning/40',
  critical: 'border-status-critical/40',
};

/** Format angka: locale Indonesia, maksimal 2 desimal, tanpa desimal palsu. */
function formatNumber(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: 2,
  }).format(value);
}

/** Nilai akhir yang dipakai untuk tata letak & pembaca layar. */
function safeValue(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

/** Batas atas harus benar-benar di atas batas bawah agar tidak terjadi bagi nol. */
function safeMax(max: number, min: number): number {
  if (!Number.isFinite(max)) return Number.isFinite(min) ? min : 0;
  if (!Number.isFinite(min)) return max;
  return max > min ? max : min + Number.EPSILON;
}

/** Posisi 0–100 (%). Terjaga dari NaN, Infinity, dan rentang terbalik. */
function toPercent(value: number, min: number, max: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max)) return 0;
  const span = max - min;
  if (!Number.isFinite(span) || span <= 0) return 0;
  const ratio = (value - min) / span;
  if (!Number.isFinite(ratio)) return 0;
  return Math.min(100, Math.max(0, ratio * 100));
}

export interface MetricBarProps {
  /** Nama parameter, mis. "Oksigen Terlarut (DO)". */
  label: string;
  /** Nilai terukur. Nilai non-finite (NaN/Infinity) ditampilkan sebagai 0%. */
  value: number;
  /** Batas bawah skala. */
  min: number;
  /** Batas atas skala. Harus lebih besar dari `min`; jika tidak, rentang dirapikan. */
  max: number;
  /** Satuan, mis. "mg/L" atau "NTU". Ditampilkan bersama nilai. */
  unit?: string;
  /** Zona aman [bawah, atas] yang diarsir hijau di atas track. */
  safeRange?: [number, number];
  /** Status mutu air; bila diisi, isi bar memakai token `status.*`. */
  status?: RiverStatus;
  /** Keterangan pendamping, mis. ambang baku mutu. */
  hint?: ReactNode;
  /** Sembunyikan label & baris nilai — berguna di dalam kartu yang sudah berjudul. */
  hideHeader?: boolean;
  className?: string;
}

/**
 * Bar parameter kualitas air sungai.
 *
 * Menampilkan label, nilai monospace + satuan, track terisi, dan opsional zona
 * aman hijau. Warna isi mengikuti token `status.*` bila `status` diisi, jika
 * tidak memakai `brand.primary` — sehingga satu komponen melayani tema
 * Jagatirta (teal/navy) maupun ZAMROED Bergerak (emerald/gold).
 *
 * Server-compatible: tanpa hook, state, maupun event handler.
 * Nilai dibacakan sebagai `role="meter"` dengan aria-valuenow/valuemin/valuemax/valuetext.
 */
export function MetricBar({
  label,
  value,
  min,
  max,
  unit,
  safeRange,
  status,
  hint,
  hideHeader = false,
  className,
}: MetricBarProps) {
  const finalValue = safeValue(value);
  const safeMin = Number.isFinite(min) ? min : 0;
  const safeTop = safeMax(max, safeMin);

  const valuePercent = toPercent(finalValue, safeMin, safeTop);

  const safeLow = safeRange ? Math.min(safeRange[0], safeRange[1]) : null;
  const safeHigh = safeRange ? Math.max(safeRange[0], safeRange[1]) : null;

  const hasSafeZone =
    safeLow !== null &&
    safeHigh !== null &&
    Number.isFinite(safeLow) &&
    Number.isFinite(safeHigh) &&
    safeHigh > safeLow;

  const zoneLeft = hasSafeZone ? toPercent(safeLow as number, safeMin, safeTop) : 0;
  const zoneRight = hasSafeZone ? toPercent(safeHigh as number, safeMin, safeTop) : 0;
  const zoneWidth = Math.max(0, zoneRight - zoneLeft);

  const safeZoneLabel = hasSafeZone
    ? [
        safeLow as number,
        safeHigh as number,
      ]
        .map((bound) => formatNumber(bound))
        .join('–')
    : null;

  const fillTone = status ? STATUS_FILL[status] : 'bg-brand-primary';

  const readout = `${formatNumber(finalValue)}${unit ? ` ${unit}` : ''}`;
  const statusLabel = status ? STATUS_LABEL[status] : null;
  const ariaValueText = [
    `${label}: ${readout}`,
    statusLabel ? `status ${statusLabel}` : null,
    hasSafeZone && safeZoneLabel ? `rentang aman ${safeZoneLabel}${unit ? ` ${unit}` : ''}` : null,
  ]
    .filter((part): part is string => Boolean(part))
    .join(', ');

  return (
    <div className={cn('flex min-w-0 flex-col gap-2.5', className)}>
      {hideHeader ? null : (
        <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
          <span className="min-w-0 text-[13px] font-semibold uppercase leading-tight tracking-[0.08em] text-ink-secondary">
            {label}
          </span>

          <span className="flex shrink-0 items-baseline gap-1.5">
            <span className="font-mono text-base font-semibold leading-none tabular-nums text-ink">
              {formatNumber(finalValue)}
            </span>
            {unit ? (
              <span className="font-mono text-[11px] font-medium leading-none text-ink-secondary">
                {unit}
              </span>
            ) : null}
          </span>
        </div>
      )}

      <span className="sr-only">
        {label}: {readout}
        {statusLabel ? `, status ${statusLabel}` : ''}
        {hasSafeZone && safeZoneLabel
          ? `, rentang aman ${safeZoneLabel}${unit ? ` ${unit}` : ''}`
          : ''}
      </span>

      <div
        role="meter"
        aria-label={label}
        aria-valuenow={finalValue}
        aria-valuemin={safeMin}
        aria-valuemax={safeTop}
        aria-valuetext={ariaValueText}
        className={cn(
          'relative h-3 w-full overflow-hidden rounded-full border bg-canvas',
          'shadow-[inset_0_1px_2px_rgba(17,24,39,0.08)]',
          status ? STATUS_RING[status] : 'border-editorial',
        )}
      >
        {/* Zona aman — diarsir di belakang isi bar agar tetap terbaca. */}
        {hasSafeZone ? (
          <span
            aria-hidden="true"
            className="absolute inset-y-0 z-0 border-x border-status-good/40 bg-status-good/15"
            style={{ left: `${zoneLeft}%`, width: `${zoneWidth}%` }}
          />
        ) : null}

        {/* Garis tengah sebagai rujukan visual saat belum ada zona aman. */}
        {hasSafeZone ? null : (
          <span
            aria-hidden="true"
            className="absolute inset-y-0 left-1/2 z-0 w-px bg-editorial"
          />
        )}

        <span
          aria-hidden="true"
          className={cn(
            'absolute inset-y-0 left-0 z-10 rounded-full',
            'transition-[width] duration-700 ease-crisp motion-reduce:transition-none',
            fillTone,
          )}
          style={{ width: `${valuePercent}%` }}
        />
      </div>

      {/* Pasangan aman/brand dibacakan sebagai skala minimum & maksimum. */}
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-[11px] leading-none text-ink-secondary">
          {formatNumber(safeMin)}
        </span>

        {hint ? (
          <span className="min-w-0 truncate text-center text-[11px] leading-tight text-ink-secondary">
            {hint}
          </span>
        ) : hasSafeZone && safeZoneLabel ? (
          <span className="min-w-0 truncate text-center text-[11px] leading-tight text-ink-secondary">
            Zona aman {safeZoneLabel}
            {unit ? ` ${unit}` : ''}
          </span>
        ) : null}

        <span className="font-mono text-[11px] leading-none text-ink-secondary">
          {formatNumber(safeTop)}
        </span>
      </div>
    </div>
  );
}

export default MetricBar;
