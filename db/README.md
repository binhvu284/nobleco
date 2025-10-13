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
- `username text` unique not null
- `password_hash text` nullable (only for password-based login)
- `role text` default `user`
- `created_at timestamptz` default `now()`

Indexes:
- `users_username_idx (username)`

## API ↔ DB mapping
- `POST /api/auth/login` → select users by `username`, compare `password_hash` using bcrypt
- `GET /api/users` → select `id, username, role, created_at`
- `POST /api/users` → insert `{ username }` → returns `id, username, role, created_at`
- `POST /api/seed-admin` → upsert admin with `password_hash`, `role = 'admin'`

## Conventions
- Server code never exposes `password_hash`
- Timestamps in UTC (`timestamptz`)
- Use service role key on the server only; never ship it to the client

## Future evolution
- Add `profiles` table for user metadata
- Add RLS policies when using anon key from client (currently API uses server keys)
- Replace demo token with JWT-based auth (Supabase auth or custom)
