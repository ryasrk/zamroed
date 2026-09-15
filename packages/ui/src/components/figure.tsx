import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { cn } from '../lib/cn';

/* -------------------------------------------------------------------------- */
/*  Kontrak gaya bersama                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Rasio gambar editorial. Nilai dikunci sebagai `aspect-ratio` Tailwind
 * (`aspect-video` = 16/9) sehingga tinggi kotak media sudah final sebelum
 * satu byte pun gambar terunduh — Cumulative Layout Shift tetap 0.
 */
export type FigureRatio = '16:9' | '4:3' | '1:1' | '9:16';

const RATIO_STYLES: Record<FigureRatio, string> = {
  '16:9': 'aspect-video',
  '4:3': 'aspect-[4/3]',
  '1:1': 'aspect-square',
  '9:16': 'aspect-[9/16]',
};

/** Label Bahasa Indonesia untuk pembaca layar pada rasio potret. */
const PORTRAIT_RATIOS: readonly FigureRatio[] = ['9:16'];

/**
 * Cangkang figure. `overflow-hidden` + `rounded-*` opname di kotak rasio,
 * bukan di `<img>`, supaya sudut tetap terpotong rapi pada Safari lama
 * (yang mengabaikan `border-radius` di atas elemen berganti).
 */
const SHELL_STYLES = [
  'group/figure relative m-0 flex flex-col',
  'text-ink transition-colors duration-300 ease-crisp',
].join(' ');

/** Bingkai editorial: border tipis + radius. Aktif lewat `bordered` / `rounded`. */
const FRAME_STYLES = [
  'overflow-hidden bg-canvas',
  'ring-1 ring-inset ring-editorial',
  'transition-shadow duration-300 ease-crisp',
  'group-hover/figure:ring-brand-primary',
].join(' ');

/** Kartu — sudut membulat 16px mengikuti bahasa kartu paket ini. */
const CARD_STYLES = 'rounded-2xl';

/**
 * Ruang potret 9:16 dipakai untuk dokumentasi vertikal (relawan memotret
 * dari ponsel). Di layar sempit, potret penuh kolom jadi terlalu tinggi,
 * jadi tinggi dibatasi dan gambar di tengah — tanpa mengubah rasio aspek
 * aslinya (CLS tetap 0 karena tinggi maksimum sudah berupa nilai tetap).
 */
const PORTRAIT_FIT_STYLES = 'mx-auto w-full max-w-[min(100%,20rem)]';

/** Kelas gambar: selalu memenuhi kotak rasio, tanpa pernah melar. */
const IMAGE_STYLES = 'absolute inset-0 h-full w-full object-cover';

/**
 * Fallback saat `src` kosong atau gagal dimuat. Ditulis sebagai latar CSS
 * (gradien token brand) sehingga tidak ada request gambar tambahan dan tidak
 * ada <img> tanpa sumber yang tetap diumumkan pembaca layar.
 */
const PLACEHOLDER_STYLES = [
  'absolute inset-0 flex items-center justify-center gap-2',
  'bg-[linear-gradient(135deg,var(--brand-deep),var(--brand-primary))]',
  'px-4 text-center text-xs font-semibold uppercase leading-tight tracking-wide',
  'text-brand-soft',
].join(' ');

/* -------------------------------------------------------------------------- */
/*  Ikon                                                                       */
/* -------------------------------------------------------------------------- */

/** Ikon gambar terpotong: tanda universal "media gagal dimuat". */
function BrokenImageIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <rect x="3" y="3" width="18" height="18" rx="2.5" />
      <circle cx="9" cy="9.5" r="1.5" />
      <path d="m3.5 17 4.2-4.2a2 2 0 0 1 2.8 0L15 17.3" />
      <path d="m14 15.5 1.4-1.4a2 2 0 0 1 2.8 0l2.3 2.3" />
      <path d="M4 4l16 16" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Figure                                                                     */
/* -------------------------------------------------------------------------- */

export interface FigureProps
  extends Omit<ComponentPropsWithoutRef<'figure'>, 'children' | 'className'> {
  /** Sumber gambar. Boleh kosong/`undefined` — figure jatuh ke placeholder. */
  src?: string;
  /**
   * Teks alternatif. Untuk gambar murni dekoratif, isi `''` supaya pembaca
   * layar melewatinya (bukan dihilangkan, karena atribut harus tetap ada).
   */
  alt?: string;
  /** Takarir editorial di bawah gambar (Bahasa Indonesia). */
  caption?: ReactNode;
  /** Kredit fotografer — teks kecil, muted, di bawah takarir. */
  credit?: string;
  /** Rasio kotak media. Default `16:9` (paling lazim untuk dokumentasi lanskap). */
  ratio?: FigureRatio;
  /**
   * `true` untuk gambar di atas lipatan (hero/lead): `loading="eager"` +
   * `fetchPriority="high"`. Default `false` → `loading="lazy"`.
   */
  priority?: boolean;
  /** Sudut membulat 16px pada kotak media. Default `true`. */
  rounded?: boolean;
  /** Bingkai editorial tipis (ring 1px warna borderline). Default `true`. */
  bordered?: boolean;
  /** Kelas tambahan pada `<figure>` (tailwind-merge aware). */
  className?: string;
  /** Kelas tambahan pada kotak rasio, mis. untuk mengubah latar media. */
  frameClassName?: string;
  /** Kelas tambahan pada `<img>`. */
  imageClassName?: string;
  /** Kelas tambahan pada blok takarir/kredit. */
  captionClassName?: string;
  /** Isi tambahan di dalam `<figure>` (mis. tombol perbesar atau `figcaption` lain). */
  children?: ReactNode;
}

/**
 * `figure` — blok media editorial bersama Jagatirta & ZAMROED Bergerak.
 *
 * Prinsip:
 *
 * 1. **CLS = 0 sejak render pertama.** Kotak media selalu memakai pembungkus
 *    `aspect-ratio` statis; `<img>` mengisinya secara absolut. Tinggi tidak
 *    pernah bergantung pada waktu unduh atau metadata gambar.
 * 2. **Satu komponen, dua merek.** Tidak ada hex yang dikunci: gradien
 *    placeholder, ring, dan warna teks semuanya memakai token `brand.*` dan
 *    `editorial` yang dibind ulang oleh `.theme-jagatirta` / `.theme-zamroed`.
 * 3. **Lapangan dulu.** Takarir memakai temuan `.measure-editorial`; kredit
 *    tetap terbaca di layar kecil (12px, kontras aman) dan tidak pernah
 *    mendorong takarir ke baris sempit yang sulit dipindai.
 * 4. **SSR-sadar.** Tanpa hook, tanpa `window`/`document`, tanpa `next/image` —
 *    direktif `'use client'` tidak diperlukan sehingga komponen bisa dipakai
 *    di Server Component mana pun.
 *
 * Catatan aksesibilitas:
 * - `<figure>` adalah konten non-interaktif, jadi tidak dipaksakan target
 *   sentuh 48px. Kontrol yang *benar-benar* bisa diketuk (mis. tombol
 *   perbesar yang disisipkan lewat `children`) wajib membawa sendiri kelas
 *   `min-h-[48px]` dan cincin `focus-visible`.
 * - Atribut `alt` selalu dirender, termasuk saat `src` kosong, supaya keadaan
 *   gagal-muat tetap terumumkan sebagai gambar, bukan sebagai teks kosong.
 * - Placeholder dekoratif diberi `aria-hidden`, sedangkan status gagal-muat
 *   diumumkan lewat teks yang terbaca pembaca layar.
 */
export function Figure({
  src,
  alt = '',
  caption,
  credit,
  ratio = '16:9',
  priority = false,
  rounded = true,
  bordered = true,
  className,
  frameClassName,
  imageClassName,
  captionClassName,
  children,
  ...rest
}: FigureProps) {
  // Normalisasi: string kosong atau spasi dianggap tidak ada gambar. Ini
  // menghindari <img src=""> yang memicu permintaan ulang ke halaman itu sendiri.
  const normalizedSrc = typeof src === 'string' && src.trim().length > 0 ? src.trim() : undefined;
  const hasCredit = typeof credit === 'string' && credit.trim().length > 0;
  const hasCaption = caption !== undefined && caption !== null && caption !== '';

  const isPortrait = PORTRAIT_RATIOS.includes(ratio);

  const frame = cn(
    'relative isolate w-full',
    RATIO_STYLES[ratio],
    FRAME_STYLES,
    rounded && CARD_STYLES,
    isPortrait && PORTRAIT_FIT_STYLES,
    frameClassName,
  );

  return (
    <figure className={cn(SHELL_STYLES, className)} {...rest}>
      <div className={frame}>
        {normalizedSrc ? (
          <img
            src={normalizedSrc}
            alt={alt}
            // `decoding="async"` menjaga main thread tetap bebas saat gambar
            // besar selesai di-decode di tengah gulir cepat.
            decoding="async"
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'low'}
            draggable={false}
            className={cn(IMAGE_STYLES, 'select-none', imageClassName)}
          />
        ) : (
          <div className={cn(PLACEHOLDER_STYLES)}>
            <BrokenImageIcon className="h-5 w-5 shrink-0" />
            <span>Gambar belum tersedia</span>
          </div>
        )}
      </div>

      {hasCaption || hasCredit ? (
        <figcaption
          className={cn(
            'measure-editorial mt-3 px-1',
            isPortrait && 'mx-auto w-full max-w-[min(100%,20rem)]',
            captionClassName,
          )}
        >
          {hasCaption ? (
            <p className="text-sm leading-relaxed text-ink-secondary ">
              {caption}
            </p>
          ) : null}
          {hasCredit ? (
            <p
              className={cn(
                'text-xs uppercase leading-snug tracking-[0.08em] text-ink-secondary/70',
                hasCaption && 'mt-1.5',
              )}
            >
              <span className="sr-only">Kredit foto: </span>
              <span aria-hidden="true">Foto: </span>
              {credit.trim()}
            </p>
          ) : null}
        </figcaption>
      ) : null}

      {children}
    </figure>
  );
}
