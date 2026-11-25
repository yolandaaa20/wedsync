import {
  getActiveProject,
  getCurrentUser,
  getDB,
  getPackageById,
  getVendorById,
} from '../state/store.js';
import {
  escapeHtml,
  formatCurrency,
  formatDate,
  statusClass,
} from '../utils/helpers.js';
import { renderDashboardShell, renderVendorCard } from '../components/layout.js';

export const CUSTOMER_NAV = [
  { route: '/customer', label: 'Overview' },
  { route: '/customer/planner', label: 'Wedding Planner' },
  { route: '/customer/budget', label: 'Budget Planner' },
  { route: '/customer/bookings', label: 'My Bookings' },
  { route: '/customer/favorites', label: 'Favorit' },
  { route: '/customer/collab', label: 'Kolaborasi Tim' },
  { route: '/customer/readiness', label: 'Laporan Kesiapan' },
];

export function renderCustomerView(route, compareIds) {
  const user = getCurrentUser();
  const db = getDB();
  const project = getActiveProject(user.id);
  const bookings = db.bookings.filter((b) => b.customerId === user.id);

  if (route === '/customer/planner') {
    return renderPlanner(route, user, db, project, bookings);
  }
  if (route === '/customer/budget') {
    return renderBudget(route, db, project);
  }
  if (route === '/customer/bookings') {
    return renderBookings(route, bookings);
  }
  if (route === '/customer/favorites') {
    return renderFavorites(route, user, db, compareIds);
  }
  if (route === '/customer/collab') {
    return renderCollab(route, db, project);
  }
  if (route === '/customer/readiness') {
    return renderReadiness(route, db, project);
  }

  return renderOverview(route, user, db, project, bookings);
}

function renderOverview(route, user, db, project, bookings) {
  const tasks = project ? db.checklist.filter((t) => t.weddingProjectId === project.id) : [];
  const doneCount = tasks.filter((t) => t.status === 'Selesai').length;
  const progressPct = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;
  const favCount = db.favorites.filter((f) => f.customerId === user.id).length;
  const spent = project
    ? db.budget
        .filter((x) => x.weddingProjectId === project.id)
        .reduce((sum, x) => sum + Number(x.biayaAktual || 0), 0)
    : 0;

  return renderDashboardShell(
    route,
    CUSTOMER_NAV,
    `
      <div class="dash-header">
        <div>
          <p class="kicker">Workspace Calon Pengantin</p>
          <h1 class="page-title">Halo, ${escapeHtml(user.nama.split(' ')[0])}</h1>
          <p class="muted" style="margin: 0;">Pantau jadwal persiapan, booking vendor, dan realisasi anggaran Anda.</p>
        </div>
        <a class="btn sm" href="#/explore" data-route="/explore">Cari Vendor Baru</a>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card">
          <span class="kpi-label">Progress Persiapan</span>
          <strong class="kpi-value">${progressPct}%</strong>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Total Booking</span>
          <strong class="kpi-value">${bookings.length}</strong>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Vendor Favorit</span>
          <strong class="kpi-value">${favCount}</strong>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Pengeluaran Aktual</span>
          <strong class="kpi-value money">${formatCurrency(spent)}</strong>
        </div>
      </div>

      <div class="panel">
        <div class="panel-head">
          <div>
            <h2>${escapeHtml(project?.namaAcara || 'Belum Ada Proyek Pernikahan')}</h2>
            <p class="small muted" style="margin: 4px 0 0;">
              ${project ? `${formatDate(project.tanggalPernikahan)} · ${escapeHtml(project.lokasi)} · ${project.jumlahTamu} tamu` : 'Buat proyek pertama untuk mulai menyusun checklist.'}
            </p>
          </div>
          ${
            project
              ? `<a class="btn sm outline" href="#/customer/planner" data-route="/customer/planner">Kelola Planner</a>`
              : `<button type="button" class="btn sm" data-action="open-project-modal">Buat Proyek</button>`
          }
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width: ${progressPct}%;"></div>
        </div>
        <div class="small muted tabular">${doneCount} dari ${tasks.length} tugas persiapan selesai</div>
      </div>

      <div class="panel">
        <div class="panel-head">
          <h2>Booking Terbaru</h2>
          <a class="btn sm outline" href="#/customer/bookings" data-route="/customer/bookings">Lihat Semua</a>
        </div>
        ${
          bookings.length
            ? bookings
                .slice(-4)
                .reverse()
                .map((b) => {
                  const vendor = getVendorById(b.vendorId);
                  return `
                    <div class="list-row">
                      <div>
                        <strong>${escapeHtml(vendor?.namaUsaha || 'Vendor')}</strong>
                        <div class="small muted tabular">${formatDate(b.tanggalAcara)} &middot; ${formatCurrency(b.totalHarga)}</div>
                      </div>
                      <span class="status-label ${statusClass(b.statusBooking)}">${escapeHtml(b.statusBooking)}</span>
                    </div>
                  `;
                })
                .join('')
            : `<div class="empty-state">
                <p>Belum ada permintaan booking vendor.</p>
                <a class="btn sm" href="#/explore" data-route="/explore">Jelajahi Vendor</a>
              </div>`
        }
      </div>
    `
  );
}

function renderPlanner(route, user, db, project, bookings) {
  if (!project) {
    return renderDashboardShell(
      route,
      CUSTOMER_NAV,
      `
        <div class="dash-header">
          <div>
            <p class="kicker">Perencanaan Acara</p>
            <h1 class="page-title">Wedding Planner</h1>
          </div>
          <button type="button" class="btn sm" data-action="open-project-modal">Buat Proyek Baru</button>
        </div>
        <div class="panel empty-state">
          <p>Anda belum memiliki proyek pernikahan aktif.</p>
          <button type="button" class="btn" data-action="open-project-modal">Buat Proyek Pernikahan</button>
        </div>
      `
    );
  }

  const tasks = db.checklist.filter((t) => t.weddingProjectId === project.id);
  const doneCount = tasks.filter((t) => t.status === 'Selesai').length;
  const pct = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;
  const confirmedBookings = bookings.filter(
    (b) => b.weddingProjectId === project.id && b.statusBooking === 'Diterima'
  );

  return renderDashboardShell(
    route,
    CUSTOMER_NAV,
    `
      <div class="dash-header">
        <div>
          <p class="kicker">Perencanaan Acara</p>
          <h1 class="page-title">Wedding Planner</h1>
        </div>
        <button type="button" class="btn sm" data-action="open-project-modal">Proyek Baru</button>
      </div>

      <div class="panel">
        <div class="panel-head">
          <div>
            <h2>${escapeHtml(project.namaAcara)}</h2>
            <p class="small muted" style="margin: 4px 0 0;">
              ${formatDate(project.tanggalPernikahan)} &middot; ${escapeHtml(project.lokasi)} &middot; ${project.jumlahTamu} tamu
            </p>
          </div>
          <button
            type="button"
            class="btn sm outline"
            data-action="open-project-modal"
            data-id="${escapeHtml(project.id)}"
          >Ubah Detail Acara</button>
        </div>
        <div class="row-between small">
          <span>Progress Checklist</span>
          <strong class="mono">${pct}%</strong>
        </div>
        <div class="progress-track">
          <div class="progress-fill" style="width: ${pct}%;"></div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-head">
          <h2>Checklist Persiapan</h2>
          <button type="button" class="btn sm soft" data-action="open-task-modal">Tambah Tugas</button>
        </div>
        ${
          tasks.length
            ? tasks
                .map(
                  (t) => `
                <label class="checklist-item ${t.status === 'Selesai' ? 'done' : ''}">
                  <input
                    type="checkbox"
                    ${t.status === 'Selesai' ? 'checked' : ''}
                    data-action="toggle-task"
                    data-id="${escapeHtml(t.id)}"
                  />
                  <span class="task-name">${escapeHtml(t.namaTugas)}</span>
                  <span class="xs muted" style="margin-left: auto;">${escapeHtml(t.kategori)}</span>
                </label>
              `
                )
                .join('')
            : `<div class="empty-state"><p>Belum ada tugas checklist.</p></div>`
        }
      </div>

      <div class="panel">
        <div class="panel-head">
          <h2>Vendor Terkonfirmasi</h2>
        </div>
        ${
          confirmedBookings.length
            ? confirmedBookings
                .map((b) => {
                  const vendor = getVendorById(b.vendorId);
                  return `
                    <div class="list-row">
                      <div>
                        <strong>${escapeHtml(vendor?.namaUsaha || 'Vendor')}</strong>
                        <div class="small muted tabular">${formatDate(b.tanggalAcara)} &middot; ${formatCurrency(b.totalHarga)}</div>
                      </div>
                      <span class="status-label ok">${escapeHtml(b.statusBooking)}</span>
                    </div>
                  `;
                })
                .join('')
            : `<div class="empty-state"><p>Vendor dengan booking berstatus Diterima akan tampil di sini.</p></div>`
        }
      </div>
    `
  );
}

function renderBudget(route, db, project) {
  if (!project) {
    return renderDashboardShell(
      route,
      CUSTOMER_NAV,
      `<div class="panel empty-state"><p>Buat proyek pernikahan di menu Wedding Planner terlebih dahulu.</p></div>`
    );
  }

  const rows = db.budget.filter((x) => x.weddingProjectId === project.id);
  const spent = rows.reduce((sum, x) => sum + Number(x.biayaAktual || 0), 0);
  const remaining = Number(project.totalAnggaran || 0) - spent;
  const pct = project.totalAnggaran ? Math.round((spent / project.totalAnggaran) * 100) : 0;

  return renderDashboardShell(
    route,
    CUSTOMER_NAV,
    `
      <div class="dash-header">
        <div>
          <p class="kicker">Kendali Biaya</p>
          <h1 class="page-title">Budget Planner</h1>
        </div>
        <button type="button" class="btn sm" data-action="open-budget-modal">Catat Pengeluaran</button>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card">
          <span class="kpi-label">Total Anggaran</span>
          <strong class="kpi-value money">${formatCurrency(project.totalAnggaran)}</strong>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Pengeluaran Aktual</span>
          <strong class="kpi-value money">${formatCurrency(spent)}</strong>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Sisa Anggaran</span>
          <strong class="kpi-value money" style="color: ${remaining < 0 ? 'var(--status-err-fg)' : 'var(--status-ok-fg)'}">
            ${formatCurrency(remaining)}
          </strong>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Realisasi</span>
          <strong class="kpi-value">${pct}%</strong>
        </div>
      </div>

      ${
        remaining < 0
          ? `<div class="panel" style="background: var(--status-err-bg); color: var(--status-err-fg); border-color: #ebc5c9;">
              <strong>Peringatan Anggaran:</strong> Total pengeluaran aktual melebihi batas anggaran proyek sebesar ${formatCurrency(Math.abs(remaining))}.
            </div>`
          : ''
      }

      <div class="panel">
        <div class="panel-head">
          <h2>Rincian Anggaran</h2>
          <span class="small muted mono">${formatCurrency(spent)} / ${formatCurrency(project.totalAnggaran)}</span>
        </div>
        <div class="progress-track">
          <div class="progress-fill ${remaining < 0 ? 'warn' : ''}" style="width: ${Math.min(100, Math.max(0, pct))}%;"></div>
        </div>
        ${
          rows.length
            ? `<div class="table-wrap" style="margin-top: 18px;">
                <table>
                  <thead>
                    <tr>
                      <th>Kategori</th>
                      <th>Pos Pengeluaran</th>
                      <th class="num">Estimasi</th>
                      <th class="num">Aktual</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${rows
                      .map(
                        (item) => `
                      <tr>
                        <td>${escapeHtml(item.kategori)}</td>
                        <td>${escapeHtml(item.namaPengeluaran)}</td>
                        <td class="num">${formatCurrency(item.estimasiBiaya)}</td>
                        <td class="num">${formatCurrency(item.biayaAktual)}</td>
                        <td>
                          <div class="row-gap">
                            <button type="button" class="btn sm outline" data-action="open-budget-modal" data-id="${escapeHtml(item.id)}">Ubah</button>
                            <button type="button" class="btn sm danger" data-action="delete-budget" data-id="${escapeHtml(item.id)}">Hapus</button>
                          </div>
                        </td>
                      </tr>
                    `
                      )
                      .join('')}
                  </tbody>
                </table>
              </div>`
            : `<div class="empty-state"><p>Belum ada rincian pos pengeluaran.</p></div>`
        }
      </div>
    `
  );
}

function renderBookings(route, bookings) {
  return renderDashboardShell(
    route,
    CUSTOMER_NAV,
    `
      <div class="dash-header">
        <div>
          <p class="kicker">Riwayat Pemesanan</p>
          <h1 class="page-title">My Bookings</h1>
        </div>
        <a class="btn sm" href="#/explore" data-route="/explore">Cari Vendor Lain</a>
      </div>

      <div class="panel">
        ${
          bookings.length
            ? `<div class="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Vendor</th>
                      <th>Paket</th>
                      <th>Tanggal Acara</th>
                      <th class="num">Total Biaya</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${bookings
                      .map((b) => {
                        const vendor = getVendorById(b.vendorId);
                        const pkg = getPackageById(vendor, b.paketId);
                        return `
                          <tr>
                            <td><strong>${escapeHtml(vendor?.namaUsaha || '-')}</strong></td>
                            <td>${escapeHtml(pkg?.namaPaket || '-')}</td>
                            <td class="tabular">${formatDate(b.tanggalAcara)}</td>
                            <td class="num">${formatCurrency(b.totalHarga)}</td>
                            <td><span class="status-label ${statusClass(b.statusBooking)}">${escapeHtml(b.statusBooking)}</span></td>
                            <td>
                              ${
                                b.statusBooking === 'Menunggu Konfirmasi'
                                  ? `<button type="button" class="btn sm danger" data-action="cancel-customer-booking" data-id="${escapeHtml(b.id)}">Batalkan</button>`
                                  : `<a class="btn sm outline" href="#/vendor-detail/${escapeHtml(b.vendorId)}" data-route="/vendor-detail/${escapeHtml(b.vendorId)}">Lihat Vendor</a>`
                              }
                            </td>
                          </tr>
                        `;
                      })
                      .join('')}
                  </tbody>
                </table>
              </div>`
            : `<div class="empty-state">
                <p>Belum ada pemesanan yang diajukan.</p>
                <a class="btn sm" href="#/explore" data-route="/explore">Jelajahi Vendor</a>
              </div>`
        }
      </div>
    `
  );
}

function renderFavorites(route, user, db, compareIds) {
  const favVendors = db.favorites
    .filter((f) => f.customerId === user.id)
    .map((f) => getVendorById(f.vendorId))
    .filter(Boolean);

  return renderDashboardShell(
    route,
    CUSTOMER_NAV,
    `
      <div class="dash-header">
        <div>
          <p class="kicker">Daftar Simpanan</p>
          <h1 class="page-title">Vendor Favorit</h1>
        </div>
        <a class="btn sm outline" href="#/explore" data-route="/explore">Jelajahi Katalog</a>
      </div>
      <div class="vendor-grid">
        ${
          favVendors.length
            ? favVendors.map((v) => renderVendorCard(v, compareIds)).join('')
            : `<div class="panel empty-state" style="grid-column: 1 / -1;">
                <p>Belum ada vendor yang disimpan ke favorit.</p>
                <a class="btn sm" href="#/explore" data-route="/explore">Cari Vendor</a>
              </div>`
        }
      </div>
    `
  );
}

function renderCollab(route, db, project) {
  const accepted = project
    ? db.bookings.filter((b) => b.weddingProjectId === project.id && b.statusBooking === 'Diterima')
    : [];
  const collabTasks = project
    ? db.collaborations.filter((c) => c.weddingProjectId === project.id)
    : [];

  return renderDashboardShell(
    route,
    CUSTOMER_NAV,
    `
      <div class="dash-header">
        <div>
          <p class="kicker">Koordinasi Lapangan</p>
          <h1 class="page-title">Kolaborasi Tim Vendor</h1>
          <p class="muted" style="margin: 0;">Vendor dengan booking berstatus Diterima dapat diberi tugas koordinasi di sini.</p>
        </div>
      </div>

      <div class="panel">
        <div class="panel-head">
          <h2>${escapeHtml(project?.namaAcara || 'Proyek Pernikahan')}</h2>
        </div>
        ${
          accepted.length
            ? accepted
                .map((b) => {
                  const vendor = getVendorById(b.vendorId);
                  const task = collabTasks.find((c) => c.vendorId === vendor.id);
                  const taskStatus = task?.statusPekerjaan || 'Belum Dimulai';
                  return `
                    <div class="list-row">
                      <div>
                        <strong>${escapeHtml(vendor?.namaUsaha || 'Vendor')}</strong>
                        <div class="small muted">${escapeHtml(vendor?.kategori || '')} &middot; ${formatDate(b.tanggalAcara)}</div>
                        <div class="small text-secondary" style="margin-top: 4px;">
                          ${escapeHtml(task?.namaTugas || 'Pelaksanaan layanan sesuai kesepakatan paket')}
                        </div>
                      </div>
                      <div class="row-gap">
                        <span class="status-label ${statusClass(taskStatus)}">${escapeHtml(taskStatus)}</span>
                        <button type="button" class="btn sm outline" data-action="open-collab-modal" data-id="${escapeHtml(vendor.id)}">Atur Tugas</button>
                      </div>
                    </div>
                  `;
                })
                .join('')
            : `<div class="empty-state">
                <p>Belum ada vendor terkonfirmasi untuk proyek ini.</p>
              </div>`
        }
      </div>
    `
  );
}

function renderReadiness(route, db, project) {
  const tasks = project ? db.checklist.filter((t) => t.weddingProjectId === project.id) : [];
  const doneCount = tasks.filter((t) => t.status === 'Selesai').length;
  const bookings = project ? db.bookings.filter((b) => b.weddingProjectId === project.id) : [];
  const pendingCount = bookings.filter((b) => b.statusBooking === 'Menunggu Konfirmasi').length;
  const acceptedCount = bookings.filter((b) => b.statusBooking === 'Diterima').length;
  const budgetRows = project ? db.budget.filter((x) => x.weddingProjectId === project.id) : [];
  const spent = budgetRows.reduce((sum, x) => sum + Number(x.biayaAktual || 0), 0);

  const score = Math.round(
    (tasks.length ? (doneCount / tasks.length) * 55 : 0) +
      (bookings.length ? (acceptedCount / bookings.length) * 30 : 0) +
      (project?.totalAnggaran > 0 ? 15 : 0)
  );

  const notes = [];
  if (doneCount < tasks.length) {
    notes.push(`${tasks.length - doneCount} tugas checklist persiapan masih belum selesai.`);
  }
  if (pendingCount > 0) {
    notes.push(`${pendingCount} permintaan booking masih menunggu konfirmasi vendor.`);
  }
  if (!project?.totalAnggaran) {
    notes.push('Tetapkan total anggaran proyek agar pemantauan biaya lebih akurat.');
  }
  if (!budgetRows.length) {
    notes.push('Tambahkan rincian anggaran untuk kategori utama seperti katering dan dekorasi.');
  }
  if (!notes.length) {
    notes.push('Seluruh indikator utama terpenuhi. Pertahankan koordinasi dengan tim vendor.');
  }

  return renderDashboardShell(
    route,
    CUSTOMER_NAV,
    `
      <div class="dash-header">
        <div>
          <p class="kicker">Ringkasan Progres</p>
          <h1 class="page-title">Laporan Kesiapan Pernikahan</h1>
          <p class="muted" style="margin: 0;">Dihitung langsung dari kelengkapan checklist, konfirmasi vendor, dan anggaran.</p>
        </div>
      </div>

      <div class="panel">
        <div class="row-between">
          <div>
            <span class="small muted">Indikator Kesiapan Keseluruhan</span>
            <div class="display-title" style="margin: 4px 0 0;">${score}%</div>
          </div>
          <div style="width: min(360px, 100%);">
            <div class="progress-track">
              <div class="progress-fill" style="width: ${score}%;"></div>
            </div>
            <span class="xs muted">Berdasarkan bobot checklist (55%), booking diterima (30%), dan target anggaran (15%).</span>
          </div>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card">
          <span class="kpi-label">Checklist Selesai</span>
          <strong class="kpi-value">${doneCount}/${tasks.length}</strong>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Booking Diterima</span>
          <strong class="kpi-value">${acceptedCount}</strong>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Menunggu Konfirmasi</span>
          <strong class="kpi-value">${pendingCount}</strong>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Anggaran Terpakai</span>
          <strong class="kpi-value">${project?.totalAnggaran ? Math.round((spent / project.totalAnggaran) * 100) : 0}%</strong>
        </div>
      </div>

      <div class="panel">
        <div class="panel-head">
          <h2>Tindak Lanjut yang Disarankan</h2>
        </div>
        ${notes.map((n) => `<p style="margin: 8px 0;">&bull; ${escapeHtml(n)}</p>`).join('')}
        <div class="row-gap" style="margin-top: 18px;">
          <a class="btn sm" href="#/customer/planner" data-route="/customer/planner">Perbarui Checklist</a>
          <a class="btn sm soft" href="#/customer/bookings" data-route="/customer/bookings">Cek Status Booking</a>
          <a class="btn sm outline" href="#/customer/budget" data-route="/customer/budget">Kelola Anggaran</a>
        </div>
      </div>
    `
  );
}
