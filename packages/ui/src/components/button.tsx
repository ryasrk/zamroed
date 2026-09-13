import { forwardRef } from 'react';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, Ref } from 'react';
import Link from 'next/link';
import { cn } from '../lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

type NativeButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;
type NativeAnchorProps = AnchorHTMLAttributes<HTMLAnchorElement>;

export interface ButtonProps
  extends Omit<NativeButtonProps, 'className'>,
    Omit<NativeAnchorProps, keyof NativeButtonProps | 'className'> {
  /** Gaya visual tombol. Semua warna dibaca dari token `brand.*`. */
  variant?: ButtonVariant;
  /** Ukuran tombol. Semua ukuran tetap menjaga tinggi sentuh minimal 48px. */
  size?: ButtonSize;
  /** Bila diisi, tombol dirender sebagai tautan `next/link`. */
  href?: string;
  /** Menampilkan spinner, mempertahankan lebar label, dan memblokir interaksi. */
  loading?: boolean;
  disabled?: boolean;
  className?: string;
}

/** Basis: tipografi, target sentuh 48px, transisi ease-crisp, focus ring. */
const baseStyles = [
  'relative inline-flex min-h-12 touch-manipulation select-none items-center justify-center',
  'gap-2 whitespace-nowrap rounded-xl px-4 font-semibold leading-none',
  'transition-[background-color,border-color,color,box-shadow,transform] duration-200 ease-crisp',
  'motion-safe:hover:-translate-y-px motion-safe:active:translate-y-0',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent',
  'focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
].join(' ');

const variantStyles: Record<ButtonVariant, string> = {
  // Bayangan padat memberi kesan "dapat ditekan" tanpa bergantung pada warna merek tertentu.
  primary: [
    'bg-brand-primary text-white',
    'shadow-[0_3px_0_0_var(--brand-deep)]',
    'hover:bg-brand-deep hover:shadow-[0_5px_0_0_var(--brand-deep)]',
    'motion-safe:active:shadow-[0_1px_0_0_var(--brand-deep)]',
  ].join(' '),
  secondary: 'bg-brand-soft text-brand-deep hover:bg-brand-primary hover:text-white',
  outline:
    'border border-editorial bg-transparent text-ink hover:border-brand-primary hover:bg-brand-soft hover:text-brand-deep',
  ghost: 'bg-transparent text-ink-secondary hover:bg-brand-soft hover:text-brand-deep',
  danger: 'bg-status-critical text-white hover:bg-status-critical/90',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'min-h-12 px-4 text-sm',
  md: 'min-h-[3.25rem] px-6 text-base',
  lg: 'min-h-14 px-8 text-base sm:text-lg',
};

const spinnerSizes: Record<ButtonSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-[18px] w-[18px]',
  lg: 'h-5 w-5',
};

/** Spinner SVG inline — tanpa dependensi ikon eksternal. */
function LoadingSpinner({ size }: { size: ButtonSize }) {
  return (
    <span
      className="pointer-events-none absolute inset-0 grid place-items-center"
      aria-hidden="true"
    >
      <svg
        className={cn('animate-spin', spinnerSizes[size])}
        viewBox="0 0 24 24"
        fill="none"
        focusable="false"
      >
        <circle
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
          className="opacity-25"
        />
        <path
          d="M12 2a10 10 0 0 1 10 10h-3.5A6.5 6.5 0 0 0 12 5.5V2Z"
          fill="currentColor"
          className="opacity-90"
        />
      </svg>
    </span>
  );
}

/**
 * Tombol bersama untuk Jagatirta (theme-jagatirta) dan ZAMROED Bergerak (theme-zamroed).
 * Seluruh warna dibaca dari token `brand.*` yang di-rebind lewat CSS variable,
 * sehingga satu komponen melayani kedua merek tanpa warna hardcode.
 */
export const Button = forwardRef<HTMLElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    href,
    loading = false,
    disabled = false,
    className,
    children,
    type = 'button',
    ...rest
  },
  ref,
) {
  const isInert = disabled || loading;

  const styles = cn(
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    isInert && 'pointer-events-none opacity-60',
    className,
  );

  const content = (
    <>
      {/* Label tetap berada di a11y tree saat loading; hanya disembunyikan secara visual. */}
      <span className={cn('inline-flex items-center gap-2', loading && 'opacity-0')}>
        {children}
      </span>
      {loading ? (
        <>
          <LoadingSpinner size={size} />
          <span className="sr-only">Memuat…</span>
        </>
      ) : null}
    </>
  );

  if (href) {
    const anchorProps = rest as NativeAnchorProps;

    return (
      <Link
        href={href}
        ref={isInert ? undefined : (ref as Ref<HTMLAnchorElement> | null)}
        className={styles}
        aria-busy={loading || undefined}
        aria-disabled={isInert || undefined}
        tabIndex={isInert ? -1 : undefined}
        data-variant={variant}
        data-loading={loading || undefined}
        {...anchorProps}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      ref={ref as Ref<HTMLButtonElement> | null}
      type={type}
      className={styles}
      disabled={disabled}
      // Untuk <button> asli, atribut `disabled` sudah cukup; aria-disabled hanya menandai loading.
      aria-disabled={loading || undefined}
      aria-busy={loading || undefined}
      data-variant={variant}
      data-loading={loading || undefined}
      {...rest}
    >
      {content}
    </button>
  );
});
