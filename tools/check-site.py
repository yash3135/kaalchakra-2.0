"""Check the local page graph and assets without third-party dependencies."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
PAGES = [ROOT / p for p in ('index.html', '1.0/index.html', 'organizers.html', 'stats-1.0.html', '1.0/organizers.html', '1.0/stats-1.0.html')]


class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.links = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if 'id' in attrs:
            self.ids.add(attrs['id'])
        for key in ('src', 'href', 'poster'):
            if attrs.get(key):
                self.links.append(attrs[key])


errors = []
parsed = {}
for path in PAGES:
    page = Page()
    page.feed(path.read_text(encoding='utf-8'))
    parsed[path.resolve()] = page
for path, page in parsed.items():
    for link in page.links:
        url = urlsplit(link)
        if url.scheme or url.netloc:
            continue
        target = (ROOT / unquote(url.path).lstrip('/') if url.path.startswith('/') else path.parent / unquote(url.path)).resolve() if url.path else path
        if target.is_dir():
            target /= 'index.html'
        if not target.exists():
            errors.append(f'{path.relative_to(ROOT)}: missing {link}')
        elif url.fragment and target in parsed and url.fragment not in parsed[target].ids:
            errors.append(f'{path.relative_to(ROOT)}: missing anchor {link}')
if errors:
    print('\n'.join(errors))
    raise SystemExit(1)
print(f'PASS: {len(PAGES)} pages; local assets, links, and anchors resolve.')
