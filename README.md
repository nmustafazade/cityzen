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
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

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
