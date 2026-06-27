import './style.css';
import { initHeroScene } from './three-scene.js';
import { TRENDING_CREATORS, LAST_UPDATED } from './creators-data.js';

/* ================================================
   BOOT — run after DOM ready
   ================================================ */
document.addEventListener('DOMContentLoaded', () => {
  renderCreators();      // must run before scroll animations observe
  initHeroScene('hero-canvas');
  initNav();
  initMobileNav();
  initScrollAnimations();
  initBridgeWalk();
  initServiceAccordion();
  initCounters();
  initSmoothScroll();
  initParallax();
  initCookieBanner();
});

/* ================================================
   NAV — scroll shrink
   ================================================ */
function initNav() {
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });
}

/* ================================================
   MOBILE NAV
   ================================================ */
function initMobileNav() {
  const hamburger   = document.getElementById('hamburger');
  const mobileNav   = document.getElementById('mobileNav');
  const mobileClose = document.getElementById('mobileNavClose');
  const links       = mobileNav.querySelectorAll('.mobile-nav-link');

  const open  = () => { mobileNav.classList.add('open');    document.body.style.overflow = 'hidden'; hamburger.setAttribute('aria-expanded', 'true');  };
  const close = () => { mobileNav.classList.remove('open'); document.body.style.overflow = '';       hamburger.setAttribute('aria-expanded', 'false'); };

  hamburger.addEventListener('click', open);
  mobileClose.addEventListener('click', close);
  links.forEach(l => l.addEventListener('click', close));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
}

/* ================================================
   SCROLL ANIMATIONS — Intersection Observer
   ================================================ */
function initScrollAnimations() {
  // Hero elements fire immediately on load
  const heroEls = document.querySelectorAll('.reveal-word, .reveal-line, .reveal-fade');
  requestAnimationFrame(() => {
    heroEls.forEach((el, i) => {
      setTimeout(() => el.classList.add('visible'), i * 30);
    });
  });

  // Animated classes handled by IntersectionObserver
  const ANIM_CLASSES = ['.fade-in', '.pop-left', '.pop-right', '.pop-scale'];
  const allAnimEls = document.querySelectorAll(ANIM_CLASSES.join(','));

  // Track which section each element belongs to so we can stagger within each section
  function getSectionGroup(el) {
    return el.closest('section, footer') || el.parentElement;
  }

  // Map: section → ordered list of un-triggered animated children
  const sectionQueues = new Map();
  allAnimEls.forEach(el => {
    const section = getSectionGroup(el);
    if (!sectionQueues.has(section)) sectionQueues.set(section, []);
    sectionQueues.get(section).push(el);
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      io.unobserve(entry.target);

      const el      = entry.target;
      const section = getSectionGroup(el);
      const queue   = sectionQueues.get(section) ?? [];

      // Find this element's position among still-invisible siblings in the section
      const pending = queue.filter(e => !e.classList.contains('visible'));
      const idx     = pending.indexOf(el);

      // Cards in grids get a tighter stagger; lone elements get a small delay
      const isInGrid = el.closest('.creators-grid, .pricing-grid, .steps-grid, .diff-grid, .testimonials-grid');
      const step     = isInGrid ? 90 : 70;
      const delay    = idx >= 0 ? Math.min(idx * step, 480) : 0;

      setTimeout(() => el.classList.add('visible'), delay);
    });
  }, {
    threshold: 0.06,
    rootMargin: '0px 0px -48px 0px',
  });

  allAnimEls.forEach(el => io.observe(el));
}

/* ================================================
   SERVICE ACCORDION
   ================================================ */
function initServiceAccordion() {
  const items = document.querySelectorAll('.service-item');

  items.forEach(item => {
    const trigger = item.querySelector('.service-trigger');
    const body    = item.querySelector('.service-body');

    trigger.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      // Close all
      items.forEach(i => {
        i.classList.remove('open');
        i.querySelector('.service-body').style.maxHeight = '0';
        i.querySelector('.service-trigger').setAttribute('aria-expanded', 'false');
      });

      if (!isOpen) {
        item.classList.add('open');
        body.style.maxHeight = body.scrollHeight + 'px';
        trigger.setAttribute('aria-expanded', 'true');
      }
    });
  });
}

/* ================================================
   ANIMATED STAT COUNTERS
   ================================================ */
function initCounters() {
  const statEls = document.querySelectorAll('.stat-num[data-count]');

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      io.unobserve(entry.target);

      const el     = entry.target;
      const target = parseInt(el.dataset.count, 10);
      const suffix = el.dataset.suffix || '';
      const dur    = 1600; // ms
      const start  = performance.now();

      function tick(now) {
        const elapsed  = now - start;
        const progress = Math.min(elapsed / dur, 1);
        // Ease out cubic
        const eased    = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target) + suffix;
        if (progress < 1) requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
    });
  }, { threshold: 0.5 });

  statEls.forEach(el => io.observe(el));
}


/* ================================================
   SMOOTH SCROLL — offset for fixed nav
   ================================================ */
function initSmoothScroll() {
  const navbar = document.getElementById('navbar');

  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const offset = navbar.offsetHeight + 16;
      const top    = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

/* ================================================
   SUBTLE PARALLAX — hero headline depth
   ================================================ */
function initParallax() {
  const heroHeadline = document.querySelector('.hero-headline');
  const heroSub      = document.querySelector('.hero-sub');

  if (!heroHeadline) return;

  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    if (y < window.innerHeight) {
      const factor = y * 0.22;
      heroHeadline.style.transform = `translateY(${factor * 0.35}px)`;
      if (heroSub) heroSub.style.transform = `translateY(${factor * 0.2}px)`;
    }
  }, { passive: true });
}

/* ================================================
   CREATOR GRID — rendered from creators-data.js
   Edit that file monthly to refresh the showcase.
   ================================================ */
function renderCreators() {
  const grid   = document.getElementById('creatorsGrid');
  const dateEl = document.getElementById('creatorsUpdated');
  if (!grid) return;

  if (dateEl) dateEl.textContent = `Updated ${LAST_UPDATED}`;

  grid.innerHTML = TRENDING_CREATORS.map((c, i) => {
    const featClass = c.featured ? 'creator-card--featured' : '';
    const tags      = c.tags.map(t => `<span class="creator-tag">${t}</span>`).join('');
    const rank      = String(i + 1).padStart(2, '0');

    return `
      <div class="creator-card ${featClass} fade-in" style="--card-accent:${c.accent}">
        <div class="creator-card-header">
          <span class="creator-cat">${c.category}</span>
          <span class="creator-platform-badge">${c.platform}</span>
        </div>
        <div class="creator-rank-bg" aria-hidden="true">${rank}</div>
        <div class="creator-body">
          <div class="creator-handle">${c.handle}</div>
          <div class="creator-name">${c.name}</div>
        </div>
        <div class="creator-stats-row">
          <div class="creator-stat">
            <div class="creator-stat-val">${c.followers}</div>
            <div class="creator-stat-lbl">followers</div>
          </div>
          <div class="creator-stat-divider"></div>
          <div class="creator-stat">
            <div class="creator-stat-val">${c.engagement}</div>
            <div class="creator-stat-lbl">engagement</div>
          </div>
        </div>
        <div class="creator-tags">${tags}</div>
      </div>`;
  }).join('');
}

/* ================================================
   TIMELINE — scroll-triggered convergence animation
   Replays every time the section scrolls into view.
   All geometry in SVG user units (no CSS px ambiguity).
   ================================================ */
function initBridgeWalk() {
  const bridge = document.getElementById('bridgeIllustration');
  if (!bridge) return;

  // On mobile, zoom into the centre 660 SVG units so elements are legible.
  // Dots start off-screen and fly in — cinematic side-effect.
  const svg = bridge.querySelector('.bridge-svg');
  function applyViewBox() {
    if (!svg) return;
    svg.setAttribute('viewBox', window.innerWidth < 640
      ? '220 60 660 160'   // zoomed: x=220→880, y=60→220; scale ≈ 0.57× at 375px
      : '0 0 1100 240');
  }
  applyViewBox();
  window.addEventListener('resize', applyViewBox, { passive: true });

  let cancelAnim = null;

  function resetTimeline() {
    if (cancelAnim) { cancelAnim(); cancelAnim = null; }
    bridge.classList.remove('walk-active');
    const brandG    = bridge.querySelector('.tl-traveler--brand');
    const creatorG  = bridge.querySelector('.tl-traveler--creator');
    const brandRect = bridge.querySelector('#tl-brand-rect');
    const crtRect   = bridge.querySelector('#tl-creator-rect');
    if (brandG)    brandG.setAttribute('transform',   'translate(0,0)');
    if (creatorG)  creatorG.setAttribute('transform', 'translate(0,0)');
    if (brandRect) brandRect.setAttribute('width', 0);
    if (crtRect)   { crtRect.setAttribute('x', 1010); crtRect.setAttribute('width', 0); }
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        resetTimeline();
        cancelAnim = runTimelineAnim(bridge);
      } else {
        resetTimeline();
      }
    });
  }, { threshold: 0.25 });

  io.observe(bridge);
}

function runTimelineAnim(bridge) {
  bridge.classList.add('walk-active'); // triggers CSS: label fade, ring burst, dot colour

  const brandG    = bridge.querySelector('.tl-traveler--brand');
  const creatorG  = bridge.querySelector('.tl-traveler--creator');
  const brandRect = bridge.querySelector('#tl-brand-rect');
  const crtRect   = bridge.querySelector('#tl-creator-rect');

  if (!brandG || !creatorG) return () => {};

  const TRAVEL   = 460;  // SVG units each dot moves (brand: 90→550, creator: 1010→550)
  const DURATION = 2200; // ms
  const DELAY    = 500;  // ms pause before dots start

  function ease(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  let raf = null;
  let t0  = null;

  function tick(ts) {
    if (!t0) t0 = ts;
    const elapsed = ts - t0 - DELAY;
    if (elapsed < 0) { raf = requestAnimationFrame(tick); return; }

    const t = Math.min(elapsed / DURATION, 1);
    const e = ease(t);
    const d = e * TRAVEL;

    brandG.setAttribute('transform',   `translate(${d},0)`);
    creatorG.setAttribute('transform', `translate(${-d},0)`);

    if (brandRect) brandRect.setAttribute('width', d);
    if (crtRect)   { crtRect.setAttribute('x', 1010 - d); crtRect.setAttribute('width', d); }

    if (t < 1) raf = requestAnimationFrame(tick);
  }

  raf = requestAnimationFrame(tick);
  return () => { if (raf) cancelAnimationFrame(raf); };
}

/* ================================================
   COOKIE BANNER
   ================================================ */
function initCookieBanner() {
  const banner = document.getElementById('cookieBanner');
  if (!banner) return;
  if (localStorage.getItem('cookie-consent')) return;
  banner.removeAttribute('hidden');

  document.getElementById('cookieAccept')?.addEventListener('click', () => {
    localStorage.setItem('cookie-consent', 'accepted');
    banner.setAttribute('hidden', '');
  });
  document.getElementById('cookieReject')?.addEventListener('click', () => {
    localStorage.setItem('cookie-consent', 'rejected');
    banner.setAttribute('hidden', '');
  });
}

/* ================================================
   CONTACT FORM — type-aware labels
   ================================================ */
const typeSelect   = document.getElementById('f-type');
const brandLabel   = document.getElementById('f-brand-label');
const socialsLabel = document.getElementById('f-socials-label');
const brandInput   = document.getElementById('f-brand');
const socialsInput = document.getElementById('f-socials');
const detailsInput = document.getElementById('f-details');

if (typeSelect) {
  typeSelect.addEventListener('change', () => {
    const isCreator = typeSelect.value === 'creator';

    brandLabel.innerHTML   = isCreator
      ? 'Creator Name / Handle <span class="req">*</span>'
      : 'Brand / Company <span class="req">*</span>';
    socialsLabel.textContent = isCreator ? 'Your Platforms' : 'Social Handles';

    brandInput.placeholder   = isCreator ? 'Your name or @handle' : 'Your brand or company name';
    socialsInput.placeholder = isCreator ? 'TikTok, Instagram, YouTube…' : '@yourbrand';
    detailsInput.placeholder = isCreator
      ? 'Tell us about your content, your niche, follower count, and what kind of brands you want to work with.'
      : 'Tell us about your campaign goals, target audience, budget range, and timeline.';
  });
}

const contactForm = document.getElementById('contactForm');
const formSuccess = document.getElementById('formSuccess');

if (contactForm) {
  contactForm.addEventListener('submit', async e => {
    e.preventDefault();
    if (!contactForm.checkValidity()) { contactForm.reportValidity(); return; }

    const btn = contactForm.querySelector('[type="submit"]');
    const orig = btn.textContent;
    btn.textContent = 'Sending…';
    btn.disabled = true;

    // Swap in a real fetch() to your backend/Formspree endpoint here
    await new Promise(r => setTimeout(r, 1000));

    contactForm.hidden = true;
    formSuccess.removeAttribute('hidden');
    btn.textContent = orig;
    btn.disabled = false;
  });
}
