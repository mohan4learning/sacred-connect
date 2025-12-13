
-- Create update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create app_role enum for type safety
CREATE TYPE public.app_role AS ENUM ('admin', 'client', 'purohit');

-- Create profiles table that maps auth.users to roles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Trigger to update updated_at on profiles
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add user_id to clients table
ALTER TABLE public.clients ADD COLUMN user_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Add user_id to purohits table
ALTER TABLE public.purohits ADD COLUMN user_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Add is_verified field for admin approval of purohits
ALTER TABLE public.purohits ADD COLUMN is_verified BOOLEAN DEFAULT false;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND role = _role
  )
$$;

-- Function to get current user's role
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

-- Function to get current user's client_id
CREATE OR REPLACE FUNCTION public.get_my_client_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.clients WHERE user_id = auth.uid()
$$;

-- Function to get current user's purohit_id
CREATE OR REPLACE FUNCTION public.get_my_purohit_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.purohits WHERE user_id = auth.uid()
$$;

-- Profiles RLS policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Allow profile creation during signup"
ON public.profiles FOR INSERT
WITH CHECK (id = auth.uid());

-- Drop existing permissive policies on clients
DROP POLICY IF EXISTS "Public read access" ON public.clients;
DROP POLICY IF EXISTS "Public insert access" ON public.clients;
DROP POLICY IF EXISTS "Public update access" ON public.clients;
DROP POLICY IF EXISTS "Public delete access" ON public.clients;

-- Clients RLS policies
CREATE POLICY "Clients can view their own record"
ON public.clients FOR SELECT
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients can insert their own record"
ON public.clients FOR INSERT
WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients can update their own record"
ON public.clients FOR UPDATE
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Clients can delete their own record"
ON public.clients FOR DELETE
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Drop existing permissive policies on purohits
DROP POLICY IF EXISTS "Public read access" ON public.purohits;
DROP POLICY IF EXISTS "Public insert access" ON public.purohits;
DROP POLICY IF EXISTS "Public update access" ON public.purohits;
DROP POLICY IF EXISTS "Public delete access" ON public.purohits;

-- Purohits RLS policies (allow public read for listings)
CREATE POLICY "Anyone can view purohit listings"
ON public.purohits FOR SELECT
USING (true);

CREATE POLICY "Purohits can insert their own record"
ON public.purohits FOR INSERT
WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Purohits can update their own record"
ON public.purohits FOR UPDATE
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Purohits can delete their own record"
ON public.purohits FOR DELETE
USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- Drop existing permissive policies on bookings
DROP POLICY IF EXISTS "Public read access" ON public.bookings;
DROP POLICY IF EXISTS "Public insert access" ON public.bookings;
DROP POLICY IF EXISTS "Public update access" ON public.bookings;
DROP POLICY IF EXISTS "Public delete access" ON public.bookings;

-- Bookings RLS policies
CREATE POLICY "Users can view their bookings"
ON public.bookings FOR SELECT
USING (
  client_id = public.get_my_client_id() 
  OR purohit_id = public.get_my_purohit_id() 
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can create bookings"
ON public.bookings FOR INSERT
WITH CHECK (
  client_id = public.get_my_client_id() 
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can update their bookings"
ON public.bookings FOR UPDATE
USING (
  client_id = public.get_my_client_id() 
  OR purohit_id = public.get_my_purohit_id() 
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can delete their bookings"
ON public.bookings FOR DELETE
USING (
  client_id = public.get_my_client_id() 
  OR public.has_role(auth.uid(), 'admin')
);

-- Drop existing permissive policies on consultations
DROP POLICY IF EXISTS "Public read access" ON public.consultations;
DROP POLICY IF EXISTS "Public insert access" ON public.consultations;
DROP POLICY IF EXISTS "Public update access" ON public.consultations;
DROP POLICY IF EXISTS "Public delete access" ON public.consultations;

-- Consultations RLS policies
CREATE POLICY "Users can view their consultations"
ON public.consultations FOR SELECT
USING (
  client_id = public.get_my_client_id() 
  OR purohit_id = public.get_my_purohit_id() 
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can create consultations"
ON public.consultations FOR INSERT
WITH CHECK (
  client_id = public.get_my_client_id() 
  OR purohit_id = public.get_my_purohit_id() 
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can update their consultations"
ON public.consultations FOR UPDATE
USING (
  client_id = public.get_my_client_id() 
  OR purohit_id = public.get_my_purohit_id() 
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can delete their consultations"
ON public.consultations FOR DELETE
USING (
  client_id = public.get_my_client_id() 
  OR public.has_role(auth.uid(), 'admin')
);

-- Drop existing permissive policies on consultation_messages
DROP POLICY IF EXISTS "Public read access" ON public.consultation_messages;
DROP POLICY IF EXISTS "Public insert access" ON public.consultation_messages;
DROP POLICY IF EXISTS "Public update access" ON public.consultation_messages;
DROP POLICY IF EXISTS "Public delete access" ON public.consultation_messages;

-- Consultation messages RLS policies
CREATE POLICY "Users can view messages in their consultations"
ON public.consultation_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.consultations c
    WHERE c.id = consultation_id
    AND (c.client_id = public.get_my_client_id() OR c.purohit_id = public.get_my_purohit_id())
  )
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can send messages in their consultations"
ON public.consultation_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.consultations c
    WHERE c.id = consultation_id
    AND (c.client_id = public.get_my_client_id() OR c.purohit_id = public.get_my_purohit_id())
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- Drop existing permissive policies on pooja_requests
DROP POLICY IF EXISTS "Public read access" ON public.pooja_requests;
DROP POLICY IF EXISTS "Public insert access" ON public.pooja_requests;
DROP POLICY IF EXISTS "Public update access" ON public.pooja_requests;
DROP POLICY IF EXISTS "Public delete access" ON public.pooja_requests;

-- Pooja requests RLS policies
CREATE POLICY "Users can view relevant pooja requests"
ON public.pooja_requests FOR SELECT
USING (
  client_id = public.get_my_client_id()
  OR public.get_my_purohit_id() IS NOT NULL
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Clients can create pooja requests"
ON public.pooja_requests FOR INSERT
WITH CHECK (
  client_id = public.get_my_client_id()
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Users can update their pooja requests"
ON public.pooja_requests FOR UPDATE
USING (
  client_id = public.get_my_client_id()
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Clients can delete their pooja requests"
ON public.pooja_requests FOR DELETE
USING (
  client_id = public.get_my_client_id()
  OR public.has_role(auth.uid(), 'admin')
);

-- Drop existing permissive policies on purohit_services
DROP POLICY IF EXISTS "Public read access" ON public.purohit_services;
DROP POLICY IF EXISTS "Public insert access" ON public.purohit_services;
DROP POLICY IF EXISTS "Public update access" ON public.purohit_services;
DROP POLICY IF EXISTS "Public delete access" ON public.purohit_services;

-- Purohit services RLS policies (public read for listings)
CREATE POLICY "Anyone can view purohit services"
ON public.purohit_services FOR SELECT
USING (true);

CREATE POLICY "Purohits can manage their services"
ON public.purohit_services FOR INSERT
WITH CHECK (
  purohit_id = public.get_my_purohit_id()
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Purohits can update their services"
ON public.purohit_services FOR UPDATE
USING (
  purohit_id = public.get_my_purohit_id()
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Purohits can delete their services"
ON public.purohit_services FOR DELETE
USING (
  purohit_id = public.get_my_purohit_id()
  OR public.has_role(auth.uid(), 'admin')
);

-- Drop existing permissive policies on purohit_portfolio_items
DROP POLICY IF EXISTS "Public read access" ON public.purohit_portfolio_items;
DROP POLICY IF EXISTS "Public insert access" ON public.purohit_portfolio_items;
DROP POLICY IF EXISTS "Public update access" ON public.purohit_portfolio_items;
DROP POLICY IF EXISTS "Public delete access" ON public.purohit_portfolio_items;

-- Portfolio items RLS policies (public read for listings)
CREATE POLICY "Anyone can view portfolio items"
ON public.purohit_portfolio_items FOR SELECT
USING (true);

CREATE POLICY "Purohits can manage their portfolio"
ON public.purohit_portfolio_items FOR INSERT
WITH CHECK (
  purohit_id = public.get_my_purohit_id()
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Purohits can update their portfolio"
ON public.purohit_portfolio_items FOR UPDATE
USING (
  purohit_id = public.get_my_purohit_id()
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Purohits can delete their portfolio items"
ON public.purohit_portfolio_items FOR DELETE
USING (
  purohit_id = public.get_my_purohit_id()
  OR public.has_role(auth.uid(), 'admin')
);

-- Drop existing permissive policies on purohit_availability_blocks
DROP POLICY IF EXISTS "Public read access" ON public.purohit_availability_blocks;
DROP POLICY IF EXISTS "Public insert access" ON public.purohit_availability_blocks;
DROP POLICY IF EXISTS "Public update access" ON public.purohit_availability_blocks;
DROP POLICY IF EXISTS "Public delete access" ON public.purohit_availability_blocks;

-- Availability blocks RLS policies
CREATE POLICY "Anyone can view availability blocks"
ON public.purohit_availability_blocks FOR SELECT
USING (true);

CREATE POLICY "Purohits can manage their availability"
ON public.purohit_availability_blocks FOR INSERT
WITH CHECK (
  purohit_id = public.get_my_purohit_id()
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Purohits can update their availability"
ON public.purohit_availability_blocks FOR UPDATE
USING (
  purohit_id = public.get_my_purohit_id()
  OR public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Purohits can delete their availability blocks"
ON public.purohit_availability_blocks FOR DELETE
USING (
  purohit_id = public.get_my_purohit_id()
  OR public.has_role(auth.uid(), 'admin')
);

-- Drop existing permissive policies on reviews
DROP POLICY IF EXISTS "Public read access" ON public.reviews;
DROP POLICY IF EXISTS "Public insert access" ON public.reviews;
DROP POLICY IF EXISTS "Public update access" ON public.reviews;
DROP POLICY IF EXISTS "Public delete access" ON public.reviews;

-- Reviews RLS policies
CREATE POLICY "Anyone can view reviews"
ON public.reviews FOR SELECT
USING (true);

CREATE POLICY "Users can create reviews for their bookings"
ON public.reviews FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = booking_id
    AND (b.client_id = public.get_my_client_id() OR b.purohit_id = public.get_my_purohit_id())
  )
  OR public.has_role(auth.uid(), 'admin')
);

-- Drop existing permissive policies on pooja_services
DROP POLICY IF EXISTS "Public read access" ON public.pooja_services;
DROP POLICY IF EXISTS "Public insert access" ON public.pooja_services;
DROP POLICY IF EXISTS "Public update access" ON public.pooja_services;
DROP POLICY IF EXISTS "Public delete access" ON public.pooja_services;

-- Pooja services RLS policies (public read, admin write)
CREATE POLICY "Anyone can view pooja services"
ON public.pooja_services FOR SELECT
USING (true);

CREATE POLICY "Only admin can insert pooja services"
ON public.pooja_services FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admin can update pooja services"
ON public.pooja_services FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admin can delete pooja services"
ON public.pooja_services FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));
