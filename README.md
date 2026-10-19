# VD Collect

An e-waste collection and recycling locator built with Express, MongoDB, and vanilla JavaScript. Citizens can find collection centers and request pickups; administrators manage centers and dispatch collectors.

**[Open the live app](https://vd-collect.vercel.app/)** · **[GitHub repository](https://github.com/Vikas-daddi/VD-Collect)**

## Features

- **Citizens:** register and log in, search centers by name, city, pincode or accepted items, find nearby centers, book pickups with an optional image, and view pickup history and recycling points.
- **Collectors:** view assigned pickups, open directions in Google Maps, and mark their own assignments as collected.
- **Administrators:** add, edit and delete centers, confirm or cancel pickups, assign collectors, review center requests, and view booking analytics.
- **Notifications:** optional SMTP email for pickup requests, confirmations and completion.

Completed pickups award 50 points per item. The Eco Warrior badge unlocks at 500 points. Completed and cancelled bookings cannot be reopened through the status API.

## Stack

HTML, CSS and browser JavaScript; Leaflet with CARTO/OpenStreetMap map tiles; Chart.js; Node.js and Express; MongoDB with Mongoose; bcrypt password hashing; JWT authentication; Nodemailer.

## Run locally

Node.js 24 was used for verification. You also need npm and a reachable MongoDB database.

```sh
git clone https://github.com/Vikas-daddi/VD-Collect.git
cd VD-Collect
npm ci
```

Copy `.env.example` to `.env` and replace the example values:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/vdcollect
JWT_SECRET=replace-with-a-long-random-secret
```

Never commit `.env` or real credentials. For MongoDB Atlas, use your own connection URI and configure network access for the deployment.

```sh
npm start
```

Open [http://localhost:5000](http://localhost:5000). Use `npm run dev` for automatic server restarts during development.

Public registration creates citizen accounts. Admin and collector roles must be provisioned through a trusted database administration process; the public form does not grant privileged roles. The project has no public seed endpoints. Do not use the legacy seed scripts against a database containing data you need to retain.

## Optional email

Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` and optionally `FROM_EMAIL` in the environment. Port 465 enables TLS directly; other ports use the transport defaults. If SMTP is absent, the application skips notifications without creating external test email accounts.

`CLIENT_URL` can restrict CORS to your frontend origin; it defaults to `*`. Email delivery is separate from pickup persistence.

## Pages and API

- `/`: home; `/map`: center locator; `/book`: pickup form; `/dashboard`: citizen history and points.
- `/login` and `/register`: authentication; `/success`: booking confirmation.
- `/admin`: administration; `/collector`: collector assignments. APIs enforce role permissions even though HTML pages are publicly served.
- `GET /api/ping`: server health independent of MongoDB.
- `/api/auth`: registration, login, current account and the admin-only collector directory.
- `/api/centers`: public active-center list; admin-only create, update and delete operations.
- `/api/bookings`: authenticated bookings, collector assignments, admin dispatch and permitted status changes.
- `/api/requests`: citizen center requests and admin review.

Protected requests use `Authorization: Bearer <token>`. Invalid input returns 400, missing/invalid authentication 401, forbidden actions 403, missing resources 404, conflicting status changes 409, and database outages 503. Unknown API paths return JSON rather than the frontend HTML.

## Tests

```sh
npm test
```

The 13 regression tests cover page serving, API errors, role permissions, invalid booking input, completion concurrency, collector assignment, zero coordinates, database connection retries and HTML escaping. Database models and email are mocked: tests do not modify the configured database or send messages.

Local verification on October 19, 2026: all 13 tests passed; the home, login and registration pages loaded in the browser; the live local database returned 200 centers. Real pickup writes and SMTP delivery still require integration testing.

## Deploy on Vercel

Import this GitHub repository into Vercel and use the included `vercel.json`. Set `MONGO_URI` and `JWT_SECRET` in the Vercel project environment; add SMTP settings only if needed. MongoDB must allow connections from the deployment environment.

`server.js` exports the Express application for serverless use and starts a listener only when run directly. Database connections are reused and concurrent connection attempts share a promise. When Git integration is enabled, pushes to the configured production branch trigger deployment.

The canonical public URL is **https://vd-collect.vercel.app/**. After deployment, verify `/api/ping`, `/api/centers`, login and role-specific flows. A successful Git push alone does not confirm deployment success.

## Project documentation

- [Product requirements](prd.md): users, features and acceptance criteria.
- [Architecture](architecture.md): runtime, directory structure and data flow.
- [Coding rules](rules.md): conventions and verification requirements.
- [Design direction](design.md): visual style, interaction and accessibility.
- [Tasks](tasks.md): completed work and outstanding improvements.
- [Project memory](memory.md): current context, decisions and verification limits.

These six context files follow the file list in [Avani Hiranandani's reel](https://www.instagram.com/reel/DdeCyNIqBWz/); their contents describe this repository.
