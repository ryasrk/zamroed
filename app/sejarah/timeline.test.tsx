import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Timeline, { Timeline as NamedTimeline } from './timeline';
import type { Milestone } from '@repo/ui/types';

/**
 * Observer palsu yang tidak memicu apa pun sendiri, sehingga tes dapat
 * menentukan tonggak mana yang "terlihat". Setup global memicu observer
 * seketika, jadi kelas ini dipakai di tes yang butuh kendali penuh.
 */
function installManualObserver(): {
  fire: (entry: Partial<IntersectionObserverEntry>) => void;
  fireBatch: (entries: Array<Partial<IntersectionObserverEntry>>) => void;
  disconnect: ReturnType<typeof vi.fn>;
  observe: ReturnType<typeof vi.fn>;
} {
  const disconnect = vi.fn();
  const observe = vi.fn();
  let captured: IntersectionObserverCallback | null = null;

  class ManualObserver {
    readonly root: Element | null = null;
    readonly rootMargin = '';
    readonly thresholds: ReadonlyArray<number> = [];
    constructor(callback: IntersectionObserverCallback) {
      captured = callback;
    }
    observe = observe;
    unobserve(): void {}
    disconnect = disconnect;
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  }

  vi.stubGlobal('IntersectionObserver', ManualObserver);

  function fireBatch(entries: Array<Partial<IntersectionObserverEntry>>): void {
    expect(captured).not.toBeNull();
    act(() => {
      (captured as unknown as IntersectionObserverCallback)(
        entries.map(
          (entry) =>
            ({
              intersectionRatio: 0,
              isIntersecting: true,
              ...entry,
            }) as IntersectionObserverEntry,
        ),
        {} as IntersectionObserver,
      );
    });
  }

  return {
    fire: (entry) => fireBatch([entry]),
    fireBatch,
    disconnect,
    observe,
  };
}

/** Tonggak tiruan; `image` sengaja dibiarkan di luar daftar arsip resmi. */
function makeMilestone(id: string, overrides: Partial<Milestone> = {}): Milestone {
  return {
    id,
    year: `20${id.padStart(2, '0')}`,
    title: `Tonggak ${id}`,
    phase: 'Fase Uji',
    narrative: `Narasi perjalanan tonggak ${id}.`,
    ...overrides,
  };
}

/** Jalur foto yang benar-benar ada di daftar arsip komponen. */
const ARCHIVE_PHOTO = '/images/sejarah-archive.jpg';

/** Tinggi/geometri rel dipalsukan; jsdom tidak punya tata letak. */
function stubRailGeometry({
  top,
  height,
  innerHeight,
}: {
  top: number;
  height: number;
  innerHeight: number;
}): void {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    top,
    bottom: top + height,
    left: 0,
    right: 0,
    width: 0,
    height,
    x: 0,
    y: top,
    toJSON: () => ({}),
  } as DOMRect);

  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get: () => height,
  });

  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    writable: true,
    value: innerHeight,
  });
}

/** Elemen rel terisi (children pertama dari dua div aria-hidden di dalam rail). */
function progressRail(): HTMLElement {
  const rail = document.querySelector('[data-timeline-progress]');
  expect(rail).not.toBeNull();
  return rail as HTMLElement;
}

/** Nilai scaleY dari transform rel terisi. */
function scaleY(): number {
  const transform = progressRail().style.transform;
  const match = /scaleY\(([^)]+)\)/.exec(transform);
  expect(match).not.toBeNull();
  return Number.parseFloat(match![1]!);
}

describe('Timeline', () => {
  beforeEach(() => {
    stubRailGeometry({ top: 0, height: 1000, innerHeight: 1000 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('mengekspor komponen sebagai named export dan default export', () => {
    expect(NamedTimeline).toBe(Timeline);
  });

  it('merender satu tonggak per milestone di dalam daftar bernomor', () => {
    const milestones = [makeMilestone('1'), makeMilestone('2'), makeMilestone('3')];
    render(<Timeline milestones={milestones} />);

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent('Tonggak 1');
    expect(items[2]).toHaveTextContent('Tonggak 3');
    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  it('merender tahun, fase, dan narasi setiap tonggak', () => {
    render(
      <Timeline
        milestones={[
          makeMilestone('1', {
            year: '1998',
            title: 'Pertemuan Pertama',
            phase: 'Awal Mula',
            narrative: 'Berawal dari balai desa.',
          }),
        ]}
      />,
    );

    // Tahun muncul dua kali: varian mobile dan varian desktop.
    expect(screen.getAllByText('1998')).toHaveLength(2);
    expect(screen.getByRole('heading', { level: 3, name: 'Pertemuan Pertama' })).toBeInTheDocument();
    expect(screen.getByText('Awal Mula')).toBeInTheDocument();
    expect(screen.getByText('Berawal dari balai desa.')).toBeInTheDocument();
  });

  it('merender kutipan sebagai blockquote dengan tanda petik tipografis', () => {
    render(
      <Timeline
        milestones={[makeMilestone('1', { quote: 'Air tidak bisa dinegosiasikan.' })]}
      />,
    );

    const quote = document.querySelector('blockquote');
    expect(quote).not.toBeNull();
    expect(quote).toHaveTextContent('\u201cAir tidak bisa dinegosiasikan.\u201d');
  });

  it('tidak merender blockquote ketika tonggak tidak punya kutipan', () => {
    render(<Timeline milestones={[makeMilestone('1')]} />);

    expect(document.querySelector('blockquote')).toBeNull();
  });

  it('memakai foto arsip ketika jalurnya ada di daftar arsip resmi', () => {
    render(
      <Timeline
        milestones={[
          makeMilestone('1', { year: '1998', title: 'Awal', image: ARCHIVE_PHOTO }),
        ]}
      />,
    );

    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', ARCHIVE_PHOTO);
    expect(img).toHaveAttribute(
      'alt',
      'Arsip dokumentasi tonggak 1998: Awal',
    );
    expect(img).toHaveAttribute('loading', 'lazy');
    expect(img).toHaveAttribute('decoding', 'async');
  });

  it('mengabaikan jalur foto di luar daftar arsip dan tidak merender img', () => {
    render(
      <Timeline
        milestones={[makeMilestone('1', { image: '/images/hero-banner.jpg' })]}
      />,
    );

    // Foto yang tidak ada di arsip berarti tidak ada kotak rusak sama sekali.
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  it('merender seluruh tonggak yang diketahui memiliki arsip sebagai img', () => {
    const withArchive: Milestone[] = [
      makeMilestone('1', { image: '/images/hero-movement.jpg' }),
      makeMilestone('2', { image: '/images/rembuk-warga.jpg' }),
      makeMilestone('3', { image: '/images/citarum.jpg' }),
    ];
    render(<Timeline milestones={withArchive} />);

    expect(screen.getAllByRole('img')).toHaveLength(3);
  });

  it('menandai tonggak pertama sebagai langkah aktif secara default', () => {
    // Observer dimatikan agar aria-current awal murni berasal dari state awal.
    installManualObserver();
    render(<Timeline milestones={[makeMilestone('1'), makeMilestone('2')]} />);

    const articles = document.querySelectorAll('[data-milestone-id]');
    expect(articles[0]).toHaveAttribute('aria-current', 'step');
    expect(articles[1]).not.toHaveAttribute('aria-current');
  });

  it('memindahkan aria-current ke tonggak yang dilaporkan IntersectionObserver', () => {
    const observer = installManualObserver();

    render(<Timeline milestones={[makeMilestone('1'), makeMilestone('2')]} />);
    const articles = document.querySelectorAll('[data-milestone-id]');

    expect(articles[0]).toHaveAttribute('aria-current', 'step');

    observer.fire({ target: articles[1]!, isIntersecting: true, intersectionRatio: 0.6 });

    expect(articles[1]).toHaveAttribute('aria-current', 'step');
    expect(articles[0]).not.toHaveAttribute('aria-current');
  });

  it('mengamati setiap tonggak lewat IntersectionObserver', () => {
    const observer = installManualObserver();

    render(<Timeline milestones={[makeMilestone('1'), makeMilestone('2')]} />);

    expect(observer.observe).toHaveBeenCalledTimes(2);
  });

  it('mengabaikan entri yang tidak bersinggungan saat memilih tonggak aktif', () => {
    const observer = installManualObserver();

    render(<Timeline milestones={[makeMilestone('1'), makeMilestone('2')]} />);
    const articles = document.querySelectorAll('[data-milestone-id]');

    observer.fire({ target: articles[1]!, isIntersecting: false, intersectionRatio: 0.9 });

    // Tonggak pertama tetap aktif karena tidak ada entri yang bersinggungan.
    expect(articles[0]).toHaveAttribute('aria-current', 'step');
    expect(articles[1]).not.toHaveAttribute('aria-current');
  });

  it('tidak mengubah tonggak aktif saat semua entri tidak bersinggungan', () => {
    const observer = installManualObserver();

    render(<Timeline milestones={[makeMilestone('1'), makeMilestone('2')]} />);
    const articles = document.querySelectorAll('[data-milestone-id]');

    observer.fire({ target: articles[1]!, isIntersecting: false, intersectionRatio: 0.4 });
    observer.fire({ target: articles[0]!, isIntersecting: false, intersectionRatio: 0.3 });

    // Tidak ada "pemenang", jadi state dibiarkan seperti semula.
    expect(articles[0]).toHaveAttribute('aria-current', 'step');
    expect(articles[1]).not.toHaveAttribute('aria-current');
  });

  it('mengambil entri bersinggungan pertama sebagai kandidat awal', () => {
    const observer = installManualObserver();

    render(
      <Timeline
        milestones={[makeMilestone('1'), makeMilestone('2'), makeMilestone('3')]}
      />,
    );
    const articles = document.querySelectorAll('[data-milestone-id]');

    observer.fire({
      target: articles[1]!,
      isIntersecting: true,
      intersectionRatio: 0.3,
    });

    expect(articles[1]).toHaveAttribute('aria-current', 'step');
    expect(articles[0]).not.toHaveAttribute('aria-current');
  });

  it('mempertahankan kandidat pertama ketika entri berikutnya punya rasio lebih kecil', () => {
    const observer = installManualObserver();

    render(
      <Timeline
        milestones={[makeMilestone('1'), makeMilestone('2'), makeMilestone('3')]}
      />,
    );
    const articles = document.querySelectorAll('[data-milestone-id]');

    // Dua entri dalam satu batch: yang pertama bersinggungan dengan rasio lebih besar.
    observer.fireBatch([
      { target: articles[2]!, isIntersecting: true, intersectionRatio: 0.7 },
      { target: articles[1]!, isIntersecting: true, intersectionRatio: 0.2 },
    ]);

    expect(articles[2]).toHaveAttribute('aria-current', 'step');
    expect(articles[1]).not.toHaveAttribute('aria-current');
  });

  it('memilih entri dengan rasio persinggungan terbesar', () => {
    const observer = installManualObserver();

    render(
      <Timeline
        milestones={[makeMilestone('1'), makeMilestone('2'), makeMilestone('3')]}
      />,
    );
    const articles = document.querySelectorAll('[data-milestone-id]');

    observer.fireBatch([
      { target: articles[1]!, isIntersecting: true, intersectionRatio: 0.2 },
      { target: articles[2]!, isIntersecting: true, intersectionRatio: 0.8 },
    ]);

    expect(articles[2]).toHaveAttribute('aria-current', 'step');
    expect(articles[1]).not.toHaveAttribute('aria-current');
  });

  it('mengabaikan tonggak tanpa atribut id pada entri observer', () => {
    const observer = installManualObserver();

    render(<Timeline milestones={[makeMilestone('1'), makeMilestone('2')]} />);
    const articles = document.querySelectorAll('[data-milestone-id]');

    observer.fire({
      target: document.createElement('div'),
      isIntersecting: true,
      intersectionRatio: 0.7,
    });

    expect(articles[0]).toHaveAttribute('aria-current', 'step');
    expect(articles[1]).not.toHaveAttribute('aria-current');
  });

  it('menghitung progres gulir dan menuliskannya sebagai scaleY', async () => {
    // Garis baca = 0.66 * 1000 = 660; span = 1000 - 80 = 920 -> 660/920.
    stubRailGeometry({ top: 0, height: 1000, innerHeight: 1000 });

    render(<Timeline milestones={[makeMilestone('1')]} />);
    await vi.waitFor(() => {
      expect(scaleY()).toBeCloseTo(660 / 920, 5);
    });

    stubRailGeometry({ top: -340, height: 1000, innerHeight: 1000 });
    fireEvent.scroll(window);
    await vi.waitFor(() => {
      expect(scaleY()).toBeCloseTo(1, 5);
    });
  });

  it('menjaga progres tetap dalam rentang 0–1 saat rel belum terlihat', async () => {
    stubRailGeometry({ top: 5000, height: 1000, innerHeight: 1000 });

    render(<Timeline milestones={[makeMilestone('1')]} />);

    await vi.waitFor(() => {
      expect(scaleY()).toBe(0);
    });
  });

  it('memperlakukan geometri tak terhingga sebagai progres 0', async () => {
    stubRailGeometry({ top: Number.NaN, height: 1000, innerHeight: 1000 });

    render(<Timeline milestones={[makeMilestone('1')]} />);

    await vi.waitFor(() => {
      expect(scaleY()).toBe(0);
    });
    // Progres 0 menghasilkan opasitas minimum 0.15 dari rumus clamp01.
    expect(progressRail().style.opacity).toBe('0.15');
  });

  it('memakai tonggak terakhir sebagai penanda span saat satu tonggak', async () => {
    stubRailGeometry({ top: -3000, height: 1000, innerHeight: 1000 });

    render(<Timeline milestones={[makeMilestone('1')]} />);

    // Gulir jauh melewati rel: progres dibatasi di 1.
    await vi.waitFor(() => {
      expect(scaleY()).toBe(1);
    });
    expect(progressRail().style.opacity).toBe('1');
  });

  it('menghitung ulang progres saat jendela diubah ukurannya', async () => {
    stubRailGeometry({ top: 0, height: 1000, innerHeight: 1000 });

    render(<Timeline milestones={[makeMilestone('1')]} />);
    const sebelum = scaleY();
    expect(sebelum).toBeCloseTo(660 / 920, 5);

    // Layar lebih pendek -> garis baca turun -> progres lebih kecil.
    stubRailGeometry({ top: 0, height: 1000, innerHeight: 500 });
    fireEvent.resize(window);

    await vi.waitFor(() => {
      expect(scaleY()).toBeCloseTo(330 / 920, 5);
    });
  });

  it('mendaftarkan listener scroll passive dan resize', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');

    render(<Timeline milestones={[makeMilestone('1')]} />);

    expect(addSpy).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });
    expect(addSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('membatalkan frame yang masih tertunda saat dibongkar setelah gulir', () => {
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');

    const { unmount } = render(<Timeline milestones={[makeMilestone('1')]} />);
    fireEvent.scroll(window);
    unmount();

    // Frame hasil gulir dibatalkan agar tidak ada pengukuran setelah unmount.
    expect(cancelSpy).toHaveBeenCalled();
    expect(cancelSpy).not.toHaveBeenCalledWith(0);
  });

  it('tidak menjadwalkan frame kedua saat satu frame masih tertunda', () => {
    // rAF ditahan sehingga frame pertama belum selesai ketika gulir kedua tiba.
    const pending: FrameRequestCallback[] = [];
    const rafSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback: FrameRequestCallback) => {
        pending.push(callback);
        return pending.length;
      });

    render(<Timeline milestones={[makeMilestone('1')]} />);
    const setelahMount = pending.length;

    fireEvent.scroll(window);
    fireEvent.scroll(window);
    fireEvent.resize(window);

    // Gulir beruntun hanya menambah satu frame; sisanya diredam oleh `if (frame)`.
    expect(pending.length - setelahMount).toBe(1);

    rafSpy.mockRestore();
  });

  it('mengukur ulang saat document.fonts selesai memuat', async () => {
    const readyResolvers: Array<() => void> = [];
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      writable: true,
      value: {
        ready: new Promise<void>((resolve) => {
          readyResolvers.push(resolve);
        }),
      },
    });

    stubRailGeometry({ top: 0, height: 1000, innerHeight: 1000 });
    render(<Timeline milestones={[makeMilestone('1')]} />);
    expect(scaleY()).toBeCloseTo(660 / 920, 5);

    // Font selesai dimuat lalu ukuran rel berubah: progres harus diukur ulang.
    stubRailGeometry({ top: -300, height: 1000, innerHeight: 1000 });
    await act(async () => {
      readyResolvers.forEach((resolve) => resolve());
      await Promise.resolve();
    });

    await vi.waitFor(() => {
      expect(scaleY()).toBeCloseTo(1, 5);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (document as any).fonts;
  });

  it('tidak error saat font gagal dimuat', async () => {
    Object.defineProperty(document, 'fonts', {
      configurable: true,
      writable: true,
      value: { ready: Promise.reject(new Error('gagal memuat font')) },
    });

    render(<Timeline milestones={[makeMilestone('1')]} />);

    // Penolakan ditelan lewat .catch(() => undefined) agar render tidak pecah.
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(screen.getByRole('list')).toBeInTheDocument();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (document as any).fonts;
  });

  it('melepaskan listener scroll dan resize saat dibongkar', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = render(<Timeline milestones={[makeMilestone('1')]} />);
    unmount();

    expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('memisahkan listener observer saat dibongkar', () => {
    const observer = installManualObserver();

    const { unmount } = render(<Timeline milestones={[makeMilestone('1')]} />);
    unmount();

    expect(observer.disconnect).toHaveBeenCalled();
  });

  it('tidak membuat observer saat tidak ada tonggak', () => {
    const observer = installManualObserver();

    render(<Timeline milestones={[]} />);

    expect(observer.observe).not.toHaveBeenCalled();
    expect(observer.disconnect).not.toHaveBeenCalled();
    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
  });

  it('menghormati prefers-reduced-motion: rel langsung penuh tanpa scale progres', () => {
    // matchMedia palsu yang melaporkan reduce = true.
    const reduceQuery = {
      matches: true,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: vi.fn().mockReturnValue(reduceQuery),
    });

    stubRailGeometry({ top: 5000, height: 1000, innerHeight: 1000 });
    render(<Timeline milestones={[makeMilestone('1')]} />);

    // Walau rel belum terlihat, mode reduce memaksa rel penuh.
    expect(scaleY()).toBe(1);
    expect(progressRail().style.opacity).toBe('0.55');
  });

  it('menyimak perubahan preferensi gerak di tengah sesi', () => {
    const listeners: Array<(event: { matches: boolean }) => void> = [];
    const query = {
      matches: false,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((_: string, cb: (event: { matches: boolean }) => void) => {
        listeners.push(cb);
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
    const matchMediaMock = vi.fn().mockReturnValue(query);
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: matchMediaMock,
    });

    stubRailGeometry({ top: 0, height: 1000, innerHeight: 1000 });
    render(<Timeline milestones={[makeMilestone('1')]} />);

    expect(matchMediaMock).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    expect(query.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    expect(scaleY()).toBeCloseTo(660 / 920, 5);

    // Pengguna menyalakan reduce di tengah sesi.
    act(() => {
      listeners.forEach((cb) => cb({ matches: true }));
    });
    expect(scaleY()).toBe(1);
  });

  it('melepaskan listener preferensi gerak saat dibongkar', () => {
    const query = {
      matches: false,
      media: '(prefers-reduced-motion: reduce)',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    };
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: vi.fn().mockReturnValue(query),
    });

    const { unmount } = render(<Timeline milestones={[makeMilestone('1')]} />);
    unmount();

    expect(query.removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));
  });

  it('tetap benar saat matchMedia tidak tersedia', () => {
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      writable: true,
      value: undefined,
    });

    stubRailGeometry({ top: 0, height: 1000, innerHeight: 1000 });
    render(<Timeline milestones={[makeMilestone('1')]} />);

    // Tanpa matchMedia, mode gerak normal dipakai.
    expect(scaleY()).toBeCloseTo(660 / 920, 5);
  });

  it('tidak gagal saat IntersectionObserver tidak tersedia', () => {
    vi.stubGlobal('IntersectionObserver', undefined);

    render(<Timeline milestones={[makeMilestone('1'), makeMilestone('2')]} />);

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(document.querySelector('[data-milestone-id]')).toHaveAttribute(
      'aria-current',
      'step',
    );
  });

  it('menerapkan className tambahan pada pembungkus rel', () => {
    const { container } = render(
      <Timeline milestones={[makeMilestone('1')]} className="mx-auto max-w-5xl" />,
    );

    const rail = container.firstElementChild as HTMLElement;
    expect(rail.className).toContain('mx-auto');
    expect(rail.className).toContain('max-w-5xl');
  });

  it('menghias rel dasar dan rel progres sebagai elemen dekoratif (aria-hidden)', () => {
    const { container } = render(<Timeline milestones={[makeMilestone('1')]} />);

    const dekoratif = container.querySelectorAll('[aria-hidden="true"]');
    expect(dekoratif.length).toBeGreaterThanOrEqual(2);
    expect(progressRail()).toHaveAttribute('aria-hidden', 'true');
  });

  it('menyusun tonggak kiri/kanan bergantian lewat urutan grid (index ganjil)', () => {
    render(<Timeline milestones={[makeMilestone('1'), makeMilestone('2')]} />);
    const articles = screen.getAllByRole('listitem');

    // Tonggak kedua (index ganjil) memakai kolom tahun dengan md:order-2.
    const kolomTahunKedua = within(articles[1]!).getAllByText(/^20/)[0]!.closest('div');
    expect(kolomTahunKedua?.className).toContain('md:order-2');
  });

  it('memakai id tonggak sebagai data-milestone-id, bukan indeks', () => {
    render(
      <Timeline milestones={[makeMilestone('7'), makeMilestone('9')]} />,
    );

    const ids = Array.from(document.querySelectorAll('[data-milestone-id]')).map((node) =>
      node.getAttribute('data-milestone-id'),
    );
    expect(ids).toEqual(['7', '9']);
  });

  it('memperbarui tonggak aktif ketika daftar diganti', () => {
    installManualObserver();

    const { rerender } = render(
      <Timeline milestones={[makeMilestone('1'), makeMilestone('2')]} />,
    );

    let articles = document.querySelectorAll('[data-milestone-id]');
    expect(articles[0]).toHaveAttribute('aria-current', 'step');

    rerender(<Timeline milestones={[makeMilestone('3'), makeMilestone('4')]} />);
    articles = document.querySelectorAll('[data-milestone-id]');
    expect(articles).toHaveLength(2);
    expect(articles[0]).toHaveAttribute('data-milestone-id', '3');
    expect(articles[1]).toHaveAttribute('data-milestone-id', '4');
  });
});
