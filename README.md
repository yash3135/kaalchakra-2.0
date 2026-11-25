# KAALCHAKRA CTF

Static website for KAALCHAKRA CTF, organized by NFSU Goa and TH3_RANG3RS.

- `/index.html` — edition 2.0, with the Pirates of the Caribbean theme.
- `/1.0/index.html` — preserved first edition (28 March–11 April 2026).
- `/1.0/organizers.html` and `/1.0/stats-1.0.html` — redirects to the first edition highlights.

The old root organizers and results URLs redirect to their archived pages.
Archive assets are shared from `/images/`, `/icons/`, `/brochure/`, and `/videos/`;
keep these directories when deploying. The archive has its own CSS and JavaScript.

Run locally from this directory:

```powershell
python -m http.server 8080 --bind 127.0.0.1
```

Open `http://127.0.0.1:8080/index.html` or `http://127.0.0.1:8080/1.0/index.html`.
No build or package installation is required. Check local references with
`python tools/check-site.py` and JavaScript syntax with `node --check pirate.js`.

The new design lives in `index.html`, `pirate.css`, and `pirate.js`. It uses a
full-screen layered harbor, an original pirate captain, a pinned 3.6-screen
opening transition, a rising nautical chart, wheel-driven stage panels,
keyboard-accessible domain tabs, a sailing timeline preview, and a scroll-opened treasure
chest. The animation code uses native scrolling and requestAnimationFrame;
there is no animation framework or scroll hijacking dependency.

Pirate PNGs come from `images/2.0/`. Original generated scene assets
are optimized WebPs in `images/2.0/cinematic/`; their prompts and provenance
are in `assets/cinematic-artwork.md` and `assets/bounty-artwork.md`. The existing reveal video is opened on
demand. A footer control pauses motion, and the operating system's reduced
motion preference switches pinned sequences to readable, stacked chapters.
The Captain's Log pins while scrolling moves a ship along its SVG route and
activates the three milestones. Scrolling backward reverses the voyage; the
ship stays still when scrolling stops. On mobile the map follows the ship.
Reduced motion shows a static route with all milestones. Archive return links
include `index.html`, so navigation also works when opening the files locally.

The bounty uses a pinned three-part treasure reveal: the key approaches and
turns, the sealed chest gives way to its open state, and coins, sparks, light
beams, and a nautical ring expand around it. All primary movement follows
scroll progress and reverses on scrolling back. Fine-pointer devices add a
small perspective response. Reduced motion shows the final open chest and
announcement copy without pinning or animated effects. Dates and prizes
remain unannounced.

Reference research is kept outside this project in
`E:/Timepass/Kaalchakra/Pinaka-REA/`. It contains captured public artifacts,
SHA-256 digests, focused REA analysis with source-range provenance, passive
browser Evidence, scroll measurements, screenshots, and a findings report.
Reference source and artwork are research material, not production assets.
Dates, registration, prizes, eligibility, and the final format for 2.0 are
intentionally marked as awaiting announcement. Community links are retained
from the first edition. Update these details when confirmed.

Deploy this directory to the existing static host with directory-index support
(`index.html`). This makes `/1.0/` available on the same domain. Canonical URLs
use `https://kaalchakractf.com`. No hosting or domain changes have been made locally.
