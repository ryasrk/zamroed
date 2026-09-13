import type { Program, Campaign } from '@repo/ui/types';

export const jagatirtaPrograms: Program[] = [
  {
    id: '1',
    slug: 'river-patrol',
    title: 'River Patrol & Citizen Science',
    description:
      'Pelatihan dan pendampingan warga untuk menguji kualitas air secara mandiri — mengukur pH, oksigen terlarut, dan kekeruhan langsung dari sungai mereka sendiri.',
    icon: 'FlaskConical',
  },
  {
    id: '2',
    slug: 'river-cleanup',
    title: 'River Cleanup & Waste Trapping',
    description:
      'Pembersihan sungai berkala serta pemasangan perangkap sampah apung di titik-titik strategis untuk menahan sampah plastik sebelum hanyut ke pesisir.',
    icon: 'Trash2',
  },
  {
    id: '3',
    slug: 'edukasi-bantaran',
    title: 'Edukasi Komunitas Bantaran',
    description:
      'Sekolah hijau untuk anak-anak dan warga bantaran sungai, menjadikan sungai sebagai ruang belajar tentang ekologi yang mereka tinggali.',
    icon: 'BookOpen',
  },
  {
    id: '4',
    slug: 'restorasi-sempadan',
    title: 'Restorasi Sempadan Sungai',
    description:
      'Penanaman vegetasi riparian di sepanjang sempadan sungai untuk menahan erosi, menyaring limpasan, dan memulihkan koridor ekologis.',
    icon: 'Trees',
  },
];

export const zamroedPrograms: Program[] = [
  {
    id: '1',
    slug: 'kedaulatan-ekologi',
    title: 'Kedaulatan Ekologi & Pangan',
    description:
      'Memperkuat kapasitas mandiri komunitas tani, nelayan, dan masyarakat adat dalam mengelola sumber daya alamnya sendiri secara lestari.',
    icon: 'Sprout',
  },
  {
    id: '2',
    slug: 'tanggap-bencana',
    title: 'Solidaritas & Tanggap Bencana',
    description:
      'Hadir di garis depan saat bencana melanda — mulai dari distribusi air bersih hingga pemulihan mata pencaharian warga terdampak.',
    icon: 'HeartHandshake',
  },
  {
    id: '3',
    slug: 'pendidikan-akar-rumput',
    title: 'Pendidikan Akar Rumput',
    description:
      'Sekolah lapangan dan literasi alternatif untuk membentuk kader muda yang berwawasan luas dan berintegritas.',
    icon: 'GraduationCap',
  },
  {
    id: '4',
    slug: 'advokasi-kebijakan',
    title: 'Advokasi & Kajian Kebijakan',
    description:
      'Riset dan advokasi berbasis data untuk memastikan kebijakan publik berpihak pada warga dan kelestarian lingkungan.',
    icon: 'Scale',
  },
];

export const campaigns: Campaign[] = [
  {
    id: '1',
    slug: 'trash-boom-cisadane',
    title: 'Trash Boom untuk Cisadane',
    description:
      'Pasang perangkap sampah apung di tiga titik aliran Cisadane untuk menahan sampah plastik sebelum mencapai pesisir Tangerang.',
    target: 45000000,
    raised: 28300000,
    type: 'dana',
  },
  {
    id: '2',
    slug: 'selamatkan-pesut-mahakam',
    title: 'Selamatkan Pesut Mahakam',
    description:
      'Petisi mendesak pembatasan jalur dan jadwal tongkang batu bara di area inti habitat pesut Mahakam.',
    target: 10000,
    raised: 6742,
    type: 'petisi',
  },
];
