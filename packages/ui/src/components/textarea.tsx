'use client';

import { forwardRef, useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type {
  ChangeEvent,
  CSSProperties,
  KeyboardEvent,
  TextareaHTMLAttributes,
  UIEvent,
} from 'react';

import { cn } from '../lib/cn';

/* -------------------------------------------------------------------------- */
/*  Kontrak gaya bersama                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Seluruh warna dibaca dari token `brand.*` (CSS variable yang di-rebind oleh
 * `.theme-jagatirta` dan `.theme-zamroed`) plus neutrals editorial
 * (`canvas`, `surface-pure`, `ink`, `editorial`). Tidak ada satu hex yang
 * dikunci, sehingga satu komponen melayani kedua merek.
 */

/**
 * Cangkang field. `text-base` (16px) bukan pilihan estetis: Safari iOS
 * memperbesar halaman saat fokus bila font-size < 16px, dan relawan lapangan
 * mengisi laporan dengan satu tangan di ponsel. `min-h-[7.5rem]` = 120px sesuai
 * spesifikasi, `leading-6` (24px) dipakai sebagai kelipatan baris saat
 * mengukur `scrollHeight`.
 */
const TEXTAREA_BASE = [
  'block w-full min-h-[7.5rem] rounded-xl border bg-surface-pure text-base leading-6 text-ink',
  'px-4 py-3 placeholder:text-ink-secondary/70',
  'transition-[border-color,box-shadow] duration-200 ease-crisp',
  'focus:outline-none focus-visible:outline-none',
  // Cincin fokus merek: dua lapis (ring + offset) agar terbaca di kedua tema.
  'focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/35',
  'disabled:cursor-not-allowed disabled:bg-canvas disabled:text-ink-secondary',
].join(' ');

/** Border normal vs. error. Error memakai `status.critical`, bukan warna merek. */
const BORDER_DEFAULT = 'border-editorial hover:border-brand-primary/60';
const BORDER_ERROR =
  'border-status-critical hover:border-status-critical focus:border-status-critical focus:ring-status-critical/35';

/**
 * Saat `autoResize` aktif, scrollbar OS dimatikan: menggulir isi di dalam kotak
 * yang tingginya sudah mengikuti isi hanya memindahkan fokus visual tanpa guna.
 * `scrollbar-width: none` untuk Firefox, `::-webkit-scrollbar` untuk Safari/Chrome.
 *
 * `max-h` di sini adalah jaring pengaman untuk lingkungan yang belum membaca CSS
 * variable. Kelas dan tinggi inline sama-sama memakai properti `max-height`,
 * sehingga perbedaan keduanya tidak pernah membuat CSS tidak konsisten —
 * dan yang pasti menang adalah yang paling spesifik, yaitu style inline.
 */
const AUTOSIZE_FIT = [
  'resize-none',
  'overflow-y-auto',
  'max-h-[var(--textarea-max-h,20rem)]',
  '[scrollbar-width:none]',
  '[&::-webkit-scrollbar]:hidden [&::-webkit-scrollbar]:w-0 [&::-webkit-scrollbar]:h-0',
].join(' ');

/** Pesan error — hidup, tegas, dan selalu dikaitkan lewat aria-describedby. */
const MESSAGE_ERROR = 'text-sm font-medium text-status-critical';
/** Hint — pendamping netral yang tidak berlomba dengan label. */
const MESSAGE_HINT = 'text-sm text-ink-secondary';

/**
 * Tinggi maksimum bawaan sebelum textarea mulai menggulir sendiri. Dipilih
 * agar kotak pesan panjang tetap muat di layar ponsel 360×640 bersama label,
 * penghitung, dan tombol kirim yang tak boleh terdorong keluar viewport.
 */
const DEFAULT_MAX_HEIGHT = 320;
/** Batas bawah yang tetap menjaga target ketuk 48px saat pemanggil mengatur `maxHeight`. */
const MIN_TOUCH_TARGET = 48;
/** Batas atas untuk mencegah satu nilai yang kebablasan membuat textarea setinggi halaman. */
const SAFETY_MAX_HEIGHT = 720;
/** Ambang sisa kuota: di bawah ini penghitung memakai nada `status.warning`. */
const COUNTER_WARN_RATIO = 0.9;

/* -------------------------------------------------------------------------- */
/*  Utilitas                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Browser menormalkan `\r\n` menjadi `\n` lewat `maxLength`/`rows`, tetapi tidak
 * untuk `value` yang dikirim program. Normalisasi di sini membuat hitungan
 * karakter, `maxLength`, dan data yang tersimpan selalu sepakat.
 */
function normalizeText(value: string): string {
  return value.replace(/\r\n/g, '\n');
}

/** Panjang teks tanpa memercayai tipe `string` yang datang dari runtime. */
function countChars(value: string): number {
  return typeof value === 'string' ? normalizeText(value).length : 0;
}

/** Apakah masih ada karakter non-spasi — dipakai untuk aksi "hapus". */
function hasContent(value: string): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Angka yang datang dari state harus melewati gerbang ini sebelum masuk ke
 * style: `Infinity` akan menghasilkan `height: Infinitypx` dan meruntuhkan
 * seluruh layout.
 */
function toFiniteNumber(value: number): number | null {
  return Number.isFinite(value) ? value : null;
}

/** Membulatkan ke atas pada kelipatan `step` — mis. 24px untuk `leading-6`. */
function ceilTo(value: number, step: number): number {
  return Math.ceil(value / step) * step;
}

/** 1.234 — pemisah ribuan Bahasa Indonesia untuk penghitung karakter. */
function formatCount(value: number): string {
  return value.toLocaleString('id-ID');
}

function clampHeight(height: number, minHeight: number, maxHeight: number): number {
  // Pemanggil bisa saja menukar `minHeight`/`maxHeight`; tanpa normalisasi ini
  // Math.min/Math.max akan memulangkan nilai yang tidak masuk akal.
  const low = Math.max(MIN_TOUCH_TARGET, Math.min(minHeight, maxHeight));
  const high = Math.max(low, minHeight, maxHeight);
  return Math.min(Math.max(height, low), high);
}

/* -------------------------------------------------------------------------- */
/*  Tipe                                                                       */
/* -------------------------------------------------------------------------- */

/** Elemen yang benar-benar dirender. `textarea` juga memakai tag `<textarea>`. */
export type TextareaResizeElement = 'textarea' | 'input';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Teks label. Wajib — field tanpa label tidak dapat diakses. */
  label: string;
  /** Pesan galat. Kehadirannya mengubah border ke `status.critical` dan menandai `aria-invalid`. */
  error?: string;
  /** Petunjuk pengisian. Disembunyikan dari pembaca layar saat `error` aktif (pesan galat menggantikannya). */
  hint?: string;
  /** Menyembunyikan label secara visual, tetap tersedia bagi pembaca layar. */
  hideLabel?: boolean;
  /** Menumbuhkan tinggi textarea mengikuti isi sampai `maxHeight`, lalu menggulir. */
  autoResize?: boolean;
  /** Tinggi maksimum hasil auto-resize dalam piksel. Default 320. */
  maxHeight?: number;
  /** Tinggi minimum hasil auto-resize dalam piksel. Tidak pernah di bawah 48px. */
  minHeight?: number;
  /** Menampilkan penghitung karakter. Membutuhkan `maxLength` agar ada batas yang dihitung. */
  showCounter?: boolean;
  /** Menampilkan aksi "hapus" yang dapat diketuk (hanya tampil bila ada nilai non-kosong). */
  showClearButton?: boolean;
  /** Dipanggil saat textarea tumbuh melewati `maxHeight` dan mulai menggulir. */
  onMaxHeightReached?: (reached: boolean) => void;
  /** Kontainer terluar, bukan elemen `<textarea>`. */
  className?: string;
  /** Kelas elemen `<textarea>` itu sendiri. */
  textareaClassName?: string;
}

/* -------------------------------------------------------------------------- */
/*  Field pesan                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Satu baris pesan di bawah field. Karena `error` menggantikan `hint` sebagai
 * deskripsi, keduanya berbagi SATU `id` yang sama — sehingga `aria-describedby`
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
/*  Penghitung karakter                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Penghitung karakter. Angka `aria-hidden` dan hanya diumumkan lewat
 * `aria-describedby` pada textarea: bila dibiarkan hidup sendiri, pembaca layar
 * akan membacakan sisa kuota setiap kali satu huruf diketik.
 */
function CharCounter({
  id,
  chars,
  maxLength,
  hasError,
  isAtLimit,
}: {
  id: string;
  chars: number;
  maxLength?: number;
  hasError: boolean;
  isAtLimit: boolean;
}) {
  const hasLimit = typeof maxLength === 'number' && Number.isFinite(maxLength) && maxLength > 0;
  // maxLength cacat (mis. -5) tidak boleh menghasilkan sisa kuota negatif.
  const remaining = hasLimit ? Math.max(0, Math.trunc(maxLength as number) - chars) : 0;
  const isNearLimit = hasLimit && remaining <= Math.floor((maxLength as number) * (1 - COUNTER_WARN_RATIO));

  return (
    <span
      id={id}
      data-counter="chars"
      className={cn(
        'shrink-0 whitespace-nowrap text-xs font-medium tabular-nums',
        hasError || isAtLimit
          ? 'text-status-critical'
          : isNearLimit
            ? 'text-status-warning'
            : 'text-ink-secondary',
      )}
    >
      <span aria-hidden="true">
        {hasLimit
          ? `${formatCount(chars)} / ${formatCount(maxLength as number)} karakter · sisa ${formatCount(remaining)}`
          : `${formatCount(chars)} karakter`}
      </span>
      <span className="sr-only">
        {hasLimit
          ? `Terisi ${formatCount(chars)} dari ${formatCount(maxLength as number)} karakter, sisa ${formatCount(remaining)}.`
          : `Terisi ${formatCount(chars)} karakter.`}
      </span>
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Ikon                                                                       */
/* -------------------------------------------------------------------------- */

/** Silang kecil untuk aksi "hapus". */
function ClearIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-4 w-4"
    >
      <path
        fillRule="evenodd"
        d="M5.3 4.3a1 1 0 0 1 1.4 0L10 7.6l3.3-3.3a1 1 0 0 1 1.4 1.4L11.4 9l3.3 3.3a1 1 0 0 1-1.4 1.4L10 10.4l-3.3 3.3a1 1 0 0 1-1.4-1.4L8.6 9 5.3 5.7a1 1 0 0 1 0-1.4Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/** Ikon penguat untuk penghitung karakter. */
function CounterIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-3.5 w-3.5 shrink-0 opacity-70"
    >
      <path
        fillRule="evenodd"
        d="M4 3h9.5A3.5 3.5 0 0 1 17 6.5V15a2 2 0 0 1-2 2H6a3 3 0 0 1-3-3V4a1 1 0 0 1 1-1Zm2 5a1 1 0 0 0 0 2h8a1 1 0 1 0 0-2H6Zm0 4a1 1 0 1 0 0 2h5a1 1 0 1 0 0-2H6Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Komponen                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Textarea bersama untuk Jagatirta & ZAMROED Bergerak.
 *
 * `autoResize` bekerja seperti measure-then-set: tinggi disetel ke `auto`
 * (yang bagi textarea secara alami berarti `scrollHeight`), lalu dikunci ke
 * `scrollHeight` tersebut selama belum melewati `maxHeight`. Empat detail yang
 * membuatnya tidak berkedip atau salah hitung:
 *
 * 1. Pengukuran langsung di event `change` (nilai DOM sudah final, sedangkan
 *    `onChange` reaktif tertinggal satu render saat menempel teks).
 * 2. `useLayoutEffect` menyusul di commit berikutnya — menutup nilai yang
 *    datang dari luar (mis. `setState` dari `defaultValue` ke `value`).
 * 3. Reset ke `height: auto` lebih dulu: tanpa itu `scrollHeight` hanya
 *    memulangkan tinggi sekarang dan kotak tidak pernah menyusut.
 * 4. Setiap turunan (label, hint, penghitung, tombol hapus) dapat menggeser
 *    lebar/tinggi textarea, jadi `ResizeObserver` dipasang pada elemen itu
 *    sendiri dan menghitung ulang saat ukuran berubah.
 *
 * Guard SSR: tidak ada `window`/`document` di jalur render, efek hanya berjalan
 * di klien, dan nilai awal render selalu `undefined` sehingga markup server dan
 * hidrasi pertama identik — tidak ada markup yang berbeda antara keduanya.
 */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  {
    label,
    error,
    hint,
    hideLabel = false,
    autoResize = false,
    maxHeight,
    minHeight,
    showCounter = false,
    showClearButton = false,
    onMaxHeightReached,
    className,
    textareaClassName,
    id,
    name,
    value,
    defaultValue,
    onChange,
    onInput,
    onScroll,
    onKeyDown,
    rows = 4,
    maxLength,
    required = false,
    disabled = false,
    readOnly = false,
    spellCheck,
    autoComplete,
    placeholder,
    ...rest
  },
  ref,
) {
  const reactId = useId();
  // `id` dari pemanggil selalu menang; `useId` hanya jaring pengaman yang stabil saat SSR.
  const fieldId = id ?? `textarea-${reactId}`;
  const messageId = `${fieldId}-message`;
  const counterId = `${fieldId}-counter`;

  const innerRef = useRef<HTMLTextAreaElement | null>(null);
  // Menampung callback ref dari pemanggil tanpa menjadikannya dependency efek.
  const forwardedRef = useRef(ref);
  forwardedRef.current = ref;

  /** Menyatukan ref internal (dibutuhkan pengukuran) dengan ref yang di-forward. */
  const setRefs = useCallback((node: HTMLTextAreaElement | null) => {
    innerRef.current = node;
    const forwarded = forwardedRef.current;
    if (forwarded === null) return;
    if (typeof forwarded === 'function') forwarded(node);
    else forwarded.current = node;
  }, []);

  const hasError = typeof error === 'string' && error.trim().length > 0;
  const hasHint = typeof hint === 'string' && hint.trim().length > 0;
  // Satu elemen pesan saja yang tampil: galat menang atas petunjuk.
  const message = hasError ? error : hasHint ? hint : null;

  // Batas atas/bawah yang sudah tervalidasi. `maxHeight` cacat diabaikan, bukan
  // diteruskan sebagai `NaN` ke style.
  const resolvedMax = Math.min(
    SAFETY_MAX_HEIGHT,
    Math.max(toFiniteNumber(maxHeight ?? DEFAULT_MAX_HEIGHT) ?? DEFAULT_MAX_HEIGHT, MIN_TOUCH_TARGET),
  );
  const resolvedMin = clampHeight(
    toFiniteNumber(minHeight ?? MIN_TOUCH_TARGET) ?? MIN_TOUCH_TARGET,
    MIN_TOUCH_TARGET,
    resolvedMax,
  );

  /** Tinggi terkunci hasil pengukuran terakhir. `null` = biarkan kelas CSS yang mengatur. */
  const [measuredHeight, setMeasuredHeight] = useState<number | null>(null);
  const [isAtMax, setIsAtMax] = useState(false);
  // Cermin state untuk perbandingan di dalam efek tanpa menjadikannya dependency:
  // menaruh `isAtMax` di dependency dapat memicu render–efek tanpa henti.
  const atMaxRef = useRef(false);
  const onMaxHeightReachedRef = useRef(onMaxHeightReached);
  onMaxHeightReachedRef.current = onMaxHeightReached;

  // Nilai terkontrol punya otoritas lebih tinggi, tetapi tetap dinormalisasi.
  const controlledValue = typeof value === 'string' ? normalizeText(value) : undefined;
  // Pantauan terakhir teks: sumber hitungan karakter saat komponen tidak dikontrol.
  const [observedText, setObservedText] = useState<string>(() =>
    typeof defaultValue === 'string' ? normalizeText(defaultValue) : '',
  );
  const currentText = controlledValue ?? observedText;
  const charCount = countChars(currentText);
  // `maxLength` cacat (0/NaN/negatif) tidak boleh membuat penghitung berkedip "0".
  const effectiveMaxLength =
    typeof maxLength === 'number' && Number.isFinite(maxLength) && maxLength > 0
      ? Math.trunc(maxLength)
      : undefined;
  const isAtLimit = effectiveMaxLength !== undefined && charCount >= effectiveMaxLength;

  /**
   * Ukur dan setel tinggi. Dipanggil dari event (tanpa lag render) dan dari
   * layout effect (menutup perubahan nilai dari luar). Selalu memulangkan
   * status "sudah di batas" agar pemanggil dapat mengumumkannya lewat callback.
   */
  const measure = useCallback(() => {
    const el = innerRef.current;
    // SSR: ref belum terpasang. `scrollHeight === 0` juga menandakan elemen
    // sedang tidak terlihat (mis. di dalam <details> yang tertutup) — mengukur
    // dalam kondisi itu hanya menghasilkan tinggi palsu 0.
    if (!el) return;

    const previousInlineHeight = el.style.height;
    // Reset wajib: tanpa ini `scrollHeight` hanya memulangkan tinggi sekarang
    // dan textarea tidak akan pernah menyusut kembali.
    el.style.height = 'auto';

    const scrollHeight = el.scrollHeight;
    if (!Number.isFinite(scrollHeight) || scrollHeight <= 0) {
      el.style.height = previousInlineHeight;
      return;
    }

    // `scrollHeight` dibulatkan ke atas pada kelipatan baris supaya batas
    // `maxHeight` jatuh tepat di antara dua baris, bukan memotong satu baris.
    const target = clampHeight(
      ceilTo(scrollHeight, 24) + 2, // +2px toleransi pembulatan sub-pixel
      resolvedMin,
      resolvedMax,
    );

    el.style.height = `${target}px`;
    // Kunci tinggi hanya selama masih tumbuh mengikuti isi. Begitu batas atas
    // tercapai, kendali dikembalikan ke kelas CSS (min-h 120px + max-h) agar
    // pengguna bisa menggulir dan tidak ada dua sumber kebenaran yang bertengkar.
    const nextAtMax = scrollHeight > resolvedMax;
    setMeasuredHeight(nextAtMax ? null : target);
    setIsAtMax((prev) => (prev === nextAtMax ? prev : nextAtMax));
  }, [resolvedMax, resolvedMin]);

  const syncAtMax = useCallback(
    (next: boolean) => {
      if (atMaxRef.current === next) return;
      atMaxRef.current = next;
      onMaxHeightReachedRef.current?.(next);
    },
    [],
  );

  // Sebelum paint, bukan sesudah: transisi 200ms hanya untuk border/cincin,
  // sehingga tinggi yang berubah di sini tidak pernah terlihat beranimasi.
  useLayoutEffect(() => {
    if (!autoResize) return;
    measure();
  }, [autoResize, measure, currentText]);

  // Mengumumkan transisi batas atas satu kali per perubahan, bukan setiap render.
  useEffect(() => {
    syncAtMax(isAtMax);
  }, [isAtMax, syncAtMax]);

  /**
   * Lebar dan tinggi elemen dapat berubah akibat faktor di luar nilai teks:
   * kata kunci memunculkan pesan galat, penghitung muncul, atau viewport
   * berputar. Semua itu mengubah jumlah baris yang muat, jadi ukur ulang.
   */
  useEffect(() => {
    if (!autoResize) return;
    const el = innerRef.current;
    if (!el) return;
    // Guard SSR + jaring pengaman untuk lingkungan uji yang belum punya ResizeObserver.
    if (typeof window === 'undefined' || typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(() => {
      measure();
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
    };
  }, [autoResize, measure]);

  /** Menumbuhkan kotak seketika itu juga saat huruf terakhir diketik. */
  const handleInput = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      const next = normalizeText(event.currentTarget.value);
      if (controlledValue === undefined) setObservedText(next);
      if (autoResize) measure();
      onInput?.(event);
    },
    [autoResize, controlledValue, measure, onInput],
  );

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      const next = normalizeText(event.currentTarget.value);
      if (controlledValue === undefined) setObservedText(next);
      if (autoResize) measure();
      onChange?.(event);
    },
    [autoResize, controlledValue, measure, onChange],
  );

  const handleScroll = useCallback(
    (event: UIEvent<HTMLTextAreaElement>) => {
      onScroll?.(event);
    },
    [onScroll],
  );

  /**
   * Enter di dalam <form> mengirimkan form. Di lapangan itu berarti laporan
   * setengah jadi terkirim hanya karena relawan menambah baris baru, jadi
   * Enter tetap menambah baris kecuali bersama Ctrl/Cmd (pintasan kirim).
   * Escape mengembalikan fokus, bukan menutup apa pun secara diam-diam.
   */
  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;
      if (event.key !== 'Enter' || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
        return;
      }
      const form = event.currentTarget.form;
      // Tanpa form, atau saat teks multi-baris, biarkan perilaku bawaan apa adanya.
      if (!form) return;
      const isMultiline = event.currentTarget.value.includes('\n');
      if (!isMultiline) event.preventDefault();
    },
    [onKeyDown],
  );

  /** Aksi "hapus": bersihkan DOM lalu state, agar kotak ikut menyusut seketika. */
  const handleClear = useCallback(() => {
    const el = innerRef.current;
    if (!el || disabled || readOnly) return;
    el.value = '';
    if (controlledValue === undefined) setObservedText('');
    if (autoResize) measure();
    el.focus({ preventScroll: false });
  }, [autoResize, controlledValue, disabled, measure, readOnly]);

  const showCounterRow = showCounter || (showClearButton && hasContent(currentText));

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

      <textarea
        ref={setRefs}
        id={fieldId}
        name={name}
        rows={rows}
        maxLength={effectiveMaxLength}
        value={value}
        defaultValue={defaultValue}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        readOnly={readOnly}
        autoComplete={autoComplete}
        // Urusan ejaan/autokoreksi diserahkan ke browser. Teks laporan lapangan
        // sering berupa nama tempat, jadi pemanggil dapat mematikan autokoreksi.
        spellCheck={spellCheck}
        // `aria-invalid` adalah satu-satunya pembawa status galat yang programatik.
        aria-invalid={hasError ? true : undefined}
        aria-required={required || undefined}
        aria-readonly={readOnly || undefined}
        // Penghitung tidak dimasukkan ke deskripsi: pembaca layar akan
        // membacakannya ulang di setiap penekanan tombol.
        aria-describedby={message ? messageId : undefined}
        onChange={handleChange}
        onInput={handleInput}
        onScroll={handleScroll}
        onKeyDown={handleKeyDown}
        className={cn(
          TEXTAREA_BASE,
          // Tanpa auto-resize, tinggi dikendalikan pengguna lewat gagang seret
          // vertikal: sumbu horizontal dikunci agar textarea tidak pernah
          // melewati lebar kolomnya di layar ponsel. Saat auto-resize aktif,
          // tinggi sudah dihitung sendiri sehingga gagang seret dimatikan.
          // Bisect di tengah string agar `textareaClassName` tetap menang.
          autoResize ? AUTOSIZE_FIT : 'resize-y',
          hasError ? BORDER_ERROR : BORDER_DEFAULT,
          textareaClassName,
        )}
        // Textarea tanpa auto-resize dibiarkan menggulir bebas seperti biasa.
        data-autoresize={autoResize ? 'true' : undefined}
        data-at-max={autoResize ? (isAtMax ? 'true' : 'false') : undefined}
        style={
          autoResize
            ? ({
                '--textarea-max-h': `${resolvedMax}px`,
                // `undefined` saat sudah di batas: kelas `max-h` yang berlaku.
                height: measuredHeight === null ? undefined : `${measuredHeight}px`,
              } as CSSPropertiesWithVars)
            : undefined
        }
        {...rest}
      />

      {showCounterRow ? (
        <div className="mt-2 flex min-h-6 flex-wrap items-center justify-between gap-2">
          <span className="flex min-w-0 items-center gap-1.5 text-xs text-ink-secondary">
            {effectiveMaxLength !== undefined ? (
              <>
                <CounterIcon />
                <span>
                  {isAtLimit
                    ? 'Batas karakter tercapai — perpendek pesan untuk menambah lagi.'
                    : 'Teks panjang tetap terbaca utuh.'}
                </span>
              </>
            ) : (
              <span>Tanpa batas karakter.</span>
            )}
          </span>

          <span className="flex shrink-0 items-center gap-2">
            {showCounter ? (
              <CharCounter
                id={counterId}
                chars={charCount}
                maxLength={effectiveMaxLength}
                hasError={hasError}
                isAtLimit={isAtLimit}
              />
            ) : null}

            {showClearButton && hasContent(currentText) ? (
              // Aksi sekunder, bukan aksi utama: gayanya sengaja tenang, tetapi
              // area ketuknya tetap ≥48px lewat padding negatif vertikal.
              <button
                type="button"
                onClick={handleClear}
                disabled={disabled || readOnly}
                className={cn(
                  'inline-flex min-h-12 items-center gap-1 px-1 text-xs font-semibold',
                  'rounded-lg text-ink-secondary',
                  'transition-colors duration-200 ease-crisp',
                  'hover:text-brand-primary focus-visible:outline-none',
                  'focus-visible:ring-2 focus-visible:ring-brand-primary/60',
                  'focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
                  'disabled:cursor-not-allowed disabled:opacity-50',
                )}
              >
                <ClearIcon />
                <span>Hapus</span>
              </button>
            ) : null}
          </span>
        </div>
      ) : null}

      {message ? <FieldMessage id={messageId} message={message} isError={hasError} /> : null}
    </div>
  );
});

/**
 * React hanya mengenal tipe `CSSProperties`, yang menolak properti CSS variable.
 * Intersection dipakai (bukan `extends`) agar properti bawaan tetap bertipe asli
 * — `extends` akan mempersempit seluruh nilai menjadi `string`.
 */
type CSSPropertiesWithVars = CSSProperties & Record<'--textarea-max-h', string>;

export default Textarea;
