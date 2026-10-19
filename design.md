# VD Collect design direction

## Existing visual language

Use the existing light content background (`#f8fafc`), navy text/navigation (`#0d2b3e`), pale blue accents (`#7ec8e3`) and yellow primary actions (`#f9a825`). Authentication pages use a navy gradient with a white rounded card. Inter is the preferred font, with Segoe UI and system sans-serif fallbacks.

Preserve the recycling theme, readable cards and short action labels. The main stylesheet owns public pages; `auth.css` owns login/registration and `admin.css` owns administration. Collector-specific styles currently live in its HTML.

## Page hierarchy

- Home: brief purpose, category selection and a clear center-search action.
- Map: search and location actions, map markers and selected-center details.
- Booking: center, item category/quantity, date, address, optional image and submit action.
- Dashboard: points, badges, pickup history and impact chart.
- Admin: distinct tabs for centers, pickup requests, analytics and citizen requests.
- Collector: address, contact, items, directions and a completion action per assigned pickup.

## Interaction requirements

Explain the next step in ordinary language. Keep loading, empty, failed and successful states distinct. An unavailable database must not look like a valid empty center list. If geocoding fails, ask for corrected address information or manual coordinates.

Closed collector assignments must not expose an active completion button. Public registration must not offer roles the backend does not grant. Show API error messages when they help users recover.

## Accessibility and responsive behavior

Preserve labels linked to form inputs, semantic headings and keyboard-accessible controls. Provide visible focus styles, adequate contrast and text descriptions alongside status colors. Ensure cards, maps, navigation and action groups fit small screens without hiding essential controls.

Treat native alerts and confirmations as current implementation details. Inline form errors, accessible status regions and less disruptive notifications are future improvements.

## Content and external services

Use actual center data; do not imply that sample listings are verified recycling partners. Do not invent counts or successful bookings. Explain geolocation only when requesting it. Directions open Google Maps; CDNs and tiles may fail independently of the backend.

Privacy Policy, Terms of Service and Contact currently point to placeholder anchors. Replace them with owner-approved content before treating those links as complete product features.
