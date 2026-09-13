import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Prose, { Prose as NamedProse, type ProseElement, type ProseSize, type ProseWidth } from '../prose';

describe('Prose', () => {
  it('renders a div wrapper with the prose slot by default', () => {
    const { container } = render(
      <Prose>
        <p>Narasi program</p>
      </Prose>,
    );

    const wrapper = container.querySelector('[data-slot="prose"]')!;
    expect(wrapper.tagName).toBe('DIV');
    expect(screen.getByText('Narasi program')).toBeInTheDocument();
  });

  it('exposes the same component as a default and named export', () => {
    expect(Prose).toBe(NamedProse);
    expect(typeof Prose).toBe('function');
  });

  it.each(['div', 'article', 'section'] as ProseElement[])(
    'renders as <%s> when requested',
    (as) => {
      const { container } = render(
        <Prose as={as}>
          <p>{`konten-${as}`}</p>
        </Prose>,
      );

      const wrapper = container.querySelector('[data-slot="prose"]')!;
      expect(wrapper.tagName).toBe(as.toUpperCase());
      expect(wrapper).toHaveTextContent(`konten-${as}`);
    },
  );

  it.each(['compact', 'default', 'lead'] as ProseSize[])('supports size=%s', (size) => {
    const { container } = render(
      <Prose size={size}>
        <p>{`ukuran-${size}`}</p>
      </Prose>,
    );

    expect(screen.getByText(`ukuran-${size}`)).toBeInTheDocument();
    expect(container.querySelector('[data-slot="prose"]')).toBeInTheDocument();
  });

  it.each(['narrow', 'editorial', 'wide', 'full'] as ProseWidth[])(
    'supports width=%s',
    (width) => {
      const { container } = render(
        <Prose width={width}>
          <p>{`lebar-${width}`}</p>
        </Prose>,
      );

      // Each width maps to a distinct measure class on the wrapper.
      const wrapper = container.querySelector('[data-slot="prose"]')!;
      expect(wrapper.className).toMatch(/max-w-(none|\[34rem\]|editorial|4xl)/);
    },
  );

  it('toggles the drop-cap utility classes with the dropCap prop', () => {
    const withCap = render(
      <Prose dropCap>
        <p>Paragraf pembuka.</p>
      </Prose>,
    );
    expect(withCap.container.querySelector('[data-slot="prose"]')!.className).toContain(
      '[&>p:first-of-type::first-letter]:float-left',
    );
    withCap.unmount();

    const withoutCap = render(
      <Prose>
        <p>Paragraf pembuka.</p>
      </Prose>,
    );
    expect(withoutCap.container.querySelector('[data-slot="prose"]')!.className).not.toContain(
      'first-letter',
    );
  });

  it('renders a full editorial flow with headings, lists, quote, media and code', () => {
    const { container } = render(
      <Prose as="article">
        <h1>Laporan Kualitas Air</h1>
        <p>
          Air sungai <strong>memburuk</strong> pada musim kemarau. Lihat{' '}
          <a href="/metodologi">metodologi</a> kami.
        </p>
        <h2>Metodologi</h2>
        <h3>Pengambilan sampel</h3>
        <ul>
          <li>Titik hulu</li>
          <li>Titik hilir</li>
        </ul>
        <ol>
          <li>Ambil sampel</li>
        </ol>
        <blockquote>
          <p>Sungai bukan saluran air, ia adalah ekosistem.</p>
          <footer>
            — <cite>Koordinator Lapangan</cite>
          </footer>
        </blockquote>
        <img src="/peta.png" alt="Peta titik pemantauan" />
        <figure>
          <img src="/debit.png" alt="Grafik debit air" />
          <figcaption>Debit air 2023</figcaption>
        </figure>
        <hr />
        <pre>
          <code>ika --sungai ciliwung</code>
        </pre>
        <table>
          <thead>
            <tr>
              <th>Segmen</th>
              <th>IKA</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Hulu</td>
              <td>82</td>
            </tr>
          </tbody>
        </table>
        <p>
          Data pada <code>2024-01-01</code> diperbarui.
        </p>
      </Prose>,
    );

    const wrapper = container.querySelector('[data-slot="prose"]')!;
    expect(wrapper.tagName).toBe('ARTICLE');
    expect(screen.getByRole('heading', { level: 1, name: 'Laporan Kualitas Air' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'metodologi' })).toHaveAttribute('href', '/metodologi');
    expect(screen.getByText('Titik hulu')).toBeInTheDocument();
    expect(container.querySelectorAll('li')).toHaveLength(3);
    expect(container.querySelector('blockquote')).toHaveTextContent('Sungai bukan saluran air');
    expect(screen.getByText('Koordinator Lapangan')).toBeInTheDocument();
    expect(screen.getByAltText('Peta titik pemantauan')).toBeInTheDocument();
    expect(screen.getByText('Debit air 2023')).toBeInTheDocument();
    expect(container.querySelector('hr')).toBeInTheDocument();
    expect(container.querySelector('pre code')).toHaveTextContent('ika --sungai ciliwung');
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(2);
    expect(screen.getByRole('columnheader', { name: 'Segmen' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Hulu' })).toBeInTheDocument();
    expect(container.querySelectorAll('code')).toHaveLength(2);
  });

  it('renders a single-paragraph flow (array with one element)', () => {
    const { container } = render(
      <Prose>
        <p>Satu paragraf saja.</p>
      </Prose>,
    );

    expect(container.querySelectorAll('[data-slot="prose"] p')).toHaveLength(1);
    expect(screen.getByText('Satu paragraf saja.')).toBeInTheDocument();
  });

  it('merges a custom className with the wrapper styles', () => {
    const { container } = render(
      <Prose className="kelas-prose">
        <p>Kustom</p>
      </Prose>,
    );

    expect(container.querySelector('[data-slot="prose"]')!.className).toContain('kelas-prose');
  });

  it('forwards arbitrary attributes to the wrapper element', () => {
    const { container } = render(
      <Prose as="section" id="konten" aria-label="Isi artikel" lang="id">
        <p>Isi</p>
      </Prose>,
    );

    const wrapper = container.querySelector('[data-slot="prose"]')!;
    expect(wrapper).toHaveAttribute('id', 'konten');
    expect(wrapper).toHaveAttribute('aria-label', 'Isi artikel');
    expect(wrapper).toHaveAttribute('lang', 'id');
  });

  it('handles very long unbroken content', () => {
    const long = 'Kata '.repeat(500).trim();
    const { container } = render(
      <Prose>
        <p>{long}</p>
      </Prose>,
    );

    expect(container.querySelector('[data-slot="prose"] p')!.textContent).toBe(long);
  });

  it('combines size, width, dropCap and element overrides in one render', () => {
    const { container } = render(
      <Prose as="article" size="lead" width="narrow" dropCap className="kelas-gabungan">
        <p>Kombinasi lengkap.</p>
      </Prose>,
    );

    const wrapper = container.querySelector('[data-slot="prose"]')!;
    expect(wrapper.tagName).toBe('ARTICLE');
    expect(wrapper.className).toContain('max-w-[34rem]');
    expect(wrapper.className).toContain('kelas-gabungan');
    expect(wrapper.className).toContain('[&>p:first-of-type::first-letter]:float-left');
  });
});
