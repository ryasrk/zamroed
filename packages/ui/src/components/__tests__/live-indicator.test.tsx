import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import LiveIndicator, { type LiveIndicatorProps } from '../live-indicator';

/**
 * Setup global membuat `matchMedia` mengembalikan `matches: false`.
 * Test reduced-motion mendefinisikan ulang agar `matches: true`, dan
 * `afterEach` memulihkan stub bawaan agar test lain tidak tercemar.
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
  Object.defineProperty(window, 'matchMedia', { writable: true, configurable: true, value: () => mql });
  return {
    mql,
    emit(next: boolean) {
      mql.matches = next;
      listeners.forEach((listener) =>
        listener({ matches: next } as unknown as MediaQueryListEvent),
      );
    },
  };
}

const ORIGINAL_MATCH_MEDIA = window.matchMedia;

afterEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: ORIGINAL_MATCH_MEDIA,
  });
  vi.restoreAllMocks();
});

function renderIndicator(props: Partial<LiveIndicatorProps> = {}) {
  return render(<LiveIndicator {...props} />);
}

function pulseRing(container: HTMLElement): Element | null {
  return container.querySelector('.animate-pulse-ring');
}

describe('LiveIndicator — label & nada', () => {
  it('default live tanpa count menampilkan label tayang bawaan', () => {
    renderIndicator();

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('data-tone', 'live');
    expect(status).toHaveTextContent('Sedang tayang');
  });

  it('tone offline memakai label tidak tayang', () => {
    renderIndicator({ tone: 'offline' });

    expect(screen.getByRole('status')).toHaveAttribute('data-tone', 'offline');
    expect(screen.getByRole('status')).toHaveTextContent('Tidak tayang');
  });

  it('count menggantikan label bawaan dengan jumlah orang', () => {
    renderIndicator({ count: 37 });

    expect(screen.getByRole('status')).toHaveTextContent('37 orang sedang melihat');
  });

  it('memformat ribuan gaya Indonesia pada count', () => {
    renderIndicator({ count: 1250 });

    expect(screen.getByRole('status')).toHaveTextContent('1.250 orang sedang melihat');
  });

  it('label eksplisit menimpa teks bawaan maupun count', () => {
    renderIndicator({ count: 37, label: 'Siaran dari Ciliwung' });

    expect(screen.getByRole('status')).toHaveTextContent('Siaran dari Ciliwung');
    expect(screen.getByRole('status')).not.toHaveTextContent('37 orang sedang melihat');
  });

  it('label eksplisit dipakai meski tanpa count', () => {
    renderIndicator({ tone: 'offline', label: 'Offline' });

    expect(screen.getByRole('status')).toHaveTextContent('Offline');
  });
});

describe('LiveIndicator — count tidak valid', () => {
  it.each([
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
  ])('count %s jatuh ke label nada, bukan angka palsu', (_name, count) => {
    renderIndicator({ count });

    expect(screen.getByRole('status')).toHaveTextContent('Sedang tayang');
  });

  it('count eksplisit undefined menyembunyikan angka', () => {
    renderIndicator({ count: undefined });

    expect(screen.getByRole('status')).toHaveTextContent('Sedang tayang');
  });

  it('count negatif dijepit ke 0 tetapi tetap diumumkan', () => {
    renderIndicator({ count: -12 });

    expect(screen.getByRole('status')).toHaveTextContent('0 orang sedang melihat');
  });

  it('count desimal dipotong menjadi bilangan bulat', () => {
    renderIndicator({ count: 41.9 });

    expect(screen.getByRole('status')).toHaveTextContent('41 orang sedang melihat');
  });

  it('count nol tetap diumumkan sebagai nol penonton', () => {
    renderIndicator({ count: 0 });

    expect(screen.getByRole('status')).toHaveTextContent('0 orang sedang melihat');
  });
});

describe('LiveIndicator — kontrak aksesibilitas', () => {
  it('selalu berupa role=status dengan aria-live polite dan atomik', () => {
    renderIndicator();

    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveAttribute('aria-atomic', 'true');
  });

  it('menyediakan prelude sr-only untuk konteks pembaca layar', () => {
    renderIndicator();

    expect(screen.getByText('Indikator siaran:')).toBeInTheDocument();
  });

  it('tone offline menambahkan keterangan sr-only bahwa siaran mati', () => {
    renderIndicator({ tone: 'offline' });

    expect(screen.getByText('— siaran tidak aktif')).toBeInTheDocument();
  });

  it('tone live tidak menambahkan keterangan mati', () => {
    renderIndicator();

    expect(screen.queryByText('— siaran tidak aktif')).not.toBeInTheDocument();
  });

  it('titik indikator disembunyikan dari pembaca layar', () => {
    const { container } = renderIndicator();

    const dot = container.querySelector('[aria-hidden="true"]');
    expect(dot).not.toBeNull();
    expect(dot).toHaveClass('relative', 'flex');
  });

  it('count besar tetap satu kalimat utuh', () => {
    renderIndicator({ count: 1_000_000 });

    expect(screen.getByRole('status')).toHaveTextContent('1.000.000 orang sedang melihat');
  });
});

describe('LiveIndicator — showDot & ukuran', () => {
  it('showDot=false menyembunyikan titik indikator', () => {
    const { container } = renderIndicator({ showDot: false });

    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
    // Teks status tetap ada.
    expect(screen.getByRole('status')).toHaveTextContent('Sedang tayang');
  });

  it.each(['sm', 'md'] as const)('ukuran %s tetap merender status lengkap', (size) => {
    renderIndicator({ size, count: 5 });

    expect(screen.getByRole('status')).toHaveTextContent('5 orang sedang melihat');
  });

  it('meneruskan className tambahan ke elemen status', () => {
    renderIndicator({ className: 'ml-2' });

    expect(screen.getByRole('status')).toHaveClass('ml-2');
  });
});

describe('LiveIndicator — prefers-reduced-motion', () => {
  it('menampilkan titik berdenyut saat pengguna tidak meminta reduced-motion', () => {
    const { container } = renderIndicator();

    expect(pulseRing(container)).not.toBeNull();
    expect(screen.getByRole('status')).not.toHaveAttribute('data-reduced-motion');
  });

  it('tidak berdenyut saat matchMedia melaporkan reduced-motion aktif', () => {
    stubMatchMedia(true);
    const { container } = renderIndicator();

    expect(pulseRing(container)).toBeNull();
    expect(screen.getByRole('status')).toHaveAttribute('data-reduced-motion', 'true');
  });

  it('tone offline tidak pernah berdenyut walau motion diizinkan', () => {
    const { container } = renderIndicator({ tone: 'offline' });

    expect(pulseRing(container)).toBeNull();
  });

  it('mendaftarkan dan melepas listener perubahan preferensi gerak', () => {
    const { mql } = stubMatchMedia(false);
    const { unmount } = renderIndicator();

    expect(mql.addEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    const listener = mql.addEventListener.mock.calls[0][1];
    unmount();
    expect(mql.removeEventListener).toHaveBeenCalledWith('change', listener);
  });

  it('mengikuti perubahan preferensi gerak di tengah sesi', async () => {
    const media = stubMatchMedia(false);
    const { container } = renderIndicator();

    expect(pulseRing(container)).not.toBeNull();

    await act(async () => {
      media.emit(true);
    });

    expect(pulseRing(container)).toBeNull();
    expect(screen.getByRole('status')).toHaveAttribute('data-reduced-motion', 'true');
  });

  it('tetap aman bila lingkungan tidak menyediakan matchMedia', () => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: undefined,
    });

    renderIndicator();

    expect(screen.getByRole('status')).toHaveTextContent('Sedang tayang');
  });
});
