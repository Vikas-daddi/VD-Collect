# VD Collect project memory

Updated: October 19, 2026. Keep this document factual; never store secrets or personal pickup data here.

## Identity

- Repository: https://github.com/Vikas-daddi/VD-Collect
- Production URL: https://vd-collect.vercel.app/
- Local app: http://localhost:5000 (default port).
- Main branch: `main`.
- Purpose: locate e-waste centers and coordinate citizen pickups, admin dispatch and collector assignments.

## Technical context

CommonJS Node/Express backend; MongoDB/Mongoose persistence; vanilla HTML/CSS/JavaScript frontend. Leaflet maps, CARTO/OpenStreetMap tiles and Chart.js visualizations are loaded from external services. Vercel imports the exported Express application; direct execution starts the local HTTP server.

`npm start` runs the app, `npm run dev` uses nodemon, and `npm test` runs Node's test runner. Node.js 24 was used for the latest checks.

## Decisions to preserve

Public registration grants citizen access only. Admin and collector roles require trusted provisioning. Public seed endpoints were removed. Do not execute the local legacy seed or cleanup scripts during ordinary verification.

Collectors may only complete their own assigned bookings. Completed and cancelled bookings are final. Conditional booking updates prevent repeated completion from awarding points twice; user increments and badge additions use atomic operators.

Database failures propagate to a 503 API response. Ping is database-independent. Missing SMTP disables email without creating an external test account. Failed geocoding requires correction instead of a fabricated coordinate fallback.

Escape dynamic HTML text and restrict image data URLs. The six context files are root-level Markdown documents requested by the user; `rules.md` is a reference and is not automatically loaded by every coding tool.

## Verification record and limits

On October 19, 2026, the 13 mocked regression tests passed. All 24 JavaScript files initially passed syntax checks; final frontend, inline-script and entrypoint checks also passed. Local browser checks covered home, login and registration. A read-only request using the existing local configuration returned 200 centers. The public homepage and repository About URL were verified in the browser.

Real pickup writes and email delivery were not exercised. Status, points and badge writes are not transactional, so crash recovery remains unresolved. JWT role claims last for the token lifetime. Browser token storage currently uses localStorage. Footer legal/contact links remain placeholders.

At documentation creation, the local changes had not yet been confirmed deployed. Use `tasks.md` and the actual remote revision to determine release status; do not infer deployment from local success.

## Source of context-file structure

The user supplied https://www.instagram.com/reel/DdeCyNIqBWz/. Its caption names `prd.md`, `architecture.md`, `rules.md`, `design.md`, `tasks.md` and `memory.md`. These documents contain repository-specific material rather than copied templates.
