/* Shared visual language, with page-specific controls and no homepage scene dependencies. */
(() => {
  const menu = document.querySelector('#navigation');
  const toggle = document.querySelector('.menu-toggle');
  const closeMenu = () => {
    menu.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  };
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    toggle.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('is-open', open);
  });
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('click', event => { if (!event.target.closest('.site-header')) closeMenu(); });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu.classList.contains('is-open')) { closeMenu(); toggle.focus(); }
  });

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const motionButton = document.querySelector('#motion-toggle');
  let paused = reduced.matches;
  try { paused ||= localStorage.getItem('kaalchakra-motion') === 'paused'; } catch {}
  const reflectMotion = () => {
    document.documentElement.classList.toggle('motion-paused', paused);
    motionButton.setAttribute('aria-pressed', String(paused));
    motionButton.textContent = paused ? 'Enable motion' : 'Pause motion';
  };
  reflectMotion();
  motionButton.addEventListener('click', () => {
    paused = !paused;
    reflectMotion();
    try { localStorage.setItem('kaalchakra-motion', paused ? 'paused' : 'enabled'); } catch {}
  });
  reduced.addEventListener('change', event => { paused = event.matches; reflectMotion(); });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in-view');
      observer.unobserve(entry.target);
    }), { threshold: .08 });
    document.querySelectorAll('.reveal').forEach((element, index) => {
      if (!paused) element.classList.add('will-reveal');
      element.style.transitionDelay = `${index % 3 * .08}s`;
      observer.observe(element);
    });
  }
})();
