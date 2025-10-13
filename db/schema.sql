-- Supabase database schema for Nobleco
-- Run these statements in Supabase SQL Editor

-- Extensions (choose one uuid generator that exists in your project)
create extension if not exists pgcrypto; -- for gen_random_uuid()
-- create extension if not exists "uuid-ossp"; -- alternatively for uuid_generate_v4()

-- Users table
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  password_hash text,
  role text not null default 'user',
  created_at timestamptz not null default now()
);

create index if not exists users_username_idx on public.users (username);
