# Database integration and flexibility

This project uses a small repository layer under `api/_repo` to decouple API handlers from the underlying database specifics. Today it uses Supabase, but the API handlers call repository functions that can be re-implemented to support other backends (or multiple Supabase projects) without changing the route handlers.

## Where to look

- `api/_db.js` – creates a Supabase client using server-side credentials.
- `api/_repo/users.js` – repository for user-related operations (`listUsers`, `findUserByUsername`, `createUser`, `updateUserPasswordHashed`).
- `api/users.js` – API route using the repository instead of talking to Supabase directly.
- `api/auth/login.js` – login flow using repository for user lookup and password upgrade.

## Environment variables

Provide either server-side Supabase vars or their `VITE_` dev equivalents:

- `SUPABASE_URL` (or `VITE_SUPABASE_URL` in dev)
- `SUPABASE_SERVICE_ROLE_KEY` (preferred on server) or `SUPABASE_ANON_KEY` (or `VITE_SUPABASE_ANON_KEY` in dev)

On Vercel, connect Storage > Supabase and expose these to your deployment. Locally, create a `.env` with:

```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
# or fallback dev keys
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Switching projects / databases

To point to a different Supabase project, just change the environment variables above. If your table schema has fewer columns (e.g., missing `role`), the repository includes graceful fallbacks to keep the app working. If you later add new sources (e.g., a REST service), replace the repository functions with that implementation while keeping the same function signatures.
# Database: Supabase (Postgres)

This folder tracks the database structure and key details for Nobleco.

## Overview
- Platform: Supabase (managed Postgres)
- Connection (server): `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`
- Connection (local/dev optional): `SUPABASE_ANON_KEY`
- Primary table: `public.users`

## Environment variables
Set these in `.env.local` (local) and Vercel Project Settings → Environment Variables (prod):

- `SUPABASE_URL` = https://<your-project-ref>.supabase.co
- `SUPABASE_SERVICE_ROLE_KEY` = <service-role-key>
- Optional: `SUPABASE_ANON_KEY` = <anon-key>

## Schema
- Canonical SQL: `db/schema.sql`
- Machine-readable: `db/schema.json`

### Tables

#### public.users
- `id uuid` PK default `gen_random_uuid()`
- `email text` unique not null
- `username text` unique not null
- `password text` (bcrypt hash)
- `role text` default `user` (allowed: `admin`, `user`)

Indexes:
- `users_email_idx (email)`
- `users_username_idx (username)`

## API ↔ DB mapping
- `POST /api/auth/login` → select users by `username`, compare `password` (hashed) using bcrypt
- `GET /api/users` → select `id, email, username, role`
- `POST /api/users` → insert `{ email, username, password?, role? }` → returns `id, email, username, role`
- `POST /api/seed-admin` → create admin with `{ account, email, password }`

## Conventions
- Server code never exposes `password`
- Use service role key on the server only; never ship it to the client

## Future evolution
- Add `profiles` table for user metadata
- Add RLS policies when using anon key from client (currently API uses server keys)
- Replace demo token with JWT-based auth (Supabase auth or custom)
