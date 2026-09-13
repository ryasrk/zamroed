import { forwardRef, useId } from 'react';
import type { InputHTMLAttributes, ReactNode } from 'react';

import { cn } from '../lib/cn';

/* -------------------------------------------------------------------------- */
/*  Kontrak gaya bersama                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Seluruh warna dibaca dari token `brand.*` (CSS variable yang di-rebind oleh
 * `.theme-jagatirta` dan `.theme-zamroed`) plus neutrals editorial
 * (`canvas`, `surface`, `ink`, `editorial`). Tidak ada satu pun hex yang
 * dikunci, sehingga satu field melayani kedua merek.
 */

/**
 * Cangkang field. Tinggi minimum 48px dan `text-base` (16px) bukan preferensi
 * estetis: Safari iOS melakukan zoom otomatis pada fokus bila font-size < 16px,
 * dan relawan lapangan mengisi form dengan satu tangan di ponsel.
 */
const FIELD_BASE = [
  'block w-full min-h-12 rounded-xl border bg-surface-pure text-base leading-6 text-ink',
  'px-4 py-3 placeholder:text-ink-secondary/70',
  'transition-[border-color,box-shadow,background-color] duration-200 ease-crisp',
  'focus:outline-none focus-visible:outline-none',
  // Cincin fokus merek: dua lapis (ring + offset) agar tetap terbaca di kedua tema.
  'focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/35',
  'disabled:cursor-not-allowed disabled:bg-canvas disabled:text-ink-secondary',
  // Angka telepon/umur dipakai di lapangan: jangan biarkan spinner browser memakan lebar.
  '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
].join(' ');

/** Border normal vs. error. Error memakai `status.critical`, bukan warna merek. */
const BORDER_DEFAULT = 'border-editorial hover:border-brand-primary/60';
const BORDER_ERROR = 'border-status-critical hover:border-status-critical focus:border-status-critical focus:ring-status-critical/35';

/** Pesan error — hidup, tegas, dan selalu dikaitkan lewat aria-describedby. */
const MESSAGE_ERROR = 'text-sm font-medium text-status-critical';
/** Hint — pendamping netral yang tidak berlomba dengan label. */
const MESSAGE_HINT = 'text-sm text-ink-secondary';

/** Target sentuh minimal 48px untuk adornment yang benar-benar dapat diketuk. */
const ADORNMENT = 'flex shrink-0 items-center gap-1.5 text-ink-secondary';

/* -------------------------------------------------------------------------- */
/*  Tipe                                                                       */
/* -------------------------------------------------------------------------- */

export type InputType = 'text' | 'email' | 'tel' | 'number';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  /** Teks label. Wajib — field tanpa label tidak dapat diakses. */
  label: string;
  /** Pesan galat. Kehadirannya mengubah border ke `status.critical` dan menandai `aria-invalid`. */
  error?: string;
  /** Petunjuk pengisian. Disembunyikan dari pembaca layar saat `error` aktif (pesan galat menggantikannya). */
  hint?: string;
  /** Adornment di depan, mis. `'+62'`, `'Rp'`, atau ikon. */
  prefix?: ReactNode;
  /** Adornment di belakang, mis. `'kg'` atau `'mg/L'`. */
  suffix?: ReactNode;
  /** Menyembunyikan label secara visual, tetap tersedia bagi pembaca layar. */
  hideLabel?: boolean;
  /** Kontainer terluar, bukan elemen `<input>`. */
  className?: string;
  /** Kelas elemen `<input>` itu sendiri. */
  inputClassName?: string;
}

/* -------------------------------------------------------------------------- */
/*  Field pesan                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Satu baris pesan di bawah field. Karena `error` menggantikan `hint` sebagai
 * deskripsi, keduanya berbagi SATU id yang sama — nilai `aria-describedby`
 * karena itu selalu tepat satu referensi elemen yang benar-benar ada.
 */
function FieldMessage({ id, message, isError }: { id: string; message: string; isError: boolean }) {
  return (
    <p
      id={id}
      className={cn('mt-1.5 flex items-start gap-1.5', isError ? MESSAGE_ERROR : MESSAGE_HINT)}
    >
      {isError ? (
        // Ikon penguat: galat tidak boleh bergantung pada warna saja (WCAG 1.4.1).
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
      ) : (
        <svg
          aria-hidden="true"
          focusable="false"
          viewBox="0 0 20 20"
          fill="currentColor"
          className="mt-0.5 h-4 w-4 shrink-0 opacity-70"
        >
          <path
            fillRule="evenodd"
            d="M10 1.8a8.2 8.2 0 1 0 0 16.4 8.2 8.2 0 0 0 0-16.4ZM9.1 5.6h1.8v1.8H9.1V5.6Zm0 3.3h1.8v5.5H9.1V8.9Z"
            clipRule="evenodd"
          />
        </svg>
      )}
      <span>{message}</span>
    </p>
  );
}

/* -------------------------------------------------------------------------- */
/*  Komponen                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Field teks bersama untuk Jagatirta & ZAMROED Bergerak.
 *
 * Server-compatible: tidak ada hook, state, atau efek. `useId` tetap aman
 * karena React 18 menyediakan id stabil dan hidrasi-nya deterministik, jadi
 * `aria-describedby` tidak pernah menunjuk ke elemen yang tidak ada — baik saat
 * SSR maupun setelah hidrasi.
 *
 * Pemasangan label↔field memakai `htmlFor` eksplisit (bukan membungkus input di
 * dalam `<label>`), sehingga `prefix`/`suffix` yang interaktif tetap dapat
 * diketuk tanpa ikut memfokuskan field.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    error,
    hint,
    prefix,
    suffix,
    hideLabel = false,
    className,
    inputClassName,
    id,
    type = 'text',
    value,
    defaultValue,
    min,
    max,
    step,
    required = false,
    disabled = false,
    inputMode,
    autoComplete,
    ...rest
  },
  ref,
) {
  const reactId = useId();
  // `id` dari pemanggil selalu menang; `useId` hanya jaring pengaman SSR.
  const fieldId = id ?? `input-${reactId}`;
  const messageId = `${fieldId}-message`;
  const controlId = `${fieldId}-control`;

  const hasError = typeof error === 'string' && error.trim().length > 0;
  const hasHint = typeof hint === 'string' && hint.trim().length > 0;
  // Satu elemen pesan saja yang tampil: galat menang atas petunjuk.
  const message = hasError ? error : hasHint ? hint : null;

  // `tel`/`number` mendapat papan angka di ponsel; email tetap `email` agar
  // tombol "@" muncul dan autofill bekerja.
  const resolvedInputMode =
    inputMode ?? (type === 'tel' || type === 'number' ? (type === 'tel' ? 'tel' : 'numeric') : undefined);

  return (
    <div className={cn('flex w-full flex-col', className)}>
      <label
        htmlFor={fieldId}
        className={cn(
          'mb-1.5 flex items-baseline gap-1.5 text-sm font-semibold text-ink',
          hideLabel && 'sr-only',
        )}
      >
        <span>{label}</span>
        {required ? (
          // Penanda wajib tidak hanya bergantung pada warna asterisk.
          <span aria-hidden="true" className="text-status-critical">
            *
          </span>
        ) : null}
        {required ? <span className="sr-only">(wajib diisi)</span> : null}
      </label>

      <div
        className={cn(
          // Group memindahkan cincin fokus dari input ke cangkang saat ada adornment,
          // sehingga '+62' dan tombol satuan berada di dalam area yang sama-sama tersorot.
          'group/field relative flex min-h-12 w-full items-stretch overflow-hidden rounded-xl',
          'border bg-surface-pure',
          'transition-[border-color,box-shadow] duration-200 ease-crisp',
          'focus-within:ring-2',
          'has-[:disabled]:cursor-not-allowed',
          hasError
            ? cn(
                'border-status-critical focus-within:border-status-critical focus-within:ring-status-critical/35',
              )
            : 'border-editorial focus-within:border-brand-primary focus-within:ring-brand-primary/35',
          disabled && 'bg-canvas opacity-70',
        )}
      >
        {prefix != null ? (
          <span
            data-adornment="prefix"
            className={cn(
              ADORNMENT,
              'border-r border-editorial bg-canvas/60 py-3 pl-4 pr-3 text-base font-medium',
              'group-focus-within/field:text-brand-deep',
            )}
          >
            {prefix}
          </span>
        ) : null}

        <input
          ref={ref}
          id={fieldId}
          type={type}
          value={value}
          defaultValue={defaultValue}
          min={min}
          max={max}
          step={step}
          required={required}
          disabled={disabled}
          inputMode={resolvedInputMode}
          autoComplete={autoComplete}
          // Field dengan type=number tidak memakai atribut ini; nilai non-numerik
          // tetap diabaikan browser, jadi tidak ada risiko `NaN` masuk ke state.
          aria-invalid={hasError ? true : undefined}
          aria-describedby={message ? messageId : undefined}
          aria-required={required || undefined}
          data-control-id={controlId}
          className={cn(
            FIELD_BASE,
            // Karena cincin digambar oleh group, input di dalam group tidak
            // menggambar ulang border/ring-nya sendiri.
            prefix != null || suffix != null
              ? 'min-w-0 flex-1 rounded-none border-0 bg-transparent px-3.5 focus:ring-0'
              : cn('border', hasError ? BORDER_ERROR : BORDER_DEFAULT),
            inputClassName,
          )}
          {...rest}
        />

        {suffix != null ? (
          <span
            data-adornment="suffix"
            className={cn(
              ADORNMENT,
              'border-l border-editorial bg-canvas/60 py-3 pl-3 pr-4 text-base font-medium',
              'group-focus-within/field:text-brand-deep',
            )}
          >
            {suffix}
          </span>
        ) : null}
      </div>

      {message ? <FieldMessage id={messageId} message={message} isError={hasError} /> : null}
    </div>
  );
});

export default Input;
