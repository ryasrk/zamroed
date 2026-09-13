import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { VolunteerForm } from './volunteer-form';
import { DIVISIONS } from './divisions';

/**
 * `VolunteerForm` is the only client component on the volunteer page: it owns
 * every interactive branch, so these tests drive the real DOM contract —
 * labels, roles, Indonesian validation copy, the success card and the reset.
 *
 * jsdom gives zero layout, so nothing here asserts on Tailwind classes. What is
 * asserted is what a volunteer (or a screen reader) can actually observe:
 * accessible names, `aria-invalid` / `aria-describedby` wiring, `role="alert"`
 * announcements, the 2-division cap, and the 900 ms simulated submit.
 */

type User = ReturnType<typeof userEvent.setup>;

/**
 * The visible "Periksa kembali sebelum mengirim:" block, excluding the sr-only
 * twin and the per-field Select messages (which also carry `role="alert"`).
 * It is the last alert in the form footer, so it is located structurally.
 */
function errorBlock(): HTMLElement {
  const footer = document.querySelector('[data-slot="card-footer"]');
  expect(footer, 'formulir harus punya card-footer').not.toBeNull();
  return footer!.querySelector('p[role="alert"]') as HTMLElement;
}

/** The sr-only live region that names the section the volunteer must fix. */
function srOnlyAlert(): HTMLElement {
  const candidates = screen
    .getAllByRole('alert')
    .filter((el) => el.className.includes('sr-only'));
  expect(candidates).toHaveLength(1);
  return candidates[0];
}

/**
 * The outer `<fieldset>` for the division group. `CheckboxGroup` nests a layout
 * `<div role="group">` inside it, so a bare `getByRole('group')` is ambiguous.
 */
function divisionFieldset(): HTMLFieldSetElement {
  const found = screen
    .getAllByRole('group', { name: /Divisi yang diminati/ })
    .find((node) => node.tagName === 'FIELDSET');
  if (!found) throw new Error('fieldset divisi tidak ditemukan');
  return found as HTMLFieldSetElement;
}

const nama = () => screen.getByLabelText(/Nama Lengkap/) as HTMLInputElement;
const whatsapp = () => screen.getByLabelText(/WhatsApp/) as HTMLInputElement;
const email = () => screen.getByLabelText(/Email/) as HTMLInputElement;
const domisili = () => screen.getByLabelText(/Kota atau Provinsi/) as HTMLSelectElement;
const ketersediaan = () => screen.getByLabelText(/Ketersediaan waktu/) as HTMLSelectElement;
const keahlian = () => screen.getByLabelText(/Pengalaman atau keahlian/) as HTMLTextAreaElement;
const komitmen = () =>
  screen.getByRole('checkbox', { name: /Saya menyatakan bersedia/ }) as HTMLInputElement;
const submitButton = () => screen.getByRole('button', { name: /Kirim Pendaftaran/ });

/**
 * Option checkbox for a division, matched on the leading title (description follows).
 * String titles are escaped so titles containing parentheses behave as literals.
 */
function divisionBox(title: string | RegExp) {
  const pattern =
    typeof title === 'string' ? new RegExp('^' + title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) : title;
  return screen.getByRole('checkbox', { name: pattern }) as HTMLInputElement;
}

/** Fills the four identity fields with valid values. */
async function fillIdentity(user: User, overrides: Partial<Record<'nama' | 'whatsapp' | 'email' | 'domisili', string>> = {}) {
  await user.type(nama(), overrides.nama ?? 'Sari Puspita');
  await user.type(whatsapp(), overrides.whatsapp ?? '81234567890');
  await user.type(email(), overrides.email ?? 'sari@email.com');
  await user.selectOptions(domisili(), overrides.domisili ?? 'Bandung');
}

/** Everything the form needs except the identity fields. */
async function fillRemainder(user: User) {
  await user.click(divisionBox('Aksi Lapangan dan Logistik'));
  await user.selectOptions(ketersediaan(), 'Akhir pekan');
  await user.type(keahlian(), 'Perawat puskesmas, biasa membantu posko banjir.');
  await user.click(komitmen());
}

/** Valid in every field. */
async function fillAll(user: User) {
  await fillIdentity(user);
  await fillRemainder(user);
}

describe('VolunteerForm — render awal', () => {
  it('merender formulir dengan judul bagian berurutan dan field wajib berlabel', () => {
    render(<VolunteerForm />);

    expect(document.querySelectorAll('form')).toHaveLength(1);

    // Empat bagian: data diri, divisi, waktu/bekal, lalu komitmen kode etik.
    expect(screen.getByText('Data diri')).toBeInTheDocument();
    expect(divisionFieldset()).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Komitmen kode etik gerakan' })).toBeInTheDocument();

    // Setiap kontrol dapat dijangkau lewat labelnya sendiri. Empat field
    // identitas/ketersediaan memakai atribut `required` bawaan; textarea
    // sengaja tidak, karena panjangnya divalidasi saat kirim.
    for (const field of [nama(), whatsapp(), email(), domisili(), ketersediaan()]) {
      expect(field).toBeInTheDocument();
      expect(field).toBeRequired();
    }
    expect(keahlian()).toBeInTheDocument();
    expect(keahlian()).not.toBeRequired();
    expect(komitmen()).toBeRequired();
  });

  it('menampilkan pengantar privasi dan jaminan tanpa biaya', () => {
    render(<VolunteerForm />);

    expect(
      screen.getByText(/Koordinator memakai data ini hanya untuk verifikasi keanggotaan/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Tidak ada biaya pendaftaran dan tidak ada berkas yang perlu diunggah\./),
    ).toBeInTheDocument();
  });

  it('membangun pilihan divisi dari tabel DIVISIONS, bukan daftar terpisah', () => {
    render(<VolunteerForm />);

    expect(screen.getAllByRole('checkbox')).toHaveLength(DIVISIONS.length + 1);
    for (const division of DIVISIONS) {
      const box = divisionBox(division.title);
      expect(box).toHaveAttribute('value', division.slug);
      // Ringkasan divisi ikut tampil agar pilihan dapat dinilai tanpa membuka menu.
      expect(screen.getByText(division.summary)).toBeInTheDocument();
    }
  });

  it('menawarkan seluruh kota dan provinsi pada dropdown domisili', () => {
    render(<VolunteerForm />);

    const options = Array.from(domisili().options).map((option) => option.textContent);
    expect(options).toHaveLength(34); // satu placeholder + 33 wilayah
    expect(options[0]).toBe('Pilih kota atau provinsi');
    expect(domisili().options[0].disabled).toBe(true);
    expect(options).toContain('Jakarta');
    expect(options).toContain('Papua');
    expect(options).toContain('Nusa Tenggara Timur');
  });

  it('menawarkan empat ketersediaan waktu dengan placeholder terpisah', () => {
    render(<VolunteerForm />);

    const options = Array.from(ketersediaan().options).map((option) => option.textContent);
    expect(options).toEqual([
      'Pilih kesediaan waktu',
      'Akhir pekan',
      'Hari kerja',
      'Fleksibel',
      'Kapan saja saat darurat',
    ]);
  });

  it('memulai tanpa galat: tidak ada aria-invalid maupun pesan galat', () => {
    render(<VolunteerForm />);

    for (const field of [nama(), whatsapp(), email(), domisili(), ketersediaan(), keahlian()]) {
      expect(field).not.toHaveAttribute('aria-invalid');
    }
    expect(errorBlock()).toHaveTextContent('');
    expect(srOnlyAlert()).toHaveTextContent('');
  });

  it('menyatakan setiap field wajib tanpa hanya mengandalkan tanda bintang', () => {
    render(<VolunteerForm />);

    // Label wajib membawa padanan teks, bukan sekadar asterisk berwarna.
    // Tiga field Input berbagi frasa yang sama, jadi jumlahnya ikut diperiksa.
    expect(screen.getAllByText('(wajib diisi)')).toHaveLength(3);
    expect(screen.getAllByText('(wajib dipilih)')).toHaveLength(2);
    expect(screen.getByText('(wajib dipilih minimal satu)')).toBeInTheDocument();
    expect(nama()).toHaveAttribute('aria-required', 'true');
    expect(komitmen()).toBeRequired();
  });

  it('menghubungkan field data diri ke blok galat lewat aria-describedby', () => {
    render(<VolunteerForm />);

    for (const field of [nama(), whatsapp(), email(), keahlian()]) {
      const id = field.getAttribute('aria-describedby');
      expect(id, 'field harus punya aria-describedby').toBeTruthy();
      expect(document.getElementById(id!)).not.toBeNull();
    }
    // Divisi menjelaskan dirinya lewat petunjuk maksimal dua pilihan.
    expect(screen.getByText('Maksimal 2 pilihan')).toBeInTheDocument();
  });

  it('menampilkan lima butir kode etik yang dapat dibaca satu per satu', () => {
    render(<VolunteerForm />);

    const list = screen.getByRole('list');
    const items = within(list).getAllByRole('listitem');
    expect(items).toHaveLength(5);
    expect(items[0]).toHaveTextContent(/Menjaga keselamatan warga, rekan relawan, dan diri sendiri/);
    expect(items[4]).toHaveTextContent(/Memegang rahasia identitas narasumber yang meminta perlindungan/);
  });
});

describe('VolunteerForm — galat validasi (Bahasa Indonesia)', () => {
  it('menolak kirim kosong dan menandai setiap field yang belum diisi', async () => {
    const user = userEvent.setup();
    render(<VolunteerForm />);

    await user.click(submitButton());

    expect(nama()).toHaveAttribute('aria-invalid', 'true');
    expect(whatsapp()).toHaveAttribute('aria-invalid', 'true');
    expect(email()).toHaveAttribute('aria-invalid', 'true');
    expect(domisili()).toHaveAttribute('aria-invalid', 'true');
    expect(ketersediaan()).toHaveAttribute('aria-invalid', 'true');
    expect(keahlian()).toHaveAttribute('aria-invalid', 'true');

    const block = errorBlock();
    expect(block).toHaveTextContent('Periksa kembali sebelum mengirim:');
    expect(block).toHaveTextContent('Nama lengkap wajib diisi.');
    expect(block).toHaveTextContent('Nomor WhatsApp wajib diisi.');
    expect(block).toHaveTextContent('Email wajib diisi.');
    expect(block).toHaveTextContent('Pilih kota atau provinsi tempatmu berdomisili.');
    expect(block).toHaveTextContent('Pilih satu ketersediaan waktu.');
    expect(block).toHaveTextContent('Ceritakan sedikit lebih lengkap — minimal 20 karakter.');
    expect(block).toHaveTextContent('Komitmen kode etik wajib dicentang sebelum mengirim.');
  });

  it('mengumumkan area galat pertama lewat live region di urutan atas ke bawah', async () => {
    const user = userEvent.setup();
    render(<VolunteerForm />);

    await user.click(submitButton());
    expect(srOnlyAlert()).toHaveTextContent(
      'Formulir belum lengkap. Periksa nama, nomor WhatsApp, email, dan domisili.',
    );

    // Lengkapi identitas saja → galat berpindah ke area divisi.
    await fillIdentity(user);
    await user.click(submitButton());
    expect(srOnlyAlert()).toHaveTextContent('Pilih minimal satu divisi yang diminati.');
    expect(errorBlock()).toHaveTextContent(
      'Pilih minimal satu divisi — boleh satu saja, dan boleh berubah setelah induksi.',
    );

    // Tambah divisi dan ketersediaan → galat berpindah ke area keahlian.
    await user.click(divisionBox('Aksi Lapangan dan Logistik'));
    await user.selectOptions(ketersediaan(), 'Akhir pekan');
    await user.click(submitButton());
    expect(srOnlyAlert()).toHaveTextContent(
      'Periksa ketersediaan waktu, pengalaman atau keahlian, dan komitmen kode etik.',
    );
  });

  it('menandai grup divisi sebagai tidak sah saat itulah galat yang aktif', async () => {
    const user = userEvent.setup();
    render(<VolunteerForm />);

    await fillIdentity(user);
    await user.click(submitButton());

    expect(divisionFieldset()).toHaveAttribute('aria-invalid', 'true');
    // Pesan galat divisi muncul dua kali: di dalam grup dan di ringkasan galat.
    expect(screen.getAllByText(/Pilih minimal satu divisi — boleh satu saja/)).toHaveLength(2);

    // Memilih divisi mengubah nilai, tetapi `errorArea` baru dihitung ulang saat
    // kirim berikutnya — jadi penanda galat grup bertahan sampai itu terjadi.
    await user.click(divisionBox('Aksi Lapangan dan Logistik'));
    expect(divisionBox('Aksi Lapangan dan Logistik')).toBeChecked();
    expect(divisionFieldset()).toHaveAttribute('aria-invalid', 'true');

    await user.click(submitButton());
    expect(divisionFieldset()).not.toHaveAttribute('aria-invalid');
  });

  it('menolak nama yang hanya berisi spasi', async () => {
    const user = userEvent.setup();
    render(<VolunteerForm />);

    await user.type(nama(), '   ');
    await user.click(submitButton());

    expect(errorBlock()).toHaveTextContent('Nama lengkap wajib diisi.');
  });

  it('meminta nama minimal tiga karakter', async () => {
    const user = userEvent.setup();
    render(<VolunteerForm />);

    await user.type(nama(), 'Ab');
    await user.click(submitButton());

    expect(errorBlock()).toHaveTextContent('Tuliskan nama lengkap minimal 3 karakter.');
  });

  it('menerima nama tepat tiga karakter sebagai batas bawah yang sah', async () => {
    const user = userEvent.setup();
    render(<VolunteerForm />);

    await user.type(nama(), 'Ali');
    await user.click(submitButton());

    expect(errorBlock()).not.toHaveTextContent('Tuliskan nama lengkap');
    expect(nama()).not.toHaveAttribute('aria-invalid');
  });

  it('menerima nama yang sangat panjang tanpa memotongnya', async () => {
    const user = userEvent.setup();
    render(<VolunteerForm />);

    const longName = 'A'.repeat(300);
    await user.type(nama(), longName);
    await user.click(submitButton());

    expect(errorBlock()).not.toHaveTextContent('Tuliskan nama lengkap');
    expect(nama()).toHaveValue(longName);
  });

  it('menolak nomor WhatsApp yang diawali 0', async () => {
    const user = userEvent.setup();
    render(<VolunteerForm />);

    await user.type(whatsapp(), '081234567890');
    await user.click(submitButton());

    expect(errorBlock()).toHaveTextContent(
      'Masukkan nomor tanpa angka 0 atau +62 di depan, mis. 81234567890.',
    );
    expect(whatsapp()).toHaveAttribute('aria-invalid', 'true');
  });

  it('menolak nomor tanpa awalan 8 dan nomor yang terlalu pendek', async () => {
    const user = userEvent.setup();
    render(<VolunteerForm />);

    await user.type(whatsapp(), '81234567'); // 8 digit, kurang dari minimal 9
    await user.click(submitButton());
    expect(errorBlock()).toHaveTextContent('Masukkan nomor tanpa angka 0 atau +62 di depan');

    await user.clear(whatsapp());
    await user.type(whatsapp(), '71234567890'); // panjang cukup, tetapi tidak diawali 8
    await user.click(submitButton());
    expect(errorBlock()).toHaveTextContent('Masukkan nomor tanpa angka 0 atau +62 di depan');
  });

  it('menerima nomor 13 digit yang sah tetapi menolak 14 digit', async () => {
    const user = userEvent.setup();
    render(<VolunteerForm />);

    await user.type(nama(), 'Sari Puspita');
    await user.type(email(), 'sari@email.com');
    await user.selectOptions(domisili(), 'Bandung');
    await user.click(divisionBox('Aksi Lapangan dan Logistik'));
    await user.selectOptions(ketersediaan(), 'Akhir pekan');
    await user.type(keahlian(), 'Perawat puskesmas, biasa membantu posko banjir.');
    await user.click(komitmen());

    await user.type(whatsapp(), '8'.repeat(13));
    await user.click(submitButton());
    // Batas atas sah: submit berjalan sampai keadaan "Mengirim…".
    expect(await screen.findByRole('button', { name: /Mengirim/ })).toHaveAttribute(
      'aria-busy',
      'true',
    );
  });

  it('membersihkan nomor dari spasi dan tanda hubung saat diketik', async () => {
    const user = userEvent.setup();
    render(<VolunteerForm />);

    // onChange hanya menyimpan digit, sehingga pemisah tidak pernah sampai ke validasi.
    await user.type(whatsapp(), '8123-4567-890');
    expect(whatsapp()).toHaveValue('81234567890');

    await user.click(submitButton());
    // Nomor hasil bersih sah dan tidak boleh memunculkan galat nomor.
    expect(errorBlock()).not.toHaveTextContent('Masukkan nomor tanpa angka 0');
  });

  it('menolak format email tanpa domain dan tanpa titik', async () => {
    const user = userEvent.setup();
    render(<VolunteerForm />);

    await user.type(email(), 'sari@email');
    await user.click(submitButton());
    expect(errorBlock()).toHaveTextContent('Format email belum benar, mis. nama@email.com.');

    await user.clear(email());
    await user.type(email(), 'sari@email.c'); // TLD satu huruf ditolak pola.
    await user.click(submitButton());
    expect(errorBlock()).toHaveTextContent('Format email belum benar, mis. nama@email.com.');
  });

  it('menolak email berisi spasi', async () => {
    const user = userEvent.setup();
    render(<VolunteerForm />);

    await user.type(email(), 'sari puspita@email.com');
    await user.click(submitButton());

    expect(errorBlock()).toHaveTextContent('Format email belum benar, mis. nama@email.com.');
  });

  it('meminta minimal dua puluh karakter pengalaman, menghitung setelah trim', async () => {
    const user = userEvent.setup();
    render(<VolunteerForm />);

    await user.type(keahlian(), 'abcde');
    await user.click(submitButton());
    expect(errorBlock()).toHaveTextContent(
      'Ceritakan sedikit lebih lengkap — minimal 20 karakter.',
    );

    // 19 karakter + spasi tidak boleh lolos.
    await user.clear(keahlian());
    await user.type(keahlian(), 'x'.repeat(19) + '   ');
    await user.click(submitButton());
    expect(errorBlock()).toHaveTextContent(
      'Ceritakan sedikit lebih lengkap — minimal 20 karakter.',
    );
  });

  it('menghitung sisa karakter dengan pemisah ribuan Bahasa Indonesia', async () => {
    const user = userEvent.setup();
    render(<VolunteerForm />);

    // Kosong: kurang 20 karakter.
    expect(
      screen.getByText('20 karakter lagi agar dapat ditinjau koordinator.'),
    ).toBeInTheDocument();

    await user.type(keahlian(), 'abcde');
    expect(
      screen.getByText('15 karakter lagi agar dapat ditinjau koordinator.'),
    ).toBeInTheDocument();

    // Terpenuhi: penghitung menghilang, bukan menampilkan angka negatif.
    await user.type(keahlian(), 'x'.repeat(15));
    expect(
      screen.queryByText(/karakter lagi agar dapat ditinjau koordinator\./),
    ).not.toBeInTheDocument();
  });

  it('menyembunyikan galat field begitu nilainya diubah', async () => {
    const user = userEvent.setup();
    render(<VolunteerForm />);

    await user.click(submitButton());
    expect(errorBlock()).toHaveTextContent('Nama lengkap wajib diisi.');

    await user.type(nama(), 'Sari');

    expect(nama()).not.toHaveAttribute('aria-invalid');
    expect(errorBlock()).not.toHaveTextContent('Nama lengkap wajib diisi.');
  });

  it('menghapus galat lewat penghitung sisa setelah teks mencukupi', async () => {
    const user = userEvent.setup();
    render(<VolunteerForm />);

    await user.type(keahlian(), 'pendek');
    await user.click(submitButton());
    expect(keahlian()).toHaveAttribute('aria-invalid', 'true');

    await user.type(keahlian(), ' tapi lengkap sekarang dan jelas');
    expect(keahlian()).not.toHaveAttribute('aria-invalid');
  });

  it('menghubungkan pesan galat ke field lewat aria-describedby', async () => {
    const user = userEvent.setup();
    render(<VolunteerForm />);

    await user.click(submitButton());

    const describedBy = nama().getAttribute('aria-describedby')!;
    expect(describedBy).toBeTruthy();
    const target = document.getElementById(describedBy);
    expect(target).not.toBeNull();
    expect(target).toHaveAttribute('role', 'alert');
  });
});

describe('VolunteerForm — batas divisi', () => {
  it('mengizinkan memilih tepat dua divisi dan menampilkan penghitung', async () => {
    const user = userEvent.setup();
    render(<VolunteerForm />);

    expect(screen.getByText('0/2 dipilih')).toBeInTheDocument();

    await user.click(divisionBox('Aksi Lapangan dan Logistik'));
    expect(screen.getByText('1/2 dipilih')).toBeInTheDocument();

    await user.click(divisionBox('Medis dan Tanggap Darurat'));
    expect(screen.getByText('2/2 dipilih')).toBeInTheDocument();
    expect(divisionBox('Aksi Lapangan dan Logistik')).toBeChecked();
    expect(divisionBox('Medis dan Tanggap Darurat')).toBeChecked();
  });

  it('menolak divisi ketiga dan menandai pilihan tersisa sebagai terkunci', async () => {
    const user = userEvent.setup();
    render(<VolunteerForm />);

    await user.click(divisionBox('Aksi Lapangan dan Logistik'));
    await user.click(divisionBox('Medis dan Tanggap Darurat'));
    await user.click(divisionBox('Dokumentasi dan Multimedia'));

    expect(divisionBox('Dokumentasi dan Multimedia')).not.toBeChecked();
    expect(divisionBox('Dokumentasi dan Multimedia')).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByText('2/2 dipilih')).toBeInTheDocument();
    expect(
      screen.getByText('Batas 2 pilihan tercapai. Lepas satu pilihan untuk memilih yang lain.'),
    ).toBeInTheDocument();
    // Pilihan tercentang tetap dapat dilepas meski batas tercapai.
    expect(divisionBox('Aksi Lapangan dan Logistik')).not.toHaveAttribute('aria-disabled');
  });

  it('mengizinkan menukar divisi setelah melepas salah satu pilihan', async () => {
    const user = userEvent.setup();
    render(<VolunteerForm />);

    await user.click(divisionBox('Aksi Lapangan dan Logistik'));
    await user.click(divisionBox('Medis dan Tanggap Darurat'));
    await user.click(divisionBox('Aksi Lapangan dan Logistik')); // lepas
    await user.click(divisionBox('Dokumentasi dan Multimedia'));

    expect(divisionBox('Dokumentasi dan Multimedia')).toBeChecked();
    expect(divisionBox('Medis dan Tanggap Darurat')).toBeChecked();
    expect(divisionBox('Aksi Lapangan dan Logistik')).not.toBeChecked();
    expect(screen.getByText('2/2 dipilih')).toBeInTheDocument();
  });

  it('mengurutkan pilihan sesuai urutan DIVISIONS, bukan urutan klik', async () => {
    const user = userEvent.setup();
    render(<VolunteerForm />);

    // Klik dari divisi terakhir ke divisi pertama.
    await user.click(divisionBox(/^Kedaulatan Ekologi \(Mitra Jagatirta\)/));
    await user.click(divisionBox('Aksi Lapangan dan Logistik'));

    await fillIdentity(user, { nama: 'Sari Puspita' });
    await user.selectOptions(ketersediaan(), 'Akhir pekan');
    await user.type(keahlian(), 'Perawat puskesmas, biasa membantu posko banjir.');
    await user.click(komitmen());
    await user.click(submitButton());

    const status = await screen.findByRole('status');
    const terms = new Map(
      within(status)
        .getAllByRole('definition')
        .map((dd, index) => [within(status).getAllByRole('term')[index].textContent, dd.textContent]),
    );
    expect(terms.get('Divisi yang diminati')).toBe(
      'Aksi Lapangan dan Logistik, Kedaulatan Ekologi (Mitra Jagatirta)',
    );
  });
});

describe('VolunteerForm — ketersediaan waktu', () => {
  it('menampilkan baris konsekuensi untuk setiap pilihan', async () => {
    const user = userEvent.setup();
    render(<VolunteerForm />);

    // Belum memilih: baris penjelas tetap ada tetapi kosong.
    expect(screen.queryByText(/^Aksi lapangan, pemetaan, dan kegiatan warga/)).not.toBeInTheDocument();

    await user.selectOptions(ketersediaan(), 'Akhir pekan');
    expect(
      screen.getByText('Aksi lapangan, pemetaan, dan kegiatan warga umumnya berjalan hari Sabtu.'),
    ).toBeInTheDocument();

    await user.selectOptions(ketersediaan(), 'Hari kerja');
    expect(
      screen.getByText('Sekretariat, advokasi ke instansi, dan kunjungan ke mitra desa.'),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Aksi lapangan, pemetaan, dan kegiatan warga umumnya berjalan hari Sabtu.'),
    ).not.toBeInTheDocument();

    await user.selectOptions(ketersediaan(), 'Fleksibel');
    expect(
      screen.getByText('Waktunya bergeser mengikuti kebutuhan aksi dan kesepakatan simpul.'),
    ).toBeInTheDocument();

    await user.selectOptions(ketersediaan(), 'Kapan saja saat darurat');
    expect(
      screen.getByText('Siaga 24 jam untuk gudang logistik, dapur umum, dan evakuasi warga.'),
    ).toBeInTheDocument();
  });

  it('menempatkan baris konsekuensi di dalam live region agar dibacakan saat berubah', async () => {
    const user = userEvent.setup();
    render(<VolunteerForm />);

    await user.selectOptions(ketersediaan(), 'Hari kerja');
    const hint = screen.getByText(
      'Sekretariat, advokasi ke instansi, dan kunjungan ke mitra desa.',
    );
    expect(hint.closest('[aria-live="polite"]')).not.toBeNull();
  });
});

describe('VolunteerForm — kirim dan keadaan pending', () => {
  it('menampilkan keadaan "Mengirim…" dan menandai tombol sibuk', async () => {
    const user = userEvent.setup();
    render(<VolunteerForm />);
    await fillAll(user);

    await user.click(submitButton());

    const pending = screen.getByRole('button', { name: /Mengirim/ });
    expect(pending).toHaveAttribute('aria-busy', 'true');
    expect(pending).toHaveAttribute('aria-disabled', 'true');
    // Label tombol berganti; teks status pembaca layar ikut terpasang.
    expect(pending).toHaveTextContent('Mengirim…');
    expect(within(pending).getByText('Memuat…')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('tidak menampilkan galat ketika semua field sudah sah', async () => {
    const user = userEvent.setup();
    render(<VolunteerForm />);
    await fillAll(user);

    await user.click(submitButton());

    expect(errorBlock()).toHaveTextContent('');
  });

  it('tidak menyerahkan formulir selama masih ada galat', async () => {
    const user = userEvent.setup();
    render(<VolunteerForm />);

    await user.type(nama(), 'Sari Puspita');
    await user.click(submitButton());

    // Tidak ada keadaan pending: validasi menahan pengiriman.
    expect(screen.queryByRole('button', { name: /Mengirim/ })).not.toBeInTheDocument();
    expect(errorBlock()).toHaveTextContent('Nomor WhatsApp wajib diisi.');
  });

  it('sedang pending tetap menerima submit berulang — tombol hanya ditandai aria-disabled', async () => {
    // Perilaku saat ini: `handleSubmit` tidak berhenti saat `isPending`, dan tombol
    // memakai `aria-disabled`/`aria-busy` (bukan atribut `disabled`). Setiap klik
    // menambah timer 900 ms baru. Tes ini mengunci keadaan itu secara eksplisit
    // supaya perubahan apa pun (mis. penjagaan pending) terlihat.
    const user = userEvent.setup();
    render(<VolunteerForm />);
    await fillAll(user);

    await user.click(submitButton());
    const pending = screen.getByRole('button', { name: /Mengirim/ });
    expect(pending).toBeEnabled();
    expect(pending).toHaveAttribute('aria-disabled', 'true');

    // Klik kedua tetap tercatat oleh formulir (submit event kedua diterima).
    const form = document.querySelector('form')!;
    const submitSpy = vi.fn();
    form.addEventListener('submit', submitSpy);
    await user.click(pending);
    expect(submitSpy).toHaveBeenCalledTimes(1);
  });

  it('memakai satu timer tunggu sebelum menampilkan kartu sukses', async () => {
    const user = userEvent.setup();
    render(<VolunteerForm />);
    await fillAll(user);

    await user.click(submitButton());

    // Keadaan sukses tidak muncul seketika — jeda 900 ms harus benar-benar berjalan.
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument(), { timeout: 3000 });
  });
});

describe('VolunteerForm — kartu sukses', () => {
  async function submitValidForm(user: User) {
    render(<VolunteerForm />);
    await fillAll(user);
    await user.click(submitButton());
    return screen.findByRole('status');
  }

  it('mengumumkan keberhasilan sebagai live region dan menghapus formulir', async () => {
    const user = userEvent.setup();
    const status = await submitValidForm(user);

    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toHaveTextContent('Selamat bergabung!');
    expect(document.querySelector('form')).toBeNull();
  });

  it('meringkas seluruh jawaban yang dimasukkan', async () => {
    const user = userEvent.setup();
    const status = await submitValidForm(user);

    const summaries = new Map(
      within(status)
        .getAllByRole('definition')
        .map((dd, index) => [within(status).getAllByRole('term')[index].textContent, dd.textContent]),
    );

    expect(summaries.get('Nama')).toBe('Sari Puspita');
    expect(summaries.get('WhatsApp')).toBe('+6281234567890');
    expect(summaries.get('Email')).toBe('sari@email.com');
    expect(summaries.get('Kota atau provinsi')).toBe('Bandung');
    expect(summaries.get('Divisi yang diminati')).toBe('Aksi Lapangan dan Logistik');
    expect(summaries.get('Ketersediaan waktu')).toBe('Akhir pekan');
    expect(summaries.get('Status')).toBe('Menunggu verifikasi koordinator');
  });

  it('menyebut nomor WhatsApp dengan kode negara +62 di dalam kalimat', async () => {
    const user = userEvent.setup();
    const status = await submitValidForm(user);

    expect(status).toHaveTextContent(
      'Koordinator divisi akan mengirim pesan WhatsApp ke nomor +6281234567890 berisi jadwal induksi',
    );
  });

  it('menawarkan tautan ke program gerakan dan tombol daftar ulang', async () => {
    const user = userEvent.setup();
    const status = await submitValidForm(user);

    const programLink = within(status).getByRole('link', { name: 'Lihat program gerakan' });
    expect(programLink).toHaveAttribute('href', '/program');

    expect(within(status).getByRole('button', { name: 'Daftarkan relawan lain' })).toBeEnabled();
  });

  it('mengosongkan seluruh formulir kembali setelah menekan "Daftarkan relawan lain"', async () => {
    const user = userEvent.setup();
    const status = await submitValidForm(user);

    await user.click(within(status).getByRole('button', { name: 'Daftarkan relawan lain' }));

    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(nama()).toHaveValue('');
    expect(whatsapp()).toHaveValue('');
    expect(email()).toHaveValue('');
    expect(domisili()).toHaveValue('');
    expect(ketersediaan()).toHaveValue('');
    expect(keahlian()).toHaveValue('');
    for (const box of screen.getAllByRole('checkbox')) {
      expect(box).not.toBeChecked();
    }
    expect(errorBlock()).toHaveTextContent('');
    expect(submitButton()).toBeEnabled();
  });

  it('dapat mengirim pendaftaran kedua setelah reset', async () => {
    const user = userEvent.setup();
    const status = await submitValidForm(user);
    await user.click(within(status).getByRole('button', { name: 'Daftarkan relawan lain' }));

    await fillAll(user);
    await user.click(submitButton());

    await waitFor(() => expect(screen.getByRole('status')).toBeInTheDocument(), { timeout: 3000 });
    expect(screen.getByRole('status')).toHaveTextContent('NamaSari Puspita');
  });
});

describe('VolunteerForm — operabilitas keyboard', () => {
  it('memilih divisi dengan tombol spasi saat checkbox difokuskan', async () => {
    const user = userEvent.setup();
    render(<VolunteerForm />);

    await user.tab(); // Nama Lengkap
    await user.tab(); // WhatsApp
    await user.tab(); // Email
    await user.tab(); // Kota atau Provinsi
    await user.tab(); // checkbox divisi pertama
    expect(divisionBox('Aksi Lapangan dan Logistik')).toHaveFocus();

    await user.keyboard(' ');
    expect(divisionBox('Aksi Lapangan dan Logistik')).toBeChecked();
    expect(screen.getByText('1/2 dipilih')).toBeInTheDocument();
  });

  it('mengirim formulir dengan Enter dari tombol kirim', async () => {
    const user = userEvent.setup();
    render(<VolunteerForm />);
    await fillAll(user);

    submitButton().focus();
    await user.keyboard('{Enter}');

    expect(screen.getByRole('button', { name: /Mengirim/ })).toHaveAttribute('aria-busy', 'true');
  });
});
