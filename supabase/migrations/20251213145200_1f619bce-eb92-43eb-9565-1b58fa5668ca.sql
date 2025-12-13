-- Create purohit_private table for sensitive contact information
CREATE TABLE public.purohit_private (
  purohit_id uuid PRIMARY KEY REFERENCES public.purohits(id) ON DELETE CASCADE,
  email text,
  phone text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on purohit_private
ALTER TABLE public.purohit_private ENABLE ROW LEVEL SECURITY;

-- Migrate existing email/phone data from purohits to purohit_private
INSERT INTO public.purohit_private (purohit_id, email, phone)
SELECT id, email, phone FROM public.purohits
WHERE email IS NOT NULL OR phone IS NOT NULL;

-- Create a function to check if a client has an active relationship with a purohit
CREATE OR REPLACE FUNCTION public.client_has_active_relationship(p_client_id uuid, p_purohit_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.bookings
    WHERE client_id = p_client_id 
      AND purohit_id = p_purohit_id 
      AND status IN ('pending', 'confirmed', 'completed')
  ) OR EXISTS (
    SELECT 1 FROM public.consultations
    WHERE client_id = p_client_id 
      AND purohit_id = p_purohit_id 
      AND status IN ('requested', 'accepted', 'completed')
  )
$$;

-- RLS policies for purohit_private

-- Purohits can view/manage their own private data
CREATE POLICY "Purohits can view their own private data"
ON public.purohit_private
FOR SELECT
USING (purohit_id = get_my_purohit_id() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Purohits can update their own private data"
ON public.purohit_private
FOR UPDATE
USING (purohit_id = get_my_purohit_id() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Purohits can insert their own private data"
ON public.purohit_private
FOR INSERT
WITH CHECK (purohit_id = get_my_purohit_id() OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Purohits can delete their own private data"
ON public.purohit_private
FOR DELETE
USING (purohit_id = get_my_purohit_id() OR has_role(auth.uid(), 'admin'::app_role));

-- Clients can view purohit private data only if they have an active relationship
CREATE POLICY "Clients can view related purohit private data"
ON public.purohit_private
FOR SELECT
USING (
  client_has_active_relationship(get_my_client_id(), purohit_id)
);

-- Create purohits_public view (safe for browsing - no email/phone)
CREATE OR REPLACE VIEW public.purohits_public AS
SELECT 
  id,
  full_name,
  city,
  area,
  bio,
  languages,
  experience_years,
  remote_pooja_available,
  in_person_available,
  service_radius_km,
  serviceable_cities,
  avatar_url,
  is_verified,
  created_at,
  user_id
FROM public.purohits;

-- Grant access to the public view
GRANT SELECT ON public.purohits_public TO anon, authenticated;

-- Now drop email/phone from purohits table (data already migrated)
ALTER TABLE public.purohits DROP COLUMN IF EXISTS email;
ALTER TABLE public.purohits DROP COLUMN IF EXISTS phone;