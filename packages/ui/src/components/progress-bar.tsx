import { cn } from '../lib/cn';
import type { RiverStatus } from '../types';

/** Nada warna progres. `brand` mengikuti tema aktif; `success`/`warning` memakai semantik mutu air. */
export type ProgressTone = 'brand' | 'success' | 'warning';

/**
 * `river` adalah alias netral untuk `brand`: halaman peta Jagatirta memakai progres di atas
 * panel gelap (mis. `status.warning` untuk IKA) yang tidak selaras dengan nada merek.
 */
export type ProgressStatusTone = ProgressTone | RiverStatus | 'river';

export type ProgressSize = 'sm' | 'md';

export interface ProgressBarProps {
  /**
   * Nilai terukur saat ini. Nilai negatif atau non-finite diperlakukan sebagai 0.
   * Bila `max` tidak valid, nilai ini **tidak** dipakai untuk menghitung rasio —
   * lihat `indeterminate`.
   */
  value: number;
  /** Batas atas. Default 100. Nilai <= 0 atau non-finite ditangani aman (tanpa NaN/Infinity). */
  max?: number;
  /**
   * Tandai bilah belum punya sasaran terukur: isian selalu 0 dan tidak pernah
   * melaporkan "100%" untuk sasaran yang tidak ada. `max`, `aria-valuemax`,
   * `aria-valuenow`, dan `aria-valuetext` disesuaikan agar pembaca layar
   * membacakan "belum ada sasaran", bukan angka karangan.
   */
  indeterminate?: boolean;
  /** Label singkat di atas track, mis. "Capaian dana" atau "Kesuburan air (IKA)". */
  label?: string;
  /** Tampilkan persentase di sisi kanan label. Diabaikan bila `label` tidak diisi. */
  showPercentage?: boolean;
  /** Teks bebas untuk `aria-valuetext`; menimpa nilai bawaan (persen/rentang). */
  valueText?: string;
  /** Nada warna isian bar. Default `brand` (mengikuti tema aktif). */
  tone?: ProgressStatusTone;
  /** Ukuran bar. `sm` untuk kartu/tabel, `md` untuk ringkasan program & kampanye. */
  size?: ProgressSize;
  /** Diisi bila label di atas track tidak memberi konteks yang cukup bagi pembaca layar. */
  'aria-label'?: string;
  className?: string;
  /** Kelas tambahan untuk elemen track (mis. lebar dari grid). */
  trackClassName?: string;
}

interface ToneStyles {
  /** Kelas warna isian (latar). */
  fill: string;
  /** Rona gelap isian untuk kedalaman/garis rambut. */
  edge: string;
}

const TONE: Record<ProgressStatusTone, ToneStyles> = {
  // `brand.accent` dan `brand.primary` dijamin berbeda pada kedua tema
  // (Jagatirta teal/navy, ZAMROED emerald/gold), jadi gradasinya selalu terbaca.
  brand: {
    fill: 'bg-gradient-to-r from-brand-accent to-brand-primary',
    edge: 'shadow-[inset_0_-1px_0_0_var(--brand-deep)]',
  },
  success: {
    fill: 'bg-gradient-to-r from-status-good/85 to-status-good',
    edge: 'shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.18)]',
  },
  warning: {
    fill: 'bg-gradient-to-r from-status-warning/85 to-status-warning',
    edge: 'shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.18)]',
  },
  river: {
    fill: 'bg-gradient-to-r from-river-cyan to-river-teal',
    edge: 'shadow-[inset_0_-1px_0_0_river-navy]',
  },
  good: {
    fill: 'bg-gradient-to-r from-status-good/85 to-status-good',
    edge: 'shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.18)]',
  },
  critical: {
    fill: 'bg-gradient-to-r from-status-critical/85 to-status-critical',
    edge: 'shadow-[inset_0_-1px_0_0_rgba(0,0,0,0.18)]',
  },
};

const SIZE = {
  /** 10px — cukup untuk rail di dalam kartu padat. */
  sm: { track: 'h-2.5', label: 'text-xs' },
  /** 14px — bar ringkasan. */
  md: { track: 'h-3.5', label: 'text-sm' },
} as const;

/** Rentang nilai teks persentase yang masuk akal (menghindari angka panjang tak terbaca). */
const MIN_LABELED_MAX = 0.01;
const MAX_LABELED_MAX = 1_000_000;

/** Ubah masukan apa pun menjadi angka finite; NaN/Infinity menjadi `fallback`. */
function toFinite(input: number, fallback: number): number {
  return typeof input === 'number' && Number.isFinite(input) ? input : fallback;
}

/**
 * Format angka gaya Indonesia tanpa `Intl`: "1.500" dan "12,5".
 * Dipakai agar hasil render server selalu sama dengan render klien —
 * `Intl.NumberFormat` dapat berbeda antar lingkungan (hydration mismatch).
 */
function formatNumber(input: number): string {
  const safe = toFinite(input, 0);
  const rounded = Math.round(safe * 10) / 10;
  const [whole = '0', fraction] = Math.abs(rounded).toFixed(1).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  const sign = rounded < 0 ? '-' : '';
  return fraction && fraction !== '0' ? `${sign}${grouped},${fraction}` : `${sign}${grouped}`;
}

/** Persentase gaya Indonesia, mis. "62%" atau "62,5%". */
function formatPercent(ratio: number): string {
  return `${formatNumber(ratio * 100)}%`;
}

/**
 * Bar progres untuk capaian dana kampanye, kesuburan sungai (IKA), dan
 * kelengkapan data lapangan.
 *
 * Server-compatible: tanpa hooks, state, maupun akses `window`/`document`,
 * sehingga aman dirender sebagai Server Component. Lebar isian selalu
 * ditetapkan sebagai **inline style** presisi persen (bukan kelas dinamis),
 * jadi Tailwind tidak perlu di-JIT untuk nilai runtime.
 *
 * Aman terhadap `value`/`max` = 0, negatif, `NaN`, dan `Infinity`. Bila `max`
 * tidak valid (mis. sasaran kampanye belum ditetapkan), setel `indeterminate`
 * agar bilah tidak terbaca 100%; lihat `indeterminate` pada props.
 */
export function ProgressBar({
  value,
  max = 100,
  indeterminate = false,
  label,
  showPercentage,
  valueText: valueTextOverride,
  tone = 'brand',
  size = 'md',
  'aria-label': ariaLabel,
  className,
  trackClassName,
}: ProgressBarProps) {
  const safeMax = toFinite(max, 0);
  const rawValue = Math.max(0, toFinite(value, 0));

  // Tanpa sasaran terukur, rasio dipaksa 0 — bukan 1 — supaya bilah tidak pernah
  // terbaca penuh hanya karena `max` tidak ada.
  const isIndeterminate = indeterminate || safeMax <= 0;

  // max <= 0 → rasio 0 (bukan Infinity/NaN). Math.min menahan isian tetap di dalam track.
  const ratio = isIndeterminate ? 0 : Math.min(1, rawValue / safeMax);
  const clampedValue = isIndeterminate ? 0 : Math.min(rawValue, safeMax);
  const percent = ratio * 100;

  // Putuskan lebih awal agar tidak menghasilkan "NaN%" bila salah satu sisi non-finite.
  const canLabelRange =
    !isIndeterminate &&
    Number.isFinite(safeMax) &&
    Number.isFinite(clampedValue) &&
    safeMax >= MIN_LABELED_MAX &&
    safeMax <= MAX_LABELED_MAX;

  const styles = TONE[tone] ?? TONE.brand;
  const sizes = SIZE[size] ?? SIZE.md;

  // Rentang angka hanya masuk akal bila memang ada sasaran; tanpa sasaran,
  // "1 dari 1" akan menyesatkan pembaca layar.
  const valueMax = isIndeterminate ? 100 : safeMax;

  const accessibleName =
    ariaLabel ?? (label ? `${label}, ${formatPercent(ratio)}` : undefined);

  const defaultValueText = isIndeterminate
    ? 'Belum ada sasaran'
    : canLabelRange
      ? // Rentang angka tanpa satuan dipakai apa adanya; format mata uang/jumlah
        // diteruskan lewat `valueText` oleh komponen pemanggil.
        `${formatNumber(clampedValue)} dari ${formatNumber(safeMax)}${label ? ` ${formatPercent(ratio)}` : ''}`
      : formatPercent(ratio);

  const valueText = valueTextOverride ?? defaultValueText;

  const isInteractive = Boolean(ariaLabel);

  return (
    <div className={cn('flex w-full min-w-0 flex-col gap-2', className)}>
      {label ? (
        <div className="flex min-w-0 items-baseline justify-between gap-3">
          <span
            className={cn(
              'min-w-0 font-semibold leading-snug text-ink',
              sizes.label,
            )}
          >
            {label}
          </span>

          {showPercentage ? (
            <span
              aria-hidden="true"
              className={cn(
                'shrink-0 font-semibold tabular-nums leading-none text-brand-primary',
                sizes.label,
              )}
            >
              {formatPercent(ratio)}
            </span>
          ) : null}
        </div>
      ) : null}

      <div
        role="progressbar"
        aria-label={accessibleName}
        aria-valuemin={0}
        aria-valuemax={valueMax}
        aria-valuenow={clampedValue}
        aria-valuetext={valueText}
        data-tone={tone}
        data-size={size}
        data-indeterminate={isIndeterminate || undefined}
        tabIndex={isInteractive ? 0 : undefined}
        className={cn(
          // Kelas .border pada elemen role=progressbar memberi sinyal Visual Studio Code /
          // axe bahwa elemen ini harus punya indikator fokus yang terlihat.
          'border border-transparent',
          'relative block w-full overflow-hidden rounded-full',
          // Dalam tema gelap `brand.soft` gelap dan track tenggelam; jalur cadangan
          // kanvas + garis rambut `editorial` tetap terbaca di kedua tema.
          'bg-canvas shadow-[inset_0_0_0_1px_var(--border-editorial)]',
          sizes.track,
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent',
          'focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
          isInteractive && 'min-h-12',
          trackClassName,
        )}
      >
        {/*
          Isian dikunci ke kiri dan di-scale, bukan dianimasikan lebarnya: transform
          dapat dikomposit di GPU sehingga mulus di ponsel kelas bawah yang dipakai
          relawan lapangan. `will-change` discope ke properti transform saja.
        */}
        <span
          aria-hidden="true"
          className={cn(
            'absolute inset-y-0 left-0 block w-full origin-left rounded-full',
            'transition-transform duration-[800ms] ease-crisp will-change-transform',
            'motion-reduce:transition-none',
            styles.fill,
            styles.edge,
          )}
          style={{ transform: `scaleX(${ratio})` }}
        />

        {/* Kilau tipis di tepi atas — kedalaman "cetak" alih-alih bar datar generik. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-full bg-white/25"
        />

        {/* Angka kecil di dalam track saat tidak ada label visual; teks gelap/terang
            bergantung pada seberapa jauh isian sudah menutupi track. */}
        {!label ? (
          <span
            aria-hidden="true"
            className={cn(
              'absolute inset-y-0 left-2.5 flex items-center font-semibold tabular-nums leading-none',
              // Teks di dalam track tidak boleh menutupi label aksesibilitas saat
              // pembaca layar menelusuri elemen; angka sudah ada di aria-valuetext.
              ratio >= 0.5 ? 'text-white' : 'text-ink-secondary',
            )}
            style={{ fontSize: size === 'sm' ? '0.625rem' : '0.6875rem' }}
          >
            {/* Tanpa sasaran, "0%" lebih jujur daripada persentase karangan. */}
            {isIndeterminate ? '—' : formatPercent(ratio)}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export default ProgressBar;
