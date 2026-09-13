import type { ElementType, HTMLAttributes, ReactNode } from 'react';
import { cn } from '../lib/cn';

/** Element the editorial wrapper can render as. */
export type ProseElement = 'div' | 'article' | 'section';

/** Reading scale — body size / line-height pair for the whole flow. */
export type ProseSize = 'compact' | 'default' | 'lead';

/** Horizontal measure of the text column. */
export type ProseWidth = 'narrow' | 'editorial' | 'wide' | 'full';

export interface ProseProps
  extends Omit<HTMLAttributes<HTMLElement>, 'className' | 'children'> {
  /** Long-form content (artikel, narasi program, siaran pers, …). */
  children: ReactNode;
  /** Extra classes merged onto the wrapper (tailwind-merge aware). */
  className?: string;
  /** Rendered element. Use `article` for a standalone editorial piece. */
  as?: ProseElement;
  /** Body scale. `default` = 16px/1.65 mobile → 18px/1.7 desktop. */
  size?: ProseSize;
  /** Text column measure. `editorial` = 740px. */
  width?: ProseWidth;
  /** Drop-cap pada paragraf pembuka (huruf awal besar berwarna brand). */
  dropCap?: boolean;
}

const SIZE_STYLES: Record<ProseSize, string> = {
  compact: 'text-sm leading-[1.6] md:text-base md:leading-[1.65]',
  default: 'text-base leading-[1.65] md:text-[1.125rem] md:leading-[1.7]',
  lead: 'text-[1.0625rem] leading-[1.7] md:text-[1.25rem] md:leading-[1.75]',
};

const WIDTH_STYLES: Record<ProseWidth, string> = {
  narrow: 'max-w-[34rem]',
  editorial: 'max-w-editorial',
  wide: 'max-w-4xl',
  full: 'max-w-none',
};

/**
 * Pembungkus tipografi editorial untuk teks panjang.
 *
 * Sengaja ditulis manual dengan arbitrary child selector Tailwind
 * (`[&>h2]:…`) — bukan plugin `@tailwindcss/typography` yang tidak terpasang —
 * sehingga setiap aturan terlihat, mudah di-tweak, dan bebas dependensi.
 *
 * Seluruh warna diikat ke token `brand.*` / `gold.*` / `ink` yang berbasis
 * CSS variable, sehingga satu komponen melayani dua merek: Jagatirta
 * (`.theme-jagatirta`) dan ZAMROED Bergerak (`.theme-zamroed`).
 *
 * Catatan aksesibilitas: tautan di dalam alinea mengikuti pengecualian
 * "inline" WCAG 2.5.8 — ia adalah teks, bukan kontrol berdiri sendiri, jadi
 * tidak dipaksa berukuran 48px. Kontrol yang benar-benar bisa diketuk
 * (tombol bagikan, daftar isi) wajib dibungkus target 48px oleh pemanggil.
 */
export function Prose({
  children,
  className,
  as = 'div',
  size = 'default',
  width = 'editorial',
  dropCap = false,
  ...rest
}: ProseProps) {
  const Tag = as as ElementType;

  return (
    <Tag
      data-slot="prose"
      className={cn(
        // --- Dasar: ritme baca yang nyaman ---
        'text-ink antialiased',
        SIZE_STYLES[size],
        WIDTH_STYLES[width],

        // Tidak ada margin gantung di tepi atas/bawah
        '[&>*:first-child]:mt-0',
        '[&>*:last-child]:mb-0',

        // --- Judul ---
        '[&>h1]:font-display [&>h1]:text-3xl [&>h1]:font-bold [&>h1]:leading-tight [&>h1]:tracking-tight [&>h1]:text-brand-deep [&>h1]:mb-6 [&>h1]:scroll-mt-24 md:[&>h1]:text-4xl',
        '[&>h2]:font-display [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:leading-snug [&>h2]:tracking-tight [&>h2]:text-brand-deep [&>h2]:mt-12 [&>h2]:mb-4 [&>h2]:scroll-mt-24 md:[&>h2]:text-3xl',
        '[&>h3]:font-display [&>h3]:text-xl [&>h3]:font-semibold [&>h3]:leading-snug [&>h3]:text-brand-deep [&>h3]:mt-10 [&>h3]:mb-3 [&>h3]:scroll-mt-24 md:[&>h3]:text-2xl',
        '[&>h4]:text-lg [&>h4]:font-semibold [&>h4]:leading-snug [&>h4]:text-ink [&>h4]:mt-8 [&>h4]:mb-2',
        // Sub-judul yang menempel induknya dibaca sebagai satu blok
        '[&>h2+h3]:mt-6',
        '[&>h3+h4]:mt-6',

        // --- Paragraf & penekanan ---
        '[&>p]:mb-6 [&>p]:text-ink',
        '[&_strong]:font-semibold [&_strong]:text-ink',
        '[&_em]:italic',
        '[&_small]:text-sm [&_small]:text-ink-secondary',

        // --- Tautan: brand-primary, underline offset, fokus jelas ---
        '[&_a]:font-medium [&_a]:text-brand-primary [&_a]:underline [&_a]:decoration-2 [&_a]:decoration-brand-accent [&_a]:underline-offset-4 [&_a]:rounded-sm [&_a]:transition-colors [&_a]:duration-200 [&_a]:ease-crisp',
        '[&_a:hover]:text-brand-deep',
        '[&_a:focus-visible]:outline-none [&_a:focus-visible]:ring-2 [&_a:focus-visible]:ring-brand-primary [&_a:focus-visible]:ring-offset-2 [&_a:focus-visible]:ring-offset-canvas',

        // --- Daftar ---
        '[&>ul]:list-disc [&>ul]:pl-6 [&>ul]:mb-6 [&>ul]:space-y-2 [&>ul]:marker:text-brand-primary',
        '[&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:mb-6 [&>ol]:space-y-2 [&>ol]:marker:font-semibold [&>ol]:marker:text-brand-primary',
        '[&_li>p]:mb-0',
        // Daftar bersarang punya ritme sendiri tanpa margin ganda
        '[&_ul_ul]:mt-2 [&_ul_ul]:mb-0 [&_ul_ul]:list-[circle] [&_ul_ul]:marker:text-ink-secondary',
        '[&_ol_ol]:mt-2 [&_ol_ol]:mb-0 [&_ol_ol]:list-[lower-alpha]',
        '[&_li_ul]:mt-2 [&_li_ol]:mt-2',

        // --- Kutipan: garis tebal gold-ochre di kiri ---
        '[&>blockquote]:my-8 [&>blockquote]:border-l-4 [&>blockquote]:border-gold-ochre [&>blockquote]:pl-6 [&>blockquote]:italic [&>blockquote]:text-lg [&>blockquote]:leading-relaxed [&>blockquote]:text-ink-secondary',
        '[&>blockquote>p]:mb-0',
        '[&>blockquote>footer]:mt-3 [&>blockquote>footer]:not-italic [&>blockquote>footer]:text-sm [&>blockquote>footer]:text-ink-secondary',
        '[&_blockquote_cite]:not-italic [&_blockquote_cite]:font-semibold [&_blockquote_cite]:text-ink',

        // --- Media & pemisah ---
        '[&>img]:my-8 [&>img]:h-auto [&>img]:w-full [&>img]:rounded-xl [&>img]:border [&>img]:border-editorial',
        '[&>figure]:my-8',
        '[&>figure>figcaption]:mt-3 [&>figure>figcaption]:text-sm [&>figure>figcaption]:leading-relaxed [&>figure>figcaption]:text-ink-secondary',
        '[&>hr]:my-10 [&>hr]:border-t [&>hr]:border-editorial',

        // --- Kode & data ---
        '[&_code]:font-mono [&_code]:text-[0.9em] [&_code]:bg-brand-soft [&_code]:text-brand-deep [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5',
        '[&>pre]:my-8 [&>pre]:overflow-x-auto [&>pre]:rounded-xl [&>pre]:bg-brand-deep [&>pre]:p-4 [&>pre]:text-sm [&>pre]:leading-relaxed [&>pre]:text-white/90',
        '[&>pre>code]:bg-transparent [&>pre>code]:p-0 [&>pre>code]:text-inherit',
        '[&>table]:my-8 [&>table]:w-full [&>table]:border-collapse [&>table]:text-sm md:[&>table]:text-base',
        '[&_thead_tr]:border-b-2 [&_thead_tr]:border-brand-primary',
        '[&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:text-brand-deep',
        '[&_td]:px-3 [&_td]:py-2 [&_td]:align-top',
        '[&_tbody_tr]:border-b [&_tbody_tr]:border-editorial',

        // --- Drop-cap editorial (opsional) ---
        dropCap && [
          '[&>p:first-of-type::first-letter]:float-left',
          '[&>p:first-of-type::first-letter]:mr-3',
          '[&>p:first-of-type::first-letter]:mt-1',
          '[&>p:first-of-type::first-letter]:font-display',
          '[&>p:first-of-type::first-letter]:text-5xl',
          '[&>p:first-of-type::first-letter]:font-bold',
          '[&>p:first-of-type::first-letter]:leading-none',
          '[&>p:first-of-type::first-letter]:text-brand-primary',
          'md:[&>p:first-of-type::first-letter]:text-6xl',
        ],
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export default Prose;
