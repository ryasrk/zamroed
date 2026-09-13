import type { Metadata } from 'next';
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  Compass,
  HeartHandshake,
  MapPinned,
  Scale,
  Stethoscope,
  Sprout,
  type LucideIcon,
} from 'lucide-react';

import { Badge, Button, Card, CardBody, Section } from '@repo/ui';
import { zamroedPrograms } from '@repo/data';
import type { Program } from '@repo/ui/types';

import { VolunteerForm } from './volunteer-form';
import { DIVISIONS, type VolunteerDivision } from './divisions';

export const metadata: Metadata = {
  title: 'Relawan — ZAMROED Bergerak',
  description:
    'Daftar sebagai relawan ZAMROED Bergerak: aksi lapangan dan logistik, medis dan tanggap darurat, dokumentasi, advokasi dan riset, hingga kedaulatan ekologi bersama Jagatirta.',
};

/* -------------------------------------------------------------------------- */
/*  Pemetaan data                                                              */
/* -------------------------------------------------------------------------- */

/**
 * `divisions.ts` menyimpan nama ikon sebagai string sehingga tabelnya tetap
 * dapat dibaca formulir klien. Nama tak dikenal jatuh ke ikon kompas — kartu
 * divisi tidak pernah tampil tanpa penanda visual.
 */
const DIVISION_ICONS: Record<string, LucideIcon> = {
  Stethoscope,
  Camera,
  Scale,
  Sprout,
  HeartHandshake,
  Compass,
};

const FALLBACK_ICON: LucideIcon = Compass;

/** Program dari `@repo/data` per slug, supaya judul program tetap satu sumber. */
const PROGRAMS_BY_SLUG: Record<string, Program> = Object.fromEntries(
  zamroedPrograms.map((program) => [program.slug, program]),
);

/** Nomor urut divisi sebagai penanda tipografis, bukan hiasan. */
function divisionNumber(index: number): string {
  return String(index + 1).padStart(2, '0');
}

/* -------------------------------------------------------------------------- */
/*  Konten statis                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Ukuran gerakan. Ditulis sebagai catatan bakunya sendiri supaya tidak
 * berpura-pura berasal dari basis data; koordinator memperbaruinya setiap
 * evaluasi kuartal.
 */
const MOVEMENT_STATS: readonly { readonly value: string; readonly label: string }[] = [
  { value: '1.480', label: 'Relawan aktif' },
  { value: '24', label: 'Provinsi' },
  { value: '312', label: 'Aksi sepanjang 2026' },
];

interface AdmissionStep {
  readonly step: string;
  readonly title: string;
  readonly owner: string;
  readonly detail: string;
  readonly duration: string;
}

/**
 * Jalur masuk yang berlaku saat ini. Terpisah dari formulir karena urutannya
 * dijalankan manusia — koordinator yang menghubungi, bukan sistem otomatis.
 */
const ADMISSION_STEPS: readonly AdmissionStep[] = [
  {
    step: '01',
    title: 'Daftar',
    owner: 'Kamu',
    detail:
      'Kirim formulir berisi data diri, divisi yang diminati, ketersediaan waktu, dan pengalaman atau keahlianmu. Datanya langsung masuk ke sekretariat gerakan dan ditinjau koordinator dalam 2–3 hari kerja.',
    duration: 'Sekitar 2 menit',
  },
  {
    step: '02',
    title: 'Orientasi dan induksi',
    owner: 'Koordinator divisi',
    detail:
      'Satu sesi pengenalan struktur gerakan, kode etik, dan protokol keselamatan, lalu pendampingan bersama kader dari divisi yang kamu pilih. Di akhir sesi ditetapkan simpul daerah dan pendamping lapanganmu.',
    duration: 'Sekitar 2 jam',
  },
  {
    step: '03',
    title: 'Terjun ke aksi',
    owner: 'Tim lapangan',
    detail:
      'Ikut aksi pertama sesuai ketersediaan waktumu — aksi akhir pekan, pendampingan simpul, atau siaga darurat. Setelah aksi pertama selesai, namamu tercatat di buku log relawan.',
    duration: 'Mulai beberapa hari setelah induksi',
  },
];

const SAFETY_GUARANTEES: readonly { readonly title: string; readonly detail: string }[] = [
  {
    title: 'Perlengkapan disediakan',
    detail:
      'Rompi, sarung tangan, kotak P3K, dan alat lapangan disiapkan koordinator di titik kumpul. Kamu cukup datang dengan sepatu tertutup dan botol minum.',
  },
  {
    title: 'Pendampingan kader',
    detail:
      'Tidak ada relawan baru yang diterjunkan sendiri. Setiap relawan didampingi kader berpengalaman pada aksi pertama sampai ketiga.',
  },
  {
    title: 'Tidak ada iuran',
    detail:
      'Pendaftaran, orientasi, dan seluruh pelatihan gratis. Gerakan ini dibiayai dukungan warga, bukan iuran relawan.',
  },
];

/* -------------------------------------------------------------------------- */
/*  Bagian halaman                                                             */
/* -------------------------------------------------------------------------- */

/** Kartu penjelasan satu divisi, memuat judul program yang menaunginya. */
function DivisionCard({
  division,
  position,
}: {
  division: VolunteerDivision;
  position: number;
}) {
  const Icon = DIVISION_ICONS[division.slug] ?? FALLBACK_ICON;
  const program = PROGRAMS_BY_SLUG[division.programSlug];

  return (
    <li className="h-full">
      <Card className="h-full" aria-labelledby={`divisi-${division.slug}`}>
        <CardBody className="flex h-full flex-col gap-4 px-6 py-7">
          <div className="flex items-start justify-between gap-4">
            <span
              aria-hidden="true"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-soft text-brand-deep"
            >
              <Icon className="h-5 w-5" />
            </span>
            <span
              aria-hidden="true"
              className="font-display text-3xl font-bold leading-none tracking-tight text-brand-primary/25"
            >
              {divisionNumber(position)}
            </span>
          </div>

          <h3
            id={`divisi-${division.slug}`}
            className="font-display text-lg font-bold leading-snug tracking-tight text-ink text-balance sm:text-xl"
          >
            {division.title}
          </h3>

          <p className="text-[0.9375rem] leading-relaxed text-ink-secondary">
            {division.detail}
          </p>

          <ul className="flex flex-col gap-2.5">
            {division.duties.map((duty) => (
              <li key={duty} className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-accent"
                />
                <span className="text-sm leading-relaxed text-ink-secondary">{duty}</span>
              </li>
            ))}
          </ul>

          {/* Satu kalimat ajakan: menjelaskan siapa yang cocok, bukan sekadar mengajak. */}
          <p className="mt-auto border-t border-editorial pt-4 text-sm font-medium leading-relaxed text-ink">
            {division.invitation}
          </p>

          {program ? (
            <p className="flex items-center gap-2 text-xs font-semibold uppercase leading-snug tracking-[0.14em] text-ink-secondary">
              <BadgeCheck aria-hidden="true" focusable="false" className="h-4 w-4 shrink-0 text-brand-primary" />
              {program.title}
            </p>
          ) : null}
        </CardBody>
      </Card>
    </li>
  );
}

/* -------------------------------------------------------------------------- */
/*  Halaman                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Portal relawan ZAMROED Bergerak — permukaan Operate dan pintu masuk utama
 * gerakan.
 *
 * Halaman ini tetap Server Component: hero, penjelasan divisi, alur
 * pendaftaran, dan catatan sertifikat dirender di server sehingga teksnya
 * langsung terbaca di jaringan lapangan yang lemah. Hanya `VolunteerForm` yang
 * menjadi client component, karena di sanalah state dan umpan balik pengiriman
 * benar-benar dibutuhkan.
 */
export default function VolunteerPage() {
  return (
    <main className="bg-canvas">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-brand-deep px-5 pb-16 pt-14 text-white sm:px-8 md:pb-24 md:pt-20">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-32 -z-10 h-80 w-80 rounded-full bg-brand-primary opacity-25 blur-3xl"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-px bg-gradient-to-r from-transparent via-gold-ochre/70 to-transparent"
        />

        <div className="mx-auto max-w-7xl">
          <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16">
            <div className="animate-fade-up">
              <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-brand-accent">
                <span aria-hidden="true" className="h-px w-8 shrink-0 bg-brand-accent opacity-70" />
                Rekrutmen Relawan
              </p>

              <h1 className="text-display mt-5 font-display font-bold text-white text-balance">
                Gerakan ini berjalan dari waktu yang disumbangkan warga biasa.
              </h1>

              <p className="measure-editorial mt-6 text-base leading-relaxed text-white/85 md:text-lg">
                ZAMROED Bergerak tidak menunggu dana besar atau jabatan resmi. Yang membuatnya
                hidup adalah orang-orang yang menyisihkan tiga jam pada akhir pekan, satu keahlian
                yang dibagikan, dan kesediaan hadir saat warga paling membutuhkan.
              </p>

              <p className="measure-editorial mt-4 text-base leading-relaxed text-white/85">
                Isi formulirnya dalam dua menit, pilih divisi yang paling dekat dengan
                kemampuanmu, dan mulai dari sana. Tidak ada pengalaman minimum — yang kami minta
                hanya kesediaan belajar dan menaati kode etik gerakan.
              </p>

              <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
                <Button href="#formulir" size="lg" variant="primary" className="w-full sm:w-auto">
                  Isi formulir pendaftaran
                  <ArrowRight aria-hidden="true" focusable="false" className="h-5 w-5 shrink-0" />
                </Button>
                <Button
                  href="#divisi"
                  size="lg"
                  variant="outline"
                  className="w-full border-white/30 text-white hover:border-white hover:bg-white/10 hover:text-white sm:w-auto"
                >
                  Kenali divisinya dulu
                </Button>
              </div>

              <dl className="mt-12 grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3">
                {MOVEMENT_STATS.map((stat) => (
                  <div key={stat.label} className="flex flex-col gap-1">
                    <dt className="order-2 text-xs font-medium uppercase tracking-wider text-white/85">
                      {stat.label}
                    </dt>
                    <dd className="order-1 font-display text-4xl font-bold leading-none text-gold-ochre">
                      {stat.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            {/* Formulir muncul di hero pada layar lebar: relawan yang sudah
                memutuskan tidak perlu menggulir untuk menemukan pintu masuknya.
                Di ponsel formulir tetap satu kolom di bagian `#formulir`. */}
            <div id="formulir" className="scroll-mt-24 animate-fade-up">
              <div className="lg:sticky lg:top-24">
                <VolunteerForm />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Divisi relawan ───────────────────────────────────────────────── */}
      <Section
        id="divisi"
        eyebrow="Divisi Relawan"
        title="Lima cara untuk ikut bergerak"
        description="Setiap divisi punya pekerjaan nyata dan jadwal yang berbeda. Pilih maksimal dua saat mendaftar — pilihanmu masih bisa berubah setelah sesi induksi."
      >
        <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-7">
          {DIVISIONS.map((division, index) => (
            <DivisionCard key={division.slug} division={division} position={index} />
          ))}
        </ol>
      </Section>

      {/* ── Alur menjadi relawan ─────────────────────────────────────────── */}
      <Section
        id="alur"
        tone="dark"
        eyebrow="Alur Menjadi Relawan"
        title="Tiga langkah, tanpa birokrasi berbelit"
        description="Dari formulir sampai aksi pertama, setiap langkah punya penanggung jawab yang jelas — kamu selalu tahu apa yang sedang ditunggu dan siapa yang menghubungi."
      >
        <ol className="flex flex-col gap-8 lg:gap-10">
          {ADMISSION_STEPS.map((item) => (
            <li
              key={item.step}
              className="grid gap-5 border-t border-white/15 pt-8 lg:grid-cols-[minmax(0,0.42fr)_minmax(0,1fr)] lg:gap-12"
            >
              <div className="flex items-start gap-5">
                <span
                  aria-hidden="true"
                  className="font-display text-5xl font-bold leading-none tracking-tight text-gold-ochre sm:text-6xl"
                >
                  {item.step}
                </span>
                <div className="flex min-w-0 flex-col gap-3 pt-1">
                  <h3 className="font-display text-xl font-bold leading-tight tracking-tight text-white sm:text-2xl">
                    {item.title}
                  </h3>
                  <Badge tone="warning">{item.owner}</Badge>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <p className="measure-editorial text-[0.9375rem] leading-relaxed text-white/80 md:text-base">
                  {item.detail}
                </p>
                <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/85">
                  <MapPinned aria-hidden="true" focusable="false" className="h-4 w-4 shrink-0" />
                  {item.duration}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      {/* ── Sertifikat digital ───────────────────────────────────────────── */}
      <Section
        id="sertifikat"
        eyebrow="Pengakuan Dedikasi"
        title="Sertifikat digital ber-QR setelah aksi pertamamu"
        description="Setiap relawan yang menyelesaikan satu aksi menerima e-sertifikat resmi bertanda verifikasi QR. Sertifikat itu bukan piagam seremonial — ia mencatat divisi, simpul daerah, dan jam dedikasi yang benar-benar kamu jalani."
      >
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:gap-16">
          <div className="flex flex-col gap-6">
            <ul className="flex flex-col divide-y divide-editorial border-y border-editorial">
              <li className="flex items-start gap-4 py-5">
                <BadgeCheck
                  aria-hidden="true"
                  focusable="false"
                  className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary"
                />
                <p className="text-[0.9375rem] leading-relaxed text-ink-secondary">
                  <strong className="font-semibold text-ink">Dapat diverifikasi.</strong> Kode QR
                  pada sertifikat membuka halaman resmi ZAMROED Bergerak yang menampilkan nama,
                  divisi, simpul daerah, dan tanggal aksi sebagai bukti keasliannya.
                </p>
              </li>
              <li className="flex items-start gap-4 py-5">
                <BadgeCheck
                  aria-hidden="true"
                  focusable="false"
                  className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary"
                />
                <p className="text-[0.9375rem] leading-relaxed text-ink-secondary">
                  <strong className="font-semibold text-ink">Menjadi portofolio.</strong> Jam
                  dedikasi tercatat di buku log relawan sehingga dapat dilampirkan untuk keperluan
                  akademik, beasiswa, maupun lamaran kerja.
                </p>
              </li>
              <li className="flex items-start gap-4 py-5">
                <BadgeCheck
                  aria-hidden="true"
                  focusable="false"
                  className="mt-0.5 h-5 w-5 shrink-0 text-brand-primary"
                />
                <p className="text-[0.9375rem] leading-relaxed text-ink-secondary">
                  <strong className="font-semibold text-ink">Milikmu sepenuhnya.</strong> Sertifikat
                  dikirim dalam bentuk berkas digital, aman disimpan, dan dapat dibagikan tanpa
                  perlu meminta ulang ke sekretariat.
                </p>
              </li>
            </ul>

            <p className="rounded-2xl border border-editorial bg-surface px-5 py-4 text-sm leading-relaxed text-ink-secondary">
              Catatan: sertifikat diterbitkan setelah aksi pertama selesai dan laporan lapangan
              diverifikasi koordinator divisi — umumnya dalam 7 hari kerja.
            </p>
          </div>

          <div className="flex flex-col gap-6">
            <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-secondary">
              Yang kami jamin sejak hari pertama
            </h3>

            <ul className="flex flex-col gap-5">
              {SAFETY_GUARANTEES.map((guarantee) => (
                <li key={guarantee.title} className="rounded-2xl border border-editorial bg-surface p-5">
                  <p className="font-display text-base font-bold tracking-tight text-ink">
                    {guarantee.title}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
                    {guarantee.detail}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Section>

      {/* ── Ajakan penutup ───────────────────────────────────────────────── */}
      <section className="border-t border-editorial bg-surface-pure px-5 py-section-normal sm:px-8 md:py-section-normal">
        <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-brand-primary">
            <span aria-hidden="true" className="h-px w-8 shrink-0 bg-brand-primary opacity-60" />
            Langkah Pertama
          </p>

          <h2 className="text-section mt-4 font-display font-bold text-ink text-balance">
            Satu formulir, dan kamu sudah menjadi bagian dari gerakan ini
          </h2>

          <p className="measure-editorial mt-5 text-base leading-relaxed text-ink-secondary md:text-lg">
            Tidak ada syarat pengalaman, tidak ada iuran, dan tidak ada berkas yang perlu
            diunggah. Koordinator divisi akan mengirim pesan WhatsApp berisi jadwal induksi
            begitu pendaftaranmu ditinjau.
          </p>

          <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
            <Button href="#formulir" variant="primary" size="lg" className="w-full sm:w-auto">
              Daftar jadi relawan
              <ArrowRight aria-hidden="true" focusable="false" className="h-5 w-5 shrink-0" />
            </Button>
            <Button href="/program" variant="outline" size="lg" className="w-full sm:w-auto">
              Lihat program gerakan
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
