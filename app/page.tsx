import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Flag,
  GraduationCap,
  Handshake,
  HeartHandshake,
  Scale,
  ShieldCheck,
  Sprout,
  type LucideIcon,
} from 'lucide-react';

import {
  Badge,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
  Reveal,
  RevealGroup,
  Section,
  StatCounter,
  ViewCounter,
} from '@repo/ui';
import type { Article, Program } from '@repo/ui/types';
import { articles, zamroedPrograms } from '@repo/data';

export const metadata: Metadata = {
  title: 'ZAMROED Bergerak — Kedaulatan Ekologi dan Keadilan Sosial',
  description:
    'Gerakan akar rumput untuk kedaulatan ekologi dan keadilan sosial: mendampingi warga mengelola sumber daya alamnya sendiri, dan hadir lebih awal saat bencana melanda.',
};

/* -------------------------------------------------------------------------- */
/*  Pemetaan data bersama                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Data program menyimpan nama ikon lucide sebagai string. Lookup ini
 * memetakannya ke komponen tanpa `any`; program tanpa padanan diberi ikon
 * cadangan `Flag` agar kartu tidak pernah tampil kopong.
 */
const PROGRAM_ICONS: Record<string, LucideIcon> = {
  Sprout,
  HeartHandshake,
  GraduationCap,
  Scale,
};

/**
 * Liputan beranda: aksi ZAMROED Bergerak sendiri lebih dulu, lalu aksi
 * lapangan lain dari jaringan. Diurutkan ulang — bukan disaring — supaya tiga
 * kartu selalu terisi walau komposisi data berubah.
 */
const FEATURED_ARTICLES: readonly Article[] = (() => {
  const ownActions = articles.filter((article) =>
    article.tags.some((tag) => tag.toLowerCase().includes('zamroed')),
  );
  const rest = articles.filter((article) => !ownActions.includes(article));

  return [...ownActions, ...rest].slice(0, 3);
})();

/** Tanggal terbit dalam format Indonesia, mis. "8 September 2026". */
const ARTICLE_DATE_FORMAT = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

function formatArticleDate(isoDate: string): string {
  const parsed = new Date(`${isoDate}T00:00:00Z`);

  return Number.isNaN(parsed.getTime()) ? isoDate : ARTICLE_DATE_FORMAT.format(parsed);
}

/* -------------------------------------------------------------------------- */
/*  Konten statis                                                              */
/* -------------------------------------------------------------------------- */

interface Mission {
  readonly title: string;
  readonly detail: string;
}

const MISSIONS: readonly Mission[] = [
  {
    title: 'Mendampingi warga mengelola sumber daya alamnya sendiri',
    detail:
      'Kedaulatan tidak pernah diberikan, ia dirawat. Kami mendampingi komunitas tani, nelayan, dan masyarakat adat menata sumber daya alamnya sendiri — bersandar pada pengetahuan lokal dan data lapangan.',
  },
  {
    title: 'Hadir paling awal saat bencana melanda',
    detail:
      'Solidaritas yang berarti bukan yang datang setelah sorotan kamera. Kami bergerak dalam 24 jam pertama, membawa air bersih dan logistik, lalu bertahan sampai pemulihannya benar-benar selesai.',
  },
  {
    title: 'Membentuk kader muda yang berani dan berintegritas',
    detail:
      'Gerakan yang adil tidak tumbuh dari organisasi yang kuat, melainkan dari orang-orang yang kuat. Kader kami belajar langsung di dusun dan bertanggung jawab atas hasilnya.',
  },
];

interface CoreValue {
  readonly title: string;
  readonly summary: string;
  readonly detail: string;
  readonly icon: LucideIcon;
}

const CORE_VALUES: readonly CoreValue[] = [
  {
    title: 'Keberanian',
    summary:
      'Keberanian bukan ketiadaan rasa takut, melainkan kesediaan berdiri di depan ketika tekanan datang. Kami mendampingi warga yang sering kali tidak punya siapa pun untuk bersuara.',
    detail:
      'Karena itu setiap aksi berangkat dari keputusan warga sendiri, bukan kepentingan organisasi. Bila warga belum siap, kami menunggu — bukan mendorong.',
    icon: ShieldCheck,
  },
  {
    title: 'Gotong Royong',
    summary:
      'Gerakan ini tumbuh dari dapur bersama, rapat dusun, dan kerja bakti — bukan dari ruang rapat berpendingin udara. Keputusan terbaik lahir paling dekat dengan tanah yang digarap.',
    detail:
      'Setiap program dimulai dengan rembuk warga, dijalankan penanggung jawab yang dipilih warga itu sendiri, dan ditutup dengan laporan yang terbuka bagi siapa pun.',
    icon: Handshake,
  },
  {
    title: 'Integritas dan Kedaulatan',
    summary:
      'Kepercayaan warga adalah modal satu-satunya yang kami miliki, dan tidak ada pertimbangan yang boleh menukarnya. Setiap rupiah bantuan dan setiap data kami laporkan apa adanya.',
    detail:
      'Dari integritas itu tumbuh kedaulatan: kemampuan komunitas menentukan jalan hidupnya sendiri, tanpa dikendalikan pihak luar.',
    icon: Scale,
  },
];

interface ImpactStat {
  readonly value: number;
  readonly label: string;
  readonly suffix?: string;
}

const IMPACT_STATS: readonly ImpactStat[] = [
  { value: 1240, label: 'Jiwa Terbantu' },
  { value: 86, label: 'Titik Aksi' },
  { value: 24, label: 'Provinsi Terjangkau' },
  { value: 12500, label: 'Pohon Tertanam' },
];

/* -------------------------------------------------------------------------- */
/*  Komponen lokal                                                             */
/* -------------------------------------------------------------------------- */

/** Ikon pilar program dari data bersama; tanpa padanan dipakai ikon cadangan. */
function ProgramIcon({ name }: { name: string }) {
  const Icon = PROGRAM_ICONS[name] ?? Flag;

  return (
    <span
      aria-hidden="true"
      className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-deep ring-1 ring-inset ring-brand-primary/30"
    >
      <Icon className="h-6 w-6" strokeWidth={1.75} />
    </span>
  );
}

/** Kartu pilar program ZAMROED Bergerak. */
function ProgramCard({ program }: { program: Program }) {
  return (
    <Card
      interactive
      href="/program"
      aria-label={`Lihat program: ${program.title}`}
     
    >
      <CardBody className="flex h-full flex-col gap-4">
        <ProgramIcon name={program.icon} />
        <CardTitle as="h3">{program.title}</CardTitle>
        <p className="text-sm leading-relaxed text-ink-secondary">{program.description}</p>
        <span className="mt-auto inline-flex items-center gap-2 pt-1 text-sm font-semibold text-brand-primary">
          Selengkapnya
          <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
        </span>
      </CardBody>
    </Card>
  );
}

/** Kartu liputan aksi terbaru dari @repo/data. */
function ArticleCard({ article }: { article: Article }) {
  return (
    <Card
      interactive
      href={`/liputan-aksi/${article.slug}`}
     
    >
      <figure className="aspect-[16/9] w-full overflow-hidden bg-canvas">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={article.coverImage}
          alt={article.title}
          width={1600}
          height={900}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 ease-crisp motion-reduce:transition-none group-hover/card:scale-[1.03]"
        />
      </figure>

      <CardHeader action={<Badge tone="primary">{article.category}</Badge>}>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-secondary">
          {formatArticleDate(article.publishedAt)}
        </p>
        <CardTitle as="h3">{article.title}</CardTitle>
      </CardHeader>

      <CardBody>{article.excerpt}</CardBody>

      <CardFooter divider>
        <ViewCounter
          views={article.totalViews}
          readMinutes={article.readMinutes}
          aria-hidden="true"
        />
        <span
          aria-hidden="true"
          className="ml-auto inline-flex items-center gap-2 text-sm font-semibold text-brand-primary"
        >
          Baca liputan
          <ArrowRight className="h-4 w-4" strokeWidth={2} />
        </span>
      </CardFooter>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Beranda                                                                    */
/* -------------------------------------------------------------------------- */

export default function Page() {
  return (
    <main>
      {/* ───────── 1. HERO ───────── */}
      <section className="relative isolate overflow-hidden bg-brand-deep">
        <figure className="absolute inset-0 -z-20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/hero-movement.jpg"
            alt="Relawan ZAMROED Bergerak berjalan bersama warga menuju titik aksi di lapangan."
            width={2400}
            height={1350}
            fetchPriority="high"
            className="h-full w-full object-cover"
          />
        </figure>

        {/* Lapisan gelap: pekat di kiri-tengah agar teks tetap terbaca, lalu
            meredup ke kanan supaya foto tetap terlihat pada layar lebar. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-deep/85 via-brand-deep/80 to-brand-deep/95 md:bg-gradient-to-r md:from-brand-deep/95 md:via-brand-deep/75 md:to-brand-deep/30"
        />
        <div
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 -z-10 h-px bg-gradient-to-r from-transparent via-gold-ochre/60 to-transparent"
        />

        <div className="mx-auto flex min-h-[80svh] max-w-7xl flex-col justify-center px-5 py-section-normal sm:px-8 md:min-h-[88svh] md:py-section-loose">
          <Reveal>
            {/*
              Label memakai nada emas terang, bukan `gold-ochre` pekat: teks
              kapital kecil di atas foto berisiko gagal rasio kontras 4.5:1
              yang disyaratkan WCAG AA untuk ukuran ini.
            */}
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">
              <span aria-hidden="true" className="h-px w-8 shrink-0 bg-amber-300/80" />
              Gerakan Akar Rumput
            </p>
          </Reveal>

          <Reveal delay={80}>
            <h1 className="text-display measure-editorial mt-6 font-display font-bold text-white text-balance">
              Bergerak dari akar rumput, untuk Indonesia yang berdaulat.
            </h1>
          </Reveal>

          <Reveal delay={150}>
            <p className="measure-editorial mt-6 text-lg leading-relaxed text-white/90">
              Kami mendampingi warga desa, pesisir, dan bantaran sungai mengelola sumber daya
              alamnya sendiri — lalu hadir lebih dulu daripada siapa pun ketika bencana memaksa
              mereka bertahan.
            </p>
          </Reveal>

          <Reveal
            delay={220}
            className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center"
          >
            <Button href="/volunteer" size="lg" variant="primary">
              Gabung Relawan
              <ArrowRight aria-hidden="true" className="h-5 w-5" strokeWidth={2} />
            </Button>
            <Button
              href="/sejarah"
              size="lg"
              variant="outline"
              className="border-white/40 text-white hover:border-white hover:bg-white/10 hover:text-white"
            >
              Kenali Sejarah Kami
            </Button>
          </Reveal>

          {/* Opacity dinaikkan dari 70% ke 85%: pada 14px di atas hijau gelap,
              nada sebelumnya berada di ambang bawah keterbacaan. */}
          <Reveal as="p" delay={300} className="mt-10 flex items-center gap-3 text-sm text-white/85">
            <span aria-hidden="true" className="h-px w-10 shrink-0 bg-amber-300/80" />
            Berdiri sejak 2013, digerakkan sepenuhnya oleh relawan lapangan.
          </Reveal>
        </div>
      </section>

      {/* ───────── 2. VISI & MISI ───────── */}
      <Section id="visi-misi" density="loose">
        <div className="grid gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-24">
          {/* Visi — pernyataan terpenting di halaman ini. */}
          <div className="border-l-4 border-gold-ochre pl-6 sm:pl-10">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold-muted">
              Visi
            </p>
            <p className="text-section measure-editorial mt-8 font-display font-bold text-ink text-balance md:text-[clamp(1.9rem,1.35rem+2vw,2.9rem)]">
              Indonesia yang kedaulatannya dipegang warga: tanah, air, dan hutan dikelola oleh
              mereka yang hidup di atasnya — dalam masyarakat yang adil, setara, dan bermartabat.
            </p>
          </div>

          {/* Misi — tiga langkah yang dapat diperiksa satu per satu. */}
          <div className="lg:pt-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-primary">
              Misi
            </p>

            <ol className="mt-8 flex flex-col">
              {MISSIONS.map((mission, index) => (
                <li
                  key={mission.title}
                  className="flex gap-5 border-t border-editorial py-7 first:border-t-0 first:pt-0 sm:gap-7"
                >
                  <span className="font-display text-3xl font-bold leading-none tracking-tight text-gold-ochre tabular-nums sm:text-4xl">
                    <span className="sr-only">Misi {index + 1}. </span>
                    <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-display text-lg font-semibold leading-snug tracking-tight text-ink text-balance">
                      {mission.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-ink-secondary sm:text-base">
                      {mission.detail}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </Section>

      {/* ───────── 3. NILAI DASAR ───────── */}
      <Section
        id="nilai-dasar"
        eyebrow="Nilai Dasar"
        title="Tiga hal yang tidak kami tawar-menawar"
        description="Nilai bukan hiasan dinding. Ia yang menentukan siapa yang kami dampingi, bagaimana kami mengambil keputusan, dan kapan kami memilih mundur."
      >
        <RevealGroup className="card-grid gap-5 md:grid-cols-3 md:gap-6">
          {CORE_VALUES.map((value) => {
            const Icon = value.icon;

            return (
              <Card key={value.title}>
                <CardBody className="flex h-full flex-col gap-4">
                  <span
                    aria-hidden="true"
                    className="grid h-12 w-12 place-items-center rounded-xl bg-brand-soft text-brand-deep"
                  >
                    <Icon className="h-6 w-6" strokeWidth={1.75} />
                  </span>

                  <CardTitle as="h3">{value.title}</CardTitle>

                  <p className="text-sm leading-relaxed text-ink-secondary">{value.summary}</p>
                  <p className="border-t border-editorial pt-4 text-sm leading-relaxed text-ink-secondary">
                    {value.detail}
                  </p>
                </CardBody>
              </Card>
            );
          })}
        </RevealGroup>
      </Section>

      {/* ───────── 4. DAMPAK ───────── */}
      <Section
        id="dampak"
        tone="dark"
        eyebrow="Dampak Sejauh Ini"
        title="Angka yang berdiri di atas nama-nama warga"
        description="Setiap angka di bawah ini berasal dari satu catatan lapangan, satu dusun, dan satu nama yang menandatanganinya."
      >
        <dl className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {IMPACT_STATS.map((stat) => (
            <div key={stat.label} className="border-t border-white/15 pt-6">
              <StatCounter
                value={stat.value}
                label={stat.label}
                suffix={stat.suffix}
                className="[&_p]:text-white [&_span]:text-brand-accent"
              />
            </div>
          ))}
        </dl>
      </Section>

      {/* ───────── 5. PILAR PROGRAM ───────── */}
      <Section
        id="pilar-program"
        eyebrow="Pilar Program"
        title="Empat cara kami bekerja di lapangan"
        description="Semuanya berjalan bersamaan, karena krisis ekologi jarang datang satu per satu — dan solusinya jarang bisa dipisah-pisah."
      >
        <RevealGroup className="card-grid gap-5 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {zamroedPrograms.map((program) => (
            <ProgramCard key={program.id} program={program} />
          ))}
        </RevealGroup>

        <div className="mt-12">
          <Button href="/program" variant="secondary" size="md">
            Lihat seluruh pilar program
            <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
          </Button>
        </div>
      </Section>

      {/* ───────── 6. LIPUTAN TERBARU ───────── */}
      <Section
        id="liputan-terbaru"
        eyebrow="Liputan Terbaru"
        title="Catatan dari titik aksi"
        description="Ditulis oleh relawan yang benar-benar berada di lokasi, lengkap dengan angka dan tanggalnya."
      >
        <RevealGroup className="card-grid gap-5 md:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {FEATURED_ARTICLES.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </RevealGroup>

        <div className="mt-12">
          <Link
            href="/liputan-aksi"
            className="inline-flex min-h-[48px] items-center gap-2 text-base font-semibold text-brand-primary underline decoration-gold-ochre decoration-2 underline-offset-8 transition-colors duration-200 ease-crisp hover:text-brand-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
          >
            Selengkapnya di Liputan Aksi
            <ArrowRight aria-hidden="true" className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      </Section>

      {/* ───────── 7. AJAKAN PENUTUP ───────── */}
      <Section id="ajakan">
        <div className="relative overflow-hidden rounded-2xl border border-editorial bg-surface px-6 py-section-normal sm:px-12 md:px-16 md:py-section-normal">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b from-gold-ochre via-brand-primary to-brand-deep"
          />

          <div className="grid gap-12 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center lg:gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-gold-muted">
                Ajakan
              </p>

              <h2 className="text-section mt-6 font-display font-bold text-ink text-balance md:text-[clamp(2rem,1.4rem+2.2vw,3rem)]">
                Perubahan tidak menunggu sempurna.
              </h2>

              <p className="measure-editorial mt-6 text-base leading-relaxed text-ink-secondary md:text-lg">
                Ia menunggu satu orang yang bersedia mulai lebih dulu. Bisa dengan menyisihkan
                satu hari dalam sebulan, menyumbang sepuluh kilogram beras, atau membaca satu
                liputan sampai selesai lalu meneruskannya kepada orang lain.
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap lg:flex-col lg:items-start">
              <Button href="/volunteer" size="lg" variant="primary">
                Gabung Relawan
                <ArrowRight aria-hidden="true" className="h-5 w-5" strokeWidth={2} />
              </Button>
              <Button href="/liputan-aksi" size="lg" variant="outline">
                Baca Liputan Aksi
              </Button>
            </div>
          </div>
        </div>
      </Section>
    </main>
  );
}
