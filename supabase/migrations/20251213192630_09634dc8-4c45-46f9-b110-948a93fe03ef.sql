-- Add new service mode columns to purohits table
ALTER TABLE public.purohits 
ADD COLUMN IF NOT EXISTS temple_pooja_available boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS video_call_available boolean DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN public.purohits.in_person_available IS 'Whether purohit offers in-person home visits';
COMMENT ON COLUMN public.purohits.remote_pooja_available IS 'Whether purohit offers remote/phone guidance';
COMMENT ON COLUMN public.purohits.temple_pooja_available IS 'Whether purohit offers poojas at temples';
COMMENT ON COLUMN public.purohits.video_call_available IS 'Whether purohit offers video call poojas';