import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';

import {
  Badge,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  Prose,
  Section,
  ShareButtons,
  ViewCounter,
  VideoEmbed,
} from '@repo/ui';
import type { BadgeTone } from '@repo/ui';
import type { Article } from '@repo/ui/types';
import { articles, getArticleBySlug } from '@repo/data';

import { ReadingProgress } from './reading-progress';

/* -------------------------------------------------------------------------- */
/*  Kontrak rute                                                              */
/* -------------------------------------------------------------------------- */

/** Params segmen dinamis untuk rute liputan aksi. */
export interface LiputanAksiPageProps {
  params: { slug: string };
}

/** Situs kanonik — dipakai untuk URL absolut pada metadata dan tombol bagikan. */
const SITE_URL = 'https://zamroedbergerak.id';

/** Kanal induk liputan aksi, tempat semua tautan "kembali" mengarah. */
const INDEX_PATH = '/liputan-aksi';

/**
 * Nama penerbit untuk kredit foto saat data tidak menyediakan fotografer
 * terpisah. Sengaja diturunkan dari penulis artikel agar kredit di bawah
 * gambar tidak pernah tampil kosong.
 */
const FALLBACK_CREDIT = 'Dokumentasi ZAMROED Bergerak';

/** Batas jumlah paragraf sebelum video disisipkan (setelah paragraf kedua). */
const VIDEO_AFTER_PARAGRAPH = 2;

/**
 * Sebagian artikel `@repo/data` masih menunjuk berkas contoh milik Jagatirta
 * (mis. `/images/water-testing.jpg`) yang belum diunggah ke folder publik
 * ZAMROED Bergerak. Selama migrasi aset belum selesai, berkas yang belum
 * tersedia dipetakan ke foto gerakan yang sudah ada sehingga tidak ada gambar
 * rusak di halaman. Peta ini harus sama persis dengan yang dipakai halaman
 * indeks agar sampul yang tampak di daftar identik dengan sampul di sini.
 * Hapus begitu aset liputan ZAMROED diunggah.
 */
const ASET_GERAKAN = '/images/hero-movement.jpg';

const GAMBAR_LIPUTAN: Record<string, string> = {
  '/images/cleanup-campaign.jpg': '/images/rembuk-warga.jpg',
  '/images/water-testing.jpg': ASET_GERAKAN,
  '/images/mahakam.jpg': ASET_GERAKAN,
  '/images/pendidikan-akar-rumput.jpg': '/images/sejarah-archive.jpg',
};

/** Sampul yang benar-benar ada di `public/images` milik aplikasi ini. */
function coverImage(src: string): string {
  return GAMBAR_LIPUTAN[src] ?? src;
}

/**
 * Nada badge per rubrik, sengaja disamakan dengan halaman indeks supaya
 * pembaca mengenali rubrik dari warna sebelum membaca teksnya.
 */
const NADA_KATEGORI: Record<string, BadgeTone> = {
  'Warta Aksi': 'primary',
  Kebijakan: 'warning',
  Edukasi: 'neutral',
  'Aksi Bersih': 'primary',
};

function nadaKategori(kategori: string): BadgeTone {
  return NADA_KATEGORI[kategori] ?? 'neutral';
}

/**
 * Static generation untuk seluruh liputan. Satu halaman per slug, dirender
 * sekali saat build — tidak ada lagi komputasi di sisi permintaan.
 */
export function generateStaticParams(): Array<{ slug: string }> {
  return articles.map((article) => ({ slug: article.slug }));
}

/** Slug yang tidak dikenal tetap dicoba dirender dinamis, lalu jatuh ke 404. */
export const dynamicParams = false;

/* -------------------------------------------------------------------------- */
/*  Utilitas editorial                                                        */
/* -------------------------------------------------------------------------- */

/** Tanggal liputan dalam Bahasa Indonesia, mis. "9 September 2026". */
function formatTanggalIndonesia(iso: string): string {
  const parsed = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return iso;

  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(parsed);
}

/** Kredit foto: ambil nama setelah kata "Tim" bila ada, agar tidak "Tim Dokumentasi". */
function kreditFoto(article: Article): string {
  const penulis = article.author.trim();
  if (penulis.length === 0) return FALLBACK_CREDIT;

  const tanpaPrefix = penulis.replace(/^(tim|divisi|humas)\s+/i, '').trim();
  return `Dokumentasi ${tanpaPrefix.length > 0 ? tanpaPrefix : penulis} untuk ZAMROED Bergerak`;
}

/**
 * Dua liputan lain untuk bagian "Baca juga". Liputan satu kategori didahulukan
 * agar ajakan membacanya relevan, lalu sisanya mengisi bila kategori terlalu sempit.
 */
function pilihBacaanLain(slug: string, category: string): Article[] {
  const lain = articles.filter((article) => article.slug !== slug);
  const seKategori = lain.filter((article) => article.category === category);
  const sisanya = lain.filter((article) => article.category !== category);
  return [...seKategori, ...sisanya].slice(0, 2);
}

/* -------------------------------------------------------------------------- */
/*  Metadata                                                                  */
/* -------------------------------------------------------------------------- */

export function generateMetadata({ params }: LiputanAksiPageProps): Metadata {
  const article = getArticleBySlug(params.slug);

  if (!article) {
    return {
      title: 'Liputan tidak ditemukan — ZAMROED Bergerak',
      description:
        'Liputan aksi yang Anda cari tidak tersedia di kanal liputan ZAMROED Bergerak.',
    };
  }

  const url = `${SITE_URL}${INDEX_PATH}/${article.slug}`;

  return {
    title: `${article.title} — ZAMROED Bergerak`,
    description: article.excerpt,
    keywords: article.tags,
    alternates: { canonical: url },
    authors: [{ name: article.author }],
    openGraph: {
      type: 'article',
      locale: 'id_ID',
      siteName: 'ZAMROED Bergerak',
      url,
      title: article.title,
      description: article.excerpt,
      publishedTime: article.publishedAt,
      authors: [article.author],
      tags: article.tags,
      images: [
        {
          url: article.coverImage,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description: article.excerpt,
      images: [article.coverImage],
    },
  };
}

/* -------------------------------------------------------------------------- */
/*  Halaman                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Halaman baca liputan aksi — permukaan baca utama ZAMROED Bergerak.
 *
 * Alur baca dirancang satu kolom, terpusat, dengan lebar baris yang nyaman:
 * label kategori → judul display → standfirst → baris meta (penulis, tanggal,
 * jumlah dibaca, waktu baca, tombol bagikan) → gambar utama 16:9 → isi → aksi
 * bagikan ulang → ajakan membaca dua liputan lain.
 *
 * Seluruh warna memakai token `brand.*` / `ink` / `editorial` yang dibind oleh
 * `.theme-zamroed` pada `<html>`, jadi tidak ada satu pun hex yang dikunci di
 * sini. Komponen server sepenuhnya; hanya bilah kemajuan gulir yang dikirim
 * ke klien.
 */
export default function LiputanAksiPage({ params }: LiputanAksiPageProps) {
  const article = getArticleBySlug(params.slug);

  if (!article) {
    notFound();
  }

  const shareUrl = `${SITE_URL}${INDEX_PATH}/${article.slug}`;
  const tanggal = formatTanggalIndonesia(article.publishedAt);
  const bacaanLain = pilihBacaanLain(article.slug, article.category);
  const sampul = coverImage(article.coverImage);

  // Video disisipkan setelah paragraf kedua; bila artikelnya lebih pendek,
  // video jatuh ke akhir isi agar tidak ada blok yang hilang begitu saja.
  const titikVideo = Math.min(VIDEO_AFTER_PARAGRAPH, article.body.length);

  return (
    <main className="bg-canvas pb-24 pt-10 sm:pt-14 md:pb-32">
      <ReadingProgress />

      <article>
        {/* ---------- Kepala artikel: satu kolom terpusat ---------- */}
        <header className="mx-auto w-full max-w-3xl px-5 sm:px-8">
          <div className="animate-fade-up motion-reduce:animate-none">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
              <Badge tone={nadaKategori(article.category)}>{article.category}</Badge>
              <Link
                href={INDEX_PATH}
                className="inline-flex min-h-12 items-center gap-2 text-sm font-semibold text-ink-secondary no-underline transition-colors duration-200 ease-crisp hover:text-brand-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
              >
                <span aria-hidden="true">←</span>
                Liputan Aksi
              </Link>
            </div>

            <h1 className="text-display mt-6 font-display font-bold text-balance text-ink">
              {article.title}
            </h1>

            {/* Standfirst — suara kedua halaman, dibedakan lewat ukuran dan warna. */}
            <p className="measure-editorial mt-6 text-lg leading-relaxed text-ink-secondary text-pretty md:text-2xl md:leading-[1.5]">
              {article.excerpt}
            </p>
          </div>

          {/* ---------- Baris meta editorial ---------- */}
          <div className="mt-8 flex flex-col gap-5 border-y border-editorial py-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-4">
              <span
                aria-hidden="true"
                className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-brand-deep font-display text-base font-bold text-brand-accent"
              >
                {article.author.charAt(0).toUpperCase()}
              </span>
              <p className="min-w-0">
                <span className="block truncate font-display text-base font-semibold text-ink">
                  {article.author}
                </span>
                <time dateTime={article.publishedAt} className="block text-sm text-ink-secondary">
                  {tanggal}
                </time>
              </p>
            </div>

            <ViewCounter
              views={article.totalViews}
              readMinutes={article.readMinutes}
              className="shrink-0"
            />
          </div>
        </header>

        {/* ---------- Gambar utama 16:9, sedikit lebih lebar dari teks ---------- */}
        <figure className="mx-auto mt-10 w-full max-w-5xl px-5 sm:px-8 md:mt-12">
          <div className="relative isolate aspect-video w-full overflow-hidden rounded-2xl bg-brand-deep ring-1 ring-inset ring-editorial">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={sampul}
              alt={`Foto utama liputan: ${article.title}`}
              width={1600}
              height={900}
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
          <figcaption className="mt-3 px-1 text-sm leading-relaxed text-ink-secondary">
            <span className="measure-editorial block">
              Suasana liputan {article.category.toLowerCase()} di {tanggal}.
            </span>
            <span className="mt-1.5 block text-[0.6875rem] uppercase tracking-[0.08em] text-ink-secondary/70">
              Foto: {kreditFoto(article)}
            </span>
          </figcaption>
        </figure>

        {/* ---------- Isi liputan ---------- */}
        <div className="mx-auto mt-12 w-full max-w-3xl px-5 sm:px-8 md:mt-16">
          <Prose as="div" width="editorial" size="lead" className="mx-auto">
            {article.body.slice(0, titikVideo).map((paragraf, index) => (
              <p key={`paragraf-${index}`}>{paragraf}</p>
            ))}

            {article.videoUrl ? (
              <VideoEmbed
                url={article.videoUrl}
                title={`Video liputan: ${article.title}`}
                caption={`Rekaman lapangan oleh ${article.author}, ${tanggal}.`}
                className="my-12"
              />
            ) : null}

            {article.body.slice(titikVideo).map((paragraf, index) => (
              <p key={`lanjutan-${index}`}>{paragraf}</p>
            ))}
          </Prose>

          {/* ---------- Penutup: label, aksi bagikan, jalan kembali ---------- */}
          <footer className="mt-14 border-t border-editorial pt-8">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-primary">
              Bagikan liputan ini
            </p>
            <p className="measure-editorial mt-3 text-base leading-relaxed text-ink-secondary">
              Satu tautan yang tersebar lebih jauh daripada satu aksi yang tidak diceritakan.
              Kirimkan liputan ini ke jaringan Anda.
            </p>

            <ShareButtons
              title={article.title}
              url={shareUrl}
              label={`Bagikan liputan: ${article.title}`}
              compact={false}
              className="mt-6"
            />

            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <ul className="flex flex-wrap gap-2" aria-label="Tag liputan">
                {article.tags.map((tag) => (
                  <li key={tag}>
                    <Badge tone="neutral">#{tag}</Badge>
                  </li>
                ))}
              </ul>

              <Button href={INDEX_PATH} variant="outline" size="sm" className="shrink-0">
                Semua liputan aksi
              </Button>
            </div>
          </footer>
        </div>
      </article>

      {/* ---------- Baca juga ---------- */}
      <Section
        id="baca-juga"
        eyebrow="Baca juga"
        title="Warta lain dari lapangan"
        description="Liputan pendamping yang menyorot aksi, musyawarah, dan solidaritas warga di daerah lain."
        className="mt-20 border-t border-editorial bg-surface md:mt-28"
      >
        <ul className="grid gap-6 sm:grid-cols-2 lg:gap-8">
          {bacaanLain.map((lain) => (
            <li key={lain.slug} className="flex">
              <Card href={`${INDEX_PATH}/${lain.slug}`} interactive className="h-full w-full">
                <div className="relative isolate aspect-video w-full overflow-hidden bg-brand-deep">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverImage(lain.coverImage)}
                    alt=""
                    width={1600}
                    height={900}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 ease-crisp motion-safe:group-hover/card:scale-105"
                  />
                </div>

                <CardHeader>
                  <Badge tone={nadaKategori(lain.category)}>{lain.category}</Badge>
                  <CardTitle className="mt-1">{lain.title}</CardTitle>
                </CardHeader>

                <CardBody>
                  <p className="line-clamp-3">{lain.excerpt}</p>
                </CardBody>

                <CardFooter divider className="justify-between">
                  <span className="text-sm font-semibold text-brand-primary">
                    Baca liputan
                    <span aria-hidden="true" className="ml-1">
                      →
                    </span>
                  </span>
                  <ViewCounter views={lain.totalViews} readMinutes={lain.readMinutes} compact />
                </CardFooter>
              </Card>
            </li>
          ))}
        </ul>
      </Section>
    </main>
  );
}
