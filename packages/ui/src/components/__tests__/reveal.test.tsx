import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Reveal, RevealGroup } from '../reveal';

/* -------------------------------------------------------------------------- */
/*  Perkakas uji                                                               */
/* -------------------------------------------------------------------------- */

/** Callback pengamat yang sedang aktif, agar tes dapat memicu perpotongan. */
type ObserverCallback = (entries: Partial<IntersectionObserverEntry>[]) => void;

interface FakeObserver {
  callback: ObserverCallback;
  observed: Element[];
  unobserved: Element[];
  disconnected: boolean;
}

let observers: FakeObserver[] = [];

/**
 * Mengganti IntersectionObserver dengan tiruan yang merekam apa yang diamati
 * dan membiarkan tes menentukan kapan elemen dianggap masuk viewport. jsdom
 * tidak melakukan tata letak, jadi pengamat aslinya tidak akan pernah memicu.
 */
function installObserver() {
  observers = [];

  class MockIntersectionObserver {
    constructor(callback: ObserverCallback) {
      this.entry = { callback, observed: [], unobserved: [], disconnected: false };
      observers.push(this.entry);
    }

    private entry: FakeObserver;

    observe(el: Element) {
      this.entry.observed.push(el);
    }

    unobserve(el: Element) {
      this.entry.unobserved.push(el);
    }

    disconnect() {
      this.entry.disconnected = true;
    }

    takeRecords() {
      return [];
    }

    readonly root = null;
    readonly rootMargin = '';
    readonly thresholds: number[] = [];
  }

  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
}

/**
 * Memaksa elemen tampak berada di bawah lipatan, sehingga Reveal memilih untuk
 * menyembunyikannya dan memasang pengamat. Tanpa ini jsdom melaporkan seluruh
 * kotak bernilai nol, yang dibaca sebagai "sudah terlihat".
 */
function placeBelowFold() {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    top: 2000,
    bottom: 2400,
    left: 0,
    right: 300,
    width: 300,
    height: 400,
    x: 0,
    y: 2000,
    toJSON: () => ({}),
  } as DOMRect);
}

/** Menempatkan elemen di dalam layar saat mount. */
function placeInView() {
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue({
    top: 100,
    bottom: 400,
    left: 0,
    right: 300,
    width: 300,
    height: 300,
    x: 0,
    y: 100,
    toJSON: () => ({}),
  } as DOMRect);
}

function triggerIntersect(isIntersecting: boolean, index = 0) {
  const observer = observers[index];
  if (!observer) throw new Error('tidak ada pengamat yang terpasang');
  for (const target of observer.observed) {
    observer.callback([{ isIntersecting, target } as IntersectionObserverEntry]);
  }
}

beforeEach(() => {
  window.innerHeight = 800;
  installObserver();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

/* -------------------------------------------------------------------------- */

describe('Reveal', () => {
  it('menampilkan isi apa adanya ketika IntersectionObserver tidak tersedia', () => {
    vi.stubGlobal('IntersectionObserver', undefined);

    render(<Reveal>Isi</Reveal>);

    const node = screen.getByText('Isi');
    expect(node).toHaveAttribute('data-revealed', 'true');
    expect(node.style.opacity).toBe('1');
  });

  it('tidak menyembunyikan elemen yang sudah terlihat saat mount', () => {
    placeInView();

    render(<Reveal>Terlihat</Reveal>);

    expect(screen.getByText('Terlihat')).toHaveAttribute('data-revealed', 'true');
    // Elemen yang sudah terlihat tidak perlu diamati.
    expect(observers[0]?.observed ?? []).toHaveLength(0);
  });

  it('menyembunyikan elemen di bawah lipatan lalu menampilkannya saat masuk viewport', async () => {
    placeBelowFold();

    render(<Reveal>Nanti</Reveal>);

    const node = screen.getByText('Nanti');
    expect(node).toHaveAttribute('data-revealed', 'false');
    expect(node.style.opacity).toBe('0');

    triggerIntersect(true);

    await waitFor(() => expect(node).toHaveAttribute('data-revealed', 'true'));
    expect(node.style.opacity).toBe('1');
    expect(node.style.transform).toBe('none');
  });

  it('berhenti mengamati setelah tampil ketika once bernilai true', async () => {
    placeBelowFold();

    render(<Reveal>Sekali</Reveal>);
    triggerIntersect(true);

    await waitFor(() => expect(observers[0].unobserved).toHaveLength(1));
  });

  it('menyembunyikan kembali saat keluar viewport ketika once bernilai false', async () => {
    placeBelowFold();

    render(<Reveal once={false}>Berulang</Reveal>);
    const node = screen.getByText('Berulang');

    triggerIntersect(true);
    await waitFor(() => expect(node).toHaveAttribute('data-revealed', 'true'));

    triggerIntersect(false);
    await waitFor(() => expect(node).toHaveAttribute('data-revealed', 'false'));
    expect(observers[0].unobserved).toHaveLength(0);
  });

  it('menghormati preferensi pengurangan gerak', () => {
    placeBelowFold();
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query: string) =>
        ({
          matches: query.includes('prefers-reduced-motion'),
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          addListener: vi.fn(),
          removeListener: vi.fn(),
          onchange: null,
          dispatchEvent: vi.fn(),
        }) as unknown as MediaQueryList,
    );

    render(<Reveal>Tanpa gerak</Reveal>);

    expect(screen.getByText('Tanpa gerak')).toHaveAttribute('data-revealed', 'true');
    expect(observers[0]?.observed ?? []).toHaveLength(0);
  });

  it.each([
    ['up', 'translate3d(0, 16px, 0)'],
    ['down', 'translate3d(0, -16px, 0)'],
    ['left', 'translate3d(20px, 0, 0)'],
    ['right', 'translate3d(-20px, 0, 0)'],
    ['none', 'none'],
  ] as const)('menggeser sesuai arah %s', (direction, expected) => {
    placeBelowFold();

    render(<Reveal direction={direction}>Arah</Reveal>);

    expect(screen.getByText('Arah').style.transform).toBe(expected);
  });

  it('menyisipkan jeda ke dalam transisi', () => {
    placeBelowFold();

    render(<Reveal delay={250}>Tertunda</Reveal>);

    expect(screen.getByText('Tertunda').style.transition).toContain('250ms');
  });

  it('merender elemen sesuai prop as', () => {
    placeInView();

    render(<Reveal as="section">Bagian</Reveal>);

    expect(screen.getByText('Bagian').tagName).toBe('SECTION');
  });

  it('memutus pengamat saat dilepas', () => {
    placeBelowFold();

    const { unmount } = render(<Reveal>Lepas</Reveal>);
    unmount();

    expect(observers[0].disconnected).toBe(true);
  });

  it('meneruskan className dan atribut lain', () => {
    placeInView();

    render(
      <Reveal className="kelas-khusus" data-testid="target" aria-label="Label">
        Isi
      </Reveal>,
    );

    const node = screen.getByTestId('target');
    expect(node).toHaveClass('kelas-khusus');
    expect(node).toHaveAttribute('aria-label', 'Label');
  });
});

/* -------------------------------------------------------------------------- */

describe('RevealGroup', () => {
  it('membungkus setiap anak dan memberi jeda bertingkat', () => {
    placeBelowFold();

    render(
      <RevealGroup stagger={100}>
        <span>Satu</span>
        <span>Dua</span>
        <span>Tiga</span>
      </RevealGroup>,
    );

    const delays = ['Satu', 'Dua', 'Tiga'].map(
      (label) => screen.getByText(label).parentElement!.style.transition,
    );

    expect(delays[0]).toContain('0ms');
    expect(delays[1]).toContain('100ms');
    expect(delays[2]).toContain('200ms');
  });

  it('membatasi jeda agar anak terakhir tidak menunggu terlalu lama', () => {
    placeBelowFold();

    render(
      <RevealGroup stagger={50} maxStagger={2}>
        {Array.from({ length: 5 }, (_, i) => (
          <span key={i}>Anak {i}</span>
        ))}
      </RevealGroup>,
    );

    // Indeks 2 ke atas sama-sama berhenti di 100ms.
    const third = screen.getByText('Anak 2').parentElement!.style.transition;
    const fifth = screen.getByText('Anak 4').parentElement!.style.transition;
    expect(third).toContain('100ms');
    expect(fifth).toContain('100ms');
  });

  it('memakai li sebagai pembungkus anak ketika dirender sebagai ul', () => {
    placeInView();

    render(
      <RevealGroup as="ul">
        <span>Butir</span>
      </RevealGroup>,
    );

    expect(screen.getByText('Butir').parentElement!.tagName).toBe('LI');
  });

  it('menambahkan jeda awal sebelum anak pertama', () => {
    placeBelowFold();

    render(
      <RevealGroup delay={300} stagger={40}>
        <span>Awal</span>
      </RevealGroup>,
    );

    expect(screen.getByText('Awal').parentElement!.style.transition).toContain('300ms');
  });

  it('mengabaikan anak yang bukan elemen', () => {
    placeInView();

    render(
      <RevealGroup data-testid="grup">
        <span>Nyata</span>
        {null}
        {false}
      </RevealGroup>,
    );

    expect(screen.getByTestId('grup').children).toHaveLength(1);
  });
});
