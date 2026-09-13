import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// stat-counter hanya mengekspor named `StatCounter` (tanpa default export).
import { StatCounter, type StatCounterProps } from '../stat-counter';

/**
 * Setup global sudah menstub `IntersectionObserver` supaya elemen langsung
 * dianggap terlihat dan `matchMedia` supaya `matches: false`. Test di sini
 * mengganti keduanya agar jalur animasi dan jalur reduced-motion terpisah.
 */
type MediaQueryListener = (event: MediaQueryListEvent) => void;

function stubMatchMedia(matches: boolean) {
  const listeners = new Set<MediaQueryListener>();
  const mql = {
    matches,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addEventListener: vi.fn((_type: string, listener: MediaQueryListener) => {
      listeners.add(listener);
    }),
    removeEventListener: vi.fn((_type: string, listener: MediaQueryListener) => {
      listeners.delete(listener);
    }),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  };
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: () => mql,
  });
  return mql;
}

/** Permukaan observer yang dikendalikan test: `trigger` memicu entri. */
interface ControlledIntersectionObserver extends IntersectionObserver {
  trigger(isIntersecting?: boolean): void;
}

/** IntersectionObserver yang hanya memanggil callback bila test memintanya. */
function stubIntersectionObserver(options: { autoIntersect: boolean }) {
  const instances: ControlledIntersectionObserver[] = [];
  const observed: Element[] = [];

  class ControlledObserver implements IntersectionObserver {
    readonly root: Element | null = null;
    readonly rootMargin = '0px 0px -10% 0px';
    readonly thresholds: ReadonlyArray<number> = [0.4];
    disconnect = vi.fn();
    unobserve = vi.fn();
    takeRecords = vi.fn(() => [] as IntersectionObserverEntry[]);
    constructor(public callback: IntersectionObserverCallback) {
      instances.push(this);
    }
    observe(target: Element): void {
      observed.push(target);
      if (options.autoIntersect) {
        this.callback(
          [{ isIntersecting: true, target } as unknown as IntersectionObserverEntry],
          this,
        );
      }
    }
    /** Picu entri bagi test yang ingin mengendalikan waktu kemunculan. */
    trigger(isIntersecting = true): void {
      const target = observed[observed.length - 1] ?? document.createElement('div');
      this.callback(
        [{ isIntersecting, target } as unknown as IntersectionObserverEntry],
        this,
      );
    }
  }

  vi.stubGlobal('IntersectionObserver', ControlledObserver as unknown as typeof IntersectionObserver);
  return { instances, observed };
}

/**
 * ViTest fake timers tidak mengontrol `requestAnimationFrame` (jsdom memakainya
 * untuk polling), jadi test menjalankan frame sendiri secara sinkron: setiap
 * tik memajukan waktu mock dan memanggil semua callback rAF di dalam `act`.
 */
async function flushFrames(durationMs: number, steps = 40) {
  await act(async () => {
    for (let i = 0; i < steps; i += 1) {
      mockedNow += durationMs / steps;
      dispatchFrame(mockedNow);
    }
  });
}

/** Satu frame saja, tanpa memajukan waktu — untuk memeriksa keadaan awal. */
async function nextFrame() {
  await act(async () => {
    dispatchFrame(mockedNow);
  });
}

const ORIGINAL_MATCH_MEDIA = window.matchMedia;
const ORIGINAL_RAF = window.requestAnimationFrame;
const ORIGINAL_CAF = window.cancelAnimationFrame;

/** Jam mock: komponen memakai `performance.now()` sebagai waktu mulai. */
let mockedNow = 0;
let rafQueue = new Map<number, FrameRequestCallback>();
let nextRafId = 1;

function dispatchFrame(now: number): void {
  const queued = [...rafQueue.entries()];
  rafQueue = new Map();
  for (const [, callback] of queued) callback(now);
}

/** Ganti rAF dengan queue manual agar frame dapat dijalankan di dalam `act`. */
function installControllableRaf() {
  Object.defineProperty(window, 'requestAnimationFrame', {
    writable: true,
    configurable: true,
    value: (callback: FrameRequestCallback) => {
      nextRafId += 1;
      rafQueue.set(nextRafId, callback);
      return nextRafId;
    },
  });
  Object.defineProperty(window, 'cancelAnimationFrame', {
    writable: true,
    configurable: true,
    value: (id: number) => {
      rafQueue.delete(id);
    },
  });
}

beforeEach(() => {
  stubMatchMedia(false);
  mockedNow = 0;
  rafQueue = new Map();
  nextRafId = 1;
  installControllableRaf();
  vi.spyOn(performance, 'now').mockImplementation(() => mockedNow);
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: ORIGINAL_MATCH_MEDIA,
  });
  Object.defineProperty(window, 'requestAnimationFrame', {
    writable: true,
    configurable: true,
    value: ORIGINAL_RAF,
  });
  Object.defineProperty(window, 'cancelAnimationFrame', {
    writable: true,
    configurable: true,
    value: ORIGINAL_CAF,
  });
});

function renderStat(props: Partial<StatCounterProps> = {}) {
  return render(<StatCounter value={1250} label="Relawan Aktif" {...props} />);
}

/** Nilai aksesibel (selalu teks final) dan nilai visual yang beranimasi. */
function accessibleValue(): string {
  return screen.getByText(/^Rp|^[\d.]/, { selector: 'span.sr-only' }).textContent ?? '';
}

function visualValue(container: HTMLElement): string {
  const grid = container.querySelector('.inline-grid');
  const animated = grid?.querySelectorAll('span')[1];
  return animated?.textContent ?? '';
}

describe('StatCounter — nilai aksesibel & label', () => {
  it('mengekspos nilai akhir lewat sr-only terlepas dari animasi', async () => {
    renderStat();

    expect(screen.getByText('1.250', { selector: 'span.sr-only' })).toBeInTheDocument();
    await nextFrame();
    expect(screen.getByText('1.250', { selector: 'span.sr-only' })).toBeInTheDocument();
  });

  it('menggabungkan prefix & suffix pada nilai aksesibel', () => {
    renderStat({ value: 7.1, prefix: 'pH', suffix: '%' });

    expect(screen.getByText('pH7,1 %', { selector: 'span.sr-only' })).toBeInTheDocument();
  });

  it('merender label sebagai teks biasa di luar aria-hidden', () => {
    renderStat();

    const label = screen.getByText('Relawan Aktif');
    expect(label).not.toHaveClass('sr-only');
  });

  it('menyembunyikan angka beranimasi dari pembaca layar', () => {
    const { container } = renderStat();

    const numberRow = container.querySelector('p[aria-hidden="true"]');
    expect(numberRow).not.toBeNull();
  });

  it('merender prefix dan suffix sebagai teks visual', () => {
    const { container } = renderStat({ value: 8400, prefix: 'Rp', suffix: 'ha' });

    const hidden = container.querySelector('p[aria-hidden="true"]');
    expect(hidden).toHaveTextContent('Rp');
    expect(hidden).toHaveTextContent('ha');
  });

  it('meneruskan className tambahan ke pembungkus', () => {
    const { container } = renderStat({ className: 'col-span-2' });

    expect(container.firstElementChild).toHaveClass('col-span-2');
  });
});

describe('StatCounter — pemformatan angka', () => {
  it('memformat ribuan sesuai locale id-ID', () => {
    renderStat({ value: 1_500_000 });

    expect(screen.getByText('1.500.000', { selector: 'span.sr-only' })).toBeInTheDocument();
  });

  it('mempertahankan satu desimal bila nilainya desimal', () => {
    renderStat({ value: 42.5 });

    expect(screen.getByText('42,5', { selector: 'span.sr-only' })).toBeInTheDocument();
  });

  it('menampilkan bilangan bulat tanpa desimal palsu', () => {
    renderStat({ value: 42 });

    expect(screen.getByText('42', { selector: 'span.sr-only' })).toBeInTheDocument();
  });

  it('meneruskan NaN apa adanya lewat Intl tanpa melempar', () => {
    stubIntersectionObserver({ autoIntersect: false });
    const { container } = renderStat({ value: Number.NaN });

    // `Intl` mencetak "NaN"; yang penting komponen tidak melempar dan tetap
    // merender label, bukan menghasilkan markup rusak.
    expect(container.querySelector('span.sr-only')).toHaveTextContent('NaN');
    expect(screen.getByText('Relawan Aktif')).toBeInTheDocument();
  });

  it('menangani nilai nol', () => {
    renderStat({ value: 0 });

    expect(screen.getByText('0', { selector: 'span.sr-only' })).toBeInTheDocument();
  });

  it('menangani nilai negatif tanpa kehilangan tanda', () => {
    renderStat({ value: -25 });

    expect(screen.getByText('-25', { selector: 'span.sr-only' })).toBeInTheDocument();
  });

  it('label panjang tetap terbaca utuh', () => {
    const label = 'Relawan pemantau kualitas air sungai '.repeat(4).trim();
    renderStat({ label });

    expect(screen.getByText(label)).toBeInTheDocument();
  });
});

describe('StatCounter — animasi hitung naik', () => {
  it('memulai hitung-naik dari nol lalu mendarat di nilai akhir', async () => {
    stubIntersectionObserver({ autoIntersect: true });
    const { container } = renderStat({ value: 1000, duration: 300 });

    await nextFrame();
    expect(visualValue(container)).toBe('0');

    await flushFrames(300);
    expect(visualValue(container)).toBe('1.000');
    expect(screen.getByText('1.000', { selector: 'span.sr-only' })).toBeInTheDocument();
  });

  it('menghitung naik sampai selesai dengan nilai desimal', async () => {
    stubIntersectionObserver({ autoIntersect: true });
    const { container } = renderStat({ value: 4.5, duration: 200 });

    await nextFrame();
    await flushFrames(200);
    expect(visualValue(container)).toBe('4,5');
  });

  it('menahan lebar dengan baris hantu berisi nilai akhir', () => {
    stubIntersectionObserver({ autoIntersect: true });
    const { container } = renderStat({ value: 9_999_999 });

    const ghost = container.querySelector('.inline-grid span.invisible');
    expect(ghost).toHaveTextContent('9.999.999');
  });

  it('tidak beranimasi bila IntersectionObserver tidak tersedia', () => {
    vi.stubGlobal('IntersectionObserver', undefined);
    const { container } = renderStat({ value: 777 });

    expect(visualValue(container)).toBe('777');
  });

  it('tidak beranimasi bila requestAnimationFrame tidak tersedia', () => {
    stubIntersectionObserver({ autoIntersect: true });
    vi.stubGlobal('requestAnimationFrame', undefined);
    const { container } = renderStat({ value: 777 });

    expect(visualValue(container)).toBe('777');
  });

  it('melepas observer & membatalkan frame saat unmount', async () => {
    const { instances } = stubIntersectionObserver({ autoIntersect: true });
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');
    const { unmount } = renderStat({ value: 500, duration: 5000 });

    await nextFrame();
    unmount();

    expect(instances[0].disconnect).toHaveBeenCalled();
    expect(cancelSpy).toHaveBeenCalled();
    // Frame yang tertunda sudah dibersihkan, jadi latihan berikutnya aman.
    expect(rafQueue.size).toBe(0);
  });

  it('menahan angka di 0 selama elemen belum masuk viewport', async () => {
    const { instances } = stubIntersectionObserver({ autoIntersect: false });
    const { container } = renderStat({ value: 321, duration: 300 });

    // Observer dipasang, animasi belum mulai: angka visual ditahan di 0
    // sementara nilai aksesibel sudah final.
    expect(instances).toHaveLength(1);
    expect(visualValue(container)).toBe('0');
    await nextFrame();
    expect(visualValue(container)).toBe('0');
    expect(screen.getByText('321', { selector: 'span.sr-only' })).toBeInTheDocument();
  });

  it('mengabaikan entri yang tidak terlihat dan mulai saat benar-benar terlihat', async () => {
    const { instances } = stubIntersectionObserver({ autoIntersect: false });
    const { container } = renderStat({ value: 800, duration: 150 });

    instances[0].trigger(false);
    await nextFrame();
    expect(visualValue(container)).toBe('0');

    await act(async () => {
      instances[0].trigger(true);
    });
    await nextFrame();
    await flushFrames(150);
    expect(visualValue(container)).toBe('800');
  });

  it('menampilkan garis aksen yang menskalakan saat masuk viewport', async () => {
    const { instances } = stubIntersectionObserver({ autoIntersect: false });
    const { container } = renderStat({ value: 100, duration: 100 });

    const accent = container.querySelector('span[aria-hidden="true"]') as HTMLElement;
    expect(accent.className).toContain('scale-x-0');

    await act(async () => {
      instances[0].trigger(true);
    });
    await nextFrame();
    await flushFrames(100);
    expect(
      (container.querySelector('span[aria-hidden="true"]') as HTMLElement).className,
    ).toContain('scale-x-100');
  });
});

describe('StatCounter — prefers-reduced-motion', () => {
  it('langsung menampilkan nilai akhir tanpa animasi', () => {
    stubMatchMedia(true);
    stubIntersectionObserver({ autoIntersect: true });
    const { container } = renderStat({ value: 1250, duration: 5000 });

    expect(visualValue(container)).toBe('1.250');
  });

  it('menghormati duration <= 0 dengan nilai akhir langsung', () => {
    stubIntersectionObserver({ autoIntersect: true });
    const { container } = renderStat({ value: 4321, duration: 0 });

    expect(visualValue(container)).toBe('4.321');
  });

  it('mendaftarkan dan melepas listener preferensi gerak', () => {
    const mql = stubMatchMedia(true);
    stubIntersectionObserver({ autoIntersect: true });
    const { unmount } = renderStat({ value: 10 });

    expect(mql.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    const listener = mql.addEventListener.mock.calls[0][1];
    unmount();
    expect(mql.removeEventListener).toHaveBeenCalledWith('change', listener);
  });

  it('tetap aman bila matchMedia tidak tersedia', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: undefined,
    });
    stubIntersectionObserver({ autoIntersect: true });

    renderStat({ value: 88 });

    expect(screen.getByText('88', { selector: 'span.sr-only' })).toBeInTheDocument();
  });

  it('mengikuti perubahan preferensi gerak di tengah sesi', async () => {
    const mql = stubMatchMedia(false);
    stubIntersectionObserver({ autoIntersect: true });
    const { container } = renderStat({ value: 900, duration: 10_000 });

    await nextFrame();
    expect(visualValue(container)).not.toBe('900');

    await act(async () => {
      mql.matches = true;
      mql.addEventListener.mock.calls.forEach(([, listener]) =>
        listener({ matches: true } as unknown as MediaQueryListEvent),
      );
    });

    expect(visualValue(container)).toBe('900');
  });
});

describe('StatCounter — kontrak struktural', () => {
  it('menandai elemen dekoratif dengan aria-hidden', () => {
    stubIntersectionObserver({ autoIntersect: true });
    const { container } = renderStat();

    const decorative = container.querySelectorAll('[aria-hidden="true"]');
    expect(decorative.length).toBeGreaterThanOrEqual(2);
  });

  it('menyediakan tepat satu nilai sr-only', () => {
    stubIntersectionObserver({ autoIntersect: true });
    const { container } = renderStat();

    expect(container.querySelectorAll('span.sr-only')).toHaveLength(1);
  });

  it('nilai aksesibel tetap konstan meski nilai visual berubah', async () => {
    stubIntersectionObserver({ autoIntersect: true });
    const { container } = renderStat({ value: 2500, duration: 200 });

    await nextFrame();
    expect(accessibleValue()).toBe('2.500');
    expect(visualValue(container)).not.toBe('2.500');

    await flushFrames(200);
    expect(visualValue(container)).toBe('2.500');
    expect(accessibleValue()).toBe('2.500');
  });
});
