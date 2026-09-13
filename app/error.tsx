'use client';

import { useEffect } from 'react';

import { Button, Section } from '@repo/ui';

/**
 * Batas galat tingkat segmen untuk aplikasi ZAMROED Bergerak.
 *
 * Next.js mewajibkan komponen ini berupa Client Component, sehingga tidak boleh
 * mengekspor `metadata`. Judul dokumen tetap berasal dari layout root.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Section
      align="center"
      eyebrow="Gangguan sementara"
      title="Terjadi kesalahan"
      description="Kami tidak berhasil memuat bagian ini. Hal ini biasanya bersifat sementara — silakan coba lagi sebentar lagi."
    >
      <div className="mx-auto flex w-full max-w-xl flex-col items-center">
        <div
          role="alert"
          aria-live="polite"
          className="w-full rounded-2xl border border-editorial bg-surface px-6 py-6 text-center"
        >
          <p className="text-sm leading-relaxed text-ink-secondary sm:text-base">
            Bila masalah terus berulang, silakan hubungi koordinator kami di{' '}
            <a
              href="mailto:halo@zamroed.id"
              className="inline-flex min-h-[48px] items-center font-semibold text-brand-primary underline decoration-2 underline-offset-4 transition-colors duration-200 ease-crisp hover:text-brand-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
            >
              halo@zamroed.id
            </a>
            .
          </p>
          {error.digest ? (
            <p className="mt-3 break-words text-xs text-ink-secondary">
              Kode rujukan: <span className="font-mono">{error.digest}</span>
            </p>
          ) : null}
        </div>

        <div className="mt-8 flex w-full flex-col items-stretch justify-center gap-3 sm:w-auto sm:flex-row sm:items-center">
          {/* Bila Button di paket UI tidak meneruskan onClick pada tautan,
              tombol asli ini tetap menjadi jalur pemulihan yang pasti. */}
          <Button type="button" variant="primary" onClick={reset}>
            Coba lagi
          </Button>
          <Button href="/" variant="outline">
            Kembali ke Beranda
          </Button>
        </div>
      </div>
    </Section>
  );
}
