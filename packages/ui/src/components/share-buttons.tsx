'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { cn } from '../lib/cn';

/** Lama tampilnya status "Tersalin!" dalam milidetik. */
const COPIED_FEEDBACK_MS = 2000;

/**
 * Pesan berbagi Bahasa Indonesia yang selalu cocok untuk kedua merek:
 * menyebut aksi nyata (bukan slogan), lalu judul kanal.
 */
const SHARE_MESSAGE = 'Bantu sebarkan:';

export interface ShareButtonsProps {
  /** Judul konten yang dibagikan. Wajib. */
  title: string;
  /**
   * URL absolut konten. Bila kosong, komponen memakai `window.location.href`
   * saat tombol diklik (aman untuk SSR karena dibaca on-demand).
   */
  url?: string;
  /** Label grup untuk pembaca layar, mis. "Bagikan artikel ini". */
  label?: string;
  /** Sembunyikan label teks tombol di layar sempit dan tampilkan ikon saja. */
  compact?: boolean;
  /** Layout tombol: tumpuk vertikal di ponsel atau sejajar sejak awal. */
  layout?: ShareLayout;
  className?: string;
}

export type ShareLayout = 'stacked' | 'row';

interface ShareTarget {
  id: 'whatsapp' | 'x' | 'facebook' | 'copy';
  /** ARIA label per tombol — selalu menyebut tujuan + judul konten. */
  ariaLabel: (title: string) => string;
  /** Teks tombol yang terlihat; `null` berarti ikon saja. */
  label: string | null;
}

/** Basis tiap tombol: target sentuh >=48px, focus ring, easing crisp. */
const baseStyles = [
  'group relative inline-flex min-h-12 min-w-12 touch-manipulation select-none items-center justify-center',
  'gap-2.5 rounded-xl px-4 text-sm font-semibold leading-none',
  'transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-crisp',
  'motion-safe:hover:-translate-y-px motion-safe:active:translate-y-0',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent',
  'focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
].join(' ');

/**
 * WhatsApp adalah aksi utama: memberi tekanan visual paling kuat
 * (bayangan padat ala tombol fisik) tanpa warna hardcode — semua dari token `brand.*`.
 */
const whatsappStyles = [
  'bg-brand-primary text-white',
  'shadow-[0_3px_0_0_var(--brand-deep)]',
  'hover:bg-brand-deep hover:shadow-[0_5px_0_0_var(--brand-deep)]',
  'motion-safe:active:shadow-[0_1px_0_0_var(--brand-deep)]',
].join(' ');

const secondaryStyles =
  'border border-editorial bg-surface-pure text-ink hover:border-brand-primary hover:bg-brand-soft hover:text-brand-deep';

/** Basis tombol tautan: sama seperti tombol lain agar baris tetap rapi. */
const linkStyles = [baseStyles, secondaryStyles].join(' ');

const ICON_BASE = 'h-5 w-5 shrink-0';
const ICON_TRANSITION = 'transition-transform duration-200 ease-crisp motion-safe:group-hover:scale-110';

/** Ikon WhatsApp: gelembung obrolan + gagang telepon, SVG inline. */
function WhatsAppIcon() {
  return (
    <svg
      className={cn(ICON_BASE, ICON_TRANSITION)}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M12 2.75c-5.1 0-9.25 4.13-9.25 9.23 0 1.63.43 3.22 1.25 4.62L2.75 21.5l5.05-1.2a9.25 9.25 0 0 0 4.2 1h.01c5.1 0 9.24-4.14 9.24-9.23 0-2.47-.96-4.79-2.71-6.53A9.2 9.2 0 0 0 12 2.75Z"
        fill="currentColor"
      />
      <path
        d="M16.6 13.4c-.24-.12-1.42-.7-1.64-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06-.24-.12-1.02-.38-1.94-1.2-.72-.64-1.2-1.43-1.34-1.67-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.19-.46-.39-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2 0 1.18.86 2.32.98 2.48.12.16 1.7 2.6 4.12 3.64.58.25 1.02.4 1.37.51.58.19 1.1.16 1.52.1.46-.07 1.42-.58 1.62-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z"
        fill="var(--brand-primary, #028090)"
      />
    </svg>
  );
}

/** Ikon X (dahulu Twitter). */
function XIcon() {
  return (
    <svg
      className={cn(ICON_BASE, ICON_TRANSITION)}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M17.53 3h3.02l-6.6 7.54L21.75 21h-5.9l-4.62-6.04L5.94 21H2.92l7.06-8.07L2.25 3h6.05l4.18 5.52L17.53 3Zm-1.06 16.2h1.67L7.6 4.71H5.81l10.66 14.49Z" />
    </svg>
  );
}

/** Ikon Facebook. */
function FacebookIcon() {
  return (
    <svg
      className={cn(ICON_BASE, ICON_TRANSITION)}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.49-3.91 3.78-3.91 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.44 2.91h-2.34V22c4.78-.76 8.43-4.92 8.43-9.94Z" />
    </svg>
  );
}

/** Ikon tautan, dipakai untuk status salin. */
function LinkIcon() {
  return (
    <svg
      className={cn(ICON_BASE, ICON_TRANSITION)}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M10.5 13.5a4 4 0 0 0 5.66 0l2.83-2.83a4 4 0 0 0-5.66-5.66L12 6.44" />
      <path d="M13.5 10.5a4 4 0 0 0-5.66 0L5.01 13.3a4 4 0 0 0 5.66 5.66L12 17.56" />
    </svg>
  );
}

/** Ikon centang, muncul pada state "Tersalin!". */
function CheckIcon() {
  return (
    <svg
      className={ICON_BASE}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="m4.5 12.75 5 5 10-11" />
    </svg>
  );
}

/**
 * Merangkai teks berbagi: pesan + judul + URL.
 * URL final dibaca on-demand sehingga aman saat SSR (tanpa akses window di render).
 */
function buildShareText(title: string, url: string): string {
  const cleanTitle = title.trim();
  const parts = [SHARE_MESSAGE, cleanTitle].filter((part) => part.length > 0);
  const headline = parts.join(' ');
  return url.length > 0 ? `${headline} ${url}` : headline;
}

/**
 * Tombol berbagi konten — dipakai Jagatirta (theme-jagatirta) maupun
 * ZAMROED Bergerak (theme-zamroed) tanpa warna hardcode: seluruh warna
 * dibaca dari token `brand.*` yang di-rebind per theme.
 *
 * WhatsApp diposisikan sebagai aksi utama karena kanal itulah yang benar-benar
 * dipakai relawan lapangan untuk menyebarkan temuan; X, Facebook, dan
 * "Salin Tautan" menjadi pendamping.
 */
export function ShareButtons({
  title,
  url,
  label,
  compact = true,
  layout = 'stacked',
  className,
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);
  const [activeUrl, setActiveUrl] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** Hentikan timer umpan balik saat komponen dilepas — mencegah setState setelah unmount. */
  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

  /** Baca URL berbagi: dari prop, atau window saat diklik (guard navigator/SSR). */
  const resolveUrl = useCallback((): string => {
    if (typeof url === 'string' && url.trim().length > 0) {
      return url.trim();
    }
    if (typeof window !== 'undefined' && typeof window.location !== 'undefined') {
      const href = window.location.href;
      return typeof href === 'string' ? href : '';
    }
    return '';
  }, [url]);

  const scheduleCopyReset = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setCopied(false);
      setCopyFailed(false);
      timeoutRef.current = null;
    }, COPIED_FEEDBACK_MS);
  }, []);

  const handleCopy = useCallback(async () => {
    const shareUrl = resolveUrl();
    // Tanpa URL (mis. SSR tanpa location) tidak ada yang bisa disalin: biarkan
    // aksi gagal secara terlihat alih-alih menampilkan umpan balik palsu.
    const hasTarget = shareUrl.length > 0;

    try {
      if (!hasTarget || typeof navigator === 'undefined' || !navigator.clipboard) {
        throw new Error('clipboard-unavailable');
      }
      await navigator.clipboard.writeText(shareUrl);
      setCopyFailed(false);
      setCopied(true);
      scheduleCopyReset();
    } catch {
      setCopied(false);
      setCopyFailed(true);
      scheduleCopyReset();
    }
  }, [resolveUrl, scheduleCopyReset]);

  const shareUrl = activeUrl ?? resolveUrl();
  const shareText = buildShareText(title, shareUrl);
  const encodedText = encodeURIComponent(shareText);

  const targets: ShareTarget[] = [
    {
      id: 'whatsapp',
      ariaLabel: (t) => `Bagikan "${t}" lewat WhatsApp`,
      label: 'WhatsApp',
    },
    {
      id: 'x',
      ariaLabel: (t) => `Bagikan "${t}" lewat X`,
      label: 'X',
    },
    {
      id: 'facebook',
      ariaLabel: (t) => `Bagikan "${t}" lewat Facebook`,
      label: 'Facebook',
    },
  ];

  const buildHref = (id: ShareTarget['id']): string => {
    if (id === 'whatsapp') {
      return `https://wa.me/?text=${encodedText}`;
    }
    if (id === 'x') {
      return `https://twitter.com/intent/tweet?text=${encodedText}`;
    }
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  };

  /** Membuka jendela berbagi tanpa membiarkan pengguna kehilangan halaman asal. */
  const handleShare = useCallback(
    (id: ShareTarget['id']) => (event: React.MouseEvent<HTMLAnchorElement>) => {
      if (typeof window === 'undefined') {
        return;
      }
      event.preventDefault();
      const target = resolveUrl();
      setActiveUrl(target);
      const text = encodeURIComponent(buildShareText(title, target));
      const href =
        id === 'whatsapp'
          ? `https://wa.me/?text=${text}`
          : id === 'x'
            ? `https://twitter.com/intent/tweet?text=${text}`
            : `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(target)}`;

      const opened = window.open(href, '_blank', 'noopener,noreferrer');
      // Popup diblokir: jatuhkan ke navigasi biasa agar tautan tetap berfungsi.
      if (opened === null) {
        window.location.assign(href);
      }
    },
    [resolveUrl, title],
  );

  const copyLabel = copied ? 'Tersalin!' : copyFailed ? 'Gagal menyalin' : 'Salin Tautan';
  const copyAria: React.AriaAttributes['aria-label'] = copied
    ? 'Tautan berhasil disalin ke papan klip'
    : copyFailed
      ? 'Tautan gagal disalin, silakan salin dari bilah alamat'
      : `Salin tautan "${title.trim()}" ke papan klip`;

  const showTextLabel = !compact;

  return (
    <div
      className={cn('w-full', className)}
      role="group"
      aria-label={label ?? `Bagikan konten: ${title.trim()}`}
      data-copied={copied || undefined}
    >
      <div
        className={cn(
          'flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-stretch',
          layout === 'row' && 'flex-row flex-wrap',
        )}
      >
        {targets.map((target) => (
          <a
            key={target.id}
            href={buildHref(target.id)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleShare(target.id)}
            aria-label={target.ariaLabel(title.trim())}
            data-share={target.id}
            className={cn(
              baseStyles,
              target.id === 'whatsapp' ? whatsappStyles : secondaryStyles,
              'w-full sm:w-auto',
              layout === 'row' && 'w-auto flex-1',
            )}
          >
            {target.id === 'whatsapp' ? (
              <WhatsAppIcon />
            ) : target.id === 'x' ? (
              <XIcon />
            ) : (
              <FacebookIcon />
            )}
            <span className={cn(showTextLabel ? 'inline' : 'sr-only sm:not-sr-only')}>
              {target.label}
            </span>
          </a>
        ))}

        <button
          type="button"
          onClick={handleCopy}
          aria-label={copyAria}
          data-share="copy"
          className={cn(
            baseStyles,
            copied
              ? 'border border-brand-primary bg-brand-soft text-brand-deep'
              : secondaryStyles,
            'w-full sm:w-auto',
            layout === 'row' && 'w-auto flex-1',
          )}
        >
          {copied ? <CheckIcon /> : <LinkIcon />}
          <span
            className={cn(
              showTextLabel ? 'inline' : 'sr-only sm:not-sr-only',
              copied && 'animate-fade-up',
            )}
          >
            {copyLabel}
          </span>
        </button>
      </div>

      {/* Umpan balik yang diumumkan pembaca layar tanpa memindahkan fokus. */}
      <p aria-live="polite" role="status" className="sr-only">
        {copied ? 'Tautan tersalin ke papan klip.' : copyFailed ? 'Tautan gagal disalin.' : ''}
      </p>
    </div>
  );
}
