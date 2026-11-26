(() => {
  const dialog = document.getElementById('registration-dialog');
  const open = document.getElementById('register-open');
  open.addEventListener('click', () => dialog.showModal());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  dialog.querySelector('.registration-contact').addEventListener('click', () => dialog.close());
})();
