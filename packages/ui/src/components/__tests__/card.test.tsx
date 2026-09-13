import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { Card, CardBody, CardFooter, CardHeader, CardTitle } from '../card';
import { installUserEventCompat } from './test-utils';

beforeAll(() => installUserEventCompat());

describe('Card', () => {
  it('renders a div shell by default with the card slot marker', () => {
    const { container } = render(<Card data-testid="kartu">Isi</Card>);

    const card = screen.getByTestId('kartu');
    expect(card.tagName).toBe('DIV');
    expect(card).toHaveAttribute('data-slot', 'card');
    expect(container.querySelector('[data-slot="card"]')).toBe(card);
  });

  it('renders as an anchor when href is set, forwarding target and rel', () => {
    render(
      <Card href="/sungai/ciliwung" target="_blank" rel="noreferrer">
        Ciliwung
      </Card>,
    );

    const link = screen.getByRole('link', { name: 'Ciliwung' });
    expect(link).toHaveAttribute('href', '/sungai/ciliwung');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noreferrer');
    expect(link).toHaveAttribute('data-slot', 'card');
  });

  it('falls back to a div when href is an empty string', () => {
    render(<Card href="">Tanpa Tautan</Card>);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('Tanpa Tautan').tagName).toBe('DIV');
  });

  it('is reachable by keyboard when interactive and linked', async () => {
    const user = userEvent.setup({ delay: null });
    const onClick = vi.fn();

    render(
      <Card interactive href="/kampanye" onClick={onClick}>
        Kampanye Sungai Bersih
      </Card>,
    );

    await user.tab();
    const link = screen.getByRole('link', { name: 'Kampanye Sungai Bersih' });
    expect(link).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('accepts interactive styling without a link and stays non-navigating', () => {
    const { container } = render(
      <Card interactive data-testid="kartu-interaktif">
        Kartu
      </Card>,
    );

    const card = screen.getByTestId('kartu-interaktif');
    expect(card.tagName).toBe('DIV');
    // Interactive styling must not silently introduce a link role.
    expect(container.querySelector('a')).toBeNull();
  });

  it('merges className and passes through arbitrary attributes', () => {
    render(
      <Card className="kelas-kartu" data-testid="kartu" aria-label="Kartu artikel">
        Artikel
      </Card>,
    );

    const card = screen.getByTestId('kartu');
    expect(card.className).toContain('kelas-kartu');
    expect(card).toHaveAttribute('aria-label', 'Kartu artikel');
  });
});

describe('CardHeader', () => {
  it('renders its children in the header slot', () => {
    render(
      <CardHeader>
        <CardTitle>Sungai Ciliwung</CardTitle>
      </CardHeader>,
    );

    const header = screen.getByText('Sungai Ciliwung').closest('[data-slot="card-header"]');
    expect(header).not.toBeNull();
    expect(header).toHaveTextContent('Sungai Ciliwung');
  });

  it('renders the action slot only when provided', () => {
    const { unmount } = render(<CardHeader>Judul</CardHeader>);
    expect(document.querySelectorAll('[data-slot="card-header"] > div')).toHaveLength(1);
    expect(screen.getByText('Judul')).toBeInTheDocument();
    unmount();

    render(<CardHeader action={<button type="button">Perbarui</button>}>Judul</CardHeader>);

    const header = document.querySelector('[data-slot="card-header"]')!;
    const rowChildren = header.firstElementChild!.children;
    expect(rowChildren).toHaveLength(2);
    expect(rowChildren[1]).toContainElement(screen.getByRole('button', { name: 'Perbarui' }));
  });

  it('toggles the divider border class from the divider prop', () => {
    const { unmount } = render(<CardHeader>Tanpa Pemisah</CardHeader>);
    expect(screen.getByText('Tanpa Pemisah').closest('[data-slot="card-header"]')!.className).not.toContain(
      'border-b',
    );
    unmount();

    render(<CardHeader divider>Dengan Pemisah</CardHeader>);
    expect(screen.getByText('Dengan Pemisah').closest('[data-slot="card-header"]')!.className).toContain(
      'border-b',
    );
  });

  it('honours a custom className and forwards attributes', () => {
    render(
      <CardHeader className="header-khusus" data-testid="header" id="header-ciliwung">
        Judul
      </CardHeader>,
    );

    const header = screen.getByTestId('header');
    expect(header).toHaveAttribute('id', 'header-ciliwung');
    expect(header.className).toContain('header-khusus');
  });
});

describe('CardTitle', () => {
  it('defaults to an h3 heading', () => {
    render(<CardTitle>Indeks Kualitas Air</CardTitle>);

    const heading = screen.getByRole('heading', { name: 'Indeks Kualitas Air', level: 3 });
    expect(heading).toHaveAttribute('data-slot', 'card-title');
  });

  it.each(['h2', 'h3', 'h4'] as const)('renders level %s when requested', (level) => {
    const { unmount } = render(<CardTitle as={level}>{`Judul ${level}`}</CardTitle>);

    const heading = screen.getByRole('heading', { name: `Judul ${level}` });
    expect(heading.tagName).toBe(level.toUpperCase());
    expect(heading).toHaveAttribute('data-slot', 'card-title');

    unmount();
  });

  it('forwards className and inline content', () => {
    render(
      <CardTitle as="h2" className="judul-khusus" data-testid="judul">
        Sungai <em>Tercemar</em>
      </CardTitle>,
    );

    const heading = screen.getByTestId('judul');
    expect(heading.className).toContain('judul-khusus');
    expect(heading).toHaveTextContent('Sungai Tercemar');
    expect(screen.getByText('Tercemar')).toBeInTheDocument();
  });
});

describe('CardBody', () => {
  it('renders body content in the body slot', () => {
    render(
      <CardBody>
        <p>Data pemantauan terakhir</p>
      </CardBody>,
    );

    const body = screen.getByText('Data pemantauan terakhir').closest('[data-slot="card-body"]');
    expect(body).not.toBeNull();
    expect(body).toHaveTextContent('Data pemantauan terakhir');
  });

  it('renders an empty body without crashing', () => {
    const { container } = render(<CardBody />);
    expect(container.querySelector('[data-slot="card-body"]')).toBeInTheDocument();
  });

  it('merges className and forwards attributes', () => {
    render(
      <CardBody className="body-khusus" data-testid="body" aria-live="polite" />,
    );

    const body = screen.getByTestId('body');
    expect(body).toHaveAttribute('aria-live', 'polite');
    expect(body.className).toContain('body-khusus');
  });
});

describe('CardFooter', () => {
  it('renders footer content in the footer slot', () => {
    render(
      <CardFooter>Diperbarui 2 jam lalu</CardFooter>,
    );

    const footer = screen.getByText('Diperbarui 2 jam lalu').closest('[data-slot="card-footer"]');
    expect(footer).not.toBeNull();
  });

  it('toggles the divider border class from the divider prop', () => {
    const { unmount } = render(<CardFooter>Tanpa Pemisah</CardFooter>);
    expect(screen.getByText('Tanpa Pemisah').closest('[data-slot="card-footer"]')!.className).not.toContain(
      'border-t',
    );
    unmount();

    render(<CardFooter divider>Dengan Pemisah</CardFooter>);
    expect(screen.getByText('Dengan Pemisah').closest('[data-slot="card-footer"]')!.className).toContain(
      'border-t',
    );
  });

  it('keeps actionable children reachable inside the footer', async () => {
    const user = userEvent.setup({ delay: null });
    const onClick = vi.fn();

    render(
      <CardFooter divider>
        <a href="/artikel/banjir">Baca selengkapnya</a>
        <button type="button" onClick={onClick}>
          Bagikan
        </button>
      </CardFooter>,
    );

    const footer = document.querySelector('[data-slot="card-footer"]')!;
    expect(footer).toHaveAttribute('data-slot', 'card-footer');
    expect(screen.getByRole('link', { name: 'Baca selengkapnya' })).toHaveAttribute(
      'href',
      '/artikel/banjir',
    );

    await user.click(screen.getByRole('button', { name: 'Bagikan' }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('merges className and forwards attributes', () => {
    render(
      <CardFooter className="footer-khusus" data-testid="footer" id="footer-1">
        Meta
      </CardFooter>,
    );

    const footer = screen.getByTestId('footer');
    expect(footer).toHaveAttribute('id', 'footer-1');
    expect(footer.className).toContain('footer-khusus');
  });
});

describe('Card composition', () => {
  it('composes header, body and footer into one navigable card', async () => {
    const user = userEvent.setup({ delay: null });
    const onClick = vi.fn();

    const { container } = render(
      <Card interactive href="/sungai/ciliwung" onClick={onClick}>
        <img src="/ciliwung.jpg" alt="" className="aspect-[16/9] w-full object-cover" />
        <CardHeader action={<span>Waspada</span>} divider>
          <CardTitle as="h2">Sungai Ciliwung</CardTitle>
        </CardHeader>
        <CardBody>Indeks kualitas air menurun pada segmen Jakarta Selatan.</CardBody>
        <CardFooter divider>
          <a href="/artikel/ciliwung">Baca selengkapnya</a>
        </CardFooter>
      </Card>,
    );

    // One card link wrapping the whole composition — no nested anchors.
    expect(container.querySelectorAll('a')).toHaveLength(2);
    expect(container.querySelector('[data-slot="card"]')!.tagName).toBe('A');
    expect(screen.getByRole('heading', { level: 2, name: 'Sungai Ciliwung' })).toBeInTheDocument();
    expect(screen.getByText('Waspada')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="card-body"]')).toHaveTextContent('Indeks kualitas air');

    await user.click(screen.getByRole('link', { name: /Sungai Ciliwung/ }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('throws nothing for a body/footer-only card without a header', () => {
    const { container } = render(
      <Card>
        <CardBody>Hanya isi</CardBody>
        <CardFooter>Kaki</CardFooter>
      </Card>,
    );

    expect(container.querySelector('[data-slot="card-header"]')).toBeNull();
    expect(container.querySelector('[data-slot="card-body"]')).toHaveTextContent('Hanya isi');
    expect(container.querySelector('[data-slot="card-footer"]')).toHaveTextContent('Kaki');
  });
});
