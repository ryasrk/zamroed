import type { Article } from '@repo/ui/types';

export const articles: Article[] = [
  {
    id: '1',
    slug: 'trash-boom-cisadane-tangkir-plastik',
    title: 'Trash Boom Perdana di Cisadane Tangkir 1,2 Ton Sampah Plastik',
    excerpt:
      'Relawan Jagatirta dan warga bantaran berhasil memasang perangkap sampah apung pertama di aliran Cisadane. Dalam dua pekan, perangkap ini menahan lebih dari satu ton sampah plastik sebelum hanyut ke pesisir.',
    body: [
      'Selama bertahun-tahun, warga yang tinggal di bantaran Sungai Cisadane melihat ritual yang sama setiap musim hujan: tumpukan sampah plastik yang mengalir dari arah hulu, melewati permukiman mereka, lalu berakhir di pesisir utara Tangerang.',
      'Pada awal bulan ini, kolaborasi antara relawan Jagatirta dan komunitas lokal memasang trash boom — perangkap sampah apung yang dipasang melintang di badan sungai. Prinsipnya sederhana: sampah yang hanyut tertahan oleh pelampung, lalu diangkat secara berkala oleh tim patroli.',
      'Hasil dua pekan pertama melampaui perkiraan. Lebih dari 1,2 ton sampah plastik berhasil ditahan, dengan komposisi didominasi kemasan fleksibel dan botol minuman sekali pakai. Temuan ini konsisten dengan hasil uji kualitas air yang mencatat indeks sampah dalam kategori sedang.',
      'Langkah berikutnya adalah memasang trash boom di dua titik tambahan dan membangun sistem rotasi jadwal patroli yang melibatkan lebih banyak warga lokal, sehingga pemeliharaan tidak hanya bergantung pada relawan dari luar daerah.',
    ],
    coverImage: '/images/cleanup-campaign.jpg',
    author: 'Tim Liputan Jagatirta',
    publishedAt: '2026-09-09',
    category: 'Aksi Bersih',
    tags: ['Cisadane', 'Sampah Plastik', 'Trash Boom'],
    readMinutes: 4,
    totalViews: 12480,
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  },
  {
    id: '2',
    slug: 'uji-kualitas-air-citizen-science',
    title: 'Bagaimana Warga Bisa Menguji Kualitas Airnya Sendiri',
    excerpt:
      'Citizen science bukan sekadar jargon. Panduan lengkap membaca pH, oksigen terlarut, dan kekeruhan air sungai dengan peralatan sederhana.',
    body: [
      'Salah satu prinsip Jagatirta adalah bahwa data kualitas air tidak boleh menjadi milik eksklusif laboratorium. Dengan peralatan sederhana, warga dapat mengukur parameter dasar yang cukup untuk mengetahui apakah sungai mereka sehat.',
      'Parameter pertama adalah pH, yang menunjukkan tingkat keasaman. Air sungai yang sehat umumnya berada di rentang 6,5 hingga 8,5. Nilai di luar rentang ini sering kali menjadi penanda awal adanya limbah cair industri.',
      'Parameter kedua adalah oksigen terlarut (Dissolved Oxygen atau DO). Ini adalah indikator paling penting bagi kehidupan ikan. Di bawah 3 mg/L, sebagian besar biota air akan mengalami kesulitan bertahan hidup.',
      'Parameter ketiga adalah kekeruhan (Total Suspended Solids atau TSS), yang naik tajam saat terjadi erosi hulu atau sedimentasi akibat pertambangan. Air yang keruh tidak hanya mengganggu fotosintesis tanaman air, tetapi juga mengikis insang ikan.',
      'Hasil pengukuran warga kemudian dikirim ke koordinator pos pantau untuk diverifikasi sebelum dipublikasikan di peta Jagatirta. Verifikasi berlapis ini menjaga kredibilitas data tanpa menutup partisipasi warga.',
    ],
    coverImage: '/images/water-testing.jpg',
    author: 'Divisi Riset Jagatirta',
    publishedAt: '2026-09-05',
    category: 'Edukasi',
    tags: ['Citizen Science', 'Kualitas Air', 'Panduan'],
    readMinutes: 6,
    totalViews: 20310,
  },
  {
    id: '3',
    slug: 'pesut-mahakam-di-tengah-tongkang-batu-bara',
    title: 'Pesut Mahakam di Tengah Lalu Lintas Tongkang Batu Bara',
    excerpt:
      'Populasi pesut di Sungai Mahakam diperkirakan tinggal puluhan ekor. Aktivitas tongkang batu bara yang terus meningkat membuat ruang gerak mereka kian sempit.',
    body: [
      'Pesut Mahakam adalah mamalia air tawar yang hanya ditemukan di Sungai Mahakam dan beberapa sungai lain di Kalimantan. Populasinya diperkirakan tersisa kurang dari seratus ekor, menjadikannya salah satu mamalia paling terancam di Indonesia.',
      'Ancaman utama bukanlah perburuan, melainkan perubahan lanskap sungai itu sendiri. Lalu lintas tongkang batu bara yang mengangkut hasil tambang dari hulu beroperasi hampir sepanjang hari, menghasilkan kebisingan bawah air yang mengacaukan sistem navigasi pesut yang bergantung pada gema suara.',
      'Di saat yang sama, sedimentasi dari aktivitas tambang meningkatkan kekeruhan air secara drastis. Hasil pemantauan terakhir mencatat TSS di atas 300 mg/L, jauh melampaui ambang batas yang nyaman bagi biota air.',
      'Jagatirta bersama komunitas lokal mendorong pembatasan jalur dan jadwal operasi tongkang di area inti habitat pesut, serta percepatan rehabilitasi sempadan sungai di wilayah hulu.',
    ],
    coverImage: '/images/mahakam.jpg',
    author: 'Tim Advokasi Jagatirta',
    publishedAt: '2026-09-02',
    category: 'Kebijakan',
    tags: ['Mahakam', 'Pesut', 'Advokasi'],
    readMinutes: 5,
    totalViews: 15940,
  },
  {
    id: '4',
    slug: 'zamroed-salurkan-bantuan-bencana',
    title: 'ZAMROED Bergerak Salurkan Bantuan Tanggap Bencana ke Pesisir Tergerus',
    excerpt:
      'Tim relawan ZAMROED Bergerak tiba di permukiman pesisir yang terdampak abrasi, membawa air bersih, logistik pangan, dan dukungan pemulihan mata pencaharian nelayan.',
    body: [
      'Bencana jarang datang tiba-tiba. Di banyak wilayah pesisir, abrasi adalah krisis yang berjalan lambat — beberapa sentimeter setiap tahun, hingga suatu malam ombak masuk ke dalam rumah.',
      'Tim relawan ZAMROED Bergerak bergerak ke lokasi dalam waktu 24 jam setelah laporan diterima. Fokus pertama selalu sama: air bersih, karena tanpa itu krisis kesehatan menyusul dalam hitungan hari.',
      'Setelah kebutuhan dasar terpenuhi, tim memetakan kerusakan bersama warga. Pemetaan partisipatif ini penting karena keputusan pemulihan yang diambil tanpa pengetahuan lokal hampir selalu meleset dari kebutuhan nyata.',
      'Tahap pemulihan tidak berhenti pada distribusi bantuan. Relawan mendampingi nelayan setempat untuk mengakses program pemulihan mata pencaharian, sekaligus memulai penanaman vegetasi pantai yang akan menahan laju abrasi dalam beberapa musim ke depan.',
    ],
    coverImage: '/images/tanggap-bencana.jpg',
    author: 'Humas ZAMROED Bergerak',
    publishedAt: '2026-09-08',
    category: 'Warta Aksi',
    tags: ['Tanggap Bencana', 'Solidaritas', 'Pesisir'],
    readMinutes: 4,
    totalViews: 9870,
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  },
  {
    id: '5',
    slug: 'rembuk-warga-kedaulatan-pangan',
    title: 'Rembuk Warga: Menyusun Kedaulatan Pangan dari Tingkat Dusun',
    excerpt:
      'Musyawarah akar rumput yang melibatkan petani kecil dan pemuda desa melahirkan kesepakatan bersama tentang sistem tanam dan distribusi hasil lokal.',
    body: [
      'Kedaulatan pangan tidak bisa dirancang dari ruang rapat ber-AC. Ia harus tumbuh dari percakapan panjang di pendopo desa, antara petani yang memegang pengetahuan turun-temurun dan pemuda yang membawa gagasan baru.',
      'Rembuk warga kali ini mempertemukan petani kecil, kelompok tani, dan relawan pemuda ZAMROED Bergerak. Hasilnya adalah kesepakatan sederhana namun konkret: rotasi tanam yang memulihkan kesuburan tanah, dan kesepakatan distribusi yang memotong rantai tengkulak.',
      'Bagian tersulit bukanlah menyusun kesepakatan, melainkan mempertahankannya. Karena itu, setiap dusun menunjuk penanggung jawab yang akan memantau pelaksanaan dan menjadi penghubung dengan jaringan pendamping.',
      'Model ini akan direplikasi ke dusun-dusun lain, dengan penyesuaian pada kondisi lokal. Tidak ada cetak biru tunggal untuk kedaulatan pangan — yang ada adalah prinsip yang sama, diterapkan dengan cara yang berbeda.',
    ],
    coverImage: '/images/rembuk-warga.jpg',
    author: 'Humas ZAMROED Bergerak',
    publishedAt: '2026-09-01',
    category: 'Warta Aksi',
    tags: ['Kedaulatan Pangan', 'Pertanian', 'Musyawarah'],
    readMinutes: 5,
    totalViews: 7420,
  },
  {
    id: '6',
    slug: 'sekolah-hijau-bantaran-sungai',
    title: 'Sekolah Hijau Bantaran: Mengajarkan Ekologi dari Sungai Sendiri',
    excerpt:
      'Program edukasi Jagatirta membawa anak-anak bantaran sungai belajar langsung di tepian air, menjadikan sungai sebagai ruang kelas terbuka.',
    body: [
      'Bagi anak-anak yang tumbuh di bantaran sungai, sungai bukanlah konsep abstrak dalam buku pelajaran. Ia adalah tempat bermain, tempat mencari ikan, dan kadang-kadang sumber ancaman saat air meluap.',
      'Program Sekolah Hijau memanfaatkan kedekatan itu. Alih-alih memulai dari teori, fasilitator mengajak anak-anak mengamati langsung: apa yang hidup di air, apa yang mengalir di atasnya, dan dari mana datangnya.',
      'Dari pengamatan itu, percakapan tentang ekologi menjadi jauh lebih mudah dipahami. Anak-anak yang melihat langsung perbedaan antara air jernih yang penuh kecewan dan air keruh berbusa tidak perlu dijelaskan mengapa sungai penting.',
      'Harapannya sederhana: generasi yang memahami sungainya sejak kecil akan tumbuh menjadi penjaga yang paling gigih saat sungai itu terancam.',
    ],
    coverImage: '/images/pendidikan-akar-rumput.jpg',
    author: 'Divisi Edukasi Jagatirta',
    publishedAt: '2026-08-28',
    category: 'Edukasi',
    tags: ['Edukasi', 'Anak', 'Bantaran'],
    readMinutes: 4,
    totalViews: 6120,
  },
];

export function getArticleBySlug(slug: string): Article | undefined {
  return articles.find((a) => a.slug === slug);
}
