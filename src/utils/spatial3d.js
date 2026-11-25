const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export function initSpatial3D() {
  if (typeof document === 'undefined' || prefersReducedMotion()) return;

  let activeCard = null;
  let rafId = null;
  let targetRx = 0;
  let targetRy = 0;
  let targetGx = 50;
  let targetGy = 50;

  function applyTransform() {
    rafId = null;
    if (!activeCard) return;
    activeCard.style.setProperty('--ar-rx', `${targetRx.toFixed(2)}deg`);
    activeCard.style.setProperty('--ar-ry', `${targetRy.toFixed(2)}deg`);
    activeCard.style.setProperty('--ar-gx', `${targetGx.toFixed(1)}%`);
    activeCard.style.setProperty('--ar-gy', `${targetGy.toFixed(1)}%`);
  }

  document.addEventListener('pointermove', (event) => {
    const card = event.target.closest('[data-ar-card]');
    if (!card) {
      if (activeCard) {
        resetCard(activeCard);
        activeCard = null;
      }
      return;
    }

    if (activeCard && activeCard !== card) {
      resetCard(activeCard);
    }

    activeCard = card;
    card.classList.add('is-ar-active');

    const rect = card.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const px = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const py = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    const maxTilt = Number(card.getAttribute('data-ar-tilt') || 11);

    targetRy = (px - 0.5) * 2 * maxTilt;
    targetRx = (0.5 - py) * 2 * maxTilt;
    targetGx = px * 100;
    targetGy = py * 100;

    if (!rafId) {
      rafId = requestAnimationFrame(applyTransform);
    }
  });

  document.addEventListener('pointerleave', () => {
    if (activeCard) {
      resetCard(activeCard);
      activeCard = null;
    }
  });
}

function resetCard(card) {
  card.classList.remove('is-ar-active');
  card.style.setProperty('--ar-rx', '0deg');
  card.style.setProperty('--ar-ry', '0deg');
  card.style.setProperty('--ar-gx', '50%');
  card.style.setProperty('--ar-gy', '50%');
}

export function bindARStageEvents(modalBodyEl) {
  const stage = modalBodyEl?.querySelector('[data-ar-stage]');
  if (!stage) return;

  const cube = stage.querySelector('[data-ar-object]');
  const scaleInput = modalBodyEl.querySelector('[data-ar-scale]');
  const presetBtns = modalBodyEl.querySelectorAll('[data-ar-preset]');
  const cameraBtn = modalBodyEl.querySelector('[data-ar-camera-toggle]');
  const videoEl = stage.querySelector('[data-ar-video]');
  const angleReadout = modalBodyEl.querySelector('[data-ar-readout]');

  let rotX = -6;
  let rotY = 10;
  let scale = 1;
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let mediaStream = null;

  function renderStageTransform() {
    if (!cube) return;
    cube.style.transform = `perspective(1200px) rotateX(${rotX.toFixed(1)}deg) rotateY(${rotY.toFixed(1)}deg) scale(${scale.toFixed(2)})`;
    if (angleReadout) {
      angleReadout.textContent = `Pitch ${rotX.toFixed(0)}° · Yaw ${rotY.toFixed(0)}° · Skala ${Math.round(scale * 100)}%`;
    }
  }

  stage.addEventListener('pointerdown', (e) => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    stage.setPointerCapture?.(e.pointerId);
  });

  stage.addEventListener('pointermove', (e) => {
    if (isDragging) {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      startX = e.clientX;
      startY = e.clientY;
      rotY = Math.max(-42, Math.min(42, rotY + dx * 0.32));
      rotX = Math.max(-28, Math.min(28, rotX - dy * 0.32));
      renderStageTransform();
    } else if (!prefersReducedMotion()) {
      const rect = stage.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width - 0.5;
      const py = (e.clientY - rect.top) / rect.height - 0.5;
      rotY = px * 26;
      rotX = -py * 18;
      renderStageTransform();
    }
  });

  stage.addEventListener('pointerup', () => {
    isDragging = false;
  });

  scaleInput?.addEventListener('input', (e) => {
    scale = Number(e.target.value || 1);
    renderStageTransform();
  });

  presetBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      presetBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const preset = btn.getAttribute('data-ar-preset');
      if (preset === 'diorama') {
        rotX = -8;
        rotY = 14;
      } else if (preset === 'front') {
        rotX = 0;
        rotY = 0;
      } else if (preset === 'isometric') {
        rotX = 16;
        rotY = -22;
      }
      renderStageTransform();
    });
  });

  cameraBtn?.addEventListener('click', async () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
      mediaStream = null;
      if (videoEl) {
        videoEl.srcObject = null;
        videoEl.classList.add('hidden');
      }
      stage.classList.remove('is-camera-on');
      cameraBtn.textContent = 'Aktifkan Kamera AR';
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      stage.classList.add('is-spatial-grid');
      cameraBtn.textContent = 'Mode Spatial Aktif';
      return;
    }

    try {
      mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      if (videoEl) {
        videoEl.srcObject = mediaStream;
        videoEl.classList.remove('hidden');
      }
      stage.classList.add('is-camera-on');
      cameraBtn.textContent = 'Matikan Kamera AR';
    } catch {
      stage.classList.add('is-spatial-grid');
      cameraBtn.textContent = 'Ruang Spatial 3D';
    }
  });

  const observer = new MutationObserver(() => {
    if (!document.body.contains(stage) && mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
      mediaStream = null;
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  renderStageTransform();
}
