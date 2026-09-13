'use client';

import {
  Children,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ElementType,
  type ReactNode,
} from 'react';

import { cn } from '../lib/cn';

/* -------------------------------------------------------------------------- */
/*  Kontrak gerak                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Arah masuknya elemen. Jaraknya sengaja pendek (12–20px): gerak yang cukup
 * untuk menarik mata tanpa menggeser tata letak secara mencolok.
 */
export type RevealDirection = 'up' | 'down' | 'left' | 'right' | 'none';

const OFFSET: Record<RevealDirection, string> = {
  up: 'translate3d(0, 16px, 0)',
  down: 'translate3d(0, -16px, 0)',
  left: 'translate3d(20px, 0, 0)',
  right: 'translate3d(-20px, 0, 0)',
  none: 'none',
};

export interface RevealProps extends Omit<ComponentPropsWithoutRef<'div'>, 'style'> {
  /** Elemen pembungkus. Default `div`; pakai `li`/`section` agar semantik tetap benar. */
  as?: ElementType;
  /** Arah masuk. Default `up`. */
  direction?: RevealDirection;
  /** Jeda sebelum animasi mulai, dalam milidetik. */
  delay?: number;
  /**
   * Bagian elemen yang harus terlihat sebelum animasi dipicu (0–1).
   * Nilai kecil membuat blok tinggi tetap tampil tanpa menunggu seluruhnya masuk.
   */
  threshold?: number;
  /** Animasikan sekali saja. Default true — mengulang saat scroll balik terasa gelisah. */
  once?: boolean;
  children?: ReactNode;
}

/**
 * Reveal — menganimasikan anak saat benar-benar masuk viewport.
 *
 * Menggantikan kelas animasi CSS yang berjalan pada saat mount: untuk konten di
 * bawah lipatan, animasi semacam itu sudah selesai sebelum pengguna sempat
 * melihatnya, sehingga gerakannya terbuang percuma.
 *
 * Elemen dirender dalam keadaan akhir ketika JavaScript belum aktif atau ketika
 * pengguna meminta pengurangan gerak, sehingga konten tidak pernah tersembunyi
 * karena kegagalan skrip.
 */
export function Reveal({
  as,
  direction = 'up',
  delay = 0,
  threshold = 0.12,
  once = true,
  className,
  children,
  ...rest
}: RevealProps) {
  const Tag = (as ?? 'div') as ElementType;
  const ref = useRef<HTMLElement | null>(null);

  /**
   * Mulai dari `true` supaya hasil render server dan render pertama klien
   * identik — konten tampil penuh. Efek di bawah baru menyembunyikannya bila
   * pengamatan viewport memang dapat dijalankan.
   */
  const [shown, setShown] = useState(true);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const prefersReduced =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Tanpa IntersectionObserver atau saat gerak dikurangi, biarkan tampil.
    if (prefersReduced || typeof IntersectionObserver === 'undefined') return;

    // Elemen yang sudah terlihat saat mount tidak perlu disembunyikan lebih
    // dulu; menyembunyikannya akan menimbulkan kedipan di paruh atas halaman.
    const rect = node.getBoundingClientRect();
    const alreadyVisible = rect.top < window.innerHeight * (1 - threshold) && rect.bottom > 0;
    if (alreadyVisible) return;

    setShown(false);

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            if (once) observer.unobserve(entry.target);
          } else if (!once) {
            setShown(false);
          }
        }
      },
      // Margin bawah negatif menunda pemicu sampai elemen benar-benar masuk,
      // bukan tepat saat piksel pertamanya menyentuh tepi layar.
      { threshold, rootMargin: '0px 0px -8% 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [once, threshold]);

  return (
    <Tag
      ref={ref}
      data-revealed={shown ? 'true' : 'false'}
      className={cn('motion-reduce:!opacity-100 motion-reduce:!transform-none', className)}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? 'none' : OFFSET[direction],
        transition: `opacity 560ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 560ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        // Memberi tahu peramban apa yang akan berubah, tanpa memaksa lapisan
        // komposit permanen setelah animasi selesai.
        willChange: shown ? undefined : 'opacity, transform',
      }}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* -------------------------------------------------------------------------- */
/*  RevealGroup                                                                */
/* -------------------------------------------------------------------------- */

export interface RevealGroupProps extends Omit<ComponentPropsWithoutRef<'div'>, 'style'> {
  /** Elemen pembungkus. Pakai `ul` bila anaknya berupa daftar. */
  as?: ElementType;
  /** Jeda antar anak, dalam milidetik. */
  stagger?: number;
  /** Jeda sebelum anak pertama. */
  delay?: number;
  /** Arah masuk yang diteruskan ke setiap anak. */
  direction?: RevealDirection;
  /**
   * Batas jumlah anak yang mendapat jeda bertingkat. Tanpa batas, kisi panjang
   * membuat kartu terakhir menunggu terlalu lama sebelum muncul.
   */
  maxStagger?: number;
  children?: ReactNode;
}

/**
 * RevealGroup — memberi jeda bertingkat pada sekumpulan anak.
 *
 * Dipakai untuk kisi kartu: alih-alih seluruh baris muncul serentak, tiap kartu
 * menyusul sesaat setelah kartu sebelumnya sehingga mata sempat menelusuri
 * kisi. Setiap anak dibungkus `Reveal` sendiri, jadi pemicunya tetap per elemen.
 */
export function RevealGroup({
  as,
  stagger = 70,
  delay = 0,
  direction = 'up',
  maxStagger = 8,
  className,
  children,
  ...rest
}: RevealGroupProps) {
  const Tag = (as ?? 'div') as ElementType;
  const items = Children.toArray(children).filter(isValidElement);
  const childTag = Tag === 'ul' || Tag === 'ol' ? 'li' : 'div';

  return (
    <Tag className={className} {...rest}>
      {items.map((child, index) => (
        <Reveal
          key={child.key ?? index}
          as={childTag}
          direction={direction}
          delay={delay + Math.min(index, maxStagger) * stagger}
        >
          {child}
        </Reveal>
      ))}
    </Tag>
  );
}
