import { describe, expect, it } from 'vitest';

import { DIVISIONS, DIVISION_TITLES, type VolunteerDivision } from './divisions';

/**
 * `divisions.ts` is the single source of truth shared by the server page (card
 * copy) and the client form (`CheckboxGroup` options), so the contract that
 * matters is: every record is complete, slugs are unique and stable, and the
 * derived `DIVISION_TITLES` map covers every division exactly.
 *
 * Assertions on exact Indonesian copy are intentional — this file is a content
 * table, and a silent wording or slug change here rewrites what volunteers read
 * and what gets stored on registration.
 */

/** Copy-critical fields: empty strings here render as blank space in the UI. */
const CONTENT_KEYS = [
  'slug',
  'title',
  'summary',
  'detail',
  'programSlug',
  'invitation',
] as const satisfies readonly (keyof VolunteerDivision)[];

describe('DIVISIONS — struktur tabel', () => {
  it('berisi lima divisi relawan', () => {
    expect(DIVISIONS).toHaveLength(5);
  });

  it('memberi setiap divisi nilai lengkap tanpa teks kosong atau berspasi', () => {
    for (const division of DIVISIONS) {
      for (const key of CONTENT_KEYS) {
        const value = division[key];
        expect(typeof value, `${division.slug}.${key} harus string`).toBe('string');
        expect(value.trim().length, `${division.slug}.${key} harus terisi`).toBeGreaterThan(0);
        // Spasi berlebih akan tampil apa adanya di kartu dan di formulir.
        expect(value, `${division.slug}.${key} tidak boleh berspasi berlebih`).toBe(
          value.trim().replace(/\s{2,}/g, ' '),
        );
      }
    }
  });

  it('memakai slug berbentuk kebab-case agar aman dipakai sebagai nilai form', () => {
    for (const division of DIVISIONS) {
      expect(division.slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it('menjaga slug dan judul tetap unik', () => {
    const slugs = DIVISIONS.map((division) => division.slug);
    const titles = DIVISIONS.map((division) => division.title);

    expect(new Set(slugs).size).toBe(slugs.length);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it('memberi setiap divisi tepat tiga tugas nyata', () => {
    for (const division of DIVISIONS) {
      expect(Array.isArray(division.duties), `${division.slug}.duties harus array`).toBe(true);
      expect(division.duties).toHaveLength(3);
      for (const duty of division.duties) {
        expect(duty.trim().length).toBeGreaterThan(0);
      }
      expect(new Set(division.duties).size, 'tugas tidak boleh terduplikasi').toBe(3);
    }
  });

  it('merujuk kode program dengan format slug yang sama', () => {
    for (const division of DIVISIONS) {
      expect(division.programSlug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it('mempertahankan divisi dan kode program yang sudah dipakai halaman', () => {
    expect(DIVISIONS.map((division) => division.slug)).toEqual([
      'aksi-lapangan-logistik',
      'medis-tanggap-darurat',
      'dokumentasi-multimedia',
      'advokasi-riset',
      'kedaulatan-ekologi-jagatirta',
    ]);

    expect(DIVISIONS.map((division) => division.programSlug)).toEqual([
      'tanggap-bencana',
      'tanggap-bencana',
      'pendidikan-akar-rumput',
      'advokasi-kebijakan',
      'kedaulatan-ekologi',
    ]);
  });

  it('menuliskan judul divisi persis seperti yang dibaca relawan', () => {
    expect(DIVISIONS.map((division) => division.title)).toEqual([
      'Aksi Lapangan dan Logistik',
      'Medis dan Tanggap Darurat',
      'Dokumentasi dan Multimedia',
      'Advokasi dan Riset',
      'Kedaulatan Ekologi (Mitra Jagatirta)',
    ]);
  });

  it('memasangkan setiap divisi dengan ringkasan, ajakan, dan program yang tepat', () => {
    const bySlug = Object.fromEntries(DIVISIONS.map((division) => [division.slug, division]));

    expect(bySlug['aksi-lapangan-logistik'].summary).toBe(
      'Turun langsung ke lokasi aksi dan memastikan semua kebutuhan tim tiba tepat waktu.',
    );
    expect(bySlug['aksi-lapangan-logistik'].invitation).toBe(
      'Cocok untukmu yang tidak keberatan bekerja di lapangan dan senang mengatur tim.',
    );

    expect(bySlug['medis-tanggap-darurat'].summary).toBe(
      'Menjaga kesehatan tim dan warga, serta menjadi tim pertama yang siaga saat bencana.',
    );
    expect(bySlug['medis-tanggap-darurat'].invitation).toContain('Tenaga kesehatan');

    expect(bySlug['dokumentasi-multimedia'].summary).toBe(
      'Merekam, menulis, dan merilis aksi lapangan agar tidak pernah hilang dari ingatan publik.',
    );
    expect(bySlug['dokumentasi-multimedia'].programSlug).toBe('pendidikan-akar-rumput');

    expect(bySlug['advokasi-riset'].summary).toBe(
      'Mengubah temuan lapangan menjadi kajian, tuntutan kebijakan, dan pendampingan hukum.',
    );
    expect(bySlug['advokasi-riset'].programSlug).toBe('advokasi-kebijakan');

    // Divisi lintas gerakan: harus tetap menyebut mitra Jagatirta.
    expect(bySlug['kedaulatan-ekologi-jagatirta'].title).toContain('Mitra Jagatirta');
    expect(bySlug['kedaulatan-ekologi-jagatirta'].detail).toContain('Jagatirta River Watch');
    expect(bySlug['kedaulatan-ekologi-jagatirta'].duties).toContain(
      'Memantau sempadan dan mutu sungai bersama relawan Jagatirta',
    );
  });

  it('menjelaskan pekerjaan divisi lebih panjang daripada ringkasannya', () => {
    for (const division of DIVISIONS) {
      expect(
        division.detail.length,
        `${division.slug}.detail harus lebih lengkap daripada summary`,
      ).toBeGreaterThan(division.summary.length);
    }
  });

  it('menjaga setiap catatan divisi tetap berbentuk datar tanpa properti tak terduga', () => {
    // Tabel ini dipakai bersama halaman server dan formulir klien: properti baru
    // yang tidak diharapkan (mis. hasil `map` yang salah) harus ketahuan di sini,
    // bukan setelah muncul sebagai konten kosong di halaman.
    const allowed = new Set<string>([...CONTENT_KEYS, 'duties']);

    for (const division of DIVISIONS) {
      expect(Object.keys(division).sort()).toEqual([...allowed].sort());
    }
  });
});

describe('DIVISION_TITLES — peta slug ke nama divisi', () => {
  it('memetakan setiap divisi ke judulnya', () => {
    for (const division of DIVISIONS) {
      expect(DIVISION_TITLES[division.slug]).toBe(division.title);
    }
  });

  it('tidak memuat kunci tambahan di luar slug yang dikenal', () => {
    expect(Object.keys(DIVISION_TITLES)).toEqual(DIVISIONS.map((division) => division.slug));
    expect(Object.keys(DIVISION_TITLES)).toHaveLength(DIVISIONS.length);
  });

  it('memulangkan undefined untuk slug yang tidak dikenal', () => {
    // Formulir memakai fallback `?? slug` untuk nilai lama: kontrak ini harus tetap begitu.
    expect(DIVISION_TITLES['divisi-yang-tidak-ada']).toBeUndefined();
    expect(DIVISION_TITLES['']).toBeUndefined();
  });

  it('memulangkan nama divisi untuk slug yang dipakai formulir', () => {
    expect(DIVISION_TITLES['aksi-lapangan-logistik']).toBe('Aksi Lapangan dan Logistik');
    expect(DIVISION_TITLES['kedaulatan-ekologi-jagatirta']).toBe(
      'Kedaulatan Ekologi (Mitra Jagatirta)',
    );
  });

  it('tidak menghasilkan nilai kosong untuk kunci apa pun', () => {
    for (const [slug, title] of Object.entries(DIVISION_TITLES)) {
      expect(title.trim().length, `${slug} harus punya judul`).toBeGreaterThan(0);
    }
  });
});
