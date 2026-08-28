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

The API runs at [http://localhost:5000](http://localhost:5000). Check its health at [http://localhost:5000/api/health](http://localhost:5000/api/health).

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

Verify the connection at [http://localhost:5000/api/health/database](http://localhost:5000/api/health/database).

### Current database schema

The core entities are `User`, `Department`, `Address`, and `SystemHealth`. Users support the `CITIZEN`, `EMPLOYEE`, and `ADMIN` roles.

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
