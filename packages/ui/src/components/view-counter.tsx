import type { ComponentPropsWithoutRef } from 'react';
import { cn } from '../lib/cn';

/**
 * Locale tetap `id-ID` — seluruh angka memakai pemisah ribuan gaya Indonesia
 * (1.248), bukan koma gaya Inggris (1,248), di kedua merek.
 */
const NUMBER_FORMAT_LOCALE = 'id-ID';

/** Batas aman panjang teks agar tata letak tidak pecah oleh data yang korup. */
const MAX_READ_MINUTES = 600;
const MAX_LIVE_VIEWERS = 1_000_000;

/**
 * Pemformat dibuat sekali per modul. `Intl.NumberFormat` mahal untuk dikonstruksi,
 * dan modul ini boleh dipakai lintas request di server maupun di klien.
 */
const numberFormatter = new Intl.NumberFormat(NUMBER_FORMAT_LOCALE, {
  maximumFractionDigits: 0,
});

/**
 * Ubah input apa pun menjadi bilangan bulat non-negatif yang aman dicetak.
 * Menangani NaN, Infinity, angka negatif, desimal, dan nilai non-angka yang lolos
 * dari data CMS/JSON (mis. `views: null` yang dikirim sebagai string kosong).
 */
function toSafeCount(value: number | undefined | null, max = Number.MAX_SAFE_INTEGER): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  const rounded = Math.trunc(value);
  if (rounded <= 0) return 0;
  return rounded > max ? max : rounded;
}

/** Format aman: apa pun yang gagal tetap menghasilkan string angka, bukan melempar. */
function formatCount(value: number | undefined | null, max?: number): string {
  const safe = toSafeCount(value, max);
  try {
    return numberFormatter.format(safe);
  } catch {
    return String(safe);
  }
}

export interface ViewCounterProps extends Omit<ComponentPropsWithoutRef<'div'>, 'children'> {
  /** Jumlah total pembaca artikel. Nilai tidak valid dianggap 0. */
  views: number;
  /** Pembaca yang sedang aktif saat ini. Dirender hanya bila lebih besar dari 0. */
  liveViewers?: number;
  /** Estimasi waktu baca dalam menit. Dirender hanya bila lebih besar dari 0. */
  readMinutes?: number;
  /**
   * Varian visual. `inline` untuk di dalam baris meta artikel,
   * `standalone` untuk blok ringkasan di akhir artikel.
   * Default `inline`.
   */
  variant?: 'inline' | 'standalone';
  /**
   * Sembunyikan teks "kali dibaca" dan sisakan angka + ikon mata.
   * Dipakai pada kartu artikel yang sempit.
   */
  compact?: boolean;
  /** Sembunyikan seluruh blok dari pembaca layar, mis. bila sudah diumumkan judul. */
  decorative?: boolean;
  /** Kelas tambahan pada pembungkus, digabung secara tailwind-merge. */
  className?: string;
}

/**
 * Ikon mata — inline SVG supaya tidak ada biaya runtime ikon di paket ini,
 * dan `currentColor` membuatnya otomatis mengikuti tema aktif.
 */
function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      focusable="false"
    >
      <path d="M2.25 12S5.75 5.5 12 5.5 21.75 12 21.75 12 18.25 18.5 12 18.5 2.25 12 2.25 12Z" />
      <circle cx="12" cy="12" r="3.25" />
    </svg>
  );
}

/** Ikon jam — pasangan ritmis untuk ikon mata pada informasi waktu baca. */
function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      focusable="false"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.25V12l3.25 2" />
    </svg>
  );
}

/**
 * Penghitung tampilan artikel dalam satu baris ringkas.
 *
 * Server-compatible: tanpa hook, state, efek, atau event handler, sehingga dapat
 * dirender di Server Component Next.js tanpa `'use client'` dan tanpa risiko
 * hidrasi yang berbeda antara server dan klien.
 *
 * Warna memakai token `brand.*` / `status-good` yang berbasis CSS variable,
 * jadi satu komponen melayani Jagatirta (`.theme-jagatirta`, teal/navy) maupun
 * ZAMROED Bergerak (`.theme-zamroed`, emerald/gold) tanpa cabang tema.
 *
 * Aksesibilitas:
 * - Seluruh baris dibungkus satu `<p>` dengan `aria-label` tunggal yang utuh,
 *   lalu tiap fragmen visual diberi `aria-hidden`, sehingga pembaca layar
 *   mengumumkan "1.248 kali dibaca, 4 menit baca, 37 orang sedang membaca"
 *   sekali saja — bukan angka, titik, dan label yang terpisah-pisah.
 * - Target sentuh 48px hanya berlaku untuk elemen yang benar-benar dapat diketuk.
 *   Komponen ini tidak memiliki kontrol interaktif, jadi tidak ada target yang
 *   dipaksa membesar; komponen ini murni teks statis.
 */
export function ViewCounter({
  views,
  liveViewers,
  readMinutes,
  variant = 'inline',
  compact = false,
  decorative = false,
  className,
  ...rest
}: ViewCounterProps) {
  const viewText = formatCount(views);

  // Tiap nilai opsional dihitung hanya bila benar-benar ditampilkan, sehingga
  // nilai 0 / negatif / tidak valid (NaN) menghasilkan ketiadaan fragmen —
  // bukan "0 menit baca" atau "0 orang sedang membaca" yang menyesatkan.
  const minuteValue = toSafeCount(readMinutes, MAX_READ_MINUTES);
  const hasMinutes = minuteValue > 0;
  const minuteText = hasMinutes ? formatCount(minuteValue) : '';

  const liveValue = toSafeCount(liveViewers, MAX_LIVE_VIEWERS);
  const hasLive = liveValue > 0;
  const liveText = hasLive ? formatCount(liveValue) : '';

  // Satu label utuh untuk pembaca layar — urutan baca sama dengan urutan visual.
  const spokenLabel = [
    `${viewText} kali dibaca`,
    hasMinutes ? `${minuteText} menit baca` : null,
    hasLive ? `${liveText} orang sedang membaca` : null,
  ]
    .filter((part): part is string => part !== null)
    .join(', ');

  const isStandalone = variant === 'standalone';

  return (
    <div
      data-slot="view-counter"
      className={cn(
        'flex flex-wrap items-center gap-x-2.5 gap-y-1.5',
        isStandalone
          ? 'rounded-xl border border-editorial bg-surface-pure px-4 py-3 sm:px-5'
          : 'text-ink-secondary',
        className,
      )}
      {...rest}
    >
      <p
        // `aria-label` menggantikan pembacaan fragmen; isi visualnya di-hide.
        aria-label={decorative ? undefined : spokenLabel}
        aria-hidden={decorative || undefined}
        className={cn(
          'flex flex-wrap items-center gap-x-2.5 gap-y-1.5 leading-snug',
          isStandalone ? 'text-sm' : 'text-[0.8125rem]',
        )}
      >
        {/* --- Jumlah dibaca --- */}
        <span className="inline-flex min-w-0 items-center gap-1.5">
          <EyeIcon
            className={cn(
              'shrink-0 text-brand-primary',
              isStandalone ? 'h-[18px] w-[18px]' : 'h-4 w-4',
            )}
          />
          <span className="font-display font-bold tabular-nums tracking-tight text-ink">
            {viewText}
          </span>
          {compact ? null : (
            <span className="text-ink-secondary">kali dibaca</span>
          )}
        </span>

        {/* --- Waktu baca --- */}
        {hasMinutes ? (
          <>
            <Separator />
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <ClockIcon className="h-3.5 w-3.5 shrink-0 text-ink-secondary" />
              <span className="font-medium tabular-nums text-ink-secondary">{minuteText}</span>
              <span className="text-ink-secondary">menit baca</span>
            </span>
          </>
        ) : null}

        {/* --- Pembaca aktif --- */}
        {hasLive ? (
          <>
            <Separator />
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
              <span className="relative flex h-2 w-2 shrink-0" aria-hidden="true">
                {/* Cincin berdenyut — sinyal "sedang berlangsung", mati saat reduced-motion. */}
                <span className="absolute inline-flex h-full w-full rounded-full bg-status-good/70 animate-pulse-ring motion-reduce:hidden" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-status-good ring-1 ring-inset ring-black/10" />
              </span>
              <span className="font-semibold tabular-nums text-status-good">{liveText}</span>
              <span className="text-ink-secondary">orang sedang membaca</span>
            </span>
          </>
        ) : null}
      </p>
    </div>
  );
}

/** Pemisah titik editorial; di-hide dari pembaca layar oleh induknya. */
function Separator() {
  return (
    <span aria-hidden="true" className="select-none text-editorial">
      •
    </span>
  );
}

export default ViewCounter;
