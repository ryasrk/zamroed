import type { Metadata } from 'next';

import { Badge, Button, Section, StatCounter } from '@repo/ui';
import { milestones } from '@repo/data';

import { Timeline } from './timeline';

export const metadata: Metadata = {
  title: 'Sejarah — ZAMROED Bergerak',
  description:
    'Jejak ZAMROED Bergerak dari pertemuan di sebuah balai desa pada 1998 hingga pemantauan tujuh daerah aliran sungai: enam tonggak yang membentuk cara kami bergerak.',
};

/**
 * Halaman Sejarah — permukaan "Baca dan Rasakan" milik ZAMROED Bergerak.
 *
 * Server Component: seluruh naskah, arsip, dan metadata dirender di server.
 * Satu-satunya JavaScript sisi klien adalah `Timeline`, yang memang butuh
 * listener gulir dan IntersectionObserver untuk menggerakkan rel emas.
 */

/** Rentang tahun yang dicakup tonggak sejarah, dihitung dari data — bukan diketik manual. */
const years = milestones
  .map((milestone) => Number.parseInt(milestone.year, 10))
  .filter((year) => Number.isFinite(year));

const firstYear = years.length > 0 ? Math.min(...years) : 0;
const lastYear = years.length > 0 ? Math.max(...years) : 0;

/** Jumlah fase berbeda yang pernah dilalui gerakan. */
const phaseCount = new Set(milestones.map((milestone) => milestone.phase)).size;

export default function SejarahPage() {
  return (
    <main className="bg-canvas">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-brand-deep px-5 pb-14 pt-16 text-white sm:px-8 md:pb-20 md:pt-24">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-32 -z-10 h-96 w-96 rounded-full bg-brand-primary opacity-25 blur-3xl"
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-px bg-gradient-to-r from-transparent via-gold-ochre/70 to-transparent"
        />

        <div className="mx-auto max-w-7xl">
          <div className="grid items-end gap-10 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16">
            <div className="animate-fade-up">
              <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-amber-300">
                <span aria-hidden="true" className="h-px w-8 shrink-0 bg-amber-300/80" />
                Arsip Gerakan
              </p>

              <h1 className="text-display mt-5 font-display font-bold text-white">Sejarah</h1>

              <p className="measure-editorial mt-6 text-base leading-relaxed text-white/80 md:text-lg">
                Setiap gerakan punya titik nol, dan hampir selalu titik nol itu terlihat biasa:
                sebuah balai desa, beberapa orang yang gelisah, dan kesepakatan kecil untuk tidak
                diam. ZAMROED Bergerak tumbuh dari pertemuan seperti itu — tanpa struktur, tanpa
                pendanaan, tanpa nama.
              </p>

              <p className="measure-editorial mt-4 text-base leading-relaxed text-white/85 md:text-lg">
                Kami menuliskan asal-usul ini bukan untuk mengenang, melainkan untuk
                mempertanggungjawabkannya. Arah gerakan hanya bisa dinilai secara adil jika
                pembaca tahu dari mana ia berangkat, apa yang pernah gagal, dan janji mana yang
                masih kami pegang.
              </p>
            </div>

            {/* Kartu ringkasan arsip — kaca gelap agar tetap terbaca di atas hero. */}
            <div className="animate-fade-up rounded-2xl border border-white/15 bg-white/5 p-6 backdrop-blur-sm sm:p-8">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/85">
                Rentang Arsip
              </p>
              <p className="mt-3 font-mono text-3xl font-bold leading-none text-white sm:text-4xl">
                {firstYear}
                <span className="mx-2 text-gold-ochre">—</span>
                {lastYear}
              </p>

              <dl className="mt-7 grid grid-cols-2 gap-x-6 gap-y-5">
                <div>
                  <dt className="sr-only">Jumlah tonggak</dt>
                  <dd>
                    <StatCounter
                      value={milestones.length}
                      label="Tonggak"
                      className="text-white [&_*]:!text-white"
                    />
                  </dd>
                </div>
                <div>
                  <dt className="sr-only">Jumlah fase</dt>
                  <dd>
                    <StatCounter
                      value={phaseCount}
                      label="Fase"
                      className="text-white [&_*]:!text-white"
                    />
                  </dd>
                </div>
              </dl>

              <p className="mt-7 border-t border-white/15 pt-5 text-sm leading-relaxed text-white/85">
                Disusun dari arsip internal, catatan rapat warga, dan liputan pers yang
                terdokumentasi.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Rel waktu ─────────────────────────────────────────────────────── */}
      <Section
        id="timeline"
        eyebrow="Enam Tonggak"
        title="Jejak yang Membentuk Cara Kami Bergerak"
        description="Dari balai desa sampai peta tujuh daerah aliran sungai. Gulir untuk menelusuri — rel emas di tengah menandai seberapa jauh kita sudah membaca."
        align="center"
      >
        <Timeline milestones={milestones} className="mx-auto max-w-5xl pt-2" />

        <p className="mt-14 flex flex-wrap items-center justify-center gap-3 text-center text-sm text-ink-secondary">
          <span className="hidden md:inline-flex">
            <Badge tone="neutral" dot>
              Tonggak pertama
            </Badge>
          </span>
          <span className="sr-only">Rel berakhir pada tonggak terakhir, tahun {lastYear}.</span>
          <Badge tone="warning">Rel berakhir di {lastYear}</Badge>
        </p>
      </Section>

      {/* ── Penutup: maksud para pendiri ──────────────────────────────────── */}
      <Section
        id="maksud-pendiri"
        tone="dark"
        align="center"
        eyebrow="Maksud Para Pendiri"
        title="Bukan Menjadi Besar, Melainkan Menjadi Berguna"
        description="Para pendiri tidak pernah menulis target jumlah anggota atau wilayah. Yang mereka tulis adalah satu syarat: gerakan ini harus tetap dimiliki warga yang menjalankannya. Setiap regenerasi wajib bisa membaca ulang piagam 2003 dan merasa ia masih berbicara tentang hari ini."
      >
        <div className="mx-auto mt-10 grid max-w-4xl gap-grid-normal sm:grid-cols-2">
          <div className="rounded-2xl border border-white/15 bg-white/5 p-6 text-left backdrop-blur-sm sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-ochre">
              Yang kami jaga
            </p>
            <p className="mt-3 text-base leading-relaxed text-white/85">
              Kedaulatan warga atas tanah dan airnya, serta gotong royong yang melintasi sekat
              golongan. Dua hal itu yang membuat gerakan ini tidak pernah bergantung pada satu
              nama.
            </p>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/5 p-6 text-left backdrop-blur-sm sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-gold-ochre">
              Yang kami undang
            </p>
            <p className="mt-3 text-base leading-relaxed text-white/85">
              Siapa pun yang bersedia bekerja tanpa sorotan. Kontribusi bermanfaat bagi gerakan
              ini tidak diukur dari jabatan, melainkan dari kesediaan turun ke lapangan.
            </p>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:gap-4">
          <Button href="/volunteer" size="lg">
            Gabung Relawan
          </Button>
          <Button
            href="/liputan-aksi"
            size="lg"
            variant="outline"
            className="border-white/30 text-white hover:border-white hover:bg-white/10 hover:text-white"
          >
            Baca liputan kami
          </Button>
        </div>
      </Section>
    </main>
  );
}
