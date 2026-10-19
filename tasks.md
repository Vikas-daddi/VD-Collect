# VD Collect tasks

Updated: October 19, 2026.

## Completed and locally verified

- [x] Start the Express app and verify local home, login and registration pages.
- [x] Read the configured local centers API successfully (200 records at verification).
- [x] Propagate database connection errors, share concurrent attempts and bound connection selection time.
- [x] Make ping independent of MongoDB and return JSON for unknown API endpoints.
- [x] Remove public destructive center seeding and collector-account seeding endpoints.
- [x] Restrict collector status updates to their own assignments and completion only.
- [x] Reject reopening final bookings and prevent duplicate rewards from concurrent completion requests.
- [x] Restrict the collector directory and validate assignment targets.
- [x] Validate booking data, resource IDs, center coordinates and status values.
- [x] Preserve zero coordinates during center edits.
- [x] Escape rendered text and restrict uploaded-image URL formats.
- [x] Stop replacing failed geocoding results with Delhi coordinates.
- [x] Disable optional email cleanly when SMTP is absent.
- [x] Remove the unsupported Admin option from public registration.
- [x] Add and pass 13 regression tests with mocked database models and email.
- [x] Rewrite README and add the six project-context documents from the referenced reel.
- [x] Confirm the existing public URL loads and matches GitHub About metadata.

## Release verification

- [ ] Commit and push the tested fixes and documentation to GitHub.
- [ ] Confirm Vercel serves the new revision after the production deployment finishes.
- [ ] Run database-backed pickup, dispatch, completion and badge checks with disposable data.
- [ ] Verify SMTP delivery when a transport is configured.

## Prioritized improvements

- [ ] Make booking completion and reward persistence recoverable across process failures, using a transaction or durable retry design.
- [ ] Add authentication rate limiting and stronger password requirements; the installed limiter is not currently wired in.
- [ ] Define role-revocation behavior for existing JWTs and add a safe privileged-account administration workflow.
- [ ] Add a CI workflow that runs the regression suite for proposed changes.
- [ ] Improve inline form feedback, loading controls and accessible notifications.
- [ ] Use one service-date policy in the browser and server across timezones.
- [ ] Replace footer placeholder links with approved privacy, terms and contact content.
- [ ] Review legacy seed scripts separately for schema compatibility and safe operation.
- [ ] Add real MongoDB integration tests for concurrent updates; mocked tests alone do not prove database behavior.
