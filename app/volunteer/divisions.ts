/**
 * Tabel divisi relawan ZAMROED Bergerak.
 *
 * Berkas ini sengaja bebas dari `'use client'` dan dari impor apa pun sehingga
 * dapat dibaca dua-duanya: halaman server (kartu penjelasan divisi) dan
 * formulir klien (opsi `CheckboxGroup`). Satu tabel, tiga turunan — nama
 * divisi, penjelasan singkat, dan rujukan program — tidak pernah berbeda
 * antara yang dibaca calon relawan dan yang tersimpan saat mendaftar.
 */

export interface VolunteerDivision {
  /** Nilai yang ikut terkirim saat relawan memilih divisi ini. */
  readonly slug: string;
  /** Nama divisi seperti tampil di kartu dan di formulir. */
  readonly title: string;
  /** Satu baris untuk kartu pilihan; kunci bagi relawan yang memilih cepat. */
  readonly summary: string;
  /** Penjelasan lebih panjang khusus halaman. */
  readonly detail: string;
  /** Tiga pekerjaan konkret agar janji divisi dapat diperiksa, bukan slogan. */
  readonly duties: readonly string[];
  /** Kode program di `@repo/data` (`zamroedPrograms`) yang menaungi divisi ini. */
  readonly programSlug: string;
  /** Kalimat ajakan singkat berisi siapa yang cocok bergabung. */
  readonly invitation: string;
}

export const DIVISIONS: readonly VolunteerDivision[] = [
  {
    slug: 'aksi-lapangan-logistik',
    title: 'Aksi Lapangan dan Logistik',
    summary: 'Turun langsung ke lokasi aksi dan memastikan semua kebutuhan tim tiba tepat waktu.',
    detail:
      'Divisi yang paling sering menjadi kaki pertama gerakan: mendirikan posko, menyiapkan dapur umum, mengatur distribusi air bersih, dan merawat jalur logistik dari gudang sampai titik pengungsian.',
    duties: [
      'Mendirikan posko, tenda, dan titik distribusi air bersih di lokasi aksi',
      'Mengelola gudang, pengadaan pangan, serta jadwal pengiriman antar titik',
      'Memetakan jalur aman bersama warga sebelum tim masuk ke lokasi terdampak',
    ],
    programSlug: 'tanggap-bencana',
    invitation: 'Cocok untukmu yang tidak keberatan bekerja di lapangan dan senang mengatur tim.',
  },
  {
    slug: 'medis-tanggap-darurat',
    title: 'Medis dan Tanggap Darurat',
    summary: 'Menjaga kesehatan tim dan warga, serta menjadi tim pertama yang siaga saat bencana.',
    detail:
      'Bekerja mengikuti protokol rujukan bencana yang berlaku: dari pemeriksaan kesehatan dasar di posko, stabilisasi pertama, hingga dokumentasi rujukan bagi warga yang perlu penanganan lanjutan.',
    duties: [
      'Menjalankan triase, pertolongan pertama, dan dokumentasi rujukan korban',
      'Menyiapkan kotak P3K, ambulans siaga, serta rujukan ke fasilitas kesehatan terdekat',
      'Mengedukasi warga tentang kesehatan lingkungan pascabencana',
    ],
    programSlug: 'tanggap-bencana',
    invitation:
      'Tenaga kesehatan, mahasiswa kesehatan, atau warga terlatih tanggap darurat paling pas di sini.',
  },
  {
    slug: 'dokumentasi-multimedia',
    title: 'Dokumentasi dan Multimedia',
    summary: 'Merekam, menulis, dan merilis aksi lapangan agar tidak pernah hilang dari ingatan publik.',
    detail:
      'Menjaga keterbacaan aksi gerakan: fotografi dan video, penulisan warta, siaran pers, sampai tata kelola arsip gerakan agar setiap peristiwa dapat diverifikasi kembali di kemudian hari.',
    duties: [
      'Mendokumentasikan aksi lapangan: foto, video, dan catatan lapangan',
      'Menulis warta gerakan serta siaran pers bersama redaksi',
      'Merawat arsip gerakan dan menyiapkan materi untuk kanal sosial',
    ],
    programSlug: 'pendidikan-akar-rumput',
    invitation: 'Pemilik kamera, penulis, editor, atau pengelola kanal sosial — keahlianmu sangat dibutuhkan.',
  },
  {
    slug: 'advokasi-riset',
    title: 'Advokasi dan Riset',
    summary: 'Mengubah temuan lapangan menjadi kajian, tuntutan kebijakan, dan pendampingan hukum.',
    detail:
      'Divisi yang menyiapkan bahan agar suara warga terdengar di ruang pengambilan keputusan: penyusunan kajian, catatan kebijakan, pendampingan warga menghadapi izin bermasalah, hingga advokasi ke pemerintah daerah.',
    duties: [
      'Menyusun kajian, policy brief, dan laporan temuan lapangan yang dapat dipertanggungjawabkan',
      'Mendampingi warga menyusun pengaduan dan dokumen resmi ke instansi terkait',
      'Memantau putusan, izin, dan janji program pembangunan di tingkat daerah',
    ],
    programSlug: 'advokasi-kebijakan',
    invitation: 'Mahasiswa hukum, peneliti, jurnalis data, dan kolaborator kajian kami menantimu.',
  },
  {
    slug: 'kedaulatan-ekologi-jagatirta',
    title: 'Kedaulatan Ekologi (Mitra Jagatirta)',
    summary: 'Mengawal kedaulatan pangan warga dan memantau sungai bersama Jagatirta River Watch.',
    detail:
      'Simpul kolaborasi dengan Jagatirta River Watch: mendampingi petani, nelayan, dan masyarakat adat mengelola wilayahnya sendiri, sekaligus menjaga data sungai tetap hidup dari kampung yang paling sulit dijangkau.',
    duties: [
      'Mendampingi sekolah lapang tani dan nelayan di desa binaan',
      'Memantau sempadan dan mutu sungai bersama relawan Jagatirta',
      'Merawat bank benih, sumber air, dan wilayah kelola warga',
    ],
    programSlug: 'kedaulatan-ekologi',
    invitation: 'Untukmu yang tinggal atau bekerja dekat kampung binaan dan ingin bergerak lintas gerakan.',
  },
];

/** Nama divisi dari slug — dipakai formulir untuk merangkum pilihan relawan. */
export const DIVISION_TITLES: Record<string, string> = Object.fromEntries(
  DIVISIONS.map((division) => [division.slug, division.title]),
);
