# Cityzen

Cityzen is a smart-city platform that connects citizens with municipality services.

Citizens can report city problems, request services, follow their requests, and find useful city information. Municipality workers can receive requests, assign work, update progress, and communicate with citizens.

## Project structure

- `web/` — Next.js web application
- `server/` — Express API with Prisma and MySQL
- `mobile/` — React Native application built with Expo

## Main features

### Accounts and roles

Cityzen supports four roles:

- **Citizen** — reports problems and requests services
- **Employee** — works on assigned requests
- **Department Head** — manages work for one department
- **Admin** — manages the whole platform

The platform uses JWT authentication. Passwords are hashed and are never returned by the API.

### City issue reports

Citizens can:

- Create a report
- Choose a category
- Add an address and map location
- Use their current location
- Upload photos
- View progress and status history
- Add comments and replies
- Support public reports with an upvote
- Cancel a report when allowed
- Rate the result after the problem is resolved

Reports are automatically sent to the department linked to their category. A department head can assign the report only to employees in that department.

### Municipal services

Citizens can browse services and send online service requests. A request may include:

- A description
- Address and map location
- Contact phone
- Custom form fields
- Appointment selection
- Supporting documents

The request is automatically sent to the department responsible for the selected service. Citizens can follow its status and read the municipality response.

### Notifications

Users receive notifications when important actions happen, such as:

- A report or service request is assigned
- A status changes
- A new comment is added
- A report is resolved
- A service request is completed

Notifications can be marked as read individually or all at once.

### City information

Cityzen also includes:

- Announcements
- Events
- Emergency alerts
- Road conditions
- Parking information and reservations
- Public facilities
- Waste collection schedules
- Recycling locations
- Weather and air-quality information
- Public community reports
- A city map with selectable layers

### Open map data

Cityzen uses Leaflet and OpenStreetMap. The backend can import parking locations, public facilities, and mapped roadworks through the Overpass API.

Imported data is saved in MySQL and updated without creating duplicates. OpenStreetMap parking data normally does not include live free-space counts, so Cityzen shows availability as unknown instead of displaying a false zero.

### Administration

Admins can manage:

- Users and roles
- Departments
- Report categories
- Municipal services
- Announcements and events
- Facility categories
- City infrastructure
- Analytics

Department heads can manage only their own department. Employees can work only with requests assigned to them.

## Technology

### Web

- Next.js
- TypeScript
- App Router
- Tailwind CSS
- Leaflet and OpenStreetMap

### Server

- Node.js
- Express
- TypeScript
- Prisma ORM
- MySQL
- JWT and bcrypt

### Mobile

- React Native
- Expo
- Expo Router
- TypeScript
- Expo SecureStore
- Expo Location
- React Native Maps

## Setup

### 1. Database

Install MySQL and create a database called `cityzen`.

Copy the server environment file:

```bash
cp server/.env.example server/.env
```

Set at least these values in `server/.env`:

```env
PORT=5051
DATABASE_URL="mysql://USERNAME:PASSWORD@localhost:3306/cityzen"
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=1d
```

If your local MySQL user has no password, the URL may look like this:

```env
DATABASE_URL="mysql://root@localhost:3306/cityzen"
```

Run the database migrations:

```bash
cd server
npm install
npx prisma generate
npx prisma migrate dev
```

Do not run `prisma migrate reset` on a database that contains data you want to keep.

### 2. Start the backend

```bash
cd server
npm run dev
```

The API runs at:

```text
http://localhost:5051
```

Health checks:

- `GET http://localhost:5051/api/health`
- `GET http://localhost:5051/api/health/database`

### 3. Start the web application

```bash
cd web
npm install
cp .env.example .env.local
npm run dev
```

Set this value in `web/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5051
```

Open:

```text
http://localhost:3000
```

### 4. Start the mobile application

```bash
cd mobile
npm install
cp .env.example .env
npm start
```

Set the API address in `mobile/.env`:

```env
EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:5051
```

Use your computer's local network IP when testing on a physical phone. The phone and computer should be connected to the same Wi-Fi network.

After Expo starts, open Expo Go on your phone and scan the QR code.

Other useful commands:

```bash
npm run ios
npm run android
npm run typecheck
npm run lint
```

## File uploads

During development, uploaded files are stored locally inside `server/uploads/`.

- Report photos: JPEG, PNG, or WebP
- Maximum report photos: 5
- Maximum report photo size: 5 MB each
- Service documents: PDF, JPEG, PNG, or WebP

Uploaded files are ignored by Git. A production version should use permanent object storage instead of the local filesystem.

## Sample data

After applying migrations, development data can be added with:

```bash
cd server
npm run seed:municipal-content
npm run seed:demo
```

The seed commands are safe to run more than once and do not delete existing records.

Demo citizen account:

```text
Email: demo.citizen@cityzen.test
Password: Password123
```

Change or remove demo accounts before production use.

## OpenStreetMap import

Add a small city bounding box to `server/.env`:

```env
OVERPASS_API_URL=https://overpass-api.de/api/interpreter
OSM_IMPORT_SOUTH=
OSM_IMPORT_WEST=
OSM_IMPORT_NORTH=
OSM_IMPORT_EAST=
```

Then run:

```bash
cd server
npm run import:osm-infrastructure
```

OpenStreetMap data may be incomplete and roadwork information may not be live. Cityzen keeps municipality data separate and does not overwrite it during imports.

## Quality checks

Backend:

```bash
cd server
npm run build
```

Web:

```bash
cd web
npm run lint
npm run build
```

Mobile:

```bash
cd mobile
npm run typecheck
npm run lint
npx expo-doctor
```

## Important notes

- The backend is the final authority for permissions.
- Citizens cannot choose their role, department, employee, priority, or request status.
- Department heads can work only inside their department.
- Employees can update only work assigned to them.
- External map and weather services may sometimes be unavailable, but saved Cityzen data will continue to work.
- No paid map service is required.
