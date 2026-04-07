# ShopEase (SE2020) – Full Stack Mobile App

This project matches the SE2020 stack and mandatory requirements:

- **Mobile**: React Native (Expo) + React Navigation + Hooks + Form validation
- **Backend**: Node.js + Express (REST APIs, middleware, status codes, error handling)
- **Database**: MongoDB (Atlas-ready via `MONGODB_URI`)
- **Auth**: Registration/Login, bcrypt hashing, JWT, protected routes + role middleware
- **Image upload**: Multer with JPG/PNG \< 5MB validation, Cloudinary (recommended) or local `/uploads` fallback
- **No hardcoded data**: Mobile reads everything from the API

## Folder structure

- `backend/` Express + MongoDB API
- `mobile/` Expo React Native app
- `docs/` Documentation drafts (export to PDF/PNG for submission zip)

## Run locally

### Backend

1. Copy `backend/.env.example` → `backend/.env`
2. Fill `MONGODB_URI` and `JWT_SECRET`
3. Start:

```bash
cd backend
npm run dev
```

API health: `GET /health`

### Mobile (Expo)

Set your API base URL (must be hosted for final demo):

- Create `mobile/.env`:

```bash
EXPO_PUBLIC_API_BASE_URL=https://your-hosted-api
```

Run:

```bash
cd mobile
npm run android
```

## Core modules implemented (ShopEase)

- **Authentication**: `/api/auth/register`, `/api/auth/login`
- **Product** (Admin CRUD + multiple images): `/api/products`
- **Cart** (CRUD + optional proof image): `/api/cart/*`
- **Order** (create from cart, status flow): `/api/orders/*`
- **Payment** (optional receipt image, verify): `/api/payments/*`
- **Delivery** (status + proof image): `/api/deliveries/*`
- **Review** (post-delivery only + optional images): `/api/reviews/*`

## Deployment notes (required by assignment)

- Deploy **backend** to Render/Railway/etc and connect to MongoDB Atlas.
- Set environment variables on the host (see `backend/.env.example`).
- Set `mobile` `EXPO_PUBLIC_API_BASE_URL` to the hosted backend URL.

