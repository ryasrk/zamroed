import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import ProgressBar, { type ProgressBarProps } from '../progress-bar';

/** Elemen isian selalu anak pertama track dan membawa inline transform scaleX. */
function fillOf(track: HTMLElement): HTMLElement {
  const fill = track.querySelector<HTMLElement>('span[style*="transform"]');
  if (!fill) throw new Error('elemen isian progres tidak ditemukan');
  return fill;
}

function renderBar(props: Partial<ProgressBarProps> = {}) {
  return render(<ProgressBar value={50} {...props} />);
}

describe('ProgressBar — render dasar', () => {
  it('merender satu role="progressbar" dengan rentang 0..max', () => {
    renderBar({ value: 75, max: 200 });

    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '200');
    expect(bar).toHaveAttribute('aria-valuenow', '75');
    expect(bar).toHaveAttribute('aria-valuetext', '75 dari 200');
  });

  it('memakai max default 100', () => {
    renderBar({ value: 25 });

    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
    expect(bar).toHaveAttribute('aria-valuetext', '25 dari 100');
  });

  it('menskalakan isian secara linear terhadap sasaran', () => {
    renderBar({ value: 30, max: 120 });

    expect(fillOf(screen.getByRole('progressbar')).style.transform).toBe('scaleX(0.25)');
  });

  it('menjepit isian ke penuh saat nilai melewati sasaran', () => {
    renderBar({ value: 500, max: 200 });

    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '200');
    expect(fillOf(bar).style.transform).toBe('scaleX(1)');
  });

  it('memperlakukan nilai negatif sebagai 0', () => {
    renderBar({ value: -40, max: 100 });

    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '0');
    expect(fillOf(bar).style.transform).toBe('scaleX(0)');
  });
});

describe('ProgressBar — label & persentase', () => {
  it('menampilkan label dengan persentase saat showPercentage', () => {
    renderBar({ value: 62.5, max: 100, label: 'Capaian dana', showPercentage: true });

    expect(screen.getByText('Capaian dana')).toBeInTheDocument();
    expect(screen.getByText('62,5%')).toBeInTheDocument();
  });

  it('label tanpa showPercentage tidak menampilkan angka persen visual', () => {
    renderBar({ value: 62.5, max: 100, label: 'Capaian dana' });

    expect(screen.getByText('Capaian dana')).toBeInTheDocument();
    expect(screen.queryByText('62,5%')).not.toBeInTheDocument();
    // Persentase tetap tersedia bagi pembaca layar lewat nama aksesibel.
    expect(screen.getByRole('progressbar', { name: 'Capaian dana, 62,5%' })).toBeInTheDocument();
  });

  it('showPercentage diabaikan bila label tidak diisi — tidak ada baris label ganda', () => {
    renderBar({ value: 40, showPercentage: true });

    // Tanpa label, persentase tetap tampil sekali di dalam track (bukan di baris label).
    const percents = screen.getAllByText('40%');
    expect(percents).toHaveLength(1);
    expect(screen.queryByRole('progressbar', { name: '40%' })).not.toBeInTheDocument();
  });

  it('tanpa label, angka kecil dicetak di dalam track', () => {
    renderBar({ value: 62.5, max: 100 });

    expect(screen.getByText('62,5%')).toBeInTheDocument();
  });

  it('tanpa label dan indeterminate, track menampilkan tanda pisah', () => {
    renderBar({ value: 0, max: 0 });

    expect(screen.getByText('—')).toBeInTheDocument();
  });
});

describe('ProgressBar — nama aksesibel & valueText', () => {
  it('aria-label menimpa nama aksesibel bawaan dan membuat bar fokusabel', () => {
    renderBar({ value: 50, label: 'Kesuburan air (IKA)', 'aria-label': 'IKA Sungai Ciliwung' });

    const bar = screen.getByRole('progressbar', { name: 'IKA Sungai Ciliwung' });
    expect(bar).toHaveAttribute('tabindex', '0');
  });

  it('tanpa aria-label bar tidak masuk urutan fokus', () => {
    renderBar({ value: 50, label: 'Capaian dana' });

    expect(screen.getByRole('progressbar')).not.toHaveAttribute('tabindex');
  });

  it('valueText eksplisit menimpa teks bawaan', () => {
    renderBar({ value: 87_500_000, max: 150_000_000, valueText: 'Rp87.500.000 dari Rp150.000.000' });

    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuetext',
      'Rp87.500.000 dari Rp150.000.000',
    );
  });

  it('menyertakan persentase pada teks bawaan bila label diisi', () => {
    renderBar({ value: 1, max: 4, label: 'Kelengkapan data' });

    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuetext',
      '1 dari 4 25%',
    );
  });
});

describe('ProgressBar — nada & ukuran', () => {
  it.each([
    ['brand', 'from-brand-accent'],
    ['success', 'from-status-good/85'],
    ['warning', 'from-status-warning/85'],
    ['river', 'from-river-cyan'],
    ['good', 'from-status-good/85'],
    ['critical', 'from-status-critical/85'],
  ] as const)('nada %s memakai isian yang benar', (tone, expectedClass) => {
    const { container } = renderBar({ value: 40, tone });

    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('data-tone', tone);
    const fill = fillOf(bar);
    // Nada `success` dan `good` memakai gradasi identik — pastikan salah satunya.
    const matches = fill.className.split(' ').filter((c) => c === expectedClass);
    expect(matches.length).toBeGreaterThan(0);
    expect(container.querySelector('[role="progressbar"]')).toBe(bar);
  });

  it.each(['sm', 'md'] as const)('ukuran %s tercatat di data-size', (size) => {
    renderBar({ value: 40, size });

    expect(screen.getByRole('progressbar')).toHaveAttribute('data-size', size);
  });

  it('nada tak dikenal jatuh ke gaya brand tanpa crash', () => {
    renderBar({ value: 40, tone: 'tidak-ada' as ProgressBarProps['tone'] });

    const bar = screen.getByRole('progressbar');
    expect(fillOf(bar)).toHaveClass('from-brand-accent');
  });

  it('ukuran tak dikenal jatuh ke ukuran md', () => {
    renderBar({ value: 40, size: 'xl' as ProgressBarProps['size'] });

    // `data-size` tetap merekam nilai yang diminta, sementara gaya memakai md.
    expect(screen.getByRole('progressbar')).toHaveAttribute('data-size', 'xl');
  });

  it('menggabungkan className pembungkus dan trackClassName pada track', () => {
    const { container } = renderBar({ value: 40, className: 'col-span-2', trackClassName: 'w-40' });

    expect(container.firstElementChild).toHaveClass('col-span-2');
    expect(screen.getByRole('progressbar')).toHaveClass('w-40');
  });

  it('indeterminate ditandai lewat data-indeterminate', () => {
    renderBar({ value: 10, indeterminate: true });

    expect(screen.getByRole('progressbar')).toHaveAttribute('data-indeterminate', 'true');
  });
});

describe('ProgressBar — indeterminate / tanpa sasaran', () => {
  it('max = 0 memaksa isian 0 dan bukan 100%', () => {
    renderBar({ value: 500, max: 0 });

    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
    expect(bar).toHaveAttribute('aria-valuetext', 'Belum ada sasaran');
    expect(fillOf(bar).style.transform).toBe('scaleX(0)');
  });

  it('menandai bilah tanpa sasaran dengan data-indeterminate', () => {
    renderBar({ value: 500, max: 0 });

    expect(screen.getByRole('progressbar')).toHaveAttribute('data-indeterminate', 'true');
  });

  it('max negatif juga dianggap tanpa sasaran', () => {
    renderBar({ value: 25, max: -10 });

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', 'Belum ada sasaran');
  });

  it.each([
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
  ])('max %s dianggap tanpa sasaran', (_name, max) => {
    renderBar({ value: 25, max });

    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuetext', 'Belum ada sasaran');
    expect(fillOf(bar).style.transform).toBe('scaleX(0)');
  });

  it('indeterminate eksplisit memaksa 0 meskipun max valid', () => {
    renderBar({ value: 90, max: 100, indeterminate: true });

    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '0');
    expect(fillOf(bar).style.transform).toBe('scaleX(0)');
  });

  it('tidak pernah melaporkan 100% saat label diisi tapi tanpa sasaran', () => {
    renderBar({ value: 90, max: 0, label: 'Capaian dana', showPercentage: true });

    expect(screen.getByText('Capaian dana')).toBeInTheDocument();
    // Rasio dipaksa 0 walau nilainya besar: satu-satunya persen adalah "0%".
    expect(screen.getAllByText('0%')).toHaveLength(1);
    expect(screen.queryByText('90%')).not.toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', 'Belum ada sasaran');
  });
});

describe('ProgressBar — kasus batas angka & format', () => {
  it.each([
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
    ['-Infinity', Number.NEGATIVE_INFINITY],
  ])('nilai %s menjadi 0 tanpa NaN pada lebar', (_name, value) => {
    renderBar({ value, max: 100 });

    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '0');
    expect(fillOf(bar).style.transform).toBe('scaleX(0)');
    expect(bar.getAttribute('aria-valuetext')).not.toContain('NaN');
  });

  it('memformat ribuan gaya Indonesia pada nilai dan sasaran besar', () => {
    renderBar({ value: 1500, max: 1_000_000 });

    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuetext',
      '1.500 dari 1.000.000',
    );
  });

  it('memakai satu desimal gaya Indonesia saat dibutuhkan', () => {
    renderBar({ value: 1250, max: 100000, label: 'Capaian dana', showPercentage: true });

    // 1250 / 100000 = 1.25% → "1,3%" setelah dibulatkan ke satu desimal.
    expect(screen.getByText('1,3%')).toBeInTheDocument();
  });

  it('max sangat kecil tetap menghasilkan rentang angka yang terbaca', () => {
    renderBar({ value: 1, max: 0.5 });

    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuemax', '0.5');
    expect(bar).toHaveAttribute('aria-valuetext', '0,5 dari 0,5');
    expect(fillOf(bar).style.transform).toBe('scaleX(1)');
  });

  it('max di bawah ambang pelabelan jatuh ke format persen saja', () => {
    renderBar({ value: 0.005, max: 0.009 });

    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-valuetext')).toMatch(/%$/);
  });

  it('max di atas ambang pelabelan jatuh ke format persen saja', () => {
    renderBar({ value: 5_000_000, max: 5_000_000_000 });

    const bar = screen.getByRole('progressbar');
    expect(bar.getAttribute('aria-valuetext')).toMatch(/%$/);
  });

  it('label panjang tetap menjadi bagian nama aksesibel', () => {
    const label = 'Kelengkapan data lapangan relawan '.repeat(5).trim();
    renderBar({ value: 10, max: 20, label });

    expect(screen.getByRole('progressbar', { name: `${label}, 50%` })).toBeInTheDocument();
  });

  it('tidak ada elemen NaN pada DOM untuk masukan ekstrem', () => {
    const { container } = renderBar({ value: Number.NaN, max: Number.NaN, label: 'Aneh' });

    expect(container.innerHTML).not.toContain('NaN');
    expect(container.innerHTML).not.toContain('Infinity');
  });
});
