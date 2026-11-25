import { CATEGORY_IMAGE_MAP, IMAGES, PACKAGE_VISUAL_PRESETS } from './data/seed.js';
import {
  authenticateUser,
  getActiveProject,
  getCurrentUser,
  getDB,
  getPackageById,
  getVendorById,
  getVendorForOwner,
  hasBookingConflict,
  logoutUser,
  registerAccount,
  resetDemoDB,
  saveDB,
} from './state/store.js';
import {
  closeModal,
  escapeHtml,
  formatCurrency,
  generateId,
  openModal,
  showToast,
  todayISO,
} from './utils/helpers.js';
import { renderVendorCard } from './components/layout.js';
import { bindARStageEvents, initSpatial3D } from './utils/spatial3d.js';
import { renderAuthPage } from './views/authViews.js';
import {
  getFilteredVendors,
  renderARStageModalHtml,
  renderBookingFormHtml,
  renderCompareTray,
  renderExplore,
  renderHome,
  renderVendorDetail,
} from './views/publicViews.js';
import { renderCustomerView } from './views/customerViews.js';
import { renderVendorView } from './views/vendorViews.js';
import { renderAdminView } from './views/adminViews.js';

const appState = {
  route: '/home',
  intendedRoute: null,
  compareIds: [],
  explore: {
    search: '',
    category: '',
    location: '',
    maxPrice: '',
    sort: 'recommended',
  },
  auth: {
    role: 'customer',
    mode: 'login',
    showPassword: false,
    emailDraft: '',
    passwordDraft: '',
    error: '',
  },
};

function parseHashRoute() {
  const rawHash = window.location.hash.replace(/^#/, '');
  if (!rawHash || rawHash === '/') return { path: '/home', anchor: null };
  const [pathPart, anchor] = rawHash.split('#');
  const normalized = pathPart.startsWith('/') ? pathPart : `/${pathPart}`;
  return { path: normalized, anchor: anchor || null };
}

function navigate(route, anchor = null) {
  const targetHash = anchor ? `#${route}#${anchor}` : `#${route}`;
  if (window.location.hash !== targetHash) {
    window.location.hash = targetHash;
  } else {
    renderApp(anchor);
  }
}

function resolveGuardedRoute(rawPath) {
  const user = getCurrentUser();

  if (rawPath === '/login' || rawPath === '/register') {
    if (user) {
      return `/${user.role}`;
    }
    return rawPath;
  }

  if (rawPath.startsWith('/customer')) {
    if (!user || user.role !== 'customer') {
      appState.intendedRoute = rawPath;
      appState.auth.role = 'customer';
      appState.auth.mode = 'login';
      appState.auth.error = user
        ? 'Halaman ini khusus akun User / Customer. Silakan masuk dengan akun Customer.'
        : '';
      return '/login';
    }
    return rawPath;
  }

  if (rawPath.startsWith('/vendor/') || rawPath === '/vendor') {
    if (!user || user.role !== 'vendor') {
      appState.intendedRoute = rawPath;
      appState.auth.role = 'vendor';
      appState.auth.mode = 'login';
      appState.auth.error = user
        ? 'Halaman ini khusus akun Vendor. Silakan masuk dengan akun Vendor.'
        : '';
      return '/login';
    }
    return rawPath;
  }

  if (rawPath.startsWith('/admin')) {
    if (!user || user.role !== 'admin') {
      appState.intendedRoute = rawPath;
      appState.auth.role = 'admin';
      appState.auth.mode = 'login';
      appState.auth.error = user
        ? 'Halaman ini khusus Administrator.'
        : '';
      return '/login';
    }
    return rawPath;
  }

  return rawPath;
}

function renderApp(scrollAnchor = null) {
  const { path, anchor } = parseHashRoute();
  const resolvedRoute = resolveGuardedRoute(path);
  appState.route = resolvedRoute;

  const appRoot = document.getElementById('app');
  if (!appRoot) return;

  let html = '';

  if (resolvedRoute === '/login' || resolvedRoute === '/register') {
    html = renderAuthPage(appState.auth, resolvedRoute);
  } else if (resolvedRoute === '/explore') {
    html = renderExplore(appState.explore, appState.compareIds);
  } else if (resolvedRoute.startsWith('/vendor-detail/')) {
    const vendorId = resolvedRoute.replace('/vendor-detail/', '');
    html = renderVendorDetail(vendorId);
  } else if (resolvedRoute.startsWith('/customer')) {
    html = renderCustomerView(resolvedRoute, appState.compareIds);
  } else if (resolvedRoute === '/vendor' || resolvedRoute.startsWith('/vendor/')) {
    html = renderVendorView(resolvedRoute);
  } else if (resolvedRoute.startsWith('/admin')) {
    html = renderAdminView(resolvedRoute);
  } else {
    html = renderHome(appState.compareIds);
  }

  appRoot.innerHTML = html;

  const targetAnchor = scrollAnchor || anchor;
  if (targetAnchor) {
    requestAnimationFrame(() => {
      const el = document.getElementById(targetAnchor);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    });
  } else {
    window.scrollTo({ top: 0 });
  }
}

function updateExploreGridOnly() {
  const grid = document.getElementById('explore-results');
  const compareRoot = document.getElementById('explore-compare');
  if (!grid) return;

  const list = getFilteredVendors(appState.explore);
  grid.innerHTML = list.length
    ? list.map((v) => renderVendorCard(v, appState.compareIds)).join('')
    : `<div class="panel empty-state" style="grid-column: 1 / -1;">
        <p>Vendor tidak ditemukan untuk kriteria pencarian saat ini.</p>
        <button type="button" class="btn sm outline" data-action="reset-explore-filters">Reset Filter</button>
      </div>`;

  if (compareRoot) {
    compareRoot.innerHTML = renderCompareTray(appState.compareIds);
  }
}

function openConfirmModal({ title, message, confirmLabel = 'Ya, Lanjutkan', onConfirm }) {
  pendingConfirmHandler = onConfirm;
  openModal(
    title,
    `
      <p class="text-secondary" style="margin-top: 0;">${escapeHtml(message)}</p>
      <div class="row-gap" style="justify-content: flex-end; margin-top: 20px;">
        <button type="button" class="btn sm outline" data-action="close-modal">Batal</button>
        <button type="button" class="btn sm danger" data-action="confirm-modal-action">${escapeHtml(confirmLabel)}</button>
      </div>
    `
  );
}

let pendingConfirmHandler = null;

function openProjectModal(projectId = '') {
  const db = getDB();
  const project = projectId ? db.projects.find((p) => p.id === projectId) : null;
  openModal(
    project ? 'Ubah Detail Proyek' : 'Buat Proyek Pernikahan',
    `
      <form data-form="save-project">
        <input type="hidden" name="projectId" value="${escapeHtml(project?.id || '')}" />
        <div class="field">
          <label for="pr-name">Nama Acara</label>
          <input id="pr-name" name="namaAcara" type="text" required value="${escapeHtml(project?.namaAcara || '')}" placeholder="Contoh: Pernikahan Alya & Rizky" />
        </div>
        <div class="field">
          <label for="pr-date">Tanggal Pernikahan</label>
          <input id="pr-date" name="tanggalPernikahan" type="date" required value="${escapeHtml(project?.tanggalPernikahan || '')}" />
        </div>
        <div class="field">
          <label for="pr-loc">Lokasi Kota</label>
          <input id="pr-loc" name="lokasi" type="text" required value="${escapeHtml(project?.lokasi || '')}" />
        </div>
        <div class="field">
          <label for="pr-guests">Estimasi Jumlah Tamu</label>
          <input id="pr-guests" name="jumlahTamu" type="number" min="1" required value="${project?.jumlahTamu || 200}" />
        </div>
        <div class="field">
          <label for="pr-budget">Total Anggaran (Rp)</label>
          <input id="pr-budget" name="totalAnggaran" type="number" min="0" required value="${project?.totalAnggaran || 50000000}" />
        </div>
        <button type="submit" class="btn block">Simpan Proyek</button>
      </form>
    `
  );
}

function openTaskModal() {
  openModal(
    'Tambah Tugas Persiapan',
    `
      <form data-form="save-task">
        <div class="field">
          <label for="tk-name">Nama Tugas</label>
          <input id="tk-name" name="namaTugas" type="text" required placeholder="Contoh: Konfirmasi daftar tamu VIP" />
        </div>
        <div class="field">
          <label for="tk-cat">Kategori</label>
          <input id="tk-cat" name="kategori" type="text" value="Persiapan" required />
        </div>
        <button type="submit" class="btn block">Tambahkan ke Checklist</button>
      </form>
    `
  );
}

function openBudgetModal(budgetId = '') {
  const db = getDB();
  const item = budgetId ? db.budget.find((b) => b.id === budgetId) : null;
  const categories = [
    'Katering',
    'Dekorasi',
    'MUA',
    'Fotografi',
    'Videografi',
    'Busana',
    'Undangan',
    'Souvenir',
    'WO',
    'Lainnya',
  ];

  openModal(
    item ? 'Ubah Pos Pengeluaran' : 'Catat Pengeluaran Baru',
    `
      <form data-form="save-budget">
        <input type="hidden" name="budgetId" value="${escapeHtml(item?.id || '')}" />
        <div class="field">
          <label for="bg-cat">Kategori</label>
          <select id="bg-cat" name="kategori" required>
            ${categories
              .map(
                (c) =>
                  `<option value="${escapeHtml(c)}" ${item?.kategori === c ? 'selected' : ''}>${escapeHtml(c)}</option>`
              )
              .join('')}
          </select>
        </div>
        <div class="field">
          <label for="bg-name">Nama Pengeluaran</label>
          <input id="bg-name" name="namaPengeluaran" type="text" required value="${escapeHtml(item?.namaPengeluaran || '')}" placeholder="Contoh: DP Paket Dekorasi" />
        </div>
        <div class="field">
          <label for="bg-est">Estimasi Biaya (Rp)</label>
          <input id="bg-est" name="estimasiBiaya" type="number" min="0" required value="${item?.estimasiBiaya || 0}" />
        </div>
        <div class="field">
          <label for="bg-act">Biaya Aktual (Rp)</label>
          <input id="bg-act" name="biayaAktual" type="number" min="0" required value="${item?.biayaAktual || 0}" />
        </div>
        <button type="submit" class="btn block">Simpan Anggaran</button>
      </form>
    `
  );
}

function openCollabModal(vendorId) {
  const user = getCurrentUser();
  const project = getActiveProject(user?.id);
  const db = getDB();
  const existing = db.collaborations.find(
    (c) => c.weddingProjectId === project?.id && c.vendorId === vendorId
  );

  openModal(
    'Atur Tugas Kolaborasi Vendor',
    `
      <form data-form="save-collab">
        <input type="hidden" name="vendorId" value="${escapeHtml(vendorId)}" />
        <div class="field">
          <label for="cl-task">Nama Tugas</label>
          <input id="cl-task" name="namaTugas" type="text" required value="${escapeHtml(existing?.namaTugas || 'Koordinasi teknis pada hari acara')}" />
        </div>
        <div class="field">
          <label for="cl-start">Tanggal Mulai</label>
          <input id="cl-start" name="tanggalMulai" type="date" value="${escapeHtml(existing?.tanggalMulai || project?.tanggalPernikahan || todayISO())}" />
        </div>
        <div class="field">
          <label for="cl-end">Tanggal Selesai</label>
          <input id="cl-end" name="tanggalSelesai" type="date" value="${escapeHtml(existing?.tanggalSelesai || project?.tanggalPernikahan || todayISO())}" />
        </div>
        <div class="field">
          <label for="cl-status">Status Pekerjaan</label>
          <select id="cl-status" name="statusPekerjaan">
            ${['Belum Dimulai', 'Sedang Berlangsung', 'Selesai']
              .map(
                (s) =>
                  `<option value="${s}" ${existing?.statusPekerjaan === s ? 'selected' : ''}>${s}</option>`
              )
              .join('')}
          </select>
        </div>
        <div class="field">
          <label for="cl-note">Catatan</label>
          <textarea id="cl-note" name="catatan">${escapeHtml(existing?.catatan || '')}</textarea>
        </div>
        <button type="submit" class="btn block">Simpan Tugas</button>
      </form>
    `
  );
}

function openServiceModal(packageId = '') {
  const user = getCurrentUser();
  const vendor = getVendorForOwner(user?.id);
  const pkg = packageId ? vendor?.packages.find((p) => p.id === packageId) : null;
  const currentImg = pkg?.imageUrl || vendor?.imageUrl || IMAGES.decor;

  openModal(
    pkg ? 'Ubah Paket Layanan' : 'Tambah Paket Layanan',
    `
      <form data-form="save-service">
        <input type="hidden" name="packageId" value="${escapeHtml(pkg?.id || '')}" />
        <div class="field">
          <label for="sv-name">Nama Paket</label>
          <input id="sv-name" name="namaPaket" type="text" required value="${escapeHtml(pkg?.namaPaket || '')}" placeholder="Contoh: Paket Akad & Resepsi" />
        </div>
        <div class="field">
          <label for="sv-img">Foto Visual AR 3D Paket</label>
          <select id="sv-img" name="imageUrl" required>
            ${PACKAGE_VISUAL_PRESETS.map(
              (preset) =>
                `<option value="${escapeHtml(preset.url)}" ${currentImg === preset.url ? 'selected' : ''}>${escapeHtml(preset.label)}</option>`
            ).join('')}
          </select>
        </div>
        <div class="field">
          <label for="sv-desc">Deskripsi</label>
          <textarea id="sv-desc" name="deskripsi" required>${escapeHtml(pkg?.deskripsi || '')}</textarea>
        </div>
        <div class="field">
          <label for="sv-price">Harga Paket (Rp)</label>
          <input id="sv-price" name="harga" type="number" min="0" required value="${pkg?.harga ?? ''}" />
        </div>
        <div class="field">
          <label for="sv-fac">Fasilitas (pisahkan dengan koma)</label>
          <input id="sv-fac" name="fasilitas" type="text" value="${escapeHtml(pkg?.fasilitas?.join(', ') || '')}" placeholder="Konsultasi, Crew profesional, Peralatan lengkap" />
        </div>
        <div class="field">
          <label for="sv-dur">Durasi Layanan</label>
          <input id="sv-dur" name="durasiLayanan" type="text" required value="${escapeHtml(pkg?.durasiLayanan || '1 hari')}" />
        </div>
        <button type="submit" class="btn block">Simpan Paket</button>
      </form>
    `
  );
}

function openAvailabilityModal() {
  openModal(
    'Atur Ketersediaan Tanggal',
    `
      <form data-form="save-availability">
        <div class="field">
          <label for="av-date">Tanggal</label>
          <input id="av-date" name="tanggal" type="date" min="${todayISO()}" required />
        </div>
        <div class="field">
          <label for="av-status">Status Ketersediaan</label>
          <select id="av-status" name="status">
            <option value="tersedia">Tersedia</option>
            <option value="tidak tersedia">Tidak Tersedia</option>
          </select>
        </div>
        <div class="field">
          <label for="av-note">Catatan</label>
          <input id="av-note" name="catatan" type="text" placeholder="Contoh: Libur tim / slot penuh" />
        </div>
        <button type="submit" class="btn block">Simpan Jadwal</button>
      </form>
    `
  );
}

function openPaymentModal(bookingId) {
  const db = getDB();
  const booking = db.bookings.find((b) => b.id === bookingId);
  if (!booking) return;

  openModal(
    'Catat Pembayaran Booking',
    `
      <p class="small text-secondary" style="margin-top: 0;">
        Total tagihan: <strong class="mono">${formatCurrency(booking.totalHarga)}</strong> &middot;
        Sisa tagihan: <strong class="mono">${formatCurrency(booking.sisaPembayaran)}</strong>
      </p>
      <form data-form="save-payment">
        <input type="hidden" name="bookingId" value="${escapeHtml(booking.id)}" />
        <div class="field">
          <label for="pm-amount">Nominal Pembayaran Diterima (Rp)</label>
          <input id="pm-amount" name="amount" type="number" min="1" max="${booking.sisaPembayaran}" required />
        </div>
        <button type="submit" class="btn block">Simpan Catatan Pembayaran</button>
      </form>
    `
  );
}

function openAdminVendorModal() {
  const db = getDB();
  openModal(
    'Tambah Vendor Baru',
    `
      <form data-form="admin-add-vendor">
        <div class="field">
          <label for="av-name">Nama Usaha</label>
          <input id="av-name" name="namaUsaha" type="text" required />
        </div>
        <div class="field">
          <label for="av-cat">Kategori</label>
          <select id="av-cat" name="kategori" required>
            ${db.categories.map((c) => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label for="av-loc">Lokasi Kota</label>
          <input id="av-loc" name="lokasi" type="text" required />
        </div>
        <div class="field">
          <label for="av-price">Harga Paket Awal (Rp)</label>
          <input id="av-price" name="harga" type="number" min="0" required />
        </div>
        <div class="field">
          <label for="av-desc">Deskripsi</label>
          <textarea id="av-desc" name="deskripsi" required></textarea>
        </div>
        <button type="submit" class="btn block">Tambahkan Vendor</button>
      </form>
    `
  );
}

function openAdminUserModal() {
  openModal(
    'Tambah Pengguna Baru',
    `
      <form data-form="admin-add-user">
        <div class="field">
          <label for="au-name">Nama Lengkap</label>
          <input id="au-name" name="nama" type="text" required />
        </div>
        <div class="field">
          <label for="au-email">Alamat Email</label>
          <input id="au-email" name="email" type="email" required />
        </div>
        <div class="field">
          <label for="au-pass">Kata Sandi Awal</label>
          <input id="au-pass" name="password" type="password" minlength="6" value="demo123" required />
        </div>
        <div class="field">
          <label for="au-role">Peran Akun</label>
          <select id="au-role" name="role">
            <option value="customer">User / Customer</option>
            <option value="vendor">Vendor</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button type="submit" class="btn block">Simpan Pengguna</button>
      </form>
    `
  );
}

function openAdminCategoryModal() {
  openModal(
    'Tambah Kategori Layanan',
    `
      <form data-form="admin-add-category">
        <div class="field">
          <label for="ac-name">Nama Kategori</label>
          <input id="ac-name" name="namaKategori" type="text" required placeholder="Contoh: Entertainment & Musik" />
        </div>
        <button type="submit" class="btn block">Tambahkan Kategori</button>
      </form>
    `
  );
}

function openCompareModal() {
  const vendors = appState.compareIds.map(getVendorById).filter(Boolean);
  if (!vendors.length) return;
  openModal(
    'Perbandingan Vendor',
    `
      <div class="table-wrap">
        <table style="min-width: 440px;">
          <thead>
            <tr>
              <th>Atribut</th>
              ${vendors.map((v) => `<th>${escapeHtml(v.namaUsaha)}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Kategori</td>
              ${vendors.map((v) => `<td>${escapeHtml(v.kategori)}</td>`).join('')}
            </tr>
            <tr>
              <td>Lokasi</td>
              ${vendors.map((v) => `<td>${escapeHtml(v.lokasi)}</td>`).join('')}
            </tr>
            <tr>
              <td>Harga Mulai</td>
              ${vendors
                .map(
                  (v) =>
                    `<td class="mono">${formatCurrency(Math.min(...v.packages.map((p) => p.harga)))}</td>`
                )
                .join('')}
            </tr>
            <tr>
              <td>Rating</td>
              ${vendors.map((v) => `<td class="tabular">&#9733; ${escapeHtml(v.ratingSimulasi)}</td>`).join('')}
            </tr>
            <tr>
              <td>Jumlah Paket</td>
              ${vendors.map((v) => `<td class="tabular">${v.packages.length} paket</td>`).join('')}
            </tr>
          </tbody>
        </table>
      </div>
    `
  );
}

/* Global Event Delegation */
document.addEventListener(
  'error',
  (event) => {
    const target = event.target;
    if (target instanceof HTMLImageElement && target.dataset.fallbackImg === 'true') {
      target.closest('.media-box')?.classList.add('is-fallback');
    }
  },
  true
);

document.addEventListener('click', (event) => {
  const routeEl = event.target.closest('[data-route]');
  if (routeEl) {
    event.preventDefault();
    pendingConfirmHandler = null;
    closeModal();
    const targetRoute = routeEl.getAttribute('data-route');
    const [path, anchor] = targetRoute.split('#');
    navigate(path, anchor || null);
    return;
  }

  const actionEl = event.target.closest('[data-action]');
  if (!actionEl) return;

  const action = actionEl.getAttribute('data-action');
  const id = actionEl.getAttribute('data-id');
  const db = getDB();
  const user = getCurrentUser();

  switch (action) {
    case 'toggle-mobile-nav': {
      document.getElementById('mobile-drawer')?.classList.toggle('open');
      break;
    }

    case 'close-modal': {
      pendingConfirmHandler = null;
      closeModal();
      break;
    }

    case 'close-modal-backdrop': {
      if (event.target === actionEl) {
        pendingConfirmHandler = null;
        closeModal();
      }
      break;
    }

    case 'confirm-modal-action': {
      const fn = pendingConfirmHandler;
      pendingConfirmHandler = null;
      closeModal();
      if (typeof fn === 'function') fn();
      break;
    }

    case 'auth-select-role': {
      appState.auth.role = actionEl.getAttribute('data-role') || 'customer';
      appState.auth.error = '';
      if (appState.auth.role === 'admin') appState.auth.mode = 'login';
      renderApp();
      break;
    }

    case 'auth-select-mode': {
      appState.auth.mode = actionEl.getAttribute('data-mode') || 'login';
      appState.auth.error = '';
      renderApp();
      break;
    }

    case 'toggle-password-visibility': {
      const pwdInput = document.getElementById('login-password');
      appState.auth.emailDraft = document.getElementById('login-email')?.value || '';
      appState.auth.passwordDraft = pwdInput?.value || '';
      appState.auth.showPassword = !appState.auth.showPassword;
      renderApp();
      break;
    }

    case 'logout': {
      logoutUser();
      appState.intendedRoute = null;
      showToast('Anda telah keluar dari akun');
      navigate('/home');
      break;
    }

    case 'filter-by-category': {
      appState.explore.category = actionEl.getAttribute('data-category') || '';
      navigate('/explore');
      break;
    }

    case 'reset-explore-filters': {
      appState.explore = {
        search: '',
        category: '',
        location: '',
        maxPrice: '',
        sort: 'recommended',
      };
      renderApp();
      break;
    }

    case 'toggle-favorite': {
      if (!user) {
        appState.auth.role = 'customer';
        appState.auth.error = 'Masuk sebagai User / Customer untuk menyimpan vendor favorit.';
        navigate('/login');
        return;
      }
      const idx = db.favorites.findIndex((f) => f.vendorId === id && f.customerId === user.id);
      if (idx >= 0) {
        db.favorites.splice(idx, 1);
        showToast('Dihapus dari daftar favorit');
      } else {
        db.favorites.push({
          id: generateId('fav'),
          customerId: user.id,
          vendorId: id,
          tanggalDitambahkan: todayISO(),
        });
        showToast('Disimpan ke daftar favorit');
      }
      saveDB();
      if (appState.route === '/explore') updateExploreGridOnly();
      else renderApp();
      break;
    }

    case 'toggle-compare': {
      if (appState.compareIds.includes(id)) {
        appState.compareIds = appState.compareIds.filter((x) => x !== id);
      } else if (appState.compareIds.length < 3) {
        appState.compareIds.push(id);
      } else {
        showToast('Maksimal membandingkan 3 vendor sekaligus');
        return;
      }
      if (appState.route === '/explore') updateExploreGridOnly();
      else renderApp();
      break;
    }

    case 'clear-compare': {
      appState.compareIds = [];
      updateExploreGridOnly();
      break;
    }

    case 'open-compare-modal': {
      openCompareModal();
      break;
    }

    case 'open-ar-preview': {
      const vendor = getVendorById(id);
      if (!vendor) return;
      const packageId = actionEl.getAttribute('data-package-id');
      const pkg = packageId ? getPackageById(vendor, packageId) : null;
      const modalTitle = pkg
        ? `Pratinjau AR 3D — ${pkg.namaPaket}`
        : `Pratinjau AR 3D — ${vendor.namaUsaha}`;
      openModal(modalTitle, renderARStageModalHtml(vendor, pkg));
      const modalBody = document.querySelector('#modal-root .modal-body');
      bindARStageEvents(modalBody);
      break;
    }

    case 'open-booking-modal': {
      const vendorId = actionEl.getAttribute('data-vendor-id');
      const packageId = actionEl.getAttribute('data-package-id');
      if (!user) {
        appState.intendedRoute = `/vendor-detail/${vendorId}`;
        appState.auth.role = 'customer';
        appState.auth.error = 'Silakan masuk sebagai User / Customer untuk memesan paket layanan.';
        navigate('/login');
        return;
      }
      if (user.role !== 'customer') {
        showToast('Gunakan akun User / Customer untuk mengajukan booking layanan.');
        return;
      }
      const vendor = getVendorById(vendorId);
      const pkg = getPackageById(vendor, packageId);
      if (!vendor || !pkg) return;
      openModal('Ajukan Booking Layanan', renderBookingFormHtml(vendor, pkg));
      break;
    }

    case 'open-project-modal': {
      openProjectModal(id || '');
      break;
    }

    case 'open-task-modal': {
      openTaskModal();
      break;
    }

    case 'open-budget-modal': {
      openBudgetModal(id || '');
      break;
    }

    case 'delete-budget': {
      openConfirmModal({
        title: 'Hapus Pos Pengeluaran',
        message: 'Catatan pengeluaran ini akan dihapus dari proyek Anda.',
        confirmLabel: 'Hapus',
        onConfirm: () => {
          db.budget = db.budget.filter((b) => b.id !== id);
          saveDB();
          showToast('Catatan anggaran dihapus');
          renderApp();
        },
      });
      break;
    }

    case 'cancel-customer-booking': {
      openConfirmModal({
        title: 'Batalkan Permintaan Booking',
        message: 'Permintaan booking yang masih menunggu konfirmasi ini akan dibatalkan.',
        confirmLabel: 'Batalkan Booking',
        onConfirm: () => {
          const booking = db.bookings.find((b) => b.id === id && b.customerId === user?.id);
          if (booking && booking.statusBooking === 'Menunggu Konfirmasi') {
            booking.statusBooking = 'Ditolak';
            saveDB();
            showToast('Permintaan booking dibatalkan');
            renderApp();
          }
        },
      });
      break;
    }

    case 'open-collab-modal': {
      openCollabModal(id);
      break;
    }

    case 'open-service-modal': {
      openServiceModal(id || '');
      break;
    }

    case 'delete-service': {
      const vendor = getVendorForOwner(user?.id);
      if (!vendor || vendor.packages.length < 2) {
        showToast('Vendor harus memiliki minimal satu paket layanan aktif.');
        return;
      }
      openConfirmModal({
        title: 'Hapus Paket Layanan',
        message: 'Paket ini akan dihapus dari katalog publik usaha Anda.',
        confirmLabel: 'Hapus Paket',
        onConfirm: () => {
          vendor.packages = vendor.packages.filter((p) => p.id !== id);
          saveDB();
          showToast('Paket layanan dihapus');
          renderApp();
        },
      });
      break;
    }

    case 'vendor-booking-status': {
      const nextStatus = actionEl.getAttribute('data-status');
      const booking = db.bookings.find((b) => b.id === id);
      if (!booking) return;

      if (
        nextStatus === 'Diterima' &&
        db.bookings.some(
          (b) =>
            b.id !== booking.id &&
            b.vendorId === booking.vendorId &&
            b.tanggalAcara === booking.tanggalAcara &&
            b.statusBooking === 'Diterima'
        )
      ) {
        showToast('Tidak dapat menerima: tanggal acara tersebut sudah terkonfirmasi untuk pesanan lain.');
        return;
      }

      booking.statusBooking = nextStatus;
      saveDB();
      showToast(`Status booking diperbarui menjadi ${nextStatus}`);
      renderApp();
      break;
    }

    case 'open-availability-modal': {
      openAvailabilityModal();
      break;
    }

    case 'delete-availability': {
      db.availability = db.availability.filter((a) => a.id !== id);
      saveDB();
      showToast('Pengaturan tanggal dihapus');
      renderApp();
      break;
    }

    case 'open-payment-modal': {
      openPaymentModal(id);
      break;
    }

    case 'open-admin-vendor-modal': {
      openAdminVendorModal();
      break;
    }

    case 'admin-toggle-vendor': {
      const vendor = getVendorById(id);
      if (vendor) {
        vendor.statusAktif = !vendor.statusAktif;
        saveDB();
        showToast(`Vendor ${vendor.statusAktif ? 'diaktifkan' : 'dinonaktifkan'}`);
        renderApp();
      }
      break;
    }

    case 'admin-delete-vendor': {
      openConfirmModal({
        title: 'Hapus Vendor',
        message: 'Vendor ini akan dihapus dari direktori platform.',
        confirmLabel: 'Hapus Vendor',
        onConfirm: () => {
          db.vendors = db.vendors.filter((v) => v.id !== id);
          saveDB();
          showToast('Vendor berhasil dihapus');
          renderApp();
        },
      });
      break;
    }

    case 'open-admin-user-modal': {
      openAdminUserModal();
      break;
    }

    case 'admin-delete-user': {
      if (db.users.length <= 1 || id === user?.id) {
        showToast('Akun aktif tidak dapat dihapus.');
        return;
      }
      openConfirmModal({
        title: 'Hapus Pengguna',
        message: 'Akun pengguna ini akan dihapus dari sistem.',
        confirmLabel: 'Hapus Pengguna',
        onConfirm: () => {
          db.users = db.users.filter((u) => u.id !== id);
          saveDB();
          showToast('Pengguna dihapus');
          renderApp();
        },
      });
      break;
    }

    case 'open-admin-category-modal': {
      openAdminCategoryModal();
      break;
    }

    case 'admin-delete-category': {
      openConfirmModal({
        title: 'Hapus Kategori',
        message: `Kategori "${id}" akan dihapus dari daftar filter marketplace.`,
        confirmLabel: 'Hapus Kategori',
        onConfirm: () => {
          db.categories = db.categories.filter((c) => c !== id);
          saveDB();
          showToast('Kategori dihapus');
          renderApp();
        },
      });
      break;
    }

    case 'reset-demo-data': {
      openConfirmModal({
        title: 'Reset Data Demo',
        message: 'Seluruh perubahan lokal akan dikembalikan ke data awal platform.',
        confirmLabel: 'Reset Sekarang',
        onConfirm: () => {
          resetDemoDB();
          appState.compareIds = [];
          showToast('Data platform berhasil dikembalikan ke kondisi awal');
          renderApp();
        },
      });
      break;
    }

    default:
      break;
  }
});

document.addEventListener('input', (event) => {
  const filterKey = event.target.getAttribute('data-filter');
  if (!filterKey) return;
  appState.explore[filterKey] = event.target.value;
  updateExploreGridOnly();
});

document.addEventListener('change', (event) => {
  const target = event.target;
  const filterKey = target.getAttribute('data-filter');
  if (filterKey) {
    appState.explore[filterKey] = target.value;
    updateExploreGridOnly();
    return;
  }

  const action = target.getAttribute('data-action');
  const id = target.getAttribute('data-id');
  const db = getDB();

  if (action === 'toggle-task') {
    const task = db.checklist.find((t) => t.id === id);
    if (task) {
      task.status = target.checked ? 'Selesai' : 'Belum Selesai';
      saveDB();
      renderApp();
    }
  } else if (action === 'admin-booking-status') {
    const booking = db.bookings.find((b) => b.id === id);
    const nextStatus = target.value;
    if (!booking) return;

    if (
      nextStatus === 'Diterima' &&
      db.bookings.some(
        (b) =>
          b.id !== booking.id &&
          b.vendorId === booking.vendorId &&
          b.tanggalAcara === booking.tanggalAcara &&
          b.statusBooking === 'Diterima'
      )
    ) {
      showToast('Konflik jadwal: tanggal sudah dipesan untuk vendor ini.');
      renderApp();
      return;
    }

    booking.statusBooking = nextStatus;
    saveDB();
    showToast('Status booking diperbarui');
    renderApp();
  }
});

document.addEventListener('submit', (event) => {
  const form = event.target;
  const formName = form.getAttribute('data-form');
  if (!formName) return;

  event.preventDefault();
  const data = new FormData(form);
  const db = getDB();
  const user = getCurrentUser();

  switch (formName) {
    case 'login': {
      const role = data.get('role');
      const email = data.get('email');
      const password = data.get('password');
      const result = authenticateUser({ email, password, role });

      if (!result.ok) {
        appState.auth.emailDraft = String(email || '');
        appState.auth.passwordDraft = '';
        appState.auth.error = result.error;
        renderApp();
        return;
      }

      appState.auth.error = '';
      appState.auth.emailDraft = '';
      appState.auth.passwordDraft = '';
      const dest =
        appState.intendedRoute && appState.intendedRoute.startsWith(`/${result.user.role}`)
          ? appState.intendedRoute
          : `/${result.user.role}`;
      appState.intendedRoute = null;
      showToast(`Selamat datang, ${result.user.nama}`);
      navigate(dest);
      break;
    }

    case 'register': {
      const result = registerAccount({
        nama: data.get('nama'),
        email: data.get('email'),
        password: data.get('password'),
        role: data.get('role'),
        namaUsaha: data.get('namaUsaha'),
        kategori: data.get('kategori'),
        lokasi: data.get('lokasi'),
      });

      if (!result.ok) {
        appState.auth.error = result.error;
        renderApp();
        return;
      }

      appState.auth.error = '';
      showToast(`Akun berhasil dibuat. Selamat datang, ${result.user.nama}`);
      navigate(`/${result.user.role}`);
      break;
    }

    case 'submit-booking': {
      const vendorId = String(data.get('vendorId'));
      const packageId = String(data.get('packageId'));
      const tanggalAcara = String(data.get('tanggalAcara'));
      const vendor = getVendorById(vendorId);
      const pkg = getPackageById(vendor, packageId);

      if (!vendor || !pkg || !user) return;

      if (hasBookingConflict(vendorId, tanggalAcara)) {
        showToast('Tanggal tersebut sudah memiliki booking aktif untuk vendor ini.');
        return;
      }

      const unavailable = db.availability.some(
        (a) => a.vendorId === vendorId && a.tanggal === tanggalAcara && a.status === 'tidak tersedia'
      );
      if (unavailable) {
        showToast('Vendor menandai tanggal tersebut tidak tersedia.');
        return;
      }

      const booking = {
        id: generateId('bk'),
        customerId: user.id,
        vendorId,
        paketId: packageId,
        weddingProjectId: String(data.get('projectId')),
        tanggalAcara,
        lokasiAcara: String(data.get('lokasiAcara')),
        catatan: String(data.get('catatan') || ''),
        totalHarga: pkg.harga,
        jumlahDP: 0,
        sisaPembayaran: pkg.harga,
        statusBooking: 'Menunggu Konfirmasi',
        statusPembayaran: 'Belum Dibayar',
        tanggalBooking: todayISO(),
      };

      db.bookings.push(booking);
      const project = db.projects.find((p) => p.id === booking.weddingProjectId);
      if (project && !project.daftarBooking.includes(booking.id)) {
        project.daftarBooking.push(booking.id);
      }

      saveDB();
      closeModal();
      showToast('Permintaan booking berhasil dikirim');
      navigate('/customer/bookings');
      break;
    }

    case 'save-project': {
      const projectId = String(data.get('projectId') || '');
      const payload = {
        namaAcara: String(data.get('namaAcara')).trim(),
        tanggalPernikahan: String(data.get('tanggalPernikahan')),
        lokasi: String(data.get('lokasi')).trim(),
        jumlahTamu: Number(data.get('jumlahTamu') || 100),
        totalAnggaran: Number(data.get('totalAnggaran') || 0),
      };

      if (projectId) {
        const existing = db.projects.find((p) => p.id === projectId && p.customerId === user?.id);
        if (existing) Object.assign(existing, payload);
      } else {
        db.projects.push({
          id: generateId('wp'),
          customerId: user.id,
          ...payload,
          daftarBooking: [],
        });
      }
      saveDB();
      closeModal();
      showToast('Proyek pernikahan disimpan');
      renderApp();
      break;
    }

    case 'save-task': {
      const project = getActiveProject(user?.id);
      if (!project) return;
      db.checklist.push({
        id: generateId('t'),
        weddingProjectId: project.id,
        namaTugas: String(data.get('namaTugas')).trim(),
        kategori: String(data.get('kategori')).trim() || 'Persiapan',
        status: 'Belum Selesai',
        tanggalTarget: '',
      });
      saveDB();
      closeModal();
      showToast('Tugas ditambahkan ke checklist');
      renderApp();
      break;
    }

    case 'save-budget': {
      const project = getActiveProject(user?.id);
      if (!project) return;
      const budgetId = String(data.get('budgetId') || '');
      const payload = {
        weddingProjectId: project.id,
        kategori: String(data.get('kategori')),
        namaPengeluaran: String(data.get('namaPengeluaran')).trim(),
        estimasiBiaya: Number(data.get('estimasiBiaya') || 0),
        biayaAktual: Number(data.get('biayaAktual') || 0),
        statusPembayaran: Number(data.get('biayaAktual') || 0) > 0 ? 'Tercatat' : 'Belum Dibayar',
      };

      if (budgetId) {
        const existing = db.budget.find((b) => b.id === budgetId);
        if (existing) Object.assign(existing, payload);
      } else {
        db.budget.push({ id: generateId('b'), ...payload });
      }
      saveDB();
      closeModal();
      showToast('Catatan anggaran diperbarui');
      renderApp();
      break;
    }

    case 'save-collab': {
      const project = getActiveProject(user?.id);
      const vendorId = String(data.get('vendorId'));
      if (!project) return;
      const existing = db.collaborations.find(
        (c) => c.weddingProjectId === project.id && c.vendorId === vendorId
      );
      const payload = {
        weddingProjectId: project.id,
        vendorId,
        namaTugas: String(data.get('namaTugas')).trim(),
        tanggalMulai: String(data.get('tanggalMulai')),
        tanggalSelesai: String(data.get('tanggalSelesai')),
        statusPekerjaan: String(data.get('statusPekerjaan')),
        catatan: String(data.get('catatan') || ''),
      };
      if (existing) Object.assign(existing, payload);
      else db.collaborations.push({ id: generateId('col'), ...payload });

      saveDB();
      closeModal();
      showToast('Tugas kolaborasi disimpan');
      renderApp();
      break;
    }

    case 'save-vendor-profile': {
      const vendor = getVendorForOwner(user?.id);
      if (!vendor) return;
      Object.assign(vendor, {
        namaUsaha: String(data.get('namaUsaha')).trim(),
        kategori: String(data.get('kategori')),
        lokasi: String(data.get('lokasi')).trim(),
        alamat: String(data.get('alamat')).trim(),
        deskripsi: String(data.get('deskripsi')).trim(),
        kontak: String(data.get('kontak')).trim(),
      });
      saveDB();
      showToast('Profil usaha vendor berhasil diperbarui');
      renderApp();
      break;
    }

    case 'save-service': {
      const vendor = getVendorForOwner(user?.id);
      if (!vendor) return;
      const packageId = String(data.get('packageId') || '');
      const payload = {
        namaPaket: String(data.get('namaPaket')).trim(),
        imageUrl: String(data.get('imageUrl') || vendor.imageUrl || IMAGES.decor),
        deskripsi: String(data.get('deskripsi')).trim(),
        harga: Number(data.get('harga') || 0),
        fasilitas: String(data.get('fasilitas') || '')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        durasiLayanan: String(data.get('durasiLayanan')).trim() || '1 hari',
      };

      if (packageId) {
        const existing = vendor.packages.find((p) => p.id === packageId);
        if (existing) Object.assign(existing, payload);
      } else {
        vendor.packages.push({ id: generateId('pkg'), ...payload });
      }
      saveDB();
      closeModal();
      showToast('Paket layanan disimpan');
      renderApp();
      break;
    }

    case 'save-availability': {
      const vendor = getVendorForOwner(user?.id);
      if (!vendor) return;
      const tanggal = String(data.get('tanggal'));
      const status = String(data.get('status'));
      const catatan = String(data.get('catatan') || '');

      const existing = db.availability.find(
        (a) => a.vendorId === vendor.id && a.tanggal === tanggal
      );
      if (existing) {
        Object.assign(existing, { status, catatan });
      } else {
        db.availability.push({
          id: generateId('av'),
          vendorId: vendor.id,
          tanggal,
          status,
          catatan,
        });
      }
      saveDB();
      closeModal();
      showToast('Jadwal ketersediaan diperbarui');
      renderApp();
      break;
    }

    case 'save-payment': {
      const bookingId = String(data.get('bookingId'));
      const amount = Number(data.get('amount') || 0);
      const booking = db.bookings.find((b) => b.id === bookingId);
      if (!booking || amount <= 0) return;

      booking.jumlahDP = Math.min(booking.totalHarga, booking.jumlahDP + amount);
      booking.sisaPembayaran = Math.max(0, booking.totalHarga - booking.jumlahDP);
      booking.statusPembayaran = booking.sisaPembayaran === 0 ? 'Lunas' : 'DP Tercatat';
      saveDB();
      closeModal();
      showToast('Pembayaran berhasil dicatat');
      renderApp();
      break;
    }

    case 'admin-add-vendor': {
      const lokasi = String(data.get('lokasi')).trim();
      const kategori = String(data.get('kategori'));
      const catImg = CATEGORY_IMAGE_MAP[kategori] || IMAGES.decor;
      db.vendors.push({
        id: generateId('v'),
        userId: null,
        namaUsaha: String(data.get('namaUsaha')).trim(),
        kategori,
        lokasi,
        alamat: `${lokasi}, Indonesia`,
        deskripsi: String(data.get('deskripsi')).trim(),
        imageUrl: catImg,
        portfolio: [catImg, IMAGES.hero, IMAGES.venue],
        kontak: '6281234567890',
        ratingSimulasi: '4.8',
        statusVerifikasi: 'Terverifikasi',
        statusAktif: true,
        packages: [
          {
            id: generateId('pkg'),
            namaPaket: 'Paket Utama',
            deskripsi: 'Paket layanan pernikahan standar.',
            harga: Number(data.get('harga') || 0),
            imageUrl: catImg,
            fasilitas: ['Konsultasi awal', 'Layanan hari acara'],
            durasiLayanan: '1 hari',
          },
        ],
      });
      saveDB();
      closeModal();
      showToast('Vendor baru ditambahkan');
      renderApp();
      break;
    }

    case 'admin-add-user': {
      const email = String(data.get('email')).trim().toLowerCase();
      if (db.users.some((u) => u.email.toLowerCase() === email)) {
        showToast('Email sudah terdaftar pada pengguna lain.');
        return;
      }
      db.users.push({
        id: generateId('u'),
        nama: String(data.get('nama')).trim(),
        email,
        password: String(data.get('password') || 'demo123'),
        role: String(data.get('role')),
        tanggalDibuat: todayISO(),
      });
      saveDB();
      closeModal();
      showToast('Pengguna baru ditambahkan');
      renderApp();
      break;
    }

    case 'admin-add-category': {
      const name = String(data.get('namaKategori')).trim();
      if (db.categories.some((c) => c.toLowerCase() === name.toLowerCase())) {
        showToast('Kategori tersebut sudah tersedia.');
        return;
      }
      db.categories.push(name);
      saveDB();
      closeModal();
      showToast('Kategori layanan ditambahkan');
      renderApp();
      break;
    }

    default:
      break;
  }
});

window.addEventListener('hashchange', () => renderApp());
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    pendingConfirmHandler = null;
    closeModal();
  }
});

initSpatial3D();
renderApp();
