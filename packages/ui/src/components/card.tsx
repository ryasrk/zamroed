import type { AnchorHTMLAttributes, HTMLAttributes, ReactNode } from 'react';

import { cn } from '../lib/cn';

/* -------------------------------------------------------------------------- */
/*  Kontrak gaya bersama                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Seluruh token di bawah digerakkan oleh CSS variable (`brand.*`, `surface`,
 * `ink`, `editorial`, `canvas`) sehingga satu definisi kartu melayani
 * `.theme-jagatirta` maupun `.theme-zamroed` tanpa satu pun hex yang dikunci.
 */

/**
 * Ritme vertikal kartu. Setiap bagian memiliki padding atas sendiri, lalu
 * bagian yang *mengikuti* bagian kartu lain kehilangan padding atasnya —
 * sehingga jarak antar bagian selalu satu kali lipat, tidak pernah ganda.
 *
 * Pemilihnya berpasangan `[data-slot=…]~[data-slot=…]` (bukan `:first-child`)
 * supaya media yang mepet tepi (mis. `<img/>` sebagai anak pertama) tetap
 * flush, sementara bagian setelahnya tetap mendapat padding atas.
 */
const CARD_RHYTHM = [
  '[&>[data-slot=card-header]~[data-slot=card-body]]:pt-0',
  '[&>[data-slot=card-header]~[data-slot=card-footer]]:pt-0',
  '[&>[data-slot=card-body]~[data-slot=card-footer]]:pt-0',
].join(' ');

/** Cangkang kartu: permukaan editorial, border tipis, radius 16, media terpotong. */
const CARD_SHELL = [
  'group/card relative flex flex-col overflow-hidden rounded-2xl',
  // Kartu dirender sebagai `<a>` saat `href` diisi; jangan warisi dekorasi dan
  // warna tautan bawaan agar isi kartu tetap memakai `ink`/`ink-secondary`.
  'no-underline [color:inherit]',
  'border border-editorial bg-surface text-ink shadow-sm',
  CARD_RHYTHM,
].join(' ');

/**
 * Perlakuan interaktif: kartu terangkat, bayangan menguat, dan border
 * mengambil warna brand aktif — baik saat hover maupun saat fokus berada
 * di dalamnya (penting untuk navigasi keyboard pada kartu tautan).
 */
const CARD_INTERACTIVE = [
  'cursor-pointer transition-[transform,box-shadow,border-color] duration-300 ease-crisp',
  'hover:-translate-y-1 hover:border-brand-primary hover:shadow-lg',
  'focus-within:-translate-y-1 focus-within:border-brand-primary focus-within:shadow-lg',
].join(' ');

/** Afordans tautan bawaan: dapat dijangkau keyboard, cincin fokus jelas. */
const CARD_LINK = [
  'min-h-[48px] no-underline',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary',
  'focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
  'active:translate-y-0 active:shadow-sm',
].join(' ');

/**
 * Relawan lapangan mengetuk dengan ibu jari, di luar ruangan, pada layar
 * kecil. Ancla dan tombol yang langsung berada di dalam slot mendapat target
 * sentuh minimal 48px.
 */
const TAP_TARGET = [
  '[&>a]:inline-flex [&>a]:min-h-[48px] [&>a]:items-center [&>a]:justify-center',
  '[&>button]:inline-flex [&>button]:min-h-[48px] [&>button]:items-center [&>button]:justify-center',
].join(' ');

/** Padding bagian: horizontal responsif, vertikal tetap agar ritme terukur. */
const SECTION_PAD = 'px-5 py-5 sm:px-6';

/* -------------------------------------------------------------------------- */
/*  Card                                                                       */
/* -------------------------------------------------------------------------- */

export interface CardProps extends HTMLAttributes<HTMLElement> {
  /**
   * Aktifkan perlakuan interaktif: kartu terangkat, border membranding, dan
   * bayangan menguat saat hover atau saat fokus berada di dalamnya.
   */
  interactive?: boolean;
  /**
   * Bila diisi, kartu dirender sebagai `<a>` sehingga fokus keyboard, klik
   * tengah, dan "buka di tab baru" bekerja tanpa JavaScript.
   *
   * Jangan menempatkan `<a>` lain di dalam kartu bila memakai `href` — tautan
   * bersarang bukan HTML yang valid. Gunakan `interactive` bila bagian dalam
   * kartu perlu tautannya sendiri.
   */
  href?: string;
  /** Target tautan — hanya berlaku bila `href` diisi. */
  target?: AnchorHTMLAttributes<HTMLAnchorElement>['target'];
  /** Rel tautan — hanya berlaku bila `href` diisi. */
  rel?: string;
}

/**
 * Wadah konten editorial untuk kartu sungai, artikel, program, dan kampanye.
 *
 * @example Kartu sungai sebagai satu tautan utuh
 * ```tsx
 * <Card interactive href="/sungai/ciliwung">
 *   <CardHeader action={<StatusBadge status="warning" />}>
 *     <CardTitle>Sungai Ciliwung</CardTitle>
 *   </CardHeader>
 *   <CardBody>Indeks kualitas air menurun pada segmen Jakarta Selatan.</CardBody>
 *   <CardFooter divider>Diperbarui 2 jam lalu</CardFooter>
 * </Card>
 * ```
 *
 * @example Kartu artikel dengan media mepet tepi dan tautan di footer
 * ```tsx
 * <Card interactive>
 *   <img src={cover} alt="" className="aspect-[16/9] w-full object-cover" />
 *   <CardHeader>
 *     <CardTitle as="h2">{article.title}</CardTitle>
 *   </CardHeader>
 *   <CardBody>{article.excerpt}</CardBody>
 *   <CardFooter divider>
 *     <a href={`/artikel/${article.slug}`}>Baca selengkapnya</a>
 *   </CardFooter>
 * </Card>
 * ```
 */
export function Card({
  interactive = false,
  href,
  target,
  rel,
  className,
  children,
  ...rest
}: CardProps) {
  const shellClassName = cn(CARD_SHELL, interactive && CARD_INTERACTIVE, className);

  if (typeof href === 'string' && href.length > 0) {
    return (
      <a
        data-slot="card"
        href={href}
        target={target}
        rel={rel}
        className={cn(shellClassName, CARD_LINK)}
        {...rest}
      >
        {children}
      </a>
    );
  }

  return (
    <div data-slot="card" className={shellClassName} {...rest}>
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  CardHeader                                                                 */
/* -------------------------------------------------------------------------- */

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  /** Slot sisi kanan — badge status, tombol aksi, atau meta singkat. */
  action?: ReactNode;
  /** Garis pemisah editorial di bawah header. */
  divider?: boolean;
}

/** Bagian atas kartu: judul, sub-judul, dan slot aksi yang sejajar kanan. */
export function CardHeader({
  action,
  divider = false,
  className,
  children,
  ...rest
}: CardHeaderProps) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        'flex flex-col gap-3',
        SECTION_PAD,
        divider && 'border-b border-editorial',
        className,
      )}
      {...rest}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">{children}</div>
        {action ? <div className={cn('flex shrink-0 items-center', TAP_TARGET)}>{action}</div> : null}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  CardTitle                                                                  */
/* -------------------------------------------------------------------------- */

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  /** Tingkat heading — ikuti hierarki halaman, bukan ukuran teks. */
  as?: 'h2' | 'h3' | 'h4';
}

/** Judul kartu. Default `<h3>`; naikkan ke `<h2>` bila kartu setingkat bagian. */
export function CardTitle({ as = 'h3', className, children, ...rest }: CardTitleProps) {
  const Heading = as;

  return (
    <Heading
      data-slot="card-title"
      className={cn(
        'font-display text-lg font-semibold leading-snug tracking-tight text-ink text-balance',
        'sm:text-xl',
        className,
      )}
      {...rest}
    >
      {children}
    </Heading>
  );
}

/* -------------------------------------------------------------------------- */
/*  CardBody                                                                   */
/* -------------------------------------------------------------------------- */

export type CardBodyProps = HTMLAttributes<HTMLDivElement>;

/** Isi kartu. Mengisi ruang sisa (`flex-1`) agar footer selalu sejajar bawah. */
export function CardBody({ className, children, ...rest }: CardBodyProps) {
  return (
    <div
      data-slot="card-body"
      className={cn('flex-1 text-sm leading-relaxed text-ink-secondary', SECTION_PAD, className)}
      {...rest}
    >
      {children}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  CardFooter                                                                 */
/* -------------------------------------------------------------------------- */

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  /** Garis pemisah editorial di atas footer. */
  divider?: boolean;
}

/** Kaki kartu: tautan aksi, meta waktu, atau nama relawan pemeriksa. */
export function CardFooter({ divider = false, className, children, ...rest }: CardFooterProps) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        'mt-auto flex flex-wrap items-center gap-3',
        SECTION_PAD,
        TAP_TARGET,
        divider && 'border-t border-editorial',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
