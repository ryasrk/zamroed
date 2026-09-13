'use client';

import { useCallback, useId, useMemo, useState } from 'react';
import type { FormEvent } from 'react';

import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardTitle,
  CheckboxGroup,
  Input,
  Select,
  Textarea,
  cn,
} from '@repo/ui';
import type { CheckboxGroupOption, SelectOption } from '@repo/ui';

import { DIVISIONS, DIVISION_TITLES } from './divisions';

/* -------------------------------------------------------------------------- */
/*  Konten statis                                                              */
/* -------------------------------------------------------------------------- */

interface Availability {
  readonly value: string;
  readonly label: string;
  readonly hint: string;
}

/**
 * Ketersediaan waktu selalu punya konsekuensi lapangan (aksi biasanya berjalan
 * pada akhir pekan, sedangkan unit tanggap darurat bergerak kapan saja), jadi
 * setiap pilihan membawa satu baris penjelas yang dapat dibaca relawan sebelum
 * memutuskan.
 */
const AVAILABILITY: readonly Availability[] = [
  {
    value: 'Akhir pekan',
    label: 'Akhir pekan',
    hint: 'Aksi lapangan, pemetaan, dan kegiatan warga umumnya berjalan hari Sabtu.',
  },
  {
    value: 'Hari kerja',
    label: 'Hari kerja',
    hint: 'Sekretariat, advokasi ke instansi, dan kunjungan ke mitra desa.',
  },
  {
    value: 'Fleksibel',
    label: 'Fleksibel',
    hint: 'Waktunya bergeser mengikuti kebutuhan aksi dan kesepakatan simpul.',
  },
  {
    value: 'Kapan saja saat darurat',
    label: 'Kapan saja saat darurat',
    hint: 'Siaga 24 jam untuk gudang logistik, dapur umum, dan evakuasi warga.',
  },
];

/** Label kota/kabupaten maupun provinsi. Satu daftar untuk dua jenis jawaban. */
const REGIONS: readonly string[] = [
  'Jakarta',
  'Bogor',
  'Tangerang',
  'Bekasi',
  'Bandung',
  'Semarang',
  'Surabaya',
  'Malang',
  'Solo',
  'Yogyakarta',
  'Palembang',
  'Balikpapan',
  'Samarinda',
  'Banjarmasin',
  'Makassar',
  'Aceh',
  'Sumatera Utara',
  'Sumatera Barat',
  'Riau',
  'Jambi',
  'Lampung',
  'Banten',
  'Jawa Barat',
  'Jawa Tengah',
  'Jawa Timur',
  'Kalimantan Barat',
  'Kalimantan Selatan',
  'Kalimantan Tengah',
  'Kalimantan Timur',
  'Sulawesi Selatan',
  'Nusa Tenggara Barat',
  'Nusa Tenggara Timur',
  'Papua',
];

/** Satu baris pilihan di dropdown domisili. Nilainya nama kota atau provinsi. */
const REGION_OPTIONS: readonly SelectOption[] = REGIONS.map((region) => ({
  value: region,
  label: region,
}));

/**
 * Opsi divisi dibangun dari `DIVISIONS` — satu tabel yang juga dipakai halaman
 * server untuk merender kartu penjelasan. Dengan begitu nama divisi,
 * deskripsi, dan rujukan program tidak pernah berbeda antara formulir dan
 * narasi halaman.
 */
const DIVISION_OPTIONS: readonly CheckboxGroupOption[] = DIVISIONS.map((division) => ({
  value: division.slug,
  label: division.title,
  description: division.summary,
}));

/** Batas dua divisi: fokus pada dua peran jauh lebih berguna daripada hadir di semua. */
const MAX_DIVISIONS = 2;

/**
 * Butir kode etik. Dirangkum menjadi satu pernyataan yang masih dapat
 * diperiksa satu per satu, bukan satu kalimat panjang yang tidak terbaca di
 * layar ponsel.
 */
const ETHICS_POINTS: readonly string[] = [
  'Menjaga keselamatan warga, rekan relawan, dan diri sendiri sebelum mengejar target aksi.',
  'Memperlakukan warga sebagai subjek yang menentukan, bukan objek liputan atau proyek.',
  'Menyajikan data dan temuan lapangan apa adanya sehingga verifikasi laporan tetap dapat dipertanggungjawabkan.',
  'Hadir tanpa membawa kepentingan politik atau komersial pihak mana pun.',
  'Memegang rahasia identitas narasumber yang meminta perlindungan.',
];

/* -------------------------------------------------------------------------- */
/*  Tipe                                                                       */
/* -------------------------------------------------------------------------- */

type FieldName = 'nama' | 'whatsapp' | 'email' | 'domisili' | 'ketersediaan' | 'keahlian';

interface FormValues {
  nama: string;
  whatsapp: string;
  email: string;
  domisili: string;
  divisi: string[];
  ketersediaan: string;
  keahlian: string;
}

type FieldErrors = Partial<Record<FieldName, string>>;

type SubmitState = 'idle' | 'pending' | 'success';

/** Hanya satu penanda galat yang ditampilkan sekaligus, agar tidak ada dua arena adu argumen. */
type ErrorArea = 'identitas' | 'keahlian' | 'divisi' | null;

const EMPTY_VALUES: FormValues = {
  nama: '',
  whatsapp: '',
  email: '',
  domisili: '',
  divisi: [],
  ketersediaan: '',
  keahlian: '',
};

/* -------------------------------------------------------------------------- */
/*  Validasi                                                                   */
/* -------------------------------------------------------------------------- */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
/** Nomor Indonesia tanpa kode negara: 8xx…, panjang 9–13 digit. */
const WHATSAPP_PATTERN = /^8\d{8,12}$/;
/** Email domain sekali pakai tidak kami tolak otomatis — koordinator yang memutuskan. */
const MIN_NAME_LENGTH = 3;
/** Ambang minimum pengalaman: cukup untuk satu kalimat nyata, bukan sekadar "bisa". */
const MIN_EXPERIENCE_LENGTH = 20;
/** 10.234 — pemisah ribuan Bahasa Indonesia untuk penghitung karakter. */
const COUNTER_FORMAT = new Intl.NumberFormat('id-ID');

/**
 * Validasi dijalankan HANYA saat tombol kirim ditekan, bukan di setiap
 * ketikan. Menandai galat sambil orang mengetik berarti menegur sebelum
 * kalimatnya selesai — dan di layar ponsel pesan itu mendorong field di
 * bawahnya turun, tepat saat ibu jari sedang menuju field tersebut.
 */
function validate(values: FormValues): { errors: FieldErrors; area: ErrorArea } {
  const errors: FieldErrors = {};

  const nama = values.nama.trim();
  if (nama.length === 0) errors.nama = 'Nama lengkap wajib diisi.';
  else if (nama.length < MIN_NAME_LENGTH) {
    errors.nama = `Tuliskan nama lengkap minimal ${MIN_NAME_LENGTH} karakter.`;
  }

  const whatsapp = values.whatsapp.replace(/[\s-]/g, '');
  if (whatsapp.length === 0) errors.whatsapp = 'Nomor WhatsApp wajib diisi.';
  else if (!WHATSAPP_PATTERN.test(whatsapp)) {
    errors.whatsapp = 'Masukkan nomor tanpa angka 0 atau +62 di depan, mis. 81234567890.';
  }

  const email = values.email.trim();
  if (email.length === 0) errors.email = 'Email wajib diisi.';
  else if (!EMAIL_PATTERN.test(email)) {
    errors.email = 'Format email belum benar, mis. nama@email.com.';
  }

  if (values.domisili.trim().length === 0) {
    errors.domisili = 'Pilih kota atau provinsi tempatmu berdomisili.';
  }

  if (values.ketersediaan.trim().length === 0) {
    errors.ketersediaan = 'Pilih satu ketersediaan waktu.';
  }

  // Urutan pemeriksaan menentukan area mana yang digulir ke tampilan: dari
  // atas ke bawah, sehingga relawan tidak pernah dilompati ke bagian tengah.
  let area: ErrorArea = null;
  if (errors.nama || errors.whatsapp || errors.email || errors.domisili) area = 'identitas';
  else if (values.divisi.length === 0) area = 'divisi';
  else if (errors.ketersediaan || values.keahlian.trim().length < MIN_EXPERIENCE_LENGTH) {
    area = 'keahlian';
  }

  if (values.keahlian.trim().length < MIN_EXPERIENCE_LENGTH) {
    errors.keahlian = `Ceritakan sedikit lebih lengkap — minimal ${MIN_EXPERIENCE_LENGTH} karakter.`;
  }

  return { errors, area };
}

/* -------------------------------------------------------------------------- */
/*  Ikon                                                                       */
/* -------------------------------------------------------------------------- */

/** Centang besar untuk kartu sukses. */
function CheckCircleIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 48 48"
      fill="none"
      className="h-12 w-12"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="24" cy="24" r="20" />
      <path d="M15 24.5 21 30.5 33 18" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Bidang ringkasan pada kartu sukses                                         */
/* -------------------------------------------------------------------------- */

function SummaryRow({
  term,
  children,
  divider = true,
}: {
  term: string;
  children: React.ReactNode;
  divider?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1 py-3.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6',
        divider && 'border-b border-editorial',
      )}
    >
      <dt className="text-sm text-ink-secondary">{term}</dt>
      <dd className="min-w-0 text-sm font-semibold text-ink sm:text-right">{children}</dd>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Komponen                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Formulir pendaftaran relawan ZAMROED Bergerak — permukaan Operate.
 *
 * Satu kolom, urutan field mengikuti cara orang memperkenalkan diri (siapa,
 * bisa dihubungi lewat apa, di mana, ingin ikut apa, kapan, dan bekal apa yang
 * dibawa). Lebar kolom field dibatasi sehingga di ponsel semua kontrol jatuh
 * nyaman di bawah ibu jari, dan di desktop barisnya tidak melebar sampai sulit
 * dipindai mata.
 *
 * Tiga keputusan yang membedakannya dari formulir biasa:
 *
 * 1. **Peringatan data hanya muncul saat relevan.** Field domisili dan dropdown
 *    ketersediaan tidak punya pesan cadangan agar tinggi kartu tidak melompat
 *    saat relawan mengisi satu per satu.
 * 2. **Galat muncul di tempat yang sama dengan penyebabnya.** Nama, WhatsApp,
 *    email, dan domisili berada di satu kartu; galat menandai kartu itu, bukan
 *    menempelkan pesan di kepala formulir.
 * 3. **Tanpa backend.** Pengiriman disimulasikan dengan state lokal dan jeda
 *    singkat supaya keadaan tombol yang dimuat terbaca jujur apa adanya.
 */
export function VolunteerForm() {
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [errorArea, setErrorArea] = useState<ErrorArea>(null);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');

  const baseId = useId();
  const errorsId = `${baseId}-galat`;

  const isPending = submitState === 'pending';

  /** Semua perubahan nilai membersihkan galat field terkait sekaligus. */
  const setField = useCallback(<K extends keyof FormValues>(key: K, next: FormValues[K]) => {
    setValues((previous) => ({ ...previous, [key]: next }));
    setErrors((previous) => {
      if (!(key in previous)) return previous;
      const rest = { ...previous };
      delete rest[key as FieldName];
      return rest;
    });
  }, []);

  /**
   * Seluruh galat ditampilkan sekaligus pada satu posisi tetap (di atas tombol
   * kirim). Cara inilah yang membuat tinggi kartu tidak pernah berubah saat
   * tombol ditekan: pesan galat tidak lahir di dalam aliran field sehingga
   * tidak ada field yang bergeser di bawah ibu jari yang sedang menuju tombol.
   */
  const errorMessages = useMemo(() => {
    const found: string[] = [];
    if (errors.nama) found.push(errors.nama);
    if (errors.whatsapp) found.push(errors.whatsapp);
    if (errors.email) found.push(errors.email);
    if (errors.domisili) found.push(errors.domisili);
    if (errors.ketersediaan) found.push(errors.ketersediaan);
    if (errorArea === 'divisi') {
      found.push('Pilih minimal satu divisi — boleh satu saja, dan boleh berubah setelah induksi.');
    }
    if (errors.keahlian) found.push(errors.keahlian);
    if (errors.keahlian) found.push('Komitmen kode etik wajib dicentang sebelum mengirim.');
    return found;
  }, [errorArea, errors]);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      const { errors: found, area } = validate(values);
      setErrors(found);
      setErrorArea(area);

      if (area !== null) return;

      setSubmitState('pending');
      // Tanpa backend: jeda 900 ms supaya keadaan "Mengirim…" benar-benar terlihat.
      window.setTimeout(() => {
        setSubmitState('success');
      }, 900);
    },
    [values],
  );

  const handleReset = useCallback(() => {
    setValues(EMPTY_VALUES);
    setErrors({});
    setErrorArea(null);
    setSubmitState('idle');
  }, []);

  const selectedDivisions = useMemo(
    () => values.divisi.map((slug) => DIVISION_TITLES[slug] ?? slug),
    [values.divisi],
  );

  const selectedAvailability = useMemo(
    () => AVAILABILITY.find((option) => option.value === values.ketersediaan) ?? null,
    [values.ketersediaan],
  );

  const experienceLength = values.keahlian.trim().length;
  const experienceShortfall = Math.max(MIN_EXPERIENCE_LENGTH - experienceLength, 0);

  if (submitState === 'success') {
    return (
      <Card
        role="status"
        aria-live="polite"
        className="border-brand-primary/40 shadow-lg animate-fade-up"
      >
        <CardBody className="flex flex-col items-center gap-5 px-6 py-10 text-center sm:px-8">
          <span className="grid h-20 w-20 place-items-center rounded-full bg-brand-soft text-brand-primary">
            <CheckCircleIcon />
          </span>

          <CardTitle as="h3" className="text-balance text-2xl sm:text-3xl">
            Selamat bergabung!
          </CardTitle>

          <p className="measure-editorial text-base leading-relaxed text-ink-secondary">
            Pendaftaranmu sudah masuk ke sekretariat gerakan. Koordinator divisi akan mengirim
            pesan WhatsApp ke nomor <strong className="font-semibold text-ink">+62{values.whatsapp}</strong>{' '}
            berisi jadwal induksi: satu sesi daring untuk mengenal struktur gerakan, kode etik,
            dan protokol keselamatan, lalu satu sesi lapangan bersama simpul daerahmu.
          </p>

          <p className="measure-editorial text-sm leading-relaxed text-ink-secondary">
            Balas pesan itu dalam tiga hari agar namamu tidak masuk daftar tunggu. Bila nomornya
            berubah, hubungi sekretariat supaya pengurus dapat memperbarui data keanggotaanmu.
          </p>

          <dl className="mt-2 w-full max-w-md text-left">
            <SummaryRow term="Nama">{values.nama}</SummaryRow>
            <SummaryRow term="WhatsApp">+62{values.whatsapp}</SummaryRow>
            <SummaryRow term="Email">{values.email}</SummaryRow>
            <SummaryRow term="Kota atau provinsi">{values.domisili}</SummaryRow>
            <SummaryRow term="Divisi yang diminati">
              {selectedDivisions.length > 0 ? selectedDivisions.join(', ') : 'Belum ditentukan'}
            </SummaryRow>
            <SummaryRow term="Ketersediaan waktu">
              {selectedAvailability ? selectedAvailability.label : 'Belum ditentukan'}
            </SummaryRow>
            <SummaryRow term="Status" divider={false}>
              <span className="text-brand-deep">Menunggu verifikasi koordinator</span>
            </SummaryRow>
          </dl>

          <p className="measure-editorial rounded-2xl border border-editorial bg-canvas px-4 py-3 text-left text-sm leading-relaxed text-ink-secondary">
            Setelah menyelesaikan aksi pertamamu, kamu menerima e-sertifikat relawan digital
            ber-QR verifikasi resmi yang mencatat divisi dan jam dedikasimu.
          </p>
        </CardBody>

        <CardFooter divider className="justify-center sm:justify-center">
          <Button variant="secondary" onClick={handleReset}>
            Daftarkan relawan lain
          </Button>
          <Button href="/program" variant="outline">
            Lihat program gerakan
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg">
      <form onSubmit={handleSubmit} noValidate>
        <CardBody className="flex flex-col gap-6 px-6 py-6 sm:px-7">
          {/* Tanpa backend, form ini memang tidak mengirim ke mana pun. Penjelasan
              singkat di atas menjaga janji privasi tetap terbaca sebelum diisi. */}
          <p className="text-sm leading-relaxed text-ink-secondary">
            Satu halaman, sekitar dua menit. Koordinator memakai data ini hanya untuk verifikasi
            keanggotaan dan penjadwalan induksi.
          </p>

          <p id={errorsId} role="alert" className="sr-only">
            {errorArea === 'identitas'
              ? 'Formulir belum lengkap. Periksa nama, nomor WhatsApp, email, dan domisili.'
              : errorArea === 'divisi'
                ? 'Pilih minimal satu divisi yang diminati.'
                : errorArea === 'keahlian'
                  ? 'Periksa ketersediaan waktu, pengalaman atau keahlian, dan komitmen kode etik.'
                  : ''}
          </p>

          {/* ── 1. Data diri ─────────────────────────────────────────────── */}
          <fieldset className="border-0 p-0">
            <legend className="mb-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.18em] text-brand-primary">
              <span
                aria-hidden="true"
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-soft font-display text-sm font-bold normal-case tracking-normal text-brand-deep"
              >
                1
              </span>
              Data diri
            </legend>

            <div className="flex flex-col gap-5">
              <Input
                label="Nama Lengkap"
                name="nama"
                value={values.nama}
                onChange={(event) => setField('nama', event.currentTarget.value)}
                error={errors.nama}
                aria-describedby={errorsId}
                placeholder="Contoh: Sari Puspita"
                autoComplete="name"
                autoCapitalize="words"
                enterKeyHint="next"
                required
              />

              <Input
                label="WhatsApp"
                name="whatsapp"
                type="tel"
                inputMode="tel"
                prefix="+62"
                value={values.whatsapp}
                onChange={(event) =>
                  setField('whatsapp', event.currentTarget.value.replace(/[^\d]/g, ''))
                }
                error={errors.whatsapp}
                aria-describedby={errorsId}
                hint="Tanpa angka 0 di depan, mis. 81234567890."
                placeholder="81234567890"
                autoComplete="tel-national"
                enterKeyHint="next"
                required
              />

              <Input
                label="Email"
                name="email"
                type="email"
                inputMode="email"
                value={values.email}
                onChange={(event) => setField('email', event.currentTarget.value)}
                error={errors.email}
                aria-describedby={errorsId}
                placeholder="nama@email.com"
                autoComplete="email"
                enterKeyHint="next"
                required
              />

              <Select
                label="Kota atau Provinsi"
                name="domisili"
                placeholder="Pilih kota atau provinsi"
                options={REGION_OPTIONS}
                value={values.domisili}
                onChange={(event) => setField('domisili', event.currentTarget.value)}
                error={errors.domisili}
                required
              />

              <p className="text-sm leading-relaxed text-ink-secondary">
                Nomor WhatsApp dipakai koordinator untuk verifikasi dan jadwal induksi, bukan untuk
                siaran promosi. Email hanya untuk arsip keanggotaan dan sertifikat digital.
              </p>
            </div>
          </fieldset>

          {/* ── 2. Divisi ────────────────────────────────────────────────── */}
          <div className="border-t border-editorial pt-6">
            <CheckboxGroup
              legend="Divisi yang diminati"
              description="Pilih maksimal dua divisi. Setiap kartu menjelaskan pekerjaannya di lapangan."
              options={DIVISION_OPTIONS}
              value={values.divisi}
              onChange={(next) => setField('divisi', next)}
              max={MAX_DIVISIONS}
              required
              aria-describedby={errorsId}
              error={
                errorArea === 'divisi'
                  ? 'Pilih minimal satu divisi — boleh satu saja, dan boleh berubah setelah induksi.'
                  : undefined
              }
              hint="Pilihan divisi masih dapat berubah setelah sesi induksi bersama koordinator."
            />
          </div>

          {/* ── 3. Waktu dan bekal ───────────────────────────────────────── */}
          <div className="flex flex-col gap-6 border-t border-editorial pt-6">
            <Select
              label="Ketersediaan waktu"
              name="ketersediaan"
              placeholder="Pilih kesediaan waktu"
              options={AVAILABILITY}
              value={values.ketersediaan}
              onChange={(event) => setField('ketersediaan', event.currentTarget.value)}
              error={errors.ketersediaan}
              required
            />

            {/* Baris konsekuensi: perubahan teks di bawah field tidak boleh mengubah
                tingginya, jadi ketinggiannya dikunci satu baris pada kedua keadaan. */}
            <p aria-live="polite" className="min-h-5 text-sm leading-5 text-ink-secondary">
              {selectedAvailability ? selectedAvailability.hint : ''}
            </p>

            <Textarea
              label="Pengalaman atau keahlian"
              name="keahlian"
              autoResize
              minHeight={120}
              maxHeight={280}
              value={values.keahlian}
              onChange={(event) => setField('keahlian', event.currentTarget.value)}
              error={errors.keahlian}
              aria-describedby={errorsId}
              hint="Tidak harus pengalaman berorganisasi: sertakan keahlian praktis, keterampilan teknis, atau jaringan yang dapat dibagikan."
              placeholder="Contoh: Saya perawat di puskesmas dan biasa membantu posko pengungsian saat banjir; punya SIM C dan bisa membawa kendaraan untuk distribusi logistik."
              autoCapitalize="sentences"
            />

            <p className="min-h-5 text-sm leading-5 text-ink-secondary" aria-live="polite">
              {experienceShortfall > 0
                ? `${COUNTER_FORMAT.format(experienceShortfall)} karakter lagi agar dapat ditinjau koordinator.`
                : ''}
            </p>
          </div>

          {/* ── 4. Komitmen kode etik ────────────────────────────────────── */}
          <div className="flex flex-col gap-3 border-t border-editorial pt-6">
            <h3 className="text-sm font-semibold text-ink">Komitmen kode etik gerakan</h3>

            <ul className="flex flex-col gap-2.5">
              {ETHICS_POINTS.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className="mt-[0.55rem] h-1.5 w-1.5 shrink-0 rounded-full bg-brand-accent"
                  />
                  <span className="text-sm leading-relaxed text-ink-secondary">{point}</span>
                </li>
              ))}
            </ul>

            <label
              htmlFor={`${baseId}-komitmen`}
              className="flex min-h-14 cursor-pointer items-start gap-3.5 rounded-2xl border-2 border-editorial bg-surface-pure p-4 transition-colors duration-200 ease-crisp hover:border-brand-primary/55 hover:bg-brand-soft/35 has-[:focus-visible]:border-brand-primary has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-primary/40 has-[:focus-visible]:ring-offset-2 has-[:focus-visible]:ring-offset-canvas has-[:checked]:border-brand-primary has-[:checked]:bg-brand-soft"
            >
              <input
                id={`${baseId}-komitmen`}
                name="komitmen"
                type="checkbox"
                required
                aria-describedby={errorsId}
                className="mt-0.5 h-5 w-5 shrink-0 rounded-[6px] accent-[var(--brand-primary)] focus-visible:outline-none"
              />
              <span className="text-sm font-medium leading-relaxed text-ink">
                Saya menyatakan bersedia menjalankan kode etik ZAMROED Bergerak dan menaati
                protokol keselamatan selama kegiatan lapangan.
              </span>
            </label>
          </div>
        </CardBody>

        <CardFooter
          divider
          className="flex-col items-stretch gap-4 py-5 sm:flex-row sm:items-start sm:justify-between"
        >
          {/* Ruang pesan galat berukuran tetap — dan hanya memakai satu elemen
              teks, bukan daftar bertanda. Alasannya layout, bukan gaya: tinggi
              daftar bergantung pada `list-style-position` dan tepi glyph
              peluru di tiap peramban, sehingga `min-height` bisa kalah dan
              tombol kirim ikut bergeser tepat setelah ditekan. Satu blok teks
              dengan `min-height` membuat tinggi itu pasti, sementara pesan
              tetap terhubung ke setiap field lewat `aria-describedby`. */}
          <p id={errorsId} role="alert" className="min-h-[3.5rem] text-sm leading-5 sm:max-w-sm">
            {errorMessages.length > 0 ? (
              <>
                <span className="block font-semibold text-status-critical">
                  Periksa kembali sebelum mengirim:
                </span>
                <span className="mt-1 block font-medium text-status-critical">
                  {errorMessages.join(' ')}
                </span>
              </>
            ) : null}
          </p>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:items-end">
            <Button
              type="submit"
              size="lg"
              loading={isPending}
              className="w-full sm:w-auto sm:min-w-52"
            >
              {isPending ? 'Mengirim…' : 'Kirim Pendaftaran'}
            </Button>
            <p className="text-sm leading-relaxed text-ink-secondary sm:max-w-xs sm:text-right">
              Tidak ada biaya pendaftaran dan tidak ada berkas yang perlu diunggah.
            </p>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}

export default VolunteerForm;
