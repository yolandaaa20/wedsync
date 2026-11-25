import { IMAGES } from '../data/seed.js';
import { getDB } from '../state/store.js';
import { escapeHtml } from '../utils/helpers.js';
import { renderFooter, renderHeader } from '../components/layout.js';

const ROLE_META = {
  customer: {
    label: 'User / Customer',
    headline: 'Rencanakan hari pernikahan dalam satu ruang kerja terpadu.',
    summary:
      'Akses Wedding Planner, pelacak anggaran, perbandingan vendor, dan laporan kesiapan acara.',
    helper:
      'Masuk sebagai calon pengantin atau perencana pribadi untuk mengelola proyek pernikahan dan booking vendor.',
    canRegister: true,
  },
  vendor: {
    label: 'Vendor',
    headline: 'Kelola profil usaha, paket layanan, dan jadwal pemesanan Anda.',
    summary:
      'Terima permintaan booking, hindari bentrok tanggal, kelola katalog paket, dan catat pembayaran.',
    helper:
      'Masuk ke workspace mitra vendor untuk mengatur ketersediaan tanggal, paket layanan, dan permintaan pelanggan.',
    canRegister: true,
  },
  admin: {
    label: 'Admin',
    headline: 'Kontrol penuh atas direktori vendor, pengguna, dan transaksi platform.',
    summary:
      'Moderasi mitra vendor, kelola kategori layanan, pantau seluruh booking, dan atur akses akun.',
    helper:
      'Portal khusus administrator platform untuk pengawasan operasional dan moderasi marketplace WEDSYNC.',
    canRegister: false,
  },
};

export function renderAuthPage(authState, currentRoute = '/login') {
  const db = getDB();
  const isRegisterPage = currentRoute === '/register';
  let role = ROLE_META[authState.role] ? authState.role : 'customer';
  if (isRegisterPage && !ROLE_META[role].canRegister) {
    role = 'customer';
  }
  const mode = isRegisterPage ? 'register' : 'login';
  const meta = ROLE_META[role];

  return `
    ${renderHeader(currentRoute)}
    <main class="auth-page">
      <section class="auth-visual" data-ar-card data-ar-tilt="5">
        <div class="ar-glare"></div>
        <div class="ar-reticle"></div>
        <img src="${IMAGES.hero}" alt="Suasana resepsi pernikahan" referrerpolicy="no-referrer" />
        <div class="auth-visual-scrim"></div>
        <div class="auth-visual-content">
          <p class="kicker" style="color: #ead3a6;">${isRegisterPage ? 'Pendaftaran Akun' : 'Portal Akses'} ${escapeHtml(meta.label)}</p>
          <h2>${escapeHtml(meta.headline)}</h2>
          <p>${escapeHtml(meta.summary)}</p>
          <div class="auth-role-summary">
            Tampilan aplikasi, navigasi, dan fitur akan disesuaikan secara otomatis berdasarkan peran yang Anda pilih.
          </div>
        </div>
      </section>

      <section class="auth-panel">
        <div class="auth-card">
          <p class="kicker">${mode === 'register' ? 'Pendaftaran Pengguna &amp; Mitra' : 'Autentikasi Peran'}</p>
          <h1 class="page-title">${mode === 'login' ? 'Masuk ke WEDSYNC' : 'Daftar Akun WEDSYNC'}</h1>
          <p class="small muted" style="margin: 0 0 18px;">
            ${mode === 'login' ? 'Pilih peran akun Anda terlebih dahulu.' : 'Pilih jenis akun yang ingin Anda daftarkan.'}
          </p>

          ${
            mode === 'login'
              ? `
            <div class="segmented" role="tablist" aria-label="Pilih peran login">
              <button
                type="button"
                role="tab"
                aria-selected="${role === 'customer'}"
                class="seg-btn ${role === 'customer' ? 'active' : ''}"
                data-action="auth-select-role"
                data-role="customer"
              >User</button>
              <button
                type="button"
                role="tab"
                aria-selected="${role === 'vendor'}"
                class="seg-btn ${role === 'vendor' ? 'active' : ''}"
                data-action="auth-select-role"
                data-role="vendor"
              >Vendor</button>
              <button
                type="button"
                role="tab"
                aria-selected="${role === 'admin'}"
                class="seg-btn ${role === 'admin' ? 'active' : ''}"
                data-action="auth-select-role"
                data-role="admin"
              >Admin</button>
            </div>
          `
              : `
            <div class="segmented two-col" role="tablist" aria-label="Pilih peran pendaftaran">
              <button
                type="button"
                role="tab"
                aria-selected="${role === 'customer'}"
                class="seg-btn ${role === 'customer' ? 'active' : ''}"
                data-action="auth-select-role"
                data-role="customer"
              >Daftar User</button>
              <button
                type="button"
                role="tab"
                aria-selected="${role === 'vendor'}"
                class="seg-btn ${role === 'vendor' ? 'active' : ''}"
                data-action="auth-select-role"
                data-role="vendor"
              >Daftar Vendor</button>
            </div>
          `
          }

          <div class="role-helper-text">${escapeHtml(meta.helper)}</div>

          ${authState.error ? `<div class="form-error" role="alert">${escapeHtml(authState.error)}</div>` : ''}

          ${
            mode === 'login'
              ? `
            <form id="login-form" data-form="login">
              <input type="hidden" name="role" value="${escapeHtml(role)}" />
              <div class="field">
                <label for="login-email">Alamat Email</label>
                <input
                  id="login-email"
                  name="email"
                  type="email"
                  required
                  autocomplete="email"
                  placeholder="nama@email.com"
                  value="${escapeHtml(authState.emailDraft || '')}"
                />
              </div>
              <div class="field">
                <label for="login-password">Kata Sandi</label>
                <div class="password-wrap">
                  <input
                    id="login-password"
                    name="password"
                    type="${authState.showPassword ? 'text' : 'password'}"
                    required
                    autocomplete="current-password"
                    placeholder="Masukkan kata sandi"
                    value="${escapeHtml(authState.passwordDraft || '')}"
                  />
                  <button
                    type="button"
                    class="password-toggle"
                    data-action="toggle-password-visibility"
                  >${authState.showPassword ? 'Sembunyikan' : 'Tampilkan'}</button>
                </div>
              </div>
              <button type="submit" class="btn block">Masuk sebagai ${escapeHtml(meta.label)}</button>
            </form>

            <div class="auth-switch-note">
              Belum memiliki akun User atau Vendor? <a href="#/register" data-route="/register">Daftar di halaman pendaftaran</a>
            </div>
          `
              : `
            <form id="register-form" data-form="register">
              <input type="hidden" name="role" value="${escapeHtml(role)}" />
              <div class="field">
                <label for="reg-nama">Nama Lengkap</label>
                <input id="reg-nama" name="nama" type="text" required placeholder="Contoh: Nadia Kusuma" />
              </div>
              ${
                role === 'vendor'
                  ? `
                <div class="field">
                  <label for="reg-usaha">Nama Usaha Vendor</label>
                  <input id="reg-usaha" name="namaUsaha" type="text" required placeholder="Contoh: Studio Harmoni" />
                </div>
                <div class="field">
                  <label for="reg-kategori">Kategori Layanan</label>
                  <select id="reg-kategori" name="kategori" required>
                    ${db.categories.map((cat) => `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`).join('')}
                  </select>
                </div>
                <div class="field">
                  <label for="reg-lokasi">Kota / Lokasi</label>
                  <input id="reg-lokasi" name="lokasi" type="text" required placeholder="Contoh: Banda Aceh" />
                </div>
              `
                  : ''
              }
              <div class="field">
                <label for="reg-email">Alamat Email</label>
                <input id="reg-email" name="email" type="email" required autocomplete="email" placeholder="nama@email.com" />
              </div>
              <div class="field">
                <label for="reg-password">Kata Sandi (minimal 6 karakter)</label>
                <input id="reg-password" name="password" type="password" minlength="6" required autocomplete="new-password" placeholder="Buat kata sandi" />
              </div>
              <button type="submit" class="btn block">Daftar &amp; Masuk sebagai ${escapeHtml(meta.label)}</button>
            </form>

            <div class="auth-switch-note">
              Sudah memiliki akun? <a href="#/login" data-route="/login">Masuk ke akun Anda</a>
            </div>
          `
          }
        </div>
      </section>
    </main>
    ${renderFooter()}
  `;
}
