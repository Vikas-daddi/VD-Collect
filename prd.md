# Product requirements: VD Collect

## Purpose and scope

Help citizens locate e-waste collection centers, request pickups and track their recycling activity. Give administrators a dispatch workflow and collectors a view of their assigned work.

This is a web application with a shared Express API. Payments, automatic route optimization, live vehicle tracking and verified recycler certification are outside the implemented scope.

## Users and flows

### Citizen

1. Register or log in with email and password.
2. Choose an e-waste category and search centers, or request nearby centers using browser geolocation.
3. Select an active center, item names and positive quantities, a pickup date, address and optional supported image.
4. Submit a pickup and review its status and recycling points in the dashboard.
5. Request a new center for an underserved location.

### Administrator

1. Manage center names, addresses, coordinates, contact details and accepted items.
2. Review pickup requests, confirm or cancel them and assign a user with the collector role.
3. Complete pickups and view booking analytics.
4. Review center requests and use approved locations to prepare a center entry.

### Collector

1. View assigned pickups and contact/location details needed to collect items.
2. Open directions in Google Maps.
3. Mark only their own assigned pickups completed.

## Functional acceptance criteria

- Public registration always creates a citizen; privileged roles are provisioned separately.
- Center listing includes active centers. Bookings reject inactive or invalid centers.
- Booking validation rejects empty items, nonpositive quantities, invalid dates, past service dates and unsupported image data URLs.
- Service date validation uses Asia/Kolkata; the browser calendar currently uses the device timezone.
- Allowed statuses are pending, confirmed, completed and cancelled. Completed and cancelled records are final; repeating the same status is idempotent.
- Concurrent completion attempts cannot both claim the status transition. Points increment by 50 per item; Eco Warrior unlocks at 500 points.
- Citizens can see their own history; admins can see all bookings. Assignment views require an admin or collector role.
- Missing database access returns 503 without waiting for Mongoose query buffering. The ping endpoint remains available.
- Text from users and center records is escaped when rendered in HTML templates.

## Quality and release criteria

Run `npm test`; check JavaScript syntax; verify key pages in a browser. Use disposable data for a separate database-backed booking test and verify SMTP only when configured. Publish no credentials or destructive public seed endpoints.

Known limitation: booking completion, point increments and badge updates span multiple database writes. Crash-safe recovery across these writes is a future improvement; current tests use mocked models.
