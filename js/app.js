// ── DATA ──────────────────────────────────────────────────────────────────────

async function loadVideos() {
  try {
    const res = await fetch('data/videos.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const videos = await res.json();
    renderCards(videos);
  } catch (err) {
    console.error('Could not load videos.json:', err);
    document.getElementById('emptyState').classList.add('show');
  }
}

// ── RENDER ────────────────────────────────────────────────────────────────────

function renderCards(videos) {
  const grid = document.getElementById('videoGrid');

  // Remove any existing cards (keep the empty state div)
  grid.querySelectorAll('.video-card').forEach(c => c.remove());

  videos.forEach(video => {
    const dots = [1, 2, 3].map(i =>
      `<div class="level-dot${i <= video.level ? ' filled' : ''}"></div>`
    ).join('');

    const card = document.createElement('div');
    card.className = 'video-card';
    card.dataset.tag = video.tag;
    card.dataset.title = video.title;
    card.dataset.speaker = video.speaker;
    card.dataset.duration = video.duration;
    card.dataset.level = video.level;
    card.dataset.levelLabel = video.levelLabel;
    card.dataset.videoUrl = video.videoUrl;
    card.setAttribute('onclick', 'openModal(this)');

    card.innerHTML = `
      <div class="card-thumb">
        <img src="${video.thumbnail}" alt="${video.title}" loading="lazy"/>
        <div class="play-overlay">
          <div class="play-btn">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <polygon points="5,2 16,9 5,16" fill="white"/>
            </svg>
          </div>
        </div>
        <span class="duration-badge">${video.duration}</span>
      </div>
      <div class="card-body">
        <span class="card-tag">${video.tagLabel}</span>
        <div class="card-title">${video.title}</div>
        <div class="card-desc">${video.description}</div>
        <div class="card-meta">
          <div class="card-level">
            <div class="level-dots">${dots}</div>
            ${video.levelLabel}
          </div>
          <div class="card-speaker">${video.speaker}</div>
        </div>
      </div>
    `;

    grid.insertBefore(card, document.getElementById('emptyState'));
  });

  updateCount(videos.length);
}

// ── FILTERS ───────────────────────────────────────────────────────────────────

function applyFilters() {
  const search = document.getElementById('searchInput').value.toLowerCase().trim();
  const areas = [...document.querySelectorAll('#area-filters input:checked')].map(c => c.value);
  const levels = [...document.querySelectorAll('#level-filters input:checked')].map(c => c.value);
  let visible = 0;

  document.querySelectorAll('.video-card').forEach(card => {
    const ok =
      (areas.length === 0 || areas.includes(card.dataset.tag)) &&
      (levels.length === 0 || levels.includes(card.dataset.levelLabel)) &&
      (!search ||
        card.dataset.title.toLowerCase().includes(search) ||
        card.dataset.speaker.toLowerCase().includes(search) ||
        card.dataset.tag.includes(search));

    card.classList.toggle('hidden', !ok);
    if (ok) visible++;
  });

  updateCount(visible);
  document.getElementById('emptyState').classList.toggle('show', visible === 0);
}

function updateCount(n) {
  const el = document.getElementById('resultCount');
  if (el) el.textContent = n + ' video' + (n !== 1 ? 's' : '');
}

function toggleFilter(h) {
  h.classList.toggle('collapsed');
  h.nextElementSibling.classList.toggle('hidden');
}

// ── MODAL ─────────────────────────────────────────────────────────────────────

function openModal(card) {
  document.getElementById('modalTag').textContent = card.querySelector('.card-tag').textContent;
  document.getElementById('modalTitle').textContent = card.dataset.title;
  document.getElementById('modalDuration').textContent = card.dataset.duration;
  document.getElementById('modalSpeaker').textContent = card.dataset.speaker;
  document.getElementById('modalIframe').src = card.dataset.videoUrl + '?autoplay=1&rel=0';
  document.getElementById('modalOverlay').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.getElementById('modalIframe').src = '';
  document.body.style.overflow = '';
}

function handleOverlayClick(e) {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
}

// ── EMAIL SUBSCRIPTION ────────────────────────────────────────────────────────

function initNotifyForm() {
  const form = document.getElementById('notifyForm');
  if (!form) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const btn = document.getElementById('notifyBtn');
    const input = document.getElementById('notifyEmail');

    if (!input.value || !input.value.includes('@')) { input.focus(); return; }

    btn.textContent = 'Sending…';
    btn.disabled = true;

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form)
      });
      if (res.ok) {
        btn.textContent = '✓  Subscribed';
        btn.classList.add('sent');
        input.disabled = true;
      } else {
        btn.textContent = 'Try again';
        btn.disabled = false;
      }
    } catch (err) {
      btn.textContent = 'Try again';
      btn.disabled = false;
    }
  });
}

// ── NAV ───────────────────────────────────────────────────────────────────────

function initNav() {
  const navToggle = document.querySelector('.nav-toggle');
  const navMenu = document.getElementById('nav-menu');
  if (!navToggle || !navMenu) return;

  navToggle.addEventListener('click', () => {
    const isOpen = navMenu.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  document.addEventListener('click', (e) => {
    if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
      navMenu.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

// ── INIT ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  loadVideos();
  initNotifyForm();
  initNav();

  document.querySelectorAll('#area-filters input, #level-filters input')
    .forEach(cb => cb.addEventListener('change', applyFilters));

  document.getElementById('searchInput').addEventListener('input', applyFilters);
  document.getElementById('searchInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') applyFilters();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });
});
