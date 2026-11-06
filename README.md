# FSM AF Dashboard

Static, self-contained demo dashboard hosted on GitHub Pages.

## Live URL

- https://fsm-afproject.akvo.org/

## Deployment

- Single static HTML page served as `index.html`.
- No backend, database, build process or framework required.
- All CSS, JavaScript, fonts, map data and logos are embedded in the HTML.
- Output photos live in `photos/` as compressed WebP: a 640px thumbnail
  (`*-640.webp`) shown in each output's details, and a 1200px version that
  opens on click. They load only when a viewer opens an output's details.
- `CNAME` binds the custom domain `fsm-afproject.akvo.org`.

## DNS

- `fsm-afproject.akvo.org` → `akvo.github.io` (CNAME, TTL 300), managed in
  `akvo/akvo-config` under `dns/zones/akvo-org.txt` (Terraform GitOps,
  "DNS CI" workflow).

## Notes

- HTTPS is served by GitHub Pages (Let's Encrypt).
- To update the dashboard, replace `index.html` and push to `main`;
  GitHub Pages redeploys automatically.
