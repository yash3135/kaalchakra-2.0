// Subtle interactive effects shared by both pages. Pure decoration: pages work fully without it.
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

// Torch: a soft light follows the pointer (mouse/trackpad only). CSS reads --mx/--my.
if (!reduce && matchMedia("(pointer: fine)").matches) {
  document.body.classList.add("torch");
  addEventListener("pointermove", (e) => {
    document.body.style.setProperty("--mx", `${e.clientX}px`);
    document.body.style.setProperty("--my", `${e.clientY}px`);
  }, { passive: true });
}

// Cards light up where the pointer is. CSS reads --cx/--cy.
addEventListener("pointermove", (e) => {
  const card = e.target.closest?.(".card");
  if (!card) return;
  const r = card.getBoundingClientRect();
  card.style.setProperty("--cx", `${e.clientX - r.left}px`);
  card.style.setProperty("--cy", `${e.clientY - r.top}px`);
}, { passive: true });

// Reveal blocks once as they scroll into view. Runs after main.js has rendered the content.
if (!reduce && "IntersectionObserver" in window) {
  const io = new IntersectionObserver((entries) => entries.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
  }), { rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(".head, .card, .thread li, .stats li, .gallery figure, .proof figure, .wide-photo, .faq details, .org-band")
    .forEach((el) => { el.classList.add("reveal"); io.observe(el); });
}

// Match the 2.0 navigation on smaller screens.
const menuButton = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
const editionMenu = document.querySelector('.edition-menu');
function closeMenu() { menuButton.setAttribute('aria-expanded', 'false'); navigation.classList.remove('is-open'); }
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menuButton.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('is-open', open);
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('click', event => {
  if (!event.target.closest('.edition-menu')) editionMenu.open = false;
  if (!event.target.closest('.site-header')) closeMenu();
});
document.addEventListener('keydown', event => { if (event.key === 'Escape') { closeMenu(); editionMenu.open = false; } });
