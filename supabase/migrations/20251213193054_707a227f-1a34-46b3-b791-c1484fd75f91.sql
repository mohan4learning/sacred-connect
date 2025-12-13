-- Create a function to get average rating for a purohit (accessible to all)
CREATE OR REPLACE FUNCTION public.get_purohit_avg_rating(p_purohit_id uuid)
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(AVG(r.rating)::numeric, 0)
  FROM reviews r
  JOIN bookings b ON r.booking_id = b.id
  WHERE b.purohit_id = p_purohit_id
$$;

-- Create a function to get review count for a purohit (accessible to all)
CREATE OR REPLACE FUNCTION public.get_purohit_review_count(p_purohit_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(COUNT(r.id)::integer, 0)
  FROM reviews r
  JOIN bookings b ON r.booking_id = b.id
  WHERE b.purohit_id = p_purohit_id
$$;