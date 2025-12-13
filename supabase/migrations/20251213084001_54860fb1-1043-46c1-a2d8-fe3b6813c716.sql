-- Add pooja_request_id to consultations to link responses to specific requests
ALTER TABLE public.consultations 
ADD COLUMN pooja_request_id uuid REFERENCES public.pooja_requests(id);

-- Create index for faster lookups
CREATE INDEX idx_consultations_pooja_request_id ON public.consultations(pooja_request_id);