# LMS React Starter

A production-ready starter for an LMS frontend built with **React + TypeScript + Vite + Tailwind**. It includes:
- Role-based routing for **Admin**, **Instructor**, and **Student**
- Auth context with JWT bearer support (adjust as needed for cookies)
- Login & Forgot Password flows
- Placeholders for dashboards
- Simple, clean UI components

## Quickstart

```bash
npm install
cp .env.sample .env
# set VITE_API_BASE_URL in .env
npm run dev
```

## Backend integration

Update your `.env`:

```env
VITE_API_BASE_URL=http://localhost:4000
```

Endpoints used by default (change in `src/auth/AuthContext.tsx` and `src/pages/ForgotPassword.tsx`):
- `POST /auth/login` -> `{ token, user }`
- `GET /auth/me` -> `{ user }`
- `POST /auth/forgot-password` -> `{ message }`

The `user.role` must be one of: `ADMIN | INSTRUCTOR | STUDENT`.

If you use **HttpOnly cookies** instead of bearer tokens, set `withCredentials: true` in `lib/api.ts` (already enabled) and ignore `Authorization` headers.