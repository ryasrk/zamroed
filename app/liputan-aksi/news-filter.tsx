'use client';

import { useId, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { Badge, Button, EmptyState, cn } from '@repo/ui';
import type { Article } from '@repo/ui/types';

/**
 * Label "pintu keluar" filter. Bukan kategori — tidak pernah muncul di data,
 * jadi tidak mungkin bertabrakan dengan nama rubrik dari redaksi.
 */
const SEMUA = 'Semua';

export interface NewsFilterProps {
  /** Seluruh artikel dari `@repo/data`, dikirim utuh sebagai prop dari server. */
  articles: Article[];
  /**
   * Daftar kategori unik. Bila tidak diisi, dihitung dari `articles` supaya
   * komponen tetap benar saat dipakai tanpa pra-perhitungan di server.
   */
  categories?: string[];
  /**
   * Daftar liputan yang sudah dirender Server Component. Anak ini selalu
   * ter-render — menyembunyikan per kartu akan mematikan tautan beserta
   * gambarnya saat filter aktif dan tampilan langsung terasa berkedip.
   */
  children: ReactNode;
}

/**
 * Penyaring kategori liputan.
 *
 * Input kategori diperlakukan sebagai data tak tepercaya: hanya artikel yang
 * kategori tepat sama dengan filter aktif yang ditampilkan, dan jumlah pada
 * setiap pil dihitung dari data itu sendiri. Kategori tak dikenal diabaikan,
 * sehingga dataset baru dari redaksi tidak pernah menghasilkan pil kosong.
 */
export function NewsFilter({ articles, categories, children }: NewsFilterProps) {
  const [aktif, setAktif] = useState<string>(SEMUA);
  const basisId = useId();

  /** Kategori diturunkan dari data, urut sesuai kemunculan pertama — bukan alfabet. */
  const daftarKategori = useMemo(() => {
    const sumber = categories ?? articles.map((artikel) => artikel.category);
    return Array.from(new Set(sumber.filter((kategori) => kategori.length > 0)));
  }, [articles, categories]);

  /** Jumlah artikel per kategori, untuk label yang informatif pada tiap pil. */
  const jumlahPerKategori = useMemo(() => {
    const peta = new Map<string, number>();
    for (const artikel of articles) {
      peta.set(artikel.category, (peta.get(artikel.category) ?? 0) + 1);
    }
    return peta;
  }, [articles]);

  const tersaring = useMemo(
    () => (aktif === SEMUA ? articles : articles.filter((artikel) => artikel.category === aktif)),
    [articles, aktif],
  );

  /**
   * Sankey sederhana untuk mode tekan: tekan balik kategori yang sama untuk
   * kembali melihat semua liputan.
   */
  function toggle(kategori: string): void {
    setAktif((sebelumnya) => (sebelumnya === kategori ? SEMUA : kategori));
  }

  const panelId = `${basisId}-panel`;

  return (
    <section
      aria-labelledby={`${basisId}-judul`}
      className="bg-canvas px-5 py-14 sm:px-8 md:py-20"
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 border-b border-editorial pb-8 sm:flex-row sm:items-end sm:justify-between sm:gap-8">
          <div className="animate-fade-up">
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-brand-primary">
              <span aria-hidden="true" className="h-px w-8 shrink-0 bg-brand-primary opacity-60" />
              Arsip Redaksi
            </p>
            <h2
              id={`${basisId}-judul`}
              className="text-section mt-4 font-display font-bold text-ink"
            >
              Semua Liputan
            </h2>
          </div>

          <p className="text-sm text-ink-secondary sm:pb-2">
            <span className="font-display text-2xl font-bold tabular-nums text-ink">
              {tersaring.length}
            </span>{' '}
            dari {articles.length} liputan
            {aktif === SEMUA ? null : (
              <>
                {' pada rubrik '}
                <span className="font-semibold text-ink">{aktif}</span>
              </>
            )}
          </p>
        </div>

        {/* ── Pil filter ─────────────────────────────────────────────────── */}
        <div
          role="group"
          aria-label="Saring liputan berdasarkan rubrik"
          className="-mx-5 mt-6 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-5 pb-2 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0"
        >
          <Button
            variant={aktif === SEMUA ? 'primary' : 'outline'}
            size="sm"
            aria-pressed={aktif === SEMUA}
            aria-controls={panelId}
            onClick={() => toggle(SEMUA)}
            className="shrink-0 snap-start"
          >
            {SEMUA}
            <span className="tabular-nums opacity-70">{articles.length}</span>
          </Button>

          {daftarKategori.map((kategori) => {
            const dipilih = aktif === kategori;
            return (
              <Button
                key={kategori}
                variant={dipilih ? 'primary' : 'outline'}
                size="sm"
                aria-pressed={dipilih}
                aria-controls={panelId}
                onClick={() => toggle(kategori)}
                className="shrink-0 snap-start"
              >
                {kategori}
                <span className="tabular-nums opacity-70">
                  {jumlahPerKategori.get(kategori) ?? 0}
                </span>
              </Button>
            );
          })}
        </div>

        {/* ── Panel hasil ────────────────────────────────────────────────── */}
        <div id={panelId} aria-live="polite">
          {tersaring.length === 0 ? (
            <EmptyState
              className="mt-10"
              title={`Belum ada liputan untuk rubrik ${aktif}`}
              description="Rubrik ini belum memiliki catatan lapangan yang terbit. Silakan pilih rubrik lain atau kembali ke seluruh liputan."
              action={
                <Button onClick={() => setAktif(SEMUA)}>
                  Tampilkan semua liputan
                  <Badge tone="primary" className="ml-1">
                    {articles.length}
                  </Badge>
                </Button>
              }
            />
          ) : (
            children
          )}
        </div>

        <p className="mt-10 text-sm leading-relaxed text-ink-secondary">
          Menampilkan {tersaring.length} dari {articles.length} liputan
          {aktif === SEMUA ? ' di seluruh rubrik.' : ` pada rubrik ${aktif}.`}{' '}
          <span className={cn('font-semibold text-brand-primary')}>
            Arsip lengkap tersedia atas permintaan.
          </span>
        </p>
      </div>
    </section>
  );
}
