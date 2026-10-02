# Cityzen

Cityzen connects citizens with municipal services. Citizens report problems, request services, and follow progress. Employees handle assigned work, department heads manage their departments, and admins manage the city.

## Applications

- `web/`: Next.js, TypeScript, Tailwind CSS, Leaflet.
- `server/`: Express, TypeScript, Prisma, MySQL.
- `mobile/`: Expo, React Native, Expo Router. Citizen-focused; municipality tools remain on the web.

## Main modules

- Accounts with Citizen, Employee, Department Head, and Admin roles.
- Issue reports with department routing, assignments, photos, maps, comments, upvotes, feedback, and notifications.
- Municipal services and requests, including configurable forms, documents, and appointments on the web.
- Announcements, events, emergency alerts, and public community reports.
- Parking, facilities, road conditions, waste/recycling, weather, and environmental information.
- Administration, analytics, and optional smart assistance.

Mobile supports a subset of the web workflows. See [mobile setup](mobile/README.md) for device connection instructions.

## Local setup

Use Node.js 22.13 or newer and MySQL. Run commands below from the repository root unless a directory is shown. Keep each development server in its own terminal.

### Backend and database

Create a MySQL database called `cityzen`, then:

```bash
cp server/.env.example server/.env
cd server
npm install
```

Configure `server/.env`:

```env
PORT=5051
DATABASE_URL="mysql://USERNAME:PASSWORD@localhost:3306/cityzen"
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=1d
```

For a local MySQL account without a password, omit the password portion of the URL. Never use that configuration for a public deployment.

```bash
npx prisma generate
npx prisma migrate dev
npm run dev
```

Keep migration history. Do not reset a database containing data you need.

Health checks:
- `http://localhost:5051/api/health`
- `http://localhost:5051/api/health/database`

### Web

```bash
cd web
npm install
cp .env.example .env.local
npm run dev
```

Set `NEXT_PUBLIC_API_URL=http://localhost:5051`. Open `http://localhost:3000`.

### Mobile

```bash
cd mobile
npm install
cp .env.example .env
npm start
```

Set `EXPO_PUBLIC_API_URL` to the backend address reachable from the device:
- Physical phone: your computer's current LAN IP, with port `5051`; use the same Wi-Fi.
- iOS Simulator: `http://localhost:5051`.
- Android emulator: `http://10.0.2.2:5051`.

Use Expo Go with a compatible SDK, or `npm run ios` / `npm run android` with a configured simulator/emulator. After changing the API address, restart with `npx expo start --clear`. Browser export of the native app is not configured; use `web/` for browsers.

Do not commit local environment files. The example files contain no private keys.

## Development data and uploads

After migrations, these optional commands add development data:

```bash
cd server
npm run seed:municipal-content
npm run seed:demo
```

Create departments first. Seeds reuse existing records; they do not reset the database. They can update matching demo records, so use them only on a development database.

The demo seed creates `demo.citizen@cityzen.test` with `Password123` if that account does not exist. It does not reset an existing account's password. Never use demo credentials in production.

Uploads live in `server/uploads/` and are ignored by Git:
- Report photos: JPEG/PNG/WebP, up to five files, 5 MB each.
- Service documents: PDF/JPEG/PNG/WebP, served through authorized API access, not public static URLs.

Back up uploads and use persistent/object storage for production.

## External data

Set a small geographic bounding box in `server/.env`:

```env
OVERPASS_API_URL=https://overpass-api.de/api/interpreter
OSM_IMPORT_SOUTH=
OSM_IMPORT_WEST=
OSM_IMPORT_NORTH=
OSM_IMPORT_EAST=
```

Then run `npm run import:osm-infrastructure` from `server/`. This imports parking, facilities, and mapped roadworks into MySQL. Repeated imports update matching source IDs without replacing municipality records.

OpenStreetMap data may be incomplete. Parking availability can be unknown, and mapped roadworks are not live traffic. Keep the © OpenStreetMap contributors attribution. Optional open-data/HERE traffic sources and AI provider settings are documented in `server/.env.example`; paid providers are not required. Keep demo infrastructure disabled in production.

## Checks

```bash
# server/
npx prisma format
npx prisma validate
npx prisma generate
npm run build

# web/
npm run lint
npm run build

# mobile/
npm run typecheck
npm run lint
npx expo-doctor
```

Backend authorization is authoritative. Department and assignment restrictions apply regardless of what the interface displays.
