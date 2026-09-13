import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Diimpor dengan nama lain supaya tidak membayangi konstruktor global `Error`.
import ErrorSegment from './error';

/**
 * Batas galat tingkat segmen ZAMROED Bergerak (app/error.tsx).
 *
 * Berbeda dari Jagatirta, di sini judul/eyebrow datang dari `Section` dan pesan
 * pemulihan dibungkus `role="alert"`; kontak dikirim ke halo@zamroed.id.
 */
describe('Error (ZAMROED, segmen)', () => {
  let consoleError: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleError.mockRestore();
  });

  it('menampilkan judul dan deskripsi dari Section', () => {
    render(<ErrorSegment error={new Error('x')} reset={vi.fn()} />);

    expect(screen.getByText('Gangguan sementara')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Terjadi kesalahan' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Kami tidak berhasil memuat bagian ini/i),
    ).toBeInTheDocument();
  });

  it('membungkus pesan pemulihan dalam role="alert" yang santun', () => {
    render(<ErrorSegment error={new Error('x')} reset={vi.fn()} />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'polite');
    expect(alert).toHaveTextContent(/hubungi koordinator kami/i);
  });

  it('mencatat galat ke konsol sekali melalui useEffect', () => {
    const galat = new Error('gagal memuat');
    render(<ErrorSegment error={galat} reset={vi.fn()} />);

    expect(consoleError).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledWith(galat);
  });

  it('menautkan kontak koordinator ke mailto:halo@zamroed.id', () => {
    render(<ErrorSegment error={new Error('x')} reset={vi.fn()} />);

    expect(screen.getByRole('link', { name: 'halo@zamroed.id' })).toHaveAttribute(
      'href',
      'mailto:halo@zamroed.id',
    );
  });

  it('memanggil reset saat tombol "Coba lagi" diklik', async () => {
    const reset = vi.fn();
    const user = userEvent.setup();
    render(<ErrorSegment error={new Error('x')} reset={reset} />);

    const tombol = screen.getByRole('button', { name: 'Coba lagi' });
    expect(tombol).toHaveAttribute('type', 'button');

    await user.click(tombol);

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('menautkan "Kembali ke Beranda" ke rute /', () => {
    render(<ErrorSegment error={new Error('x')} reset={vi.fn()} />);

    expect(screen.getByRole('link', { name: 'Kembali ke Beranda' })).toHaveAttribute(
      'href',
      '/',
    );
  });

  it('tidak menampilkan kode rujukan bila digest kosong', () => {
    render(<ErrorSegment error={new Error('x')} reset={vi.fn()} />);

    expect(screen.queryByText(/Kode rujukan:/i)).not.toBeInTheDocument();
  });

  it('menampilkan kode rujukan apa adanya saat digest ada', () => {
    const error = Object.assign(new Error('x'), { digest: 'zam-42x' });
    render(<ErrorSegment error={error} reset={vi.fn()} />);

    const baris = screen.getByText(/Kode rujukan:/i);
    expect(baris).toHaveTextContent('Kode rujukan: zam-42x');
    expect(screen.getByText('zam-42x').tagName).toBe('SPAN');
  });
});
