import type { Metadata } from 'next';

import { Button, EmptyState, Section } from '@repo/ui';

export const metadata: Metadata = {
  title: 'Liputan tidak ditemukan — ZAMROED Bergerak',
  description:
    'Liputan aksi yang Anda cari tidak tersedia di kanal liputan ZAMROED Bergerak.',
};

/**
 * Halaman 404 untuk rute liputan aksi.
 *
 * Nada tulisannya tenang dan mengajak bergerak: satu penjelasan singkat
 * tentang mengapa halaman kosong, lalu satu langkah kembali ke indeks liputan.
 * Struktur visualnya sengaja disamakan dengan halaman liputan supaya
 * perpindahan terasa seperti bagian dari kanal yang sama, bukan jalan buntu.
 */
export default function LiputanAksiNotFound() {
  return (
    <main className="bg-canvas">
      <Section className="flex min-h-[70svh] items-center">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-start">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-primary">
            Eror 404
          </p>

          <h1 className="text-display mt-4 font-display font-bold text-balance text-ink">
            Liputan ini belum terbit
          </h1>

          <p className="measure-editorial mt-5 text-base leading-relaxed text-ink-secondary md:text-lg">
            Tautan yang Anda buka tidak mengarah ke liputan mana pun di kanal kami. Bisa jadi
            alamatnya salah ketik, atau liputannya sudah dipindahkan. Semua warta aksi lapangan
            tetap bisa Anda telusuri dari indeks liputan.
          </p>

          <EmptyState
            className="mt-10 w-full"
            title="Alamat ini tidak memuat liputan"
            description="Periksa kembali tautan yang Anda bagikan, atau kembali ke indeks Liputan Aksi untuk membaca warta terbaru dari lapangan."
            action={
              <Button href="/liputan-aksi" variant="primary" size="md">
                Kembali ke Liputan Aksi
              </Button>
            }
          />
        </div>
      </Section>
    </main>
  );
}
