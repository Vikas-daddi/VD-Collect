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

Release `ef96521` was pushed to GitHub and Vercel reported a successful production deployment. The public registration form and `/js/ui.js` confirmed the updated code was served; `/api/ping` returned 200. Production initially returned 503 due to an unresolved database hostname. The local URI uses loopback and is unsuitable for Vercel. The user signed in to Atlas, created `vdcollect_app` with readWrite on `vdcollect`, restricted to Cluster0, and entered its password directly in the browser. An encoded Atlas URI was stored as a Production secret; Preview retains its prior value. Deployment `9xhfzHAsts4b5zHGSCBFPECuaejh` reached Ready and both `/api/ping` and `/api/centers` returned 200. The user authorized copying the local center catalog. Exactly 200 validated center records were inserted into `vdcollect.centers`; original center IDs were preserved, local addedBy references were omitted, and production returned HTTP 200 with 200 centers. Accounts and bookings were not copied. Passwords and connection credentials are not stored in this document. Vercel has MONGO_URI and JWT_SECRET configured for Production and Preview. Do not infer database health from deployment readiness.

## Source of context-file structure

The user supplied https://www.instagram.com/reel/DdeCyNIqBWz/. Its caption names `prd.md`, `architecture.md`, `rules.md`, `design.md`, `tasks.md` and `memory.md`. These documents contain repository-specific material rather than copied templates.
