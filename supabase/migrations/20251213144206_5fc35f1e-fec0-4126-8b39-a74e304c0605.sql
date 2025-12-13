-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Anyone can view purohit listings" ON public.purohits;

-- Create a new policy that requires authentication to view purohit listings
CREATE POLICY "Authenticated users can view purohit listings" 
ON public.purohits 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Also fix the reviews table exposure
DROP POLICY IF EXISTS "Anyone can view reviews" ON public.reviews;

-- Create a new policy that requires authentication to view reviews
CREATE POLICY "Authenticated users can view reviews" 
ON public.reviews 
FOR SELECT 
USING (auth.uid() IS NOT NULL);