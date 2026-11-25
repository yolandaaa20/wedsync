import { getCurrentUser, getDB, getVendorById, roleLabel } from '../state/store.js';
import {
  escapeHtml,
  formatCurrency,
  formatDate,
  statusClass,
} from '../utils/helpers.js';
import { renderDashboardShell } from '../components/layout.js';

export const ADMIN_NAV = [
  { route: '/admin', label: 'Overview' },
  { route: '/admin/vendors', label: 'Kelola Vendor' },
  { route: '/admin/users', label: 'Kelola Pengguna' },
  { route: '/admin/categories', label: 'Kategori Layanan' },
  { route: '/admin/bookings', label: 'Semua Booking' },
];

export function renderAdminView(route) {
  const db = getDB();
  const currentUser = getCurrentUser();

  if (route === '/admin/vendors') return renderManageVendors(route, db);
  if (route === '/admin/users') return renderManageUsers(route, db, currentUser);
  if (route === '/admin/categories') return renderManageCategories(route, db);
  if (route === '/admin/bookings') return renderManageBookings(route, db);

  return renderAdminOverview(route, db);
}

function renderAdminOverview(route, db) {
  const customerCount = db.users.filter((u) => u.role === 'customer').length;
  const activeVendors = db.vendors.filter((v) => v.statusAktif).length;

  return renderDashboardShell(
    route,
    ADMIN_NAV,
    `
      <div class="dash-header">
        <div>
          <p class="kicker">Administrasi Platform</p>
          <h1 class="page-title">Admin Dashboard</h1>
          <p class="muted" style="margin: 0;">Ringkasan operasional pengguna, mitra vendor, kategori, dan booking.</p>
        </div>
        <button type="button" class="btn sm danger" data-action="reset-demo-data">Reset Data Demo</button>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card">
          <span class="kpi-label">Akun Customer</span>
          <strong class="kpi-value">${customerCount}</strong>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Vendor Aktif</span>
          <strong class="kpi-value">${activeVendors}/${db.vendors.length}</strong>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Total Booking</span>
          <strong class="kpi-value">${db.bookings.length}</strong>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Kategori</span>
          <strong class="kpi-value">${db.categories.length}</strong>
        </div>
      </div>

      <div class="panel">
        <div class="panel-head">
          <h2>Aktivitas Booking Terbaru</h2>
          <a class="btn sm outline" href="#/admin/bookings" data-route="/admin/bookings">Kelola Booking</a>
        </div>
        ${
          db.bookings.length
            ? db.bookings
                .slice()
                .reverse()
                .slice(0, 6)
                .map((b) => {
                  const vendor = getVendorById(b.vendorId);
                  const customer = db.users.find((u) => u.id === b.customerId);
                  return `
                    <div class="list-row">
                      <div>
                        <strong>${escapeHtml(customer?.nama || 'Customer')} &rarr; ${escapeHtml(vendor?.namaUsaha || 'Vendor')}</strong>
                        <div class="small muted tabular">${formatDate(b.tanggalAcara)} &middot; ${formatCurrency(b.totalHarga)}</div>
                      </div>
                      <span class="status-label ${statusClass(b.statusBooking)}">${escapeHtml(b.statusBooking)}</span>
                    </div>
                  `;
                })
                .join('')
            : `<div class="empty-state"><p>Belum ada transaksi booking pada platform.</p></div>`
        }
      </div>
    `
  );
}

function renderManageVendors(route, db) {
  return renderDashboardShell(
    route,
    ADMIN_NAV,
    `
      <div class="dash-header">
        <div>
          <p class="kicker">Moderasi Direktori</p>
          <h1 class="page-title">Kelola Vendor</h1>
        </div>
        <button type="button" class="btn sm" data-action="open-admin-vendor-modal">Tambah Vendor</button>
      </div>

      <div class="panel">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nama Usaha</th>
                <th>Kategori</th>
                <th>Lokasi</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${db.vendors
                .map(
                  (v) => `
                <tr>
                  <td><strong>${escapeHtml(v.namaUsaha)}</strong></td>
                  <td>${escapeHtml(v.kategori)}</td>
                  <td>${escapeHtml(v.lokasi)}</td>
                  <td>
                    <span class="status-label ${v.statusAktif ? 'ok' : 'err'}">
                      ${v.statusAktif ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td>
                    <div class="row-gap">
                      <button type="button" class="btn sm outline" data-action="admin-toggle-vendor" data-id="${escapeHtml(v.id)}">
                        ${v.statusAktif ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                      <button type="button" class="btn sm danger" data-action="admin-delete-vendor" data-id="${escapeHtml(v.id)}">
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </div>
    `
  );
}

function renderManageUsers(route, db, currentUser) {
  return renderDashboardShell(
    route,
    ADMIN_NAV,
    `
      <div class="dash-header">
        <div>
          <p class="kicker">Manajemen Akses</p>
          <h1 class="page-title">Kelola Pengguna</h1>
        </div>
        <button type="button" class="btn sm" data-action="open-admin-user-modal">Tambah Pengguna</button>
      </div>

      <div class="panel">
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Email</th>
                <th>Peran</th>
                <th>Terdaftar</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              ${db.users
                .map(
                  (u) => `
                <tr>
                  <td><strong>${escapeHtml(u.nama)}</strong></td>
                  <td class="mono xs">${escapeHtml(u.email)}</td>
                  <td>${escapeHtml(roleLabel(u.role))}</td>
                  <td class="tabular">${formatDate(u.tanggalDibuat)}</td>
                  <td>
                    ${
                      u.id === currentUser.id
                        ? `<span class="xs muted">Akun Aktif</span>`
                        : `<button type="button" class="btn sm danger" data-action="admin-delete-user" data-id="${escapeHtml(u.id)}">Hapus</button>`
                    }
                  </td>
                </tr>
              `
                )
                .join('')}
            </tbody>
          </table>
        </div>
      </div>
    `
  );
}

function renderManageCategories(route, db) {
  return renderDashboardShell(
    route,
    ADMIN_NAV,
    `
      <div class="dash-header">
        <div>
          <p class="kicker">Taksonomi Marketplace</p>
          <h1 class="page-title">Kategori Layanan</h1>
        </div>
        <button type="button" class="btn sm" data-action="open-admin-category-modal">Tambah Kategori</button>
      </div>

      <div class="panel">
        ${db.categories
          .map(
            (cat) => `
          <div class="list-row">
            <strong>${escapeHtml(cat)}</strong>
            <button type="button" class="btn sm danger" data-action="admin-delete-category" data-id="${escapeHtml(cat)}">Hapus</button>
          </div>
        `
          )
          .join('')}
      </div>
    `
  );
}

function renderManageBookings(route, db) {
  return renderDashboardShell(
    route,
    ADMIN_NAV,
    `
      <div class="dash-header">
        <div>
          <p class="kicker">Pengawasan Transaksi</p>
          <h1 class="page-title">Semua Booking Platform</h1>
        </div>
      </div>

      <div class="panel">
        ${
          db.bookings.length
            ? `<div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Vendor</th>
                      <th>Tanggal</th>
                      <th class="num">Total</th>
                      <th>Status</th>
                      <th>Ubah Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${db.bookings
                      .map((b) => {
                        const customer = db.users.find((u) => u.id === b.customerId);
                        const vendor = getVendorById(b.vendorId);
                        return `
                          <tr>
                            <td>${escapeHtml(customer?.nama || '-')}</td>
                            <td>${escapeHtml(vendor?.namaUsaha || '-')}</td>
                            <td class="tabular">${formatDate(b.tanggalAcara)}</td>
                            <td class="num">${formatCurrency(b.totalHarga)}</td>
                            <td><span class="status-label ${statusClass(b.statusBooking)}">${escapeHtml(b.statusBooking)}</span></td>
                            <td>
                              <select
                                class="input"
                                style="min-height: 34px; padding: 4px 8px;"
                                data-action="admin-booking-status"
                                data-id="${escapeHtml(b.id)}"
                                aria-label="Ubah status booking"
                              >
                                ${['Menunggu Konfirmasi', 'Diterima', 'Ditolak', 'Selesai']
                                  .map(
                                    (s) =>
                                      `<option value="${s}" ${b.statusBooking === s ? 'selected' : ''}>${s}</option>`
                                  )
                                  .join('')}
                              </select>
                            </td>
                          </tr>
                        `;
                      })
                      .join('')}
                  </tbody>
                </table>
              </div>`
            : `<div class="empty-state"><p>Belum ada data booking di platform.</p></div>`
        }
      </div>
    `
  );
}
