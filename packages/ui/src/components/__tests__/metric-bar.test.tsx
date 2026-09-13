import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import MetricBar from '../metric-bar';

/** Titik bar diambil lewat `aria-hidden` child yang membawa inline width. */
function filledBar(container: HTMLElement): HTMLElement {
  const bar = container.querySelector<HTMLElement>('span[style*="width"]:not([aria-hidden="false"])');
  if (!bar) throw new Error('elemen isian bar tidak ditemukan');
  return bar;
}

function renderMetric(props: Partial<Parameters<typeof MetricBar>[0]> = {}) {
  return render(
    <MetricBar label="Oksigen Terlarut (DO)" value={7.4} min={0} max={14} {...props} />,
  );
}

describe('MetricBar — render dasar & header', () => {
  it('merender label, nilai, satuan, dan skala minimum/maksimum', () => {
    renderMetric({ value: 7.4, unit: 'mg/L', min: 0, max: 14 });

    expect(screen.getByText('Oksigen Terlarut (DO)')).toBeInTheDocument();
    expect(screen.getByText('7,4')).toBeInTheDocument();
    expect(screen.getByText('mg/L')).toBeInTheDocument();
    // Skala: min kiri, max kanan.
    expect(screen.getByText('0')).toBeInTheDocument();
    expect(screen.getByText('14')).toBeInTheDocument();
  });

  it('memakai role="meter" dengan aria-valuenow/min/max dari prop', () => {
    renderMetric({ value: 7, min: 2, max: 12 });

    const meter = screen.getByRole('meter', { name: 'Oksigen Terlarut (DO)' });
    expect(meter).toHaveAttribute('aria-valuenow', '7');
    expect(meter).toHaveAttribute('aria-valuemin', '2');
    expect(meter).toHaveAttribute('aria-valuemax', '12');
  });

  it('mengisi bar secara proporsional dalam persen', () => {
    const { container } = renderMetric({ value: 7, min: 0, max: 14 });

    expect(filledBar(container).style.width).toBe('50%');
  });

  it('menjepit isian ke 100% saat nilai melebihi maksimum', () => {
    const { container } = renderMetric({ value: 999, min: 0, max: 14 });

    expect(filledBar(container).style.width).toBe('100%');
  });

  it('menjepit isian ke 0% saat nilai di bawah minimum', () => {
    const { container } = renderMetric({ value: -50, min: 0, max: 14 });

    expect(filledBar(container).style.width).toBe('0%');
  });

  it('hideHeader menyembunyikan label visual tetapi mempertahankan meter', () => {
    renderMetric({ hideHeader: true });

    expect(screen.queryByText('Oksigen Terlarut (DO)')).not.toBeInTheDocument();
    expect(screen.getByRole('meter', { name: 'Oksigen Terlarut (DO)' })).toBeInTheDocument();
  });

  it('menggabungkan className tambahan ke pembungkus luar', () => {
    const { container } = renderMetric({ className: 'mt-8' });

    expect(container.firstElementChild).toHaveClass('mt-8');
  });

  it('menyediakan salinan sr-only untuk pembaca layar dari label + nilai', () => {
    const { container } = renderMetric({ value: 7.4, unit: 'mg/L' });

    const srOnly = container.querySelector('.sr-only');
    expect(srOnly?.textContent).toBe('Oksigen Terlarut (DO): 7,4 mg/L');
  });
});

describe('MetricBar — status mutu air', () => {
  it.each([
    ['good', 'Baik', 'bg-status-good'],
    ['warning', 'Waspada', 'bg-status-warning'],
    ['critical', 'Kritis', 'bg-status-critical'],
  ] as const)('status %s memakai label %s dan token warna yang sesuai', (status, label, fill) => {
    const { container } = renderMetric({ status });

    const meter = screen.getByRole('meter');
    expect(meter.getAttribute('aria-valuetext')).toContain(`status ${label}`);
    expect(filledBar(container)).toHaveClass(fill);
  });

  it('tanpa status memakai token brand dan tidak menyebut status di aria-valuetext', () => {
    const { container } = renderMetric();

    expect(filledBar(container)).toHaveClass('bg-brand-primary');
    expect(screen.getByRole('meter').getAttribute('aria-valuetext')).not.toContain('status');
  });

  it('menggabungkan label, status, dan rentang aman ke satu aria-valuetext', () => {
    renderMetric({
      value: 6.5,
      unit: 'mg/L',
      status: 'warning',
      safeRange: [5, 7],
    });

    const meter = screen.getByRole('meter');
    expect(meter.getAttribute('aria-valuetext')).toBe(
      'Oksigen Terlarut (DO): 6,5 mg/L, status Waspada, rentang aman 5–7 mg/L',
    );
  });
});

describe('MetricBar — zona aman', () => {
  it('merender zona aman dengan posisi & lebar persen relatif skala', () => {
    const { container } = renderMetric({ value: 7, min: 0, max: 14, safeRange: [5, 9] });

    const zone = container.querySelector<HTMLElement>('[aria-hidden="true"][style*="left"]');
    expect(zone).not.toBeNull();
    // 5/14 ≈ 35.71%, lebar (9-5)/14 ≈ 28.57%
    expect(zone?.style.left).toBe('35.714285714285715%');
    expect(zone?.style.width).toBe('28.571428571428577%');
  });

  it('menukar batas rentang aman yang terbalik (min > max) demi keamanan', () => {
    const { container } = renderMetric({ safeRange: [9, 5] });

    const zone = container.querySelector<HTMLElement>('[aria-hidden="true"][style*="left"]');
    expect(zone?.style.left).toBe('35.714285714285715%');
    expect(zone?.style.width).toBe('28.571428571428577%');
    expect(screen.getByText('Zona aman 5–9')).toBeInTheDocument();
  });

  it('menampilkan keterangan zona aman bersama satuan', () => {
    renderMetric({ safeRange: [5, 9], unit: 'mg/L' });

    expect(screen.getByText('Zona aman 5–9 mg/L')).toBeInTheDocument();
  });

  it('mengganti garis tengah menjadi zona aman saat rentang aman diisi', () => {
    const { container: without } = renderMetric();
    const { container: withZone } = renderMetric({ safeRange: [5, 9] });

    const centerLine = (root: HTMLElement) =>
      root.querySelector('[aria-hidden="true"].left-1\\/2');
    expect(centerLine(without)).not.toBeNull();
    expect(centerLine(withZone)).toBeNull();
  });

  it.each([
    ['rentang identik', [5, 5] as [number, number]],
    ['rentang NaN', [Number.NaN, Number.NaN] as [number, number]],
    ['rentang dua Infinity', [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY] as [
      number,
      number,
    ]],
  ])('%s tidak dianggap zona aman', (_name, safeRange) => {
    const { container } = renderMetric({ safeRange });

    expect(container.querySelector('[aria-hidden="true"][style*="left"]')).toBeNull();
    expect(screen.queryByText(/Zona aman/)).not.toBeInTheDocument();
  });
});

describe('MetricBar — hint', () => {
  it('menampilkan hint sebagai ganti keterangan zona aman', () => {
    renderMetric({ safeRange: [5, 9], hint: 'Baku mutu ≥ 5 mg/L' });

    expect(screen.getByText('Baku mutu ≥ 5 mg/L')).toBeInTheDocument();
    expect(screen.queryByText(/Zona aman/)).not.toBeInTheDocument();
  });

  it('menerima hint sebagai ReactNode', () => {
    renderMetric({ hint: <em>Ambang kelas II</em> });

    expect(screen.getByText('Ambang kelas II').tagName).toBe('EM');
  });

  it('tanpa hint dan tanpa zona aman, tidak ada baris keterangan', () => {
    renderMetric();

    expect(screen.queryByText(/Zona aman/)).not.toBeInTheDocument();
  });
});

describe('MetricBar — kasus batas angka', () => {
  it.each([
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
    ['-Infinity', Number.NEGATIVE_INFINITY],
  ])('nilai %s dibaca sebagai 0 tanpa NaN pada tata letak', (_name, value) => {
    const { container } = renderMetric({ value, max: Number.POSITIVE_INFINITY });

    const meter = screen.getByRole('meter');
    expect(meter).toHaveAttribute('aria-valuenow', '0');
    expect(filledBar(container).style.width).toBe('0%');
  });

  it('min = max tidak menyebabkan bagi nol (lebar 0%, bukan NaN)', () => {
    const { container } = renderMetric({ value: 5, min: 5, max: 5 });

    expect(filledBar(container).style.width).toBe('0%');
    expect(screen.getByRole('meter').getAttribute('aria-valuetext')).not.toContain('NaN');
  });

  it('max lebih kecil dari min dirapikan agar rentang tetap naik', () => {
    renderMetric({ value: 5, min: 10, max: 2 });

    const meter = screen.getByRole('meter');
    expect(meter).toHaveAttribute('aria-valuemin', '10');
    // `min + Number.EPSILON` jauh di bawah presisi AST-graphile, jadi React tidak
    // menulis atribut `aria-valuemax` sama sekali — asalkan bukan nilai salah.
    expect(meter.getAttribute('aria-valuemax')).not.toBe('2');
    expect(meter.getAttribute('aria-valuetext')).not.toContain('NaN');
  });

  it('max non-finite jatuh ke nilai min agar tidak ada rentang palsu', () => {
    renderMetric({ value: 3, min: 2, max: Number.NaN });

    const meter = screen.getByRole('meter');
    expect(meter).toHaveAttribute('aria-valuemin', '2');
    expect(meter).toHaveAttribute('aria-valuemax', '2');
  });

  it('max non-finite dengan min valid memakai min sebagai batas atas', () => {
    renderMetric({ value: 3, min: 4, max: Number.POSITIVE_INFINITY });

    const meter = screen.getByRole('meter');
    expect(meter).toHaveAttribute('aria-valuemin', '4');
    // min terpakai apa adanya (4), jadi batas atas tetap 4.
    expect(meter).toHaveAttribute('aria-valuemax', '4');
  });

  it('min non-finite menjadi 0', () => {
    renderMetric({ value: 5, min: Number.NaN, max: 10 });

    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuemin', '0');
  });

  it('mempertahankan hingga dua desimal pada nilai dan skala', () => {
    const { container } = renderMetric({ value: 6.05, min: 0, max: 14 });

    expect(screen.getByText('6,05')).toBeInTheDocument();
    expect(filledBar(container).style.width).toBe('43.21428571428571%');
  });

  it('menangani label sangat panjang tanpa kehilangan aksesibilitas', () => {
    const longLabel = 'Kandungan Padatan Tersuspensi Total '.repeat(6).trim();
    renderMetric({ label: longLabel });

    const meter = screen.getByRole('meter', { name: longLabel });
    expect(meter).toHaveAttribute('aria-valuetext', expect.stringContaining(longLabel));
  });
});
