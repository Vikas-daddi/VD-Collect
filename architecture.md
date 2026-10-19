# VD Collect architecture

## Runtime

The browser loads HTML, CSS and vanilla JavaScript from `public/`. Browser requests use relative `/api` URLs. Express serves these assets, page aliases and API routers from the same origin. Vercel routes incoming requests to the exported application in `server.js`; `npm start` runs it directly on port 5000 by default.

Frontend assets also depend on external Leaflet, Chart.js and font CDNs. Map tiles use CARTO/OpenStreetMap. Browser geolocation supplies coordinates after permission; Nominatim resolves administrator-entered center addresses; Google Maps opens directions.

## Directory ownership

- `server.js`: middleware, health endpoint, routers, page serving and error handling.
- `config/db.js`: Mongoose connection reuse, shared connection attempts and a five-second server selection timeout.
- `routes/`: endpoint definitions, authentication, authorization and validation composition.
- `middleware/auth.js`: JWT verification and role guards.
- `middleware/validation.js`: reusable IDs, center fields and booking validation.
- `controllers/`: authentication, centers, bookings and center requests.
- `models/`: Mongoose schemas for User, Center, Booking and CenterRequest.
- `utils/emailService.js`: optional SMTP notification transport; skips delivery when unconfigured.
- `public/js/app.js`: citizen routing, auth UI and dashboard.
- `public/js/map.js`: center lookup, maps, search, geolocation and booking.
- `public/js/admin.js` and `collector.js`: role-specific pages.
- `public/js/ui.js`: HTML escaping and supported image data URL checks.
- `test/app.test.js`: Node test runner suite with model and email mocks.

## Data model

Users have a unique email, hashed password, role, points and badges. Centers store scalar latitude/longitude, address, city, accepted items and an active flag. Bookings reference a user, center and optional collector; contain items, date, address, optional image and status. Center requests reference a user and location with pending/approved/dismissed status.

Center deletion is currently permanent. Citizen history substitutes a descriptive center object when the original reference is missing. New work must account for missing populated references.

## Request lifecycle

1. JSON and form parsers enforce a 10 MB request limit.
2. Static assets and database-independent `/api/ping` are served.
3. Recognized API families await the database connection.
4. Route middleware checks tokens, roles and input before the controller executes.
5. Controllers access Mongoose models, optionally send email and return JSON.
6. Unknown API routes receive JSON 404; frontend routes use the HTML app.

The database check currently runs before route authentication and validation, so an outage may return 503 even for an otherwise unauthorized request.

## Booking consistency

Status updates use a conditional `findOneAndUpdate` matching the previously read status and collector. Only the winning completion request awards points. User points use `$inc`; badge assignment uses `$addToSet`. Final statuses cannot reopen.

These writes are not wrapped in a transaction. A process failure between completion and rewards can leave a completed booking without points. A transaction or durable retry design remains on the backlog.

## Authentication and deployment configuration

JWTs contain user ID and role and expire after seven days. The browser stores the token and user profile in localStorage. Roles are taken from the signed token; role revocation is not checked against the database on every request.

Required: `MONGO_URI`, `JWT_SECRET`. Optional: `PORT`, `CLIENT_URL`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `FROM_EMAIL`. Keep environment values out of source control. `vercel.json` contains deployment routing; GitHub/Vercel integration owns deployment triggers and project environment settings.
