import { forwardRef, useId } from 'react';
import type { SelectHTMLAttributes } from 'react';

import { cn } from '../lib/cn';

/* -------------------------------------------------------------------------- */
/*  Kontrak gaya bersama                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Warna hanya dibaca dari token `brand.*` (CSS variable yang di-rebind oleh
 * `.theme-jagatirta` dan `.theme-zamroed`) dan neutral editorial
 * (`canvas`, `surface`, `ink`, `editorial`). Tidak ada hex yang dikunci, jadi
 * satu field melayani kedua merek.
 */

/**
 * Cangkang kontrol. Tinggi minimum 48px dan `text-base` (16px) bukan preferensi
 * estetis: Safari iOS melakukan zoom otomatis pada fokus bila font-size < 16px,
 * dan relawan lapangan mengisi form dengan satu tangan di ponsel.
 *
 * `appearance-none` mematikan chevron bawaan browser supaya kita bisa menggambar
 * chevron sendiri (lihat <Chevron>) dengan padding kanan yang pasti — chevron
 * native tidak dapat ditata dan di Android posisinya berbeda-beda antar OEM.
 */
const FIELD_BASE = [
  'block w-full min-h-12 rounded-xl border bg-surface-pure text-base leading-6 text-ink',
  // Ruang kanan menampung chevron; teks panjang dipangkas, bukan menabrak ikon.
  'py-3 pl-4 pr-12 truncate',
  'placeholder:text-ink-secondary/70',
  'transition-[border-color,box-shadow,background-color] duration-200 ease-crisp',
  'focus:outline-none focus-visible:outline-none',
  // Cincin fokus merek dua lapis (ring + border) agar terbaca di kedua tema.
  'focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/35',
  'disabled:cursor-not-allowed disabled:bg-canvas disabled:text-ink-secondary',
].join(' ');

/** Border normal vs. error. Error memakai `status.critical`, bukan warna merek. */
const BORDER_DEFAULT = 'border-editorial hover:border-brand-primary/60';
const BORDER_ERROR =
  'border-status-critical hover:border-status-critical focus:border-status-critical focus:ring-status-critical/35';

/** Pesan error — hidup, tegas, dan selalu dikaitkan lewat aria-describedby. */
const MESSAGE_ERROR = 'text-sm font-medium text-status-critical';
/** Hint — pendamping netral yang tidak berlomba dengan label. */
const MESSAGE_HINT = 'text-sm text-ink-secondary';

/* -------------------------------------------------------------------------- */
/*  Tipe                                                                       */
/* -------------------------------------------------------------------------- */

/** Satu baris pilihan. `value` sengaja boleh string apa pun (id, slug, enum). */
export interface SelectOption {
  value: string;
  label: string;
  /** Menonaktifkan satu opsi tanpa mengeluarkannya dari daftar. */
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'children' | 'multiple'> {
  /** Teks label. Wajib — kontrol tanpa label tidak dapat diakses. */
  label: string;
  /** Daftar pilihan. Array kosong ditangani sebagai "belum ada data". */
  options: readonly SelectOption[];
  /** Pesan galat. Mengubah border ke `status.critical` dan menandai `aria-invalid`. */
  error?: string;
  /** Petunjuk pengisian. Digantikan oleh pesan galat saat galat aktif. */
  hint?: string;
  /**
   * Label opsi kosong di posisi teratas, mis. `'Pilih sungai'`.
   * Opsinya ber-`value=""` sehingga "belum memilih" tetap dapat dibedakan dari
   * pilihan sah mana pun.
   */
  placeholder?: string;
  /** Nilai terpilih (kontrol terkendali). */
  value?: string;
  /** Nilai default (kontrol tak-terkendali). */
  defaultValue?: string;
  /** Handler perubahan nilai. */
  onChange?: SelectHTMLAttributes<HTMLSelectElement>['onChange'];
  /** Menyembunyikan label secara visual, tetap tersedia bagi pembaca layar. */
  hideLabel?: boolean;
  /** Kontainer terluar, bukan elemen `<select>`. */
  className?: string;
  /** Kelas elemen `<select>` itu sendiri. */
  selectClassName?: string;
  /** Teks yang tampil saat `options` kosong dan tidak ada placeholder. */
  emptyLabel?: string;
  /** Menampilkan status "sedang memuat" dan memblokir interaksi. */
  loading?: boolean;
  /** Teks status saat `loading`. */
  loadingLabel?: string;
}

/* -------------------------------------------------------------------------- */
/*  Chevron                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Chevron SVG inline (bukan lucide) supaya sudutnya, ketebalan garis, dan
 * kecepatan rotasinya dapat dikunci di sini — dan supaya paket ikon tidak
 * masuk ke bundel hanya untuk satu tanda panah.
 *
 * Chevron mengikuti state kontrol lewat variabel grup
 * (`group-has-[:disabled]`, `group-focus-within`) alih-alih hook, sehingga
 * komponen tetap server-compatible.
 */
function Chevron({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn(
        'pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2',
        'text-ink-secondary transition-[color] duration-200 ease-crisp',
        // Menyala mengikuti fokus kontrol; state "open" tidak diekspos browser
        // pada <select>, jadi tidak ada rotasi yang bisa diandalkan.
        'group-focus-within:text-brand-primary',
        className,
      )}
    >
      <path d="M5.5 8 10 12.5 14.5 8" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Field pesan                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Satu baris pesan di bawah field. Karena `error` menggantikan `hint` sebagai
 * deskripsi, keduanya berbagi SATU id — `aria-describedby` karena itu selalu
 * tepat satu referensi ke elemen yang benar-benar ada.
 *
 * Ikon penguat dipakai agar galat tidak bergantung pada warna saja (WCAG 1.4.1).
 * `role="alert"` hanya pada galat: pembaca layar diumumkan saat validasi gagal,
 * sedangkan petunjuk tidak boleh menyela.
 */
function FieldMessage({
  id,
  message,
  isError,
}: {
  id: string;
  message: string;
  isError: boolean;
}) {
  return (
    <p
      id={id}
      role={isError ? 'alert' : undefined}
      className={cn('mt-1.5 flex items-start gap-1.5', isError ? MESSAGE_ERROR : MESSAGE_HINT)}
    >
      {isError ? (
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
 * Dropdown bersama untuk Jagatirta & ZAMROED Bergerak.
 *
 * Sengaja `<select>` NATIVE, bukan listbox buatan sendiri: di ponsel native
 * membuka wheel picker OS (satu jempol, tanpa scroll jebakan), bekerja tanpa
 * JavaScript, dan lolos kontrol zoom iOS karena font-nya 16px. Yang kita
 * kerjakan hanya cangkangnya — tinggi 48px, chevron sendiri, cincin fokus merek.
 *
 * Server-compatible: tidak ada hook, state, atau event handler yang dipasang
 * sendiri; `onChange` dan sisanya diteruskan apa adanya ke elemen. `useId`
 * dipakai dan hidrasi-nya deterministik, jadi `htmlFor`/`aria-describedby`
 * tidak pernah menunjuk ke elemen yang tidak ada setelah SSR.
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    label,
    options,
    error,
    hint,
    placeholder,
    value,
    defaultValue,
    onChange,
    hideLabel = false,
    className,
    selectClassName,
    emptyLabel = 'Belum ada data',
    loading = false,
    loadingLabel = 'Memuat pilihan…',
    id,
    name,
    required = false,
    disabled = false,
    autoComplete,
    ...rest
  },
  ref,
) {
  const reactId = useId();
  // `id` dari pemanggil selalu menang; `useId` hanya jaring pengaman SSR.
  const fieldId = id ?? `select-${reactId}`;
  const messageId = `${fieldId}-message`;

  const hasError = typeof error === 'string' && error.trim().length > 0;
  const hasHint = typeof hint === 'string' && hint.trim().length > 0;
  // Satu elemen pesan saja yang tampil: galat menang atas petunjuk.
  const message = hasError ? error : hasHint ? hint : null;

  // `options` dapat datang dari fetch yang belum selesai; jangan asumsikan array.
  const safeOptions: readonly SelectOption[] = Array.isArray(options) ? options : [];
  const isEmpty = safeOptions.length === 0;
  const isInert = disabled || loading;

  /**
   * Kasus kosong. Bila pemanggil memberikan `placeholder`, opsi itu sudah
   * menjadi label kosong — menambah "belum ada data" hanya akan menghasilkan
   * dua baris kosong. Jadi opsi sintetis ini muncul hanya saat benar-benar
   * tidak ada apa pun untuk dipilih.
   */
  const showSynthetic = isEmpty && !placeholder;
  const syntheticLabel = loading ? loadingLabel : emptyLabel;

  const mergedClassName = cn(
    // `group` + `relative` menopang chevron dan state-nya tanpa JavaScript.
    'group relative flex w-full flex-col',
    className,
  );

  return (
    <div className={mergedClassName}>
      <label
        htmlFor={fieldId}
        className={cn(
          'mb-1.5 flex items-baseline gap-1.5 text-sm font-semibold text-ink',
          hideLabel && 'sr-only',
        )}
      >
        <span>{label}</span>
        {required ? (
          <>
            {/* Penanda wajib tidak hanya bergantung pada warna asterisk. */}
            <span aria-hidden="true" className="text-status-critical">
              *
            </span>
            <span className="sr-only">(wajib dipilih)</span>
          </>
        ) : null}
      </label>

      <div className="relative">
        <select
          ref={ref}
          id={fieldId}
          name={name}
          value={value}
          defaultValue={value === undefined ? defaultValue : undefined}
          onChange={onChange}
          required={required}
          disabled={isInert}
          autoComplete={autoComplete}
          aria-invalid={hasError ? true : undefined}
          aria-describedby={message ? messageId : undefined}
          aria-required={required || undefined}
          aria-busy={loading || undefined}
          data-loading={loading || undefined}
          className={cn('appearance-none', FIELD_BASE, hasError ? BORDER_ERROR : BORDER_DEFAULT, selectClassName)}
          {...rest}
        >
          {placeholder ? (
            // `value=""` (bukan value palsu) supaya required + placeholder tetap
            // memicu validasi native yang benar di browser.
            <option value="" disabled={required}>
              {placeholder}
            </option>
          ) : null}

          {showSynthetic ? (
            // Nilai "belum memilih" tetap string kosong, konsisten dengan placeholder.
            <option value="" disabled>
              {syntheticLabel}
            </option>
          ) : null}

          {safeOptions.map((option, index) => (
            <option
              // `value` boleh duplikat di data lapangan; indeks menjaga key tetap unik.
              key={`${option.value}::${index}`}
              value={option.value ?? ''}
              disabled={option.disabled || undefined}
            >
              {option.label}
            </option>
          ))}
        </select>

        <Chevron
          className={cn(
            // Chevron menjauh saat kontrol dinonaktifkan agar tidak terbaca sebagai aktif.
            'group-has-[:disabled]:opacity-40',
            hasError && 'text-status-critical group-focus-within:text-status-critical',
          )}
        />
      </div>

      {message ? <FieldMessage id={messageId} message={message} isError={hasError} /> : null}
    </div>
  );
});

export default Select;
