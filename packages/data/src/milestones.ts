import type { Milestone } from '@repo/ui/types';

export const milestones: Milestone[] = [
  {
    id: '1',
    year: '1998',
    title: 'Pertemuan Pertama di Sebuah Balai Desa',
    phase: 'Awal Mula',
    narrative:
      'Berawal dari pertemuan kecil sekelompok pemuda dan tokoh desa yang gelisah melihat krisis yang melanda sekitar mereka. Tidak ada struktur organisasi, tidak ada pendanaan — hanya kesepakatan bahwa diam bukanlah pilihan.',
    quote: 'Kami tidak punya apa-apa selain keyakinan bahwa warga harus bergerak sendiri.',
    image: '/images/sejarah-archive.jpg',
  },
  {
    id: '2',
    year: '2003',
    title: 'Deklarasi Piagam Solidaritas Warga',
    phase: 'Fase Perlawanan',
    narrative:
      'Setelah lima tahun bekerja tanpa nama, gerakan ini akhirnya mendeklarasikan piagam bersama. Piagam itu menegaskan dua hal yang kemudian menjadi napas organisasi: kedaulatan warga atas tanah dan airnya, serta gotong royong lintas sekat.',
    quote: 'Gerakan ini bukan milik satu kelompok. Ia milik siapa saja yang mau bekerja.',
    image: '/images/piagam-deklarasi.jpg',
  },
  {
    id: '3',
    year: '2011',
    title: 'Ekspansi Jaringan ke Luar Jawa',
    phase: 'Konsolidasi Nasional',
    narrative:
      'Simpul-simpul relawan mulai terbentuk di luar Pulau Jawa. Proses ini tidak selalu mulus — perbedaan konteks lokal menuntut gerakan untuk belajar kembali tentang apa arti "berdaulat" di wilayah yang berbeda.',
    image: '/images/hero-movement.jpg',
  },
  {
    id: '4',
    year: '2016',
    title: 'Pendirian Sekolah Lapangan untuk Pemuda',
    phase: 'Konsolidasi Nasional',
    narrative:
      'Gerakan menyadari bahwa regenerasi tidak terjadi dengan sendirinya. Sekolah lapangan didirikan untuk melatih pemuda dalam pemetaan partisipatif, advokasi, dan pengorganisasian komunitas.',
    image: '/images/pendidikan-akar-rumput.jpg',
  },
  {
    id: '5',
    year: '2021',
    title: 'Krisis Ekologi dan Lahirnya Inisiatif Jagatirta',
    phase: 'Era Transformasi',
    narrative:
      'Tekanan terhadap daerah aliran sungai di berbagai wilayah mendorong gerakan untuk membentuk inisiatif khusus: Jagatirta River Watch. Fokusnya adalah pemantauan kualitas air berbasis warga dan advokasi perlindungan sempadan sungai.',
    quote: 'Air tidak bisa dinegosiasikan. Ia harus dijaga sebelum habis.',
    image: '/images/citarum.jpg',
  },
  {
    id: '6',
    year: '2026',
    title: 'Tujuh Wilayah Sungai dalam Satu Peta',
    phase: 'Era Transformasi',
    narrative:
      'Jagatirta kini memantau tujuh daerah aliran sungai strategis secara terpadu. Data kualitas air yang sebelumnya tersebar kini terhimpun dalam satu peta yang dapat diakses publik.',
    image: '/images/rembuk-warga.jpg',
  },
];
