import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { initHero } from './hero.js';
import { places, icons } from './art.js';
import { places as guidePlaces, stories, artisans, events } from './data.js';
import './style.css';

gsap.registerPlugin(ScrollTrigger);

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const lite = matchMedia('(max-width: 820px), (pointer: coarse)').matches;
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

// ---------- line art ----------
$$('[data-art]').forEach((el) => (el.innerHTML = places[el.dataset.art] || ''));
$$('[data-icon]').forEach((el) => (el.innerHTML = icons[el.dataset.icon] || ''));

// ---------- smooth scroll ----------
let lenis = null;
if (!reduced) {
  lenis = new Lenis({ duration: 1.25, smoothWheel: true, wheelMultiplier: 0.9 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

const headerH = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 64;
function scrollToHash(hash) {
  const target = hash === '#top' ? 0 : $(hash);
  if (target === null) return;
  const offset = hash === '#top' ? 0 : -headerH() + 1;
  if (lenis) lenis.scrollTo(target, { offset, duration: 1.6 });
  else window.scrollTo({ top: target === 0 ? 0 : target.getBoundingClientRect().top + scrollY + offset });
}
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a || a.getAttribute('href').length < 2) return;
  e.preventDefault();
  closeMenu();
  scrollToHash(a.getAttribute('href'));
  if (a.getAttribute('href') !== '#top') history.replaceState(null, '', a.getAttribute('href'));
});

// ---------- header & mobile menu ----------
const header = $('#header');
const menuBtn = $('#menuBtn');
const mobileNav = $('#mobileNav');
function closeMenu() {
  menuBtn.setAttribute('aria-expanded', 'false');
  mobileNav.classList.remove('open');
}
menuBtn.addEventListener('click', () => {
  const open = menuBtn.getAttribute('aria-expanded') !== 'true';
  menuBtn.setAttribute('aria-expanded', String(open));
  mobileNav.classList.toggle('open', open);
});
ScrollTrigger.create({
  trigger: '#about',
  start: () => `top ${innerHeight * 0.6}px`,
  onEnter: () => header.classList.add('show'),
  onLeaveBack: () => { header.classList.remove('show'); closeMenu(); },
});
// highlight the current section in the nav
['about', 'places', 'experiences', 'itineraries'].forEach((id) => {
  const link = $(`.nav a[href="#${id}"]`);
  ScrollTrigger.create({
    trigger: `#${id}`, start: 'top 50%', end: 'bottom 50%',
    onToggle: (self) => link.classList.toggle('active', self.isActive),
  });
});

// ---------- hero ----------
const media = $('#heroMedia');
let hero = null;
initHero({ canvas: $('#heroGL'), birdCanvas: $('#heroBirds'), lite, reduced, onReady: () => media.classList.add('live') })
  .then((h) => (hero = h))
  .catch((err) => console.warn('Hero animation unavailable, showing the still illustration.', err));

// title: letters in one by one, then the divider grows out from the star
const intro = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.25 });
intro
  .from('.miras span', { opacity: 0, y: 26, duration: 1.3, stagger: 0.12 })
  .from('.city', { opacity: 0, y: 12, duration: 1 }, '-=0.7')
  .from('.sub > *', { opacity: 0, y: 10, duration: 0.9, stagger: 0.15 }, '-=0.6')
  .from('.divider .star', { opacity: 0, scale: 0, rotate: -90, duration: 0.8 }, '-=0.4')
  .from('.divider .ln', { scaleX: 0, duration: 1.4, ease: 'power2.inOut' }, '-=0.35')
  .from('.hero-title .btn', { opacity: 0, y: 10, duration: 0.9 }, '-=0.7')
  .from('.scroll-cue', { opacity: 0, duration: 1 }, '-=0.4');

if (!reduced) {
  // scroll: zoom toward the street, title lifts away, view settles into paper
  gsap.timeline({
    scrollTrigger: {
      trigger: '.hero', start: 'top top', end: 'bottom bottom', scrub: 0.6,
      onUpdate: (self) => hero?.setProgress(self.progress),
    },
  })
    .to(media, { scale: lite ? 1.12 : 1.2, yPercent: -3, ease: 'none', duration: 1 }, 0)
    .to('.hero-title', { y: () => -innerHeight * 0.16, opacity: 0, ease: 'power1.in', duration: 0.5 }, 0)
    .to('.hero-veil', { opacity: 0, ease: 'none', duration: 0.5 }, 0)
    .to('.scroll-cue', { opacity: 0, ease: 'none', duration: 0.12 }, 0)
    .to('.hero-fade', { opacity: 0.72, ease: 'power1.in', duration: 0.4 }, 0.6);
}

// ---------- reveals ----------
if (!reduced) {
  // headings and text fade up
  $$('[data-reveal]').forEach((el) => {
    gsap.from(el, {
      opacity: 0, y: 34, duration: 1.2, ease: 'power3.out',
      scrollTrigger: { trigger: el, start: 'top 88%', once: true },
    });
  });

  // ink rules draw outward from the star
  $$('.rule').forEach((r) => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: r, start: 'top 90%', once: true } });
    tl.from($('.star', r), { scale: 0, rotate: -90, duration: 0.7, ease: 'back.out(2)' })
      .from($$('span', r), { scaleX: 0, duration: 1.2, ease: 'power2.inOut' }, '-=0.3');
  });

  // line drawings draw themselves stroke by stroke
  const drawIn = (svgEl, delay = 0) => {
    const parts = $$('path, circle', svgEl);
    parts.forEach((p) => {
      p.setAttribute('pathLength', '1');
      p.style.strokeDasharray = '1';
      p.style.strokeDashoffset = '1';
    });
    return gsap.to(parts, { strokeDashoffset: 0, duration: 1.8, ease: 'power2.inOut', stagger: { amount: 1.2 }, delay });
  };

  // place cards: card fades up, then its drawing is inked in
  ScrollTrigger.batch('.card', {
    start: 'top 88%', once: true,
    onEnter: (batch) => {
      batch.forEach((card, i) => {
        gsap.fromTo(card, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out', delay: i * 0.12 });
        const s = $('svg', card);
        if (s) drawIn(s, 0.2 + i * 0.12);
      });
    },
  });
  gsap.set('.card', { opacity: 0 });

  $$('.exp-icon svg').forEach((s) => {
    const parts = $$('path, circle', s);
    parts.forEach((p) => { p.setAttribute('pathLength', '1'); p.style.strokeDasharray = '1'; p.style.strokeDashoffset = '1'; });
    gsap.to(parts, { strokeDashoffset: 0, duration: 1.6, ease: 'power2.inOut', stagger: 0.1, scrollTrigger: { trigger: s, start: 'top 90%', once: true } });
  });

  // images unmask like ink spreading on paper
  $$('.ink-reveal').forEach((el) => {
    gsap.fromTo(el,
      { clipPath: 'circle(0% at 30% 60%)' },
      { clipPath: 'circle(150% at 30% 60%)', duration: 2.2, ease: 'power2.inOut', scrollTrigger: { trigger: el, start: 'top 80%', once: true } });
    gsap.fromTo($('img', el), { scale: 1.08 }, { scale: 1, duration: 2.6, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 80%', once: true } });
  });

  // lake band drifts sideways with scroll
  gsap.fromTo('.lake-band', { backgroundPositionX: '0%' }, {
    backgroundPositionX: '30%', ease: 'none',
    scrollTrigger: { trigger: '.lake-band', start: 'top bottom', end: 'bottom top', scrub: true },
  });
}

// ---------- itinerary tabs ----------
const tabs = $$('[role=tab]');
function selectTab(tab, focus = false) {
  tabs.forEach((t) => {
    const on = t === tab;
    t.setAttribute('aria-selected', String(on));
    t.tabIndex = on ? 0 : -1;
    const panel = document.getElementById(t.getAttribute('aria-controls'));
    panel.hidden = !on;
    if (on && !reduced) gsap.fromTo($$('.panel-intro, .days > li', panel), { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.07, ease: 'power2.out' });
  });
  if (focus) tab.focus();
  ScrollTrigger.refresh();
}
tabs.forEach((t, i) => {
  t.addEventListener('click', () => selectTab(t));
  t.addEventListener('keydown', (e) => {
    const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
    if (d) selectTab(tabs[(i + d + tabs.length) % tabs.length], true);
  });
});

// ---------- enquiry form ----------
// No backend yet: validates, then confirms on the page.
const form = $('#planForm');
const status = $('#formStatus');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  let firstBad = null;
  $$('.field', form).forEach((f) => { f.classList.remove('invalid'); $('.err', f)?.remove(); });
  for (const input of [form.elements.name, form.elements.email]) {
    if (!input.checkValidity() || !input.value.trim()) {
      const f = input.closest('.field');
      f.classList.add('invalid');
      const msg = document.createElement('span');
      msg.className = 'err';
      msg.textContent = input.type === 'email' ? 'Please enter a valid email address.' : 'Please tell us your name.';
      f.appendChild(msg);
      firstBad ||= input;
    }
  }
  if (firstBad) { firstBad.focus(); return; }
  const name = form.elements.name.value.trim().split(' ')[0];
  status.textContent = `Thank you, ${name}. We'll write back within two days with a plan for your Udaipur trip.`;
  form.querySelector('button[type=submit]').disabled = true;
  if (!reduced) gsap.from(status, { opacity: 0, y: 8, duration: 0.8 });
});

// fonts change line heights: re-measure once they arrive
document.fonts?.ready.then(() => ScrollTrigger.refresh());

// ---------- MIRAS field guide (local demonstration data only) ----------
const placeResults = $('#placeResults');
const renderPlaces = (query = '', category = 'All') => {
  const q = query.toLowerCase();
  const results = guidePlaces.filter((p) => (category === 'All' || p.category === category) && `${p.name} ${p.category} ${p.note}`.toLowerCase().includes(q));
  placeResults.innerHTML = results.length ? results.map((p) => `<article class="guide-card"><img src="${p.image}" alt="Illustrative view of ${p.name}" loading="lazy"><p class="card-tag">${p.category} · ${p.duration}</p><h3>${p.name}</h3><p>${p.note}</p><p class="meta">${p.access}</p><button class="btn btn-sm" data-save-place="${p.id}">Save to trip</button></article>`).join('') : '<p class="demo-note">No places match this search. Try a broader word or another category.</p>';
};
renderPlaces();
let activeFilter = 'All';
$('#placeSearch')?.addEventListener('input', (e) => renderPlaces(e.target.value, activeFilter));
$('#placeFilters')?.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; activeFilter = b.dataset.filter; $$('#placeFilters button').forEach((x) => x.classList.toggle('active', x === b)); renderPlaces($('#placeSearch').value, activeFilter); });
placeResults?.addEventListener('click', (e) => { const b = e.target.closest('[data-save-place]'); if (!b) return; b.textContent = 'Saved locally'; b.disabled = true; });

$('#storyResults').innerHTML = stories.map((s) => `<article class="story-card"><p class="type">${s.type} · ${s.status}</p><h3>${s.title}</h3><p>${s.place}</p><p class="meta"><strong>Source:</strong> ${s.source}</p><button class="btn btn-sm secondary">Read text version</button></article>`).join('');
const renderMakers = (q = '') => { const needle = q.toLowerCase(); $('#makerResults').innerHTML = artisans.filter((a) => `${a.name} ${a.craft} ${a.location}`.toLowerCase().includes(needle)).map((a) => `<article class="guide-card"><img src="${a.image}" alt="Illustrative craft image"><p class="card-tag">${a.craft} · illustrative</p><h3>${a.name}</h3><p>${a.location}</p><p class="meta">${a.detail}</p><button class="btn btn-sm secondary" data-enquire="${a.name}">Demonstration enquiry</button></article>`).join('') || '<p class="demo-note">No makers match this search.</p>'; };
renderMakers(); $('#makerSearch')?.addEventListener('input', (e) => renderMakers(e.target.value));
$('#makerResults')?.addEventListener('click', (e) => { const b = e.target.closest('[data-enquire]'); if (b) b.textContent = 'Enquiry demo opened'; });

$$('.guide-tab').forEach((tab) => tab.addEventListener('click', () => { $$('.guide-tab').forEach((t) => t.setAttribute('aria-selected', String(t === tab))); $$('.guide-panel').forEach((panel) => panel.hidden = panel.id !== `${tab.dataset.guide}-panel`); }));
$('#voiceDemo')?.addEventListener('click', () => $('#voiceDraft').hidden = false);
$('#closeDraft')?.addEventListener('click', () => $('#voiceDraft').hidden = true);
$('#showDraft')?.addEventListener('click', () => { $('#draftStatus').textContent = 'Draft preview ready. Review, edit, or reject it before any simulated publication.'; });
$('#makePlan')?.addEventListener('click', () => { const focus = $('#plannerFocus').value; const picks = guidePlaces.filter((p) => p.category === focus).slice(0, 2); $('#plannerOutput').innerHTML = `<p class="card-tag">Illustrative ${$('#plannerTime').value === 'day' ? 'day' : 'short'} route</p>${picks.map((p, i) => `<p><strong>${i + 1}. ${p.name}</strong><br>${p.duration} · ${p.note}</p>`).join('')}<p class="meta">This route is deterministic sample data. Confirm access, hours and transport directly.</p>`; });
$$('.download-demo').forEach((b) => b.addEventListener('click', () => { b.textContent = 'Demo download ready'; b.disabled = true; }));
$('#stampPassport')?.addEventListener('click', () => { $('#passportStatus').textContent = 'Sample stamp added locally — it is not proof of a visit.'; });
