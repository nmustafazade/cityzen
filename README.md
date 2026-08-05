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
