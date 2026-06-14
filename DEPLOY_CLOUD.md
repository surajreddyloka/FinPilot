# Cloud Deployment Guide (Netlify & Render/Railway)

This guide walks you through deploying the **FinPilot AI** frontend to **Netlify** and the backend stack to a cloud platform like **Render** or **Railway**.

---

## ── 1. Frontend Deployment (Netlify) ───────────────────────────

Netlify is perfect for hosting Next.js applications. It automatically configures Edge functions for dynamic Next.js routes.

### Option A: Deploy via GitHub (Recommended)
1. Push your code to a GitHub repository.
2. Go to the [Netlify Dashboard](https://app.netlify.com/) and click **Add new site** -> **Import an existing project**.
3. Authorize GitHub and select the `Finpilot` repository.
4. Set the following build settings:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/.next`
5. Click **Add Environment Variables** and add:
   - `NEXT_PUBLIC_API_URL`: The URL of your deployed backend (e.g., `https://finpilot-backend.onrender.com`).
6. Click **Deploy Site**.

### Option B: Deploy via Netlify CLI
If you want to deploy directly from your local terminal:
```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Log in to your Netlify account
netlify login

# Navigate to the frontend directory
cd frontend

# Build and deploy the project
netlify deploy --build
```

---

## ── 2. Backend Deployment (Render or Railway) ──────────────────

Your backend requires a running **PostgreSQL** database and a **Redis** cache.

### Option A: Railway (Easiest for full stack)
1. Go to [Railway](https://railway.app/) and create a new project.
2. Add a **PostgreSQL** database and a **Redis** service from the Railway palette.
3. Add a service from your GitHub repository for the `backend`:
   - Set **Root Directory** to `backend`.
   - Railway will auto-detect the Dockerfile or python environment.
4. Configure the environment variables in Railway for the backend service:
   - `DATABASE_URL`: `${{Postgres.DATABASE_URL}}` (or reference the Postgres service URL with `postgresql+asyncpg://...`)
   - `REDIS_URL`: `redis://default:${{Redis.REDIS_PASSWORD}}@${{Redis.REDIS_HOST}}:${{Redis.REDIS_PORT}}/0`
   - `CELERY_BROKER_URL`: Same Redis connection URL but with path `/1`
   - `CELERY_RESULT_BACKEND`: Same Redis connection URL but with path `/2`
   - `JWT_SECRET_KEY`: A long random string (e.g. `openssl rand -hex 32`)
   - `ENCRYPTION_KEY`: A 32-byte key

### Option B: Render
1. Go to [Render](https://render.com/).
2. Create a new **PostgreSQL Database**. Note down the internal connection string.
3. Create a **Redis** instance. Note down the connection string.
4. Create a new **Web Service** for the backend:
   - Connect your GitHub repo.
   - Set the root directory to `backend`.
   - Choose **Docker** as the runtime.
   - Add the environment variables (`DATABASE_URL`, `REDIS_URL`, `CELERY_BROKER_URL`, etc.).
5. Create a **Background Worker** for the Celery worker:
   - Use the same repo and root directory (`backend`).
   - Set the start command to: `celery -A app.tasks.celery_app worker --loglevel=info`
   - Bind the same environment variables as the backend service.
