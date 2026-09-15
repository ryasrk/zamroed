import type { Metadata } from 'next';
import Link from 'next/link';

import { Button, Section } from '@repo/ui';

export const metadata: Metadata = { title: 'Halaman tidak ditemukan' };

/**
 * Daftar tujuan bantuan. Setiap tautan menjelaskan isinya, bukan sekadar
 * mengulang label navigasi, supaya warga tetap menemukan jalan kembali
 * walau alamat yang diketik salah.
 */
const HELPFUL_LINKS = [
  {
    href: '/',
    label: 'Kembali ke Beranda',
    description: 'Ringkasan gerakan dan aksi terbaru ZAMROED Bergerak.',
  },
  {
    href: '/program',
    label: 'Lihat Program Kami',
    description: 'Pilar kedaulatan ekologi, tanggap bencana, dan pendidikan akar rumput.',
  },
  {
    href: '/liputan-aksi',
    label: 'Baca Liputan & Aksi',
    description: 'Catatan lapangan dan kabar terbaru dari jaringan relawan.',
  },
] as const;

/**
 * 404 global untuk aplikasi ZAMROED Bergerak.
 *
 * Server Component murni — tanpa direktif klien — sehingga `metadata` tetap
 * dapat diekspor dan judul dokumen ikut berubah saat halaman tidak ditemukan.
 */
export default function NotFound() {
  return (
    <Section
      align="center"
      eyebrow="Kesalahan 404"
      title="Halaman tidak ditemukan"
      description="Alamat yang Anda tuju mungkin sudah dipindahkan, diganti namanya, atau memang belum pernah ada. Silakan pilih salah satu tautan di bawah untuk melanjutkan."
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center">
        <ul className="grid w-full list-none gap-grid-tight text-left sm:grid-cols-2 lg:grid-cols-3">
          {HELPFUL_LINKS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex min-h-[48px] flex-col justify-center rounded-2xl border border-editorial bg-surface px-5 py-4 no-underline transition-colors duration-200 ease-crisp hover:border-brand-primary hover:bg-brand-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
              >
                <span className="font-display text-base font-bold text-ink">
                  {item.label}
                </span>
                <span className="mt-1 text-sm leading-relaxed text-ink-secondary">
                  {item.description}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:items-center">
          <Button href="/" variant="primary">
            Kembali ke Beranda
          </Button>
          <Button href="/volunteer" variant="outline">
            Gabung Relawan
          </Button>
        </div>
      </div>
    </Section>
  );
}
