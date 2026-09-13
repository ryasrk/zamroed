import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import EmptyState from '../empty-state';
import { Button } from '../button';
import { installUserEventCompat } from './test-utils';

beforeAll(() => installUserEventCompat());

describe('EmptyState', () => {
  it('renders the required title inside a labelled region', () => {
    const { container } = render(<EmptyState title="Belum ada sungai yang cocok" />);

    const region = container.querySelector('[data-slot="empty-state"]')!;
    expect(region.tagName).toBe('SECTION');
    expect(region).toHaveAttribute('aria-labelledby', 'empty-state-title');

    const heading = screen.getByRole('heading', { level: 3, name: 'Belum ada sungai yang cocok' });
    expect(heading).toHaveAttribute('id', 'empty-state-title');
  });

  it('renders the built-in icon with an accessible name and hides the plate', () => {
    render(<EmptyState title="Tidak ada hasil" />);

    const icon = screen.getByRole('img', { name: 'Belum ada data' });
    expect(icon.tagName).toBe('svg');
    expect(icon).toHaveAttribute('focusable', 'false');
  });

  it('renders a custom icon inside a presentation wrapper instead of the default', () => {
    render(
      <EmptyState
        title="Belum ada relawan"
        icon={<svg data-testid="ikon-kustom" viewBox="0 0 24 24" />}
      />,
    );

    expect(screen.queryByRole('img', { name: 'Belum ada data' })).not.toBeInTheDocument();

    const custom = screen.getByTestId('ikon-kustom');
    expect(custom.parentElement).toHaveAttribute('role', 'presentation');
    expect(custom.parentElement).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders the description only when provided', () => {
    const { unmount } = render(<EmptyState title="Kosong" />);
    expect(screen.queryByText(/Ubah kata kunci/)).not.toBeInTheDocument();
    unmount();

    render(<EmptyState title="Kosong" description="Ubah kata kunci atau pilih provinsi lain." />);

    const description = screen.getByText('Ubah kata kunci atau pilih provinsi lain.');
    expect(description.tagName).toBe('P');
    expect(description).toHaveAttribute('id', 'empty-state-description');
  });

  it('wires the action slot to the description for screen readers', () => {
    render(
      <EmptyState
        title="Belum ada sungai yang cocok"
        description="Coba ubah filter status."
        action={<Button href="/sungai">Lihat semua sungai</Button>}
      />,
    );

    const link = screen.getByRole('link', { name: 'Lihat semua sungai' });
    const actionSlot = link.parentElement!;

    expect(actionSlot).toHaveAttribute('aria-describedby', 'empty-state-description');
    expect(actionSlot).toHaveAttribute('class', expect.stringContaining('mt-7'));
  });

  it('omits the description reference on the action slot when there is no description', () => {
    render(
      <EmptyState title="Kosong" action={<button type="button">Segarkan</button>} />,
    );

    const actionSlot = screen.getByRole('button', { name: 'Segarkan' }).parentElement!;
    expect(actionSlot).not.toHaveAttribute('aria-describedby');
  });

  it('does not render the action slot at all without an action', () => {
    const { container } = render(<EmptyState title="Kosong" />);

    const region = container.querySelector('[data-slot="empty-state"]')!;
    // Glow + icon plate + heading.
    expect(region.children).toHaveLength(3);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('fires the action callback when the recovery button is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    const onClick = vi.fn();

    render(
      <EmptyState
        title="Riwayat pemeriksaan kosong"
        description="Tambahkan pemeriksaan pertama."
        action={
          <button type="button" onClick={onClick}>
            Tambah pemeriksaan
          </button>
        }
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Tambah pemeriksaan' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('renders the footer slot after the action', () => {
    const { container } = render(
      <EmptyState
        title="Belum ada relawan terjadwal"
        action={<Button href="/relawan/daftar">Daftar jadi relawan</Button>}
        footer={<p>Butuh bantuan? hubungi lapangan@jagatirta.id</p>}
      />,
    );

    const region = container.querySelector('[data-slot="empty-state"]')!;
    const footer = screen.getByText(/lapangan@jagatirta\.id/);
    expect(footer.parentElement).toHaveAttribute('class', expect.stringContaining('mt-6'));

    // Order on screen: heading -> action slot -> footer.
    const actionSlot = screen.getByRole('link', { name: 'Daftar jadi relawan' }).parentElement!;
    expect(
      actionSlot.compareDocumentPosition(footer) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(region).toContainElement(footer);
  });

  it('trims whitespace around title and description', () => {
    render(<EmptyState title="   Belum ada data   " description="   Tidak ada baris.   " />);

    expect(screen.getByRole('heading', { name: 'Belum ada data' })).toBeInTheDocument();
    expect(screen.getByText('Tidak ada baris.')).toBeInTheDocument();
  });

  it('falls back to a generic heading when the title is blank', () => {
    render(<EmptyState title="   " />);

    expect(screen.getByRole('heading', { name: 'Belum ada data untuk ditampilkan' })).toBeInTheDocument();
  });

  it('falls back to the generic heading when a null-ish title arrives from the API', () => {
    // The API can hand us null despite the `string` type.
    render(<EmptyState title={null as unknown as string} />);

    expect(screen.getByRole('heading', { name: 'Belum ada data untuk ditampilkan' })).toBeInTheDocument();
  });

  it('treats a blank description as absent', () => {
    const { container } = render(
      <EmptyState title="Kosong" description="   " action={<button type="button">Segarkan</button>} />,
    );

    expect(container.querySelector('#empty-state-description')).toBeNull();
    expect(screen.getByRole('button', { name: 'Segarkan' }).parentElement).not.toHaveAttribute(
      'aria-describedby',
    );
  });

  it('merges className and forwards arbitrary attributes', () => {
    const { container } = render(
      <EmptyState title="Kosong" className="kelas-kosong" data-testid="kosong" id="riwayat-kosong" />,
    );

    const region = screen.getByTestId('kosong');
    expect(region).toHaveAttribute('id', 'riwayat-kosong');
    expect(region.className).toContain('kelas-kosong');
    expect(container.querySelector('[data-slot="empty-state"]')).toBe(region);
  });

  it('renders a very long title and description without truncating them', () => {
    const longTitle = 'Belum ada hasil pencarian untuk kata kunci '.repeat(6).trim();
    const longDescription = 'Coba kata kunci lain atau pilih wilayah berbeda. '.repeat(20).trim();

    render(<EmptyState title={longTitle} description={longDescription} />);

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(longTitle);
    expect(screen.getByText(longDescription)).toBeInTheDocument();
  });

  it('keeps the decorative glow hidden from assistive technology', () => {
    const { container } = render(<EmptyState title="Kosong" />);

    const region = container.querySelector('[data-slot="empty-state"]')!;
    const glow = region.children[0];
    expect(glow).toHaveAttribute('aria-hidden', 'true');
    expect(glow.tagName).toBe('SPAN');
  });
});
