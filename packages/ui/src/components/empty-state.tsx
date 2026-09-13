import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '../lib/cn';

/* -------------------------------------------------------------------------- */
/*  Kontrak gaya                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Cangkang: kartu editorial dengan border putus-putus — bahasa visual untuk
 * "ruang yang belum terisi", bukan galat. Radius 16 dan warna diambil dari
 * token (`editorial`, `surface`, `canvas`, `ink`, `brand.*`) sehingga satu
 * definisi melayani `.theme-jagatirta` (teal/navy) dan `.theme-zamroed`
 * (emerald/gold) tanpa satu pun hex yang dikunci.
 *
 * `min-h-[13rem]` menjaga kartu tetap terasa sebagai ruang, bahkan saat judul
 * sangat pendek dan deskripsi tidak diisi.
 */
const SHELL = [
  'relative isolate flex w-full flex-col items-center justify-center',
  'min-h-[13rem] rounded-2xl border-2 border-dashed border-editorial',
  'bg-surface text-center text-balance',
  // Padding murah hati: 40px di ponsel, sampai 64px di layar lebar.
  'px-6 py-10 sm:px-10 sm:py-12 lg:px-16 lg:py-16',
  'animate-fade-up motion-reduce:animate-none',
].join(' ');

/**
 * Penanda visual di belakang ikon. Sengaja hanya di ponsel: layar kecil
 * mendapat bobot merek, layar lebar tidak terganggu oleh hiasan.
 */
const GLOW = [
  'pointer-events-none absolute -top-16 left-1/2 -z-10 h-40 w-40 -translate-x-1/2',
  'rounded-full bg-brand-soft opacity-30 blur-3xl',
  'sm:opacity-20 md:opacity-0',
].join(' ');

/** Plat ikon: lembut, membulat, cukup besar untuk dibaca sebagai ilustrasi kecil. */
const ICON_PLATE = [
  'mb-5 inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl',
  'bg-brand-soft text-brand-primary ring-1 ring-inset ring-brand-primary/20',
  'sm:h-20 sm:w-20',
].join(' ');

/**
 * Wadah slot aksi. Setiap tautan/tombol langsung di dalamnya dipaksa setinggi
 * minimal 48px dan selebar cukup untuk ibu jari relawan lapangan; tumpukan
 * vertikal dipakai di ponsel, baris sejajar sejak `sm`.
 */
const ACTION_SLOT = [
  'mt-7 flex w-full flex-col items-stretch justify-center gap-3',
  'sm:mt-8 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center',
  // Target sentuh 48px untuk elemen interaktif apa pun yang dilempar ke slot ini.
  '[&>a]:inline-flex [&>a]:min-h-[48px] [&>a]:min-w-[48px] [&>a]:items-center [&>a]:justify-center',
  '[&>button]:inline-flex [&>button]:min-h-[48px] [&>button]:min-w-[48px] [&>button]:items-center [&>button]:justify-center',
  // Elemen yang dapat difokuskan di dalam slot tetap mendapat cincin fokus yang terlihat.
  '[&_a:focus-visible]:outline-none [&_a:focus-visible]:ring-2 [&_a:focus-visible]:ring-brand-accent',
  '[&_a:focus-visible]:ring-offset-2 [&_a:focus-visible]:ring-offset-canvas',
  '[&_button:focus-visible]:outline-none [&_button:focus-visible]:ring-2 [&_button:focus-visible]:ring-brand-accent',
  '[&_button:focus-visible]:ring-offset-2 [&_button:focus-visible]:ring-offset-canvas',
].join(' ');

/** Ikon bawaan: `role="img"` + judul agar tetap punya nama bila penanda ikon dipakai. */
const ICON_SVG = 'block h-8 w-8 shrink-0 text-brand-primary sm:h-9 sm:w-9';

export interface EmptyStateProps extends Omit<HTMLAttributes<HTMLElement>, 'title'> {
  /**
   * Judul singkat dalam Bahasa Indonesia, mis. "Belum ada sungai yang cocok",
   * "Tidak ada relawan terdaftar", "Pencarian tidak menemukan hasil".
   * Wajib — ini yang dibacakan pembaca layar saat ruang kosong muncul.
   */
  title: string;
  /**
   * Kalimat penjelas: kenapa kosong dan apa langkah berikutnya.
   * Contoh: "Ubah kata kunci atau pilih provinsi lain untuk melihat data sungai."
   */
  description?: string;
  /**
   * Ikon atau ilustrasi kecil. Bila tidak diisi, dipakai ikon bawaan
   * (siluet aliran sungai) supaya kartu tidak pernah tampak telanjang.
   * Setiap SVG di dalamnya dinormalisasi ke ukuran 32–36px.
   */
  icon?: ReactNode;
  /**
   * Slot aksi — biasanya satu `<Button>` atau tautan. Maksimal dua agar
   * hierarki tetap jelas; rendernya otomatis setinggi minimal 48px.
   */
  action?: ReactNode;
  /**
   * Bagian atas slot aksi, mis. alamat surel koordinator lapangan.
   * Berguna di halaman tim relawan yang butuh jalur kontak nyata.
   */
  footer?: ReactNode;
  /** Kelas tambahan untuk kartu (tailwind-merge aware). */
  className?: string;
}

/**
 * EmptyState — ruang kosong bersama untuk Jagatirta & ZAMROED Bergerak.
 *
 * Dipakai saat daftar sungai, hasil pencarian, riwayat pemeriksaan, atau
 * daftar relawan tidak berisi apa pun. Kartu border putus-putus membacakan
 * "belum ada data" alih-alih "terjadi galat", lengkap dengan satu jalur
 * keluar lewat slot `action`.
 *
 * Server-compatible: tanpa `'use client'`, tanpa hook, state, maupun handler —
 * dapat dirender langsung di Server Component Next.js.
 *
 * @example Daftar sungai kosong dengan jalur keluar
 * ```tsx
 * <EmptyState
 *   title="Belum ada sungai yang cocok"
 *   description="Coba ubah filter status atau pilih provinsi lain."
 *   action={<Button href="/sungai">Lihat semua sungai</Button>}
 * />
 * ```
 *
 * @example Halaman relawan dengan jalur kontak
 * ```tsx
 * <EmptyState
 *   title="Belum ada relawan terjadwal"
 *   description="Jadwal aksi berikutnya akan diumumkan melalui WhatsApp."
 *   icon={<Waves aria-hidden="true" />}
 *   action={<Button href="/relawan/daftar">Daftar jadi relawan</Button>}
 *   footer={<p className="text-sm text-ink-secondary">Butuh bantuan? hubungi lapangan@jagatirta.id</p>}
 * />
 * ```
 */
export function EmptyState({
  title,
  description,
  icon,
  action,
  footer,
  className,
  ...rest
}: EmptyStateProps) {
  // Data dari API bisa datang sebagai `null` meski tipenya `string`; jangan
  // pernah merender teks "null" ke antarmuka.
  const heading = typeof title === 'string' ? title.trim() : '';
  const body = typeof description === 'string' ? description.trim() : '';

  return (
    <section
      data-slot="empty-state"
      className={cn(SHELL, className)}
      aria-labelledby="empty-state-title"
      {...rest}
    >
      <span aria-hidden="true" className={GLOW} />

      <span className={ICON_PLATE}>
        {icon ? (
          // Ikon kustom: penanda wadah (`presentation`) agar nama ikon tetap
          // berasal dari `title` kartu, tidak dibacakan dua kali.
          <span
            role="presentation"
            aria-hidden="true"
            className="flex items-center justify-center [&_svg]:block [&_svg]:h-8 [&_svg]:w-8 sm:[&_svg]:h-9 sm:[&_svg]:w-9"
          >
            {icon}
          </span>
        ) : (
          <EmptyStateIcon />
        )}
      </span>

      <h3
        id="empty-state-title"
        className="measure-editorial font-display text-lg font-bold leading-snug tracking-tight text-ink text-balance sm:text-xl"
      >
        {heading || 'Belum ada data untuk ditampilkan'}
      </h3>

      {body ? (
        <p
          id="empty-state-description"
          className="measure-editorial mt-3 text-sm leading-relaxed text-ink-secondary sm:text-base"
        >
          {body}
        </p>
      ) : null}

      {action ? (
        <div
          className={ACTION_SLOT}
          // Hubungkan slot aksi ke deskripsi agar pembaca layar mendengar
          // konteksnya lebih dulu; diabaikan bila uraian tidak dirender.
          aria-describedby={body ? 'empty-state-description' : undefined}
        >
          {action}
        </div>
      ) : null}

      {footer ? <div className="mt-6 w-full sm:mt-7">{footer}</div> : null}
    </section>
  );
}

/**
 * Ikon bawaan — siluet dua aliran air, digambar inline supaya paket tetap
 * bebas dari impor ikon eksternal dan server-compatible.
 */
function EmptyStateIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label="Belum ada data"
      focusable="false"
      className={ICON_SVG}
    >
      <path d="M3 8.5c1.8 0 2.7-1.6 4.5-1.6S10.2 8.5 12 8.5s2.7-1.6 4.5-1.6S19.2 8.5 21 8.5" />
      <path d="M3 14c1.8 0 2.7-1.6 4.5-1.6S10.2 14 12 14s2.7-1.6 4.5-1.6S19.2 14 21 14" />
      <path d="M3 19.5c1.8 0 2.7-1.6 4.5-1.6S10.2 19.5 12 19.5s2.7-1.6 4.5-1.6S19.2 19.5 21 19.5" />
    </svg>
  );
}

export default EmptyState;
