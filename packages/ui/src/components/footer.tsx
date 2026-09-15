import type { ReactNode } from 'react';

import { cn } from '../lib/cn';

/** Satu tautan di dalam kolom footer. */
export interface FooterLink {
  label: string;
  href: string;
}

/** Satu kolom navigasi footer — mis. "Program", "Data Sungai", "Tentang". */
export interface FooterColumn {
  title: string;
  links: FooterLink[];
}

/** Tautan kanal sosial. Label teks dirender bila tidak ada ikon bawaan. */
export interface FooterSocial {
  platform: string;
  href: string;
}

/** Blok kontak opsional di bawah identitas brand. */
export interface FooterContact {
  email?: string;
  phone?: string;
  address?: string;
}

export interface FooterProps {
  /** Nama organisasi, mis. "Jagatirta" atau "ZAMROED Bergerak". */
  brandName: string;
  /** Satu baris penjelas di bawah nama brand. */
  tagline: string;
  /** 3–4 kolom navigasi; otomatis menumpuk di layar sempit. */
  columns: FooterColumn[];
  /** Kanal sosial opsional. */
  socials?: FooterSocial[];
  /** Kontak opsional. */
  contact?: FooterContact;
  /** Tahun hak cipta. Default: tahun berjalan. */
  year?: number;
}

type SocialIcon = (props: { className?: string }) => ReactNode;

/**
 * Ikon SVG inline untuk platform yang umum dipakai.
 * Nama tak dikenal jatuh ke ikon tautan generik — tidak pernah gagal render.
 */
function GlobeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M3 12h18M12 3c2.4 2.5 3.6 5.5 3.6 9s-1.2 6.5-3.6 9c-2.4-2.5-3.6-5.5-3.6-9S9.6 5.5 12 3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <rect x="3.25" y="3.25" width="17.5" height="17.5" rx="5" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17" cy="7" r="1.2" fill="currentColor" />
    </svg>
  );
}

function YoutubeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" stroke="currentColor" strokeWidth="1.6" />
      <path d="M11 9.6l3.6 2.4-3.6 2.4V9.6Z" fill="currentColor" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <path
        d="M14.5 8.5h2.2V5.6h-2.4c-2.3 0-3.9 1.5-3.9 3.8v1.7H8.2v2.9h2.2V21h3.1v-7h2.3l.4-2.9h-2.7V9.7c0-.7.4-1.2 1-1.2Z"
        fill="currentColor"
      />
    </svg>
  );
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <path
        d="M4.5 4.5h3.2l4 5.4 4.4-5.4h2.4l-5.7 6.9 6.1 8.1h-3.2l-4.3-5.8-4.7 5.8H4.3l6-7.3L4.5 4.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

function WhatsappIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <path
        d="M12 3.5a8.4 8.4 0 0 0-7.2 12.7L3.6 20.4l4.3-1.1A8.4 8.4 0 1 0 12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9.1 8.4c.3-.1.6 0 .7.3l.6 1.2c.1.2.1.4-.1.6l-.4.5c.4.9 1.1 1.6 2 2l.5-.4c.2-.2.4-.2.6-.1l1.2.6c.3.1.4.4.3.7-.3.9-1.2 1.4-2.1 1.2-2.2-.5-4.1-2.4-4.6-4.6-.2-.9.3-1.8 1.2-2.1Z"
        fill="currentColor"
      />
    </svg>
  );
}

function TiktokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
      <path
        d="M13.8 3.5h2.6c.2 1.8 1.3 3.2 3.1 3.5v2.6c-1.2 0-2.3-.4-3.2-1v5.5a5.3 5.3 0 1 1-5.3-5.3c.3 0 .6 0 .9.1v2.7a2.6 2.6 0 1 0 1.8 2.5V3.5Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Peta ikon sosial — pencocokan longgar terhadap `platform`
 * ("Instagram", "IG", "@jagatirta" semuanya cocok).
 */
const SOCIAL_ICONS: Record<string, SocialIcon> = {
  instagram: InstagramIcon,
  ig: InstagramIcon,
  youtube: YoutubeIcon,
  yt: YoutubeIcon,
  facebook: FacebookIcon,
  fb: FacebookIcon,
  twitter: XIcon,
  x: XIcon,
  whatsapp: WhatsappIcon,
  wa: WhatsappIcon,
  tiktok: TiktokIcon,
};

function resolveSocialIcon(platform: string): SocialIcon {
  const key = platform.trim().toLowerCase();
  return SOCIAL_ICONS[key] ?? SOCIAL_ICONS[key.replace(/[^a-z]/g, '')] ?? GlobeIcon;
}

/** Arsip tahun bergilir yang aman dari `NaN` dan nilai tak masuk akal. */
function resolveYear(year?: number): number {
  const fallback = new Date().getFullYear();
  if (typeof year !== 'number' || !Number.isFinite(year)) return fallback;
  const rounded = Math.trunc(year);
  return rounded >= 1900 && rounded <= 9999 ? rounded : fallback;
}

const FOCUS_RING =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-accent focus-visible:ring-offset-2 focus-visible:ring-offset-brand-deep';

const LINK_CLASS = cn(
  'inline-flex min-h-12 items-center rounded-lg text-sm leading-relaxed',
  'text-white/85 transition-colors duration-200 ease-crisp hover:text-white',
  FOCUS_RING,
);

/**
 * Footer bersama untuk Jagatirta & ZAMROED Bergerak.
 *
 * Server-compatible (tanpa hooks/state) sehingga bisa dirender dari
 * React Server Component. Seluruh warna diambil dari token `brand.*`
 * (CSS variable) sehingga satu komponen melayani kedua tema.
 *
 * - Grid 3–4 kolom pada desktop, menumpuk satu kolom di ponsel.
 * - Target sentuh minimal 48px untuk setiap tautan.
 * - Kontras teks hangat (putih 70–80%) alih-alih putih murni yang keras.
 */
export function Footer({
  brandName,
  tagline,
  columns,
  socials,
  contact,
  year,
}: FooterProps) {
  const copyrightYear = resolveYear(year);
  const safeColumns = Array.isArray(columns) ? columns : [];
  const safeSocials = Array.isArray(socials) ? socials.filter((s) => s && s.href && s.platform) : [];
  const contactItems = contact
    ? ([
        { key: 'email', label: 'Surel', value: contact.email, href: contact.email ? `mailto:${contact.email}` : undefined },
        { key: 'phone', label: 'Telepon', value: contact.phone, href: contact.phone ? `tel:${contact.phone.replace(/\s+/g, '')}` : undefined },
        { key: 'address', label: 'Alamat', value: contact.address, href: undefined },
      ].filter((item) => Boolean(item.value)) as {
        key: string;
        label: string;
        value: string | undefined;
        href: string | undefined;
      }[])
    : [];

  const hasTop = safeColumns.length > 0 || safeSocials.length > 0 || contactItems.length > 0;

  return (
    <footer
      role="contentinfo"
      className="relative isolate overflow-hidden bg-brand-deep text-white/80"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 -top-32 -z-10 h-72 w-72 rounded-full bg-brand-primary opacity-[0.18] blur-3xl"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 bottom-0 -z-10 h-64 w-64 rounded-full bg-brand-accent opacity-[0.12] blur-3xl"
      />

      <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8 md:py-20">
        {hasTop ? (
          <div className="grid grid-cols-1 gap-grid-loose sm:grid-cols-2 lg:grid-cols-4 lg:gap-grid-normal">
            {/* Identitas brand */}
            <div className="animate-fade-up sm:col-span-2 lg:col-span-1">
              <p className="text-lg font-bold tracking-tight text-white">
                <span aria-hidden="true" className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-brand-accent align-middle" />
                {brandName}
              </p>
              <p className="measure-editorial mt-4 max-w-sm text-sm leading-relaxed text-white/85">
                {tagline}
              </p>

              {contactItems.length > 0 ? (
                <ul className="mt-6 space-y-1">
                  {contactItems.map((item) => (
                    <li key={item.key}>
                      {item.href ? (
                        <a href={item.href} className={cn(LINK_CLASS, 'gap-2')}>
                          <span className="text-white/45">{item.label}:</span>
                          <span className="break-all">{item.value}</span>
                        </a>
                      ) : (
                        <p className="flex min-h-12 items-start gap-2 py-3 text-sm leading-relaxed text-white/85">
                          <span className="shrink-0 text-white/45">{item.label}:</span>
                          <span>{item.value}</span>
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              ) : null}

              {safeSocials.length > 0 ? (
                <ul
                  aria-label="Kanal media sosial"
                  className="mt-6 flex flex-wrap items-center gap-2"
                >
                  {safeSocials.map((social) => {
                    const Icon = resolveSocialIcon(social.platform);
                    return (
                      <li key={`${social.platform}-${social.href}`}>
                        <a
                          href={social.href}
                          aria-label={`Kunjungi ${social.platform}`}
                          className={cn(
                            'inline-flex h-12 w-12 items-center justify-center rounded-xl',
                            'border border-white/15 bg-white/5 text-white/85',
                            'transition-colors duration-200 ease-crisp hover:bg-white/12 hover:text-white',
                            FOCUS_RING,
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </a>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </div>

            {/* Kolom navigasi */}
            {safeColumns.map((column) => {
              const links = Array.isArray(column.links)
                ? column.links.filter((link) => link && link.label && link.href)
                : [];

              return (
                <nav
                  key={column.title}
                  aria-label={column.title}
                  className="animate-fade-up"
                >
                  <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-accent">
                    {column.title}
                  </h2>
                  {links.length > 0 ? (
                    <ul className="mt-3 flex flex-col">
                      {links.map((link) => (
                        <li key={`${column.title}-${link.label}-${link.href}`}>
                          <a
                            href={link.href}
                            className={cn(
                              LINK_CLASS,
                              'hover:translate-x-0.5 motion-safe:transition-transform',
                            )}
                          >
                            {link.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-white/50">Belum ada tautan.</p>
                  )}
                </nav>
              );
            })}
          </div>
        ) : null}

        {/* Garis hak cipta */}
        <div
          className={cn(
            'flex flex-col gap-3 pt-8 sm:flex-row sm:items-center sm:justify-between',
            hasTop ? 'mt-10 border-t border-white/12' : 'pt-0',
          )}
        >
          <p className="text-sm leading-relaxed text-white/85">
            © {copyrightYear}{' '}
            <span className="font-semibold text-white/85">{brandName}</span>. Hak cipta dilindungi
            undang-undang.
          </p>
          <p className="text-xs leading-relaxed text-white/45">
            Dibuat untuk transparansi data sungai dan gerakan lingkungan Indonesia.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
