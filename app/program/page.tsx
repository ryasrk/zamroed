import type { Metadata } from 'next';
import {
  ArrowRight,
  GraduationCap,
  HeartHandshake,
  Scale,
  Sprout,
  Waves,
  type LucideIcon,
} from 'lucide-react';

import { Button, Card, CardBody, Section } from '@repo/ui';
import { zamroedPrograms } from '@repo/data';
import type { Program } from '@repo/ui/types';

export const metadata: Metadata = {
  title: 'Program — ZAMROED Bergerak',
  description:
    'Empat pilar kerja ZAMROED Bergerak: kedaulatan ekologi dan pangan, solidaritas tanggap bencana, pendidikan akar rumput, serta advokasi kebijakan berbasis data.',
};

/* -------------------------------------------------------------------------- */
/*  Lapisan penyajian per pilar                                               */
/* -------------------------------------------------------------------------- */

interface ProgramDetail {
  /** Ikon Lucide yang mewakili pilar. */
  icon: LucideIcon;
  /** Nomor pilar — dipakai sebagai penanda tipografis, bukan hiasan. */
  index: string;
  /** Kicker pendek di atas judul. */
  kicker: string;
  /** Gambar publik (wajib ada di folder public/images). */
  image: string;
  /** Teks alternatif deskriptif untuk pembaca layar. */
  imageAlt: string;
  /** Tiga kegiatan konkret di lapangan. */
  activities: readonly string[];
}

/**
 * Detail penyajian dipisahkan dari `@repo/data` supaya judul dan deskripsi
 * tetap berasal dari satu sumber data, sementara ikon, gambar, dan daftar
 * kegiatan bisa dibaca editor sebagai satu tabel.
 */
const PROGRAM_DETAIL: Record<string, ProgramDetail> = {
  'kedaulatan-ekologi': {
    icon: Sprout,
    index: '01',
    kicker: 'Pilar Kedaulatan Ekologi & Pangan',
    image: '/images/kedaulatan-pangan.jpg',
    imageAlt:
      'Petani binaan ZAMROED Bergerak menanam bibit pangan di lahan komunal bersama warga desa.',
    activities: [
      'Pendampingan bank benih dan pekarangan pangan komunal di 18 desa',
      'Sekolah lapang pertanian agroekologi untuk 400 keluarga tani',
      'Pendampingan nelayan kecil dan komunitas adat dalam tata kelola wilayah kelola',
    ],
  },
  'tanggap-bencana': {
    icon: HeartHandshake,
    index: '02',
    kicker: 'Pilar Solidaritas & Tanggap Bencana',
    image: '/images/tanggap-bencana.jpg',
    imageAlt:
      'Tim relawan ZAMROED Bergerak menurunkan bantuan logistik dari perahu di permukiman terdampak banjir.',
    activities: [
      'Distribusi air bersih pada 72 jam pertama',
      'Pemetaan kerusakan partisipatif bersama warga',
      'Pendampingan pemulihan mata pencaharian',
    ],
  },
  'pendidikan-akar-rumput': {
    icon: GraduationCap,
    index: '03',
    kicker: 'Pilar Pendidikan Akar Rumput',
    image: '/images/rembuk-warga.jpg',
    imageAlt:
      'Puluhan warga duduk melingkar dalam forum rembuk untuk merancang program pendidikan komunitas.',
    activities: [
      'Sekolah lapangan kader muda dengan kurikulum 12 pekan per angkatan',
      'Perpustakaan keliling yang melayani 30 kampung setiap bulan',
      'Beasiswa dan pendampingan penulisan untuk jurnalis warga',
    ],
  },
  'advokasi-kebijakan': {
    icon: Scale,
    index: '04',
    kicker: 'Pilar Advokasi & Kajian Kebijakan',
    image: '/images/sejarah-archive.jpg',
    imageAlt:
      'Berlembar dokumen arsip gerakan dan kliping media yang tersimpan rapi sebagai rujukan kajian kebijakan.',
    activities: [
      'Kajian dampak izin tambang dan sawit terhadap desa terdampak',
      'Pendampingan warga menyusun dokumen resmi atas pelanggaran izin',
      'Audensi dan advokasi ke DPRD serta kementerian terkait',
    ],
  },
};

/** Ikon cadangan bila slug tidak terdaftar di tabel detail. */
const FALLBACK_ICON: LucideIcon = Waves;

/** Ambil detail penyajian dengan aman tanpa `any`. */
function toProgramDetail(program: Program, index: number): ProgramDetail {
  const known = PROGRAM_DETAIL[program.slug];
  if (known) return known;

  return {
    icon: FALLBACK_ICON,
    index: String(index + 1).padStart(2, '0'),
    kicker: 'Pilar Gerakan',
    image: '/images/hero-movement.jpg',
    imageAlt: program.title,
    activities: [],
  };
}

/* -------------------------------------------------------------------------- */
/*  Daftar kegiatan — dipakai oleh band utama maupun kartu tiga-up            */
/* -------------------------------------------------------------------------- */

interface ActivityListProps {
  activities: readonly string[];
  /** Nada terang dipakai di atas latar gelap. */
  tone?: 'dark' | 'light';
  className?: string;
}

function ActivityList({ activities, tone = 'light', className }: ActivityListProps) {
  const isDark = tone === 'dark';

  return (
    <ul className={className}>
      {activities.map((activity) => (
        <li key={activity} className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-accent"
          />
          <span
            className={
              isDark
                ? 'text-sm leading-relaxed text-white/90 md:text-base'
                : 'text-sm leading-relaxed text-ink md:text-base'
            }
          >
            {activity}
          </span>
        </li>
      ))}
    </ul>
  );
}

/* -------------------------------------------------------------------------- */
/*  Pilar utama — band selebar halaman                                        */
/* -------------------------------------------------------------------------- */

function FeatureBand({ program }: { program: Program }) {
  const detail = toProgramDetail(program, 0);
  const Icon = detail.icon;

  return (
    <article
      aria-labelledby={`pilar-${program.slug}`}
      className="grid overflow-hidden rounded-2xl border border-editorial bg-surface shadow-sm lg:grid-cols-12"
    >
      {/* Media: rasio aspek dikunci pembungkus sehingga CLS = 0. */}
      <div className="relative isolate aspect-[4/3] lg:col-span-7 lg:aspect-auto lg:min-h-[26rem]">
        <img
          src={detail.image}
          alt={detail.imageAlt}
          width={1600}
          height={1200}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 hidden bg-[linear-gradient(100deg,transparent_55%,rgba(6,78,59,0.55)_100%)] lg:block"
        />
      </div>

      {/* Narasi pilar utama */}
      <div className="flex flex-col justify-center gap-6 px-6 py-10 sm:px-10 lg:col-span-5 lg:py-14">
        <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-brand-primary">
          <Icon aria-hidden="true" focusable="false" className="h-4 w-4 shrink-0" />
          {detail.kicker}
        </p>

        <div>
          <span
            aria-hidden="true"
            className="block font-display text-5xl font-bold leading-none tracking-tight text-brand-soft sm:text-6xl"
          >
            {detail.index}
          </span>
          <h3
            id={`pilar-${program.slug}`}
            className="mt-3 font-display text-2xl font-bold leading-tight tracking-tight text-ink text-balance sm:text-3xl"
          >
            {program.title}
          </h3>
        </div>

        <p className="measure-editorial text-base leading-relaxed text-ink-secondary md:text-lg">
          {program.description}
        </p>

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-secondary">
            Kegiatan di lapangan
          </h4>
          <ActivityList activities={detail.activities} className="mt-4 space-y-3" />
        </div>
      </div>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tiga pilar pendukung — baris kartu                                        */
/* -------------------------------------------------------------------------- */

function ProgramCard({
  program,
  position,
}: {
  program: Program;
  /** Posisi dalam daftar penuh — dipakai sebagai nomor pilar. */
  position: number;
}) {
  const detail = toProgramDetail(program, position);
  const Icon = detail.icon;

  return (
    <Card
      interactive
      aria-labelledby={`pilar-${program.slug}`}
      className="h-full animate-fade-up motion-reduce:animate-none"
    >
      {/* Media kartu dengan rasio tetap — tinggi sudah final sebelum gambar tiba. */}
      <div className="relative aspect-[3/2] w-full overflow-hidden bg-canvas">
        <img
          src={detail.image}
          alt={detail.imageAlt}
          width={1200}
          height={800}
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <span
          aria-hidden="true"
          className="absolute left-4 top-4 font-display text-sm font-bold tabular-nums text-white drop-shadow-[0_1px_6px_rgba(0,0,0,0.55)]"
        >
          {detail.index}
        </span>
      </div>

      <CardBody className="flex flex-col gap-4">
        <p className="flex items-center gap-2.5 text-xs font-semibold uppercase leading-snug tracking-[0.16em] text-brand-primary">
          <Icon aria-hidden="true" focusable="false" className="h-4 w-4 shrink-0" />
          {detail.kicker}
        </p>

        <h3
          id={`pilar-${program.slug}`}
          className="font-display text-xl font-bold leading-snug tracking-tight text-ink text-balance"
        >
          {program.title}
        </h3>

        <p className="text-sm leading-relaxed text-ink-secondary">
          {program.description}
        </p>

        <ActivityList activities={detail.activities} className="mt-1 space-y-2.5" />
      </CardBody>
    </Card>
  );
}

/* -------------------------------------------------------------------------- */
/*  Halaman                                                                   */
/* -------------------------------------------------------------------------- */

const SYNERGY_POINTS = [
  {
    title: 'Satu data sungai, dua gerakan',
    body: 'Temuan uji air warga Jagatirta menjadi dasar advokasi kebijakan ZAMROED — apa yang terukur di sungai dibawa ke ruang pengambilan keputusan.',
  },
  {
    title: 'Simpul relawan yang sama',
    body: 'Kader ZAMROED di 24 provinsi dilatih protokol sains warga Jagatirta, sehingga pemantauan sungai berjalan di kampung yang paling sulit dijangkau.',
  },
  {
    title: 'Tanggap bencana berbasis peringatan dini',
    body: 'Ketika telemetri Jagatirta membaca muka air yang naik, tim solidaritas ZAMROED sudah bergerak mengungsikan warga sebelum banjir mencapai permukiman.',
  },
] as const;

export default function ProgramPage() {
  const [feature, ...rest] = zamroedPrograms;

  return (
    <main className="bg-canvas">
      {/* ── Hero kompak ───────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-brand-deep px-5 py-section-compact text-white sm:px-8 md:py-section-normal">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 -z-10 h-64 w-64 rounded-full bg-brand-primary opacity-25 blur-3xl"
        />
        <div className="mx-auto max-w-7xl">
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-brand-accent">
            <span aria-hidden="true" className="h-px w-8 shrink-0 bg-brand-accent opacity-70" />
            ZAMROED Bergerak
          </p>

          <h1 className="text-display measure-editorial mt-4 font-display font-bold text-white">
            Program
          </h1>

          <p className="measure-editorial mt-5 text-base leading-relaxed text-white/80 md:text-lg">
            Seluruh kerja gerakan bertumpu pada empat pilar yang saling menopang: kedaulatan
            ekologi dan pangan agar warga berdaulat atas sumber daya di tanahnya sendiri,
            solidaritas tanggap bencana yang hadir pada jam-jam paling kritis, pendidikan akar
            rumput yang menumbuhkan kader dari kampung sendiri, serta advokasi kebijakan
            berbasis data yang memastikan kebenaran warga terdengar di ruang pengambilan
            keputusan.
          </p>
        </div>
      </section>

      {/* ── Empat pilar: satu band utama + tiga kartu ────────────────── */}
      <Section
        eyebrow="Empat Pilar"
        title="Yang kami kerjakan di lapangan"
        description="Setiap pilar berdiri di atas kepemimpinan warga setempat. Tim nasional menyediakan pendampingan, protokol, dan jaringan — bukan menggantikan peran simpul daerah."
        id="pilar"
      >
        {feature ? (
          <div className="flex flex-col gap-10 md:gap-14">
            <FeatureBand program={feature} />

            {rest.length > 0 ? (
              <div className="grid gap-grid-normal md:grid-cols-3 md:gap-grid-normal">
                {rest.map((program, index) => (
                  <ProgramCard
                    key={program.id}
                    program={program}
                    position={index + 1}
                  />
                ))}
              </div>
            ) : null}
          </div>
        ) : null}
      </Section>

      {/* ── Sinergi dengan Jagatirta ─────────────────────────────────── */}
      <Section
        tone="dark"
        eyebrow="Kolaborasi Khusus"
        title="Sinergi dengan Jagatirta"
        description="ZAMROED Bergerak tidak bekerja sendirian. Bersama Jagatirta River Watch, kami menyambungkan kekuatan warga di darat dengan data sungai yang dipantau setiap pekan."
        id="sinergi"
      >
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <ol className="flex flex-col gap-8 lg:col-span-7">
            {SYNERGY_POINTS.map((point) => (
              <li
                key={point.title}
                className="border-t border-white/15 pt-6"
              >
                <h3 className="font-display text-xl font-bold tracking-tight text-white sm:text-2xl">
                  {point.title}
                </h3>
                <p className="measure-editorial mt-3 text-sm leading-relaxed text-white/80 md:text-base">
                  {point.body}
                </p>
              </li>
            ))}
          </ol>

          <div className="lg:col-span-5">
            <div className="overflow-hidden rounded-2xl border border-white/15">
              <div className="relative aspect-[4/3] w-full bg-brand-primary/20">
                <img
                  src="/images/kedaulatan-pangan.jpg"
                  alt="Relawan ZAMROED Bergerak memantau aliran sungai bersama warga bantaran sebagai bagian dari kerja River Watch."
                  width={1600}
                  height={900}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover"
                />
              </div>
            </div>

            <p className="measure-editorial mt-6 text-sm leading-relaxed text-white/85">
              Semua data mutu air yang kami himpun dibuka apa adanya untuk publik — termasuk
              temuan yang belum menggembirakan — agar warga bisa menuntut perbaikan dengan
              bukti, bukan sekadar dugaan.
            </p>

            <Button
              href="https://jagatirta.id"
              variant="secondary"
              size="lg"
              className="mt-8"
            >
              Kunjungi Jagatirta River Watch
              <ArrowRight aria-hidden="true" focusable="false" className="h-5 w-5 shrink-0" />
            </Button>
          </div>
        </div>
      </Section>

      {/* ── Ajakan terlibat ──────────────────────────────────────────── */}
      <section className="border-t border-editorial bg-surface-pure px-5 py-section-normal sm:px-8 md:py-section-normal">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-brand-primary">
            <span aria-hidden="true" className="h-px w-8 shrink-0 bg-brand-primary opacity-60" />
            Bergerak Bersama
          </p>

          <h2 className="text-section mt-4 font-display font-bold text-ink">
            Perubahan tidak menunggu siapa pun siap
          </h2>

          <p className="measure-editorial mt-5 text-base leading-relaxed text-ink-secondary md:text-lg">
            Gerakan ini hidup dari waktu yang disumbangkan warga biasa — tiga jam pada akhir
            pekan, satu keahlian yang dibagikan, satu simpul daerah yang dirawat. Pilih divisi
            yang paling dekat dengan kemampuanmu dan mulai dari sana.
          </p>

          <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <Button href="/volunteer" variant="primary" size="lg">
              Daftar jadi relawan
              <ArrowRight aria-hidden="true" focusable="false" className="h-5 w-5 shrink-0" />
            </Button>
            <Button href="/kontak" variant="outline" size="lg">
              Hubungi simpul daerah
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
