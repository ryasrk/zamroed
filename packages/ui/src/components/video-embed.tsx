'use client';

import { useCallback, useId, useMemo, useState } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';

import { cn } from '../lib/cn';

/* -------------------------------------------------------------------------- */
/*  Tipe publik                                                               */
/* -------------------------------------------------------------------------- */

/** Platform yang dikenali dari URL video. */
export type VideoPlatform =
  | 'youtube'
  | 'vimeo'
  | 'tiktok'
  | 'instagram'
  | 'direct'
  | 'unknown';

export interface VideoEmbedProps {
  /** URL halaman video (YouTube/Vimeo/TikTok/Reels) atau berkas video langsung. */
  url: string;
  /** Judul video. Dipakai sebagai `<figcaption>` dan `title` iframe bila ada. */
  title?: string;
  /** Keterangan tambahan di bawah judul, mis. kredit atau lokasi liputan. */
  caption?: string;
  /**
   * URL poster kustom. Bila kosong, poster YouTube disusun otomatis dari ID
   * video (`maxresdefault` → `hqdefault`). Platform lain hanya memakai poster
   * dari prop ini.
   */
  poster?: string;
  /**
   * Mulai putar tanpa interaksi.
   *
   * Berlaku langsung hanya untuk berkas video langsung (`.mp4`/`.webm`/`.mov`),
   * yang dirender `<video autoplay muted>` — tanpa permintaan ke pihak ketiga.
   *
   * Untuk platform bertaut (`youtube`, `vimeo`, `tiktok`, `instagram`), facade
   * klik-untuk-putar tetap dipertahankan: nilai ini hanya menjadi parameter
   * `autoplay=1` pada iframe yang baru disuntikkan setelah klik. Iframe pihak
   * ketiga tidak pernah dimuat pada render pertama — itu aturan kinerja
   * sekaligus syarat agar hidrasi tidak meleset.
   */
  autoPlay?: boolean;
  /** Kelas tambahan untuk elemen akar `<figure>`. */
  className?: string;
}

/* -------------------------------------------------------------------------- */
/*  Pengenalan platform (murni, tanpa akses DOM)                              */
/* -------------------------------------------------------------------------- */

/** Bentuk hasil parsing yang aman dipakai lintas render. */
export interface ParsedVideoSource {
  /** Platform yang terdeteksi. */
  platform: VideoPlatform;
  /** ID video platform; `null` untuk berkas langsung atau URL tak dikenal. */
  videoId: string | null;
  /** Orientasi kanvas: 16:9 lanskap atau 9:16 vertikal. */
  orientation: Orientation;
}

type Orientation = 'landscape' | 'portrait';

/** Platform yang dirender vertikal 9:16 (max-w-sm, tengah). */
const PORTRAIT_PLATFORMS: ReadonlySet<VideoPlatform> = new Set<VideoPlatform>([
  'tiktok',
  'instagram',
]);

/** Ekstensi berkas video yang diputar lewat elemen `<video>` native. */
const DIRECT_EXTENSIONS: readonly string[] = ['.mp4', '.webm', '.mov'];

/** Domain YouTube yang id-nya boleh dipercaya (batasi penyalahgunaan string mentah). */
const YOUTUBE_HOSTS: readonly string[] = [
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
];

/** Domain Vimeo yang id-nya boleh dipercaya. */
const VIMEO_HOSTS: readonly string[] = ['vimeo.com', 'www.vimeo.com', 'player.vimeo.com'];

/** Domain TikTok yang id-nya boleh dipercaya. */
const TIKTOK_HOSTS: readonly string[] = ['tiktok.com', 'www.tiktok.com', 'm.tiktok.com'];

/** Domain Instagram yang id-nya boleh dipercaya. */
const INSTAGRAM_HOSTS: readonly string[] = [
  'instagram.com',
  'www.instagram.com',
  'm.instagram.com',
];

/**
 * Hapus skema dan `www.` agar pencocokan domain tidak rentan terhadap
 * `https://notyoutube.com` atau `https://evil.com/youtube.com/watch?v=…`.
 */
function normalizeHost(host: string): string {
  return host.trim().toLowerCase().replace(/^www\./, '');
}

function hostMatches(host: string, allowed: readonly string[]): boolean {
  return allowed.some((domain) => host === domain || host === normalizeHost(domain));
}

/** Cocokkan `host` dengan domain beserta seluruh subdomainnya yang sah. */
function isSameSite(host: string, base: string): boolean {
  const normalized = normalizeHost(host);
  const root = normalizeHost(base).replace(/^www\./, '');
  return normalized === root || normalized.endsWith(`.${root}`);
}

/** Buang spasi, tanda kutip, dan pembatas yang lazim menempel saat disalin. */
function sanitizeIdSegment(value: string | undefined): string | null {
  if (typeof value !== 'string') return null;
  const cleaned = value.trim().replace(/^["'<>\s]+|["'<>\s]+$/g, '');
  return cleaned.length > 0 ? cleaned : null;
}

/** ID YouTube sah: 11 karakter alfanumerik, `-`, atau `_`. */
function isYouTubeId(value: string): boolean {
  return /^[A-Za-z0-9_-]{11}$/.test(value);
}

/** ID platform angka (Vimeo, TikTok, Reels) — tolak `NaN`, `0`, dan string kosong. */
function isNumericId(value: string): boolean {
  return /^[0-9]{1,20}$/.test(value);
}

/**
 * Ubah URL apa pun menjadi sumber yang bisa dirender.
 *
 * Tidak pernah melempar dan tidak menyentuh DOM — aman dipanggil saat SSR.
 * URL kosong, rusak, atau relatif (mis. `/video/narasi.mp4`) tetap
 * menghasilkan deskriptor yang masuk akal.
 */
export function parseVideoUrl(url: string | undefined | null): ParsedVideoSource {
  const raw = typeof url === 'string' ? url.trim() : '';

  if (raw.length === 0) {
    return { platform: 'unknown', videoId: null, orientation: 'landscape' };
  }

  // Jalur cepat untuk berkas video relatif maupun absolut — tidak perlu URL utuh.
  const rawPathOnly = raw.split(/[?#]/, 1)[0] ?? '';
  const rawExtension = rawPathOnly.slice(rawPathOnly.lastIndexOf('.')).toLowerCase();
  const looksLikeDirectFile =
    rawPathOnly.length > rawPathOnly.lastIndexOf('.') &&
    rawPathOnly.lastIndexOf('.') > rawPathOnly.lastIndexOf('/') &&
    DIRECT_EXTENSIONS.includes(rawExtension);

  let parsed: URL | null = null;

  try {
    parsed = new URL(raw, 'https://basislokal.invalid');
  } catch {
    parsed = null;
  }

  if (parsed === null) {
    return {
      platform: looksLikeDirectFile ? 'direct' : 'unknown',
      videoId: null,
      orientation: 'landscape',
    };
  }

  const host = parsed.hostname;
  const segments = parsed.pathname.split('/').filter((segment) => segment.length > 0);

  /* ------------------------------- YouTube ------------------------------- */
  if (isSameSite(host, 'youtube.com') || hostMatches(host, YOUTUBE_HOSTS)) {
    const fromQuery =
      sanitizeIdSegment(parsed.searchParams.get('v') ?? undefined) ??
      sanitizeIdSegment(parsed.searchParams.get('video_id') ?? undefined);

    if (fromQuery !== null && isYouTubeId(fromQuery)) {
      return { platform: 'youtube', videoId: fromQuery, orientation: 'landscape' };
    }

    const last = segments[segments.length - 1];
    const lastCleaned = sanitizeIdSegment(last === undefined ? undefined : last);

    // Bentuk: /shorts/{id}, /embed/{id}, /live/{id}, /v/{id}
    const isYoutubeNested =
      segments.length >= 2 &&
      ['shorts', 'embed', 'live', 'v', 'e'].includes(segments[0] ?? '');

    if (isYoutubeNested && lastCleaned !== null && isYouTubeId(lastCleaned)) {
      return { platform: 'youtube', videoId: lastCleaned, orientation: 'landscape' };
    }

    // Bentuk: /{id} pada youtu.be
    if (normalizeHost(host) === 'youtu.be' && lastCleaned !== null && isYouTubeId(lastCleaned)) {
      return { platform: 'youtube', videoId: lastCleaned, orientation: 'landscape' };
    }

    return { platform: 'youtube', videoId: null, orientation: 'landscape' };
  }

  if (normalizeHost(host) === 'youtu.be') {
    const id = sanitizeIdSegment(segments[0]);
    return {
      platform: 'youtube',
      videoId: id !== null && isYouTubeId(id) ? id : null,
      orientation: 'landscape',
    };
  }

  /* -------------------------------- Vimeo -------------------------------- */
  if (hostMatches(host, VIMEO_HOSTS)) {
    const candidates = [...segments].reverse();
    const numeric = candidates.find((segment) => isNumericId(segment.replace(/\D/g, '')));

    return {
      platform: 'vimeo',
      videoId: numeric !== undefined && isNumericId(numeric.replace(/\D/g, '')) ? numeric.replace(/\D/g, '') : null,
      orientation: 'landscape',
    };
  }

  /* -------------------------------- TikTok ------------------------------- */
  if (hostMatches(host, TIKTOK_HOSTS)) {
    const videoIndex = segments.indexOf('video');
    const candidate = videoIndex >= 0 ? sanitizeIdSegment(segments[videoIndex + 1]) : null;

    if (candidate !== null && isNumericId(candidate)) {
      return { platform: 'tiktok', videoId: candidate, orientation: 'portrait' };
    }

    // Bentuk pendek /t/{kode} tidak dapat ditanam sebagai iframe.
    return { platform: 'tiktok', videoId: null, orientation: 'portrait' };
  }

  /* ------------------------------ Instagram ------------------------------ */
  if (hostMatches(host, INSTAGRAM_HOSTS)) {
    const reelIndex = ['reel', 'reels'].map((key) => segments.indexOf(key)).find((i) => i >= 0);
    const candidate = reelIndex === undefined ? null : sanitizeIdSegment(segments[reelIndex + 1]);

    if (candidate !== null) {
      return { platform: 'instagram', videoId: candidate, orientation: 'portrait' };
    }

    return { platform: 'instagram', videoId: null, orientation: 'portrait' };
  }

  /* --------------------------- Berkas video langsung ---------------------- */
  if (looksLikeDirectFile) {
    return { platform: 'direct', videoId: null, orientation: 'landscape' };
  }

  return { platform: 'unknown', videoId: null, orientation: 'landscape' };
}

/* -------------------------------------------------------------------------- */
/*  URL sematan                                                               */
/* -------------------------------------------------------------------------- */

/** Poster YouTube: coba resolusi maksimum lebih dulu, turun ke hqdefault. */
function youTubePosterCandidates(videoId: string): [string, string] {
  return [
    `https://i.ytimg.com/vi/${videoId}/maxresdefault.jpg`,
    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
  ];
}

/** Susun URL iframe bersih (tanpa parameter pelacak) untuk tiap platform. */
function buildEmbedUrl(source: ParsedVideoSource, autoPlay: boolean): string | null {
  const { platform, videoId } = source;
  if (videoId === null) return null;

  switch (platform) {
    case 'youtube': {
      const params = new URLSearchParams({
        autoplay: autoPlay ? '1' : '0',
        rel: '0',
        playsinline: '1',
        modestbranding: '1',
      });
      return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
    }
    case 'vimeo': {
      const params = new URLSearchParams({
        autoplay: autoPlay ? '1' : '0',
        dnt: '1',
        title: '0',
        byline: '0',
        portrait: '0',
      });
      return `https://player.vimeo.com/video/${videoId}?${params.toString()}`;
    }
    case 'tiktok':
      return `https://www.tiktok.com/embed/v2/${videoId}`;
    case 'instagram':
      return `https://www.instagram.com/reel/${videoId}/embed/captioned/`;
    default:
      return null;
  }
}

/* -------------------------------------------------------------------------- */
/*  Label Bahasa Indonesia                                                    */
/* -------------------------------------------------------------------------- */

const PLATFORM_LABELS: Record<VideoPlatform, string> = {
  youtube: 'YouTube',
  vimeo: 'Vimeo',
  tiktok: 'TikTok',
  instagram: 'Instagram',
  direct: 'Berkas video',
  unknown: 'Tautan eksternal',
};

/** Iframe yang diizinkan hanya menerima parameter yang kita susun sendiri. */
const IFRAME_ALLOW =
  'accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture';

/* -------------------------------------------------------------------------- */
/*  Gaya bersama                                                              */
/* -------------------------------------------------------------------------- */

const FIGURE_BASE = 'group/video not-prose w-full text-ink';

/** Lanskap 16:9 penuh lebar; vertikal 9:16 dibatasi `max-w-sm` dan ditengahkan. */
const FRAME_BASE =
  'relative w-full overflow-hidden rounded-2xl border border-editorial bg-brand-deep shadow-sm';

/** Target sentuh ≥48px: tombol play menutupi seluruh area poster. */
const PLAY_BUTTON_BASE = [
  'absolute inset-0 z-10 flex min-h-[48px] cursor-pointer touch-manipulation',
  'items-center justify-center focus:outline-none',
  'focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-accent',
  'focus-visible:ring-offset-0',
].join(' ');

const CAPTION_BASE = 'mt-3 text-sm leading-relaxed text-ink-secondary';

/* -------------------------------------------------------------------------- */
/*  Ikon (inline SVG — tanpa beban tambahan saat hidrasi)                     */
/* -------------------------------------------------------------------------- */

function PlayGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M8.5 5.14a1 1 0 0 1 1.52-.85l8.6 5.35a1 1 0 0 1 0 1.7l-8.6 5.35a1 1 0 0 1-1.52-.85V5.14Z" />
    </svg>
  );
}

function ExternalLinkGlyph({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M13 5h6v6" />
      <path d="M19 5l-7.5 7.5" />
      <path d="M18 14.5V18a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h3.5" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sub-render: kartu fallback                                                */
/* -------------------------------------------------------------------------- */

interface FallbackCardProps {
  url: string;
  platform: VideoPlatform;
  title?: string;
  caption?: string;
  className?: string;
}

/**
 * Cadangan untuk URL yang tidak dapat ditanam: kartu editorial dengan tautan
 * eksplisit. Tetap menampilkan orientasi lanskap agar tidak menggeser layout.
 */
function FallbackCard({ url, platform, title, caption, className }: FallbackCardProps) {
  return (
    <figure className={cn(FIGURE_BASE, className)}>
      <div className="aspect-video w-full overflow-hidden rounded-2xl border border-editorial bg-canvas">
        <div className="flex h-full w-full flex-col justify-between p-5 sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-primary">
            {PLATFORM_LABELS[platform]}
          </p>

          <div className="flex flex-col gap-3">
            <p className="font-display text-base font-semibold leading-snug text-ink sm:text-lg">
              {title ?? 'Video ini belum dapat ditampilkan langsung'}
            </p>
            <p className="text-sm leading-relaxed text-ink-secondary">
              Tonton videonya lewat tautan berikut. Bila tautan tidak terbuka, periksa koneksi
              jaringan lapangan lalu coba lagi.
            </p>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                'inline-flex min-h-[48px] max-w-full items-center gap-2 rounded-xl bg-brand-primary px-4',
                'text-sm font-semibold text-white no-underline',
                'transition-colors duration-200 ease-crisp hover:bg-brand-deep',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent',
                'focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
              )}
            >
              <ExternalLinkGlyph className="h-4 w-4 shrink-0" />
              <span className="truncate">Buka video di tab baru</span>
            </a>
          </div>
        </div>
      </div>

      {title || caption ? (
        <figcaption className={CAPTION_BASE}>
          {title ? <span className="font-semibold text-ink">{title}. </span> : null}
          {caption ?? null}
        </figcaption>
      ) : null}
    </figure>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sub-render: pemutar berkas langsung                                       */
/* -------------------------------------------------------------------------- */

interface DirectPlayerProps {
  url: string;
  title?: string;
  poster?: string;
  autoPlay?: boolean;
  className?: string;
}

/**
 * Pemutar native untuk `.mp4` / `.webm` / `.mov`.
 *
 * `preload="metadata"` menahan unduhan berkas penuh sampai pengguna benar-benar
 * memutar — penting di jaringan seluler relawan lapangan. Video tanpa trek
 * audio tetap aman: kontrol bawaan menyesuaikan diri.
 *
 * `autoPlay` di sini aman dan bermakna: tidak ada permintaan ke pihak ketiga,
 * hanya berkas milik pemilik situs. Atribut tetap dipasangkan `muted` karena
 * peramban memblokir putar-otomatis bersuara; kontrol tersedia agar pengguna
 * dapat menyalakan suara sendiri.
 */
function DirectPlayer({ url, title, poster, autoPlay = false, className }: DirectPlayerProps) {
  return (
    <figure className={cn(FIGURE_BASE, className)}>
      <div className={cn(FRAME_BASE, 'aspect-video')}>
        <video
          controls
          playsInline
          autoPlay={autoPlay}
          muted={autoPlay}
          preload="metadata"
          poster={poster}
          className="h-full w-full object-cover"
          aria-label={title ? `Pemutar video: ${title}` : 'Pemutar video'}
        >
          <source src={url} />
          Peramban Anda tidak mendukung pemutar video HTML5.{' '}
          <a href={url} target="_blank" rel="noopener noreferrer">
            Unduh videonya
          </a>
          .
        </video>
      </div>

      {title ? <figcaption className={CAPTION_BASE}>{title}</figcaption> : null}
    </figure>
  );
}

/* -------------------------------------------------------------------------- */
/*  Sub-render: facade klik-untuk-putar                                       */
/* -------------------------------------------------------------------------- */

interface FacadePlayerProps {
  url: string;
  source: ParsedVideoSource;
  embedUrl: string;
  title?: string;
  caption?: string;
  poster?: string;
  startPlaying: boolean;
  onActivate: () => void;
  className?: string;
}

/**
 * Facade: poster ringan dulu, iframe platform baru disuntikkan setelah klik.
 * Tidak ada satu pun permintaan jaringan ke domain pihak ketiga selama belum
 * diputar, sehingga tidak ada iframe yang dimuat bersemangat.
 */
function FacadePlayer({
  url,
  source,
  embedUrl,
  title,
  caption,
  poster,
  startPlaying,
  onActivate,
  className,
}: FacadePlayerProps) {
  const isPortrait = source.orientation === 'portrait';
  const label = PLATFORM_LABELS[source.platform];
  const headingId = useId();

  const [posterCandidateIndex, setPosterCandidateIndex] = useState(0);

  const youTubeCandidates = useMemo(() => {
    if (source.platform !== 'youtube' || source.videoId === null) return [] as string[];
    return youTubePosterCandidates(source.videoId);
  }, [source.platform, source.videoId]);

  const posterCandidates = useMemo(() => {
    const explicit = typeof poster === 'string' && poster.trim().length > 0 ? [poster] : [];
    // Thumbnail hanya disusun untuk YouTube: `i.ytimg.com` memakai ID YouTube,
    // bukan ID Vimeo/TikTok/Instagram — memakainya akan menghasilkan permintaan
    // gambar 404 yang membuang kuota data relawan.
    const automatic =
      source.platform === 'youtube' && source.videoId !== null
        ? [youTubeCandidates[0], youTubeCandidates[1]]
        : [];
    const merged = [...explicit, ...automatic].filter(
      (value): value is string => typeof value === 'string' && value.length > 0,
    );
    return Array.from(new Set(merged));
  }, [poster, source.platform, source.videoId, youTubeCandidates]);

  const activePoster = posterCandidates[posterCandidateIndex];

  const handlePosterError = useCallback(() => {
    setPosterCandidateIndex((current) =>
      current < posterCandidates.length - 1 ? current + 1 : current,
    );
  }, [posterCandidates.length]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault();
        onActivate();
      }
    },
    [onActivate],
  );

  const handleClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault();
      onActivate();
    },
    [onActivate],
  );

  return (
    <figure className={cn(FIGURE_BASE, isPortrait && 'mx-auto max-w-sm', className)}>
      <div className={cn(FRAME_BASE, isPortrait ? 'aspect-[9/16]' : 'aspect-video')}>
        {startPlaying ? (
          <iframe
            src={embedUrl}
            title={title ?? `Video ${label}`}
            loading="lazy"
            allow={IFRAME_ALLOW}
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
            className="absolute inset-0 h-full w-full animate-fade-up border-0"
          />
        ) : (
          <>
            {activePoster ? (
              // eslint-disable-next-line @next/next/no-img-element -- poster pihak ketiga, bukan aset lokal.
              <img
                src={activePoster}
                alt=""
                aria-hidden="true"
                loading="lazy"
                decoding="async"
                onError={handlePosterError}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <span
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-br from-brand-deep via-brand-deep/90 to-brand-primary"
              />
            )}

            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"
            />

            <button
              type="button"
              onClick={handleClick}
              onKeyDown={handleKeyDown}
              aria-label={`Putar video ${label}${title ? `: ${title}` : ''}`}
              aria-describedby={title ? headingId : undefined}
              className={PLAY_BUTTON_BASE}
            >
              <span
                aria-hidden="true"
                className={cn(
                  'relative grid h-16 w-16 place-items-center rounded-full',
                  'bg-brand-accent text-brand-deep shadow-lg',
                  'ring-4 ring-white/25 transition-transform duration-300 ease-crisp',
                  'group-hover/video:scale-105 motion-safe:active:scale-95',
                )}
              >
                <span className="absolute inset-0 animate-pulse-ring rounded-full bg-brand-accent opacity-40" />
                <PlayGlyph className="relative h-7 w-7 translate-x-[1px]" />
              </span>
            </button>

            <span
              aria-hidden="true"
              className="pointer-events-none absolute bottom-3 left-3 z-20 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-white"
            >
              {label}
            </span>
          </>
        )}
      </div>

      {title || caption ? (
        <figcaption className={CAPTION_BASE}>
          {title ? (
            <span id={headingId} className="font-semibold text-ink">
              {title}
            </span>
          ) : null}
          {title && caption ? ' — ' : null}
          {caption ? <span>{caption}</span> : null}
          {startPlaying ? (
            <span className="mt-1 block text-xs text-ink-secondary">
              Video diputar lewat pemutar {label}.
            </span>
          ) : (
            <span className="mt-1 block text-xs text-ink-secondary">
              Ketuk area video untuk memuat pemutar {label}.
            </span>
          )}
        </figcaption>
      ) : null}

      {!startPlaying ? (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'mt-2 inline-flex min-h-[48px] items-center gap-2 rounded-lg px-1',
            'text-xs font-semibold text-brand-primary no-underline',
            'transition-colors duration-200 ease-crisp hover:text-brand-deep',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent',
            'focus-visible:ring-offset-2 focus-visible:ring-offset-canvas',
          )}
        >
          <ExternalLinkGlyph className="h-3.5 w-3.5 shrink-0" />
          Buka di {label}
        </a>
      ) : null}
    </figure>
  );
}

/* -------------------------------------------------------------------------- */
/*  Komponen utama                                                            */
/* -------------------------------------------------------------------------- */

/**
 * VideoEmbed — sematan video responsif yang mengenali platform dari URL.
 *
 * Mendukung YouTube (`watch?v=`, `youtu.be/`, `/embed/`, `/shorts/`), Vimeo
 * (`vimeo.com/{id}`), TikTok (`/@pengguna/video/{id}`), Instagram Reels
 * (`/reel/{id}`), dan berkas langsung (`.mp4`, `.webm`, `.mov` → `<video>`
 * native). URL lain jatuh ke kartu cadangan bertautan.
 *
 * Orientasi: 16:9 untuk YouTube/Vimeo/berkas langsung, 9:16 vertikal
 * (`max-w-sm mx-auto`) untuk TikTok dan Reels.
 *
 * Kinerja: *facade* klik-untuk-putar. Belum ada iframe — hanya poster — sampai
 * pengguna menekan tombol putar, sehingga tidak ada kosakata pihak ketiga yang
 * dimuat lebih awal. Pembungkus ber-`aspect-video` menahan ruang agar CLS nol.
 *
 * @example Artikel Jagatirta dengan video dokumentasi sungai
 * ```tsx
 * <VideoEmbed
 *   url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
 *   title="Pemantauan Ciliwung Hilir, Maret 2026"
 *   caption="Dokumentasi relawan Uji Air."
 *   poster="/gambar/poster-ciliwung.jpg"
 * />
 * ```
 *
 * @example Laporan lapangan ZAMROED Bergerak dalam format vertikal
 * ```tsx
 * <VideoEmbed url="https://www.instagram.com/reel/Cx1y2Z3aBcD/" title="Aksi bersih sungai" />
 * ```
 */
export function VideoEmbed({
  url,
  title,
  caption,
  poster,
  autoPlay = false,
  className,
}: VideoEmbedProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  const trimmedUrl = typeof url === 'string' ? url.trim() : '';

  const source = useMemo(() => parseVideoUrl(trimmedUrl), [trimmedUrl]);

  const embedUrl = useMemo(
    () => buildEmbedUrl(source, autoPlay),
    [source, autoPlay],
  );

  const activate = useCallback(() => {
    setIsPlaying(true);
  }, []);

  // URL kosong atau hanya berisi spasi tidak punya apa pun untuk dirender —
  // jangan pernah meninggalkan kerangka kosong yang memakan ruang layout.
  if (trimmedUrl.length === 0) {
    return null;
  }

  if (source.platform === 'direct') {
    return (
      <DirectPlayer
        url={trimmedUrl}
        title={title}
        poster={poster}
        autoPlay={autoPlay}
        className={className}
      />
    );
  }

  // Facade hanya layak bila kita punya iframe yang benar-benar bisa disuntikkan.
  if (embedUrl === null) {
    return (
      <FallbackCard
        url={trimmedUrl}
        platform={source.platform}
        title={title}
        caption={caption}
        className={className}
      />
    );
  }

  /**
   * Facade wajib bertahan pada render pertama. `autoPlay` hanya diteruskan
   * sebagai parameter `autoplay=1` ke iframe yang disuntikkan setelah klik —
   * bukan alasan memuat iframe pihak ketiga lebih awal. Selain merusak
   * anggaran kinerja, iframe yang dimuat pada render server akan memicu
   * ketidakcocokan hidrasi.
   */
  const shouldStartPlaying = isPlaying;

  return (
    <FacadePlayer
      url={trimmedUrl}
      source={source}
      embedUrl={embedUrl}
      title={title}
      caption={caption}
      poster={poster}
      startPlaying={shouldStartPlaying}
      onActivate={activate}
      className={className}
    />
  );
}

export default VideoEmbed;
