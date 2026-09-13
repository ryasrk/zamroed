import type { ReactNode } from 'react';

import { cn } from '../lib/cn';
import { Button } from './button';
import { Card, CardBody, CardFooter, CardHeader, CardTitle } from './card';
import { ProgressBar } from './progress-bar';

/* -------------------------------------------------------------------------- */
/*  Pemformatan                                                                */
/* -------------------------------------------------------------------------- */

/** Padanan sempit `Intl.NumberFormat` — cukup untuk kebutuhan modul ini. */
interface NumberFormatter {
  format(value: number): string;
}

/**
 * Format mata uang rupiah bergaya Indonesia, mis. `Rp1.250.000`.
 *
 * `Intl` dibuat sekali di lingkup modul (mahal bila dipanggil per render), lalu
 * dipakai ulang di server maupun klien. Format kustom dipasang sebagai jaring
 * pengaman: lingkungan tanpa `Intl` lengkap tetap menghasilkan teks yang benar.
 */
const RUPIAH_FORMATTER: NumberFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
});

// `Intl.NumberFormat` menyisipkan NBSP (U+00A0) setelah "Rp"; samakan ke spasi
// biasa agar penyisipan teks di editor maupun HTML tidak mengubah tata letak.
const CURRENCY_SPACE = /[\u00a0\u202f]/g;

/** Format angka gaya Indonesia tanpa `Intl` — sama di server dan klien. */
function groupNumber(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** Ubah masukan apa pun menjadi angka berhingga; `NaN`/`Infinity` menjadi `0`. */
function toFiniteAmount(value: number, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

/** Nominal rupiah tanpa desimal, mis. `Rp1.250.000`. */
function formatRupiah(value: number): string {
  const safe = Math.max(0, toFiniteAmount(value));
  try {
    const formatted = RUPIAH_FORMATTER.format(safe);
    if (typeof formatted === 'string' && formatted.length > 0) {
      return formatted.replace(CURRENCY_SPACE, ' ');
    }
  } catch {
    // Lingkungan tanpa data mata uang lengkap — jatuh ke format manual.
  }
  return `Rp${groupNumber(safe)}`;
}

/** Jumlah tanda tangan, mis. `1.250 tanda tangan`. */
function formatSignatures(value: number): string {
  return `${groupNumber(Math.max(0, toFiniteAmount(value)))} tanda tangan`;
}

/* -------------------------------------------------------------------------- */
/*  Kamus jenis kampanye                                                       */
/* -------------------------------------------------------------------------- */

/** Jenis kampanye: penggalangan dana atau petisi. */
export type CampaignType = 'dana' | 'petisi';

/** Semua teks yang berbeda antar jenis kampanye, dalam satu tempat. */
interface CampaignCopy {
  cta: string;
  /** Kata warna untuk label bilah, mis. "terkumpul" / "tanda tangan". */
  progressLabel: string;
  heading: string;
  /** Format angka mentah sesuai jenis kampanye. */
  format(value: number): string;
}

const CAMPAIGN_COPY: Record<CampaignType, CampaignCopy> = {
  dana: {
    cta: 'Dukung Sekarang',
    progressLabel: 'Dana terkumpul',
    heading: 'Penggalangan dana',
    format: formatRupiah,
  },
  petisi: {
    cta: 'Tandatangani Petisi',
    progressLabel: 'Tanda tangan terkumpul',
    heading: 'Petisi warga',
    format: formatSignatures,
  },
};

/** Nama jenis untuk pengumuman pembaca layar dan `data-*`. */
const TYPE_LABEL: Record<CampaignType, string> = {
  dana: 'Dana',
  petisi: 'Petisi',
};

/* -------------------------------------------------------------------------- */
/*  Ikon                                                                       */
/* -------------------------------------------------------------------------- */

const ICON_CLASS = 'h-4 w-4 shrink-0';

/** Ikon koin untuk kampanye dana — merefleksikan merek aktif lewat `currentColor`. */
function CoinIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" focusable="false" className={ICON_CLASS}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="M9.4 8.6h5.2M9.4 11.4h5.2M12 8.6v7.8M10 8.6 14 16.4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Ikon tanda tangan untuk petisi. */
function SignatureIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" focusable="false" className={ICON_CLASS}>
      <path
        d="M3.6 16.8c2.6.6 4.3-1.1 5.4-3.6 1-2.4 1.6-5 3-5 1.3 0 1.2 2 .6 3.4-.6 1.5 0 2.6 1.4 2.6 1.2 0 2-.8 2.8-1.9"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M3.6 20.4h13.2"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Kartu kampanye                                                             */
/* -------------------------------------------------------------------------- */

export interface CampaignCardProps {
  /** Judul kampanye — satu baris gagasan, mis. "Selamatkan Ciliwung". */
  title: string;
  /** Ringkasan kampanye dalam 2–3 kalimat. */
  description: string;
  /** Sasaran kampanye. Untuk `dana` dalam rupiah, untuk `petisi` dalam orang. */
  target: number;
  /** Capaian saat ini, satuan sama dengan `target`. */
  raised: number;
  /** Jenis kampanye: penggalangan dana atau petisi. */
  type: CampaignType;
  /** Tautan aksi tombol, mis. `/kampanye/selamatkan-ciliwung`. */
  href: string;
  /** Slot aksi di kanan header, mis. badge status kampanye. */
  action?: ReactNode;
  /**
   * Tingkat heading. Default `h3`; naikkan ke `h2` bila kartu setingkat bagian,
   * atau `h4` bila kartu berada di dalam blok berjudul.
   */
  headingLevel?: 'h2' | 'h3' | 'h4';
  className?: string;
}

/**
 * Kartu kampanye yang dipakai Jagatirta (konservasi sungai) dan ZAMROED Bergerak
 * (gerakan sosial) dengan satu implementasi: seluruh warna dibaca dari token
 * `brand.*` yang di-rebind per tema, jadi tidak ada teal/emerald yang dikunci.
 *
 * Alur bacanya mengikuti cara relawan lapangan memindai di ponsel: judul besar,
 * satu kalimat ringkas, lalu angka capaian dan bilah kemajuan yang langsung
 * memberi tahu seberapa dekat kampanye ke sasaran.
 *
 * Server-compatible: tanpa hooks, state, event handler, maupun akses
 * `window`/`document`, sehingga aman dirender sebagai Server Component.
 *
 * Aman terhadap `target` = 0, negatif, `NaN`, dan `Infinity` — persentase selalu
 * dijepit ke rentang 0–100.
 *
 * @example Kampanye dana (Jagatirta)
 * ```tsx
 * <CampaignCard
 *   title="Selamatkan Ciliwung"
 *   description="Pemulihan 12 km sempadan sungai bersama warga bantaran."
 *   target={150_000_000}
 *   raised={87_500_000}
 *   type="dana"
 *   href="/kampanye/selamatkan-ciliwung"
 * />
 * ```
 *
 * @example Petisi (ZAMROED Bergerak)
 * ```tsx
 * <CampaignCard
 *   title="Hentikan Buang Limbah ke Sungai"
 *   description="Tuntut audit limbah terbuka untuk pabrik di hulu."
 *   target={50_000}
 *   raised={31_240}
 *   type="petisi"
 *   href="/petisi/hentikan-limbah"
 * />
 * ```
 */
export function CampaignCard({
  title,
  description,
  target,
  raised,
  type,
  href,
  action,
  headingLevel = 'h3',
  className,
}: CampaignCardProps) {
  const copy = CAMPAIGN_COPY[type];

  // `target` yang tidak masuk akal (0, negatif, atau `NaN`) tidak boleh pernah
  // menghasilkan NaN/Infinity pada persentase — rasio 0 adalah jawaban aman.
  const safeTarget = Math.max(0, toFiniteAmount(target));
  const safeRaised = Math.max(0, toFiniteAmount(raised));
  const rawPercent = safeTarget > 0 ? (safeRaised / safeTarget) * 100 : 0;
  const percent = Math.min(100, Math.max(0, Number.isFinite(rawPercent) ? rawPercent : 0));
  const percentText = `${Math.round(percent)}%`;
  const hasTarget = safeTarget > 0;

  const raisedText = copy.format(safeRaised);
  const targetText = hasTarget ? copy.format(safeTarget) : 'sasaran belum ditetapkan';
  const progressLabel = `${copy.progressLabel}: ${raisedText} dari ${targetText}`;

  return (
    <Card
      interactive
      data-component="campaign-card"
      data-type={type}
      className={cn(
        'animate-fade-up motion-reduce:animate-none',
        // Garis brand di tepi atas: kartu ikut berubah warna saat tema berganti.
        'before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:z-10',
        'before:h-1 before:bg-gradient-to-r before:from-brand-primary before:to-brand-accent',
        'before:content-[""]',
        className,
      )}
    >
      <CardHeader action={action}>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase leading-none tracking-[0.14em] text-brand-primary">
          <span className="[&_svg]:block" aria-hidden="true">
            {type === 'dana' ? <CoinIcon /> : <SignatureIcon />}
          </span>
          {copy.heading}
        </span>

        <CardTitle as={headingLevel} className="text-balance">
          {title}
        </CardTitle>
      </CardHeader>

      <CardBody className="flex flex-col gap-4">
        <p className="measure-editorial text-sm leading-relaxed text-ink-secondary sm:text-[0.9375rem]">
          {description}
        </p>

        <div className="mt-auto flex flex-col gap-2.5 pt-1">
          <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
            <p className="flex min-w-0 items-baseline gap-1.5 font-display text-2xl font-bold leading-none tracking-tight text-brand-deep">
              {copy.format(safeRaised)}
            </p>

            <p className="shrink-0 text-xs font-semibold tabular-nums leading-none text-ink-secondary">
              {/* Angka sasaran disembunyikan dari pembaca layar: nilainya sudah
                  dibacakan utuh lewat `aria-valuetext` bilah di bawah. */}
              <span aria-hidden="true">
                {/* Tanpa sasaran, "0%" hanya derau — tulis keadaannya apa adanya. */}
                {hasTarget ? `${percentText} dari ${targetText}` : 'Sasaran belum ditetapkan'}
              </span>
            </p>
          </div>

          <ProgressBar
            // Tanpa sasaran, `indeterminate` mencegah bilah terbaca penuh; nilainya
            // tetap diteruskan agar label mengabarkan capaian apa adanya.
            value={hasTarget ? safeRaised : 0}
            max={hasTarget ? safeTarget : 1}
            indeterminate={!hasTarget}
            size="sm"
            label={progressLabel}
            showPercentage={hasTarget}
            // `valueText` memakai format jenis kampanye, bukan angka mentah — jadi
            // petisi terdengar "31.240 dari 50.000 tanda tangan", bukan rentang rupiah.
            valueText={
              hasTarget
                ? `${raisedText.replace(' tanda tangan', '')} dari ${copy.format(safeTarget)}, ${percentText}`
                : `${raisedText}, sasaran belum ditetapkan`
            }
          />
        </div>
      </CardBody>

      <CardFooter divider>
        <Button
          href={href}
          variant="primary"
          size="md"
          aria-label={`${copy.cta}: ${title} (${TYPE_LABEL[type]})`}
          className="w-full sm:w-auto"
        >
          {copy.cta}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default CampaignCard;
