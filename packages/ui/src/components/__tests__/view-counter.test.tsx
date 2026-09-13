import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import ViewCounter, { type ViewCounterProps } from '../view-counter';

/** Satu-satunya elemen ber-aria-label utuh milik komponen ini. */
function spokenRow(): HTMLElement {
  const row = screen.getByLabelText(/kali dibaca/);
  return row as HTMLElement;
}

function renderCounter(props: Partial<ViewCounterProps> = {}) {
  return render(<ViewCounter views={1248} {...props} />);
}

describe('ViewCounter — render dasar', () => {
  it('merender jumlah dibaca dengan pemisah ribuan gaya Indonesia', () => {
    renderCounter();

    expect(screen.getByText('1.248')).toBeInTheDocument();
    expect(screen.getByText('kali dibaca')).toBeInTheDocument();
  });

  it('memberi penanda data-slot untuk penargetan gaya', () => {
    const { container } = renderCounter();

    expect(container.firstElementChild).toHaveAttribute('data-slot', 'view-counter');
  });

  it('mengumumkan satu label utuh yang menggabungkan semua fragmen', () => {
    renderCounter({ liveViewers: 37, readMinutes: 4 });

    expect(screen.getByLabelText('1.248 kali dibaca, 4 menit baca, 37 orang sedang membaca'))
      .toBeInTheDocument();
  });

  it('menggabungkan className tambahan ke pembungkus', () => {
    const { container } = renderCounter({ className: 'mt-3' });

    expect(container.firstElementChild).toHaveClass('mt-3');
  });

  it('meneruskan atribut div lainnya ke pembungkus', () => {
    renderCounter({ id: 'meta-views', 'data-testid': 'meta' } as Partial<ViewCounterProps>);

    const wrapper = screen.getByTestId('meta');
    expect(wrapper).toHaveAttribute('id', 'meta-views');
  });
});

describe('ViewCounter — varian & compact', () => {
  it('varian inline tidak memakai permukaan kotak', () => {
    const { container } = renderCounter();

    expect(container.firstElementChild).not.toHaveClass('rounded-xl');
  });

  it('varian standalone memakai kelas permukaan kotak', () => {
    const { container } = renderCounter({ variant: 'standalone' });

    expect(container.firstElementChild).toHaveClass('rounded-xl');
  });

  it('compact menyembunyikan teks "kali dibaca" tetapi angka tetap ada', () => {
    renderCounter({ compact: true });

    expect(screen.queryByText('kali dibaca')).not.toBeInTheDocument();
    expect(screen.getByText('1.248')).toBeInTheDocument();
    // Label pembaca layar tetap utuh demi aksesibilitas.
    expect(screen.getByLabelText('1.248 kali dibaca')).toBeInTheDocument();
  });

  it('decorative menyembunyikan seluruh blok dari pembaca layar', () => {
    const { container } = renderCounter({ decorative: true });

    const row = container.querySelector('p');
    expect(row).toHaveAttribute('aria-hidden', 'true');
    expect(row).not.toHaveAttribute('aria-label');
    // Tidak ada label yang tersisa untuk diumumkan.
    expect(screen.queryByLabelText('1.248 kali dibaca')).not.toBeInTheDocument();
  });

  it('decorative tetap merender teks visual', () => {
    renderCounter({ decorative: true, readMinutes: 3 });

    expect(screen.getByText('1.248')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});

describe('ViewCounter — waktu baca', () => {
  it('menampilkan fragmen menit baca saat nilainya positif', () => {
    renderCounter({ readMinutes: 4 });

    expect(screen.getByText('4')).toBeInTheDocument();
    expect(screen.getByText('menit baca')).toBeInTheDocument();
    expect(screen.getByLabelText('1.248 kali dibaca, 4 menit baca')).toBeInTheDocument();
  });

  it.each([
    ['nol', 0],
    ['negatif', -12],
    ['NaN', Number.NaN],
    ['Infinity', Number.POSITIVE_INFINITY],
    ['undefined', undefined],
  ])('menit baca %s disembunyikan sepenuhnya', (_name, readMinutes) => {
    renderCounter({ readMinutes });

    expect(screen.queryByText('menit baca')).not.toBeInTheDocument();
  });

  it('membulatkan menit desimal ke bawah', () => {
    renderCounter({ readMinutes: 7.9 });

    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('membatasi menit baca pada batas aman 600', () => {
    renderCounter({ readMinutes: 5_000 });

    expect(screen.getByText('600')).toBeInTheDocument();
    expect(screen.queryByText('5.000')).not.toBeInTheDocument();
  });
});

describe('ViewCounter — pembaca aktif', () => {
  it('menampilkan fragmen pembaca aktif saat nilainya positif', () => {
    renderCounter({ liveViewers: 37 });

    expect(screen.getByText('37')).toBeInTheDocument();
    expect(screen.getByText('orang sedang membaca')).toBeInTheDocument();
    expect(screen.getByLabelText('1.248 kali dibaca, 37 orang sedang membaca')).toBeInTheDocument();
  });

  it.each([
    ['nol', 0],
    ['negatif', -3],
    ['NaN', Number.NaN],
    ['undefined', undefined],
  ])('pembaca aktif %s disembunyikan sepenuhnya', (_name, liveViewers) => {
    renderCounter({ liveViewers });

    expect(screen.queryByText('orang sedang membaca')).not.toBeInTheDocument();
  });

  it('membatasi pembaca aktif pada satu juta', () => {
    renderCounter({ liveViewers: 2_500_000 });

    expect(screen.getByText('1.000.000')).toBeInTheDocument();
  });

  it('menggabungkan waktu baca dan pembaca aktif dengan pemisah editorial', () => {
    const { container } = renderCounter({ readMinutes: 4, liveViewers: 37 });

    const separators = container.querySelectorAll('span.select-none');
    expect(separators).toHaveLength(2);
    separators.forEach((separator) => {
      expect(separator).toHaveAttribute('aria-hidden', 'true');
      expect(separator.textContent).toBe('•');
    });
  });

  it('tanpa data opsional tidak ada pemisah sama sekali', () => {
    const { container } = renderCounter();

    expect(container.querySelectorAll('span.select-none')).toHaveLength(0);
  });
});

describe('ViewCounter — kasus batas & pemformatan', () => {
  it.each([
    ['NaN', Number.NaN, '0'],
    ['Infinity', Number.POSITIVE_INFINITY, '0'],
    ['-Infinity', Number.NEGATIVE_INFINITY, '0'],
    ['negatif', -99, '0'],
    ['nol', 0, '0'],
  ] as const)('views %s menjadi %s', (_name, views, expected) => {
    renderCounter({ views });

    expect(screen.getByText(expected)).toBeInTheDocument();
    expect(screen.getByLabelText(`${expected} kali dibaca`)).toBeInTheDocument();
  });

  it('membulatkan views desimal ke bawah (trunc)', () => {
    renderCounter({ views: 4999.99 });

    expect(screen.getByText('4.999')).toBeInTheDocument();
  });

  it('mempertahankan angka besar apa adanya tanpa batas atas', () => {
    renderCounter({ views: 1_000_001 });

    expect(screen.getByText('1.000.001')).toBeInTheDocument();
  });

  it('menangani views satu-satunya elemen (angka terkecil yang bermakna)', () => {
    renderCounter({ views: 1, readMinutes: 1, liveViewers: 1 });

    expect(screen.getByLabelText('1 kali dibaca, 1 menit baca, 1 orang sedang membaca'))
      .toBeInTheDocument();
  });

  it('judul panjang di label tidak merusak pencarian aksesibilitas', () => {
    renderCounter({ views: 987_654 });

    expect(screen.getByLabelText('987.654 kali dibaca')).toBeInTheDocument();
  });

  it('tidak pernah mencetak NaN atau Infinity di DOM', () => {
    const { container } = renderCounter({
      views: Number.NaN,
      readMinutes: Number.POSITIVE_INFINITY,
      liveViewers: Number.NaN,
    });

    expect(container.innerHTML).not.toContain('NaN');
    expect(container.innerHTML).not.toContain('Infinity');
  });

  it('jatuh ke String(safe) bila Intl gagal memformat', () => {
    // `format` adalah accessor pada prototype, jadi `vi.spyOn` tidak bisa
    // membungkusnya; pasang properti milik sendiri di atas instance prototype.
    const original = Reflect.getOwnPropertyDescriptor(
      Intl.NumberFormat.prototype,
      'format',
    );
    Object.defineProperty(Intl.NumberFormat.prototype, 'format', {
      configurable: true,
      writable: true,
      value: () => {
        throw new RangeError('locale data tidak tersedia');
      },
    });
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      renderCounter({ views: 4321 });

      // Tanpa jaring pengaman, render akan melempar dan test ini gagal.
      expect(screen.getByText('4321')).toBeInTheDocument();
      expect(screen.getByLabelText('4321 kali dibaca')).toBeInTheDocument();
    } finally {
      if (original) Object.defineProperty(Intl.NumberFormat.prototype, 'format', original);
      else delete (Intl.NumberFormat.prototype as { format?: unknown }).format;
      consoleSpy.mockRestore();
    }
  });
});

describe('ViewCounter — struktur ikon', () => {
  it('ikon dekoratif tidak dapat difokuskan dan ikut warna teks', () => {
    const { container } = renderCounter({ readMinutes: 2 });

    const icons = container.querySelectorAll('svg');
    expect(icons).toHaveLength(2);
    icons.forEach((icon) => {
      expect(icon).toHaveAttribute('focusable', 'false');
      // Ikon tidak fokusabel; teks visualnya sendiri yang menerima aria-hidden dari induk.
      expect(icon).toHaveAttribute('stroke', 'currentColor');
    });
    // Seluruh baris visual disembunyikan lewat satu aria-label di <p>.
    container.querySelectorAll('svg').forEach((icon) => {
      expect(icon.closest('[aria-label]')).not.toBeNull();
    });
  });

  it('indikator pembaca aktif disembunyikan dari pembaca layar', () => {
    const { container } = renderCounter({ liveViewers: 12 });

    const dot = container.querySelector('span.relative.flex.h-2');
    expect(dot).toHaveAttribute('aria-hidden', 'true');
  });
});

describe('ViewCounter — kontrak aksesibilitas', () => {
  it('mengekspos satu baris berlabel, bukan fragmen terpisah', () => {
    renderCounter({ readMinutes: 4, liveViewers: 37 });

    expect(screen.getAllByLabelText(/kali dibaca/)).toHaveLength(1);
    expect(screen.queryByLabelText(/^4/)).not.toBeInTheDocument();
  });

  it('label yang dibacakan mengikuti urutan visual', () => {
    renderCounter({ readMinutes: 4, liveViewers: 37 });

    expect(spokenRow().getAttribute('aria-label')).toBe(
      '1.248 kali dibaca, 4 menit baca, 37 orang sedang membaca',
    );
  });
});
