'use client';

import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ImageOff, X } from 'lucide-react';

import { cn } from '../lib/cn';

/* -------------------------------------------------------------------------- */
/*  Kontrak data                                                               */
/* -------------------------------------------------------------------------- */

/** Satu item galeri. `src` dan `alt` wajib; `caption` opsional. */
export interface GalleryImage {
  /** URL gambar. Item tanpa `src` yang valid akan dilewati saat render. */
  src: string;
  /** Teks alternatif. Wajib diisi untuk aksesibilitas. */
  alt: string;
  /** Keterangan tambahan yang tampil di bawah gambar pada lightbox. */
  caption?: string;
}

export interface GalleryProps {
  /** Daftar gambar. Array kosong atau seluruh item tak valid → komponen tidak merender apa pun. */
  images: GalleryImage[];
  /** Jumlah kolom pada layar lebar. Di ponsel selalu satu kolom. Default: `3`. */
  columns?: 2 | 3;
  /** Kelas tambahan untuk cangkang galeri. */
  className?: string;
  /** Label aksesibilitas untuk grup galeri. Default: "Galeri foto". */
  label?: string;
  /** Tampilkan kolom keterangan di bawah setiap gambar pada grid. */
  showCaptions?: boolean;
  /** Kelas tambahan untuk tiap sel grid. */
  itemClassName?: string;
}

/* -------------------------------------------------------------------------- */
/*  Konstanta gaya                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Semua warna dibaca dari token `brand.*` dan netral editorial, sehingga satu
 * komponen melayani `.theme-jagatirta` (teal/navy) maupun `.theme-zamroed`
 * (emerald/gold) tanpa satu pun hex yang dikunci.
 */
const GRID_GAP = 'gap-3';

const GRID_COLUMNS: Record<2 | 3, string> = {
  // Ponsel: satu kolom. Tablet: sebagian. Desktop: sesuai permintaan.
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
};

/** Target sentuh minimal 48px untuk sel grid maupun tombol lightbox. */
const TILE_BASE = [
  'group relative block w-full min-h-[48px] overflow-hidden rounded-xl',
  'border border-editorial bg-canvas',
  'transition-[transform,box-shadow,border-color] duration-300 ease-crisp',
  'hover:-translate-y-0.5 hover:border-brand-primary hover:shadow-lg',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent',
  'focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
  'motion-safe:active:translate-y-0',
].join(' ');

const OVERLAY_BASE = [
  'relative flex min-h-[48px] w-full items-center justify-center rounded-xl',
  'border border-transparent text-white',
  'transition-colors duration-200 ease-crisp',
  'hover:bg-white/20 focus-visible:bg-white/20',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent',
].join(' ');

/* -------------------------------------------------------------------------- */
/*  Utilitas                                                                   */
/* -------------------------------------------------------------------------- */

/** Filter defensif: buang entri tanpa `src` yang dapat dipakai. */
function normalizeImages(images: GalleryImage[] | null | undefined): GalleryImage[] {
  if (!Array.isArray(images)) return [];

  return images.filter(
    (image): image is GalleryImage =>
      Boolean(image) && typeof image.src === 'string' && image.src.trim().length > 0,
  );
}

/** Jaga indeks tetap di dalam rentang; NaN/Infinity/−1 dikembalikan ke 0. */
function clampIndex(index: number, length: number): number {
  if (!Number.isFinite(length) || length <= 0) return 0;
  if (!Number.isFinite(index)) return 0;

  return Math.min(Math.max(Math.trunc(index), 0), length - 1);
}

/* -------------------------------------------------------------------------- */
/*  Gallery                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Galeri foto responsif dengan lightbox ringan untuk halaman Jagatirta dan
 * ZAMROED Bergerak.
 *
 * - Grid CSS `gap-3` + `rounded-xl` dengan tumpukan media yang terpotong rapi.
 * - Lightbox: overlay penuh, latar gelap, gambar di tengah, ditutup lewat
 *   tombol X, klik backdrop, atau tombol Escape.
 * - Scroll `body` terkunci selama lightbox terbuka, dan kunci dilepas lagi
 *   saat ditutup maupun saat komponen dilepas dari DOM.
 * - Bila galeri memuat lebih dari satu gambar, tersedia navigasi geser
 *   (tombol, tanda panah, Home/End) sehingga relawan dapat menelusuri foto
 *   tanpa menutup lightbox.
 * - Aksesibel: `role="dialog"`, `aria-modal`, fokus otomatis ke tombol tutup,
 *   fokus dikembalikan ke gambar asal saat ditutup, dan target sentuh ≥ 48px.
 *
 * Client component (memakai state, effect, dan event handler).
 *
 * @example
 * ```tsx
 * <Gallery
 *   columns={3}
 *   images={[
 *     { src: '/foto/ciliwung-1.jpg', alt: 'Relawan mengukur pH Ciliwung', caption: 'Uji air pekan ke-12' },
 *     { src: '/foto/ciliwung-2.jpg', alt: 'Sedimentasi tepi sungai' },
 *   ]}
 * />
 * ```
 */
export function Gallery({
  images,
  columns = 3,
  className,
  label = 'Galeri foto',
  showCaptions = false,
  itemClassName,
}: GalleryProps) {
  const items = useMemo(() => normalizeImages(images), [images]);

  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [failed, setFailed] = useState<ReadonlySet<number>>(() => new Set<number>());

  const dialogId = useId();
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const triggerRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const lastFocusedRef = useRef<Element | null>(null);

  const total = items.length;
  const safeIndex = activeIndex === null ? null : clampIndex(activeIndex, total);
  const active = safeIndex === null ? null : (items[safeIndex] ?? null);
  const isOpen = active !== null;
  const hasMultiple = total > 1;

  /* ---------------------------------------------------------------------- */
  /*  Buka / tutup / navigasi                                               */
  /* ---------------------------------------------------------------------- */

  const openAt = useCallback((index: number) => {
    setActiveIndex(clampIndex(index, total));
  }, [total]);

  const close = useCallback(() => {
    setActiveIndex(null);
  }, []);

  const step = useCallback((delta: number) => {
    setActiveIndex((current) => {
      if (current === null || total <= 1) return current;
      const base = clampIndex(current, total);
      // Modulo aman: `total > 1` sehingga tidak mungkin membagi dengan nol.
      return (base + delta + total) % total;
    });
  }, [total]);

  /* ---------------------------------------------------------------------- */
  /*  Efek: kunci scroll, Escape, panah, fokus, jebakan Tab                  */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (!isOpen) return;

    // SSR-safe: seluruh akses DOM hanya berjalan di klien setelah mount.
    if (typeof document === 'undefined' || typeof window === 'undefined') return;

    const { body, documentElement: html } = document;
    const previousOverflow = body.style.overflow;
    const previousPaddingRight = body.style.paddingRight;

    // Kompensasi hilangnya scrollbar agar layout tidak melompat.
    const scrollbarWidth = Math.max(0, window.innerWidth - html.clientWidth);
    const previousHtmlOverflow = html.style.overflow;

    body.style.overflow = 'hidden';
    html.style.overflow = 'hidden';
    if (scrollbarWidth > 0) {
      const currentPadding = Number.parseFloat(window.getComputedStyle(body).paddingRight);
      body.style.paddingRight = `${(Number.isFinite(currentPadding) ? currentPadding : 0) + scrollbarWidth}px`;
    }

    lastFocusedRef.current = document.activeElement;

    // Fokus berpindah ke tombol tutup — titik keluar yang paling pasti.
    const focusFrame = window.requestAnimationFrame(() => {
      closeButtonRef.current?.focus();
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        step(1);
        return;
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        step(-1);
        return;
      }

      if (event.key === 'Home') {
        event.preventDefault();
        setActiveIndex(0);
        return;
      }

      if (event.key === 'End') {
        event.preventDefault();
        setActiveIndex(total - 1);
        return;
      }

      if (event.key !== 'Tab') return;

      // Jebakan fokus sederhana: dialog hanya berisi kontrol internal.
      const container = dialogRef.current;
      if (!container) return;

      const focusables = Array.from(
        container.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((node) => node.offsetParent !== null);

      if (focusables.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const current = document.activeElement;

      if (event.shiftKey && (current === first || current === null)) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && current === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      window.cancelAnimationFrame(focusFrame);

      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPaddingRight;
      html.style.overflow = previousHtmlOverflow;

      // Kembalikan fokus ke gambar yang dibuka; fallback ke <body>.
      const target = lastFocusedRef.current;
      if (target instanceof HTMLElement) {
        target.focus({ preventScroll: true });
      }
      lastFocusedRef.current = null;
    };
  }, [isOpen, close, step, total]);

  // Bila daftar gambar berubah/berkurang saat lightbox terbuka, jaga indeks.
  useEffect(() => {
    setActiveIndex((current) => {
      if (current === null) return current;
      if (total === 0) return null;
      return clampIndex(current, total);
    });
  }, [total]);

  const markFailed = useCallback((index: number) => {
    setFailed((previous) => {
      if (previous.has(index)) return previous;
      const next = new Set(previous);
      next.add(index);
      return next;
    });
  }, []);

  /* ---------------------------------------------------------------------- */
  /*  Empty state                                                           */
  /* ---------------------------------------------------------------------- */

  if (total === 0) {
    return null;
  }

  /* ---------------------------------------------------------------------- */
  /*  Render                                                                */
  /* ---------------------------------------------------------------------- */

  return (
    <>
      <ul
        role="list"
        aria-label={label}
        data-columns={columns}
        className={cn(
          'grid w-full list-none overflow-hidden rounded-xl p-0',
          GRID_GAP,
          GRID_COLUMNS[columns],
          className,
        )}
      >
        {items.map((image, index) => {
          const isFailed = failed.has(index);

          return (
            <li key={`${image.src}-${index}`} className="relative min-w-0">
              <button
                ref={(node) => {
                  triggerRefs.current[index] = node;
                }}
                type="button"
                onClick={() => openAt(index)}
                aria-haspopup="dialog"
                aria-expanded={safeIndex === index}
                aria-controls={safeIndex === index ? dialogId : undefined}
                className={cn(TILE_BASE, 'text-left', itemClassName)}
              >
                {isFailed ? (
                  <span className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 bg-canvas px-4 text-center text-xs font-medium text-ink-secondary">
                    <ImageOff aria-hidden="true" className="h-6 w-6 text-brand-primary" />
                    <span>Gambar tidak dapat dimuat</span>
                  </span>
                ) : (
                  <img
                    src={image.src}
                    alt={image.alt}
                    loading="lazy"
                    decoding="async"
                    onError={() => markFailed(index)}
                    className={cn(
                      'aspect-[4/3] w-full object-cover',
                      'transition-transform duration-500 ease-crisp motion-safe:group-hover:scale-[1.04]',
                    )}
                  />
                )}

                {/* Lapisan gelap: muncul saat hover/fokus, hilang untuk pembaca layar. */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 flex items-end justify-between gap-2 bg-gradient-to-t from-brand-deep/75 via-brand-deep/10 to-transparent p-3 opacity-0 transition-opacity duration-300 ease-crisp group-hover:opacity-100 group-focus-visible:opacity-100"
                >
                  <span className="line-clamp-2 text-xs font-semibold leading-snug text-white">
                    {showCaptions && image.caption ? image.caption : 'Perbesar foto'}
                  </span>
                </span>

                <span aria-hidden="true" className="sr-only">
                  {`Buka ${image.alt} dalam tampilan besar`}
                </span>
              </button>

              {/* Keterangan permanen di bawah gambar — kontras tinggi untuk layar luar ruangan. */}
              {showCaptions && image.caption ? (
                <p className="mt-2 line-clamp-2 text-xs leading-snug text-ink-secondary">
                  {image.caption}
                </p>
              ) : null}
            </li>
          );
        })}
      </ul>

      {isOpen && active ? (
        <div
          id={dialogId}
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={label}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 backdrop-blur-sm sm:p-6"
        >
          {/* Backdrop: klik di luar gambar menutup lightbox. */}
          <button
            type="button"
            aria-label="Tutup tampilan besar"
            tabIndex={-1}
            onClick={close}
            className="absolute inset-0 h-full w-full cursor-default focus-visible:outline-none"
          />

          <div className="relative flex w-full max-w-5xl flex-col gap-3">
            <div className="pointer-events-none flex items-start justify-between gap-3">
              <p className="pointer-events-auto rounded-lg bg-black/45 px-3 py-1.5 text-xs font-medium tabular-nums text-white">
                {`Foto ${(safeIndex ?? 0) + 1} dari ${total}`}
              </p>

              <button
                ref={closeButtonRef}
                type="button"
                onClick={close}
                aria-label="Tutup tampilan besar"
                className="pointer-events-auto inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-white/25 bg-black/50 text-white transition-colors duration-200 ease-crisp hover:border-brand-accent hover:bg-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-black"
              >
                <X aria-hidden="true" className="h-6 w-6" />
              </button>
            </div>

            <figure className="flex min-w-0 flex-col items-center gap-3">
              <div className="relative flex max-h-[70vh] w-full items-center justify-center">
                <img
                  src={active.src}
                  alt={active.alt}
                  decoding="async"
                  className="max-h-[70vh] w-auto max-w-full rounded-xl object-contain shadow-2xl"
                />

                {hasMultiple ? (
                  <>
                    <button
                      type="button"
                      onClick={() => step(-1)}
                      aria-label="Foto sebelumnya"
                      className={cn(
                        OVERLAY_BASE,
                        'absolute bottom-0 left-0 top-0 w-14 sm:w-16',
                      )}
                    >
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/55">
                        <ChevronLeft aria-hidden="true" className="h-6 w-6" />
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => step(1)}
                      aria-label="Foto berikutnya"
                      className={cn(
                        OVERLAY_BASE,
                        'absolute bottom-0 right-0 top-0 w-14 sm:w-16',
                      )}
                    >
                      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-black/55">
                        <ChevronRight aria-hidden="true" className="h-6 w-6" />
                      </span>
                    </button>
                  </>
                ) : null}
              </div>

              <figcaption className="max-w-2xl text-center">
                <span className="block text-sm font-medium leading-relaxed text-white text-balance">
                  {active.alt}
                </span>
                {active.caption ? (
                  <span className="mt-1 block text-xs leading-relaxed text-white/70">
                    {active.caption}
                  </span>
                ) : null}
              </figcaption>
            </figure>

            {hasMultiple ? (
              <p aria-hidden="true" className="text-center text-[11px] tracking-wide text-white/60">
                Gunakan tombol panah kiri/kanan untuk berpindah foto, Escape untuk menutup.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}

export default Gallery;
