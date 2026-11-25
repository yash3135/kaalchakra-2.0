// Local previews use the local edition; deployed links retain the published URL.
if (location.protocol === 'file:' || ['localhost', '127.0.0.1', '::1'].includes(location.hostname)) {
  document.querySelectorAll('a[href="https://kaalchakractf.com/1.0/index.html"]').forEach(link => {
    link.href = '1.0/index.html';
  });
}
