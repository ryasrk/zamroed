import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import CampaignCard, { type CampaignCardProps } from '../campaign-card';

const DANA: CampaignCardProps = {
  title: 'Selamatkan Ciliwung',
  description: 'Pemulihan 12 km sempadan sungai bersama warga bantaran.',
  target: 150_000_000,
  raised: 87_500_000,
  type: 'dana',
  href: '/kampanye/selamatkan-ciliwung',
};

const PETISI: CampaignCardProps = {
  title: 'Hentikan Buang Limbah ke Sungai',
  description: 'Tuntut audit limbah terbuka untuk pabrik di hulu.',
  target: 50_000,
  raised: 31_240,
  type: 'petisi',
  href: '/petisi/hentikan-limbah',
};

function renderCard(props: Partial<CampaignCardProps> = {}) {
  return render(<CampaignCard {...DANA} {...props} />);
}

describe('CampaignCard — kerangka kartu', () => {
  it('menandai jenis kampanye lewat data-* pada kartu', () => {
    const { container } = renderCard();

    const card = container.querySelector('[data-component="campaign-card"]');
    expect(card).not.toBeNull();
    expect(card).toHaveAttribute('data-type', 'dana');
  });

  it('merender judul, deskripsi, dan tombol aksi sesuai jenis kampanye dana', () => {
    renderCard();

    expect(screen.getByRole('heading', { name: DANA.title })).toBeInTheDocument();
    expect(screen.getByText(DANA.description)).toBeInTheDocument();
    expect(screen.getByText('Penggalangan dana')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Dukung Sekarang/ })).toBeInTheDocument();
  });

  it('memakai judul, label, dan CTA versi petisi', () => {
    renderCard(PETISI);

    expect(screen.getByText('Petisi warga')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Tandatangani Petisi/ })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: /Tanda tangan terkumpul/ })).toBeInTheDocument();
  });

  it('mengaitkan tombol aksi ke href kampanye dan menyebut jenis di nama aksesibel', async () => {
    renderCard();

    const cta = screen.getByRole('link', {
      name: 'Dukung Sekarang: Selamatkan Ciliwung (Dana)',
    });
    expect(cta).toHaveAttribute('href', DANA.href);
    expect(cta).toHaveAttribute('data-variant', 'primary');
  });

  it('meneruskan className ke kartu tanpa menghapus penanda data-component', () => {
    const { container } = renderCard({ className: 'mt-6' });

    const card = container.querySelector('[data-component="campaign-card"]');
    expect(card).toHaveClass('mt-6');
  });
});

describe('CampaignCard — tingkat heading', () => {
  it('default h3', () => {
    renderCard();

    expect(screen.getByRole('heading', { level: 3, name: DANA.title })).toBeInTheDocument();
  });

  it.each(['h2', 'h3', 'h4'] as const)('headingLevel %s menentukan tingkat heading', (headingLevel) => {
    renderCard({ headingLevel });

    const level = Number(headingLevel[1]);
    expect(screen.getByRole('heading', { level, name: DANA.title })).toBeInTheDocument();
  });
});

describe('CampaignCard — slot aksi', () => {
  it('merender slot aksi di header bila diberikan', () => {
    renderCard({ action: <span>Segera berakhir</span> });

    expect(screen.getByText('Segera berakhir')).toBeInTheDocument();
  });

  it('tidak merender slot aksi tanpa prop action', () => {
    const { container } = renderCard();

    expect(container.querySelector('[data-slot="card-header"]')).not.toBeNull();
    expect(screen.queryByText('Segera berakhir')).not.toBeInTheDocument();
  });
});

describe('CampaignCard — perhitungan capaian dana', () => {
  it('memformat capaian & sasaran sebagai rupiah dan menghitung persen', () => {
    renderCard();

    const card = screen.getByText(DANA.title).closest('[data-component="campaign-card"]')!;
    expect(within(card as HTMLElement).getByText('Rp 87.500.000')).toBeInTheDocument();
    // 87.5M / 150M = 58.33% → dibulatkan 58%
    expect(within(card as HTMLElement).getByText('58% dari Rp 150.000.000')).toBeInTheDocument();
  });

  it('meneruskan capaian ke bilah dengan teks aksesibel bergaya rupiah', () => {
    renderCard();

    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuetext', 'Rp 87.500.000 dari Rp 150.000.000, 58%');
    expect(bar).toHaveAttribute('data-size', 'sm');
  });

  it('membulatkan persen ke bilangan bulat terdekat', () => {
    renderCard({ target: 3, raised: 2 });

    expect(screen.getByText('67% dari Rp 3')).toBeInTheDocument();
  });

  it('menjepit persen ke 100% saat capaian melampaui sasaran', () => {
    renderCard({ target: 1_000_000, raised: 5_000_000 });

    expect(screen.getByText('100% dari Rp 1.000.000')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1000000');
  });

  it('memperlakukan capaian negatif sebagai 0', () => {
    renderCard({ target: 1_000_000, raised: -500 });

    expect(screen.getAllByText('Rp 0').length).toBeGreaterThan(0);
    expect(screen.getByText('0% dari Rp 1.000.000')).toBeInTheDocument();
  });

  it.each([
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
    ['-Infinity', Number.NEGATIVE_INFINITY],
  ])('capaian %s menjadi Rp0 tanpa NaN di DOM', (_name, raised) => {
    const { container } = renderCard({ raised });

    expect(container.innerHTML).not.toContain('NaN');
    expect(container.innerHTML).not.toContain('Infinity');
    expect(screen.getAllByText('Rp 0').length).toBeGreaterThan(0);
  });
});

describe('CampaignCard — sasaran tidak valid', () => {
  it.each([
    ['nol', 0],
    ['negatif', -1_000_000],
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
  ])('sasaran %s menandai kampanye tanpa sasaran', (_name, target) => {
    renderCard({ target, raised: 31_240 });

    expect(screen.getByText('Sasaran belum ditetapkan')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuetext',
      'Rp 31.240, sasaran belum ditetapkan',
    );
    expect(screen.getByRole('progressbar')).toHaveAttribute('data-indeterminate', 'true');
  });

  it('tanpa sasaran bilah tidak pernah terbaca penuh', () => {
    renderCard({ target: 0, raised: 5_000_000 });

    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '0');
  });

  it('tanpa sasaran tidak ada teks "0%" yang menyesatkan', () => {
    renderCard({ target: 0, raised: 0 });

    expect(screen.queryByText(/0% dari/)).not.toBeInTheDocument();
    expect(screen.getByText('Sasaran belum ditetapkan')).toBeInTheDocument();
  });
});

describe('CampaignCard — capaian petisi', () => {
  it('memformat capaian & sasaran sebagai jumlah tanda tangan', () => {
    renderCard(PETISI);

    const card = screen.getByRole('heading', { name: PETISI.title }).closest(
      '[data-component="campaign-card"]',
    ) as HTMLElement;
    expect(within(card).getByText('31.240 tanda tangan')).toBeInTheDocument();
    expect(within(card).getByText('62% dari 50.000 tanda tangan')).toBeInTheDocument();
  });

  it('menghilangkan kata "tanda tangan" pada teks aksesibel bilah', () => {
    renderCard(PETISI);

    expect(screen.getByRole('progressbar')).toHaveAttribute(
      'aria-valuetext',
      '31.240 dari 50.000 tanda tangan, 62%',
    );
  });

  it('mengelompokkan ribuan tanpa Intl untuk label bilah', () => {
    renderCard({ ...PETISI, target: 1_000_000, raised: 12_345 });

    expect(screen.getByRole('progressbar', { name: /^Tanda tangan terkumpul/ })).toHaveAttribute(
      'aria-valuetext',
      '12.345 dari 1.000.000 tanda tangan, 1%',
    );
  });
});

describe('CampaignCard — interaksi & konten panjang', () => {
  it('tautan aksi membawa atribut aksesibilitas & dapat difokuskan lewat keyboard', async () => {
    renderCard({ action: <a href="/donasi">Donasi cepat</a> });

    const extraLink = screen.getByRole('link', { name: 'Donasi cepat' });
    extraLink.focus();
    expect(extraLink).toHaveFocus();

    const cta = screen.getByRole('link', { name: 'Dukung Sekarang: Selamatkan Ciliwung (Dana)' });
    expect(cta).toHaveAttribute('aria-label', 'Dukung Sekarang: Selamatkan Ciliwung (Dana)');
    expect(cta).toHaveAttribute('href', DANA.href);
  });

  it('meneruskan handler klik yang dipasang pada pembungkus kartu', () => {
    const onClick = vi.fn();
    const { container } = renderCard();

    const card = container.querySelector('[data-component="campaign-card"]') as HTMLElement;
    card.addEventListener('click', onClick);
    card.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('teks sangat panjang tetap terbaca utuh oleh pembaca layar', () => {
    const longTitle = `Selamatkan ${'Ciliwung '.repeat(30)}`.trim();
    const longDescription = 'Ringkasan kampanye yang panjang. '.repeat(20).trim();
    renderCard({ title: longTitle, description: longDescription });

    expect(screen.getByRole('heading', { name: longTitle })).toBeInTheDocument();
    expect(screen.getByText(longDescription)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /\(Dana\)$/ })).toBeInTheDocument();
  });
});
