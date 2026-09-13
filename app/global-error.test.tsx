import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import GlobalError from './global-error';

/**
 * Batas galat akar ZAMROED Bergerak (app/global-error.tsx).
 *
 * Merender <html lang="id"> dan <body> sendiri (tema zamroed), membungkus panel
 * dalam `role="alert"`, dan menyediakan tombol pemulihan "Coba lagi".
 * Catatan: komponen ini sengaja tidak memanggil `console.error`.
 */
describe('GlobalError (ZAMROED, root)', () => {
  // RTL menaruh <html> di dalam <div> container-nya, sehingga React memperingatkan
  // validateDOMNesting. Itu artefak harness (Next.js sungguhan mengganti seluruh
  // dokumen), bukan cacat komponen, jadi peringatan itu diredam.
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('merender dokumen html berbahasa Indonesia dengan tema zamroed', () => {
    const { container } = render(<GlobalError error={new Error('x')} reset={vi.fn()} />);

    const html = container.querySelector('html');
    expect(html).not.toBeNull();
    expect(html).toHaveAttribute('lang', 'id');
    expect(html).toHaveClass('theme-zamroed');
    expect(html?.querySelector('body')).not.toBeNull();
  });

  it('menampilkan panel sebagai role="alert"', () => {
    render(<GlobalError error={new Error('x')} reset={vi.fn()} />);

    const alert = screen.getByRole('alert');
    expect(alert.tagName).toBe('MAIN');
    expect(alert).toHaveTextContent('Gangguan sementara');
    expect(alert).toHaveTextContent('Terjadi kesalahan');
  });

  it('menjelaskan kegagalan dan menyediakan kontak koordinator', () => {
    render(<GlobalError error={new Error('x')} reset={vi.fn()} />);

    expect(
      screen.getByText(/Aplikasi tidak berhasil dimuat sepenuhnya/i),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'halo@zamroed.id' })).toHaveAttribute(
      'href',
      'mailto:halo@zamroed.id',
    );
  });

  it('memanggil reset saat tombol pemulihan diklik', async () => {
    const reset = vi.fn();
    const user = userEvent.setup();
    render(<GlobalError error={new Error('x')} reset={reset} />);

    const tombol = screen.getByRole('button', { name: 'Coba lagi' });
    expect(tombol.tagName).toBe('BUTTON');
    expect(tombol).toHaveAttribute('type', 'button');

    await user.click(tombol);

    expect(reset).toHaveBeenCalledTimes(1);
  });

  it('tidak menampilkan kode rujukan bila digest kosong', () => {
    render(<GlobalError error={new Error('x')} reset={vi.fn()} />);

    expect(screen.queryByText(/Kode rujukan:/i)).not.toBeInTheDocument();
  });

  it('menampilkan kode rujukan saat digest ada', () => {
    const error = Object.assign(new Error('x'), { digest: 'abc-9f8e' });
    render(<GlobalError error={error} reset={vi.fn()} />);

    expect(screen.getByText(/Kode rujukan:/i)).toHaveTextContent(
      'Kode rujukan: abc-9f8e',
    );
  });
});
