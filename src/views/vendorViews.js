import {
  getCurrentUser,
  getDB,
  getPackageById,
  getVendorForOwner,
} from '../state/store.js';
import {
  escapeHtml,
  formatCurrency,
  formatDate,
  statusClass,
} from '../utils/helpers.js';
import { renderDashboardShell } from '../components/layout.js';

export const VENDOR_NAV = [
  { route: '/vendor', label: 'Overview' },
  { route: '/vendor/profile', label: 'Profil Usaha' },
  { route: '/vendor/services', label: 'Paket Layanan' },
  { route: '/vendor/requests', label: 'Permintaan Booking' },
  { route: '/vendor/availability', label: 'Kalender Jadwal' },
  { route: '/vendor/customers', label: 'Daftar Pelanggan' },
  { route: '/vendor/transactions', label: 'Transaksi' },
];

export function renderVendorView(route) {
  const user = getCurrentUser();
  const db = getDB();
  const vendor = getVendorForOwner(user.id);

  if (!vendor) {
    return renderDashboardShell(
      route,
      VENDOR_NAV,
      `
        <div class="panel empty-state">
          <h2>Profil Usaha Belum Terhubung</h2>
          <p>Akun vendor Anda belum memiliki data usaha aktif.</p>
        </div>
      `
    );
  }

  const bookings = db.bookings.filter((b) => b.vendorId === vendor.id);

  if (route === '/vendor/profile') return renderProfile(route, db, vendor);
  if (route === '/vendor/services') return renderServices(route, vendor);
  if (route === '/vendor/requests') return renderRequests(route, db, vendor, bookings);
  if (route === '/vendor/availability') return renderAvailability(route, db, vendor, bookings);
  if (route === '/vendor/customers') return renderCustomerList(route, db, bookings);
  if (route === '/vendor/transactions') return renderTransactions(route, db, bookings);

  return renderVendorOverview(route, vendor, bookings);
}

function renderVendorOverview(route, vendor, bookings) {
  const pendingCount = bookings.filter((b) => b.statusBooking === 'Menunggu Konfirmasi').length;
  const activeCount = bookings.filter((b) => b.statusBooking === 'Diterima').length;
  const recordedDp = bookings
    .filter((b) => b.statusBooking === 'Diterima' || b.statusBooking === 'Selesai')
    .reduce((sum, b) => sum + Number(b.jumlahDP || 0), 0);

  return renderDashboardShell(
    route,
    VENDOR_NAV,
    `
      <div class="dash-header">
        <div>
          <p class="kicker">Workspace Mitra Vendor</p>
          <h1 class="page-title">${escapeHtml(vendor.namaUsaha)}</h1>
          <p class="muted" style="margin: 0;">${escapeHtml(vendor.kategori)} &middot; ${escapeHtml(vendor.lokasi)} &middot; ${escapeHtml(vendor.statusVerifikasi)}</p>
        </div>
        <a class="btn sm outline" href="#/vendor-detail/${escapeHtml(vendor.id)}" data-route="/vendor-detail/${escapeHtml(vendor.id)}">Lihat Halaman Publik</a>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card">
          <span class="kpi-label">Total Booking</span>
          <strong class="kpi-value">${bookings.length}</strong>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Perlu Konfirmasi</span>
          <strong class="kpi-value">${pendingCount}</strong>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Pesanan Aktif</span>
          <strong class="kpi-value">${activeCount}</strong>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">DP Tercatat</span>
          <strong class="kpi-value money">${formatCurrency(recordedDp)}</strong>
        </div>
      </div>

      <div class="panel">
        <div class="panel-head">
          <h2>Permintaan Booking Terbaru</h2>
          <a class="btn sm outline" href="#/vendor/requests" data-route="/vendor/requests">Kelola Semua</a>
        </div>
        ${
          bookings.length
            ? bookings
                .slice()
                .reverse()
                .slice(0, 5)
                .map(
                  (b) => `
                  <div class="list-row">
                    <div>
                      <strong>${formatDate(b.tanggalAcara)} &middot; ${escapeHtml(b.lokasiAcara)}</strong>
                      <div class="small muted mono">${formatCurrency(b.totalHarga)}</div>
                    </div>
                    <div class="row-gap">
                      <span class="status-label ${statusClass(b.statusBooking)}">${escapeHtml(b.statusBooking)}</span>
                      <a class="btn sm outline" href="#/vendor/requests" data-route="/vendor/requests">Tinjau</a>
                    </div>
                  </div>
                `
                )
                .join('')
            : `<div class="empty-state"><p>Belum ada permintaan booking masuk.</p></div>`
        }
      </div>
    `
  );
}

function renderProfile(route, db, vendor) {
  return renderDashboardShell(
    route,
    VENDOR_NAV,
    `
      <div class="dash-header">
        <div>
          <p class="kicker">Identitas Bisnis</p>
          <h1 class="page-title">Profil Usaha Vendor</h1>
        </div>
      </div>

      <div class="panel">
        <form data-form="save-vendor-profile">
          <div class="field">
            <label for="vp-name">Nama Usaha</label>
            <input id="vp-name" name="namaUsaha" type="text" required value="${escapeHtml(vendor.namaUsaha)}" />
          </div>
          <div class="field">
            <label for="vp-cat">Kategori Layanan</label>
            <select id="vp-cat" name="kategori" required>
              ${db.categories
                .map(
                  (c) =>
                    `<option value="${escapeHtml(c)}" ${vendor.kategori === c ? 'selected' : ''}>${escapeHtml(c)}</option>`
                )
                .join('')}
            </select>
          </div>
          <div class="field">
            <label for="vp-loc">Kota Layanan</label>
            <input id="vp-loc" name="lokasi" type="text" required value="${escapeHtml(vendor.lokasi)}" />
          </div>
          <div class="field">
            <label for="vp-addr">Alamat Lengkap</label>
            <input id="vp-addr" name="alamat" type="text" value="${escapeHtml(vendor.alamat)}" />
          </div>
          <div class="field">
            <label for="vp-desc">Deskripsi Layanan</label>
            <textarea id="vp-desc" name="deskripsi" rows="4">${escapeHtml(vendor.deskripsi)}</textarea>
          </div>
          <div class="field">
            <label for="vp-wa">Nomor WhatsApp (kode negara tanpa +)</label>
            <input id="vp-wa" name="kontak" type="text" value="${escapeHtml(vendor.kontak)}" />
          </div>
          <button type="submit" class="btn">Simpan Perubahan Profil</button>
        </form>
      </div>
    `
  );
}

function renderServices(route, vendor) {
  return renderDashboardShell(
    route,
    VENDOR_NAV,
    `
      <div class="dash-header">
        <div>
          <p class="kicker">Katalog Penawaran</p>
          <h1 class="page-title">Paket Layanan</h1>
          <p class="muted" style="margin: 0;">Setiap paket dilengkapi foto 3D interaktif yang tampil di katalog publik.</p>
        </div>
        <button type="button" class="btn sm" data-action="open-service-modal">Tambah Paket</button>
      </div>

      <div class="package-ar-grid">
        ${vendor.packages
          .map(
            (pkg) => `
          <article class="package-ar-card" data-ar-card data-ar-tilt="10">
            <div class="ar-glare"></div>
            <div class="ar-reticle"></div>
            <span class="ar-depth-tag">AR 3D</span>
            <div class="media-box">
              <img
                src="${escapeHtml(pkg.imageUrl || vendor.imageUrl)}"
                alt="${escapeHtml(pkg.namaPaket)}"
                referrerpolicy="no-referrer"
                loading="lazy"
                data-fallback-img="true"
              />
              <div class="media-fallback">
                <span class="xs muted">Galeri Paket</span>
                <strong>${escapeHtml(pkg.namaPaket)}</strong>
              </div>
            </div>
            <div class="package-ar-body">
              <div class="meta-line">
                <span>Durasi ${escapeHtml(pkg.durasiLayanan)}</span>
              </div>
              <h3>${escapeHtml(pkg.namaPaket)}</h3>
              <div class="price-value" style="margin-bottom: 8px;">${formatCurrency(pkg.harga)}</div>
              <p class="small text-secondary" style="margin: 0 0 8px;">${escapeHtml(pkg.deskripsi)}</p>
              <div class="xs muted" style="margin-bottom: 14px;">
                ${(pkg.fasilitas || []).map(escapeHtml).join(' &middot; ')}
              </div>
              <div class="package-ar-actions">
                <button
                  type="button"
                  class="btn sm soft"
                  data-action="open-ar-preview"
                  data-id="${escapeHtml(vendor.id)}"
                  data-package-id="${escapeHtml(pkg.id)}"
                >AR 3D</button>
                <button type="button" class="btn sm outline" data-action="open-service-modal" data-id="${escapeHtml(pkg.id)}">Ubah</button>
                <button type="button" class="btn sm danger" data-action="delete-service" data-id="${escapeHtml(pkg.id)}">Hapus</button>
              </div>
            </div>
          </article>
        `
          )
          .join('')}
      </div>
    `
  );
}

function renderRequests(route, db, vendor, bookings) {
  return renderDashboardShell(
    route,
    VENDOR_NAV,
    `
      <div class="dash-header">
        <div>
          <p class="kicker">Manajemen Pesanan</p>
          <h1 class="page-title">Permintaan Booking</h1>
        </div>
      </div>

      <div class="panel">
        ${
          bookings.length
            ? `<div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Pelanggan</th>
                      <th>Tanggal</th>
                      <th>Paket</th>
                      <th class="num">Total</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${bookings
                      .map((b) => {
                        const customer = db.users.find((u) => u.id === b.customerId);
                        const pkg = getPackageById(vendor, b.paketId);
                        return `
                          <tr>
                            <td>
                              <strong>${escapeHtml(customer?.nama || 'Customer')}</strong>
                              ${b.catatan ? `<div class="xs muted">${escapeHtml(b.catatan)}</div>` : ''}
                            </td>
                            <td class="tabular">${formatDate(b.tanggalAcara)}</td>
                            <td>${escapeHtml(pkg?.namaPaket || '-')}</td>
                            <td class="num">${formatCurrency(b.totalHarga)}</td>
                            <td><span class="status-label ${statusClass(b.statusBooking)}">${escapeHtml(b.statusBooking)}</span></td>
                            <td>
                              ${
                                b.statusBooking === 'Menunggu Konfirmasi'
                                  ? `<div class="row-gap">
                                      <button type="button" class="btn sm" data-action="vendor-booking-status" data-id="${escapeHtml(b.id)}" data-status="Diterima">Terima</button>
                                      <button type="button" class="btn sm danger" data-action="vendor-booking-status" data-id="${escapeHtml(b.id)}" data-status="Ditolak">Tolak</button>
                                    </div>`
                                  : b.statusBooking === 'Diterima'
                                    ? `<button type="button" class="btn sm outline" data-action="vendor-booking-status" data-id="${escapeHtml(b.id)}" data-status="Selesai">Tandai Selesai</button>`
                                    : `<span class="xs muted">Selesai diproses</span>`
                              }
                            </td>
                          </tr>
                        `;
                      })
                      .join('')}
                  </tbody>
                </table>
              </div>`
            : `<div class="empty-state"><p>Belum ada permintaan booking masuk.</p></div>`
        }
      </div>
    `
  );
}

function renderAvailability(route, db, vendor, bookings) {
  const customDates = db.availability.filter((a) => a.vendorId === vendor.id);
  const activeDates = bookings.filter(
    (b) => b.statusBooking === 'Diterima' || b.statusBooking === 'Menunggu Konfirmasi'
  );

  return renderDashboardShell(
    route,
    VENDOR_NAV,
    `
      <div class="dash-header">
        <div>
          <p class="kicker">Jadwal Operasional</p>
          <h1 class="page-title">Kalender Ketersediaan</h1>
        </div>
        <button type="button" class="btn sm" data-action="open-availability-modal">Atur Tanggal</button>
      </div>

      <div class="panel">
        <div class="panel-head"><h2>Tanggal dengan Booking Aktif</h2></div>
        ${
          activeDates.length
            ? activeDates
                .map(
                  (b) => `
                <div class="list-row">
                  <span class="tabular"><strong>${formatDate(b.tanggalAcara)}</strong> &middot; ${escapeHtml(b.lokasiAcara)}</span>
                  <span class="status-label ${statusClass(b.statusBooking)}">${escapeHtml(b.statusBooking)}</span>
                </div>
              `
                )
                .join('')
            : `<div class="empty-state"><p>Belum ada tanggal dengan booking aktif.</p></div>`
        }
      </div>

      <div class="panel">
        <div class="panel-head"><h2>Pengaturan Ketersediaan Manual</h2></div>
        ${
          customDates.length
            ? customDates
                .map(
                  (row) => `
                <div class="list-row">
                  <div>
                    <strong class="tabular">${formatDate(row.tanggal)}</strong>
                    ${row.catatan ? `<div class="xs muted">${escapeHtml(row.catatan)}</div>` : ''}
                  </div>
                  <div class="row-gap">
                    <span class="status-label ${statusClass(row.status)}">${escapeHtml(row.status === 'tersedia' ? 'Tersedia' : 'Tidak Tersedia')}</span>
                    <button type="button" class="btn sm danger" data-action="delete-availability" data-id="${escapeHtml(row.id)}">Hapus</button>
                  </div>
                </div>
              `
                )
                .join('')
            : `<div class="empty-state"><p>Belum ada tanggal khusus yang ditandai.</p></div>`
        }
      </div>
    `
  );
}

function renderCustomerList(route, db, bookings) {
  const customerIds = [...new Set(bookings.map((b) => b.customerId))];
  const customers = customerIds
    .map((cid) => db.users.find((u) => u.id === cid))
    .filter(Boolean);

  return renderDashboardShell(
    route,
    VENDOR_NAV,
    `
      <div class="dash-header">
        <div>
          <p class="kicker">Relasi Klien</p>
          <h1 class="page-title">Daftar Pelanggan</h1>
        </div>
      </div>

      <div class="panel">
        ${
          customers.length
            ? customers
                .map((c) => {
                  const count = bookings.filter((b) => b.customerId === c.id).length;
                  return `
                    <div class="list-row">
                      <div>
                        <strong>${escapeHtml(c.nama)}</strong>
                        <div class="small muted">${escapeHtml(c.email)}</div>
                      </div>
                      <span class="small muted tabular">${count} booking</span>
                    </div>
                  `;
                })
                .join('')
            : `<div class="empty-state"><p>Daftar pelanggan akan muncul otomatis setelah ada booking masuk.</p></div>`
        }
      </div>
    `
  );
}

function renderTransactions(route, db, bookings) {
  return renderDashboardShell(
    route,
    VENDOR_NAV,
    `
      <div class="dash-header">
        <div>
          <p class="kicker">Catatan Keuangan</p>
          <h1 class="page-title">Riwayat Transaksi</h1>
          <p class="muted" style="margin: 0;">Catat penerimaan DP atau pelunasan untuk setiap booking.</p>
        </div>
      </div>

      <div class="panel">
        ${
          bookings.length
            ? `<div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Pelanggan</th>
                      <th class="num">Total Tagihan</th>
                      <th class="num">DP Tercatat</th>
                      <th class="num">Sisa</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${bookings
                      .map((b) => {
                        const customer = db.users.find((u) => u.id === b.customerId);
                        return `
                          <tr>
                            <td>
                              <strong>${escapeHtml(customer?.nama || 'Customer')}</strong>
                              <div class="xs muted tabular">${formatDate(b.tanggalAcara)}</div>
                            </td>
                            <td class="num">${formatCurrency(b.totalHarga)}</td>
                            <td class="num">${formatCurrency(b.jumlahDP)}</td>
                            <td class="num">${formatCurrency(b.sisaPembayaran)}</td>
                            <td><span class="status-label ${statusClass(b.statusPembayaran)}">${escapeHtml(b.statusPembayaran)}</span></td>
                            <td>
                              ${
                                b.sisaPembayaran > 0
                                  ? `<button type="button" class="btn sm outline" data-action="open-payment-modal" data-id="${escapeHtml(b.id)}">Catat Bayar</button>`
                                  : `<span class="xs muted">Lunas</span>`
                              }
                            </td>
                          </tr>
                        `;
                      })
                      .join('')}
                  </tbody>
                </table>
              </div>`
            : `<div class="empty-state"><p>Belum ada catatan transaksi.</p></div>`
        }
      </div>
    `
  );
}
