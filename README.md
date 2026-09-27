# Cityzen

Smart City Citizen & Municipality Platform.

## Architecture

- `web/` — citizen and municipality web application
- `server/` — backend API
- `mobile/` — mobile application placeholder; to be added later

## Technology stack

### Web

- Next.js
- TypeScript
- App Router
- Tailwind CSS
- ESLint

### Backend

- Node.js
- Express
- TypeScript
- dotenv
- cors
- MySQL
- Prisma ORM

## Run the web app

```bash
cd web
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

The web app requires:

```dotenv
NEXT_PUBLIC_API_URL=http://localhost:5051
```

## Run the backend

```bash
cd server
npm install
cp .env.example .env
npm run dev
```

The API runs at [http://localhost:5051](http://localhost:5051). Check its health at [http://localhost:5051/api/health](http://localhost:5051/api/health).

## Database setup

MySQL is required. Create a local database named `cityzen`, then configure and migrate it:

```bash
cp server/.env.example server/.env
# Update DATABASE_URL in server/.env with your local MySQL credentials.
cd server
npm install
npm run prisma:migrate -- --name init
npm run dev
```

Verify the connection at [http://localhost:5051/api/health/database](http://localhost:5051/api/health/database).

### Current database schema

The core entities are `User`, `Department`, `Address`, and `SystemHealth`. Users support the `CITIZEN`, `EMPLOYEE`, `DEPARTMENT_HEAD`, and `ADMIN` roles.

Report categories are assigned to departments by an administrator. New reports are automatically routed to the category's department and notify its active department heads. Department heads can view their department's reports and assign only employees from that department. Regular employees can access and update only reports assigned to them; administrators retain city-wide access.

## Authentication

Set `JWT_SECRET` and `JWT_EXPIRES_IN` in `server/.env`. Available endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`

Send the token to protected routes with:

```text
Authorization: Bearer <token>
```

## Issue reporting

- `GET /api/report-categories` — list active categories
- `POST /api/reports` — create a citizen report
- `GET /api/reports/my` — list the citizen's reports
- `GET /api/reports/:id` — view an authorized report
- `PATCH /api/reports/:id/cancel` — cancel an eligible citizen report
- `GET /api/reports` — employee/admin report list
- `PATCH /api/reports/:id/status` — employee/admin status update
- `PATCH /api/reports/:id/assign` — employee/admin assignment
- `POST /api/reports/:id/images` — add photos to an eligible citizen-owned report
- `GET|POST /api/reports/:id/comments` — view or add report discussion comments
- `DELETE /api/reports/:reportId/comments/:commentId` — delete an authorized comment
- `POST /api/reports/:id/upvote` — toggle citizen support for an owned report
- `GET|PUT /api/reports/:id/feedback` — view or save resolution feedback

## In-app notifications

- `GET /api/notifications` — list the authenticated user's notifications
- `GET /api/notifications/unread-count` — fetch the unread badge count
- `PATCH /api/notifications/:id/read` — mark one owned notification as read
- `PATCH /api/notifications/read-all` — mark all owned notifications as read

Notifications are created for report assignments, status changes, resolutions, and relevant comments. The authenticated web app polls only the lightweight unread-count endpoint every 30 seconds; notification history is persistent and paginated.

## Municipal information

## Urban Mobility & Infrastructure

Cityzen includes municipality-managed road conditions, parking facilities and reservations, public city facilities, and a combined OpenStreetMap city map. Parking availability is municipality-provided and is not presented as live sensor data. Reservation capacity is calculated from overlapping reservations without permanently reducing the physical availability field.

Public pages include `/city-map`, `/roads`, `/parking`, and `/facilities`. Department Heads manage only their department's infrastructure under `/municipality/infrastructure`; administrators have city-wide access and manage facility categories under `/admin/facility-categories`.

### Open infrastructure data

Parking, public facilities, and mapped roadworks can be imported from OpenStreetMap through the shared Overpass service. Configure a deliberately small bounding box in `server/.env`:

```text
OVERPASS_API_URL=https://overpass-api.de/api/interpreter
OSM_IMPORT_SOUTH=40.35
OSM_IMPORT_WEST=49.75
OSM_IMPORT_NORTH=40.45
OSM_IMPORT_EAST=49.95
```

The numbers above are examples only. Replace them with the south, west, north, and east coordinates for the city area you operate, then run:

```bash
cd server
npm run import:osm-infrastructure
```

The command queries Overpass once, uses an identifiable `Cityzen/1.0 infrastructure-import` user agent, and caches the resulting parking, selected public amenities, and conservative roadwork records in MySQL. Repeated imports upsert by source and OSM element ID; they do not duplicate records or delete older imports after an incomplete response. Municipality-created records are never overwritten by OSM.

Stored infrastructure records identify their source as Municipality, OpenStreetMap, Open Data, HERE, or Demo Data and retain their external ID, source link, and last synchronization time. OpenStreetMap content is attributed to © OpenStreetMap contributors.

OpenStreetMap parking capacity and facility details may be incomplete. OSM does not normally provide trustworthy current parking availability, so imported parking displays “Live availability unavailable” instead of zero. Mapped OSM roadworks are not guaranteed to be current traffic incidents.

An optional GeoJSON open-government feed can be configured with `TRAFFIC_OPEN_DATA_URL`. Point features are normalized for the city map and cached server-side for five minutes. Optional HERE incident data is disabled unless `HERE_API_KEY` is explicitly configured; Cityzen sends that request only from the backend and remains fully usable without it. No paid provider, credit card, routing service, Redis, or background queue is required.

`ENABLE_INFRASTRUCTURE_DEMO_DATA=true` allows a clearly labeled in-memory fallback marker only when no stored or configured provider event is available. Set it to `false` in production. Demo records are never presented as real events.

Public information endpoints and pages are available for municipal services, announcements, and events:

- `GET /api/services` and `/services`
- `GET /api/announcements` and `/announcements`
- `GET /api/events` and `/events`

Department heads manage only their own department's content under `/municipality/*`. Administrators use the same management pages with city-wide access and may publish city-wide announcements or events. Draft and expired content is excluded from public responses.

Services, announcements, and events may each have one optional cover photo. Municipality editors can select and preview the photo while creating or editing content. JPEG, PNG, and WebP files up to 5 MB are accepted and stored locally in `server/uploads/content/` during development.

### Online service requests

Citizens can request an active municipal service from `/services/{id}/request` and track progress under `/my-services`. Each request is automatically routed to the service's department. Department heads assign requests only to active employees in their department; assigned employees, department heads, and administrators can process valid status transitions under `/municipality/service-requests`.

Service-request endpoints include:

- `POST /api/service-requests`
- `GET /api/service-requests/my`
- `GET /api/service-requests/:id`
- `PATCH /api/service-requests/:id/cancel`
- `GET /api/municipality/service-requests`
- `PATCH /api/service-requests/:id/assign`
- `PATCH /api/service-requests/:id/status`

`COMPLETED`, `REJECTED`, and `CANCELLED` requests are terminal. Completing a request records `completedAt`; completed requests cannot be reopened in this initial workflow.

### Development image storage

Report photos are stored locally in `server/uploads/reports/` during development and are served from `/uploads/reports/...`. JPEG, PNG, and WebP images are supported, with a maximum size of 5 MB per image and 5 images per report.

Uploaded user and municipal-content files are ignored by Git. Local filesystem storage is for development only; a production deployment should use persistent object storage.

### Report locations

Report creation uses Leaflet with OpenStreetMap tiles for optional map and browser GPS selection. The initial development map center (`40.4093`, `49.8671`) is only a visual fallback; it is not saved unless the citizen explicitly selects a location. Browser location is requested only after the user clicks **Use My Current Location**.
