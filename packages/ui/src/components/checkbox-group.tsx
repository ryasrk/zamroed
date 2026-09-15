'use client';

import { useId } from 'react';
import type { ChangeEvent, ReactNode } from 'react';

import { cn } from '../lib/cn';

/* -------------------------------------------------------------------------- */
/*  Kontrak gaya bersama                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Semua warna dibaca dari token `brand.*` (CSS variable yang di-rebind oleh
 * `.theme-jagatirta` dan `.theme-zamroed`). Tidak ada satu pun hex yang dikunci,
 * sehingga satu komponen melayani kedua merek: teal/navy di Jagatirta, lalu
 * otomatis emerald/gold di ZAMROED Bergerak.
 */

/**
 * Kartu adalah target sentuh utamanya. `min-h-12` (48px) bukan preferensi
 * estetis — relawan lapangan memilih divisi dengan satu tangan di ponsel dan
 * target di bawah 48px memicu salah ketuk. `p-4` menambah bidang ketuk, bukan
 * hanya menambah tinggi visual.
 */
const CARD_BASE = [
  'group/option relative flex min-h-12 w-full cursor-pointer items-start gap-3.5 rounded-2xl border-2 p-4 text-left',
  'transition-[border-color,background-color,box-shadow,transform] duration-200 ease-crisp',
  // Tanpa hover di perangkat sentuh, jadi fokus keyboard harus sama terlihatnya.
  'focus-within:outline-none focus-within:ring-2 focus-within:ring-brand-primary/40 focus-within:ring-offset-2 focus-within:ring-offset-canvas',
  'motion-safe:active:scale-[0.99]',
].join(' ');

/** Kartu terpilih: border merek + latar `brand.soft` — kontras tinggi di kedua tema. */
const CARD_SELECTED = 'border-brand-primary bg-brand-soft';

/** Kartu diam: garis editorial dengan hover tipis ke arah merek. */
const CARD_IDLE = 'border-editorial bg-surface-pure hover:border-brand-primary/55 hover:bg-brand-soft/35';

/**
 * Kartu yang tidak dapat dipilih karena `max` sudah tercapai. Tetap menerima
 * klik agar pengguna dapat MENYALIN pilihan (deselect), jadi bukan `disabled`.
 */
const CARD_LOCKED = 'border-editorial/70 bg-surface-pure/60 opacity-60';

/** Cincin kotak centang — 22px, di bawah ambang 48px karena label-nya yang besar. */
const BOX_BASE =
  'mt-0.5 flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px] border-2 transition-colors duration-200 ease-crisp';

export interface CheckboxGroupOption {
  /** Nilai yang dikirim ke `onChange`. Harus unik di dalam `options`. */
  value: string;
  /** Label utama — nama divisi, mis. "Pemantauan Kualitas Air". */
  label: string;
  /** Penjelasan singkat di bawah label, mis. "Uji DO & pH tiap dua pekan". */
  description?: string;
}

export interface CheckboxGroupProps {
  /** Judul grup. Dirender sebagai `<legend>` di dalam `<fieldset>`. */
  legend: string;
  /** Daftar pilihan. Kosong berarti grup tetap dirender dengan catatan kosong. */
  options: readonly CheckboxGroupOption[];
  /** Nilai terpilih. Nilai yang tidak ada di `options` diabaikan saat render. */
  value: readonly string[];
  /** Mengembalikan daftar nilai berikutnya — selalu array baru, tidak pernah `undefined`. */
  onChange: (next: string[]) => void;
  /**
   * Batas jumlah pilihan. `0`, negatif, atau `NaN` berarti tanpa batas. Saat
   * batas tercapai, pilihan yang belum tercentang dikunci namun yang sudah
   * tercentang tetap dapat dilepas.
   */
  max?: number;
  /** Pesan galat. Mengubah border grup ke `status.critical` dan menandai `aria-invalid`. */
  error?: string;
  /** Petunjuk pengisian. Disembunyikan dari pembaca layar saat `error` aktif. */
  hint?: string;
  /** Menyembunyikan legend secara visual, tetap terbaca pembaca layar. */
  hideLegend?: boolean;
  /** Menandai grup sebagai wajib diisi (satu pilihan minimal). */
  required?: boolean;
  /** Menonaktifkan seluruh pilihan. */
  disabled?: boolean;
  /** Kontainer terluar. */
  className?: string;
  /** Kelas tambahan untuk setiap kartu pilihan. */
  optionClassName?: string;
  /** Catatan tambahan di bawah legend, mis. "Pilih maksimal dua divisi". */
  description?: ReactNode;
}

/* -------------------------------------------------------------------------- */
/*  Ikon                                                                       */
/* -------------------------------------------------------------------------- */

/** Centang inline: tidak menambah permintaan aset dan ikut warna teks kartu. */
function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 16 16"
      fill="none"
      className="h-3.5 w-3.5"
      stroke="currentColor"
      strokeWidth={2.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 8.4 6.2 11.6 13 4.8" />
    </svg>
  );
}

/** Ikon galat — galat tidak boleh hanya dibedakan oleh warna (WCAG 1.4.1). */
function ErrorIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="mt-0.5 h-4 w-4 shrink-0"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm0-12.5a.9.9 0 0 1 .9.9v4.2a.9.9 0 0 1-1.8 0V6.4a.9.9 0 0 1 .9-.9Zm0 9a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/** Busur terisi untuk penghitung pilihan — 0 derajat berarti lingkaran kosong. */
function CountDial({ ratio }: { ratio: number }) {
  const safe = Number.isFinite(ratio) ? Math.min(Math.max(ratio, 0), 1) : 0;
  const radius = 6.5;
  const circumference = 2 * Math.PI * radius;

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 16 16"
      className="h-4 w-4 shrink-0 -rotate-90"
      fill="none"
    >
      <circle cx="8" cy="8" r={radius} className="stroke-editorial" strokeWidth={2.5} />
      <circle
        cx="8"
        cy="8"
        r={radius}
        className="stroke-brand-primary transition-[stroke-dashoffset] duration-300 ease-crisp"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - safe)}
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Komponen                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Batas atas yang benar-benar dapat dipakai, atau `null` bila tanpa batas.
 * `max` yang tidak terhingga, `NaN`, nol, atau negatif diperlakukan sebagai
 * "tanpa batas" — bukan sebagai "tidak boleh memilih apa pun".
 */
function resolveMax(max: number | undefined): number | null {
  if (typeof max !== 'number' || !Number.isFinite(max) || max <= 0) return null;
  return Math.floor(max);
}

/**
 * Pilihan ganda sebagai kartu toggle visual — bukan dropdown.
 *
 * Spesifikasi produk meminta divisi relawan tampil sebagai kartu yang dapat
 * diketuk langsung: relawan di lapangan harus dapat melihat SEMUA pilihan tanpa
 * membuka menu, dan deskripsi satu baris per divisi adalah alasan seseorang
 * memilih divisi itu. Dropdown menyembunyikan keduanya.
 *
 * Setiap kartu adalah `<label>` yang membungkus `<input type="checkbox">` asli
 * yang disembunyikan secara visual (`sr-only`), sehingga navigasi Tab, spasi,
 * pembacaan "checked/unchecked", dan `Ctrl/Cmd+A` di dalam grup berasal dari
 * platform, bukan dari reimplementasi ARIA yang mudah melenceng.
 *
 * Saat `max` tercapai, pilihan yang belum tercentang dikunci di level handler
 * (`onChange` tidak dipanggil) DAN input-nya diberi `aria-disabled` + `disabled`
 * sementara yang tercentang tetap aktif, sehingga pelepasan pilihan selalu bisa.
 */
export function CheckboxGroup({
  legend,
  options,
  value,
  onChange,
  max,
  error,
  hint,
  hideLegend = false,
  required = false,
  disabled = false,
  className,
  optionClassName,
  description,
}: CheckboxGroupProps) {
  const reactId = useId();
  const baseId = `checkbox-group-${reactId}`;
  const legendId = `${baseId}-legend`;
  const messageId = `${baseId}-message`;
  const counterId = `${baseId}-counter`;

  // `options` dapat datang dari data yang belum termuat; jangan asumsikan array.
  const items = Array.isArray(options) ? options : [];
  // Nilai dari luar bisa memuat entri lama yang tidak lagi ada di `options`.
  // Menyaring di sini menjaga `selected.size` konsisten dengan apa yang terlihat.
  const knownValues = new Set(items.map((option) => option.value));
  const rawValue = Array.isArray(value) ? value : [];
  const selected = new Set<string>();
  for (const entry of rawValue) {
    if (typeof entry === 'string' && knownValues.has(entry)) selected.add(entry);
  }

  const limit = resolveMax(max);
  const selectedCount = selected.size;
  const atLimit = limit !== null && selectedCount >= limit;
  // Hitungan mentah dipakai untuk pesan, sehingga menyimpan nilai asing tetap terlihat.
  const overflowCount = Math.max(rawValue.length - selectedCount, 0);

  const hasError = typeof error === 'string' && error.trim().length > 0;
  const hasHint = typeof hint === 'string' && hint.trim().length > 0;
  const message = hasError ? error : hasHint ? hint : null;

  const isEmpty = items.length === 0;

  function toggle(optionValue: string, isSelected: boolean) {
    if (disabled) return;
    // Pelepasan pilihan selalu diizinkan — mengunci keduanya akan menjebak
    // pengguna yang sudah mentok `max` tanpa jalan kembali.
    if (isSelected) {
      onChange(Array.from(selected).filter((entry) => entry !== optionValue));
      return;
    }
    if (atLimit) return;
    // Urutan mengikuti `options`, bukan urutan klik, supaya payload form stabil.
    const next = new Set(selected);
    next.add(optionValue);
    onChange(
      items.map((option) => option.value).filter((candidate) => next.has(candidate) || selected.has(candidate)),
    );
  }

  return (
    <fieldset
      disabled={disabled}
      aria-invalid={hasError ? true : undefined}
      aria-required={required || undefined}
      aria-describedby={cn(message ? messageId : null, limit !== null ? counterId : null) || undefined}
      className={cn('flex w-full min-w-0 flex-col border-0 p-0', className)}
    >
      <legend
        id={legendId}
        className={cn(
          'mb-1 flex items-baseline gap-1.5 text-sm font-semibold text-ink',
          hideLegend && 'sr-only',
        )}
      >
        <span>{legend}</span>
        {required ? (
          <span aria-hidden="true" className="text-status-critical">
            *
          </span>
        ) : null}
        {required ? <span className="sr-only">(wajib dipilih minimal satu)</span> : null}
      </legend>

      {description != null ? (
        <p className="mb-3 text-sm text-ink-secondary">{description}</p>
      ) : null}

      {/* Penghitung hidup: memberi tahu SISA jatah, bukan hanya total. */}
      {limit !== null ? (
        <p
          id={counterId}
          className={cn(
            'mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] transition-colors duration-200 ease-crisp',
            atLimit ? 'text-brand-deep' : 'text-ink-secondary',
          )}
        >
          <CountDial ratio={selectedCount / limit} />
          <span>
            {selectedCount}/{limit} dipilih
          </span>
          <span className="sr-only">
            {atLimit
              ? `Batas ${limit} pilihan tercapai. Lepas satu pilihan untuk memilih yang lain.`
              : `Masih dapat memilih ${limit - selectedCount} lagi.`}
          </span>
        </p>
      ) : null}

      {isEmpty ? (
        <p className="rounded-2xl border-2 border-dashed border-editorial bg-surface-pure/60 p-4 text-sm text-ink-secondary">
          Belum ada pilihan yang tersedia.
        </p>
      ) : (
        <div
          role="group"
          aria-labelledby={legendId}
          className="grid grid-cols-1 gap-2.5 sm:grid-cols-2"
        >
          {items.map((option) => {
            const isSelected = selected.has(option.value);
            // Hanya pilihan yang BELUM tercentang yang dikunci saat `max` tercapai.
            const isLocked = !disabled && atLimit && !isSelected;
            const optionId = `${baseId}-${option.value}`;
            const hookId = `${optionId}-hint`;
            const hook = !isSelected && option.description ? hookId : undefined;

            return (
              <label
                key={option.value}
                htmlFor={optionId}
                data-state={isSelected ? 'selected' : isLocked ? 'locked' : 'idle'}
                aria-disabled={isLocked || undefined}
                className={cn(
                  CARD_BASE,
                  isSelected ? CARD_SELECTED : isLocked ? CARD_LOCKED : CARD_IDLE,
                  isLocked && 'cursor-not-allowed',
                  disabled && 'cursor-not-allowed opacity-60',
                  optionClassName,
                )}
              >
                <input
                  id={optionId}
                  type="checkbox"
                  name={baseId}
                  value={option.value}
                  checked={isSelected}
                  // Native `disabled` hanya saat seluruh grup mati; penguncian
                  // karena `max` memakai `aria-disabled` agar pilihan tercentang
                  // tetap dapat dilepas.
                  disabled={disabled}
                  aria-disabled={isLocked || undefined}
                  aria-describedby={hook}
                  onChange={(_event: ChangeEvent<HTMLInputElement>) =>
                    toggle(option.value, isSelected)
                  }
                  className="peer sr-only"
                />

                {/* Kotak centang visual. Karena input adalah `peer`, seluruh
                    statusnya (centang, fokus, hover, disabled, aria-disabled)
                    diturunkan lewat CSS — tidak ada state kedua yang bisa basi. */}
                <span
                  aria-hidden="true"
                  className={cn(
                    BOX_BASE,
                    'bg-surface-pure',
                    isSelected
                      ? 'border-brand-primary bg-brand-primary text-surface-pure'
                      : 'border-editorial text-transparent',
                    'peer-focus-visible:border-brand-primary peer-focus-visible:ring-2 peer-focus-visible:ring-brand-primary/40 peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-canvas',
                    'peer-hover:border-brand-primary/70',
                    'peer-disabled:opacity-60',
                    'peer-aria-disabled:border-editorial/70 peer-aria-disabled:opacity-70',
                  )}
                >
                  {isSelected ? <CheckIcon /> : null}
                </span>

                <span className="min-w-0 flex-1">
                  <span
                    className={cn(
                      'block text-sm font-semibold leading-6',
                      isSelected ? 'text-brand-deep' : 'text-ink',
                    )}
                  >
                    {option.label}
                  </span>
                  {option.description ? (
                    <span
                      id={hookId}
                      className={cn(
                        'mt-0.5 block text-sm leading-5 text-ink-secondary',
                        !isSelected && 'opacity-90',
                      )}
                    >
                      {option.description}
                    </span>
                  ) : null}
                  {isLocked ? (
                    <span className="mt-1 block text-xs font-semibold text-ink-secondary">
                      Lepas satu pilihan dulu
                    </span>
                  ) : null}
                </span>
              </label>
            );
          })}
        </div>
      )}

      {/* Baris bantuan: petunjuk `max` selalu ada (bukan hanya saat mentok),
          supaya batasnya tidak pernah mengejutkan pengguna. */}
      <div className="mt-2.5 flex flex-col gap-1">
        {limit !== null && !atLimit ? (
          <p className="text-sm text-ink-secondary">Maksimal {limit} pilihan</p>
        ) : null}

        {limit !== null && atLimit ? (
          <p className="text-sm font-semibold text-brand-deep">
            Maksimal {limit} pilihan
            <span className="font-normal text-ink-secondary">
              {' '}
              — lepas satu pilihan untuk memilih yang lain.
            </span>
          </p>
        ) : null}

        {overflowCount > 0 ? (
          <p className="text-sm text-ink-secondary">
            {overflowCount} nilai tersimpan tidak lagi tersedia di daftar ini.
          </p>
        ) : null}

        {message ? (
          <p
            id={messageId}
            className={cn(
              'flex items-start gap-1.5 text-sm',
              hasError ? 'font-medium text-status-critical' : 'text-ink-secondary',
            )}
          >
            {hasError ? <ErrorIcon /> : null}
            <span>{message}</span>
          </p>
        ) : null}
      </div>
    </fieldset>
  );
}

export default CheckboxGroup;
