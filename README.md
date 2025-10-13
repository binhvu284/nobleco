# Fairiche

A simple React + Vite + TypeScript app with Login and Dashboard pages. Ready for GitHub and Vercel deployment.

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

1. Create a new GitHub repository named `Fairiche` (or any name you prefer).
2. Initialize git, add files, set the remote, and push:

```
git init
git add .
git commit -m "feat: bootstrap Fairiche app"
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
