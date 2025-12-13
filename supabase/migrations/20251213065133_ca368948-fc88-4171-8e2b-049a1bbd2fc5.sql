-- Create enums
CREATE TYPE portfolio_item_type AS ENUM ('photo', 'certification', 'testimonial');
CREATE TYPE service_mode AS ENUM ('remote', 'in_person', 'both');
CREATE TYPE pooja_request_status AS ENUM ('open', 'matched', 'closed');
CREATE TYPE consultation_status AS ENUM ('requested', 'accepted', 'completed', 'cancelled');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
CREATE TYPE sender_role AS ENUM ('client', 'purohit');

-- Create clients table
CREATE TABLE public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  city TEXT NOT NULL,
  area TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purohits table
CREATE TABLE public.purohits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  city TEXT NOT NULL,
  area TEXT,
  service_radius_km INTEGER,
  languages TEXT[] DEFAULT '{}',
  experience_years INTEGER DEFAULT 0,
  bio TEXT,
  remote_pooja_available BOOLEAN DEFAULT false,
  in_person_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create purohit_portfolio_items table
CREATE TABLE public.purohit_portfolio_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purohit_id UUID NOT NULL REFERENCES public.purohits(id) ON DELETE CASCADE,
  type portfolio_item_type NOT NULL,
  title TEXT NOT NULL,
  content_url TEXT,
  content_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pooja_services table
CREATE TABLE public.pooja_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  default_mode service_mode DEFAULT 'both'
);

-- Create purohit_services table (junction table)
CREATE TABLE public.purohit_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  purohit_id UUID NOT NULL REFERENCES public.purohits(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.pooja_services(id) ON DELETE CASCADE,
  price_min INTEGER,
  price_max INTEGER,
  UNIQUE(purohit_id, service_id)
);

-- Create pooja_requests table
CREATE TABLE public.pooja_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.pooja_services(id),
  custom_service_text TEXT,
  mode service_mode NOT NULL DEFAULT 'in_person',
  requested_date DATE,
  city TEXT NOT NULL,
  area TEXT,
  address TEXT,
  notes TEXT,
  budget_min INTEGER,
  budget_max INTEGER,
  status pooja_request_status DEFAULT 'open',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create consultations table
CREATE TABLE public.consultations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  purohit_id UUID NOT NULL REFERENCES public.purohits(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.pooja_services(id),
  mode service_mode DEFAULT 'in_person',
  status consultation_status DEFAULT 'requested',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create consultation_messages table
CREATE TABLE public.consultation_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  consultation_id UUID NOT NULL REFERENCES public.consultations(id) ON DELETE CASCADE,
  sender_role sender_role NOT NULL,
  sender_id UUID NOT NULL,
  message_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  purohit_id UUID NOT NULL REFERENCES public.purohits(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.pooja_services(id),
  mode service_mode NOT NULL DEFAULT 'in_person',
  scheduled_at TIMESTAMP WITH TIME ZONE,
  estimated_duration_minutes INTEGER DEFAULT 90,
  city TEXT,
  area TEXT,
  address TEXT,
  remote_meeting_link TEXT,
  price_agreed INTEGER,
  status booking_status DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security (public access for MVP without auth)
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purohits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purohit_portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pooja_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purohit_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pooja_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Create public access policies for MVP (no auth required)
CREATE POLICY "Public read access" ON public.clients FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON public.clients FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON public.clients FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON public.clients FOR DELETE USING (true);

CREATE POLICY "Public read access" ON public.purohits FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON public.purohits FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON public.purohits FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON public.purohits FOR DELETE USING (true);

CREATE POLICY "Public read access" ON public.purohit_portfolio_items FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON public.purohit_portfolio_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON public.purohit_portfolio_items FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON public.purohit_portfolio_items FOR DELETE USING (true);

CREATE POLICY "Public read access" ON public.pooja_services FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON public.pooja_services FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON public.pooja_services FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON public.pooja_services FOR DELETE USING (true);

CREATE POLICY "Public read access" ON public.purohit_services FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON public.purohit_services FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON public.purohit_services FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON public.purohit_services FOR DELETE USING (true);

CREATE POLICY "Public read access" ON public.pooja_requests FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON public.pooja_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON public.pooja_requests FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON public.pooja_requests FOR DELETE USING (true);

CREATE POLICY "Public read access" ON public.consultations FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON public.consultations FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON public.consultations FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON public.consultations FOR DELETE USING (true);

CREATE POLICY "Public read access" ON public.consultation_messages FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON public.consultation_messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON public.consultation_messages FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON public.consultation_messages FOR DELETE USING (true);

CREATE POLICY "Public read access" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON public.bookings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON public.bookings FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON public.bookings FOR DELETE USING (true);

-- Enable realtime for consultation messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.consultation_messages;

-- Seed data: Pooja Services
INSERT INTO public.pooja_services (name, description, default_mode) VALUES
  ('Satyanarayan Pooja', 'A popular worship of Lord Vishnu for prosperity and blessings', 'both'),
  ('Griha Pravesh', 'House warming ceremony to purify and bless a new home', 'in_person'),
  ('Ganesh Pooja', 'Worship of Lord Ganesha for removing obstacles', 'both'),
  ('Lakshmi Pooja', 'Worship of Goddess Lakshmi for wealth and prosperity', 'both'),
  ('Navgraha Shanti', 'Planetary peace rituals to balance cosmic energies', 'both'),
  ('Vivah Sanskar', 'Traditional Hindu wedding ceremony', 'in_person'),
  ('Rudrabhishek', 'Sacred bathing ritual of Lord Shiva lingam', 'both'),
  ('Kaal Sarp Dosh Nivaran', 'Remedy pooja for Kaal Sarp dosha in horoscope', 'remote'),
  ('Sunderkand Path', 'Recitation of Sunderkand from Ramcharitmanas', 'both'),
  ('Shraddh Karma', 'Ancestral rites and offerings for departed souls', 'in_person');

-- Seed data: Purohits
INSERT INTO public.purohits (full_name, phone, email, city, area, languages, experience_years, bio, remote_pooja_available, in_person_available) VALUES
  ('Pandit Ramesh Sharma', '9876543210', 'ramesh@example.com', 'Mumbai', 'Andheri West', ARRAY['Hindi', 'Sanskrit', 'Marathi'], 15, 'Experienced purohit specializing in Vedic rituals and marriage ceremonies. Trained in Varanasi.', true, true),
  ('Acharya Suresh Mishra', '9876543211', 'suresh@example.com', 'Mumbai', 'Borivali', ARRAY['Hindi', 'Sanskrit'], 20, 'Expert in Navgraha Shanti and Kaal Sarp remedies. Over 5000 poojas performed.', true, true),
  ('Pandit Vijay Dubey', '9876543212', 'vijay@example.com', 'Delhi', 'Dwarka', ARRAY['Hindi', 'Sanskrit', 'English'], 12, 'Specializing in Griha Pravesh and Satyanarayan Pooja. Available for corporate events.', false, true),
  ('Shastri Manoj Tiwari', '9876543213', 'manoj@example.com', 'Delhi', 'Rohini', ARRAY['Hindi', 'Sanskrit'], 8, 'Young and dynamic purohit with expertise in traditional rituals with modern approach.', true, true),
  ('Pandit Arvind Joshi', '9876543214', 'arvind@example.com', 'Bangalore', 'Koramangala', ARRAY['Hindi', 'Kannada', 'Sanskrit', 'English'], 25, 'Senior purohit with deep knowledge of all Vedic ceremonies. PhD in Sanskrit.', true, true),
  ('Acharya Prakash Hegde', '9876543215', 'prakash@example.com', 'Bangalore', 'Whitefield', ARRAY['Kannada', 'Sanskrit', 'Telugu'], 18, 'Specializing in South Indian rituals and Rudrabhishek ceremonies.', true, false),
  ('Pandit Gopal Krishna', '9876543216', 'gopal@example.com', 'Pune', 'Kothrud', ARRAY['Hindi', 'Marathi', 'Sanskrit'], 10, 'Expertise in Ganesh Pooja and Lakshmi Pooja. Known for detailed explanations.', true, true),
  ('Shastri Dinesh Pandey', '9876543217', 'dinesh@example.com', 'Mumbai', 'Thane', ARRAY['Hindi', 'Sanskrit', 'Gujarati'], 22, 'Veteran purohit specializing in Shraddh Karma and ancestral rituals.', false, true);

-- Seed data: Clients
INSERT INTO public.clients (full_name, phone, email, city, area, address) VALUES
  ('Rahul Mehta', '9988776655', 'rahul@example.com', 'Mumbai', 'Andheri East', '402, Sunrise Apartments, Lokhandwala'),
  ('Priya Singh', '9988776656', 'priya@example.com', 'Mumbai', 'Borivali', '1201, Green Valley Society'),
  ('Amit Kumar', '9988776657', 'amit@example.com', 'Delhi', 'Dwarka', 'B-42, Sector 12'),
  ('Sneha Rao', '9988776658', 'sneha@example.com', 'Bangalore', 'Koramangala', '15, 3rd Cross, 4th Block'),
  ('Vikram Patel', '9988776659', 'vikram@example.com', 'Pune', 'Kothrud', '23, Prabhat Road');

-- Seed data: Purohit Services (linking purohits to services they offer)
INSERT INTO public.purohit_services (purohit_id, service_id, price_min, price_max)
SELECT p.id, s.id, 
  CASE 
    WHEN s.name = 'Vivah Sanskar' THEN 21000
    WHEN s.name = 'Griha Pravesh' THEN 5100
    ELSE 2100
  END,
  CASE 
    WHEN s.name = 'Vivah Sanskar' THEN 51000
    WHEN s.name = 'Griha Pravesh' THEN 11000
    ELSE 5100
  END
FROM public.purohits p
CROSS JOIN public.pooja_services s
WHERE 
  (p.full_name = 'Pandit Ramesh Sharma' AND s.name IN ('Satyanarayan Pooja', 'Vivah Sanskar', 'Ganesh Pooja', 'Lakshmi Pooja')) OR
  (p.full_name = 'Acharya Suresh Mishra' AND s.name IN ('Navgraha Shanti', 'Kaal Sarp Dosh Nivaran', 'Rudrabhishek')) OR
  (p.full_name = 'Pandit Vijay Dubey' AND s.name IN ('Griha Pravesh', 'Satyanarayan Pooja', 'Ganesh Pooja')) OR
  (p.full_name = 'Shastri Manoj Tiwari' AND s.name IN ('Satyanarayan Pooja', 'Ganesh Pooja', 'Lakshmi Pooja', 'Sunderkand Path')) OR
  (p.full_name = 'Pandit Arvind Joshi' AND s.name IN ('Satyanarayan Pooja', 'Vivah Sanskar', 'Griha Pravesh', 'Rudrabhishek', 'Navgraha Shanti')) OR
  (p.full_name = 'Acharya Prakash Hegde' AND s.name IN ('Rudrabhishek', 'Satyanarayan Pooja', 'Navgraha Shanti')) OR
  (p.full_name = 'Pandit Gopal Krishna' AND s.name IN ('Ganesh Pooja', 'Lakshmi Pooja', 'Satyanarayan Pooja', 'Sunderkand Path')) OR
  (p.full_name = 'Shastri Dinesh Pandey' AND s.name IN ('Shraddh Karma', 'Satyanarayan Pooja', 'Navgraha Shanti'));

-- Seed data: Sample bookings with various statuses and dates
INSERT INTO public.bookings (client_id, purohit_id, service_id, mode, scheduled_at, estimated_duration_minutes, city, area, address, status, notes)
SELECT 
  c.id,
  p.id,
  s.id,
  CASE WHEN p.remote_pooja_available AND random() > 0.5 THEN 'remote'::service_mode ELSE 'in_person'::service_mode END,
  scheduled,
  duration,
  c.city,
  c.area,
  c.address,
  status,
  notes
FROM (
  VALUES 
    ('Rahul Mehta', 'Pandit Ramesh Sharma', 'Satyanarayan Pooja', NOW() + INTERVAL '2 days', 120, 'confirmed'::booking_status, 'Monthly pooja at home'),
    ('Priya Singh', 'Acharya Suresh Mishra', 'Navgraha Shanti', NOW() + INTERVAL '5 days', 180, 'pending'::booking_status, 'Requested specific muhurat'),
    ('Amit Kumar', 'Pandit Vijay Dubey', 'Griha Pravesh', NOW() + INTERVAL '10 days', 240, 'confirmed'::booking_status, 'New house in Sector 12'),
    ('Sneha Rao', 'Pandit Arvind Joshi', 'Rudrabhishek', NOW() - INTERVAL '3 days', 90, 'completed'::booking_status, 'Completed successfully'),
    ('Vikram Patel', 'Pandit Gopal Krishna', 'Ganesh Pooja', NOW() + INTERVAL '1 day', 60, 'confirmed'::booking_status, 'Ganesh Chaturthi celebration'),
    ('Rahul Mehta', 'Pandit Ramesh Sharma', 'Lakshmi Pooja', NOW() - INTERVAL '7 days', 90, 'completed'::booking_status, 'Diwali pooja'),
    ('Priya Singh', 'Shastri Manoj Tiwari', 'Sunderkand Path', NOW() + INTERVAL '15 days', 150, 'pending'::booking_status, 'Family gathering'),
    ('Sneha Rao', 'Acharya Prakash Hegde', 'Rudrabhishek', NOW() + INTERVAL '20 days', 120, 'pending'::booking_status, 'Maha Shivaratri')
) AS seed(client_name, purohit_name, service_name, scheduled, duration, status, notes)
JOIN public.clients c ON c.full_name = seed.client_name
JOIN public.purohits p ON p.full_name = seed.purohit_name
JOIN public.pooja_services s ON s.name = seed.service_name;

-- Seed data: Sample consultations
INSERT INTO public.consultations (client_id, purohit_id, service_id, mode, status)
SELECT c.id, p.id, s.id, 'in_person'::service_mode, status
FROM (
  VALUES
    ('Rahul Mehta', 'Pandit Ramesh Sharma', 'Vivah Sanskar', 'accepted'::consultation_status),
    ('Priya Singh', 'Acharya Suresh Mishra', 'Kaal Sarp Dosh Nivaran', 'requested'::consultation_status),
    ('Amit Kumar', 'Pandit Vijay Dubey', 'Griha Pravesh', 'completed'::consultation_status)
) AS seed(client_name, purohit_name, service_name, status)
JOIN public.clients c ON c.full_name = seed.client_name
JOIN public.purohits p ON p.full_name = seed.purohit_name
JOIN public.pooja_services s ON s.name = seed.service_name;