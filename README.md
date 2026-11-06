# FSM AF Dashboard

Static, self-contained demo dashboard hosted on GitHub Pages.

## Live URL

- https://fsm-afproject.akvo.org/

## Deployment

- Single static HTML page served as `index.html`.
- No backend, database, build process, framework, or external asset folder required.
- All CSS, JavaScript, fonts, and images are embedded in the HTML.
- `CNAME` binds the custom domain `fsm-afproject.akvo.org`.

## DNS

- `fsm-afproject.akvo.org` → `akvo.github.io` (CNAME, TTL 300), managed in
  `akvo/akvo-config` under `dns/zones/akvo-org.txt` (Terraform GitOps,
  "DNS CI" workflow).

## Notes

- HTTPS is served by GitHub Pages (Let's Encrypt).
- To update the dashboard, replace `index.html` and push to `main`;
  GitHub Pages redeploys automatically.
