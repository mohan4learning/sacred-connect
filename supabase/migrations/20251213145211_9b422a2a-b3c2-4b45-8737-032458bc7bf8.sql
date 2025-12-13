-- Fix the security definer view issue by recreating with security_invoker
DROP VIEW IF EXISTS public.purohits_public;

CREATE VIEW public.purohits_public 
WITH (security_invoker = true)
AS
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

-- Re-grant access to the public view
GRANT SELECT ON public.purohits_public TO anon, authenticated;