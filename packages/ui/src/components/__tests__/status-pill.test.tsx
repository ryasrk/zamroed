import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import StatusPill, { STATUS_LABELS, type StatusPillProps } from '../status-pill';

function renderPill(props: Partial<StatusPillProps> = {}) {
  return render(<StatusPill status="good" {...props} />);
}

describe('StatusPill — label status', () => {
  it.each([
    ['good', 'Baik'],
    ['warning', 'Waspada'],
    ['critical', 'Kritis'],
  ] as const)('status %s memakai label resmi %s', (status, label) => {
    renderPill({ status });

    expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.getByText(label).closest('[data-status]')).toHaveAttribute('data-status', status);
  });

  it('mengekspor kamus label resmi sebagai satu sumber kebenaran', () => {
    expect(STATUS_LABELS).toEqual({ good: 'Baik', warning: 'Waspada', critical: 'Kritis' });
  });

  it('label eksplisit menimpa label resmi', () => {
    renderPill({ status: 'warning', label: 'Perlu dipantau' });

    expect(screen.getByText('Perlu dipantau')).toBeInTheDocument();
    expect(screen.queryByText('Waspada')).not.toBeInTheDocument();
  });

  it('menyediakan prelude sr-only untuk konteks status', () => {
    renderPill();

    expect(screen.getByText('Status mutu air sungai:')).toBeInTheDocument();
  });
});

describe('StatusPill — afordans urgensi', () => {
  it('hanya status critical yang berdenyut dan menambahkan keterangan segera', () => {
    const { container } = renderPill({ status: 'critical' });

    expect(container.querySelector('.animate-pulse-ring')).not.toBeNull();
    expect(screen.getByText('— perlu tindakan segera')).toBeInTheDocument();
  });

  it.each(['good', 'warning'] as const)('status %s tidak berdenyut', (status) => {
    const { container } = renderPill({ status });

    expect(container.querySelector('.animate-pulse-ring')).toBeNull();
    expect(screen.queryByText('— perlu tindakan segera')).not.toBeInTheDocument();
  });
});

describe('StatusPill — detail pendamping', () => {
  it('merender detail setelah pemisah tipis', () => {
    const { container } = renderPill({ detail: 'IKA 42' });

    expect(screen.getByText('IKA 42')).toBeInTheDocument();
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThanOrEqual(2);
  });

  it('tanpa detail tidak ada pemisah tambahan', () => {
    const { container } = renderPill();

    // Hanya titik status yang aria-hidden.
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1);
    expect(container.querySelectorAll('span.w-px')).toHaveLength(0);
  });

  it('detail tetap terbaca untuk setiap status', () => {
    renderPill({ status: 'critical', detail: 'DO 3,1 mg/L' });

    expect(screen.getByText('DO 3,1 mg/L')).toBeInTheDocument();
    expect(screen.getByText('Kritis')).toBeInTheDocument();
  });

  it('menerima detail berupa teks panjang tanpa memotongnya', () => {
    const detail = 'Indeks Kualitas Air 18,4 — kelas III'.repeat(4).trim();
    renderPill({ status: 'warning', detail });

    expect(screen.getByText(detail)).toBeInTheDocument();
  });
});

describe('StatusPill — ukuran & kelas', () => {
  it.each(['sm', 'md'] as const)('ukuran %s tetap merender pil lengkap', (size) => {
    renderPill({ size, detail: 'pH 7,1' });

    const pill = screen.getByText('Baik').closest('[data-status]');
    expect(pill).not.toBeNull();
    expect(screen.getByText('pH 7,1')).toBeInTheDocument();
  });

  it('meneruskan className tambahan ke pil', () => {
    renderPill({ className: 'mt-1' });

    expect(screen.getByText('Baik').closest('[data-status]')).toHaveClass('mt-1');
  });

  it('default ukuran sm saat tidak ditentukan', () => {
    renderPill();

    expect(screen.getByText('Baik').closest('[data-status]')?.className).toContain('h-6');
  });

  it('ukuran md memakai tinggi berbeda dari sm', () => {
    renderPill({ size: 'md' });

    expect(screen.getByText('Baik').closest('[data-status]')?.className).toContain('h-8');
  });
});

describe('StatusPill — struktur DOM', () => {
  it('titik status di-hide dari pembaca layar dan punya cincin', () => {
    const { container } = renderPill({ status: 'warning' });

    const hidden = container.querySelector('[aria-hidden="true"]');
    expect(hidden).toHaveClass('h-2', 'w-2');
    expect(hidden?.querySelector('.ring-1')).not.toBeNull();
  });

  it('teks label tampil sebagai teks visual, bukan sr-only saja', () => {
    renderPill({ status: 'warning' });

    const label = screen.getByText('Waspada');
    expect(label).not.toHaveClass('sr-only');
    expect(label.tagName).toBe('SPAN');
  });

  it('setiap status memakai token titik yang berbeda', () => {
    const { container: good } = renderPill({ status: 'good' });
    const { container: critical } = renderPill({ status: 'critical' });

    const goodDot = good.querySelector('[aria-hidden="true"] .ring-1');
    const criticalDot = critical.querySelector('[aria-hidden="true"] .ring-1');
    expect(goodDot?.className).toContain('bg-status-good');
    expect(criticalDot?.className).toContain('bg-status-critical');
  });

  it('pil tetap dapat ditemukan lewat data-status untuk setiap nilai status', () => {
    const { container } = renderPill({ status: 'critical' });

    const pill = container.querySelector('[data-status="critical"]');
    expect(pill).not.toBeNull();
    expect(pill?.textContent).toContain('Kritis');
  });
});
