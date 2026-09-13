import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';

import { Footer } from '../footer';

const NAV_COLUMNS = [
  { title: 'Program', links: [{ label: 'Pemantauan Sungai', href: '/program/pemantauan' }] },
  {
    title: 'Data Sungai',
    links: [
      { label: 'Unduh Data', href: '/data/unduh' },
      { label: 'Metodologi', href: '/data/metodologi' },
    ],
  },
  { title: 'Tentang', links: [{ label: 'Tentang Kami', href: '/tentang' }] },
];

describe('Footer', () => {
  it('renders brand name, tagline and the running-year copyright', () => {
    render(
      <Footer
        brandName="Jagatirta"
        tagline="Menjaga sungai Indonesia."
        columns={[{ title: 'Program', links: [{ label: 'Program', href: '/program' }] }]}
      />,
    );

    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    // The brand appears once as the identity line and once inside the copyright.
    expect(screen.getAllByText('Jagatirta').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Menjaga sungai Indonesia.')).toBeInTheDocument();

    const year = new Date().getFullYear();
    const copyright = screen.getByText(/Hak cipta dilindungi undang-undang/);
    expect(copyright).toHaveTextContent(`© ${year}`);
    expect(within(copyright).getByText('Jagatirta')).toBeInTheDocument();
  });

  it('renders each navigation column as a labelled nav with its links', () => {
    render(<Footer brandName="ZAMROED Bergerak" tagline="Gerakan warga." columns={NAV_COLUMNS} />);

    expect(screen.getByRole('navigation', { name: 'Program' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Data Sungai' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Tentang' })).toBeInTheDocument();

    expect(screen.getByRole('heading', { name: 'Program', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Unduh Data' })).toHaveAttribute('href', '/data/unduh');
    expect(screen.getByRole('link', { name: 'Metodologi' })).toHaveAttribute(
      'href',
      '/data/metodologi',
    );
    expect(screen.getByRole('link', { name: 'Tentang Kami' })).toHaveAttribute('href', '/tentang');
  });

  it('shows the empty-state note for a column without links', () => {
    render(
      <Footer
        brandName="Jagatirta"
        tagline="Menjaga sungai."
        columns={[{ title: 'Kosong', links: [] }]}
      />,
    );

    expect(screen.getByText('Belum ada tautan.')).toBeInTheDocument();
  });

  it('filters out malformed links inside a column', () => {
    render(
      <Footer
        brandName="Jagatirta"
        tagline="Menjaga sungai."
        columns={[
          {
            title: 'Campur',
            links: [
              // Entri cacat: label kosong dan href kosong. Keduanya bertipe sah
              // tetapi harus dibuang saat render.
              { label: '', href: '/kosong' },
              { label: 'Tanpa Href', href: '' },
              { label: 'Sah', href: '/sah' },
            ],
          },
        ]}
      />,
    );

    expect(screen.getByRole('link', { name: 'Sah' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Tanpa Href' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Kosong' })).not.toBeInTheDocument();
    expect(screen.queryByText('Belum ada tautan.')).not.toBeInTheDocument();
  });

  it('renders contact items with mailto/tel hrefs and a plain-text address', () => {
    render(
      <Footer
        brandName="Jagatirta"
        tagline="Menjaga sungai."
        columns={[]}
        contact={{
          email: 'relawan@jagatirta.id',
          phone: '+62 812 3456 7890',
          address: 'Jl. Sungai No. 1, Bandung',
        }}
      />,
    );

    expect(screen.getByRole('link', { name: /Surel:/ })).toHaveAttribute(
      'href',
      'mailto:relawan@jagatirta.id',
    );
    // Whitespace is stripped from the tel: href but preserved in the visible value.
    expect(screen.getByRole('link', { name: /Telepon:/ })).toHaveAttribute(
      'href',
      'tel:+6281234567890',
    );
    // Address has no link target, so it renders as plain text.
    expect(screen.queryByRole('link', { name: /Alamat:/ })).not.toBeInTheDocument();
    expect(screen.getByText('Jl. Sungai No. 1, Bandung')).toBeInTheDocument();
  });

  it('omits contact entries that are empty strings', () => {
    render(
      <Footer
        brandName="Jagatirta"
        tagline="Menjaga sungai."
        columns={[]}
        contact={{ email: '', phone: '+62 21 555', address: '' }}
      />,
    );

    expect(screen.queryByText(/Surel:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Alamat:/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Telepon:/ })).toHaveAttribute('href', 'tel:+6221555');
  });

  it('renders social channels as labelled links and matches icons loosely', () => {
    render(
      <Footer
        brandName="ZAMROED Bergerak"
        tagline="Gerakan warga."
        columns={[]}
        socials={[
          { platform: 'Instagram', href: 'https://instagram.com/zamroed' },
          { platform: 'YT', href: 'https://youtube.com/@zamroed' },
          { platform: '@jagatirta', href: 'https://tiktok.com/@jagatirta' },
          { platform: 'Situs Tautan', href: 'https://jagatirta.id' },
        ]}
      />,
    );

    const list = screen.getByRole('list', { name: 'Kanal media sosial' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(4);

    expect(screen.getByRole('link', { name: 'Kunjungi Instagram' })).toHaveAttribute(
      'href',
      'https://instagram.com/zamroed',
    );
    // 'YT' normalises to the youtube icon key and is still rendered.
    expect(screen.getByRole('link', { name: 'Kunjungi YT' })).toBeInTheDocument();
    // '@jagatirta' strips non-letters and falls back to the generic globe icon.
    expect(screen.getByRole('link', { name: 'Kunjungi @jagatirta' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Kunjungi Situs Tautan' })).toHaveAttribute(
      'href',
      'https://jagatirta.id',
    );
  });

  it('resolves every documented social platform to an inline SVG icon', () => {
    const platforms = [
      'Instagram',
      'ig',
      'YouTube',
      'yt',
      'Facebook',
      'fb',
      'Twitter',
      'x',
      'WhatsApp',
      'wa',
      'TikTok',
      'Lainnya',
    ];
    render(
      <Footer
        brandName="Jagatirta"
        tagline="Menjaga sungai."
        columns={[]}
        socials={platforms.map((platform) => ({
          platform,
          href: `https://contoh.id/${encodeURIComponent(platform)}`,
        }))}
      />,
    );

    const list = screen.getByRole('list', { name: 'Kanal media sosial' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(platforms.length);

    platforms.forEach((platform) => {
      const link = screen.getByRole('link', { name: `Kunjungi ${platform}` });
      const svg = link.querySelector('svg');
      expect(svg).not.toBeNull();
      expect(svg).toHaveAttribute('aria-hidden', 'true');
    });
  });

  it('drops socials missing a platform or href', () => {
    render(
      <Footer
        brandName="Jagatirta"
        tagline="Menjaga sungai."
        columns={[]}
        socials={[
          { platform: 'Instagram', href: 'https://instagram.com/a' },
          { platform: '', href: 'https://example.com' },
          { platform: 'YouTube', href: '' },
        ]}
      />,
    );

    expect(screen.getByRole('link', { name: 'Kunjungi Instagram' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Kunjungi YouTube' })).not.toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Kanal media sosial' }).querySelectorAll('li')).toHaveLength(
      1,
    );
  });

  it('honours an explicit copyright year and truncates fractional values', () => {
    const { rerender } = render(
      <Footer brandName="Jagatirta" tagline="Menjaga sungai." columns={[]} year={2019} />,
    );
    expect(screen.getByText(/Hak cipta dilindungi/)).toHaveTextContent('© 2019');

    rerender(<Footer brandName="Jagatirta" tagline="Menjaga sungai." columns={[]} year={2024.9} />);
    expect(screen.getByText(/Hak cipta dilindungi/)).toHaveTextContent('© 2024');
  });

  it('falls back to the running year for nonsensical or NaN values', () => {
    const current = new Date().getFullYear();

    const { rerender } = render(
      <Footer brandName="Jagatirta" tagline="Menjaga sungai." columns={[]} year={Number.NaN} />,
    );
    expect(screen.getByText(/Hak cipta dilindungi/)).toHaveTextContent(`© ${current}`);

    rerender(
      <Footer brandName="Jagatirta" tagline="Menjaga sungai." columns={[]} year={1800} />,
    );
    expect(screen.getByText(/Hak cipta dilindungi/)).toHaveTextContent(`© ${current}`);

    rerender(
      <Footer brandName="Jagatirta" tagline="Menjaga sungai." columns={[]} year={Number.POSITIVE_INFINITY} />,
    );
    expect(screen.getByText(/Hak cipta dilindungi/)).toHaveTextContent(`© ${current}`);
  });

  it('renders only the copyright bar when there is no top content', () => {
    render(<Footer brandName="Jagatirta" tagline="Menjaga sungai." columns={[]} />);

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Kanal media sosial' })).not.toBeInTheDocument();
    expect(screen.getByText(/Dibuat untuk transparansi data sungai/)).toBeInTheDocument();
  });

  it('tolerates a non-array columns prop at runtime', () => {
    // @ts-expect-error deliberately hostile prop to exercise the Array.isArray guard
    render(<Footer brandName="Jagatirta" tagline="Menjaga sungai." columns={null} />);

    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
    expect(screen.getByText(/Hak cipta dilindungi/)).toBeInTheDocument();
  });

  it('renders a single column with a single link (one-element array)', () => {
    render(
      <Footer
        brandName="Jagatirta"
        tagline="Menjaga sungai."
        columns={[{ title: 'Hanya', links: [{ label: 'Satu', href: '/satu' }] }]}
      />,
    );

    const nav = screen.getByRole('navigation', { name: 'Hanya' });
    const links = within(nav).getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveTextContent('Satu');
  });

  it('treats a non-array column.links as an empty column', () => {
    render(
      <Footer
        brandName="Jagatirta"
        tagline="Menjaga sungai."
        // @ts-expect-error deliberately hostile column to exercise the Array.isArray guard
        columns={[{ title: 'Rusak', links: null }]}
      />,
    );

    const nav = screen.getByRole('navigation', { name: 'Rusak' });
    expect(nav).toHaveTextContent('Belum ada tautan.');
    expect(within(nav).queryAllByRole('link')).toHaveLength(0);
  });
});
