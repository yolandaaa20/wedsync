import { IMAGES } from '../data/seed.js';
import {
  getActiveProject,
  getCurrentUser,
  getDB,
  getVendorById,
} from '../state/store.js';
import {
  escapeHtml,
  formatCurrency,
  renderMediaBox,
  todayISO,
} from '../utils/helpers.js';
import { renderFooter, renderHeader, renderVendorCard } from '../components/layout.js';

export function renderHome(compareIds) {
  const db = getDB();
  const featured = db.vendors.filter((v) => v.statusAktif).slice(0, 6);
  const categories = db.categories;

  return `
    ${renderHeader('/home')}
    <main>
      <section class="hero">
        <div class="container hero-grid">
          <div class="hero-copy">
            <p class="kicker">Perencanaan Pernikahan Terintegrasi</p>
            <h1 class="display-title">Mulai kisah indahmu dengan persiapan yang lebih terarah.</h1>
            <p class="hero-lead">
              Temukan vendor pernikahan terkurasi, pratinjau konsep layanan dalam mode AR 3D interaktif, kendalikan anggaran, dan koordinasikan jadwal tim dalam satu ruang kerja.
            </p>
            <div class="hero-cta-row">
              <a class="btn" href="#/explore" data-route="/explore">Jelajahi Semua Jasa</a>
              <a class="btn outline" href="#/login" data-route="/login">Masuk ke Workspace</a>
            </div>
            <div class="hero-meta">
              ${db.categories.length} Kategori Jasa &middot; ${db.vendors.filter((v) => v.statusAktif).length}+ Vendor Aktif &middot; Pratinjau AR 3D Interaktif
            </div>
          </div>

          <div class="hero-media" data-ar-card data-ar-tilt="8">
            <div class="ar-glare"></div>
            <div class="ar-reticle"></div>
            <span class="ar-depth-tag">AR SPATIAL 3D</span>
            <img src="${IMAGES.hero}" alt="Suasana resepsi pernikahan outdoor" referrerpolicy="no-referrer" />
            <div class="hero-scrim">
              <strong>Satu Ruang untuk Setiap Detail Acara</strong>
              <span>Gerakkan kursor untuk menjelajahi kedalaman ruang 3D dan pratinjau layanan.</span>
            </div>
          </div>
        </div>
      </section>

      <section class="section">
        <div class="container">
          <div class="section-head">
            <div>
              <p class="kicker">Kategori Layanan (${categories.length} Jasa Tersedia)</p>
              <h2 class="section-title">Temukan semua kebutuhan acaramu</h2>
              <p>Arahkan kursor ke setiap menu kategori untuk melihat efek ruang 3D dan telusuri penyedia jasanya.</p>
            </div>
            <a class="btn sm outline" href="#/explore" data-route="/explore">Semua Kategori</a>
          </div>
          <div class="category-grid">
            ${categories
              .map(
                (cat, idx) => `
              <button
                type="button"
                class="category-tile"
                data-ar-card
                data-ar-tilt="12"
                data-action="filter-by-category"
                data-category="${escapeHtml(cat)}"
              >
                <div class="ar-glare"></div>
                <div class="ar-reticle"></div>
                <span class="cat-index">${String(idx + 1).padStart(2, '0')}</span>
                <span class="cat-name">${escapeHtml(cat)}</span>
              </button>
            `
              )
              .join('')}
          </div>
        </div>
      </section>

      <section class="section tinted">
        <div class="container">
          <div class="section-head">
            <div>
              <p class="kicker">Pilihan Terkurasi</p>
              <h2 class="section-title">Vendor &amp; jasa populer minggu ini</h2>
              <p>Partner layanan lengkap mulai dari rias pengantin, venue, orkestra musik, hingga cincin &amp; seserahan.</p>
            </div>
            <a class="btn sm outline" href="#/explore" data-route="/explore">Lihat Semua (${db.vendors.filter((v) => v.statusAktif).length})</a>
          </div>
          <div class="vendor-grid">
            ${featured.map((vendor) => renderVendorCard(vendor, compareIds)).join('')}
          </div>
          <div class="stats-strip">
            <div class="stat-item">
              <strong>${db.vendors.filter((v) => v.statusAktif).length}+</strong>
              <span>Vendor aktif siap dipesan</span>
            </div>
            <div class="stat-item">
              <strong>${db.categories.length}</strong>
              <span>Kategori jasa pernikahan lengkap</span>
            </div>
            <div class="stat-item">
              <strong>3 Peran</strong>
              <span>Workspace khusus User, Vendor, dan Admin</span>
            </div>
          </div>
        </div>
      </section>

      <section class="section" id="how">
        <div class="container">
          <div class="section-head">
            <div>
              <p class="kicker">Alur Kerja Platform</p>
              <h2 class="section-title">Persiapan pernikahan dalam lima langkah</h2>
              <p>Dirancang agar calon pengantin, vendor, dan administrator saling terhubung tanpa miskomunikasi.</p>
            </div>
          </div>
          <div class="steps-grid">
            <article class="step-card" data-ar-card data-ar-tilt="10">
              <div class="ar-glare"></div>
              <div class="ar-reticle"></div>
              <div class="step-num">01</div>
              <h3>Temukan Jasa</h3>
              <p>Saring direktori dari ${db.categories.length} kategori layanan, lokasi kota, dan batas anggaran.</p>
            </article>
            <article class="step-card" data-ar-card data-ar-tilt="10">
              <div class="ar-glare"></div>
              <div class="ar-reticle"></div>
              <div class="step-num">02</div>
              <h3>Pratinjau AR 3D</h3>
              <p>Tinjau visual ruang 3D layanan dan bandingkan hingga tiga vendor sekaligus.</p>
            </article>
            <article class="step-card" data-ar-card data-ar-tilt="10">
              <div class="ar-glare"></div>
              <div class="ar-reticle"></div>
              <div class="step-num">03</div>
              <h3>Ajukan Booking</h3>
              <p>Kirim permintaan tanggal acara dengan pengecekan benturan jadwal otomatis.</p>
            </article>
            <article class="step-card" data-ar-card data-ar-tilt="10">
              <div class="ar-glare"></div>
              <div class="ar-reticle"></div>
              <div class="step-num">04</div>
              <h3>Kelola Anggaran</h3>
              <p>Pantau estimasi terhadap pengeluaran aktual dan status checklist persiapan.</p>
            </article>
            <article class="step-card" data-ar-card data-ar-tilt="10">
              <div class="ar-glare"></div>
              <div class="ar-reticle"></div>
              <div class="step-num">05</div>
              <h3>Kolaborasi Tim</h3>
              <p>Koordinasikan tugas vendor yang telah dikonfirmasi hingga hari perayaan.</p>
            </article>
          </div>
        </div>
      </section>
    </main>
    ${renderFooter()}
  `;
}

export function getFilteredVendors(exploreState) {
  const db = getDB();
  const term = exploreState.search.trim().toLowerCase();
  const loc = exploreState.location.trim().toLowerCase();
  const maxPrice = Number(exploreState.maxPrice || 0);

  const filtered = db.vendors.filter((v) => {
    if (!v.statusAktif) return false;
    if (term && !`${v.namaUsaha} ${v.kategori} ${v.deskripsi}`.toLowerCase().includes(term)) {
      return false;
    }
    if (exploreState.category && v.kategori !== exploreState.category) {
      return false;
    }
    if (loc && !v.lokasi.toLowerCase().includes(loc)) {
      return false;
    }
    if (maxPrice > 0) {
      const minPkg = Math.min(...v.packages.map((p) => Number(p.harga || 0)));
      if (minPkg > maxPrice) return false;
    }
    return true;
  });

  if (exploreState.sort === 'low') {
    filtered.sort(
      (a, b) =>
        Math.min(...a.packages.map((p) => p.harga)) - Math.min(...b.packages.map((p) => p.harga))
    );
  } else if (exploreState.sort === 'high') {
    filtered.sort(
      (a, b) =>
        Math.min(...b.packages.map((p) => p.harga)) - Math.min(...a.packages.map((p) => p.harga))
    );
  } else if (exploreState.sort === 'name') {
    filtered.sort((a, b) => a.namaUsaha.localeCompare(b.namaUsaha));
  }

  return filtered;
}

export function renderCompareTray(compareIds) {
  if (!compareIds.length) return '';
  const names = compareIds
    .map((vid) => getVendorById(vid)?.namaUsaha)
    .filter(Boolean)
    .map(escapeHtml)
    .join(' · ');

  return `
    <div class="compare-tray">
      <div>
        <strong>Perbandingan Vendor (${compareIds.length}/3)</strong>
        <div class="small muted">${names}</div>
      </div>
      <div class="row-gap">
        <button type="button" class="btn sm outline" data-action="clear-compare">Kosongkan</button>
        <button type="button" class="btn sm" data-action="open-compare-modal">Bandingkan Sekarang</button>
      </div>
    </div>
  `;
}

export function renderExplore(exploreState, compareIds) {
  const db = getDB();
  const list = getFilteredVendors(exploreState);

  return `
    ${renderHeader('/explore')}
    <main class="page-wrap container">
      <p class="kicker">Direktori Marketplace</p>
      <h1 class="page-title">Jelajahi Vendor Pernikahan</h1>
      <p class="muted">Cari dan bandingkan layanan sesuai kebutuhan acara serta alokasi anggaran Anda.</p>

      <div class="toolbar">
        <input
          type="search"
          name="search"
          placeholder="Cari nama vendor atau layanan..."
          value="${escapeHtml(exploreState.search)}"
          data-filter="search"
          aria-label="Cari vendor"
        />
        <select name="category" data-filter="category" aria-label="Filter kategori">
          <option value="">Semua kategori</option>
          ${db.categories
            .map(
              (cat) =>
                `<option value="${escapeHtml(cat)}" ${exploreState.category === cat ? 'selected' : ''}>${escapeHtml(cat)}</option>`
            )
            .join('')}
        </select>
        <input
          type="text"
          name="location"
          placeholder="Lokasi kota"
          value="${escapeHtml(exploreState.location)}"
          data-filter="location"
          aria-label="Filter lokasi"
        />
        <input
          type="number"
          name="maxPrice"
          min="0"
          placeholder="Harga maks (Rp)"
          value="${escapeHtml(exploreState.maxPrice)}"
          data-filter="maxPrice"
          aria-label="Filter harga maksimal"
        />
        <select name="sort" data-filter="sort" aria-label="Urutkan vendor">
          <option value="recommended" ${exploreState.sort === 'recommended' ? 'selected' : ''}>Urutan rekomendasi</option>
          <option value="low" ${exploreState.sort === 'low' ? 'selected' : ''}>Harga terendah</option>
          <option value="high" ${exploreState.sort === 'high' ? 'selected' : ''}>Harga tertinggi</option>
          <option value="name" ${exploreState.sort === 'name' ? 'selected' : ''}>Nama A–Z</option>
        </select>
      </div>

      <div id="explore-results" class="vendor-grid">
        ${
          list.length
            ? list.map((vendor) => renderVendorCard(vendor, compareIds)).join('')
            : `<div class="panel empty-state" style="grid-column: 1 / -1;">
                <p>Vendor tidak ditemukan untuk kriteria pencarian saat ini.</p>
                <button type="button" class="btn sm outline" data-action="reset-explore-filters">Reset Filter</button>
              </div>`
        }
      </div>

      <div id="explore-compare">${renderCompareTray(compareIds)}</div>
    </main>
    ${renderFooter()}
  `;
}

export function renderVendorDetail(vendorId) {
  const vendor = getVendorById(vendorId);
  if (!vendor) {
    return `
      ${renderHeader('/explore')}
      <main class="page-wrap container">
        <div class="panel empty-state">
          <p>Vendor tidak ditemukan atau sudah dinonaktifkan.</p>
          <a class="btn sm" href="#/explore" data-route="/explore">Kembali ke Katalog</a>
        </div>
      </main>
      ${renderFooter()}
    `;
  }

  const user = getCurrentUser();
  const db = getDB();
  const isFavorite = user
    ? db.favorites.some((f) => f.vendorId === vendor.id && f.customerId === user.id)
    : false;
  const gallery = vendor.portfolio?.length ? vendor.portfolio.slice(0, 3) : [vendor.imageUrl];

  return `
    ${renderHeader(`/vendor-detail/${vendor.id}`)}
    <main class="page-wrap container">
      <a class="btn sm outline" href="#/explore" data-route="/explore">&larr; Kembali ke Katalog</a>

      <div class="detail-layout">
        <div class="detail-gallery">
          <div class="main-img" data-ar-card data-ar-tilt="8">
            <div class="ar-glare"></div>
            <div class="ar-reticle"></div>
            <span class="ar-depth-tag">AR 3D</span>
            ${renderMediaBox(vendor.imageUrl, vendor.namaUsaha, vendor.namaUsaha)}
          </div>
          <div class="thumb-grid">
            ${gallery.map((src, i) => renderMediaBox(src, `${vendor.namaUsaha} galeri ${i + 1}`, vendor.namaUsaha)).join('')}
          </div>
          <div style="margin-top: 12px;">
            <button
              type="button"
              class="btn sm soft block"
              data-action="open-ar-preview"
              data-id="${escapeHtml(vendor.id)}"
            >Buka Pratinjau Ruang AR 3D Interaktif</button>
          </div>
        </div>

        <div>
          <div class="meta-line">
            <span>${escapeHtml(vendor.kategori)}</span>
            <span aria-hidden="true">&middot;</span>
            <span>${escapeHtml(vendor.alamat)}</span>
            <span aria-hidden="true">&middot;</span>
            <span class="tabular">&#9733; ${escapeHtml(vendor.ratingSimulasi)}</span>
          </div>
          <h1 class="page-title">${escapeHtml(vendor.namaUsaha)}</h1>
          <p class="text-secondary" style="margin: 12px 0 22px; line-height: 1.7;">
            ${escapeHtml(vendor.deskripsi)}
          </p>

          <div class="panel">
            <div class="panel-head">
              <h2>Paket Layanan</h2>
              <span class="xs muted">${vendor.packages.length} pilihan paket AR 3D</span>
            </div>
            <div class="package-ar-grid">
              ${vendor.packages
                .map(
                  (pkg) => `
                <article class="package-ar-card" data-ar-card data-ar-tilt="10">
                  <div class="ar-glare"></div>
                  <div class="ar-reticle"></div>
                  <span class="ar-depth-tag">AR 3D</span>
                  ${renderMediaBox(pkg.imageUrl || vendor.imageUrl, pkg.namaPaket, pkg.namaPaket)}
                  <div class="package-ar-body">
                    <div class="meta-line">
                      <span>Durasi ${escapeHtml(pkg.durasiLayanan)}</span>
                    </div>
                    <h3>${escapeHtml(pkg.namaPaket)}</h3>
                    <div class="price-value" style="margin-bottom: 8px;">${formatCurrency(pkg.harga)}</div>
                    <p class="small text-secondary" style="margin: 0 0 8px;">${escapeHtml(pkg.deskripsi)}</p>
                    <div class="xs muted" style="margin-bottom: 14px;">
                      ${pkg.fasilitas.map(escapeHtml).join(' &middot; ')}
                    </div>
                    <div class="package-ar-actions">
                      <button
                        type="button"
                        class="btn sm soft"
                        data-action="open-ar-preview"
                        data-id="${escapeHtml(vendor.id)}"
                        data-package-id="${escapeHtml(pkg.id)}"
                      >AR 3D</button>
                      <button
                        type="button"
                        class="btn sm"
                        data-action="open-booking-modal"
                        data-vendor-id="${escapeHtml(vendor.id)}"
                        data-package-id="${escapeHtml(pkg.id)}"
                      >Pesan Paket</button>
                    </div>
                  </div>
                </article>
              `
                )
                .join('')}
            </div>
          </div>

          <div class="row-gap">
            <button
              type="button"
              class="btn soft"
              data-action="toggle-favorite"
              data-id="${escapeHtml(vendor.id)}"
            >${isFavorite ? 'Tersimpan di Favorit' : 'Simpan ke Favorit'}</button>
            <a
              class="btn outline"
              target="_blank"
              rel="noopener noreferrer"
              href="https://wa.me/${encodeURIComponent(vendor.kontak)}?text=${encodeURIComponent(`Halo ${vendor.namaUsaha}, saya tertarik dengan paket layanan Anda di WEDSYNC.`)}"
            >Hubungi via WhatsApp</a>
          </div>
        </div>
      </div>
    </main>
    ${renderFooter()}
  `;
}

export function renderARStageModalHtml(vendor, pkg = null) {
  const minPrice = vendor.packages?.length
    ? Math.min(...vendor.packages.map((p) => Number(p.harga || 0)))
    : 0;
  const displayImage = pkg?.imageUrl || vendor.imageUrl;
  const displayTitle = pkg ? `${vendor.namaUsaha} — ${pkg.namaPaket}` : vendor.namaUsaha;
  const displaySub = pkg
    ? `${pkg.durasiLayanan} · ${formatCurrency(pkg.harga)}`
    : `${vendor.kategori} · Mulai ${formatCurrency(minPrice)}`;

  return `
    <p class="small muted" style="margin-top: 0;">
      Gerakkan kursor atau seret objek di atas bidang ruang untuk memutar sudut pandang 3D.
    </p>
    <div class="ar-stage is-spatial-grid" data-ar-stage>
      <video class="ar-video-feed hidden" data-ar-video autoplay playsinline muted></video>
      <div class="ar-hud-corners"></div>
      <div class="ar-object-frame" data-ar-object>
        <img src="${escapeHtml(displayImage)}" alt="${escapeHtml(displayTitle)} 3D AR" referrerpolicy="no-referrer" />
      </div>
    </div>
    <div class="ar-readout" data-ar-readout>Pitch -6° · Yaw 10° · Skala 100%</div>
    <div class="ar-controls-bar">
      <div class="row-gap">
        <button type="button" class="btn sm outline active" data-ar-preset="diorama">Diorama</button>
        <button type="button" class="btn sm outline" data-ar-preset="front">Fokus</button>
        <button type="button" class="btn sm outline" data-ar-preset="isometric">Isometrik</button>
      </div>
      <label class="row-gap xs muted">
        Skala
        <input type="range" min="0.8" max="1.35" step="0.05" value="1" data-ar-scale />
      </label>
    </div>
    <div class="row-between" style="margin-top: 18px; padding-top: 14px; border-top: 1px solid var(--border-hairline);">
      <div>
        <strong>${escapeHtml(displayTitle)}</strong>
        <div class="xs muted">${escapeHtml(displaySub)}</div>
      </div>
      <div class="row-gap">
        <button type="button" class="btn sm soft" data-ar-camera-toggle>Aktifkan Kamera AR</button>
        ${
          pkg
            ? `<button type="button" class="btn sm" data-action="open-booking-modal" data-vendor-id="${escapeHtml(vendor.id)}" data-package-id="${escapeHtml(pkg.id)}">Pesan Paket Ini</button>`
            : `<a class="btn sm" href="#/vendor-detail/${escapeHtml(vendor.id)}" data-route="/vendor-detail/${escapeHtml(vendor.id)}" data-action="close-modal">Lihat Paket</a>`
        }
      </div>
    </div>
  `;
}

export function renderBookingFormHtml(vendor, pkg) {
  const user = getCurrentUser();
  const db = getDB();
  const projects = db.projects.filter((p) => p.customerId === user?.id);
  const activeProject = getActiveProject(user?.id);

  if (!projects.length) {
    return `
      <p class="text-secondary">Anda perlu memiliki proyek pernikahan sebelum mengajukan booking.</p>
      <a class="btn" href="#/customer/planner" data-route="/customer/planner">Buat Proyek Sekarang</a>
    `;
  }

  return `
    <p class="small text-secondary" style="margin-top: 0;">
      <strong>${escapeHtml(vendor.namaUsaha)}</strong> &middot; ${escapeHtml(pkg.namaPaket)} &middot;
      <span class="mono">${formatCurrency(pkg.harga)}</span>
    </p>
    <form data-form="submit-booking">
      <input type="hidden" name="vendorId" value="${escapeHtml(vendor.id)}" />
      <input type="hidden" name="packageId" value="${escapeHtml(pkg.id)}" />
      <div class="field">
        <label for="bk-project">Proyek Pernikahan</label>
        <select id="bk-project" name="projectId" required>
          ${projects
            .map(
              (pr) => `<option value="${escapeHtml(pr.id)}">${escapeHtml(pr.namaAcara)}</option>`
            )
            .join('')}
        </select>
      </div>
      <div class="field">
        <label for="bk-date">Tanggal Acara</label>
        <input
          id="bk-date"
          name="tanggalAcara"
          type="date"
          min="${todayISO()}"
          value="${escapeHtml(activeProject?.tanggalPernikahan || '')}"
          required
        />
      </div>
      <div class="field">
        <label for="bk-loc">Lokasi Acara</label>
        <input
          id="bk-loc"
          name="lokasiAcara"
          type="text"
          value="${escapeHtml(activeProject?.lokasi || '')}"
          required
        />
      </div>
      <div class="field">
        <label for="bk-note">Catatan Tambahan</label>
        <textarea id="bk-note" name="catatan" placeholder="Tuliskan kebutuhan khusus atau jam acara..."></textarea>
      </div>
      <p class="xs muted">Status awal booking adalah Menunggu Konfirmasi dari pihak vendor.</p>
      <button type="submit" class="btn block">Kirim Permintaan Booking</button>
    </form>
  `;
}
