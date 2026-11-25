export function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    };
    return map[char];
  });
}

export function safeUrl(url = '') {
  const trimmed = String(url).trim();
  if (
    trimmed.startsWith('/') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://')
  ) {
    return trimmed;
  }
  return '';
}

export function formatCurrency(amount) {
  return `Rp ${Number(amount || 0).toLocaleString('id-ID')}`;
}

export function formatDate(isoDate) {
  if (!isoDate) return '-';
  const parsed = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return escapeHtml(isoDate);
  return parsed.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function generateId(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function statusClass(status) {
  if (status === 'Diterima' || status === 'Selesai' || status === 'Lunas' || status === 'tersedia') {
    return 'ok';
  }
  if (status === 'Ditolak' || status === 'tidak tersedia') {
    return 'err';
  }
  return 'wait';
}

export function renderMediaBox(src, alt, fallbackTitle = 'WEDSYNC') {
  const cleanSrc = safeUrl(src);
  return `
    <div class="media-box ${cleanSrc ? '' : 'is-fallback'}">
      ${
        cleanSrc
          ? `<img src="${escapeHtml(cleanSrc)}" alt="${escapeHtml(alt)}" referrerpolicy="no-referrer" loading="lazy" data-fallback-img="true" />`
          : ''
      }
      <div class="media-fallback">
        <span class="xs muted">Galeri Layanan</span>
        <strong>${escapeHtml(fallbackTitle)}</strong>
      </div>
    </div>
  `;
}

let toastTimer = null;

export function showToast(message) {
  const root = document.getElementById('toast-root');
  if (!root) return;
  root.innerHTML = `<div class="toast" role="status">${escapeHtml(message)}</div>`;
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    root.innerHTML = '';
  }, 2800);
}

export function openModal(title, bodyHtml) {
  const root = document.getElementById('modal-root');
  if (!root) return;
  root.innerHTML = `
    <div class="modal-backdrop" data-action="close-modal-backdrop" role="dialog" aria-modal="true" aria-label="${escapeHtml(title)}">
      <div class="modal-dialog">
        <div class="modal-header">
          <h3>${escapeHtml(title)}</h3>
          <button type="button" class="modal-close" data-action="close-modal" aria-label="Tutup dialog">&times;</button>
        </div>
        <div class="modal-body">${bodyHtml}</div>
      </div>
    </div>
  `;
}

export function closeModal() {
  const root = document.getElementById('modal-root');
  if (root) root.innerHTML = '';
}
