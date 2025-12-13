-- Add serviceable_cities array to purohits table
ALTER TABLE public.purohits 
ADD COLUMN serviceable_cities text[] DEFAULT '{}'::text[];

-- Copy the current city as the first serviceable city for existing purohits
UPDATE public.purohits 
SET serviceable_cities = ARRAY[city]
WHERE serviceable_cities = '{}' OR serviceable_cities IS NULL;