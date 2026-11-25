import {
  CATEGORY_IMAGE_MAP,
  CATEGORIES,
  CURRENT_SEED_VERSION,
  IMAGES,
  SESSION_KEY,
  STORAGE_KEY,
  createSeedDatabase,
  getAllSeedVendors,
  resolvePackageImage,
} from '../data/seed.js';
import { generateId, todayISO } from '../utils/helpers.js';

let db = null;

export function getDB() {
  return db;
}

const VALID_REAL_URLS = new Set(Object.values(IMAGES));

function migrateStoredDatabase(parsed) {
  let changed = false;
  const seedVendors = getAllSeedVendors();
  const seedVendorMap = new Map(seedVendors.map((sv) => [sv.id, sv]));
  const needsSeedRefresh = (parsed.seedVersion || 1) < CURRENT_SEED_VERSION;

  if (needsSeedRefresh) {
    const existingCats = new Set(parsed.categories || []);
    CATEGORIES.forEach((cat) => {
      if (!existingCats.has(cat)) {
        parsed.categories.push(cat);
      }
    });

    const existingVendorIds = new Set(parsed.vendors.map((v) => v.id));
    seedVendors.forEach((sv) => {
      if (!existingVendorIds.has(sv.id)) {
        parsed.vendors.push(sv);
      } else {
        const existing = parsed.vendors.find((v) => v.id === sv.id);
        if (existing && existing.packages && existing.packages.length < 3) {
          const existingPkgIds = new Set(existing.packages.map((p) => p.id));
          sv.packages.forEach((sp) => {
            if (!existingPkgIds.has(sp.id)) existing.packages.push(sp);
          });
        }
      }
    });

    parsed.seedVersion = CURRENT_SEED_VERSION;
    changed = true;
  }

  parsed.vendors = parsed.vendors.map((v) => {
    const seedVendor = seedVendorMap.get(v.id);
    const targetImg = seedVendor?.imageUrl || CATEGORY_IMAGE_MAP[v.kategori] || IMAGES.decor;
    const isSeedImageInvalid = needsSeedRefresh || !VALID_REAL_URLS.has(v.imageUrl);
    const needsMainUpdate = !VALID_REAL_URLS.has(v.imageUrl) || (needsSeedRefresh && Boolean(seedVendor));
    const needsPortfolioUpdate =
      !Array.isArray(v.portfolio) ||
      v.portfolio.some((url) => !VALID_REAL_URLS.has(url)) ||
      (needsSeedRefresh && Boolean(seedVendor));

    let pkgChanged = false;
    const nextPackages = (v.packages || []).map((pkg, idx) => {
      const seedPkg = seedVendor?.packages?.find((sp) => sp.id === pkg.id);
      if (!isSeedImageInvalid && VALID_REAL_URLS.has(pkg.imageUrl)) return pkg;
      pkgChanged = true;
      return {
        ...pkg,
        imageUrl: seedPkg?.imageUrl || resolvePackageImage(v.kategori, idx, targetImg),
      };
    });

    if (!needsMainUpdate && !needsPortfolioUpdate && !pkgChanged) return v;
    changed = true;
    return {
      ...v,
      imageUrl: needsMainUpdate ? targetImg : v.imageUrl,
      portfolio: needsPortfolioUpdate ? [targetImg, IMAGES.hero, IMAGES.decor] : v.portfolio,
      packages: nextPackages,
    };
  });

  return changed;
}

export function loadDB() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.vendors) && Array.isArray(parsed.users)) {
        if (migrateStoredDatabase(parsed)) {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        }
        return parsed;
      }
    }
  } catch {
    // Fallback to clean seed if storage is malformed
  }
  const seeded = createSeedDatabase();
  saveDB(seeded);
  return seeded;
}

export function saveDB(nextDb = db) {
  db = nextDb;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

db = loadDB();

export function resetDemoDB() {
  db = createSeedDatabase();
  saveDB(db);
  return db;
}

export function getCurrentUser() {
  try {
    const userId = sessionStorage.getItem(SESSION_KEY);
    if (!userId) return null;
    return db.users.find((u) => u.id === userId) || null;
  } catch {
    return null;
  }
}

export function setCurrentUserSession(userId) {
  if (userId) {
    sessionStorage.setItem(SESSION_KEY, userId);
  } else {
    sessionStorage.removeItem(SESSION_KEY);
  }
}

export function authenticateUser({ email, password, role }) {
  const normalizedEmail = String(email || '').trim().toLowerCase();
  const user = db.users.find(
    (u) =>
      u.email.toLowerCase() === normalizedEmail &&
      u.role === role &&
      (u.password || u.passwordDemo) === password
  );

  if (!user) {
    const emailMatch = db.users.find((u) => u.email.toLowerCase() === normalizedEmail);
    if (emailMatch && emailMatch.role !== role) {
      return {
        ok: false,
        error: `Akun ini terdaftar sebagai ${roleLabel(emailMatch.role)}. Silakan pilih tab peran yang sesuai.`,
      };
    }
    return {
      ok: false,
      error: 'Email atau kata sandi tidak cocok. Periksa kembali kredensial Anda.',
    };
  }

  setCurrentUserSession(user.id);
  return { ok: true, user };
}

export function registerAccount({ nama, email, password, role, namaUsaha, kategori, lokasi }) {
  const cleanName = String(nama || '').trim();
  const cleanEmail = String(email || '').trim().toLowerCase();

  if (!cleanName || !cleanEmail || !password || password.length < 6) {
    return { ok: false, error: 'Nama, email valid, dan kata sandi minimal 6 karakter wajib diisi.' };
  }
  if (role !== 'customer' && role !== 'vendor') {
    return { ok: false, error: 'Pendaftaran mandiri hanya tersedia untuk Customer dan Vendor.' };
  }
  if (db.users.some((u) => u.email.toLowerCase() === cleanEmail)) {
    return { ok: false, error: 'Email sudah terdaftar. Silakan gunakan email lain atau masuk.' };
  }

  const newUserId = generateId('u');
  const today = todayISO();

  const newUser = {
    id: newUserId,
    nama: cleanName,
    email: cleanEmail,
    password,
    role,
    tanggalDibuat: today,
  };
  db.users.push(newUser);

  if (role === 'customer') {
    const projectId = generateId('wp');
    db.projects.push({
      id: projectId,
      customerId: newUserId,
      namaAcara: `Pernikahan ${cleanName.split(' ')[0]}`,
      tanggalPernikahan: '2027-08-15',
      lokasi: 'Meulaboh',
      jumlahTamu: 200,
      totalAnggaran: 60000000,
      daftarBooking: [],
    });
    db.checklist.push({
      id: generateId('t'),
      weddingProjectId: projectId,
      namaTugas: 'Menentukan tanggal dan lokasi acara',
      kategori: 'Persiapan',
      status: 'Belum Selesai',
      tanggalTarget: '',
    });
  }

  if (role === 'vendor') {
    const vendorName = String(namaUsaha || `${cleanName} Studio`).trim();
    const vendorCat = kategori || db.categories[0] || 'Makeup Artist';
    const vendorLoc = String(lokasi || 'Meulaboh').trim();
    const catImg = CATEGORY_IMAGE_MAP[vendorCat] || IMAGES.decor;
    db.vendors.push({
      id: generateId('v'),
      userId: newUserId,
      namaUsaha: vendorName,
      kategori: vendorCat,
      lokasi: vendorLoc,
      alamat: `${vendorLoc}, Indonesia`,
      deskripsi: 'Layanan pernikahan profesional yang siap menyesuaikan kebutuhan acara Anda.',
      imageUrl: catImg,
      portfolio: [catImg, IMAGES.hero, IMAGES.venue],
      kontak: '6281234567890',
      ratingSimulasi: '4.8',
      statusVerifikasi: 'Menunggu Verifikasi',
      statusAktif: true,
      packages: [
        {
          id: generateId('pkg'),
          namaPaket: 'Paket Dasar',
          deskripsi: 'Paket layanan utama untuk hari pernikahan.',
          harga: 2500000,
          imageUrl: catImg,
          fasilitas: ['Konsultasi awal', 'Layanan hari acara'],
          durasiLayanan: '1 hari',
        },
      ],
    });
  }

  saveDB();
  setCurrentUserSession(newUser.id);
  return { ok: true, user: newUser };
}

export function logoutUser() {
  setCurrentUserSession(null);
}

export function roleLabel(role) {
  if (role === 'customer') return 'User / Customer';
  if (role === 'vendor') return 'Vendor';
  if (role === 'admin') return 'Admin';
  return 'Tamu';
}

export function getActiveProject(userId) {
  return db.projects.find((p) => p.customerId === userId) || null;
}

export function getVendorById(vendorId) {
  return db.vendors.find((v) => v.id === vendorId) || null;
}

export function getPackageById(vendor, packageId) {
  return vendor?.packages?.find((p) => p.id === packageId) || null;
}

export function getVendorForOwner(userId) {
  return db.vendors.find((v) => v.userId === userId) || null;
}

export function hasBookingConflict(vendorId, tanggalAcara, excludeBookingId = null) {
  return db.bookings.some(
    (b) =>
      b.id !== excludeBookingId &&
      b.vendorId === vendorId &&
      b.tanggalAcara === tanggalAcara &&
      (b.statusBooking === 'Diterima' || b.statusBooking === 'Menunggu Konfirmasi')
  );
}
