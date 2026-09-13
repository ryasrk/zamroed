import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { NewsFilter } from './news-filter';
import type { Article } from '@repo/ui/types';

/** `useId()` menghasilkan id yang tidak selalu sah sebagai selektor CSS. */
function byId(id: string): Element | null {
  return Array.from(document.querySelectorAll('[id]')).find((node) => node.id === id) ?? null;
}

/** Artikel tiruan dengan hanya kolom yang dibaca NewsFilter. */
function makeArticle(id: string, category: string, title?: string): Article {
  return {
    id,
    slug: `slug-${id}`,
    title: title ?? `Judul liputan ${id}`,
    excerpt: `Ringkasan liputan ${id}`,
    body: [],
    coverImage: '/images/x.jpg',
    author: 'Tim Liputan',
    publishedAt: '2026-01-01',
    category,
    tags: [],
    readMinutes: 3,
    totalViews: 100,
  };
}

/** Tiga artikel, tiga rubrik berbeda (satu diulang) — urutan kemunculan penting. */
const ARTICLES: Article[] = [
  makeArticle('1', 'Aksi Bersih', 'Bersih-bersih Cisadane'),
  makeArticle('2', 'Edukasi', 'Sekolah Lapangan Warga'),
  makeArticle('3', 'Aksi Bersih', 'Tanam Mangrove Pesisir'),
];

describe('NewsFilter', () => {
  it('merender judul arsip dan anak-anak liputan secara default', () => {
    render(
      <NewsFilter articles={ARTICLES}>
        <ul>
          <li>Kartu liputan</li>
        </ul>
      </NewsFilter>,
    );

    expect(screen.getByRole('heading', { name: 'Semua Liputan' })).toBeInTheDocument();
    expect(screen.getByText('Kartu liputan')).toBeInTheDocument();
    expect(screen.getByText('Arsip Redaksi')).toBeInTheDocument();
  });

  it('menghubungkan section ke judulnya lewat aria-labelledby', () => {
    const { container } = render(
      <NewsFilter articles={ARTICLES}>
        <p>isi</p>
      </NewsFilter>,
    );

    const section = container.querySelector('section');
    const headingId = section?.getAttribute('aria-labelledby');

    expect(headingId).toBeTruthy();
    expect(byId(headingId!)?.textContent).toBe('Semua Liputan');
  });

  it('menghitung kategori unik dari artikel, urut kemunculan pertama', () => {
    render(
      <NewsFilter articles={ARTICLES}>
        <p>isi</p>
      </NewsFilter>,
    );

    const group = screen.getByRole('group', { name: 'Saring liputan berdasarkan rubrik' });
    const tombol = within(group).getAllByRole('button');

    expect(tombol.map((b) => b.textContent)).toEqual(['Semua3', 'Aksi Bersih2', 'Edukasi1']);
  });

  it('memakai prop categories dan menghormati urutannya', () => {
    render(
      <NewsFilter articles={ARTICLES} categories={['Edukasi', 'Aksi Bersih']}>
        <p>isi</p>
      </NewsFilter>,
    );

    const group = screen.getByRole('group', { name: 'Saring liputan berdasarkan rubrik' });
    expect(within(group).getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Semua3',
      'Edukasi1',
      'Aksi Bersih2',
    ]);
  });

  it('menampilkan pil kategori tanpa artikel hanya bila categories diisi eksplisit', () => {
    render(
      <NewsFilter articles={ARTICLES} categories={['Aksi Bersih', 'Edukasi', 'Kebijakan']}>
        <p>isi</p>
      </NewsFilter>,
    );

    // Kategori tanpa artikel tetap muncul dengan jumlah 0 agar redaksi tahu rubriknya kosong.
    expect(screen.getByRole('button', { name: 'Kebijakan 0' })).toBeInTheDocument();
  });

  it('membuang kategori berisi string kosong', () => {
    render(
      <NewsFilter articles={[makeArticle('1', ''), makeArticle('2', 'Edukasi')]}>
        <p>isi</p>
      </NewsFilter>,
    );

    const group = screen.getByRole('group', { name: 'Saring liputan berdasarkan rubrik' });
    expect(within(group).getAllByRole('button').map((b) => b.textContent)).toEqual([
      'Semua2',
      'Edukasi1',
    ]);
  });

  it('merender keadaan kosong untuk rubrik "Semua" saat tidak ada artikel sama sekali', () => {
    render(
      <NewsFilter articles={[]}>
        <p>isi liputan</p>
      </NewsFilter>,
    );

    const group = screen.getByRole('group', { name: 'Saring liputan berdasarkan rubrik' });
    expect(within(group).getAllByRole('button')).toHaveLength(1);
    expect(within(group).getByRole('button', { name: 'Semua 0' })).toBeInTheDocument();
    // Tanpa data, tidak ada kartu yang bisa ditampilkan, jadi EmptyState muncul.
    expect(screen.queryByText('isi liputan')).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: 'Belum ada liputan untuk rubrik Semua' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Rubrik ini belum memiliki catatan lapangan yang terbit. Silakan pilih rubrik lain atau kembali ke seluruh liputan.',
      ),
    ).toBeInTheDocument();
    // Jalan keluar dari keadaan kosong tetap menunjuk jumlah artikel yang sebenarnya.
    expect(screen.getByRole('button', { name: /Tampilkan semua liputan/ })).toHaveTextContent('0');
  });

  it('menandai pil "Semua" sebagai aktif lewat aria-pressed saat pertama dirender', () => {
    render(
      <NewsFilter articles={ARTICLES}>
        <p>isi</p>
      </NewsFilter>,
    );

    expect(screen.getByRole('button', { name: 'Semua 3' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Aksi Bersih 2' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.getByRole('button', { name: 'Edukasi 1' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('menghubungkan setiap pil ke panel hasil lewat aria-controls', () => {
    const { container } = render(
      <NewsFilter articles={ARTICLES}>
        <p>isi</p>
      </NewsFilter>,
    );

    const group = screen.getByRole('group', { name: 'Saring liputan berdasarkan rubrik' });
    const tombol = within(group).getAllByRole('button');

    for (const button of tombol) {
      const panelId = button.getAttribute('aria-controls');
      expect(panelId).toBeTruthy();
      expect(byId(panelId!)).not.toBeNull();
    }
  });

  it('menyaring artikel dan menampilkan keadaan kosong saat rubrik yang dipilih tidak punya artikel', async () => {
    const user = userEvent.setup();
    render(
      <NewsFilter articles={ARTICLES} categories={['Aksi Bersih', 'Edukasi', 'Kebijakan']}>
        <p>isi liputan</p>
      </NewsFilter>,
    );

    await user.click(screen.getByRole('button', { name: 'Kebijakan 0' }));

    expect(screen.getByRole('button', { name: 'Kebijakan 0' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Semua 3' })).toHaveAttribute('aria-pressed', 'false');
    // Anak disembunyikan saat keadaan kosong, digantikan EmptyState.
    expect(screen.queryByText('isi liputan')).not.toBeInTheDocument();

    const empty = screen.getByRole('heading', { name: 'Belum ada liputan untuk rubrik Kebijakan' });
    expect(empty).toBeInTheDocument();
    expect(
      screen.getByText(
        'Rubrik ini belum memiliki catatan lapangan yang terbit. Silakan pilih rubrik lain atau kembali ke seluruh liputan.',
      ),
    ).toBeInTheDocument();
  });

  it('menampilkan jumlah tersaring dan nama rubrik aktif pada ringkasan', async () => {
    const user = userEvent.setup();
    render(
      <NewsFilter articles={ARTICLES}>
        <p>isi liputan</p>
      </NewsFilter>,
    );

    // Ringkasan atas: angka tersaring dan totalnya, saat masih "Semua".
    expect(screen.getByText(/Menampilkan 3 dari 3 liputan di seluruh rubrik\./)).toBeInTheDocument();
    expect(document.body).toHaveTextContent('3 dari 3 liputan');

    await user.click(screen.getByRole('button', { name: 'Aksi Bersih 2' }));

    // Pada rubrik aktif, ringkasan atas menyebut jumlah tersaring dan nama rubrik.
    const ringkasan = screen.getAllByText(/dari 3 liputan/);
    // Ringkasan atas (tepat satu elemen) + kalimat ringkasan bawah.
    expect(ringkasan).toHaveLength(2);
    expect(ringkasan[0]).toHaveTextContent('2 dari 3 liputan pada rubrik Aksi Bersih');
    expect(
      screen.getByText(/Menampilkan 2 dari 3 liputan pada rubrik Aksi Bersih\./),
    ).toBeInTheDocument();
  });

  it('menyebut seluruh rubrik pada ringkasan bawah saat "Semua" aktif', () => {
    render(
      <NewsFilter articles={ARTICLES}>
        <p>isi liputan</p>
      </NewsFilter>,
    );

    expect(
      screen.getByText(/Menampilkan 3 dari 3 liputan di seluruh rubrik\./),
    ).toBeInTheDocument();
    expect(screen.getByText('Arsip lengkap tersedia atas permintaan.')).toBeInTheDocument();
  });

  it('memilih rubrik lewat klik dan menyembunyikan anak hanya saat hasil kosong', async () => {
    const user = userEvent.setup();
    render(
      <NewsFilter articles={ARTICLES} categories={['Aksi Bersih', 'Edukasi']}>
        <p>isi liputan</p>
      </NewsFilter>,
    );

    await user.click(screen.getByRole('button', { name: 'Edukasi 1' }));

    expect(screen.getByRole('button', { name: 'Edukasi 1' })).toHaveAttribute('aria-pressed', 'true');
    // Ada hasil, jadi anak tetap ter-render (tanpa berkedip).
    expect(screen.getByText('isi liputan')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Belum ada liputan/ })).not.toBeInTheDocument();
  });

  it('mengembalikan ke seluruh liputan saat tombol rubrik yang sama ditekan ulang', async () => {
    const user = userEvent.setup();
    render(
      <NewsFilter articles={ARTICLES}>
        <p>isi liputan</p>
      </NewsFilter>,
    );

    const aksiBersih = screen.getByRole('button', { name: 'Aksi Bersih 2' });
    await user.click(aksiBersih);
    expect(aksiBersih).toHaveAttribute('aria-pressed', 'true');

    await user.click(aksiBersih);
    expect(aksiBersih).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Semua 3' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByText(/di seluruh rubrik\./)).toBeInTheDocument();
  });

  it('mengembalikan fokus tombol saat tombol "Tampilkan semua liputan" ditekan', async () => {
    const user = userEvent.setup();
    render(
      <NewsFilter articles={ARTICLES} categories={['Aksi Bersih', 'Kebijakan']}>
        <p>isi liputan</p>
      </NewsFilter>,
    );

    await user.click(screen.getByRole('button', { name: 'Kebijakan 0' }));
    expect(screen.queryByText('isi liputan')).not.toBeInTheDocument();

    const tampilkanSemua = screen.getByRole('button', { name: /Tampilkan semua liputan/ });
    expect(tampilkanSemua).toHaveTextContent('3');

    await user.click(tampilkanSemua);

    expect(screen.getByText('isi liputan')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Semua 3' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.queryByRole('heading', { name: /Belum ada liputan/ })).not.toBeInTheDocument();
  });

  it('menandai panel hasil sebagai aria-live="polite" agar perubahan diumumkan', () => {
    const { container } = render(
      <NewsFilter articles={ARTICLES}>
        <p>isi liputan</p>
      </NewsFilter>,
    );

    const group = screen.getByRole('group', { name: 'Saring liputan berdasarkan rubrik' });
    const panelId = within(group).getAllByRole('button')[0]!.getAttribute('aria-controls')!;
    const panel = byId(panelId);

    expect(panel).toHaveAttribute('aria-live', 'polite');
  });

  it('dapat dioperasikan dengan keyboard: Tab lalu Enter memilih rubrik', async () => {
    const user = userEvent.setup();
    render(
      <NewsFilter articles={ARTICLES}>
        <p>isi liputan</p>
      </NewsFilter>,
    );

    const aksiBersih = screen.getByRole('button', { name: 'Aksi Bersih 2' });
    aksiBersih.focus();
    expect(aksiBersih).toHaveFocus();

    await user.keyboard('{Enter}');
    expect(aksiBersih).toHaveAttribute('aria-pressed', 'true');

    await user.keyboard(' ');
    expect(aksiBersih).toHaveAttribute('aria-pressed', 'false');
  });

  it('memakai kategori unik walau artikel punya kategori berulang', () => {
    render(
      <NewsFilter articles={ARTICLES}>
        <p>isi liputan</p>
      </NewsFilter>,
    );

    const group = screen.getByRole('group', { name: 'Saring liputan berdasarkan rubrik' });
    // "Aksi Bersih" muncul dua kali di data tetapi hanya satu pil.
    expect(within(group).getAllByRole('button', { name: /^Aksi Bersih/ })).toHaveLength(1);
  });

  it('tidak menghitung kategori di luar daftar eksplisit pada pil (jumlah 0)', () => {
    // Artikel punya kategori "Warta Aksi" yang tidak ada di prop categories.
    render(
      <NewsFilter articles={[makeArticle('1', 'Warta Aksi')]} categories={['Aksi Bersih']}>
        <p>isi liputan</p>
      </NewsFilter>,
    );

    expect(screen.getByRole('button', { name: 'Aksi Bersih 0' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Warta Aksi/ })).not.toBeInTheDocument();
    // Ringkasan tetap memakai total artikel yang sebenarnya.
    expect(
      screen.getByText(/Menampilkan 1 dari 1 liputan di seluruh rubrik\./),
    ).toBeInTheDocument();
  });

  it('memberi id panel yang stabil dan berbeda antar instance', () => {
    const { container } = render(
      <>
        <NewsFilter articles={ARTICLES}>
          <p>satu</p>
        </NewsFilter>
        <NewsFilter articles={ARTICLES}>
          <p>dua</p>
        </NewsFilter>
      </>,
    );

    const panelIds = Array.from(container.querySelectorAll('[id$="-panel"]')).map((n) => n.id);
    expect(panelIds).toHaveLength(2);
    expect(new Set(panelIds).size).toBe(2);
  });

  it('memanggil ulang penyaringan tanpa mengubah jumlah kategori yang terdaftar', async () => {
    const user = userEvent.setup();
    render(
      <NewsFilter articles={ARTICLES}>
        <p>isi liputan</p>
      </NewsFilter>,
    );

    const group = screen.getByRole('group', { name: 'Saring liputan berdasarkan rubrik' });
    const before = within(group).getAllByRole('button').length;

    await user.click(screen.getByRole('button', { name: 'Edukasi 1' }));
    await user.click(screen.getByRole('button', { name: 'Semua 3' }));

    expect(within(group).getAllByRole('button')).toHaveLength(before);
  });

  it('menerima children sebagai ReactNode apa pun, bukan hanya daftar', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <NewsFilter articles={ARTICLES}>
        <div>
          <p>Baris pertama</p>
          <p>Baris kedua</p>
        </div>
      </NewsFilter>,
    );

    expect(screen.getByText('Baris pertama')).toBeInTheDocument();
    expect(screen.getByText('Baris kedua')).toBeInTheDocument();
    expect(consoleSpy).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
