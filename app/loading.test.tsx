import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';

import Loading from './loading';

/**
 * Keadaan memuat tingkat segmen ZAMROED Bergerak (app/loading.tsx).
 *
 * Server Component tanpa hook: `role="status"` mengumumkan pemuatan, teks
 * "Memuat halaman…" tersedia secara a11y, dan kerangka ditandai `aria-hidden`.
 */
describe('Loading (ZAMROED, segmen)', () => {
  it('mengumumkan status pemuatan ke pembaca layar', () => {
    render(<Loading />);

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveAttribute('aria-busy', 'true');
  });

  it('menyediakan teks alternatif "Memuat halaman…"', () => {
    render(<Loading />);

    expect(screen.getByText('Memuat halaman…')).toBeInTheDocument();
  });

  it('menyembunyikan kerangka visual dari pohon aksesibilitas', () => {
    const { container } = render(<Loading />);

    const kerangka = container.querySelector('[aria-hidden="true"]');
    expect(kerangka).not.toBeNull();
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1);
    expect(kerangka?.textContent).toBe('');
  });

  it('menampilkan tiga kartu kerangka placeholder', () => {
    const { container } = render(<Loading />);

    const kerangka = container.querySelector('[aria-hidden="true"]');
    // Struktur: kerangka → (eyebrow/judul…, grid) → 3 kartu.
    const grid = kerangka?.lastElementChild as HTMLElement | null;
    expect(grid).not.toBeNull();

    const kolom = grid ? Array.from(grid.children) : [];
    expect(kolom).toHaveLength(3);
    kolom.forEach((kartu) => {
      expect(kartu.textContent).toBe('');
      expect(kartu.children.length).toBeGreaterThan(0);
    });
  });

  it('tidak menampilkan heading atau galat palsu saat memuat', () => {
    render(<Loading />);

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('status').textContent?.trim()).toBe('Memuat halaman…');
  });
});
