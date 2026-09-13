import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import ReadingProgress from './reading-progress';
import { ReadingProgress as NamedReadingProgress } from './reading-progress';

/**
 * Bilah kemajuan baca menulis lebar ke CSS variable `--reading-progress` dan
 * angka persen ke `aria-valuenow`. jsdom tidak punya tata letak, jadi tinggi
 * dokumen dan posisi gulir dipalsukan lewat defineProperty.
 */
function stubLayout({ scrollHeight, innerHeight, scrollY }: {
  scrollHeight: number;
  innerHeight: number;
  scrollY: number;
}): void {
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    configurable: true,
    get: () => scrollHeight,
  });
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    writable: true,
    value: innerHeight,
  });
  Object.defineProperty(window, 'scrollY', {
    configurable: true,
    writable: true,
    value: scrollY,
  });
}

/** Nilai CSS variable yang ditulis komponen, sebagai angka. */
function progressValue(bar: HTMLElement): number {
  return Number.parseFloat(bar.style.getPropertyValue('--reading-progress'));
}

describe('ReadingProgress', () => {
  beforeEach(() => {
    stubLayout({ scrollHeight: 100, innerHeight: 100, scrollY: 0 });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('mengekspor komponen sebagai named export dan default export', () => {
    expect(NamedReadingProgress).toBe(ReadingProgress);
  });

  it('merender progressbar dengan kontrak aksesibilitas lengkap', () => {
    render(<ReadingProgress />);

    const bar = screen.getByRole('progressbar', { name: 'Kemajuan membaca artikel' });

    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
    expect(bar).toHaveAttribute('aria-valuenow', '0');
    expect(bar).toHaveAttribute('aria-valuetext', 'Sejauh mana artikel ini sudah Anda baca');
    expect(bar).toHaveAttribute('aria-live', 'off');
    expect(bar).toHaveAttribute('data-slot', 'reading-progress');
  });

  it('tidak membocorkan angka progres ke pembaca layar karena aria-live="off"', () => {
    render(<ReadingProgress />);

    const bar = screen.getByRole('progressbar');
    expect(bar).not.toHaveAttribute('aria-live', 'polite');
    expect(bar).not.toHaveAttribute('aria-live', 'assertive');
  });

  it('merender elemen isi sebagai dekorasi (aria-hidden) dengan transform scaleX', () => {
    render(<ReadingProgress />);

    const bar = screen.getByRole('progressbar');
    const fill = bar.firstElementChild as HTMLElement;

    expect(fill).toHaveAttribute('aria-hidden', 'true');
    expect(fill.style.transform).toContain('scaleX(var(--reading-progress, 0))');
  });

  it('menghitung progres 0 saat dokumen tidak dapat digulir', () => {
    stubLayout({ scrollHeight: 1000, innerHeight: 1000, scrollY: 0 });

    render(<ReadingProgress />);

    const bar = screen.getByRole('progressbar');
    expect(progressValue(bar)).toBe(0);
    expect(bar).toHaveAttribute('aria-valuenow', '0');
  });

  it('menghitung progres dari scrollY dibagi tinggi yang dapat digulir', () => {
    stubLayout({ scrollHeight: 2000, innerHeight: 1000, scrollY: 250 });

    render(<ReadingProgress />);

    const bar = screen.getByRole('progressbar');
    expect(progressValue(bar)).toBeCloseTo(0.25, 5);
    expect(bar).toHaveAttribute('aria-valuenow', '25');
  });

  it('membatasi progres di 1 saat pengguna menggulir melewati dasar dokumen', () => {
    stubLayout({ scrollHeight: 2000, innerHeight: 1000, scrollY: 5000 });

    render(<ReadingProgress />);

    const bar = screen.getByRole('progressbar');
    expect(progressValue(bar)).toBe(1);
    expect(bar).toHaveAttribute('aria-valuenow', '100');
  });

  it('membatasi progres di 0 saat scrollY bernilai negatif (pantulan gulir)', () => {
    stubLayout({ scrollHeight: 2000, innerHeight: 1000, scrollY: -400 });

    render(<ReadingProgress />);

    const bar = screen.getByRole('progressbar');
    expect(progressValue(bar)).toBe(0);
    expect(bar).toHaveAttribute('aria-valuenow', '0');
  });

  it('memperbarui bilah saat peristiwa scroll terjadi', async () => {
    stubLayout({ scrollHeight: 3000, innerHeight: 1000, scrollY: 0 });

    render(<ReadingProgress />);
    const bar = screen.getByRole('progressbar');
    expect(progressValue(bar)).toBe(0);

    stubLayout({ scrollHeight: 3000, innerHeight: 1000, scrollY: 1000 });
    fireEvent.scroll(window);
    // Pembaruan dijadwalkan lewat requestAnimationFrame, jadi tunggu frame itu.
    await vi.waitFor(() => {
      expect(progressValue(bar)).toBeCloseTo(0.5, 5);
    });

    expect(bar).toHaveAttribute('aria-valuenow', '50');
  });

  it('mendaftarkan listener scroll secara passive dan resize tanpa passive', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');

    render(<ReadingProgress />);

    expect(addSpy).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });
    expect(addSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('memperbarui bilah saat ukuran jendela berubah', async () => {
    stubLayout({ scrollHeight: 1000, innerHeight: 1000, scrollY: 0 });

    render(<ReadingProgress />);
    const bar = screen.getByRole('progressbar');
    expect(progressValue(bar)).toBe(0);

    stubLayout({ scrollHeight: 900, innerHeight: 500, scrollY: 200 });
    fireEvent.resize(window);
    await vi.waitFor(() => {
      expect(progressValue(bar)).toBeCloseTo(0.5, 5);
    });
    expect(bar).toHaveAttribute('aria-valuenow', '50');
  });

  it('melepaskan listener scroll dan resize saat dibongkar', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    const { unmount } = render(<ReadingProgress />);
    unmount();

    expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('tidak memperbarui bilah setelah dibongkar walau gulir terjadi', async () => {
    stubLayout({ scrollHeight: 3000, innerHeight: 1000, scrollY: 0 });

    const { unmount } = render(<ReadingProgress />);
    const bar = screen.getByRole('progressbar');
    unmount();

    stubLayout({ scrollHeight: 3000, innerHeight: 1000, scrollY: 3000 });
    fireEvent.scroll(window);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(progressValue(bar)).toBe(0);
    expect(bar).toHaveAttribute('aria-valuenow', '0');
  });

  it('membatalkan frame tertunda saat dibongkar', () => {
    const cancelSpy = vi.spyOn(window, 'cancelAnimationFrame');

    const { unmount } = render(<ReadingProgress />);
    fireEvent.scroll(window);
    unmount();

    // Setiap frame yang dijadwalkan komponen dinomori >0 oleh jsdom.
    expect(cancelSpy).not.toHaveBeenCalledWith(0);
  });

  it('tidak memanggil requestAnimationFrame berkali-kali untuk gulir yang beruntun', () => {
    // Pembaruan pertama terjadi sinkron di dalam efek, sebelum listener aktif.
    let calls = 0;
    const realRaf = window.requestAnimationFrame;
    const rafSpy = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback: FrameRequestCallback) => {
        calls += 1;
        return realRaf(callback);
      });

    render(<ReadingProgress />);
    const duringMount = calls;

    fireEvent.scroll(window);
    fireEvent.scroll(window);
    fireEvent.scroll(window);

    // Hanya satu frame baru dijadwalkan untuk tiga gulir beruntun.
    expect(calls - duringMount).toBe(1);

    rafSpy.mockRestore();
  });
});
