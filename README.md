# Nobleco

A simple React + Vite + TypeScript app with Login and Dashboard pages. Ready for GitHub and Vercel deployment.

Note: This repository is for Nobleco software development.

## Features

- React 18 + TypeScript + Vite
- React Router with protected route
- Minimal, modern UI (no CSS framework)
- Vercel config included for SPA routing

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

## Connect to MongoDB

This project includes serverless API routes for MongoDB on Vercel.

1. Create a MongoDB Atlas free cluster and a database user.
2. Copy the connection string (SRV) and set the following env vars:

Locally (create `.env.local`):

```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
DB_NAME=nobleco
```

On Vercel (Project Settings → Environment Variables):

- MONGODB_URI = your connection string
- DB_NAME = nobleco

### API endpoints

- `GET /api/health` → ping the database
- `GET /api/users` → list users (first 50)
- `POST /api/users` → create a user: `{ "username": "alice" }`

Note: Client-side routes are still handled by `/index.html`, while `/api/*` is excluded from SPA rewrites.
