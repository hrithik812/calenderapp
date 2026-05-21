# Koalendar-style Booking App

Full-stack calendar booking application:

- Frontend: Next.js (App Router)
- Backend: Express
- Database: PostgreSQL
- ORM: Sequelize

## 1) Backend setup

1. Go to `backend`.
2. Copy `.env.example` to `.env` and update DB credentials.
3. Create database in PostgreSQL (`koalendar_db` by default).
4. Install dependencies and seed data:

```bash
npm install
npm run seed
```

5. Start backend:

```bash
npm run dev
```

Backend runs on `http://localhost:4000`.

## 2) Frontend setup

1. Go to `frontend`.
2. Copy `.env.example` to `.env.local`.
3. Install dependencies and run:

```bash
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`.

## Demo credentials

- Admin: `admin@koalendar.local`
- Password: `admin123`

## Implemented Features

- User registration and login (JWT)
- Service listing and admin-only service creation endpoint
- Available slot generation by date + service duration
- Booking creation with conflict protection
- Booking list for logged-in user
- Booking cancellation
