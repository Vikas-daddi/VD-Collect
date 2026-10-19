# VD Collect coding rules

Scope: all application code and documentation in this repository. This is a root-level reference document; tools must explicitly read it unless their own configuration includes it.

## Implementation

- Preserve the CommonJS Express backend and vanilla browser JavaScript unless a migration is requested.
- Keep endpoint definitions in `routes/`, data operations in `controllers/`, schemas in `models/` and shared checks in `middleware/`.
- Use relative `/api` URLs in the frontend. Keep `server.js` importable without starting a listener.
- Match item category strings to the form choices when implementing category filtering.
- Preserve valid zero values: use `latitude ?? center.latitude`, not `latitude || center.latitude`.
- Surface failed API and geocoding requests; never invent a successful result or substitute unrelated coordinates.

## Data and permissions

- Validate request shapes, IDs, dates, quantities and status enums on the server.
- Enforce role and assignment checks on the server; browser visibility is not authorization.
- Public registration creates citizens only. Never add public role elevation or data-seeding routes.
- Treat completed and cancelled pickups as final; preserve idempotency and conditional status updates.
- Escape untrusted text with `escapeHTML` before HTML interpolation; prefer `textContent` for plain text.
- Validate image URLs with `safeImageURL`; do not interpolate arbitrary URLs into uploaded-image markup.
- Never commit `.env`, tokens, passwords, personal booking data or database exports.
- Never run a destructive seed or cleanup script as part of tests or deployment.

## Verification and maintenance

- Run `npm test` for behavioral backend changes and check changed JavaScript syntax.
- Use mocked models for regression tests; database writes require an explicitly chosen disposable environment.
- Verify visible UI changes in a browser and distinguish local checks from deployed checks.
- Document known limits such as the lack of a completion/rewards transaction.
- Update README and relevant context documents when behavior, setup or deployment changes.
- Keep `tasks.md` accurate: record completion only after the stated validation succeeds.
- Review the exact staged diff and publish only files intended for the change.
