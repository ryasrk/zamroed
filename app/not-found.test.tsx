import { describe, expect, it } from 'vitest';
import { render, screen, within } from '@testing-library/react';

import NotFound from './not-found';

/**
 * Halaman 404 global ZAMROED Bergerak (app/not-found.tsx).
 *
 * Server Component dengan `metadata`, judul/eyebrow dari `Section`, daftar tiga
 * tautan bantuan, dan dua tombol CTA (beranda + gabung relawan).
 */
describe('NotFound (ZAMROED)', () => {
  it('mengekspor metadata judul "Halaman tidak ditemukan"', async () => {
    const mod = await import('./not-found');
    expect(mod.metadata).toEqual({ title: 'Halaman tidak ditemukan' });
  });

  it('menampilkan judul utama dari Section sebagai heading level 2', () => {
    render(<NotFound />);

    expect(screen.getByText('Kesalahan 404')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Halaman tidak ditemukan' }),
    ).toBeInTheDocument();
  });

  it('menjelaskan kemungkinan alamat sudah dipindahkan atau tidak pernah ada', () => {
    render(<NotFound />);

    expect(
      screen.getByText(/Alamat yang Anda tuju mungkin sudah dipindahkan/i),
    ).toBeInTheDocument();
  });

  it('menampilkan tiga tautan bantuan beserta keterangannya', () => {
    render(<NotFound />);

    const daftar = screen.getByRole('list');
    const butir = within(daftar).getAllByRole('listitem');
    expect(butir).toHaveLength(3);

    expect(within(daftar).getByRole('link', { name: /Kembali ke Beranda/ })).toHaveAttribute(
      'href',
      '/',
    );
    expect(within(daftar).getByRole('link', { name: /Lihat Program Kami/ })).toHaveAttribute(
      'href',
      '/program',
    );
    expect(within(daftar).getByRole('link', { name: /Baca Liputan & Aksi/ })).toHaveAttribute(
      'href',
      '/liputan-aksi',
    );

    expect(butir[0]).toHaveTextContent('Ringkasan gerakan dan aksi terbaru ZAMROED Bergerak.');
    expect(butir[1]).toHaveTextContent(/Pilar kedaulatan ekologi, tanggap bencana/i);
    expect(butir[2]).toHaveTextContent(/Catatan lapangan dan kabar terbaru/i);
  });

  it('menyediakan tombol CTA beranda dan gabung relawan', () => {
    render(<NotFound />);

    // Kartu tautan juga memuat keterangannya sehingga nama aksesibelnya lebih
    // panjang; tombol CTA memakai label persis "Kembali ke Beranda".
    expect(screen.getByRole('link', { name: 'Kembali ke Beranda' })).toHaveAttribute(
      'href',
      '/',
    );
    expect(
      screen.getByRole('link', { name: /^Kembali ke Beranda Ringkasan/ }),
    ).toHaveAttribute('href', '/');

    expect(screen.getByRole('link', { name: 'Gabung Relawan' })).toHaveAttribute(
      'href',
      '/volunteer',
    );
  });
});
