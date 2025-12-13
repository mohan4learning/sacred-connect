-- Create table for purohit availability blocks (manual calendar blocking)
CREATE TABLE public.purohit_availability_blocks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purohit_id uuid NOT NULL REFERENCES public.purohits(id) ON DELETE CASCADE,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.purohit_availability_blocks ENABLE ROW LEVEL SECURITY;

-- RLS policies - purohits can manage their own blocks
CREATE POLICY "Public read access" ON public.purohit_availability_blocks
FOR SELECT USING (true);

CREATE POLICY "Public insert access" ON public.purohit_availability_blocks
FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update access" ON public.purohit_availability_blocks
FOR UPDATE USING (true);

CREATE POLICY "Public delete access" ON public.purohit_availability_blocks
FOR DELETE USING (true);

-- Add index for efficient queries
CREATE INDEX idx_availability_blocks_purohit ON public.purohit_availability_blocks(purohit_id);
CREATE INDEX idx_availability_blocks_time ON public.purohit_availability_blocks(start_time, end_time);