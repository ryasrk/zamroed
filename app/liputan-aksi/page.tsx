import type { Metadata } from 'next';

import {
  Badge,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  EmptyState,
  ViewCounter,
} from '@repo/ui';
import { articles } from '@repo/data';

import { NewsFilter } from './news-filter';

export const metadata: Metadata = {
  title: 'Liputan dan Aksi — ZAMROED Bergerak',
  description:
    'Catatan lapangan, warta aksi, dan siaran pers ZAMROED Bergerak: dokumentasi gerakan akar rumput yang jujur, apa adanya, tanpa dibumbui.',
};

/* -------------------------------------------------------------------------- */
/*  Pemformatan                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Tanggal panjang Bahasa Indonesia: "9 September 2026".
 *
 * Satu pemformat dipakai ulang di seluruh halaman — `Intl` mahal bila
 * dikonstruksi pada setiap render.
 */
const dateFormatter = new Intl.DateTimeFormat('id-ID', { dateStyle: 'long' });

/**
 * Format tanggal dengan aman: data CMS bisa datang dengan tanggal yang tidak
 * dapat diurai. Dalam hal itu teks aslinya dikembalikan apa adanya supaya
 * halaman tetap terbaca, bukan menampilkan "Invalid Date".
 */
function formatDate(isoDate: string): string {
  const timestamp = Date.parse(isoDate);
  return Number.isNaN(timestamp) ? isoDate : dateFormatter.format(timestamp);
}

/* -------------------------------------------------------------------------- */
/*  Aset gambar                                                                */
/* -------------------------------------------------------------------------- */

/**
 * Sebagian artikel `@repo/data` masih menunjuk berkas contoh milik Jagatirta
 * (mis. `/images/water-testing.jpg`) yang belum ada di `public/images` milik
 * ZAMROED Bergerak. Selama migrasi aset belum selesai, berkas yang belum
 * tersedia dipetakan ke foto gerakan yang sudah ada — format URL, alt text,
 * dan proporsi gambar tetap utuh, dan tidak ada berkas yang dirujuk secara
 * spekulatif. Hapus peta ini begitu aset liputan ZAMROED diunggah.
 */
const ASET_GERAKAN = '/images/hero-movement.jpg';

const GAMBAR_LIPUTAN: Record<string, string> = {
  '/images/cleanup-campaign.jpg': '/images/rembuk-warga.jpg',
  '/images/water-testing.jpg': ASET_GERAKAN,
  '/images/mahakam.jpg': ASET_GERAKAN,
};

function coverImage(src: string): string {
  return GAMBAR_LIPUTAN[src] ?? src;
}

/* -------------------------------------------------------------------------- */
/*  Konten statis                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Tiga siaran pers terbaru. Belum ada di `@repo/data`, jadi ditulis di sini
 * sebagai konten halaman — bukan komponen atau data bersama yang dibuat ulang.
 */
interface SiaranPers {
  readonly id: string;
  readonly tanggal: string;
  readonly judul: string;
  readonly ringkasan: string;
  readonly divisi: string;
  readonly halaman: string;
}

const SIARAN_PERS: readonly SiaranPers[] = [
  {
    id: 'sp-01',
    tanggal: '2026-09-12',
    judul: 'ZAMROED Bergerak Desak Audit Terbuka Izin Tambang di Hulu',
    ringkasan:
      'Aliansi masyarakat sipil menyerahkan berkas temuan sedimentasi kepada dinas lingkungan hidup dan meminta audit izin dibuka untuk publik.',
    divisi: 'Advokasi & Kajian Kebijakan',
    halaman: 'Empat halaman',
  },
  {
    id: 'sp-02',
    tanggal: '2026-09-06',
    judul: 'Pernyataan Sikap atas Penggusuran Permukiman Bantaran Sungai',
    ringkasan:
      'Relokasi tanpa ruang dialog dan tanpa jaminan pemulihan mata pencaharian berisiko memindahkan persoalan, bukan menyelesaikannya.',
    divisi: 'Solidaritas & Tanggap Bencana',
    halaman: 'Dua halaman',
  },
  {
    id: 'sp-03',
    tanggal: '2026-08-30',
    judul: 'Laporan Tengah Tahun Program Kedaulatan Ekologi dan Pangan',
    ringkasan:
      'Rekapitulasi capaian 14 dusun dampingan: luas lahan yang dipulihkan, jumlah rumah tangga penerima manfaat, serta penggunaan anggaran.',
    divisi: 'Kedaulatan Ekologi & Pangan',
    halaman: 'Enam halaman',
  },
];

type NadaBadge = 'neutral' | 'primary' | 'warning';

/**
 * Setiap kategori liputan punya nada badge tetap supaya pembaca mengenali
 * rubrik dari warna sebelum membaca teksnya. Nada tak dikenal jatuh ke
 * `neutral` — kategori baru dari redaksi tidak akan merusak tampilan.
 */
const NADA_KATEGORI: Record<string, NadaBadge> = {
  'Warta Aksi': 'primary',
  Kebijakan: 'warning',
  Edukasi: 'neutral',
  'Aksi Bersih': 'primary',
};

function nadaKategori(kategori: string): NadaBadge {
  return NADA_KATEGORI[kategori] ?? 'neutral';
}

/* -------------------------------------------------------------------------- */
/*  Ikon inline                                                                */
/* -------------------------------------------------------------------------- */

/** Panah kanan kecil untuk tautan "baca selengkapnya". */
function PanahIkon({ kelas }: { kelas?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={kelas}
    >
      <path d="M4 10h12M11 5l5 5-5 5" />
    </svg>
  );
}

/** Ikon dokumen untuk baris siaran pers. */
function DokumenIkon({ kelas }: { kelas?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={kelas}
    >
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Halaman                                                                    */
/* -------------------------------------------------------------------------- */

export default function LiputanAksiPage() {
  const [featured, ...sisanya] = articles;
  const kategori = Array.from(new Set(articles.map((artikel) => artikel.category)));

  return (
    <>
      {/* ── Hero ringkas ─────────────────────────────────────────────────── */}
      <header className="relative isolate overflow-hidden border-b border-editorial bg-brand-deep text-white">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-32 -z-10 h-80 w-80 rounded-full bg-brand-primary opacity-25 blur-3xl"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-40 left-1/4 -z-10 h-72 w-72 rounded-full bg-brand-accent opacity-10 blur-3xl"
        />

        <div className="mx-auto max-w-7xl px-5 py-section-compact sm:px-8 sm:py-section-normal">
          <div className="animate-fade-up">
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-brand-accent">
              <span aria-hidden="true" className="h-px w-8 shrink-0 bg-brand-accent opacity-70" />
              Beranda Liputan
            </p>

            <h1 className="text-display mt-5 max-w-3xl font-display font-bold text-white text-balance">
              Liputan dan Aksi
            </h1>

            <p className="measure-editorial mt-5 text-base leading-relaxed text-white/85 sm:text-lg">
              Gerakan ini tumbuh dari catatan lapangan yang ditulis apa adanya. Kami mencatat
              keberhasilan sebesar kami mencatat kegagalan — karena dokumentasi yang jujur adalah
              bentuk pertama dari pertanggungjawaban kepada warga yang kami dampingi.
            </p>
          </div>

          <dl className="mt-10 grid max-w-2xl grid-cols-2 gap-px overflow-hidden rounded-2xl bg-white/15 sm:max-w-none sm:grid-cols-3">
            {[
              { label: 'Liputan terbit', nilai: articles.length },
              { label: 'Rubrik redaksi', nilai: kategori.length },
              { label: 'Siaran pers terbaru', nilai: SIARAN_PERS.length },
            ].map((metrik) => (
              <div key={metrik.label} className="bg-brand-deep px-5 py-4">
                <dt className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-accent">
                  {metrik.label}
                </dt>
                <dd className="mt-2 font-display text-2xl font-bold tabular-nums text-white">
                  {metrik.nilai}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </header>

      {/* ── Daftar liputan + filter kategori ─────────────────────────────── */}
      <NewsFilter articles={articles} categories={kategori}>
        {/* Sorotan utama — artikel pertama, dengan citra besar dan tipografi lapang. */}
        {featured ? (
          <article className="group relative">
            <Card interactive className="flex flex-col">
              <a
                href={`/liputan-aksi/${featured.slug}`}
                className="block aspect-[16/9] w-full overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary sm:aspect-[21/9]"
                aria-label={`Baca liputan utama: ${featured.title}`}
              >
                <img
                  src={coverImage(featured.coverImage)}
                  alt={`Liputan utama — ${featured.title}`}
                  width={1200}
                  height={514}
                  className="h-full w-full object-cover transition-transform duration-500 ease-crisp motion-safe:group-hover:scale-[1.03]"
                  fetchPriority="high"
                />
              </a>

              <div className="px-5 py-6 sm:px-8 sm:py-9">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge tone="primary" dot>
                    Sorotan
                  </Badge>
                  <Badge tone={nadaKategori(featured.category)}>{featured.category}</Badge>
                </div>

                <h2 className="measure-editorial mt-5 font-display text-2xl font-bold leading-tight tracking-tight text-ink text-balance sm:text-3xl lg:text-4xl">
                  <a
                    href={`/liputan-aksi/${featured.slug}`}
                    className="no-underline transition-colors duration-200 ease-crisp hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                  >
                    {featured.title}
                  </a>
                </h2>

                <p className="measure-editorial mt-4 text-base leading-relaxed text-ink-secondary sm:text-lg">
                  {featured.excerpt}
                </p>

                <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-editorial pt-5">
                  <p className="text-sm font-semibold text-ink">{featured.author}</p>
                  <span aria-hidden="true" className="text-editorial">
                    •
                  </span>
                  <p className="text-sm text-ink-secondary">
                    <time dateTime={featured.publishedAt}>{formatDate(featured.publishedAt)}</time>
                  </p>
                  <ViewCounter
                    className="ml-auto"
                    views={featured.totalViews}
                    readMinutes={featured.readMinutes}
                  />
                </div>

                <Button
                  href={`/liputan-aksi/${featured.slug}`}
                  className="mt-6 w-full sm:w-auto"
                >
                  Baca liputan lengkap
                  <PanahIkon kelas="h-4 w-4" />
                </Button>
              </div>
            </Card>
          </article>
        ) : null}

        {/* Liputan lainnya dalam grid dua sampai tiga kolom. */}
        <ul className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8">
          {sisanya.map((artikel) => (
            <li key={artikel.id} className="flex">
              <Card interactive className="w-full">
                <a
                  href={`/liputan-aksi/${artikel.slug}`}
                  className="block aspect-[16/9] w-full overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-primary"
                  aria-label={`Baca liputan: ${artikel.title}`}
                >
                  <img
                    src={coverImage(artikel.coverImage)}
                    alt={`Foto liputan — ${artikel.title}`}
                    width={800}
                    height={450}
                    loading="lazy"
                    decoding="async"
                    className="h-full w-full object-cover transition-transform duration-500 ease-crisp motion-safe:group-hover/card:scale-[1.03]"
                  />
                </a>

                <CardHeader action={<Badge tone={nadaKategori(artikel.category)}>{artikel.category}</Badge>}>
                  <CardTitle as="h3">
                    <a
                      href={`/liputan-aksi/${artikel.slug}`}
                      className="no-underline transition-colors duration-200 ease-crisp hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
                    >
                      {artikel.title}
                    </a>
                  </CardTitle>
                </CardHeader>

                <CardBody>
                  <p className="line-clamp-3">{artikel.excerpt}</p>
                </CardBody>

                <CardFooter divider className="flex-col items-start gap-3">
                  <p className="text-sm text-ink-secondary">
                    <span className="font-semibold text-ink">{artikel.author}</span>
                    <span aria-hidden="true" className="select-none px-2 text-editorial">
                      •
                    </span>
                    <time dateTime={artikel.publishedAt}>{formatDate(artikel.publishedAt)}</time>
                  </p>
                  <ViewCounter views={artikel.totalViews} readMinutes={artikel.readMinutes} />
                </CardFooter>
              </Card>
            </li>
          ))}
        </ul>
      </NewsFilter>

      {/* ── Siaran pers ──────────────────────────────────────────────────── */}
      <section
        id="siaran-pers"
        aria-labelledby="siaran-pers-judul"
        className="scroll-mt-20 border-t border-editorial bg-surface-pure px-5 py-16 sm:px-8 md:py-24"
      >
        <div className="mx-auto max-w-7xl">
          <div className="animate-fade-up">
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-brand-primary">
              <span aria-hidden="true" className="h-px w-8 shrink-0 bg-brand-primary opacity-60" />
              Keterangan Resmi
            </p>
            <h2
              id="siaran-pers-judul"
              className="text-section mt-4 font-display font-bold text-ink"
            >
              Siaran Pers
            </h2>
            <p className="measure-editorial mt-4 text-base leading-relaxed text-ink-secondary md:text-lg">
              Pernyataan resmi dan berkas advokasi yang kami kirimkan kepada pemerintah, mitra, dan
              publik. Setiap dokumen dapat diunduh dan dikutip dengan mencantumkan sumbernya.
            </p>
          </div>

          <ul className="mt-10 divide-y divide-editorial border-y border-editorial md:mt-14">
            {SIARAN_PERS.map((siaran, indeks) => (
              <li key={siaran.id}>
                <div className="grid gap-6 py-7 md:grid-cols-12 md:items-start md:gap-8 md:py-8">
                  <div className="flex items-start gap-4 md:col-span-1">
                    <span
                      aria-hidden="true"
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-deep"
                    >
                      <DokumenIkon kelas="h-5 w-5" />
                    </span>
                    <span className="font-display text-2xl font-bold tabular-nums text-editorial md:hidden">
                      {String(indeks + 1).padStart(2, '0')}
                    </span>
                  </div>

                  <div className="md:col-span-8">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Badge tone="neutral">Siaran Pers</Badge>
                      <span className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-secondary">
                        {siaran.divisi}
                      </span>
                    </div>

                    <h3 className="mt-3 font-display text-lg font-semibold leading-snug tracking-tight text-ink text-balance sm:text-xl">
                      {siaran.judul}
                    </h3>

                    <p className="measure-editorial mt-3 text-sm leading-relaxed text-ink-secondary sm:text-base">
                      {siaran.ringkasan}
                    </p>

                    <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-ink-secondary">
                      <time dateTime={siaran.tanggal}>{formatDate(siaran.tanggal)}</time>
                      <span aria-hidden="true" className="select-none text-editorial">
                        •
                      </span>
                      <span>{siaran.halaman}</span>
                    </p>
                  </div>

                  <div className="flex flex-col items-start gap-2 md:col-span-3 md:items-end">
                    <Button href="#" variant="outline" size="sm">
                      Unduh PDF
                    </Button>
                    <Badge tone="warning" dot>
                      Dokumen demo
                    </Badge>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <p className="measure-editorial mt-8 text-sm leading-relaxed text-ink-secondary">
            Redaksi liputan ZAMROED Bergerak bersifat terbuka: koreksi, sanggahan, atau permintaan
            wawancara dapat dikirim ke humas@zamroedbergerak.id.
          </p>
        </div>
      </section>

      {/* Ruang kosong yang tidak pernah terlihat — jaring pengaman bila
          ruang redaksi benar-benar belum menerbitkan apa pun. */}
      {articles.length === 0 ? (
        <div className="px-5 py-16 sm:px-8">
          <div className="mx-auto max-w-3xl">
            <EmptyState
              title="Belum ada liputan yang terbit"
              description="Ruang redaksi kami sedang menyiapkan catatan lapangan berikutnya."
              action={<Button href="/">Kembali ke beranda</Button>}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
