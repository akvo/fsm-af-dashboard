# FSM AF Dashboard

Static, self-contained demo dashboard hosted on GitHub Pages.

## Live URL

- https://fsm-af.akvotest.org/

## Deployment

- Single static HTML page served as `index.html`.
- No backend, database, build process, framework, or external asset folder required.
- All CSS, JavaScript, fonts, and images are embedded in the HTML.
- `CNAME` binds the custom domain `fsm-af.akvotest.org`.

## DNS

- `fsm-af.akvotest.org` → `akvo.github.io` (CNAME, TTL 300), managed in
  `akvo/akvo-config` under `dns/zones/akvotest-org.txt` (Terraform GitOps,
  "DNS CI" workflow).

## Notes

- HTTPS is served by GitHub Pages (Let's Encrypt).
- To update the dashboard, replace `index.html` and push to `main`;
  GitHub Pages redeploys automatically.
