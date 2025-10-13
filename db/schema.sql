-- Supabase database schema for Nobleco
-- Run these statements in Supabase SQL Editor

-- Extensions (choose one uuid generator that exists in your project)
create extension if not exists pgcrypto; -- for gen_random_uuid()
-- create extension if not exists "uuid-ossp"; -- alternatively for uuid_generate_v4()

-- Users table
-- Columns: id, email, username, password, role
create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  username text unique not null,
  password text,
  role text not null default 'user' check (role in ('admin','user'))
);

create index if not exists users_email_idx on public.users (email);
create index if not exists users_username_idx on public.users (username);
