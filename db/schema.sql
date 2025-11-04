-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.categories (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  parent_id bigint,
  level integer DEFAULT 0,
  color text DEFAULT '#3B82F6'::text,
  status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text])),
  is_featured boolean DEFAULT false,
  product_count integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id)
);
CREATE TABLE public.clients (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL,
  phone text,
  email text,
  birthday date,
  location text,
  description text,
  order_count integer DEFAULT 0 CHECK (order_count >= 0),
  created_by bigint,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT clients_pkey PRIMARY KEY (id),
  CONSTRAINT clients_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);
CREATE TABLE public.product_categories (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  product_id bigint NOT NULL,
  category_id bigint NOT NULL,
  is_primary boolean DEFAULT false,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT product_categories_pkey PRIMARY KEY (id),
  CONSTRAINT product_categories_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT product_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
CREATE TABLE public.products (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL,
  slug text UNIQUE,
  sku text UNIQUE,
  short_description text NOT NULL,
  long_description text,
  price numeric(20, 0) NOT NULL CHECK (price >= 0::numeric),
  cost_price numeric(20, 0) CHECK (cost_price >= 0::numeric),
  stock integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  status text NOT NULL DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'active'::text, 'inactive'::text, 'archived'::text])),
  is_featured boolean DEFAULT false,
  created_by bigint,
  updated_by bigint,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id),
  CONSTRAINT products_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.users(id)
);
CREATE TABLE public.users (
  id bigint NOT NULL DEFAULT nextval('users_id_seq'::regclass),
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
  phone text,
  address text,
  referred_by text,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.commission_rates (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_level text NOT NULL UNIQUE CHECK (user_level = ANY (ARRAY['guest'::text, 'member'::text, 'unit manager'::text, 'brand manager'::text])),
  self_commission numeric(5, 2) NOT NULL DEFAULT 0 CHECK (self_commission >= 0 AND self_commission <= 100),
  level_1_down numeric(5, 2) NOT NULL DEFAULT 0 CHECK (level_1_down >= 0 AND level_1_down <= 100),
  level_2_down numeric(5, 2) NOT NULL DEFAULT 0 CHECK (level_2_down >= 0 AND level_2_down <= 100),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT commission_rates_pkey PRIMARY KEY (id)
);