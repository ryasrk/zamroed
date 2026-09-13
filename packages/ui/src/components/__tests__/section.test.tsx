import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Section, type SectionAlign, type SectionTone } from '../section';

describe('Section', () => {
  it('renders a semantic section with its content', () => {
    const { container } = render(
      <Section>
        <p>Konten program</p>
      </Section>,
    );

    const section = container.querySelector('section');
    expect(section).toBeInTheDocument();
    expect(screen.getByText('Konten program')).toBeInTheDocument();
  });

  it('renders eyebrow, title and description in order', () => {
    render(
      <Section
        id="section-sungai"
        eyebrow="Program Kami"
        title="Restorasi Sungai"
        description="Memulihkan aliran."
      >
        <div>Grid</div>
      </Section>,
    );

    expect(screen.getByText('Program Kami')).toBeInTheDocument();

    const heading = screen.getByRole('heading', { level: 2, name: 'Restorasi Sungai' });
    expect(heading).toHaveAttribute('id', 'section-sungai-judul');

    const description = screen.getByText('Memulihkan aliran.');
    expect(
      heading.compareDocumentPosition(description) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it('renders an empty shell without header wrappers when no header props are given', () => {
    const { container } = render(
      <Section id="kosong">
        <p>Isi</p>
      </Section>,
    );

    const section = container.querySelector('section')!;
    expect(section).not.toHaveAttribute('aria-labelledby');
    expect(container.querySelector('#kosong-judul')).toBeNull();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });

  it('labelled-by points at the heading only when both id and title exist', () => {
    const { container, unmount } = render(<Section id="sungai" title="Sungai Ciliwung" />);

    const section = container.querySelector('section')!;
    expect(section).toHaveAttribute('aria-labelledby', 'sungai-judul');
    expect(screen.getByRole('heading', { level: 2 })).toHaveAttribute('id', 'sungai-judul');

    unmount();

    // Title without id => heading stays but no aria-labelledby reference.
    const noId = render(<Section title="Tanpa Id" />);
    expect(noId.container.querySelector('section')).not.toHaveAttribute('aria-labelledby');
    expect(screen.getByRole('heading', { name: 'Tanpa Id' })).toBeInTheDocument();
  });

  it('renders only the eyebrow when it is the only header prop', () => {
    const { container } = render(<Section eyebrow="Hanya Eyebrow" />);

    // Header eyebrow with its decorative rule line, and no heading at all.
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1);
    expect(screen.getByText('Hanya Eyebrow')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(container.querySelector('section > div')!.children).toHaveLength(1);
  });

  it('renders only the description when it is the only header prop', () => {
    const { container } = render(<Section description="Hanya deskripsi." />);

    expect(screen.getByText('Hanya deskripsi.')).toBeInTheDocument();
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(container.querySelectorAll('p')).toHaveLength(1);
  });

  it('renders children without a header wrapper when no header text exists', () => {
    const { container } = render(
      <Section>
        <p data-testid="anak">Anak</p>
      </Section>,
    );

    const childWrapper = screen.getByTestId('anak').parentElement!;
    expect(childWrapper).toBeInTheDocument();
    // No header block was rendered, so the only wrapper is the max-width container.
    expect(container.querySelectorAll('section > div')).toHaveLength(1);
  });

  it('skips the child wrapper entirely when there are no children', () => {
    const { container } = render(<Section title="Tanpa Anak" />);

    const inner = container.querySelector('section > div')!;
    expect(inner.children).toHaveLength(1);
    // Header dibungkus Reveal, yang menandai dirinya lewat data-revealed.
    expect(inner.firstElementChild).toHaveAttribute('data-revealed');
  });

  it.each(['left', 'center'] as SectionAlign[])('supports align=%s', (align) => {
    const { container } = render(<Section align={align} title={`Rata ${align}`} />);

    const header = container.querySelector('section h2')!.parentElement!;
    expect(header).toHaveTextContent(`Rata ${align}`);
    expect(screen.getByRole('heading', { level: 2, name: `Rata ${align}` })).toBeInTheDocument();
  });

  it.each(['light', 'dark'] as SectionTone[])('supports tone=%s', (tone) => {
    const { container } = render(<Section tone={tone} title={`Nada ${tone}`} />);

    const section = container.querySelector('section')!;
    expect(screen.getByRole('heading', { level: 2, name: `Nada ${tone}` })).toBeInTheDocument();
    // Dark tone adds a decorative glow behind the whole section.
    const sectionLevelDecorations = section.querySelectorAll(':scope > [aria-hidden="true"]');
    expect(sectionLevelDecorations).toHaveLength(tone === 'dark' ? 1 : 0);
  });

  it('adds no dark-mode decoration for the light tone', () => {
    const { container } = render(<Section tone="light" eyebrow="Eyebrow" title="Judul" />);

    // Only the eyebrow rule line is decorative on the light tone.
    expect(container.querySelectorAll('section > span[aria-hidden="true"]')).toHaveLength(0);
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1);
  });

  it('forwards id, className and arbitrary attributes', () => {
    const { container } = render(
      <Section id="dampak" className="kelas-section" data-testid="section" role="region">
        <div>Isi</div>
      </Section>,
    );

    const section = screen.getByTestId('section');
    expect(section).toHaveAttribute('id', 'dampak');
    expect(section).toHaveAttribute('role', 'region');
    expect(section.className).toContain('kelas-section');
    expect(container.querySelector('section')).toBe(section);
  });

  it('keeps very long title and description text intact', () => {
    const longTitle = 'Pemulihan Daerah Aliran Sungai '.repeat(20).trim();
    const longDescription = 'Penjelasan panjang '.repeat(200).trim();

    render(<Section title={longTitle} description={longDescription} />);

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(longTitle);
    expect(screen.getByText(longDescription)).toBeInTheDocument();
  });
});
