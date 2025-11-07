-- Create user_personal_ids table for storing personal ID images
CREATE TABLE IF NOT EXISTS public.user_personal_ids (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id bigint NOT NULL,
  front_image_path text NOT NULL,
  front_image_url text NOT NULL,
  back_image_path text,
  back_image_url text,
  file_size integer,
  mime_type text,
  verified boolean DEFAULT false,
  verified_at timestamp with time zone,
  verified_by bigint,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_personal_ids_pkey PRIMARY KEY (id),
  CONSTRAINT user_personal_ids_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT user_personal_ids_verified_by_fkey FOREIGN KEY (verified_by) REFERENCES public.users(id) ON DELETE SET NULL,
  CONSTRAINT user_personal_ids_user_id_unique UNIQUE (user_id)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_personal_ids_user_id ON public.user_personal_ids(user_id);
CREATE INDEX IF NOT EXISTS idx_user_personal_ids_verified ON public.user_personal_ids(verified);

-- Add comment to table
COMMENT ON TABLE public.user_personal_ids IS 'Stores user personal ID card images (front and back)';

