# Nobleco

A simple React + Vite + TypeScript app with Login and Dashboard pages. Backend uses Supabase (Postgres) via Vercel serverless API routes. Ready for GitHub and Vercel deployment.

Note: This repository is for Nobleco software development.

## Features

- React 18 + TypeScript + Vite
- React Router with protected route
- Minimal, modern UI (no CSS framework)
- Vercel config included for SPA routing
- Supabase integration for users/auth (SQL)

## Local development

1. Install dependencies
2. Run the dev server

```
npm install
npm run dev
```

Open the printed local URL in your browser.

## Build

```
npm run build
npm run preview
```

## Push to GitHub

1. Create a new GitHub repository named `Nobleco` (or any name you prefer).
2. Initialize git, add files, set the remote, and push:

```
git init
git add .
git commit -m "feat: bootstrap Nobleco app"
git branch -M main
git remote add origin <YOUR_GITHUB_REMOTE_URL>
git push -u origin main
```

## Deploy to Vercel

Option A: One-click via Vercel CLI

```
npm i -g vercel
vercel
```

Option B: Vercel dashboard

- Import the GitHub repo into Vercel
- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`

The included `vercel.json` ensures client-side routing works.

## Connect to Supabase

This project uses Supabase (Postgres) from serverless API routes on Vercel.

1. Create a Supabase project and get:
	 - Project URL
	 - Service Role Key (recommended for server, store securely)
	 - (Optional) Anon key for local/dev
2. Create the `users` table (SQL shown below).
3. Set environment variables.

Locally (create `.env.local`):


On Vercel (Project Settings → Environment Variables):

**Backend (Server-side):**
- SUPABASE_URL = your project URL
- SUPABASE_SERVICE_ROLE_KEY = your service role key

**Frontend (Client-side - Required for image uploads):**
- VITE_SUPABASE_URL = your project URL
- VITE_SUPABASE_ANON_KEY = your anon/public key

**Important:** After setting environment variables in Vercel, you must redeploy your application for changes to take effect.

See [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md) for detailed deployment instructions.


### API endpoints

- `GET /api/health` → connectivity check
- `GET /api/users` → list users (first 50)
- `POST /api/users` → create a user: `{ "email": "a@b.com", "username": "alice", "password": "...", "role": "user" }`
- `POST /api/auth/login` → login with `{ "username": "admin", "password": "..." }`
- `POST /api/seed-admin` → one-off create admin user: `{ "account": "admin", "email": "admin@example.com", "password": "..." }`

Client-side routes are still handled by `/index.html`, while `/api/*` is excluded from SPA rewrites.
