import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Inter } from 'next/font/google';
import { Footer, Header } from '@repo/ui';
import '@repo/ui/styles/globals.css';

const display = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const body = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const title = 'ZAMROED Bergerak';
const description =
  'Gerakan solidaritas warga untuk kedaulatan ekologi, keadilan sosial, dan masa depan berkelanjutan.';

export const metadata: Metadata = {
  metadataBase: new URL('https://zamroed.id'),
  title: {
    default: title,
    template: '%s | ZAMROED Bergerak',
  },
  description,
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    siteName: 'ZAMROED Bergerak',
    title,
    description,
    url: 'https://zamroed.id',
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
  },
  robots: {
    index: true,
    follow: true,
  },
};

const navItems = [
  { label: 'Beranda', href: '/' },
  { label: 'Sejarah', href: '/sejarah' },
  { label: 'Program', href: '/program' },
  { label: 'Relawan', href: '/volunteer' },
  { label: 'Liputan & Aksi', href: '/liputan-aksi' },
];

const footerColumns = [
  {
    title: 'Gerakan',
    links: [
      { label: 'Sejarah', href: '/sejarah' },
      { label: 'Program', href: '/program' },
      { label: 'Liputan & Aksi', href: '/liputan-aksi' },
    ],
  },
  {
    title: 'Terlibat',
    links: [
      { label: 'Jadi Relawan', href: '/volunteer' },
      { label: 'Unduh Siaran Pers', href: '/liputan-aksi' },
    ],
  },
  {
    title: 'Pilar',
    links: [
      { label: 'Kedaulatan Ekologi', href: '/program' },
      { label: 'Tanggap Bencana', href: '/program' },
      { label: 'Pendidikan Akar Rumput', href: '/program' },
    ],
  },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${display.variable} ${body.variable} theme-zamroed`}>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        <Header
          brandName="ZAMROED Bergerak"
          navItems={navItems}
          ctaLabel="Gabung Relawan"
          ctaHref="/volunteer"
        />
        <main className="flex-1">{children}</main>
        <Footer
          brandName="ZAMROED Bergerak"
          tagline="Gerakan solidaritas warga untuk kedaulatan ekologi, keadilan sosial, dan masa depan yang berkelanjutan."
          columns={footerColumns}
          contact={{ email: 'halo@zamroed.id' }}
        />
      </body>
    </html>
  );
}
