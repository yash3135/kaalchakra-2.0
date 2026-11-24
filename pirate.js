/* Original implementation, informed by the measured reference choreography.
   See E:/Timepass/Kaalchakra/Pinaka-REA for captured source and provenance. */
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const clamp = value => Math.min(1, Math.max(0, value));
const segment = (time, from, to) => clamp((time - from) / (to - from));
const mix = (a, b, p) => a + (b - a) * p;
const easeOut = p => 1 - (1 - p) ** 3;
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
let paused = reduced.matches;
try { paused ||= localStorage.getItem('kaalchakra-motion') === 'paused'; } catch {}
document.documentElement.classList.toggle('motion-paused', paused);
const motionButton = $('#motion-toggle');
function reflectMotion() {
  document.documentElement.classList.toggle('motion-paused', paused);
  motionButton.setAttribute('aria-pressed', String(paused));
  motionButton.textContent = paused ? 'Enable motion' : 'Pause motion';
  if (paused) { $('.intro-brand').inert = false; $('.intro-brand').style.pointerEvents = ''; }
}
reflectMotion();
motionButton.addEventListener('click', () => {
  const top = motionButton.getBoundingClientRect().top;
  paused = !paused;
  reflectMotion();
  try { localStorage.setItem('kaalchakra-motion', paused ? 'paused' : 'enabled'); } catch {}
  measure();
  window.scrollBy({ top: motionButton.getBoundingClientRect().top - top, behavior: 'instant' });
  schedule();
});
reduced.addEventListener('change', e => { paused = e.matches; reflectMotion(); measure(); schedule(); });

const menuButton = $('.menu-toggle');
const navigation = $('#navigation');
function closeMenu() { menuButton.setAttribute('aria-expanded', 'false'); navigation.classList.remove('is-open'); }
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open)); navigation.classList.toggle('is-open', open);
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('click', e => {
  if (!e.target.closest('.edition-menu')) $('.edition-menu').open = false;
  if (!e.target.closest('.site-header')) closeMenu();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') { closeMenu(); $('.edition-menu').open = false; } });
const reveal = $('#logo-reveal');
const video = $('video', reveal);
$('#watch-reveal').addEventListener('click', () => { reveal.showModal(); video.play().catch(() => {}); });
reveal.addEventListener('close', () => video.pause());
reveal.addEventListener('click', e => { if (e.target === reveal) reveal.close(); });

const domainTabs = $$('.domain-tab');
const domainPanels = $$('.domain-panel');
function selectDomain(index, focus = false) {
  domainTabs.forEach((tab, i) => {
    tab.setAttribute('aria-selected', String(i === index)); tab.tabIndex = i === index ? 0 : -1; tab.classList.toggle('active', i === index);
    domainPanels[i].hidden = i !== index;
  });
  // The wrapper owns positioning; rotate around the artwork's wheel hub.
  $('.domain-wheel-rotor').style.transform = `rotate(${index * 360 / 7}deg)`;
  if (focus) domainTabs[index].focus({ preventScroll: true });
}
domainTabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectDomain(index));
  tab.addEventListener('keydown', e => {
    const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'];
    if (!keys.includes(e.key)) return;
    e.preventDefault();
    const next = e.key === 'Home' ? 0 : e.key === 'End' ? domainTabs.length - 1 : (index + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1) + domainTabs.length) % domainTabs.length;
    selectDomain(next, true);
  });
});

const intro = $('.intro-wrapper'), journey = $('.journey-wrapper'), bounty = $('.bounty-wrapper');
const brand = $('.intro-brand'), captain = $('.captain'), crab = $('.intro-crab'), cue = $('.intro-cue');
const scene = $('.scene-two'), story = $('.intro-story'), shade = $('.world-shade'), worldImage = $('.world-image');
const track = $('.journey-track'), wheel = $('.journey-wheel img'), stages = $$('.journey-card'), markers = $$('.journey-markers span');
const chestClosed = $('.chest-closed'), chestOpen = $('.chest-open'), treasureLight = $('.treasure-light');
const bountyStage = $('.bounty-stage'), bountyScene = $('.treasure-scene'), bountyRings = $('.vault-rings'), bountyKey = $('.bounty-key');
const bountyPulse = $('.vault-spark-ring'), bountyCue = $('.bounty-scroll-cue'), bountyAnnouncement = $('.bounty-announcement');
const bountyBriefs = $$('.bounty-brief'), bountyChapters = $$('.bounty-chapters span');
const vaultLanternLit = $('.vault-lantern-lit'), vaultLanternUnlit = $('.vault-lantern-unlit');
const bountyLoot = $$('.bounty-loot').map(element => ({ element, x: Number(element.dataset.x), y: Number(element.dataset.y), turn: Number(element.dataset.turn) }));
const bountySparks = $$('.vault-sparks i').map(element => ({ element, x: Number(element.dataset.x), y: Number(element.dataset.y), turn: Number(element.dataset.turn) }));
const progressBar = $('.reading-progress span');
let metrics = {}, pendingFrame = false, lastTime = 0, smoothY = scrollY;
const route = $('.route-draw');
const routeLength = route.getTotalLength();
route.style.strokeDasharray = routeLength;
route.style.strokeDashoffset = routeLength;
function measure() {
  const top = el => el.getBoundingClientRect().top + scrollY;
  metrics = { height: innerHeight, introTop: top(intro), introDistance: Math.max(1, intro.offsetHeight - $('.intro-stage').offsetHeight), journeyTop: top(journey), journeyDistance: Math.max(1, journey.offsetHeight - $('.journey-stage').offsetHeight), bountyTop: top(bounty), bountyDistance: Math.max(1, bounty.offsetHeight - $('.bounty-stage').offsetHeight), voyageTop: top($('#voyage')), voyageDistance: Math.max(1, $('#voyage').offsetHeight - $('.timeline-stage').offsetHeight), total: document.documentElement.scrollHeight - innerHeight };
}
function updateScene(y) {
  progressBar.style.transform = `scaleX(${clamp(scrollY / Math.max(1, metrics.total))})`;
  if (paused) { paintVoyage(1); paintBounty(1); return; }
  paintVoyage(segment(y, metrics.voyageTop, metrics.voyageTop + metrics.voyageDistance));
  const t = segment(y, metrics.introTop, metrics.introTop + metrics.introDistance) * 10;
  window.KaalchakraAudio?.scene('intro', t / 10);
  const out = segment(t, 1.2, 3.6) ** 2;
  brand.style.transform = `translateY(${-metrics.height * .35 * out}px)`;
  brand.style.opacity = 1 - out;
  brand.style.pointerEvents = out > .85 ? 'none' : '';
  brand.inert = out > .95;
  captain.style.transform = `translateX(${130 * segment(t, .8, 3.4) ** 3}%)`;
  captain.style.opacity = 1 - segment(t, 2.2, 3.4) ** 2;
  crab.style.transform = `translate(${-180 * segment(t, .5, 3)}px,${110 * segment(t, .5, 3)}px)`;
  cue.style.opacity = 1 - segment(t, .3, 1.2);
  const rise = easeOut(segment(t, 3.4, 7.4));
  scene.style.transform = `translateY(${100 * (1 - rise)}%) scale(${mix(1.08, 1, rise)})`;
  scene.style.opacity = segment(t, 3.4, 5.4) * mix(1, .75, segment(t, 8.8, 10));
  const copyIn = segment(t, 6.8, 8.6), copyOut = segment(t, 9.2, 10);
  story.style.opacity = copyIn * (1 - copyOut);
  story.style.visibility = copyIn > 0 && copyOut < 1 ? 'visible' : 'hidden';
  story.style.transform = `translate(-50%,calc(-50% + ${mix(innerWidth < 700 ? 24 : 40, 0, copyIn) - 24 * copyOut}px))`;
  shade.style.opacity = t < 8.8 ? mix(.12, .48, segment(t, 3.4, 6)) : mix(.48, .88, segment(t, 8.8, 10));
  worldImage.style.transform = `scale(${mix(1.04, 1.11, segment(t, 0, 10))}) translateY(${-8 * segment(t, 0, 10)}px)`;
  const jp = segment(y, metrics.journeyTop, metrics.journeyTop + metrics.journeyDistance);
  window.KaalchakraAudio?.scene('journey', jp);
  const shift = easeOut(segment(jp, .24, .4)) + easeOut(segment(jp, .58, .74));
  track.style.transform = `translateX(${-shift * 100 / 3}%)`;
  wheel.style.transform = `rotate(${-90 - shift * 90 + 50 * segment(jp, .9, 1)}deg)`;
  const current = Math.round(shift);
  markers.forEach((m, i) => m.classList.toggle('active', i === current));
  stages.forEach((stage, i) => {
    const distance = Math.min(1, Math.abs(shift - i));
    stage.style.opacity = mix(1, .25, distance);
    stage.style.transform = `scale(${mix(1, .92, distance)})`;
    stage.style.filter = `blur(${Math.sin(distance * Math.PI) * 4}px)`;
  });
  paintBounty(segment(y, metrics.bountyTop, metrics.bountyTop + metrics.bountyDistance));
}
function paintBounty(progress) {
  const p = clamp(progress), unit = Math.min(1.15, bountyScene.clientWidth / 540);
  window.KaalchakraAudio?.scene('bounty', p);
  const arrival = easeOut(segment(p, 0, .18));
  const unlock = easeOut(segment(p, .16, .38));
  const opening = easeOut(segment(p, .38, .75));
  const reveal = segment(p, .43, .59);
  const release = easeOut(segment(p, .45, .8));
  bountyStage.style.setProperty('--bounty-open', opening.toFixed(4));
  bountyStage.style.setProperty('--bounty-progress', p.toFixed(4));
  chestClosed.style.opacity = 1 - segment(p, .4, .56);
  chestClosed.style.transform = `translate(-50%,-50%) translateY(${16 * (1 - arrival) * unit}px) scale(${mix(.88, 1, arrival)}) rotate(${-3 * (1 - arrival)}deg)`;
  chestOpen.style.opacity = reveal;
  chestOpen.style.transform = `translate(-50%,-50%) translateY(${18 * (1 - opening) * unit}px) scale(${mix(.9, 1.04, opening)})`;
  treasureLight.style.opacity = mix(.05, 1, opening);
  vaultLanternLit.style.opacity = mix(.12, .95, opening);
  vaultLanternUnlit.style.opacity = mix(.78, 0, opening);
  bountyRings.style.transform = `translate(-50%,-50%) rotateX(${mix(62, 48, opening)}deg) rotateZ(${-25 + p * 80}deg)`;
  bountyRings.style.opacity = mix(.35, .8, opening);
  const keyX = mix(-180, -35, unlock) + 210 * release;
  const keyY = mix(-95, 10, unlock) - 145 * release;
  const keyTurn = mix(-40, 0, unlock) + 155 * segment(p, .29, .44) - 45 * release;
  bountyKey.style.transform = `translate(calc(-50% + ${keyX * unit}px),calc(-50% + ${keyY * unit}px)) rotate(${keyTurn}deg)`;
  bountyKey.style.opacity = mix(.85, .6, release);
  bountyLoot.forEach((coin, i) => {
    const flight = easeOut(segment(p, .43 + i * .012, .8 + i * .015));
    const x = coin.x * unit * flight;
    const y = (coin.y * flight + 35 * (1 - flight)) * unit;
    coin.element.style.opacity = flight;
    coin.element.style.transform = `translate(calc(-50% + ${x}px),calc(-50% + ${y}px)) perspective(500px) rotateY(${flight * 260 + i * 24}deg) rotate(${coin.turn * flight}deg) scale(${mix(.4, 1, flight)})`;
  });
  bountySparks.forEach((spark, i) => {
    const flight = segment(p, .42 + i * .004, .82 + i * .004);
    const travel = easeOut(flight);
    spark.element.style.transform = `translate(${spark.x * unit * travel}px,${spark.y * unit * travel + 35 * flight * flight}px) rotate(${spark.turn * flight}deg)`;
    spark.element.style.opacity = Math.sin(flight * Math.PI) * .85 + .12 * opening;
  });
  const pulse = segment(p, .35, .7);
  bountyPulse.style.transform = `translate(-50%,-50%) scale(${mix(.4, 4.5 * unit, pulse)})`;
  bountyPulse.style.opacity = Math.sin(pulse * Math.PI) * .6;
  const phase = p < .27 ? 0 : p < .64 ? 1 : 2;
  bountyBriefs.forEach((brief, i) => { brief.classList.toggle('active', i === phase); brief.setAttribute('aria-hidden', String(i !== phase)); bountyChapters[i].classList.toggle('active', i === phase); });
  bountyCue.style.opacity = 1 - segment(p, .58, .8);
  bountyAnnouncement.style.opacity = segment(p, .68, .88);
}
bountyStage.addEventListener('pointermove', event => {
  if (paused || !matchMedia('(hover: hover) and (pointer: fine)').matches) return;
  const rect = bountyStage.getBoundingClientRect();
  bountyStage.style.setProperty('--pointer-x', ((event.clientX - rect.left) / rect.width * 2 - 1).toFixed(3));
  bountyStage.style.setProperty('--pointer-y', ((event.clientY - rect.top) / rect.height * 2 - 1).toFixed(3));
}, { passive: true });
bountyStage.addEventListener('pointerleave', () => { bountyStage.style.setProperty('--pointer-x', 0); bountyStage.style.setProperty('--pointer-y', 0); });
function tick(time) {
  pendingFrame = false;
  const elapsed = Math.min(64, time - (lastTime || time - 16)); lastTime = time;
  smoothY = paused ? scrollY : mix(smoothY, scrollY, 1 - Math.exp(-elapsed / 115));
  if (Math.abs(scrollY - smoothY) < .2) smoothY = scrollY;
  updateScene(smoothY);
  if (Math.abs(scrollY - smoothY) > .1) schedule();
}
function schedule() { if (!pendingFrame) { pendingFrame = true; requestAnimationFrame(tick); } }
addEventListener('scroll', schedule, { passive: true });
let resizeTimer;
addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { measure(); schedule(); resizeCanvas(); }, 160); });
addEventListener('load', () => { measure(); smoothY = scrollY; schedule(); }, { once: true });
document.fonts.ready.then(() => { measure(); schedule(); });
measure(); schedule();

// The Captain's Log stays pinned while scroll progress sails the ship.
const voyageChart = $('.timeline-chart'), voyageMap = $('.timeline-map'), voyageShip = $('.timeline-ship');
const voyagePorts = $$('.route-port'), voyageEntries = $$('.timeline-stops .log-entry');
let voyageProgress = 0;
function paintVoyage(progress) {
  voyageProgress = clamp(progress);
  window.KaalchakraAudio?.scene('voyage', voyageProgress);
  const point = route.getPointAtLength(routeLength * voyageProgress);
  voyageShip.setAttribute('transform', `translate(${point.x} ${point.y})`);
  route.style.strokeDashoffset = routeLength * (1 - voyageProgress);
  const active = Math.round(voyageProgress * 2);
  voyageEntries.forEach((entry, i) => {
    const selected = i === active;
    entry.classList.toggle('active', selected);
    if (selected) entry.setAttribute('aria-current', 'step'); else entry.removeAttribute('aria-current');
    voyagePorts[i].classList.toggle('active', selected);
    voyagePorts[i].classList.toggle('visited', voyageProgress >= i / 2 - .002);
  });
  // The boat's slight sway is scrubbed too: stopping the scroll stops the ship.
  $('.ship-bob').style.transform = paused ? 'none' : `translateY(${Math.sin(voyageProgress * Math.PI * 12) * 1.5}px) rotate(${Math.sin(voyageProgress * Math.PI * 8) * 2}deg)`;
  if (voyageChart.scrollWidth > voyageChart.clientWidth) {
    const matrix = voyageMap.getScreenCTM();
    if (matrix) {
      const shipX = new DOMPoint(point.x, point.y).matrixTransform(matrix).x;
      const centerX = voyageChart.getBoundingClientRect().left + voyageChart.clientWidth / 2;
      voyageChart.scrollLeft = Math.max(0, Math.min(voyageChart.scrollWidth - voyageChart.clientWidth, voyageChart.scrollLeft + shipX - centerX));
    }
  } else voyageChart.scrollLeft = 0;
}
paintVoyage(paused ? 1 : 0);

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) { entry.target.classList.add('in-view'); observer.unobserve(entry.target); }
  }), { threshold: .08, rootMargin: '0px 0px -25px 0px' });
  $$('.reveal').forEach((el, i) => { if (!paused) el.classList.add('will-reveal'); el.style.transitionDelay = `${i % 2 * .12}s`; observer.observe(el); });
  const navObserver = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    $$('nav a[href^="#"]').forEach(link => { if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
  }), { rootMargin: '-20% 0px -60% 0px' });
  $$('main section[id]').forEach(el => navObserver.observe(el));
}

// A small particle layer pauses when hidden, or when the visitor pauses motion.
const canvas = $('#sea-particles'), context = canvas.getContext('2d');
let particleWidth, particleHeight, particleFrame, particleLast = 0;
const particles = Array.from({ length: innerWidth < 700 ? 16 : 34 }, () => ({ x: Math.random(), y: Math.random(), size: .5 + Math.random() * 1.2, speed: .006 + Math.random() * .015, phase: Math.random() * Math.PI * 2 }));
function resizeCanvas() { const dpr = Math.min(devicePixelRatio, 1.5); particleWidth = innerWidth; particleHeight = innerHeight; canvas.width = particleWidth * dpr; canvas.height = particleHeight * dpr; context?.setTransform(dpr, 0, 0, dpr, 0, 0); }
function animateParticles(time) {
  particleFrame = undefined;
  if (!context || paused || document.hidden) return;
  if (time - particleLast > 32) {
    const delta = Math.min(60, time - (particleLast || time)); particleLast = time;
    context.clearRect(0, 0, particleWidth, particleHeight);
    particles.forEach(p => { p.y -= p.speed * delta / 1000; if (p.y < -.02) p.y = 1.02; const alpha = .2 + .3 * Math.sin(time / 2200 + p.phase) ** 2; context.fillStyle = `rgba(235,191,104,${alpha})`; context.beginPath(); context.arc(p.x * particleWidth + Math.sin(time / 5000 + p.phase) * 20, p.y * particleHeight, p.size, 0, Math.PI * 2); context.fill(); });
  }
  particleFrame = requestAnimationFrame(animateParticles);
}
function resumeParticles() { if (!particleFrame && !paused && !document.hidden) particleFrame = requestAnimationFrame(animateParticles); }
document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(particleFrame); particleFrame = undefined; } else resumeParticles(); });
motionButton.addEventListener('click', resumeParticles);
reduced.addEventListener('change', resumeParticles);
resizeCanvas(); resumeParticles();
