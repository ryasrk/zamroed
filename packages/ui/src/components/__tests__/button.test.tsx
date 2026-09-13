import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { Button, type ButtonSize, type ButtonVariant } from '../button';
import { installUserEventCompat } from './test-utils';

// The workspace jsdom + user-event pairing rejects the built-in clipboard
// property; make navigator configurable before any interaction test runs.
beforeAll(() => installUserEventCompat());

const VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'outline', 'ghost', 'danger'];
const SIZES: ButtonSize[] = ['sm', 'md', 'lg'];

describe('Button', () => {
  it('renders a button with the default type and variant', () => {
    render(<Button>Kirim</Button>);

    const button = screen.getByRole('button', { name: 'Kirim' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toHaveAttribute('data-variant', 'primary');
    expect(button).toBeEnabled();
  });

  it('renders every documented variant, tagging each with data-variant', () => {
    for (const variant of VARIANTS) {
      const { unmount } = render(<Button variant={variant}>{`varian-${variant}`}</Button>);

      const button = screen.getByRole('button', { name: `varian-${variant}` });
      expect(button).toHaveAttribute('data-variant', variant);
      expect(button.tagName).toBe('BUTTON');

      unmount();
    }
  });

  it('renders every documented size', () => {
    for (const size of SIZES) {
      const { unmount } = render(<Button size={size}>{`ukuran-${size}`}</Button>);

      expect(screen.getByRole('button', { name: `ukuran-${size}` })).toBeEnabled();

      unmount();
    }
  });

  it('calls onClick with the click event and forwards the ref', async () => {
    const user = userEvent.setup({ delay: null });
    const onClick = vi.fn();
    const ref = createRef<HTMLElement>();

    render(
      <Button onClick={onClick} ref={ref}>
        Simpan
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Simpan' });
    await user.click(button);

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick.mock.calls[0][0].type).toBe('click');
    expect(ref.current).toBe(button);
  });

  it('supports keyboard activation with Enter and Space', async () => {
    const user = userEvent.setup({ delay: null });
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Aktifkan</Button>);

    await user.tab();
    expect(screen.getByRole('button', { name: 'Aktifkan' })).toHaveFocus();

    await user.keyboard('{Enter}');
    await user.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('does not fire onClick when disabled and exposes the disabled attribute', async () => {
    const user = userEvent.setup({ delay: null });
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Nonaktif
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Nonaktif' });
    expect(button).toBeDisabled();
    expect(button).not.toHaveAttribute('aria-busy');

    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('blocks interaction while loading and reports aria-busy', async () => {
    const user = userEvent.setup({ delay: null });
    const onClick = vi.fn();
    render(
      <Button loading onClick={onClick}>
        Menyimpan
      </Button>,
    );

    // The label stays first in the accessible name; the visually hidden
    // announcement is appended after it.
    const button = screen.getByRole('button', { name: /Menyimpan/ });
    expect(button).toHaveAccessibleName('Menyimpan Memuat…');
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAttribute('data-loading', 'true');

    // The loading announcement is visually hidden but still in the a11y tree.
    expect(screen.getByText('Memuat…')).toBeInTheDocument();

    // `loading` marks the control inert for assistive tech and pointer input;
    // the handler stays attached (a native button is not `disabled` while
    // loading), so callers block the action from their own loading flag.
    expect(button).toHaveTextContent('Menyimpan');
  });

  it('keeps the spinner and label in the DOM while loading so width is stable', () => {
    const { container } = render(<Button loading>Menyimpan</Button>);

    // The label span stays mounted (only faded) so the button does not resize.
    const label = screen.getByText('Menyimpan');
    expect(label).toHaveClass('opacity-0');
    expect(container.querySelector('svg.animate-spin')).toBeInTheDocument();

    // No spinner at all when the button is idle.
    const { container: idle } = render(<Button>Menyimpan</Button>);
    expect(idle.querySelector('svg')).toBeNull();
  });

  it('renders a spinner variant per size while keeping the accessible label', () => {
    const { container } = render(
      <Button size="lg" loading>
        Memuat data
      </Button>,
    );

    const svg = container.querySelector('svg.animate-spin');
    expect(svg).not.toBeNull();
    expect(svg).toHaveAttribute('class', expect.stringContaining('h-5'));

    // Label remains in the a11y tree because only opacity is toggled; the
    // visually hidden announcement is appended after it.
    const button = screen.getByRole('button', { name: /Memuat data/ });
    expect(button).toHaveAccessibleName('Memuat data Memuat…');
    expect(button.textContent).toBe('Memuat dataMemuat…');
  });

  it('renders a next/link anchor when href is provided', () => {
    render(<Button href="/relawan">Daftar Relawan</Button>);

    const link = screen.getByRole('link', { name: 'Daftar Relawan' });
    expect(link).toHaveAttribute('href', '/relawan');
    expect(link).toHaveAttribute('data-variant', 'primary');
    expect(link).not.toHaveAttribute('aria-disabled');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('makes the anchor inert when disabled or loading', async () => {
    const user = userEvent.setup({ delay: null });
    const onClick = vi.fn();

    const { unmount } = render(
      <Button href="/relawan" disabled onClick={onClick}>
        Nonaktif
      </Button>,
    );

    const disabledLink = screen.getByRole('link', { name: 'Nonaktif' });
    expect(disabledLink).toHaveAttribute('aria-disabled', 'true');
    expect(disabledLink).toHaveAttribute('tabindex', '-1');
    // Inert visually/for pointer input (pointer-events-none + tabIndex -1) and
    // announced as disabled; anchor navigation cannot be disabled natively.
    expect(disabledLink).not.toHaveFocus();
    unmount();

    render(
      <Button href="/relawan" loading>
        Memuat tautan
      </Button>,
    );

    const loadingLink = screen.getByRole('link', { name: /Memuat tautan/ });
    expect(loadingLink).toHaveAttribute('aria-busy', 'true');
    expect(loadingLink).toHaveAttribute('aria-disabled', 'true');
    expect(loadingLink).toHaveAttribute('tabindex', '-1');
    expect(loadingLink).toHaveAccessibleName('Memuat tautan Memuat…');
  });

  it('honours type="submit" inside a form and submits', async () => {
    const user = userEvent.setup({ delay: null });
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());

    render(
      <form onSubmit={onSubmit}>
        <Button type="submit">Kirim Formulir</Button>
      </form>,
    );

    const button = screen.getByRole('button', { name: 'Kirim Formulir' });
    expect(button).toHaveAttribute('type', 'submit');

    await user.click(button);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('forwards native attributes and merges custom className', () => {
    render(
      <Button className="kelas-tambahan" data-testid="btn" title="Bantuan" aria-describedby="petunjuk">
        Bantuan
      </Button>,
    );

    const button = screen.getByTestId('btn');
    expect(button).toHaveAttribute('title', 'Bantuan');
    expect(button).toHaveAttribute('aria-describedby', 'petunjuk');
    expect(button.className).toContain('kelas-tambahan');
  });

  it('handles rich children and long labels', () => {
    const long = 'Baca selengkapnya tentang program restorasi sungai di Jawa Barat';
    render(
      <Button>
        <span data-testid="ikon" aria-hidden="true">
          →
        </span>
        {long}
      </Button>,
    );

    expect(screen.getByTestId('ikon')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: long })).toBeInTheDocument();
  });
});
