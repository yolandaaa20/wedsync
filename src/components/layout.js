import { getCurrentUser, getDB, roleLabel } from '../state/store.js';
import { escapeHtml, formatCurrency, renderMediaBox } from '../utils/helpers.js';

function getRoleNavLinks(user, currentRoute) {
  if (!user) {
    return [
      { label: 'Beranda', route: '/home', active: currentRoute === '/home' },
      { label: 'Cari Vendor', route: '/explore', active: currentRoute === '/explore' || currentRoute.startsWith('/vendor-detail/') },
      { label: 'Masuk', route: '/login', active: currentRoute === '/login' },
      { label: 'Daftar', route: '/register', active: currentRoute === '/register' },
    ];
  }
  if (user.role === 'customer') {
    return [
      { label: 'Beranda', route: '/home', active: currentRoute === '/home' },
      { label: 'Cari Vendor', route: '/explore', active: currentRoute === '/explore' || currentRoute.startsWith('/vendor-detail/') },
      { label: 'Planner', route: '/customer/planner', active: currentRoute === '/customer/planner' },
      { label: 'Booking', route: '/customer/bookings', active: currentRoute === '/customer/bookings' },
    ];
  }
  if (user.role === 'vendor') {
    return [
      { label: 'Overview', route: '/vendor', active: currentRoute === '/vendor' },
      { label: 'Layanan', route: '/vendor/services', active: currentRoute === '/vendor/services' },
      { label: 'Booking', route: '/vendor/requests', active: currentRoute === '/vendor/requests' },
      { label: 'Kalender', route: '/vendor/availability', active: currentRoute === '/vendor/availability' },
    ];
  }
  return [
    { label: 'Overview', route: '/admin', active: currentRoute === '/admin' },
    { label: 'Vendor', route: '/admin/vendors', active: currentRoute === '/admin/vendors' },
    { label: 'Pengguna', route: '/admin/users', active: currentRoute === '/admin/users' },
    { label: 'Booking', route: '/admin/bookings', active: currentRoute === '/admin/bookings' },
  ];
}

function getPrimaryTopAction(user, currentRoute) {
  if (!user) {
    if (currentRoute === '/register') {
      return { label: 'Sudah Punya Akun', route: '/login' };
    }
    if (currentRoute === '/login') {
      return { label: 'Daftar Akun Baru', route: '/register' };
    }
    return { label: 'Daftar Sekarang', route: '/register' };
  }
  const baseRoute = `/${user.role}`;
  if (currentRoute.startsWith(baseRoute)) {
    return {
      label: 'Keluar',
      action: 'logout',
    };
  }
  return {
    label: 'Buka Dashboard',
    route: baseRoute,
  };
}

export function renderHeader(currentRoute) {
  const user = getCurrentUser();
  const navLinks = getRoleNavLinks(user, currentRoute);
  const primary = getPrimaryTopAction(user, currentRoute);

  return `
    <header class="topbar">
      <div class="container topbar-inner">
        <a class="brand-wordmark" href="#/home" data-route="/home">WED<span>SYNC</span></a>
        <nav class="nav-links" aria-label="Navigasi utama">
          ${navLinks
            .map(
              (link) => `
            <a class="nav-link ${link.active ? 'active' : ''}" href="#${link.route}" data-route="${link.route}">
              ${escapeHtml(link.label)}
            </a>
          `
            )
            .join('')}
        </nav>
        <div class="topbar-actions">
          ${
            primary.action
              ? `<button type="button" class="btn sm outline" data-action="${primary.action}">${escapeHtml(primary.label)}</button>`
              : `<a class="btn sm" href="#${primary.route}" data-route="${primary.route}">${escapeHtml(primary.label)}</a>`
          }
          <button type="button" class="mobile-nav-btn" data-action="toggle-mobile-nav" aria-label="Buka menu navigasi">
            &#9776;
          </button>
        </div>
      </div>
    </header>
    <div id="mobile-drawer" class="mobile-drawer">
      ${navLinks
        .map(
          (link) => `
        <a class="nav-link ${link.active ? 'active' : ''}" href="#${link.route}" data-route="${link.route}">
          ${escapeHtml(link.label)}
        </a>
      `
        )
        .join('')}
    </div>
  `;
}

export function renderFooter() {
  return `
    <footer class="site-footer">
      <div class="container footer-inner">
        <div>
          <a class="brand-wordmark" href="#/home" data-route="/home">WED<span>SYNC</span></a>
          <p>Platform marketplace pernikahan, perencana acara, dan manajemen vendor.</p>
        </div>
        <p>Seluruh data paket, ketersediaan, dan transaksi menggunakan penyimpanan lokal.</p>
      </div>
    </footer>
  `;
}

export function renderDashboardShell(currentRoute, navItems, contentHtml) {
  const user = getCurrentUser();
  return `
    ${renderHeader(currentRoute)}
    <main class="page-wrap">
      <div class="container dashboard-layout">
        <aside class="sidebar" aria-label="Menu workspace">
          <div class="sidebar-profile">
            <strong>${escapeHtml(user?.nama || '')}</strong>
            <span>${escapeHtml(roleLabel(user?.role))} · ${escapeHtml(user?.email || '')}</span>
          </div>
          <div class="side-group-label">Menu ${escapeHtml(roleLabel(user?.role))}</div>
          ${navItems
            .map(
              (item) => `
            <a class="side-link ${currentRoute === item.route ? 'active' : ''}" href="#${item.route}" data-route="${item.route}">
              ${escapeHtml(item.label)}
            </a>
          `
            )
            .join('')}
          <div class="side-group-label">Akun</div>
          ${
            user?.role === 'customer'
              ? `<a class="side-link" href="#/explore" data-route="/explore">Jelajahi Marketplace</a>`
              : ''
          }
          <button type="button" class="side-link" data-action="logout">Keluar dari Akun</button>
        </aside>
        <section class="dash-main">
          ${contentHtml}
        </section>
      </div>
    </main>
    ${renderFooter()}
  `;
}

export function renderVendorCard(vendor, compareIds = []) {
  const db = getDB();
  const user = getCurrentUser();
  const isFavorite = user
    ? db.favorites.some((f) => f.vendorId === vendor.id && f.customerId === user.id)
    : false;
  const isCompared = compareIds.includes(vendor.id);
  const minPrice = vendor.packages?.length
    ? Math.min(...vendor.packages.map((p) => Number(p.harga || 0)))
    : 0;

  return `
    <article class="vendor-card" data-ar-card data-ar-tilt="9">
      <div class="ar-glare"></div>
      <div class="ar-reticle"></div>
      <span class="ar-depth-tag">AR 3D</span>
      ${renderMediaBox(vendor.imageUrl, vendor.namaUsaha, vendor.namaUsaha)}
      <div class="vendor-body">
        <div class="meta-line">
          <span>${escapeHtml(vendor.kategori)}</span>
          <span aria-hidden="true">&middot;</span>
          <span>${escapeHtml(vendor.lokasi)}</span>
          <span aria-hidden="true">&middot;</span>
          <span class="tabular">&#9733; ${escapeHtml(vendor.ratingSimulasi)}</span>
          <span aria-hidden="true">&middot;</span>
          <span>${vendor.packages.length} paket</span>
        </div>
        <h3 class="vendor-name">${escapeHtml(vendor.namaUsaha)}</h3>
        <p class="vendor-desc">${escapeHtml(vendor.deskripsi.slice(0, 92))}${vendor.deskripsi.length > 92 ? '...' : ''}</p>
        <div class="vendor-footer">
          <div>
            <div class="price-label">Mulai dari</div>
            <div class="price-value">${formatCurrency(minPrice)}</div>
          </div>
          <div class="vendor-actions">
            <button
              type="button"
              class="btn sm soft"
              data-action="open-ar-preview"
              data-id="${escapeHtml(vendor.id)}"
              title="Buka pratinjau ruang AR 3D"
            >AR 3D</button>
            <button
              type="button"
              class="btn sm outline"
              data-action="toggle-favorite"
              data-id="${escapeHtml(vendor.id)}"
              aria-label="${isFavorite ? 'Hapus dari favorit' : 'Simpan ke favorit'}"
            >${isFavorite ? 'Tersimpan' : 'Simpan'}</button>
            <a class="btn sm" href="#/vendor-detail/${escapeHtml(vendor.id)}" data-route="/vendor-detail/${escapeHtml(vendor.id)}">Detail</a>
          </div>
        </div>
        <div style="margin-top: 10px;">
          <button
            type="button"
            class="btn sm outline block"
            data-action="toggle-compare"
            data-id="${escapeHtml(vendor.id)}"
          >${isCompared ? 'Hapus dari Perbandingan' : 'Bandingkan Layanan'}</button>
        </div>
      </div>
    </article>
  `;
}
