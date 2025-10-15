-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.users (
  id int8 NOT NULL,
  email text UNIQUE,
  name text UNIQUE,
  password text,
  role text NOT NULL DEFAULT 'user'::text,
  points integer DEFAULT 0,
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text])),
  created_at timestamp with time zone DEFAULT now(),
  level text DEFAULT 'guest'::text CHECK (level = ANY (ARRAY['guest'::text, 'member'::text, 'unit manager'::text, 'brand manager'::text])),
  refer_code text DEFAULT upper(SUBSTRING(md5((random())::text) FROM 1 FOR 6)) UNIQUE,
  commission integer NOT NULL DEFAULT 0,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);