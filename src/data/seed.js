export const STORAGE_KEY = 'wedsync_prod_v1';
export const SESSION_KEY = 'wedsync_session_v1';
export const CURRENT_SEED_VERSION = 4;

const unsplash = (photoId, width = 900) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=${width}&q=80`;

export const IMAGES = {
  hero: unsplash('photo-1519741497674-611481863552', 1200),
  beauty: unsplash('photo-1487412720507-e7ab37603c6f'),
  beautyAlt: unsplash('photo-1583939003579-730e3918a45a'),
  photo: unsplash('photo-1511285560929-80b456fea0bc'),
  photoAlt: unsplash('photo-1537633552985-df8429e8048b'),
  video: unsplash('photo-1519741497674-611481863552'),
  videoAlt: unsplash('photo-1532712938310-34cb3982ef74'),
  catering: unsplash('photo-1555244162-803834f70033'),
  cateringAlt: unsplash('photo-1547592180-85f173990554'),
  decor: unsplash('photo-1519225421980-715cb0215aed'),
  decorAlt: unsplash('photo-1469371670807-013ccf25f16a'),
  wo: unsplash('photo-1511795409834-ef04bbd61622'),
  gown: unsplash('photo-1594552072238-b8a33785b261'),
  invitation: unsplash('photo-1512436991641-6745cdb1723f'),
  souvenir: unsplash('photo-1513201099705-a9746e1e201f'),
  souvenirAlt: unsplash('photo-1522673607200-164d1b6ce486'),
  venue: unsplash('photo-1519167758481-83f550bb49b3'),
  venueAlt: unsplash('photo-1510076857177-7470076d4098'),
  music: unsplash('photo-1511671782779-c97d3d27a1d4'),
  musicAlt: unsplash('photo-1514525253161-7a46d19cd819'),
  rings: unsplash('photo-1515934751635-c81c6bc9a2d8'),
  ringsAlt: unsplash('photo-1591604466107-ec97de577aff'),
  carriage: unsplash('photo-1520854221256-17451cc331bf'),
};

export const CATEGORIES = [
  'Makeup Artist',
  'Fotografer',
  'Videografer',
  'Katering',
  'Dekorasi',
  'Wedding Organizer',
  'Busana Pengantin',
  'Undangan',
  'Souvenir',
  'Sewa Perlengkapan',
  'Venue & Gedung',
  'Entertainment & Musik',
  'Hantaran & Seserahan',
  'Cincin & Perhiasan',
  'Bulan Madu & Transportasi',
];

export const CATEGORY_IMAGE_MAP = {
  'Makeup Artist': IMAGES.beauty,
  'Busana Pengantin': IMAGES.gown,
  Fotografer: IMAGES.photo,
  Videografer: IMAGES.video,
  Katering: IMAGES.catering,
  'Sewa Perlengkapan': IMAGES.venue,
  Dekorasi: IMAGES.decor,
  'Wedding Organizer': IMAGES.wo,
  Undangan: IMAGES.invitation,
  Souvenir: IMAGES.souvenir,
  'Venue & Gedung': IMAGES.venueAlt,
  'Entertainment & Musik': IMAGES.music,
  'Hantaran & Seserahan': IMAGES.souvenirAlt,
  'Cincin & Perhiasan': IMAGES.rings,
  'Bulan Madu & Transportasi': IMAGES.carriage,
};

const SEED_VENDORS = [
  [
    'Atelier Cantika',
    'Makeup Artist',
    'Meulaboh',
    1800000,
    'Makeup artist dengan sentuhan natural, soft glam, dan layanan pendampingan penuh untuk hari istimewa.',
    IMAGES.beauty,
  ],
  [
    'Lensa Cerita Studio',
    'Fotografer',
    'Banda Aceh',
    2500000,
    'Dokumentasi candid dan editorial untuk mengabadikan setiap momen pernikahan secara autentik.',
    IMAGES.photo,
  ],
  [
    'Frame of Love',
    'Videografer',
    'Medan',
    3200000,
    'Film wedding sinematik dengan alur cerita personal, color grading hangat, dan audio jernih.',
    IMAGES.video,
  ],
  [
    'Dapur Bahagia Catering',
    'Katering',
    'Meulaboh',
    85000,
    'Paket prasmanan dengan pilihan menu Nusantara pilihan serta layanan pramusaji profesional.',
    IMAGES.catering,
  ],
  [
    'Bloom Decor House',
    'Dekorasi',
    'Banda Aceh',
    4500000,
    'Dekorasi pelaminan dan lorong bernuansa modern klasik dengan rangkaian bunga segar.',
    IMAGES.decor,
  ],
  [
    'Sakinah Wedding Organizer',
    'Wedding Organizer',
    'Meulaboh',
    5000000,
    'Pendampingan perencanaan menyeluruh hingga koordinasi teknis dan rundown pada hari acara.',
    IMAGES.wo,
  ],
  [
    'Maison Pengantin',
    'Busana Pengantin',
    'Medan',
    2800000,
    'Koleksi busana akad dan resepsi kontemporer lengkap dengan layanan fitting penyesuaian ukuran.',
    IMAGES.gown,
  ],
  [
    'Kertas Kisah',
    'Undangan',
    'Banda Aceh',
    3500,
    'Undangan cetak minimalis kertas bertekstur dan undangan digital interaktif yang personal.',
    IMAGES.invitation,
  ],
  [
    'Souvenir Senja',
    'Souvenir',
    'Meulaboh',
    12000,
    'Souvenir fungsional dengan kemasan rapi yang dapat disesuaikan dengan palet warna acara.',
    IMAGES.souvenir,
  ],
  [
    'Ruang Pesta Rental',
    'Sewa Perlengkapan',
    'Meulaboh',
    1500000,
    'Penyewaan meja jamuan, kursi crossback, tenda dekoratif, serta tata cahaya acara.',
    IMAGES.venue,
  ],
  [
    'Mawar Bridal Makeup',
    'Makeup Artist',
    'Medan',
    2200000,
    'Riasan anggun dan tahan lama untuk akad hingga resepsi dengan sesi konsultasi awal.',
    IMAGES.beautyAlt,
  ],
  [
    'Arunika Visual',
    'Fotografer',
    'Banda Aceh',
    2900000,
    'Paket dokumentasi foto pernikahan lengkap dengan cetak album linen dan galeri digital.',
    IMAGES.photoAlt,
  ],
  [
    'Nusa Wedding Film',
    'Videografer',
    'Meulaboh',
    2700000,
    'Dokumentasi video highlight dan full ceremony untuk mengabadikan kehangatan keluarga.',
    IMAGES.videoAlt,
  ],
  [
    'Selera Puspa',
    'Katering',
    'Medan',
    95000,
    'Sajian prasmanan dan gubukan hidangan khas untuk resepsi intimate maupun skala besar.',
    IMAGES.cateringAlt,
  ],
  [
    'Rona Pelaminan',
    'Dekorasi',
    'Meulaboh',
    3900000,
    'Penataan intimate wedding dan pelaminan bernuansa ivory dengan pencahayaan lembut.',
    IMAGES.decorAlt,
  ],
  [
    'Pavilion Kaca Garden',
    'Venue & Gedung',
    'Banda Aceh',
    14500000,
    'Venue taman rumah kaca berkapasitas hingga 400 tamu dengan pencahayaan malam dan ruang rias privat.',
    IMAGES.venueAlt,
  ],
  [
    'Pendopo Lestari Ballroom',
    'Venue & Gedung',
    'Medan',
    18000000,
    'Gedung resepsi berplafon tinggi dengan tata akustik jernih, area parkir luas, dan ruang VIP keluarga.',
    IMAGES.venue,
  ],
  [
    'Serenade Akustik Ensemble',
    'Entertainment & Musik',
    'Banda Aceh',
    3400000,
    'Penampilan band akustik, grand piano, saksofon, dan MC formal untuk resepsi hangat dan berkelas.',
    IMAGES.music,
  ],
  [
    'Harmoni Orkestra & MC',
    'Entertainment & Musik',
    'Medan',
    4800000,
    'Formasi string quartet dan vokalis profesional lengkap dengan sistem audio panggung.',
    IMAGES.musicAlt,
  ],
  [
    'Kotak Kasih Seserahan',
    'Hantaran & Seserahan',
    'Meulaboh',
    850000,
    'Jasa penataan kotak hantaran akrilik premium dengan rangkaian bunga kering dan pita satin.',
    IMAGES.souvenir,
  ],
  [
    'Mahar & Hantaran Kirana',
    'Hantaran & Seserahan',
    'Jakarta',
    1250000,
    'Desain mahar kaligrafi modern dan box seserahan tematik yang dapat disewa maupun dimiliki.',
    IMAGES.souvenirAlt,
  ],
  [
    'Larasati Fine Jewelry',
    'Cincin & Perhiasan',
    'Jakarta',
    4200000,
    'Pembuatan cincin kawin custom emas, palladium, dan platinum lengkap dengan ukir nama gratis.',
    IMAGES.rings,
  ],
  [
    'Kencana Rings Atelier',
    'Cincin & Perhiasan',
    'Medan',
    3600000,
    'Koleksi cincin pernikahan minimalis bersertifikat dengan layanan penyesuaian ukuran seumur hidup.',
    IMAGES.ringsAlt,
  ],
  [
    'Klasik Bridal Carriage',
    'Bulan Madu & Transportasi',
    'Bali',
    2400000,
    'Sewa mobil pengantin klasik berhias bunga serta paket perjalanan bulan madu privat.',
    IMAGES.carriage,
  ],
];

export const PACKAGE_VISUAL_PRESETS = [
  { label: 'Upacara & Resepsi Taman', url: IMAGES.hero },
  { label: 'Rias Pengantin & Bridal', url: IMAGES.beauty },
  { label: 'Potret & Busana Pengantin', url: IMAGES.gown },
  { label: 'Dokumentasi Fotografi', url: IMAGES.photo },
  { label: 'Sinematografi Pernikahan', url: IMAGES.videoAlt },
  { label: 'Jamuan & Katering', url: IMAGES.catering },
  { label: 'Dekorasi Floral & Pelaminan', url: IMAGES.decor },
  { label: 'Gedung & Ballroom Resepsi', url: IMAGES.venue },
  { label: 'Musik & Hiburan Resepsi', url: IMAGES.music },
  { label: 'Cincin & Perhiasan Nikah', url: IMAGES.rings },
  { label: 'Souvenir & Box Hantaran', url: IMAGES.souvenir },
];

export function resolvePackageImage(kategori, pkgIndex = 0, baseImg = null) {
  const primary = baseImg || CATEGORY_IMAGE_MAP[kategori] || IMAGES.decor;
  if (pkgIndex === 0) return primary;
  if (pkgIndex === 1) return primary === IMAGES.decor ? IMAGES.decorAlt : IMAGES.decor;
  return primary === IMAGES.venue ? IMAGES.venueAlt : IMAGES.venue;
}

export function buildVendorObject(item, idx) {
  const [namaUsaha, kategori, lokasi, basePrice, deskripsi, explicitImg] = item;
  const primaryImg = explicitImg || CATEGORY_IMAGE_MAP[kategori] || IMAGES.decor;
  return {
    id: `v${idx + 1}`,
    userId: idx === 0 ? 'u-vendor' : null,
    namaUsaha,
    kategori,
    lokasi,
    alamat: `${lokasi}, Indonesia`,
    deskripsi,
    imageUrl: primaryImg,
    portfolio: [primaryImg, IMAGES.hero, IMAGES.decor],
    kontak: '6281234567890',
    ratingSimulasi: (4.6 + (idx % 4) * 0.1).toFixed(1),
    statusVerifikasi: 'Terverifikasi',
    statusAktif: true,
    packages: [
      {
        id: `p${idx + 1}a`,
        namaPaket: 'Paket Essential',
        deskripsi: 'Layanan inti yang rapi dan terukur untuk acara intimate.',
        harga: basePrice,
        imageUrl: resolvePackageImage(kategori, 0, primaryImg),
        fasilitas: ['Konsultasi awal', 'Layanan sesuai paket', 'Koordinasi hari acara'],
        durasiLayanan: '1 hari',
      },
      {
        id: `p${idx + 1}b`,
        namaPaket: 'Paket Signature',
        deskripsi: 'Layanan lengkap dengan pendampingan tim dan fasilitas tambahan.',
        harga: Math.round(basePrice * 1.45),
        imageUrl: resolvePackageImage(kategori, 1, primaryImg),
        fasilitas: ['Konsultasi detail', 'Layanan prioritas', 'Perlengkapan atau sesi ekstra'],
        durasiLayanan: '1 hari',
      },
      {
        id: `p${idx + 1}c`,
        namaPaket: 'Paket Royal Custom',
        deskripsi: 'Cakupan penuh akad hingga resepsi dengan penyesuaian konsep khusus.',
        harga: Math.round(basePrice * 2.1),
        imageUrl: resolvePackageImage(kategori, 2, primaryImg),
        fasilitas: ['Tim penuh berdedikasi', 'Uji coba / gladi bersih', 'Prioritas revisi & dokumentasi'],
        durasiLayanan: '2 hari',
      },
    ],
  };
}

export function getAllSeedVendors() {
  return SEED_VENDORS.map((item, idx) => buildVendorObject(item, idx));
}

export function createSeedDatabase() {
  const today = new Date().toISOString().slice(0, 10);

  const users = [
    {
      id: 'u-customer',
      nama: 'Alya Putri',
      email: 'customer@wedsync.demo',
      password: 'demo123',
      role: 'customer',
      tanggalDibuat: today,
    },
    {
      id: 'u-vendor',
      nama: 'Cantika Wijaya',
      email: 'vendor@wedsync.demo',
      password: 'demo123',
      role: 'vendor',
      tanggalDibuat: today,
    },
    {
      id: 'u-admin',
      nama: 'Administrator Platform',
      email: 'admin@wedsync.demo',
      password: 'demo123',
      role: 'admin',
      tanggalDibuat: today,
    },
  ];

  const vendors = getAllSeedVendors();

  const projects = [
    {
      id: 'wp1',
      customerId: 'u-customer',
      namaAcara: 'Pernikahan Alya & Rizky',
      tanggalPernikahan: '2027-06-12',
      lokasi: 'Meulaboh',
      jumlahTamu: 300,
      totalAnggaran: 85000000,
      daftarBooking: ['bk1'],
    },
  ];

  const checklist = [
    'Menentukan tanggal dan lokasi acara',
    'Menetapkan batas total anggaran',
    'Memilih vendor katering',
    'Memilih Makeup Artist',
    'Memilih fotografer dan videografer',
    'Memilih konsep dekorasi',
    'Fitting busana pengantin',
    'Menyiapkan undangan, cincin, dan seserahan',
  ].map((namaTugas, idx) => ({
    id: `t${idx + 1}`,
    weddingProjectId: 'wp1',
    namaTugas,
    kategori: 'Persiapan',
    status: idx < 2 ? 'Selesai' : 'Belum Selesai',
    tanggalTarget: '',
  }));

  const budget = [
    {
      id: 'b1',
      weddingProjectId: 'wp1',
      kategori: 'Katering',
      namaPengeluaran: 'Estimasi konsumsi resepsi',
      estimasiBiaya: 25000000,
      biayaAktual: 5000000,
      statusPembayaran: 'DP Tercatat',
    },
    {
      id: 'b2',
      weddingProjectId: 'wp1',
      kategori: 'Dekorasi',
      namaPengeluaran: 'Dekorasi pelaminan dan akad',
      estimasiBiaya: 12000000,
      biayaAktual: 0,
      statusPembayaran: 'Belum Dibayar',
    },
    {
      id: 'b3',
      weddingProjectId: 'wp1',
      kategori: 'Busana',
      namaPengeluaran: 'Busana pengantin dan keluarga',
      estimasiBiaya: 7000000,
      biayaAktual: 0,
      statusPembayaran: 'Belum Dibayar',
    },
  ];

  const bookings = [
    {
      id: 'bk1',
      customerId: 'u-customer',
      vendorId: 'v1',
      paketId: 'p1b',
      weddingProjectId: 'wp1',
      tanggalAcara: '2027-06-12',
      lokasiAcara: 'Meulaboh',
      catatan: 'Mohon jadwal uji coba riasan dua minggu sebelum hari akad.',
      totalHarga: 2610000,
      jumlahDP: 0,
      sisaPembayaran: 2610000,
      statusBooking: 'Menunggu Konfirmasi',
      statusPembayaran: 'Belum Dibayar',
      tanggalBooking: today,
    },
  ];

  return {
    seedVersion: CURRENT_SEED_VERSION,
    users,
    vendors,
    availability: [],
    bookings,
    projects,
    checklist,
    budget,
    favorites: [{ id: 'fav1', customerId: 'u-customer', vendorId: 'v5', tanggalDitambahkan: today }],
    collaborations: [],
    categories: [...CATEGORIES],
  };
}
