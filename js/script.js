/* =========================================================
   E.M. MADHAN PORTFOLIO — script.js
   Table of contents:
   1. Preloader
   2. Navigation (scroll state, active link, mobile menu)
   3. Scroll reveal (IntersectionObserver)
   4. Portfolio render + filter + modal
   5. Video render + modal
   6. Custom cursor (desktop only)
   7. Mouse parallax (desktop only)
   8. Back to top

   Editable project & video data now lives in js/data.js, and
   can also be managed visually from admin.html — see README.txt.
   This site is dark-themed only (no light mode / toggle).
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  initPreloader();
  initNav();
  initMobileMenu();
  initScrollReveal();
  initHeroProfile();
  renderWork();
  renderVideos();
  initProjectModal();
  initVideoModal();
  initCursor();
  initParallax();
  initBackToTop();
});

/* ---------- 0. HERO PROFILE PHOTO ----------
   Prefers a photo saved from the admin panel (localStorage, via
   data.js). Falls back to assets/images/profile.jpg, and if that's
   missing too, the "EM" monogram already in the markup is shown
   (see the img's onerror + .hero__profile-fallback in style.css). */
function initHeroProfile(){
  const img = document.getElementById('profileImg');
  if (!img) return;
  const saved = typeof loadProfilePhoto === 'function' ? loadProfilePhoto() : '';
  if (saved) {
    img.onerror = null; // stop the fallback handler from firing on the new src
    img.onload = () => img.parentElement.classList.remove('img-fallback');
    img.src = saved;
  }
}

/* ---------- 1. PRELOADER ---------- */
function initPreloader(){
  const preloader = document.getElementById('preloader');
  if (!preloader) return;
  const hide = () => preloader.classList.add('is-hidden');
  // Minimum show time so it never flashes, maximum ~1.8s per spec.
  const minTimer = setTimeout(hide, 1200);
  window.addEventListener('load', () => {
    clearTimeout(minTimer);
    setTimeout(hide, 300);
  }, { once: true });
}

/* ---------- 2. NAVIGATION ---------- */
function initNav(){
  const nav = document.getElementById('nav');
  const links = document.querySelectorAll('[data-nav]');
  const sections = Array.from(links)
    .map(l => document.querySelector(l.getAttribute('href')))
    .filter(Boolean);

  const onScroll = () => {
    nav.classList.toggle('is-scrolled', window.scrollY > 40);

    let current = sections[0];
    const offset = 120;
    sections.forEach(sec => {
      if (sec.getBoundingClientRect().top - offset <= 0) current = sec;
    });
    links.forEach(l => {
      l.classList.toggle('is-active', l.getAttribute('href') === `#${current.id}`);
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

function initMobileMenu(){
  const toggle = document.getElementById('navToggle');
  const menu = document.getElementById('mobileMenu');
  const closeBtn = document.getElementById('mobileMenuClose');
  if (!toggle || !menu) return;

  const open = () => {
    menu.classList.add('is-open');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };
  const close = () => {
    menu.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  toggle.addEventListener('click', () => {
    menu.classList.contains('is-open') ? close() : open();
  });
  closeBtn.addEventListener('click', close);
  menu.querySelectorAll('[data-mnav]').forEach(a => a.addEventListener('click', close));
}

/* ---------- 3. SCROLL REVEAL ---------- */
function initScrollReveal(){
  const targets = document.querySelectorAll('.fade-up');
  if (!('IntersectionObserver' in window) || targets.length === 0){
    targets.forEach(t => t.classList.add('is-visible'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting){
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

  targets.forEach(t => io.observe(t));
}

/* ---------- 4. PORTFOLIO: RENDER + FILTER + MODAL ---------- */
function renderWork(){
  const grid = document.getElementById('workGrid');
  if (!grid) return;
  const projects = loadProjects();

  grid.innerHTML = projects.map((p, i) => `
    <article class="project-card" data-category="${p.category}" data-index="${i}" tabindex="0" role="button" aria-label="View ${escapeHtml(p.title)}">
      <div class="project-card__media">
        <img src="${p.image}" alt="${escapeHtml(p.title)}"
             loading="lazy"
             onerror="this.style.display='none'; this.parentElement.querySelector('.project-card__placeholder').style.display='flex';">
        <div class="project-card__placeholder" style="display:none;">Image coming soon</div>
        <span class="project-card__arrow" aria-hidden="true">↗</span>
      </div>
      <div class="project-card__body">
        <span class="project-card__cat">${escapeHtml(categoryLabel(p.category))}</span>
        <h3 class="project-card__title">${escapeHtml(p.title)}</h3>
      </div>
    </article>
  `).join('');

  // Initial fallback check for images that are already broken (won't fire onerror if never loaded in some browsers on cache)
  grid.querySelectorAll('img').forEach(img => {
    if (img.complete && img.naturalWidth === 0) img.dispatchEvent(new Event('error'));
  });

  grid.querySelectorAll('.project-card').forEach(card => {
    const open = () => openProjectModal(projects[card.dataset.index]);
    card.addEventListener('click', open);
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); open(); } });
  });

  const tabs = document.querySelectorAll('.filter-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => { t.classList.remove('is-active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');

      const filter = tab.dataset.filter;
      grid.querySelectorAll('.project-card').forEach(card => {
        const match = filter === 'all' || card.dataset.category === filter;
        card.style.display = match ? '' : 'none';
      });
    });
  });
}

function categoryLabel(cat){
  const map = { posters: 'Poster Design', social: 'Social Media', branding: 'Branding', logo: 'Logo Design', creative: 'Creative' };
  return map[cat] || cat;
}

function initProjectModal(){
  const modal = document.getElementById('projectModal');
  if (!modal) return;
  modal.querySelectorAll('[data-close-modal]').forEach(el => el.addEventListener('click', () => closeModal(modal)));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) closeModal(modal); });
}

function openProjectModal(project){
  const modal = document.getElementById('projectModal');
  document.getElementById('modalImage').src = project.image;
  document.getElementById('modalImage').alt = project.title;
  document.getElementById('modalCategory').textContent = categoryLabel(project.category);
  document.getElementById('modalTitle').textContent = project.title;
  document.getElementById('modalDesc').textContent = project.description;
  modal.hidden = false;
  document.body.style.overflow = 'hidden';
}

/* ---------- 5. VIDEOS: RENDER + MODAL ---------- */
let currentVideos = [];
function renderVideos(){
  const grid = document.getElementById('videoGrid');
  if (!grid) return;
  currentVideos = loadVideos();

  grid.innerHTML = currentVideos.map((v, i) => `
    <article class="video-card" data-index="${i}" tabindex="0" role="button" aria-label="Play ${escapeHtml(v.title)}">
      <div class="video-card__media">
        ${v.poster ? `<img src="${v.poster}" alt="${escapeHtml(v.title)}" loading="lazy" onerror="this.style.display='none';">` : ''}
        <div class="video-card__play">
          <span><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></span>
        </div>
      </div>
      <div class="video-card__body">
        <div>
          <span class="video-card__cat">${escapeHtml(v.category)}</span>
          <span>${escapeHtml(v.title)}</span>
        </div>
        <span class="video-card__duration">${escapeHtml(v.duration || '')}</span>
      </div>
    </article>
  `).join('');

  grid.querySelectorAll('.video-card').forEach(card => {
    const open = () => openVideoModal(currentVideos[card.dataset.index]);
    card.addEventListener('click', open);
    card.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' '){ e.preventDefault(); open(); } });
  });
}

function initVideoModal(){
  const modal = document.getElementById('videoModal');
  if (!modal) return;
  const videoEl = document.getElementById('modalVideo');

  const close = () => {
    videoEl.pause();
    videoEl.removeAttribute('src');
    videoEl.load();
    revokeResolvedVideoUrl();
    closeModal(modal);
  };

  modal.querySelectorAll('[data-close-video]').forEach(el => el.addEventListener('click', close));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !modal.hidden) close(); });
}

async function openVideoModal(video){
  const modal = document.getElementById('videoModal');
  const videoEl = document.getElementById('modalVideo');
  document.getElementById('modalVideoTitle').textContent = video.title;
  if (video.poster) videoEl.poster = video.poster;
  modal.hidden = false;
  document.body.style.overflow = 'hidden';

  videoEl.removeAttribute('src');
  const src = await resolveVideoSrc(video.video);
  // If the person closed the modal while the file was loading, don't play it.
  if (modal.hidden) return;
  if (!src){
    document.getElementById('modalVideoTitle').textContent = `${video.title} — video unavailable`;
    return;
  }
  videoEl.src = src;
}

function closeModal(modal){
  modal.hidden = true;
  document.body.style.overflow = '';
}

/* ---------- 6. CUSTOM CURSOR (desktop only) ---------- */
function initCursor(){
  const isDesktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const cursor = document.getElementById('cursorDot');
  if (!isDesktop || !cursor) return;

  cursor.classList.add('is-active');
  let x = 0, y = 0;
  window.addEventListener('mousemove', (e) => {
    x = e.clientX; y = e.clientY;
    cursor.style.transform = `translate(${x}px, ${y}px) translate(-50%,-50%)`;
  });

  const hoverTargets = 'a, button, .project-card, .video-card, .filter-tab';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(hoverTargets)) cursor.classList.add('is-hover');
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(hoverTargets)) cursor.classList.remove('is-hover');
  });
}

/* ---------- 7. MOUSE PARALLAX (desktop only, hero decor) ---------- */
function initParallax(){
  const isDesktop = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const layers = document.querySelectorAll('[data-speed]');
  if (!isDesktop || prefersReduced || layers.length === 0) return;

  const hero = document.querySelector('.hero');
  if (!hero) return;

  hero.addEventListener('mousemove', (e) => {
    const { innerWidth: w, innerHeight: h } = window;
    const relX = (e.clientX - w / 2) / (w / 2);
    const relY = (e.clientY - h / 2) / (h / 2);

    layers.forEach(layer => {
      const speed = parseFloat(layer.dataset.speed) || 0.3;
      const moveX = relX * 14 * speed;
      const moveY = relY * 14 * speed;
      layer.style.transform = `translate(${moveX}px, ${moveY}px)`;
    });
  });
}

/* ---------- 8. BACK TO TOP ---------- */
function initBackToTop(){
  const btn = document.getElementById('backToTop');
  if (!btn) return;
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* ---------- helpers ---------- */
function escapeHtml(str){
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
