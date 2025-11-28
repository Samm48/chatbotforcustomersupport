# Deployment Guide

## Option 1: Render.com (Recommended)

### Backend Deployment:
1. Connect GitHub repo to Render
2. Create new Web Service
3. Point to `/backend` folder
4. Add environment variables:
   - `NODE_ENV=production`
   - `JWT_SECRET=your-secret-key`
   - `DATABASE_URL` (from PostgreSQL database)

### Frontend Deployment:
1. Create static site on Render
2. Point to `/frontend` folder
3. Build command: `npm run build`
4. Publish directory: `dist`

### Database:
1. Create PostgreSQL database on Render
2. Use `ecommerce_db` as database name

## Option 2: Docker Deployment

1. Build images: `docker-compose -f docker-compose.prod.yml build`
2. Run: `docker-compose -f docker-compose.prod.yml up`

## Environment Variables

### Backend:
- `NODE_ENV=production`
- `DATABASE_URL=postgresql://...`
- `JWT_SECRET=your-secret-key`
- `FRONTEND_URL=https://your-frontend-url`

### Frontend:
- `VITE_BACKEND_URL=https://your-backend-url`