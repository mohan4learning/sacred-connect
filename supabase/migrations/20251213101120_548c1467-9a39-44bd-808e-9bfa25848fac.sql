-- Create reviews table
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid NOT NULL,
  reviewer_id uuid NOT NULL,
  reviewer_role text NOT NULL CHECK (reviewer_role IN ('client', 'purohit')),
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS policies for reviews
CREATE POLICY "Public read access" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON public.reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON public.reviews FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON public.reviews FOR DELETE USING (true);

-- Add avatar_url to purohits table
ALTER TABLE public.purohits ADD COLUMN avatar_url text;

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Create storage bucket for portfolio photos
INSERT INTO storage.buckets (id, name, public) VALUES ('portfolio', 'portfolio', true);

-- Storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Anyone can upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Anyone can update avatars" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars');
CREATE POLICY "Anyone can delete avatars" ON storage.objects FOR DELETE USING (bucket_id = 'avatars');

-- Storage policies for portfolio
CREATE POLICY "Portfolio images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'portfolio');
CREATE POLICY "Anyone can upload portfolio" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'portfolio');
CREATE POLICY "Anyone can update portfolio" ON storage.objects FOR UPDATE USING (bucket_id = 'portfolio');
CREATE POLICY "Anyone can delete portfolio" ON storage.objects FOR DELETE USING (bucket_id = 'portfolio');