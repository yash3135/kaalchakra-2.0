(() => {
  const key = 'kaalchakra-theme';
  let theme = 'dark';
  try { if (localStorage.getItem(key) === 'light') theme = 'light'; } catch (_) {}
  function applyTheme() {
    document.documentElement.dataset.theme = theme;
    document.querySelectorAll('[data-theme-style]').forEach(link => { link.href = link.dataset[theme]; });
    document.querySelectorAll('[data-dark-src][data-light-src]').forEach(image => { image.src = theme === 'light' ? image.dataset.lightSrc : image.dataset.darkSrc; });
    const color = document.querySelector('meta[name="theme-color"]');
    if (color) color.content = theme === 'light' ? '#f4ead5' : '#081719';
    const button = document.querySelector('#theme-toggle');
    if (button) {
      button.setAttribute('aria-pressed', String(theme === 'light'));
      button.setAttribute('aria-label', theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme');
      button.textContent = theme === 'light' ? '☾ Dark mode' : '☀ Light mode';
    }
  }
  applyTheme();
  document.addEventListener('DOMContentLoaded', () => {
    const button = document.createElement('button');
    button.id = 'theme-toggle';
    button.type = 'button';
    button.addEventListener('click', () => {
      theme = theme === 'dark' ? 'light' : 'dark';
      try { localStorage.setItem(key, theme); } catch (_) {}
      applyTheme();
    });
    document.body.appendChild(button);
    applyTheme();
  });
})();
